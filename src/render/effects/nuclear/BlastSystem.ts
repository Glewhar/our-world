// One THREE.Points mesh + one ShaderMaterial shared across up to
// MAX_CONCURRENT_BLASTS concurrent nuclear blasts. Replaces a pool of
// per-blast NuclearExplosion instances with a single draw call:
//   - One BufferGeometry with attributes sized `MAX_CONCURRENT_BLASTS * maxN`.
//   - 12 BlastSlot records own per-blast state (particles, splines,
//     wind, quaternion, world origin, per-strike scale).
//   - Each slot writes its own contiguous range [s*maxN, (s+1)*maxN).
//   - Live + detonate tuning is system-wide; per-strike state is per-slot.
//
// Performance contract:
//   - All particle pools, index/distance scratch, and attribute arrays
//     are allocated once in the constructor. The per-frame update path
//     does zero allocations.
//   - The depth sort is a near-sorted insertion sort over indices
//     keyed on precomputed distance; first frame uses Array.sort to
//     seed a valid order.
//   - Dead-tail bytes of an active slot are still uploaded (size=0)
//     so they render as zero-area points; addUpdateRange keeps the
//     upload bounded to the slot's range, not the whole buffer.
//
// Frame conventions:
//   - Particle physics is computed in slot-local space (the demo's
//     +Y-up frame). The buffer write transforms each particle to
//     world space via: localPos × (perStrikeScale × liveScale) →
//     rotated by slot.quaternion → + slot.worldOrigin.
//   - All scaling lives in the position + size attributes; the
//     pointMultiplier uniform is pure (viewportHeight / 2tan(fov/2)).
//     This is required because 12 slots share one material — there is
//     no per-slot uniform path to gl_PointSize.

import * as THREE from 'three';

import type { ColourKeyframe, ParticleTypeConfig } from './particleTypes.js';
import type {
  NuclearDetonateTuning,
  NuclearLiveTuning,
  NuclearScenarioConfig,
} from '../../../world/scenarios/handlers/NuclearScenario.config.js';

const PARTICLE_VERTEX_SHADER = `
uniform float pointMultiplier;

in float size;
in float angle;
in float blend;
in vec4 colour;
in int type;

out vec4 vColour;
out vec2 vAngle;
out float vBlend;
flat out int vType;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = size * pointMultiplier / gl_Position.w;

  vAngle = vec2(cos(angle), sin(angle));
  vColour = colour;
  vBlend = blend;
  vType = type;
}
`;

const PARTICLE_FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D u_texturez[3];

in vec4 vColour;
in vec2 vAngle;
in float vBlend;
flat in int vType;

out vec4 out_FragColor;

void main() {
  vec2 coords = (gl_PointCoord - 0.5) * mat2(vAngle.x, vAngle.y, -vAngle.y, vAngle.x) + 0.5;

  vec4 sampled = vec4(0.0);
  if (vType == 0 || vType == 4 || vType == 5) {
    sampled = texture(u_texturez[0], coords);
  } else if (vType == 1 || vType == 3 || vType == 6) {
    sampled = texture(u_texturez[1], coords);
  } else if (vType == 2) {
    sampled = texture(u_texturez[2], coords);
  }

  vec4 col = sampled * vColour;
  col.rgb *= col.a;
  col.a *= vBlend;
  out_FragColor = col;
}
`;

// Planet reference radius. Matches the Globe convention (unit sphere).
const PLANET_RADIUS = 1.0;

type Particle = {
  particleType: number;
  alpha: number;
  blend: number;
  colour: THREE.Color;
  velocity: THREE.Vector3;
  position: THREE.Vector3;
  originalPosition: THREE.Vector3;
  size: number;
  currentSize: number;
  life: number;
  maxLife: number;
  rotation: number;
  rotationModifier: number;
  windJitter: number;
  windVelocity: THREE.Vector3;
};

class LinearSpline<T> {
  private readonly _points: Array<[number, T]> = [];
  constructor(private readonly _lerp: (t: number, a: T, b: T) => T) {}

  addPoint(t: number, d: T): void {
    this._points.push([t, d]);
  }

  get(t: number): T {
    let p1 = 0;
    for (let i = 0; i < this._points.length && this._points[i]![0] < t; i++) {
      p1 = i;
    }
    const p2 = Math.min(this._points.length - 1, p1 + 1);
    if (p1 === p2) return this._points[p1]![1];
    const range = this._points[p2]![0] - this._points[p1]![0];
    const local = range === 0 ? 0 : (t - this._points[p1]![0]) / range;
    return this._lerp(local, this._points[p1]![1], this._points[p2]![1]);
  }
}

type Splines = {
  alpha: LinearSpline<number>;
  speed: LinearSpline<number>;
  size: LinearSpline<number>;
  height?: LinearSpline<number>;
  colour: LinearSpline<THREE.Color>;
};

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// Quantized per-strike scale used to break up the "every explosion looks
// identical" feel. 5 buckets between 0.85 and 1.15 — coarse on purpose so
// the spline cache picks them up as a finite set of variants instead of
// rebuilding curves on every strike.
const JITTER_BUCKETS = 5;
const JITTER_RANGE = 0.3;
function pickJitter(): number {
  const step = Math.floor(Math.random() * JITTER_BUCKETS);
  const t = step / (JITTER_BUCKETS - 1);
  return 1 - JITTER_RANGE / 2 + t * JITTER_RANGE;
}

function makeNumberSpline(): LinearSpline<number> {
  return new LinearSpline<number>((t, a, b) => a + t * (b - a));
}

function makeColourSpline(): LinearSpline<THREE.Color> {
  return new LinearSpline<THREE.Color>((t, a, b) => a.clone().lerp(b, t));
}

function buildSplines(cfg: ParticleTypeConfig): Splines {
  const out: Splines = {
    alpha: makeNumberSpline(),
    speed: makeNumberSpline(),
    size: makeNumberSpline(),
    colour: makeColourSpline(),
  };
  for (let i = 0; i < cfg.spleens.alpha.length; i++) {
    out.alpha.addPoint(cfg.intervals[i]!, cfg.maxValues.alpha * cfg.spleens.alpha[i]!);
  }
  for (let i = 0; i < cfg.spleens.speed.length; i++) {
    out.speed.addPoint(cfg.intervals[i]!, cfg.maxValues.speed * cfg.spleens.speed[i]!);
  }
  for (let i = 0; i < cfg.spleens.size.length; i++) {
    out.size.addPoint(cfg.intervals[i]!, cfg.maxValues.size * cfg.spleens.size[i]!);
  }
  if (cfg.spleens.height && cfg.maxValues.height !== undefined) {
    out.height = makeNumberSpline();
    for (let i = 0; i < cfg.spleens.height.length; i++) {
      out.height.addPoint(
        cfg.intervals[i]!,
        cfg.maxValues.height * cfg.spleens.height[i]!,
      );
    }
  }
  for (let i = 0; i < cfg.spleens.colour.length; i++) {
    const kf: ColourKeyframe = cfg.spleens.colour[i]!;
    const colour = new THREE.Color(i === 0 ? cfg.startColour : cfg.endColour);
    out.colour.addPoint(kf.interval, colour);
  }
  return out;
}

type BlastSlot = {
  running: boolean;
  particleCount: number;
  particles: Particle[];
  splinesByType: Map<number, Splines>;
  windLocal: THREE.Vector3;
  blastTime: number;
  perStrikeScale: number;
  quaternion: THREE.Quaternion;
  worldOrigin: THREE.Vector3;
  indices: Uint16Array;
  distSq: Float32Array;
  sortInitialised: boolean;
};

/**
 * PERF TUNABLE — max simultaneous blasts in one draw call.
 * Sizes the shared geometry to `MAX_CONCURRENT_BLASTS × Σ(particleType.count)`.
 * Raise = more concurrent mushrooms visible during a Nuclear War; every
 * extra slot adds Σ(counts) particles to the per-frame vertex shader cost
 * even when idle (size attribute is 0, but the vertex stage still runs).
 * Lower = strikes evict each other earlier when the war front is dense.
 */
export const MAX_CONCURRENT_BLASTS = 24;

/**
 * PERF TUNABLE — far-side cull threshold.
 * In `update()`, a slot is skipped when `worldOrigin · camera.position`
 * is below this value. Zero is the geometric terminator (blast exactly
 * on the horizon plane). Negative = lenient (keep blasts that are just
 * past the horizon; mushroom plumes can still poke above the rim).
 * Positive = aggressive (cull blasts that are still slightly front-facing).
 * Units are `worldOrigin.length × camera.position.length`, so this scales
 * with camera distance from the planet.
 */
const FAR_SIDE_CULL_DOT = 0;

/**
 * PERF TUNABLE — detonate budget per frame.
 * Defensive cap on how many `detonateAt` calls actually spawn a new blast
 * per render frame. Excess calls are dropped silently (the kill-zone scar
 * is painted by the scenario handler, not this system, so the wasteland is
 * unaffected). During a Nuclear War with all `MAX_CONCURRENT_BLASTS` slots
 * busy, each extra detonate evicts the lowest-particle slot and re-runs
 * `_initSlot` — initialising 784 particles. Splines are cached by tuning
 * hash and reused, so per-detonate cost is the particle init plus an
 * attribute-buffer rewrite, not a fresh spline bake. Capping at 4/frame
 * holds the worst-case init cost to ~3 ms even in a peak war front.
 */
const DETONATE_BUDGET_PER_FRAME = 4;

export class BlastSystem {
  readonly mesh: THREE.Points;

  private readonly _camera: THREE.PerspectiveCamera;
  private readonly _profile: NuclearScenarioConfig;
  private readonly _material: THREE.ShaderMaterial;
  private readonly _geometry: THREE.BufferGeometry;
  private readonly _textures: THREE.Texture[];
  private readonly _slots: BlastSlot[];
  private readonly _maxN: number;

  // Shared attribute scratch — single source of truth for the GPU upload.
  private readonly _posArr: Float32Array;
  private readonly _sizeArr: Float32Array;
  private readonly _colArr: Float32Array;
  private readonly _angleArr: Float32Array;
  private readonly _blendArr: Float32Array;
  private readonly _typeArr: Int32Array;

  private readonly _posAttr: THREE.BufferAttribute;
  private readonly _sizeAttr: THREE.BufferAttribute;
  private readonly _colAttr: THREE.BufferAttribute;
  private readonly _angleAttr: THREE.BufferAttribute;
  private readonly _blendAttr: THREE.BufferAttribute;
  private readonly _typeAttr: THREE.BufferAttribute;

  // Scratch vectors / matrices — allocated once.
  private readonly _tmpVec = new THREE.Vector3();
  private readonly _tmpCam = new THREE.Vector3();
  private readonly _tmpDrag = new THREE.Vector3();
  private readonly _tmpVel = new THREE.Vector3();
  private readonly _tmpInvQuat = new THREE.Quaternion();

  // Per-frame detonate counter — reset at the top of each `update()`,
  // incremented in `detonateAt()`. Caps the burst spawn rate.
  private _detonatesThisFrame = 0;

  // Shared tuning.
  private _viewportHeight =
    typeof window !== 'undefined' ? window.innerHeight : 1080;
  private _liveScale: number;
  private _timeScale: number;
  private _spriteScale: number;
  private _windStrength: number;
  private _windDelay: number;
  private _windRamp: number;
  private _windJitter: number;
  private _windDrag: number;
  private _detonateTuning: NuclearDetonateTuning;
  // Built splines are pure functions of (particle type, post-tuning maxValues,
  // post-tuning colours). Tuning is discrete (Tweakpane sliders / hex pickers)
  // and the static curves never change at runtime, so the same tuning hash
  // produces byte-identical splines. We cache by that hash to avoid rebuilding
  // — and re-allocating LinearSplines + THREE.Color keyframes — on every
  // detonate. Splines are read-only after construction (LinearSpline.get
  // returns a fresh clone for colours) so concurrent slots can share entries.
  private readonly _splinesCache = new Map<string, Splines>();

  constructor(camera: THREE.PerspectiveCamera, profile: NuclearScenarioConfig) {
    this._camera = camera;
    this._profile = profile;
    this._liveScale = profile.live.worldScale;
    this._timeScale = profile.live.timeScale;
    this._spriteScale = profile.live.spriteScale;
    this._windStrength = profile.live.windStrength;
    this._windDelay = profile.live.windDelay;
    this._windRamp = Math.max(0.001, profile.live.windRamp);
    this._windJitter = Math.max(0, Math.min(1, profile.live.windJitter));
    this._windDrag = Math.max(0, Math.min(10, profile.live.windDrag));
    this._detonateTuning = profile.detonate;

    // Max particles per slot uses the FULL particleTypes list, not the
    // enabled subset — detonate-time toggling in _applyDetonateTuning can
    // re-enable any type, and the buffer must always have a home for it.
    let maxN = 0;
    for (const cfg of profile.particleTypes) maxN += cfg.count;
    this._maxN = maxN;

    const totalVerts = MAX_CONCURRENT_BLASTS * maxN;

    const loader = new THREE.TextureLoader();
    this._textures = [
      loader.load(new URL('./sprites/fire_desat.png', import.meta.url).href),
      loader.load(new URL('./sprites/smoke_blur.png', import.meta.url).href),
      loader.load(new URL('./sprites/debris.png', import.meta.url).href),
    ];

    // Pure point multiplier — liveScale and perStrikeScale are baked into
    // the size attribute per particle instead, because 12 slots share one
    // material and gl_PointSize cannot read a per-slot uniform.
    const initialHeight =
      typeof window !== 'undefined' ? window.innerHeight : 1080;
    const pointMultiplier =
      initialHeight / (2 * Math.tan((camera.fov * Math.PI) / 360));

    this._material = new THREE.ShaderMaterial({
      uniforms: {
        u_texturez: { value: this._textures },
        pointMultiplier: { value: pointMultiplier },
      },
      vertexShader: PARTICLE_VERTEX_SHADER,
      fragmentShader: PARTICLE_FRAGMENT_SHADER,
      glslVersion: THREE.GLSL3,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      depthTest: true,
      depthWrite: false,
      transparent: true,
      vertexColors: true,
    });

    this._posArr = new Float32Array(totalVerts * 3);
    this._sizeArr = new Float32Array(totalVerts);
    this._colArr = new Float32Array(totalVerts * 4);
    this._angleArr = new Float32Array(totalVerts);
    this._blendArr = new Float32Array(totalVerts);
    this._typeArr = new Int32Array(totalVerts);

    // Use BufferAttribute directly — the typed convenience classes
    // (Float32BufferAttribute / Int32BufferAttribute) call `new Float32Array(array)`
    // in their constructor, which COPIES the input. That would leave our
    // per-frame writes targeting a Float32Array disconnected from the GPU
    // buffer, producing zero-sized invisible points.
    this._posAttr = new THREE.BufferAttribute(this._posArr, 3);
    this._sizeAttr = new THREE.BufferAttribute(this._sizeArr, 1);
    this._colAttr = new THREE.BufferAttribute(this._colArr, 4);
    this._angleAttr = new THREE.BufferAttribute(this._angleArr, 1);
    this._blendAttr = new THREE.BufferAttribute(this._blendArr, 1);
    this._typeAttr = new THREE.BufferAttribute(this._typeArr, 1);
    this._posAttr.setUsage(THREE.DynamicDrawUsage);
    this._sizeAttr.setUsage(THREE.DynamicDrawUsage);
    this._colAttr.setUsage(THREE.DynamicDrawUsage);
    this._angleAttr.setUsage(THREE.DynamicDrawUsage);
    this._blendAttr.setUsage(THREE.DynamicDrawUsage);
    this._typeAttr.setUsage(THREE.DynamicDrawUsage);

    this._geometry = new THREE.BufferGeometry();
    this._geometry.setAttribute('position', this._posAttr);
    this._geometry.setAttribute('size', this._sizeAttr);
    this._geometry.setAttribute('colour', this._colAttr);
    this._geometry.setAttribute('angle', this._angleAttr);
    this._geometry.setAttribute('blend', this._blendAttr);
    this._geometry.setAttribute('type', this._typeAttr);
    this._geometry.setDrawRange(0, totalVerts);
    // Worldspace positions; never frustum-cull (a fireball might extend past
    // the bounding sphere centroid).
    this._geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);

    this.mesh = new THREE.Points(this._geometry, this._material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 2;

    this._slots = [];
    for (let i = 0; i < MAX_CONCURRENT_BLASTS; i++) {
      const particles: Particle[] = new Array(maxN);
      for (let j = 0; j < maxN; j++) {
        particles[j] = {
          particleType: 0,
          alpha: 0,
          blend: 0,
          colour: new THREE.Color(0xffffff),
          velocity: new THREE.Vector3(),
          position: new THREE.Vector3(),
          originalPosition: new THREE.Vector3(),
          size: 0,
          currentSize: 0,
          life: 0,
          maxLife: 0,
          rotation: 0,
          rotationModifier: 0,
          windJitter: 0,
          windVelocity: new THREE.Vector3(),
        };
      }
      this._slots.push({
        running: false,
        particleCount: 0,
        particles,
        splinesByType: new Map(),
        windLocal: new THREE.Vector3(),
        blastTime: 0,
        perStrikeScale: 1,
        quaternion: new THREE.Quaternion(),
        worldOrigin: new THREE.Vector3(),
        indices: new Uint16Array(maxN),
        distSq: new Float32Array(maxN),
        sortInitialised: false,
      });
    }
  }

  setViewportHeight(heightPx: number): void {
    this._viewportHeight = heightPx;
    this._material.uniforms.pointMultiplier!.value =
      heightPx / (2 * Math.tan((this._camera.fov * Math.PI) / 360));
  }

  setLiveTuning(t: NuclearLiveTuning): void {
    this._liveScale = t.worldScale;
    this._timeScale = t.timeScale;
    this._spriteScale = t.spriteScale;
    this._windStrength = t.windStrength;
    this._windDelay = t.windDelay;
    this._windRamp = Math.max(0.001, t.windRamp);
    this._windJitter = Math.max(0, Math.min(1, t.windJitter));
    this._windDrag = Math.max(0, Math.min(10, t.windDrag));
  }

  setDetonateTuning(t: NuclearDetonateTuning): void {
    this._detonateTuning = t;
  }

  /**
   * Spawn a new blast. Picks the first idle slot; falls back to the slot
   * with the fewest live particles so the visible disruption is minimised.
   * `radius` is on the unit sphere (1.0 + elevation×scale).
   *
   * Per-frame budget: drops the call if more than `DETONATE_BUDGET_PER_FRAME`
   * blasts have already spawned since the last `update()`. The wasteland
   * kill-zone scar is painted by the scenario handler — not here — so a
   * dropped visual does NOT skip the kill zone. Worst case the user sees
   * fewer simultaneous mushroom clouds than strikes hit the map during a
   * 70-strike opening volley.
   */
  detonateAt(
    direction: THREE.Vector3,
    radius: number,
    wind: { u: number; v: number } | null,
    sizeKm: number,
  ): void {
    if (this._detonatesThisFrame >= DETONATE_BUDGET_PER_FRAME) return;
    let slotIdx = -1;
    for (let i = 0; i < this._slots.length; i++) {
      if (!this._slots[i]!.running) {
        slotIdx = i;
        break;
      }
    }
    if (slotIdx < 0) {
      let lowest = Infinity;
      for (let i = 0; i < this._slots.length; i++) {
        const c = this._slots[i]!.particleCount;
        if (c < lowest) {
          lowest = c;
          slotIdx = i;
        }
      }
    }
    if (slotIdx < 0) return;
    this._initSlot(slotIdx, direction, radius, wind, sizeKm);
    this._detonatesThisFrame++;
  }

  update(deltaSec: number): void {
    // Per-frame detonate budget resets at the top of each update. `update`
    // is called once per render frame from scene-graph, so this is the
    // natural boundary for "this frame".
    this._detonatesThisFrame = 0;
    for (let s = 0; s < this._slots.length; s++) {
      const slot = this._slots[s]!;
      if (!slot.running) continue;
      // Back-face cull: if the blast origin sits on the far hemisphere
      // from the camera, the globe depth-kills every fragment and the
      // per-particle physics/sort/write is wasted CPU. Skip the slot —
      // buffer keeps last-known state, so the slot resumes cleanly when
      // it rotates back into view. Threshold lives in FAR_SIDE_CULL_DOT
      // at the top of this file.
      if (slot.worldOrigin.dot(this._camera.position) < FAR_SIDE_CULL_DOT) continue;
      const dt = deltaSec * this._timeScale;
      slot.blastTime += dt;
      this._updateParticles(slot, dt);
      this._sortSlot(slot);
      this._writeSlot(s, slot);
      if (slot.particleCount === 0) {
        slot.running = false;
      }
    }
  }

  dispose(): void {
    this._geometry.dispose();
    this._material.dispose();
    for (const tex of this._textures) tex.dispose();
  }

  // ── Internals ──────────────────────────────────────────────────────────

  private _initSlot(
    s: number,
    direction: THREE.Vector3,
    radius: number,
    wind: { u: number; v: number } | null,
    sizeKm: number,
  ): void {
    const slot = this._slots[s]!;
    const refKm = this._profile.visuals.referenceRadiusKm;
    slot.perStrikeScale = Math.max(0.05, sizeKm / refKm);

    const dir = this._tmpVec.copy(direction).normalize();
    slot.worldOrigin.copy(dir).multiplyScalar(radius);
    slot.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

    // Project world-frame wind (east·u + north·v) into the slot's local
    // frame. Stored once — the local basis doesn't move after detonate.
    if (wind && (wind.u !== 0 || wind.v !== 0)) {
      const latRad = Math.asin(Math.max(-1, Math.min(1, dir.z)));
      const lonRad = Math.atan2(dir.y, dir.x);
      const sinLat = Math.sin(latRad);
      const cosLat = Math.cos(latRad);
      const sinLon = Math.sin(lonRad);
      const cosLon = Math.cos(lonRad);
      const east = new THREE.Vector3(-sinLon, cosLon, 0);
      const north = new THREE.Vector3(-sinLat * cosLon, -sinLat * sinLon, cosLat);
      const worldDrift = east.multiplyScalar(wind.u).addScaledVector(north, wind.v);
      this._tmpInvQuat.copy(slot.quaternion).invert();
      slot.windLocal.copy(worldDrift).applyQuaternion(this._tmpInvQuat);
    } else {
      slot.windLocal.set(0, 0, 0);
    }

    slot.blastTime = 0;
    slot.particleCount = 0;

    // Per-strike variety. Each detonate rolls three quantized random scales
    // (height, size, speed) so two strikes with identical tuning still feel
    // distinct — one mushroom rises taller, another spreads wider. Buckets
    // are coarse (5 steps over ±15%) so the spline cache still hits a finite
    // set: 5³ = 125 lifetime-curve variants per particle type max.
    const heightMul = pickJitter();
    const sizeMul = pickJitter();
    const speedMul = pickJitter();

    // Re-bake splines using the current detonate tuning. Looked up by a
    // hash of every cfg field buildSplines reads — same tuning + same
    // jitter bucket → cache hit, no allocation.
    slot.splinesByType.clear();
    for (const baseCfg of this._profile.particleTypes) {
      const cfg = this._applyDetonateTuning(baseCfg, heightMul, sizeMul, speedMul);
      if (!cfg.enabled) continue;
      slot.splinesByType.set(cfg.particleType, this._getSplines(cfg));
      for (let i = 0; i < cfg.count; i++) {
        this._initParticle(slot.particles[slot.particleCount]!, cfg);
        slot.particleCount++;
      }
    }

    slot.sortInitialised = false;
    slot.running = true;
  }

  private _initParticle(p: Particle, cfg: ParticleTypeConfig): void {
    const radiusModifier = cfg.radiusModifier;
    const dirX = (Math.random() - 0.5) * radiusModifier;
    const dirY = Math.random() - 0.5;
    const dirZ = (Math.random() - 0.5) * radiusModifier;
    const dirLen = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ) || 1;
    const radius = randomBetween(cfg.minRadius, cfg.maxRadius);
    const k = radius / dirLen;
    const xz_x = dirX * k;
    // dirY-component scaled but unused below (vertical particles override velocity)
    const xz_z = dirZ * k;
    const radiusPerc =
      cfg.maxRadius === cfg.minRadius
        ? 1
        : (cfg.maxRadius - radius) / (cfg.maxRadius - cfg.minRadius);

    const minSize = cfg.minSize ?? 0;
    const maxSize = cfg.maxSize ?? 1;
    const rawSize = randomBetween(minSize, maxSize) * cfg.sizeMod;
    const initialSize = cfg.growingOnly
      ? cfg.sizeMod * (1 - radiusPerc)
      : cfg.dynamicSize
        ? rawSize * (radiusPerc + (cfg.radiusMod ?? 0))
        : rawSize;
    const spriteScale = this._profile.visuals.spriteSizeScale;

    const life = randomBetween(cfg.lifeTime.minLife, cfg.lifeTime.maxLife);
    const startPosY = randomBetween(cfg.minHeight ?? 0, cfg.maxHeight ?? 0.5);

    p.particleType = cfg.particleType;
    p.alpha = cfg.alpha;
    p.blend = cfg.blend;
    p.colour.setRGB(1, 1, 1);
    if (cfg.vertical) {
      p.velocity.set(0, 1, 0);
    } else {
      p.velocity.set(xz_x, 0, xz_z);
    }
    p.position.set(0, startPosY, 0);
    p.originalPosition.copy(p.position);
    p.size = initialSize * spriteScale;
    p.currentSize = p.size;
    p.life = life;
    p.maxLife = life;
    p.rotation = 2 * Math.random() * Math.PI;
    p.rotationModifier = randomBetween(-1, 1);
    p.windJitter = Math.random();
    p.windVelocity.set(0, 0, 0);
  }

  private _getSplines(cfg: ParticleTypeConfig): Splines {
    const mv = cfg.maxValues;
    const key =
      cfg.name +
      '|' +
      cfg.startColour +
      '|' +
      cfg.endColour +
      '|' +
      mv.alpha +
      '|' +
      mv.speed +
      '|' +
      mv.size +
      '|' +
      (mv.height ?? 'n');
    let s = this._splinesCache.get(key);
    if (s === undefined) {
      s = buildSplines(cfg);
      this._splinesCache.set(key, s);
    }
    return s;
  }

  private _applyDetonateTuning(
    base: ParticleTypeConfig,
    heightMul: number,
    sizeMul: number,
    speedMul: number,
  ): ParticleTypeConfig {
    const t = this._detonateTuning;
    const enabled = t.enables[base.name] ?? base.enabled;

    let startColour = base.startColour;
    let endColour = base.endColour;
    if (base.name === 'fire' || base.name === 'mushroomFire' || base.name === 'columnFire') {
      startColour = t.fireColorStart;
      endColour = t.fireColorEnd;
    } else if (base.name === 'smoke' || base.name === 'mushroom' || base.name === 'columnSmoke') {
      startColour = t.smokeColorStart;
      endColour = t.smokeColorEnd;
    }

    const mv = base.maxValues;
    let heightScale = 1;
    if (base.name === 'mushroom' || base.name === 'mushroomFire') {
      heightScale = t.mushroomHeightScale;
    } else if (base.name === 'columnFire' || base.name === 'columnSmoke') {
      heightScale = t.columnHeightScale;
    }
    const maxValues = {
      ...mv,
      size: mv.size * sizeMul,
      speed: mv.speed * speedMul,
      ...(mv.height !== undefined
        ? { height: mv.height * heightScale * heightMul }
        : {}),
    };

    return { ...base, enabled, startColour, endColour, maxValues };
  }

  private _updateParticles(slot: BlastSlot, deltaSec: number): void {
    // Decrement life and prune dead via swap-remove of pool slot references.
    for (let i = 0; i < slot.particleCount; ) {
      const p = slot.particles[i]!;
      p.life -= deltaSec;
      if (p.life <= 0) {
        const last = slot.particleCount - 1;
        if (i !== last) {
          slot.particles[i] = slot.particles[last]!;
          slot.particles[last] = p;
        }
        slot.particleCount--;
      } else {
        i++;
      }
    }

    const windActive =
      this._windStrength !== 0 &&
      (slot.windLocal.x !== 0 || slot.windLocal.y !== 0 || slot.windLocal.z !== 0);
    const elapsedAfterDelay = slot.blastTime - this._windDelay;
    const jitterSpan = this._windRamp * this._windJitter;
    const windRef = this._profile.visuals.windRefHeight;
    // Slot-local Y of planet center. The slot's local +Y aligns with the
    // outward radial at impact; the planet center sits at -PLANET_RADIUS in
    // the un-scaled local frame, then divided by liveScale because the
    // group's effective scale was the legacy frame's `liveScale`. Here we
    // don't have a group transform — the local frame is just the demo's
    // frame, and the planet center reference must match the original math.
    const planetCenterLocalY = -PLANET_RADIUS / this._liveScale;

    for (let i = 0; i < slot.particleCount; i++) {
      const p = slot.particles[i]!;
      const t = 1 - p.life / p.maxLife;
      const splines = slot.splinesByType.get(p.particleType)!;
      const timeDilate = splines.speed.get(t);
      p.alpha = splines.alpha.get(t);
      p.currentSize = p.size * splines.size.get(t);
      p.colour.copy(splines.colour.get(t));
      const targetAltitudeLocal =
        p.originalPosition.y + (splines.height ? splines.height.get(t) : 0);
      if (splines.height) {
        p.position.y = p.originalPosition.y + splines.height.get(t);
      }

      const dt = deltaSec * timeDilate;
      p.rotation += dt * p.rotationModifier;

      this._tmpVel.copy(p.velocity).multiplyScalar(dt);
      p.position.add(this._tmpVel);

      if (windActive && elapsedAfterDelay > 0) {
        const elapsedForParticle = elapsedAfterDelay - p.windJitter * jitterSpan;
        if (elapsedForParticle > 0) {
          const linear = Math.min(1, elapsedForParticle / this._windRamp);
          const blastRamp = linear * linear * (3 - 2 * linear);
          const heightNorm = Math.max(0, Math.min(1, targetAltitudeLocal / windRef));
          const heightFactor = 0.3 + 0.7 * heightNorm;
          const accel = this._windStrength * heightFactor * blastRamp * deltaSec;
          p.windVelocity.x += slot.windLocal.x * accel;
          p.windVelocity.y += slot.windLocal.y * accel;
          p.windVelocity.z += slot.windLocal.z * accel;
        }
      }

      const windDamp = Math.max(0, 1 - this._windDrag * deltaSec);
      p.windVelocity.multiplyScalar(windDamp);

      p.position.x += p.windVelocity.x * deltaSec;
      p.position.y += p.windVelocity.y * deltaSec;
      p.position.z += p.windVelocity.z * deltaSec;

      // Curvature correction: pin to sphere of radius (planet + altitude).
      const targetRadialLocal = -planetCenterLocalY + targetAltitudeLocal;
      if (targetRadialLocal > 0) {
        const dx = p.position.x;
        const dy = p.position.y - planetCenterLocalY;
        const dz = p.position.z;
        const currentRadialSq = dx * dx + dy * dy + dz * dz;
        if (currentRadialSq > 1e-9) {
          const kk = targetRadialLocal / Math.sqrt(currentRadialSq);
          p.position.x = dx * kk;
          p.position.y = dy * kk + planetCenterLocalY;
          p.position.z = dz * kk;
        }
      }

      this._tmpDrag.copy(p.velocity).multiplyScalar(0.1 * dt);
      this._tmpDrag.x =
        Math.sign(p.velocity.x) * Math.min(Math.abs(this._tmpDrag.x), Math.abs(p.velocity.x));
      this._tmpDrag.y =
        Math.sign(p.velocity.y) * Math.min(Math.abs(this._tmpDrag.y), Math.abs(p.velocity.y));
      this._tmpDrag.z =
        Math.sign(p.velocity.z) * Math.min(Math.abs(this._tmpDrag.z), Math.abs(p.velocity.z));
      p.velocity.sub(this._tmpDrag);
    }
  }

  private _sortSlot(slot: BlastSlot): void {
    const n = slot.particleCount;
    if (n === 0) return;

    // Camera in slot-local frame: (camera - origin) rotated by inverse
    // quaternion. Distance is in scaled-local units — fine for ordering
    // within this slot, which is all per-slot sort needs.
    this._tmpCam.copy(this._camera.position).sub(slot.worldOrigin);
    this._tmpInvQuat.copy(slot.quaternion).invert();
    this._tmpCam.applyQuaternion(this._tmpInvQuat);
    const scale = slot.perStrikeScale * this._liveScale;
    if (scale > 1e-9) this._tmpCam.multiplyScalar(1 / scale);

    const cx = this._tmpCam.x;
    const cy = this._tmpCam.y;
    const cz = this._tmpCam.z;
    const dist = slot.distSq;
    const idx = slot.indices;

    for (let i = 0; i < n; i++) {
      const p = slot.particles[i]!;
      const dx = p.position.x - cx;
      const dy = p.position.y - cy;
      const dz = p.position.z - cz;
      dist[i] = dx * dx + dy * dy + dz * dz;
    }

    // Swap-remove reordered the pool, so the index array is stale every
    // frame. Cheapest correct path: identity-fill then sort.
    for (let i = 0; i < n; i++) idx[i] = i;

    if (!slot.sortInitialised) {
      // First sort is on random data — O(n²) insertion sort would spike.
      // Seed with Array.sort once; subsequent frames use the near-sorted
      // insertion sort.
      const tmp = Array.from(idx.subarray(0, n));
      tmp.sort((a, b) => dist[b]! - dist[a]!);
      for (let i = 0; i < n; i++) idx[i] = tmp[i]!;
      slot.sortInitialised = true;
    } else {
      for (let i = 1; i < n; i++) {
        const cur = idx[i]!;
        const k = dist[cur]!;
        let j = i - 1;
        while (j >= 0 && dist[idx[j]!]! < k) {
          idx[j + 1] = idx[j]!;
          j--;
        }
        idx[j + 1] = cur;
      }
    }
  }

  private _writeSlot(s: number, slot: BlastSlot): void {
    const baseVertex = s * this._maxN;
    const n = slot.particleCount;
    const pos = this._posArr;
    const sz = this._sizeArr;
    const col = this._colArr;
    const ang = this._angleArr;
    const bl = this._blendArr;
    const tp = this._typeArr;
    const idx = slot.indices;
    const scale = slot.perStrikeScale * this._liveScale;
    const spriteFactor = this._spriteScale * scale;
    const ox = slot.worldOrigin.x;
    const oy = slot.worldOrigin.y;
    const oz = slot.worldOrigin.z;
    const qx = slot.quaternion.x;
    const qy = slot.quaternion.y;
    const qz = slot.quaternion.z;
    const qw = slot.quaternion.w;

    for (let i = 0; i < n; i++) {
      const p = slot.particles[idx[i]!]!;
      // Inline (localPos × scale) → applyQuaternion → + worldOrigin.
      // Avoids per-particle Vector3 allocation. Quaternion-rotate uses the
      // standard t = 2(q.xyz × v); v' = v + qw·t + (q.xyz × t) form (matches
      // THREE.Vector3.applyQuaternion).
      const lx = p.position.x * scale;
      const ly = p.position.y * scale;
      const lz = p.position.z * scale;
      const tx = 2 * (qy * lz - qz * ly);
      const ty = 2 * (qz * lx - qx * lz);
      const tz = 2 * (qx * ly - qy * lx);
      const wx = lx + qw * tx + qy * tz - qz * ty;
      const wy = ly + qw * ty + qz * tx - qx * tz;
      const wz = lz + qw * tz + qx * ty - qy * tx;
      const o = (baseVertex + i) * 3;
      pos[o] = wx + ox;
      pos[o + 1] = wy + oy;
      pos[o + 2] = wz + oz;
      sz[baseVertex + i] = p.currentSize * spriteFactor;
      const c = (baseVertex + i) * 4;
      col[c] = p.colour.r;
      col[c + 1] = p.colour.g;
      col[c + 2] = p.colour.b;
      col[c + 3] = p.alpha;
      ang[baseVertex + i] = p.rotation;
      bl[baseVertex + i] = p.blend;
      tp[baseVertex + i] = p.particleType;
    }

    // Zero the dead tail of this slot's range so dead particles don't paint.
    for (let i = n; i < this._maxN; i++) {
      sz[baseVertex + i] = 0;
    }

    // Upload only this slot's range. Without addUpdateRange Three.js would
    // re-upload the whole MAX_CONCURRENT_BLASTS × maxN buffer each frame; with it, the
    // per-blast cost stays bounded to a slot's worth of bytes. Three.js
    // auto-clears updateRanges after upload (WebGLAttributes.updateBuffer
    // line 143), so each slot only *adds* ranges — never clears, otherwise
    // earlier slots' ranges this frame would be dropped.
    const sizeRangeStart = baseVertex;
    const sizeRangeCount = this._maxN; // include zeroed tail
    const posRangeStart = baseVertex * 3;
    const posRangeCount = n * 3;
    const colRangeStart = baseVertex * 4;
    const colRangeCount = n * 4;
    const scalarRangeStart = baseVertex;
    const scalarRangeCount = n;
    if (posRangeCount > 0) this._posAttr.addUpdateRange(posRangeStart, posRangeCount);
    this._sizeAttr.addUpdateRange(sizeRangeStart, sizeRangeCount);
    if (colRangeCount > 0) this._colAttr.addUpdateRange(colRangeStart, colRangeCount);
    if (scalarRangeCount > 0) {
      this._angleAttr.addUpdateRange(scalarRangeStart, scalarRangeCount);
      this._blendAttr.addUpdateRange(scalarRangeStart, scalarRangeCount);
      this._typeAttr.addUpdateRange(scalarRangeStart, scalarRangeCount);
    }
    this._posAttr.needsUpdate = true;
    this._sizeAttr.needsUpdate = true;
    this._colAttr.needsUpdate = true;
    this._angleAttr.needsUpdate = true;
    this._blendAttr.needsUpdate = true;
    this._typeAttr.needsUpdate = true;
  }
}

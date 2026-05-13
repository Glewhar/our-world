// Self-contained nuclear-explosion particle system, ported from the
// nuke-theta demo (bundle.pretty.js:19780–19909). One THREE.Points mesh
// + one ShaderMaterial + JS-side particle state.
//
// Frame conventions:
//   - The Group's *local* frame is the demo's frame: local +Y is "up
//     (away from ground)". Ground-spread particles fan out in the local
//     XZ plane; vertical columns rise along local +Y.
//   - `detonate(direction)` rotates this local frame so local +Y aligns
//     with the outward radial direction at the impact point on the unit
//     globe. The shader math is unchanged — the orientation is the only
//     thing that distinguishes "off a flat plane" from "off the planet
//     surface".

import * as THREE from 'three';

import {
  PARTICLE_FRAGMENT_SHADER,
  PARTICLE_VERTEX_SHADER,
} from './shaders.js';
import {
  PARTICLES_TO_GENERATE,
  type ColourKeyframe,
  type ParticleTypeConfig,
} from './particleTypes.js';

// The demo uses SIZE_SCALE = SIZE_MOD / 14 with SIZE_MOD default 6, i.e.
// 0.4286. Times an additional scene-level scale on the points host.
// The demo's scene is roughly tens-of-units across. On our unit globe
// (radius = 1), 0.02 covered the whole planet; the city-scale look
// lives ~15× smaller.
const SIZE_SCALE = 6 / 14;
const EXPLOSION_WORLD_SCALE = 0.015;
const PLANET_RADIUS = 1.0;

// Camera FOV in the host scene. PerspectiveCamera(45°) in scene-graph.ts.
// `pointMultiplier` is the demo's screen-pixel scale factor, derived
// from the projection so that a particle's `size` attribute is roughly
// pixel-equivalent.
const CAMERA_FOV_DEG = 45;

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
  // Random 0..1 jitter — multiplied by 30% of wind ramp at use time so the
  // wind front softens (particles don't all start drifting on the same frame).
  windJitter: number;
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

export type NuclearDetonateTuning = {
  enables: Record<string, boolean>;
  mushroomHeightScale: number;
  columnHeightScale: number;
  fireColorStart: number;
  fireColorEnd: number;
  smokeColorStart: number;
  smokeColorEnd: number;
};

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
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

export class NuclearExplosion {
  readonly group: THREE.Group;

  private readonly _camera: THREE.PerspectiveCamera;
  private readonly _material: THREE.ShaderMaterial;
  private readonly _geometry: THREE.BufferGeometry;
  private readonly _points: THREE.Points;
  private readonly _textures: THREE.Texture[];
  private readonly _splinesByType: Map<number, Splines>;
  private _particles: Particle[] = [];
  private _running = false;
  private readonly _tmpCameraLocal = new THREE.Vector3();
  private readonly _tmpDrag = new THREE.Vector3();
  private readonly _tmpVel = new THREE.Vector3();
  private readonly _tmpWind = new THREE.Vector3();
  private _viewportHeight =
    typeof window !== 'undefined' ? window.innerHeight : 1080;
  private _liveScale = EXPLOSION_WORLD_SCALE;
  private _timeScale = 1;
  private _spriteScale = 1;
  private _windStrength = 0;
  private _windDelay = 0;
  private _windRamp = 1;
  private _windJitter = 0.3;
  private _windLocal = new THREE.Vector3(0, 0, 0);
  // Elapsed blast-time (deltaSec × timeScale) since detonate. Used to gate
  // wind drift: it's in the same time domain as the particle splines, so
  // halving `timeScale` doubles the real-time delay automatically.
  private _blastTime = 0;
  private _detonateTuning: NuclearDetonateTuning | null = null;

  constructor(camera: THREE.PerspectiveCamera) {
    this._camera = camera;

    const loader = new THREE.TextureLoader();
    this._textures = [
      loader.load(new URL('./sprites/fire_desat.png', import.meta.url).href),
      loader.load(new URL('./sprites/smoke_blur.png', import.meta.url).href),
      loader.load(new URL('./sprites/debris.png', import.meta.url).href),
    ];

    // Initial point multiplier guess; updated via setViewportHeight().
    // We bake EXPLOSION_WORLD_SCALE in here because gl_PointSize doesn't
    // go through the model matrix — group.scale shrinks particle positions
    // but sprite pixel sizes stay raw unless we compensate here. Without
    // this, particles cluster tightly but sprites stay huge, making the
    // whole blast collapse into one undifferentiated blob with no
    // mushroom structure visible.
    const initialHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
    const pointMultiplier =
      (initialHeight / (2 * Math.tan((CAMERA_FOV_DEG * Math.PI) / 360))) *
      EXPLOSION_WORLD_SCALE;

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

    this._geometry = new THREE.BufferGeometry();
    this._geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
    this._geometry.setAttribute('size', new THREE.Float32BufferAttribute([], 1));
    this._geometry.setAttribute('colour', new THREE.Float32BufferAttribute([], 4));
    this._geometry.setAttribute('angle', new THREE.Float32BufferAttribute([], 1));
    this._geometry.setAttribute('blend', new THREE.Float32BufferAttribute([], 1));
    this._geometry.setAttribute('type', new THREE.Int32BufferAttribute([], 1));

    this._points = new THREE.Points(this._geometry, this._material);
    this._points.frustumCulled = false;
    // Draw after the atmosphere shell (renderOrder=1) so the blue rim haze
    // doesn't paint over the fireball at glancing angles.
    this._points.renderOrder = 2;

    this.group = new THREE.Group();
    this.group.add(this._points);
    this.group.scale.setScalar(EXPLOSION_WORLD_SCALE);

    this._splinesByType = new Map();
    for (const cfg of PARTICLES_TO_GENERATE) {
      this._splinesByType.set(cfg.particleType, buildSplines(cfg));
    }
  }

  // Called once per resize so `gl_PointSize` stays in screen pixels.
  // EXPLOSION_WORLD_SCALE is folded in for the same reason as the
  // constructor — sprite size must scale with position scale to keep
  // the mushroom-vs-fireball proportions intact.
  setViewportHeight(heightPx: number): void {
    this._viewportHeight = heightPx;
    this._updatePointMultiplier();
  }

  setLiveTuning(t: {
    worldScale: number;
    timeScale: number;
    spriteScale: number;
    windStrength: number;
    windDelay: number;
    windRamp: number;
    windJitter: number;
  }): void {
    this._timeScale = t.timeScale;
    this._spriteScale = t.spriteScale;
    this._windStrength = t.windStrength;
    this._windDelay = t.windDelay;
    // Guard against zero ramp — that would divide-by-zero inside the ramp
    // calc; treat sub-millisecond ramps as instantaneous (ramp = full once
    // the delay clears).
    this._windRamp = Math.max(0.001, t.windRamp);
    this._windJitter = Math.max(0, Math.min(1, t.windJitter));
    if (t.worldScale !== this._liveScale) {
      this._liveScale = t.worldScale;
      this.group.scale.setScalar(t.worldScale);
      this._updatePointMultiplier();
    }
  }

  setDetonateTuning(t: NuclearDetonateTuning): void {
    this._detonateTuning = t;
  }

  private _updatePointMultiplier(): void {
    const pm =
      (this._viewportHeight / (2 * Math.tan((CAMERA_FOV_DEG * Math.PI) / 360))) *
      this._liveScale;
    this._material.uniforms.pointMultiplier!.value = pm;
  }

  detonate(
    direction: THREE.Vector3,
    radius: number = PLANET_RADIUS,
    wind: { u: number; v: number } | null = null,
  ): void {
    const dir = direction.clone().normalize();
    this.group.position.copy(dir).multiplyScalar(radius);
    this.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    this.group.updateMatrixWorld(true);

    // Project the world-frame wind vector (east·u + north·v on a Z-up
    // sphere) into the explosion's local frame so per-frame drift can be
    // added straight to local particle positions. Stored once at detonate
    // time — the local basis doesn't move after that.
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
      const invQ = this.group.quaternion.clone().invert();
      this._windLocal.copy(worldDrift).applyQuaternion(invQ);
    } else {
      this._windLocal.set(0, 0, 0);
    }

    this._blastTime = 0;
    this._reset();
    this._running = true;
  }

  update(deltaSec: number): void {
    if (!this._running) return;
    const dt = deltaSec * this._timeScale;
    this._blastTime += dt;
    this._updateParticles(dt);
    this._updateGeometry();
    if (this._particles.length === 0) {
      this._running = false;
    }
  }

  dispose(): void {
    this._geometry.dispose();
    this._material.dispose();
    for (const tex of this._textures) tex.dispose();
  }

  private _reset(): void {
    this._particles = [];
    for (const baseCfg of PARTICLES_TO_GENERATE) {
      const cfg = this._applyDetonateTuning(baseCfg);
      if (!cfg.enabled) continue;
      // Rebuild splines per type — colour / maxValues may have been overridden.
      this._splinesByType.set(cfg.particleType, buildSplines(cfg));
      for (let i = 0; i < cfg.count; i++) {
        this._particles.push(this._createParticle(cfg));
      }
    }
  }

  private _applyDetonateTuning(base: ParticleTypeConfig): ParticleTypeConfig {
    const t = this._detonateTuning;
    if (!t) return base;

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

    let maxValues = base.maxValues;
    if (base.name === 'mushroom' || base.name === 'mushroomFire') {
      if (maxValues.height !== undefined) {
        maxValues = { ...maxValues, height: maxValues.height * t.mushroomHeightScale };
      }
    } else if (base.name === 'columnFire' || base.name === 'columnSmoke') {
      if (maxValues.height !== undefined) {
        maxValues = { ...maxValues, height: maxValues.height * t.columnHeightScale };
      }
    }

    return { ...base, enabled, startColour, endColour, maxValues };
  }

  private _createParticle(cfg: ParticleTypeConfig): Particle {
    // Random outward direction in the XZ plane (mod by radiusModifier so
    // some types can squish their spread anisotropically).
    const dir = new THREE.Vector3(
      (Math.random() - 0.5) * cfg.radiusModifier,
      Math.random() - 0.5,
      (Math.random() - 0.5) * cfg.radiusModifier,
    ).normalize();
    const radius = randomBetween(cfg.minRadius, cfg.maxRadius);
    const radiusPerc =
      cfg.maxRadius === cfg.minRadius ? 1 : (cfg.maxRadius - radius) / (cfg.maxRadius - cfg.minRadius);

    dir.multiplyScalar(radius);
    const xz_x = dir.x;
    const xz_z = dir.z;

    const minSize = cfg.minSize ?? 0;
    const maxSize = cfg.maxSize ?? 1;
    const rawSize = randomBetween(minSize, maxSize) * cfg.sizeMod;
    const initialSize = cfg.growingOnly
      ? cfg.sizeMod * (1 - radiusPerc)
      : cfg.dynamicSize
      ? rawSize * (radiusPerc + (cfg.radiusMod ?? 0))
      : rawSize;

    const life = randomBetween(cfg.lifeTime.minLife, cfg.lifeTime.maxLife);
    const startPosY = randomBetween(cfg.minHeight ?? 0, cfg.maxHeight ?? 0.5);
    const startPos = new THREE.Vector3(0, startPosY, 0);
    const velocity = cfg.vertical
      ? new THREE.Vector3(0, 1, 0)
      : new THREE.Vector3(xz_x, 0, xz_z);

    return {
      particleType: cfg.particleType,
      alpha: cfg.alpha,
      blend: cfg.blend,
      colour: new THREE.Color(0xffffff),
      velocity,
      position: startPos,
      originalPosition: startPos.clone(),
      size: initialSize * SIZE_SCALE,
      currentSize: initialSize * SIZE_SCALE,
      life,
      maxLife: life,
      rotation: 2 * Math.random() * Math.PI,
      rotationModifier: randomBetween(-1, 1),
      windJitter: Math.random(),
    };
  }

  private _updateParticles(deltaSec: number): void {
    // Decrement life and prune dead particles.
    for (const p of this._particles) p.life -= deltaSec;
    this._particles = this._particles.filter((p) => p.life > 0);

    // Wind drift is gated on a global blast clock so it kicks in at the
    // same in-blast moment regardless of `timeScale`. The delay is in
    // blast-seconds (already scaled by timeScale via `_blastTime`); after
    // the delay clears, we ramp in linearly over `_windRamp` blast-seconds.
    // Height factor uses the mushroom's natural Y span (~16) as the
    // reference so the ground fan barely moves and the cap drifts fully.
    const windActive =
      this._windStrength !== 0 &&
      (this._windLocal.x !== 0 || this._windLocal.y !== 0 || this._windLocal.z !== 0);
    const elapsedAfterDelay = this._blastTime - this._windDelay;
    // Per-particle jitter spreads the start of wind over a fraction of the
    // ramp so the cloud front softens instead of all particles starting on
    // the same frame. Fraction is live-tunable (0..1).
    const jitterSpan = this._windRamp * this._windJitter;
    const windRef = 16;
    // Local-frame Y of the planet center. The group sits at world distance
    // PLANET_RADIUS from origin with local +Y aligned to the outward radial,
    // so the planet center is at local (0, -R/scale, 0). Used to re-pin
    // wind-drifted particles to their current altitude above the sphere
    // instead of letting them slide off into the tangent plane.
    const planetCenterLocalY = -PLANET_RADIUS / this._liveScale;

    for (const p of this._particles) {
      const t = 1 - p.life / p.maxLife;
      const splines = this._splinesByType.get(p.particleType)!;
      const timeDilate = splines.speed.get(t);
      p.alpha = splines.alpha.get(t);
      p.currentSize = p.size * splines.size.get(t);
      p.colour.copy(splines.colour.get(t));
      if (splines.height) {
        p.position.y = p.originalPosition.y + splines.height.get(t);
      }

      const dt = deltaSec * timeDilate;
      p.rotation += dt * p.rotationModifier;

      this._tmpVel.copy(p.velocity).multiplyScalar(dt);
      p.position.add(this._tmpVel);

      if (windActive && elapsedAfterDelay > 0) {
        // Per-particle delay: jitter shifts each particle's effective start
        // by 0..30% of the ramp. Smoothstep ease-in (t² × (3 − 2t)) on top
        // so velocity doesn't snap at the end.
        const elapsedForParticle = elapsedAfterDelay - p.windJitter * jitterSpan;
        if (elapsedForParticle > 0) {
          const linear = Math.min(1, elapsedForParticle / this._windRamp);
          const blastRamp = linear * linear * (3 - 2 * linear);
          // Universal floor (0.3) + height bonus (0.7) so ground-level smoke
          // and fire drift too — not just the mushroom cap. Cap still gets
          // full wind because its y reaches the windRef height.
          const heightNorm = Math.max(0, Math.min(1, p.position.y / windRef));
          const heightFactor = 0.3 + 0.7 * heightNorm;
          const scale = deltaSec * this._windStrength * heightFactor * blastRamp;
          this._tmpWind.copy(this._windLocal).multiplyScalar(scale);

          // Curvature correction (Option C): snapshot the particle's
          // distance from planet center before wind, drift in the tangent
          // plane, then rescale the offset-from-center vector back to the
          // original length. Net effect: lateral motion is preserved but
          // the particle hugs the sphere instead of flying off tangentially.
          const dxB = p.position.x;
          const dyB = p.position.y - planetCenterLocalY;
          const dzB = p.position.z;
          const radialBeforeSq = dxB * dxB + dyB * dyB + dzB * dzB;

          p.position.add(this._tmpWind);

          const dxA = p.position.x;
          const dyA = p.position.y - planetCenterLocalY;
          const dzA = p.position.z;
          const radialAfterSq = dxA * dxA + dyA * dyA + dzA * dzA;
          if (radialAfterSq > 1e-9) {
            const k = Math.sqrt(radialBeforeSq / radialAfterSq);
            p.position.x = dxA * k;
            p.position.y = dyA * k + planetCenterLocalY;
            p.position.z = dzA * k;
          }
        }
      }

      // Drag: subtract 10% × dt of velocity, clamped so it never reverses sign.
      this._tmpDrag.copy(p.velocity).multiplyScalar(0.1 * dt);
      this._tmpDrag.x =
        Math.sign(p.velocity.x) * Math.min(Math.abs(this._tmpDrag.x), Math.abs(p.velocity.x));
      this._tmpDrag.y =
        Math.sign(p.velocity.y) * Math.min(Math.abs(this._tmpDrag.y), Math.abs(p.velocity.y));
      this._tmpDrag.z =
        Math.sign(p.velocity.z) * Math.min(Math.abs(this._tmpDrag.z), Math.abs(p.velocity.z));
      p.velocity.sub(this._tmpDrag);
    }

    // Back-to-front sort against the camera (in this group's local space)
    // for stable transparency. The demo sorts in world space, but with
    // CustomBlending(OneFactor, OneMinusSrcAlpha) the order matters for
    // the smoke layer's straight-alpha contribution.
    this._tmpCameraLocal.copy(this._camera.position);
    this._points.worldToLocal(this._tmpCameraLocal);
    this._particles.sort((a, b) => {
      const da = this._tmpCameraLocal.distanceToSquared(a.position);
      const db = this._tmpCameraLocal.distanceToSquared(b.position);
      return db - da;
    });
  }

  private _updateGeometry(): void {
    const n = this._particles.length;
    const positions = new Float32Array(n * 3);
    const sizes = new Float32Array(n);
    const colours = new Float32Array(n * 4);
    const angles = new Float32Array(n);
    const blends = new Float32Array(n);
    const types = new Int32Array(n);

    for (let i = 0; i < n; i++) {
      const p = this._particles[i]!;
      positions[i * 3 + 0] = p.position.x;
      positions[i * 3 + 1] = p.position.y;
      positions[i * 3 + 2] = p.position.z;
      sizes[i] = p.currentSize * this._spriteScale;
      colours[i * 4 + 0] = p.colour.r;
      colours[i * 4 + 1] = p.colour.g;
      colours[i * 4 + 2] = p.colour.b;
      colours[i * 4 + 3] = p.alpha;
      angles[i] = p.rotation;
      blends[i] = p.blend;
      types[i] = p.particleType;
    }

    this._geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this._geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    this._geometry.setAttribute('colour', new THREE.Float32BufferAttribute(colours, 4));
    this._geometry.setAttribute('angle', new THREE.Float32BufferAttribute(angles, 1));
    this._geometry.setAttribute('blend', new THREE.Float32BufferAttribute(blends, 1));
    this._geometry.setAttribute('type', new THREE.Int32BufferAttribute(types, 1));
  }
}

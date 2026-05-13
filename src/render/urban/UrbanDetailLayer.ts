/**
 * UrbanDetailLayer — near-LOD procedural streets + buildings for a single
 * active city.
 *
 * Tracks the camera-closest city; when the camera is inside `t_near`, the
 * city's detail mesh is built CPU-side (synchronously, < ~30 ms for
 * 4000 buildings) and rendered as one instanced-box `InstancedMesh` plus
 * a flat street ribbon overlay. When the camera leaves range the mesh is
 * torn down and a new city can move in.
 *
 * Determinism: every random choice is fed by a `Pcg32` seeded by
 * `(city.id, BUILD_VERSION)`. Re-running the renderer for the same city
 * produces byte-identical buildings.
 *
 * Population density: the GHS-POP raster bake (Phase 2 in the plan) was
 * deferred; this layer falls back to a per-city heuristic — denser /
 * taller buildings near the polygon centroid, falling off radially —
 * scaled by the city's `pop` so a megacity shows skyscrapers and a
 * mid-tier city shows mostly low-rise. When GHS-POP later lands, swap
 * `sampleDensity()` for a real raster lookup; no other code changes.
 */

import * as THREE from 'three';

import { source as healpixGlsl } from '../globe/shaders/healpix.glsl.js';
import { DEFAULT_ELEVATION_SCALE } from '../globe/LandMaterial.js';

const BUILDINGS_VERT = `// Buildings vertex shader — urban detail layer.
//
// Each instance is a unit-box (1×1×1) with base at z=0. We scale it by
// the per-instance footprint (width × depth × height) in metres, rotate
// it slightly around the tangent-up axis, place it at aLocalXY in the
// city's tangent km frame, then map the whole thing to a position on
// the globe surface using the per-city tangent basis uniforms.
//
// The healpix.glsl helper is concatenated before this source by
// UrbanDetailLayer — even though we don't use HEALPix lookups here, the
// concat keeps the surrounding code parallel with CitiesLayer.

precision highp float;
precision highp int;

uniform vec3 uCityCentre;     // unit-sphere position
uniform vec3 uTangentX;       // world-space tangent axis (east-ish), unit
uniform vec3 uTangentY;       // world-space tangent axis (north-ish), unit
uniform float uRadialBase;    // 1 + (elevation-fade + bias) in unit-sphere units
uniform float uElevationScale;
uniform float uMetresPerUnit; // EARTH_RADIUS_M

// position (unit cube vertex, base at z=0) and normal are auto-declared
// by three.js for GLSL3 ShaderMaterial — do NOT redeclare them here, or
// the vertex shader fails to compile with "redeclaration of 'position'".
in vec2 aLocalXY;             // per-instance tangent-frame (x, y) in km
in vec3 aSize;                // per-instance (width_m, depth_m, height_m)
in float aRotation;           // per-instance rotation (radians, around tangent normal)

out vec3 vWorldPos;
out vec3 vWorldNormal;
out vec3 vSurfaceNormal;
out float vHeightNorm;        // normalised height for shading variation

void main() {
  vHeightNorm = position.z; // [0, 1] along the box height — base 0, top 1

  // 1) Scale unit cube to (w, d, h) metres.
  vec3 sized = vec3(position.x * aSize.x, position.y * aSize.y, position.z * aSize.z);
  // 2) Rotate around local tangent-up (z-axis in the tangent frame).
  float ca = cos(aRotation);
  float sa = sin(aRotation);
  vec3 rotated = vec3(sized.x * ca - sized.y * sa, sized.x * sa + sized.y * ca, sized.z);
  // 3) Translate within the tangent plane by aLocalXY (km → m).
  vec2 offsetM = aLocalXY * 1000.0 + rotated.xy;
  float heightM = rotated.z;

  // 4) Convert metres back to unit-sphere units. The tangent vectors are
  //    unit length in world-space, which is the same as unit-sphere.
  float offsetUnitX = offsetM.x / uMetresPerUnit;
  float offsetUnitY = offsetM.y / uMetresPerUnit;
  float heightUnit = (heightM * uElevationScale) / 1.0;
  // Note: uElevationScale is "unit per metre" (matches land mesh's
  // displacement convention). Multiplying once is correct.

  // 5) Place: city centre lifted to uRadialBase, then offset along
  //    the two tangent axes, then radially out by heightUnit.
  vec3 surface = uCityCentre * uRadialBase
               + uTangentX * offsetUnitX
               + uTangentY * offsetUnitY;
  // surface normal at this point ≈ uCityCentre (planar approximation
  // for a < 100 km patch — angular spread is < 1°).
  vSurfaceNormal = normalize(uCityCentre);
  vec3 worldPos = surface + vSurfaceNormal * heightUnit;
  vWorldPos = worldPos;

  // Transform the box's local-frame normal back into world space. The
  // local axes are (uTangentX, uTangentY, vSurfaceNormal); rotation only
  // happens in the (x, y) plane, so rotate the planar component.
  float nx = normal.x * ca - normal.y * sa;
  float ny = normal.x * sa + normal.y * ca;
  vec3 nWorld = uTangentX * nx + uTangentY * ny + vSurfaceNormal * normal.z;
  vWorldNormal = normalize(nWorld);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPos, 1.0);
}
`;

const BUILDINGS_FRAG = `// Buildings fragment shader — flat lambert + small height-driven
// brightness lift so taller buildings catch a touch more light at the
// top. No texture maps. Day/night wrap computed per-fragment from
// dot(surfaceNormal, sun) to match the rest of the globe layers.

precision highp float;

in vec3 vWorldPos;
in vec3 vWorldNormal;
in vec3 vSurfaceNormal;
in float vHeightNorm;

uniform vec3 uSunDirection;
uniform float uOpacity;

out vec4 fragColor;

void main() {
  vec3 N = normalize(vWorldNormal);
  vec3 L = normalize(uSunDirection);
  float ndotl = max(0.0, dot(N, L));

  // Base palette — light grey concrete, lifted slightly toward the top.
  vec3 base = mix(vec3(0.42, 0.41, 0.38), vec3(0.62, 0.6, 0.55), vHeightNorm * 0.6);
  float lit = 0.25 + 0.85 * ndotl;
  vec3 dayCol = base * lit;

  // Night palette — dim warm window glow biased toward the upper half.
  // Windows on the underside (the box's z=0 face) read as dark roofs.
  float topMask = smoothstep(0.05, 0.4, vHeightNorm);
  vec3 nightCol = mix(vec3(0.07, 0.07, 0.09), vec3(1.0, 0.85, 0.55) * 0.55, topMask * 0.6);

  // Day/night terminator: same smoothstep window the cities + land
  // shaders use, against the city's surface normal (planar approximation
  // for a < 100 km patch).
  float wrap = smoothstep(-0.05, 0.15, dot(vSurfaceNormal, L));
  vec3 col = mix(nightCol, dayCol, wrap);
  fragColor = vec4(col, uOpacity);
}
`;

const STREETS_VERT = `// Streets vertex shader — flat-on-tangent-plane ribbon.
//
// Each input vertex is an (x, y) in the city's tangent km frame. The
// per-city basis uniforms place the quad on the globe surface; a tiny
// radial bias lifts it just above the land mesh so the depth test
// prefers streets over the ground without z-fighting.

precision highp float;

uniform vec3 uCityCentre;
uniform vec3 uTangentX;
uniform vec3 uTangentY;
uniform float uRadialBase;
uniform float uMetresPerUnit;
uniform float uElevationScale; // unused — kept symmetric with buildings

in vec2 aLocalXY;     // km in tangent frame
in vec2 aStreetUV;    // 0..1 within the cell

out vec2 vUV;
out vec3 vSurfaceNormal;

void main() {
  vUV = aStreetUV;
  vSurfaceNormal = normalize(uCityCentre);
  float ox = (aLocalXY.x * 1000.0) / uMetresPerUnit;
  float oy = (aLocalXY.y * 1000.0) / uMetresPerUnit;
  vec3 surface = uCityCentre * uRadialBase
               + uTangentX * ox
               + uTangentY * oy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(surface, 1.0);
}
`;

const STREETS_FRAG = `// Streets fragment shader — dark asphalt by day, thin warm trace by night.

precision highp float;

in vec2 vUV;
in vec3 vSurfaceNormal;

uniform vec3 uSunDirection;
uniform float uOpacity;

out vec4 fragColor;

void main() {
  // Centre core: brighter near the cell midline.
  vec2 d = abs(vUV - 0.5);
  float core = 1.0 - smoothstep(0.18, 0.42, max(d.x, d.y));

  vec3 day = mix(vec3(0.18, 0.18, 0.19), vec3(0.32, 0.32, 0.33), core);
  vec3 night = mix(vec3(0.04, 0.04, 0.05), vec3(0.55, 0.45, 0.3), core);

  float wrap = smoothstep(-0.05, 0.15, dot(vSurfaceNormal, normalize(uSunDirection)));
  vec3 col = mix(night, day, wrap);

  // Cell-edge fade so adjacent street cells blend rather than reading
  // as a grid of squares.
  float alphaEdge = 1.0 - smoothstep(0.4, 0.5, max(d.x, d.y));
  fragColor = vec4(col, alphaEdge * uOpacity * 0.85);
}
`;
import { ATLAS_WIDTH, type AtlasInstanceMeta, buildPolygonAtlas, pointInPolygon } from './PolygonAtlas.js';
import { Pcg32 } from '../util/pcg32.js';
import { tangentBasisAt } from '../../world/coordinates.js';
import type { UrbanAreaRecord, WorldRuntime } from '../../world/index.js';

const EARTH_RADIUS_KM = 6371;
const BUILD_VERSION = 1; // bump to invalidate cached city builds

/**
 * Inside-mask resolution. 128×128 over the polygon's bounding box gives
 * ~50–500 m cells depending on city size (Manhattan ~70 m/cell, Tokyo
 * ~250 m/cell). Each cell either hosts a small cluster of buildings or
 * is consumed by a street.
 */
const MASK_SIZE = 128;

/** Street grid period in metres, chosen from the seed per-city. */
const STREET_PERIOD_M_MIN = 100;
const STREET_PERIOD_M_MAX = 220;

/** Per-cell building budget. 1–3 buildings inside each non-street cell. */
const BUILDINGS_PER_CELL_MIN = 1;
const BUILDINGS_PER_CELL_MAX = 3;

/** Total per-city building cap — protects render budget at the most extreme polygons. */
const MAX_BUILDINGS_PER_CITY = 6000;

/** Height envelope in metres. */
const BASE_HEIGHT_M = 8;
const MAX_HEIGHT_M = 220;
const HEIGHT_POWER = 4; // long-tail exponent for skyscraper rarity

const BIG_CITY_POP = 8_000_000; // controls how much of MAX_HEIGHT_M unlocks

export type UrbanDetailUniforms = {
  uSunDirection: { value: THREE.Vector3 };

  uCityCentre: { value: THREE.Vector3 };
  uTangentX: { value: THREE.Vector3 };
  uTangentY: { value: THREE.Vector3 };
  uRadialBase: { value: number };
  uElevationScale: { value: number };
  uMetresPerUnit: { value: number };

  uOpacity: { value: number };
};

type CityBuild = {
  cityId: number;
  buildingsMesh: THREE.InstancedMesh;
  streetsMesh: THREE.Mesh;
  meta: AtlasInstanceMeta;
};

export class UrbanDetailLayer {
  readonly group: THREE.Group;
  private readonly bldMaterial: THREE.ShaderMaterial;
  private readonly strMaterial: THREE.ShaderMaterial;
  private readonly buildingGeometry: THREE.BoxGeometry;

  readonly bldUniforms: UrbanDetailUniforms;
  readonly strUniforms: UrbanDetailUniforms;

  private readonly polyMeta: AtlasInstanceMeta[];
  private readonly buildCache = new Map<number, CityBuild>();
  private active: CityBuild | null = null;
  private layerVisible = true;
  private opacity = 1.0;

  /** km — if the closest city centroid is closer than this, build it. */
  static readonly ENGAGE_DISTANCE_KM = 800;
  /** km — once the closest city is farther than this, drop the build. */
  static readonly DISENGAGE_DISTANCE_KM = 1100;

  constructor(_world: WorldRuntime, urbanAreas: readonly UrbanAreaRecord[]) {
    this.group = new THREE.Group();
    this.group.renderOrder = 1;

    // Build the polygon atlas once (CPU-side; no GPU texture needed here —
    // we sample CPU-side for inside-masks). It also gives us the per-city
    // tangent basis and half-extent.
    const atlas = buildPolygonAtlas(urbanAreas);
    this.polyMeta = atlas.meta;
    // Free the GPU texture immediately — only the metadata is needed
    // (this layer uses CPU-side PIP, not the shader-side atlas).
    atlas.texture.dispose();

    this.bldUniforms = makeUniforms();
    this.strUniforms = makeUniforms();

    this.bldMaterial = new THREE.ShaderMaterial({
      uniforms: this.bldUniforms as unknown as { [u: string]: THREE.IUniform },
      glslVersion: THREE.GLSL3,
      vertexShader: `${healpixGlsl}\n${BUILDINGS_VERT}`,
      fragmentShader: BUILDINGS_FRAG,
      transparent: false,
      depthWrite: true,
    });

    this.strMaterial = new THREE.ShaderMaterial({
      uniforms: this.strUniforms as unknown as { [u: string]: THREE.IUniform },
      glslVersion: THREE.GLSL3,
      vertexShader: STREETS_VERT,
      fragmentShader: STREETS_FRAG,
      transparent: true,
      depthWrite: false,
    });

    // Unit box centred on origin with size (1, 1, 1). The vertex shader
    // scales by per-instance footprint × height and lifts in Z (radial).
    this.buildingGeometry = new THREE.BoxGeometry(1, 1, 1);
    // Move geometry so the base sits at z=0 instead of z=-0.5. That way
    // the vertex shader's height extrusion grows OUT from the ground.
    this.buildingGeometry.translate(0, 0, 0.5);
  }

  setSunDirection(dir: THREE.Vector3): void {
    this.bldUniforms.uSunDirection.value.copy(dir);
    this.strUniforms.uSunDirection.value.copy(dir);
  }

  setElevationScale(v: number): void {
    this.bldUniforms.uElevationScale.value = v;
    this.strUniforms.uElevationScale.value = v;
  }

  setOpacity(v: number): void {
    this.opacity = v;
    this.bldUniforms.uOpacity.value = v;
    this.strUniforms.uOpacity.value = v;
  }

  setActive(active: boolean): void {
    this.layerVisible = active;
    this.group.visible = active;
  }

  /**
   * Per-frame engage logic. Picks the closest city by angular distance
   * from the camera-to-globe vector; engages or drops the active build
   * accordingly.
   */
  update(cameraPos: THREE.Vector3): void {
    if (!this.layerVisible || this.polyMeta.length === 0) return;
    const camLen = Math.max(1e-3, cameraPos.length());
    const camDir = new THREE.Vector3(cameraPos.x / camLen, cameraPos.y / camLen, cameraPos.z / camLen);

    // Find the polygon whose centroid is closest to the camera's
    // sub-globe point (great-circle distance ≈ acos(dot) × R).
    let bestIdx = -1;
    let bestDistKm = Infinity;
    for (let i = 0; i < this.polyMeta.length; i++) {
      const c = this.polyMeta[i]!.basis.centre;
      const dot = Math.max(-1, Math.min(1, camDir.x * c.x + camDir.y * c.y + c.z * camDir.z));
      const distKm = Math.acos(dot) * EARTH_RADIUS_KM;
      if (distKm < bestDistKm) {
        bestDistKm = distKm;
        bestIdx = i;
      }
    }

    if (bestIdx < 0) return;

    // Engage / disengage hysteresis: build once we're inside ENGAGE,
    // tear down only once we exceed DISENGAGE so a city that's wobbling
    // at the boundary doesn't flicker.
    const inside = bestDistKm < UrbanDetailLayer.ENGAGE_DISTANCE_KM;
    const outside = bestDistKm > UrbanDetailLayer.DISENGAGE_DISTANCE_KM;
    const camFarFromSurface = camLen > 1.6; // camera way out at globe view

    if (camFarFromSurface || outside) {
      this.dropActive();
      return;
    }
    if (!inside) return;

    if (this.active && this.active.cityId === this.polyMeta[bestIdx]!.record.id) {
      return; // already showing
    }
    this.dropActive();
    this.engage(bestIdx);
  }

  private engage(idx: number): void {
    const meta = this.polyMeta[idx]!;
    let build = this.buildCache.get(meta.record.id);
    if (!build) {
      build = this.buildCityMesh(meta);
      this.buildCache.set(meta.record.id, build);
      // Cap the cache; if it grows beyond a small window, evict the
      // oldest entry. 8 entries × ~6k boxes is ~48k draw-list rows tops,
      // tiny by GPU standards.
      if (this.buildCache.size > 8) {
        const oldestKey = this.buildCache.keys().next().value;
        if (typeof oldestKey === 'number' && oldestKey !== meta.record.id) {
          const dropped = this.buildCache.get(oldestKey);
          if (dropped) {
            dropped.buildingsMesh.geometry.dispose();
            (dropped.buildingsMesh.geometry as THREE.InstancedBufferGeometry).dispose();
            dropped.streetsMesh.geometry.dispose();
          }
          this.buildCache.delete(oldestKey);
        }
      }
    }
    this.bldUniforms.uCityCentre.value.copy(meta.basis.centre);
    this.bldUniforms.uTangentX.value.copy(meta.basis.tangentX);
    this.bldUniforms.uTangentY.value.copy(meta.basis.tangentY);
    this.strUniforms.uCityCentre.value.copy(meta.basis.centre);
    this.strUniforms.uTangentX.value.copy(meta.basis.tangentX);
    this.strUniforms.uTangentY.value.copy(meta.basis.tangentY);
    this.group.add(build.streetsMesh);
    this.group.add(build.buildingsMesh);
    this.active = build;
  }

  private dropActive(): void {
    if (!this.active) return;
    this.group.remove(this.active.buildingsMesh);
    this.group.remove(this.active.streetsMesh);
    this.active = null;
  }

  private buildCityMesh(meta: AtlasInstanceMeta): CityBuild {
    const rng = new Pcg32((meta.record.id + 1) * 0x9e3779b1, BUILD_VERSION);

    // 1) Rasterise the polygon to a MASK_SIZE × MASK_SIZE inside-mask.
    const mask = rasteriseInsideMask(meta, MASK_SIZE);

    // 2) Pick a street period and orient streets axis-aligned to the
    //    tangent frame. Compute street cell stride in mask cells.
    const streetPeriodM = rng.range(STREET_PERIOD_M_MIN, STREET_PERIOD_M_MAX);
    const halfX_m = meta.halfExtentKm.x * 1000;
    const halfY_m = meta.halfExtentKm.y * 1000;
    const cellSizeX_m = (halfX_m * 2) / MASK_SIZE;
    const cellSizeY_m = (halfY_m * 2) / MASK_SIZE;
    const streetCellStrideX = Math.max(1, Math.round(streetPeriodM / cellSizeX_m));
    const streetCellStrideY = Math.max(1, Math.round(streetPeriodM / cellSizeY_m));

    // 3) Mark street cells in a parallel mask. 1 = street, 0 = block.
    const isStreet = new Uint8Array(MASK_SIZE * MASK_SIZE);
    for (let r = 0; r < MASK_SIZE; r++) {
      if (r % streetCellStrideY !== 0) continue;
      for (let c = 0; c < MASK_SIZE; c++) {
        if (mask[r * MASK_SIZE + c]) isStreet[r * MASK_SIZE + c] = 1;
      }
    }
    for (let c = 0; c < MASK_SIZE; c++) {
      if (c % streetCellStrideX !== 0) continue;
      for (let r = 0; r < MASK_SIZE; r++) {
        if (mask[r * MASK_SIZE + c]) isStreet[r * MASK_SIZE + c] = 1;
      }
    }

    // 4) Place buildings inside every non-street, inside cell.
    const heightScale = Math.min(1, Math.log(Math.max(1, meta.record.pop / 200_000)) / Math.log(BIG_CITY_POP / 200_000));
    const maxHeightThisCity = BASE_HEIGHT_M + (MAX_HEIGHT_M - BASE_HEIGHT_M) * heightScale;

    const localXY: number[] = [];     // per-building (x_km, y_km)
    const footprint: number[] = [];   // per-building (width_m, depth_m)
    const heights: number[] = [];     // per-building height_m
    const rotations: number[] = [];   // per-building rotation radians (axis-aligned ± jitter)
    let buildingCount = 0;
    outer: for (let r = 0; r < MASK_SIZE; r++) {
      for (let c = 0; c < MASK_SIZE; c++) {
        const idxCell = r * MASK_SIZE + c;
        if (!mask[idxCell] || isStreet[idxCell]) continue;
        if (buildingCount >= MAX_BUILDINGS_PER_CITY) break outer;

        // Density falls off radially. Sample at the cell's km position.
        const cellX_km = (-meta.halfExtentKm.x) + ((c + 0.5) / MASK_SIZE) * (meta.halfExtentKm.x * 2);
        const cellY_km = (-meta.halfExtentKm.y) + ((r + 0.5) / MASK_SIZE) * (meta.halfExtentKm.y * 2);
        const dxNorm = cellX_km / Math.max(0.001, meta.halfExtentKm.x);
        const dyNorm = cellY_km / Math.max(0.001, meta.halfExtentKm.y);
        const density = Math.exp(-(dxNorm * dxNorm + dyNorm * dyNorm) * 1.4); // 1.0 at centre → ~0.25 at edge

        const perCell = BUILDINGS_PER_CELL_MIN +
          Math.floor(rng.float() * (BUILDINGS_PER_CELL_MAX - BUILDINGS_PER_CELL_MIN + 1));
        for (let k = 0; k < perCell; k++) {
          if (buildingCount >= MAX_BUILDINGS_PER_CITY) break outer;
          // Footprint width/depth in metres, clamped to fit inside the cell with margin.
          const w = Math.min(cellSizeX_m * 0.8, 20 + rng.float() * 30);
          const d = Math.min(cellSizeY_m * 0.8, 20 + rng.float() * 30);
          // Position inside the cell — small jitter so buildings don't
          // perfectly line up at the cell centre.
          const jitterX = (rng.float() - 0.5) * (cellSizeX_m * 0.35);
          const jitterY = (rng.float() - 0.5) * (cellSizeY_m * 0.35);
          const px_m = cellX_km * 1000 + jitterX;
          const py_m = cellY_km * 1000 + jitterY;

          // Height — power-law with city-pop-bounded ceiling.
          const u = rng.float();
          const h = BASE_HEIGHT_M + (maxHeightThisCity - BASE_HEIGHT_M) * Math.pow(u, HEIGHT_POWER) * (0.4 + 0.6 * density);

          localXY.push(px_m / 1000, py_m / 1000);
          footprint.push(w, d);
          heights.push(h);
          rotations.push((rng.float() - 0.5) * 0.15); // ± ~4.3° jitter
          buildingCount++;
        }
      }
    }

    // 5) Build buildings InstancedMesh.
    const bldGeom = new THREE.InstancedBufferGeometry();
    const baseAttrs = this.buildingGeometry.attributes;
    bldGeom.setAttribute('position', baseAttrs.position!);
    bldGeom.setAttribute('normal', baseAttrs.normal!);
    bldGeom.setAttribute('uv', baseAttrs.uv!);
    if (this.buildingGeometry.index) bldGeom.setIndex(this.buildingGeometry.index);

    bldGeom.setAttribute('aLocalXY', new THREE.InstancedBufferAttribute(new Float32Array(localXY), 2));
    bldGeom.setAttribute('aSize', new THREE.InstancedBufferAttribute(
      new Float32Array(flatten3(footprint, heights)), 3,
    ));
    bldGeom.setAttribute('aRotation', new THREE.InstancedBufferAttribute(new Float32Array(rotations), 1));

    const buildingsMesh = new THREE.InstancedMesh(bldGeom, this.bldMaterial, buildingCount);
    buildingsMesh.frustumCulled = false;
    buildingsMesh.count = buildingCount;
    buildingsMesh.instanceMatrix.needsUpdate = true;
    buildingsMesh.renderOrder = 1;

    // 6) Streets — single triangle-list ribbon. Each marked street cell
    //    becomes a small quad in the tangent plane.
    const { positions: strPositions, uvs: strUvs } = buildStreetGeometry(
      isStreet, mask, meta, MASK_SIZE,
    );
    const strGeom = new THREE.BufferGeometry();
    strGeom.setAttribute('aLocalXY', new THREE.BufferAttribute(strPositions, 2));
    strGeom.setAttribute('aStreetUV', new THREE.BufferAttribute(strUvs, 2));
    const streetsMesh = new THREE.Mesh(strGeom, this.strMaterial);
    streetsMesh.frustumCulled = false;
    streetsMesh.renderOrder = 0;

    return {
      cityId: meta.record.id,
      buildingsMesh,
      streetsMesh,
      meta,
    };
  }

  dispose(): void {
    this.dropActive();
    for (const build of this.buildCache.values()) {
      build.buildingsMesh.geometry.dispose();
      build.streetsMesh.geometry.dispose();
    }
    this.buildCache.clear();
    this.buildingGeometry.dispose();
    this.bldMaterial.dispose();
    this.strMaterial.dispose();
  }
}

function makeUniforms(): UrbanDetailUniforms {
  return {
    uSunDirection: { value: new THREE.Vector3(1, 0, 0.3).normalize() },
    uCityCentre: { value: new THREE.Vector3() },
    uTangentX: { value: new THREE.Vector3(1, 0, 0) },
    uTangentY: { value: new THREE.Vector3(0, 1, 0) },
    uRadialBase: { value: 1.0 + 5e-4 },
    uElevationScale: { value: DEFAULT_ELEVATION_SCALE },
    uMetresPerUnit: { value: EARTH_RADIUS_KM * 1000 },
    uOpacity: { value: 1.0 },
  };
}

/** Pack three flat per-building arrays into one tight (w,d,h) per row. */
function flatten3(footprint: number[], heights: number[]): number[] {
  const out: number[] = new Array(heights.length * 3);
  for (let i = 0; i < heights.length; i++) {
    out[i * 3] = footprint[i * 2]!;
    out[i * 3 + 1] = footprint[i * 2 + 1]!;
    out[i * 3 + 2] = heights[i]!;
  }
  return out;
}

/** Scanline-rasterise a polygon's inside-mask at `size × size`. */
function rasteriseInsideMask(meta: AtlasInstanceMeta, size: number): Uint8Array {
  // Build a flat [x, y] km buffer for this polygon by reconstructing
  // from the record. (We could also pull from the atlas Float32 buffer
  // but recomputing is cheap and avoids re-uploading data.)
  const { centre, tangentX, tangentY } = meta.basis;
  const rec = meta.record;
  const polyXy = new Float32Array(rec.polygon.length * 2);
  for (let i = 0; i < rec.polygon.length; i++) {
    const lat = rec.polygon[i]![0] * Math.PI / 180;
    const lon = rec.polygon[i]![1] * Math.PI / 180;
    const cosLat = Math.cos(lat);
    const px = cosLat * Math.cos(lon);
    const py = cosLat * Math.sin(lon);
    const pz = Math.sin(lat);
    const dx = px - centre.x;
    const dy = py - centre.y;
    const dz = pz - centre.z;
    const ex = (dx * tangentX.x + dy * tangentX.y + dz * tangentX.z) * EARTH_RADIUS_KM;
    const ey = (dx * tangentY.x + dy * tangentY.y + dz * tangentY.z) * EARTH_RADIUS_KM;
    polyXy[i * 2] = ex;
    polyXy[i * 2 + 1] = ey;
  }

  const mask = new Uint8Array(size * size);
  for (let r = 0; r < size; r++) {
    const y = (-meta.halfExtentKm.y) + ((r + 0.5) / size) * (meta.halfExtentKm.y * 2);
    for (let c = 0; c < size; c++) {
      const x = (-meta.halfExtentKm.x) + ((c + 0.5) / size) * (meta.halfExtentKm.x * 2);
      mask[r * size + c] = pointInPolygon(polyXy, x, y) ? 1 : 0;
    }
  }
  return mask;
}

/**
 * Turn the street-marked cells into a triangle list of small thin
 * ribbons. Each marked cell contributes a single quad in the tangent
 * plane (two triangles). The streets shader lifts each quad off the
 * sphere by the per-city basis just like buildings.
 */
function buildStreetGeometry(
  isStreet: Uint8Array,
  mask: Uint8Array,
  meta: AtlasInstanceMeta,
  size: number,
): { positions: Float32Array; uvs: Float32Array } {
  // Two triangles per cell × 6 verts × 2 floats (x,y_km).
  // We over-allocate then trim — counting marked cells up front is
  // cheaper than dynamic Array.push for big grids.
  let streetCells = 0;
  for (let i = 0; i < isStreet.length; i++) if (isStreet[i] && mask[i]) streetCells++;

  const positions = new Float32Array(streetCells * 6 * 2);
  const uvs = new Float32Array(streetCells * 6 * 2);
  let writePos = 0;
  let writeUv = 0;

  const cellW = (meta.halfExtentKm.x * 2) / size; // km
  const cellH = (meta.halfExtentKm.y * 2) / size;
  for (let r = 0; r < size; r++) {
    const y0 = (-meta.halfExtentKm.y) + r * cellH;
    const y1 = y0 + cellH;
    for (let c = 0; c < size; c++) {
      const idx = r * size + c;
      if (!isStreet[idx] || !mask[idx]) continue;
      const x0 = (-meta.halfExtentKm.x) + c * cellW;
      const x1 = x0 + cellW;
      // Triangle 1
      positions[writePos++] = x0; positions[writePos++] = y0;
      positions[writePos++] = x1; positions[writePos++] = y0;
      positions[writePos++] = x1; positions[writePos++] = y1;
      // Triangle 2
      positions[writePos++] = x0; positions[writePos++] = y0;
      positions[writePos++] = x1; positions[writePos++] = y1;
      positions[writePos++] = x0; positions[writePos++] = y1;
      // UVs for the simple core-stripe shader (same pattern repeats per cell).
      uvs[writeUv++] = 0; uvs[writeUv++] = 0;
      uvs[writeUv++] = 1; uvs[writeUv++] = 0;
      uvs[writeUv++] = 1; uvs[writeUv++] = 1;
      uvs[writeUv++] = 0; uvs[writeUv++] = 0;
      uvs[writeUv++] = 1; uvs[writeUv++] = 1;
      uvs[writeUv++] = 0; uvs[writeUv++] = 1;
    }
  }
  return { positions, uvs };
}

// Re-export for consumers that want the atlas knobs.
export { ATLAS_WIDTH };

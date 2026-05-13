/**
 * Highways layer — merged ribbon mesh wrapping every kept road
 * polyline along the globe surface. Width is fixed in *screen pixels*
 * (Mapbox / Apple Maps approach), so roads stay thin from any zoom and
 * don't blow up to fat strips when zoomed in.
 *
 * The fragment shader paints a bright sharp core surrounded by a soft
 * warm halo at night (neon-tube look) and a thin dark trace by day.
 * Coastline-clipped via the same HEALPix id raster Land uses.
 *
 * Spatial bucketing: roads are split into NUM_LAT × NUM_LON buckets by
 * the first vertex's lat/lon. Each non-empty bucket becomes its own
 * Mesh with a proper boundingSphere, so Three.js frustum-culls the
 * back-hemisphere / off-screen buckets automatically. A single shared
 * ShaderMaterial drives all buckets — uniform updates apply once.
 *
 * Geometry packing (per bucket): each polyline vertex emits two ribbon
 * vertices with a signed unit world-space perpendicular (`aPerp`). The
 * vertex shader projects the centerline to clip space, finds the
 * screen-space direction of `aPerp`, and offsets in clip space by the
 * desired pixel count. Per-vertex `aKind` (0=major, 1=arterial,
 * 2=local, 3=local2) drives the width and brightness boost.
 * Cross-ribbon coordinate is reconstructed in the vertex shader from
 * `gl_VertexID` parity (even=+side, odd=-side). gl_VertexID is per-draw
 * in WebGL2, so the parity trick keeps working bucket-by-bucket.
 */

import * as THREE from 'three';

import { source as healpixGlsl } from '../globe/shaders/healpix.glsl.js';
import { source as vertGlsl } from './shaders/highways.vert.glsl.js';
import { source as fragGlsl } from './shaders/highways.frag.glsl.js';
import { DEFAULT_ELEVATION_SCALE } from '../globe/LandMaterial.js';
import type { RoadRecord, WorldRuntime } from '../../world/index.js';

/**
 * Spatial bucket grid. 4 lat bands × 8 lon bands = 32 buckets, ~45°×45°
 * each. Coarse enough to keep draw-call overhead negligible, fine enough
 * that the back hemisphere (~half the buckets) frustum-culls cleanly.
 */
const NUM_LAT_BUCKETS = 4;
const NUM_LON_BUCKETS = 8;

/**
 * Radial nudge applied on top of the matched land-displacement lift, in
 * metres of equivalent elevation. The shader multiplies by
 * `uElevationScale` so the bias tracks the altitude-exaggeration slider:
 * land and road lift in lock-step at every slider setting, so the
 * safety margin never gets out-paced as the slider grows.
 *
 * Covers the worst-case linear-interpolation gap between the icosphere
 * land mesh (which interpolates elevation linearly across each ~3 km
 * triangle) and the road's point-sample of elevation. On steep slopes
 * that gap is a few hundred metres; 280 m wins the depth fight in
 * almost every case while keeping the road visually flush at orbital
 * zoom. Bump up to fight more residual patches at the cost of visible
 * float at close zoom; bump down to glue tighter at the cost of patches
 * returning. Same metres-based convention as the airplane shaders'
 * `uRadialBiasM`.
 */
const DEFAULT_HIGHWAY_RADIAL_BIAS_M = 280;

const DEFAULT_UNIFORM_VALUES = {
  majorWidthPx: 3.5,
  arterialWidthPx: 2.0,
  localWidthPx: 1.0,
  // local2 is NE's untyped bucket — noisier and denser than `local`,
  // so render slimmer so it reads as a quiet substrate beneath the
  // classified tiers.
  local2WidthPx: 0.8,
  nightBrightness: 0.6,
  majorBoost: 1.35,
  arterialBoost: 1.0,
  // Local tier is mostly regional country roads, not bright urban
  // arterials — render them dimmer so they read as a quieter background.
  localBoost: 0.7,
  // local2 is the dimmest of all — it's the catch-all `Unknown` bucket
  // from Natural Earth, dominant in Asia / South America / Africa.
  local2Boost: 0.5,
  coreWidth: 0.3,
  coreBoost: 1.2,
  haloStrength: 0.5,
  haloFalloff: 1.8,
  dayStrength: 0.7,
  dayCasingPx: 1.0,
  dayCasingStrength: 0.85,
  dayFillBrightness: 0.95,
  dayFillScale: 1.0,
  // Zoom-faded by scene-graph each frame: opacityNear at camera distance
  // ≤ 1.5, lerping toward opacityFar at distance ≥ 15.
  opacityNear: 1.0,
  opacityFar: 0.4,
} as const;

export type HighwaysUniforms = {
  uSunDirection: { value: THREE.Vector3 };

  uIdRaster: { value: THREE.DataTexture | null };
  uHealpixNside: { value: number };
  uHealpixOrdering: { value: number };
  uAttrTexWidth: { value: number };

  uElevationMeters: { value: THREE.DataTexture | null };
  // Same texture Land binds — bilinear-sampled in the vert shader to
  // produce a continuous coast fade that matches the land mesh's lift
  // recipe (see highways.vert.glsl). Null until the bake ships; the
  // shader's smoothstep then degrades to "fully on land" everywhere.
  uDistanceField: { value: THREE.DataTexture | null };
  uElevationScale: { value: number };
  uHighwayRadialBiasM: { value: number };

  uViewportSize: { value: THREE.Vector2 };
  uMajorWidthPx: { value: number };
  uArterialWidthPx: { value: number };
  uLocalWidthPx: { value: number };
  uLocal2WidthPx: { value: number };

  uNightBrightness: { value: number };
  uMajorBoost: { value: number };
  uArterialBoost: { value: number };
  uLocalBoost: { value: number };
  uLocal2Boost: { value: number };
  uCoreWidth: { value: number };
  uCoreBoost: { value: number };
  uHaloStrength: { value: number };
  uHaloFalloff: { value: number };
  uDayStrength: { value: number };
  uDayCasingPx: { value: number };
  uDayCasingStrength: { value: number };
  uDayFillBrightness: { value: number };
  uDayFillScale: { value: number };
  uOpacity: { value: number };
};

const DEG = Math.PI / 180;

function latLonToUnit(out: THREE.Vector3, latDeg: number, lonDeg: number): THREE.Vector3 {
  const lat = latDeg * DEG;
  const lon = lonDeg * DEG;
  const cosLat = Math.cos(lat);
  return out.set(cosLat * Math.cos(lon), cosLat * Math.sin(lon), Math.sin(lat));
}

/**
 * Hemisphere-visibility threshold for bucket meshes: a bucket is shown
 * when `dot(bucketCentroidDir, cameraDir) > HEMISPHERE_THRESHOLD`. 0.0
 * is strict front-hemisphere — the bucket's centroid must lie on the
 * camera-facing half of the sphere. Three's frustum culling can't help
 * here: back-hemisphere buckets are inside the FOV cone but occluded
 * by the globe in front; this CPU-side test is what actually drops
 * their draw call + vertex stage.
 */
const HEMISPHERE_THRESHOLD = 0.0;

type Bucket = {
  mesh: THREE.Mesh;
  /** Mean direction from origin to the bucket's ribbon centerlines (unit). */
  centroidDir: THREE.Vector3;
};

export class HighwaysLayer {
  readonly group: THREE.Group;
  readonly uniforms: HighwaysUniforms;
  private readonly material: THREE.ShaderMaterial;
  private readonly geometries: THREE.BufferGeometry[] = [];
  private readonly buckets: Bucket[] = [];
  private drawableCount = 0;
  private layerActive = true;

  constructor(world: WorldRuntime, roads: readonly RoadRecord[]) {
    const { nside, ordering } = world.getHealpixSpec();

    this.group = new THREE.Group();

    this.uniforms = {
      uSunDirection: { value: new THREE.Vector3(1, 0, 0.3).normalize() },

      uIdRaster: { value: world.getIdRaster() },
      uHealpixNside: { value: nside },
      uHealpixOrdering: { value: ordering === 'ring' ? 0 : 1 },
      uAttrTexWidth: { value: 4 * nside },

      uElevationMeters: { value: world.getElevationMetersTexture() },
      uDistanceField: { value: world.getDistanceFieldTexture() },
      uElevationScale: { value: DEFAULT_ELEVATION_SCALE },
      uHighwayRadialBiasM: { value: DEFAULT_HIGHWAY_RADIAL_BIAS_M },

      // Viewport stays at 1×1 until scene-graph wires the canvas size in.
      // Until then the ribbon is degenerate (one-pixel-wide); the resize
      // path runs on first frame so the wrong-size window is never seen.
      uViewportSize: { value: new THREE.Vector2(1, 1) },
      uMajorWidthPx: { value: DEFAULT_UNIFORM_VALUES.majorWidthPx },
      uArterialWidthPx: { value: DEFAULT_UNIFORM_VALUES.arterialWidthPx },
      uLocalWidthPx: { value: DEFAULT_UNIFORM_VALUES.localWidthPx },
      uLocal2WidthPx: { value: DEFAULT_UNIFORM_VALUES.local2WidthPx },

      uNightBrightness: { value: DEFAULT_UNIFORM_VALUES.nightBrightness },
      uMajorBoost: { value: DEFAULT_UNIFORM_VALUES.majorBoost },
      uArterialBoost: { value: DEFAULT_UNIFORM_VALUES.arterialBoost },
      uLocalBoost: { value: DEFAULT_UNIFORM_VALUES.localBoost },
      uLocal2Boost: { value: DEFAULT_UNIFORM_VALUES.local2Boost },
      uCoreWidth: { value: DEFAULT_UNIFORM_VALUES.coreWidth },
      uCoreBoost: { value: DEFAULT_UNIFORM_VALUES.coreBoost },
      uHaloStrength: { value: DEFAULT_UNIFORM_VALUES.haloStrength },
      uHaloFalloff: { value: DEFAULT_UNIFORM_VALUES.haloFalloff },
      uDayStrength: { value: DEFAULT_UNIFORM_VALUES.dayStrength },
      uDayCasingPx: { value: DEFAULT_UNIFORM_VALUES.dayCasingPx },
      uDayCasingStrength: { value: DEFAULT_UNIFORM_VALUES.dayCasingStrength },
      uDayFillBrightness: { value: DEFAULT_UNIFORM_VALUES.dayFillBrightness },
      uDayFillScale: { value: DEFAULT_UNIFORM_VALUES.dayFillScale },
      uOpacity: { value: DEFAULT_UNIFORM_VALUES.opacityNear },
    };

    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms as unknown as { [u: string]: THREE.IUniform },
      glslVersion: THREE.GLSL3,
      // Both stages call into healpix.glsl: vertex for the elevation
      // lift, fragment for the coastline mask. Concatenate the helper
      // module ourselves — ShaderMaterial doesn't process #include.
      vertexShader: `${healpixGlsl}\n${vertGlsl}`,
      fragmentShader: `${healpixGlsl}\n${fragGlsl}`,
      transparent: true,
      depthWrite: false,
      depthTest: true,
    });

    // Bucket roads by the first vertex's lat/lon, then build one
    // BufferGeometry + Mesh per non-empty bucket.
    const roadBuckets = bucketRoads(roads);
    for (const bucket of roadBuckets) {
      if (bucket.length === 0) continue;
      const built = buildRibbonGeometry(bucket);
      if (built === null) continue;
      const mesh = new THREE.Mesh(built.geometry, this.material);
      mesh.renderOrder = -1;
      // frustumCulled stays true (default), but Three's frustum check
      // cannot drop back-of-globe buckets (they're occluded, not
      // outside the FOV cone) — `update(cameraDir)` does that work
      // per frame via the centroid-direction hemisphere test.
      this.geometries.push(built.geometry);
      this.buckets.push({ mesh, centroidDir: built.centroidDir });
      this.group.add(mesh);
      this.drawableCount++;
    }

    if (this.drawableCount === 0) {
      this.group.visible = false;
    }
  }

  setSunDirection(dir: THREE.Vector3): void {
    this.uniforms.uSunDirection.value.copy(dir);
  }

  setActive(active: boolean): void {
    this.layerActive = active;
    this.group.visible = active && this.drawableCount > 0;
  }

  /**
   * Per-frame hemisphere visibility update. Toggles each bucket mesh's
   * `.visible` based on whether its centroid direction faces the camera.
   * Skips when the layer is off — `setActive(false)` already hid the
   * group, so the per-bucket flags don't matter.
   *
   * `cameraDir` is the unit vector from the globe centre to the camera.
   */
  update(cameraDir: THREE.Vector3): void {
    if (!this.layerActive) return;
    for (const b of this.buckets) {
      const d = b.centroidDir.x * cameraDir.x + b.centroidDir.y * cameraDir.y + b.centroidDir.z * cameraDir.z;
      b.mesh.visible = d > HEMISPHERE_THRESHOLD;
    }
  }

  setElevationScale(v: number): void {
    this.uniforms.uElevationScale.value = v;
  }

  setViewportSize(width: number, height: number): void {
    this.uniforms.uViewportSize.value.set(Math.max(1, width), Math.max(1, height));
  }

  dispose(): void {
    for (const g of this.geometries) g.dispose();
    this.geometries.length = 0;
    this.buckets.length = 0;
    this.material.dispose();
  }
}

function bucketRoads(roads: readonly RoadRecord[]): RoadRecord[][] {
  const out: RoadRecord[][] = [];
  for (let i = 0; i < NUM_LAT_BUCKETS * NUM_LON_BUCKETS; i++) out.push([]);
  for (const r of roads) {
    if (r.vertices.length < 2) continue;
    const lat = r.vertices[0]![0];
    const lon = r.vertices[0]![1];
    const latBin = Math.min(NUM_LAT_BUCKETS - 1, Math.max(0, Math.floor((lat + 90) / (180 / NUM_LAT_BUCKETS))));
    const lonBin = Math.min(NUM_LON_BUCKETS - 1, Math.max(0, Math.floor((lon + 180) / (360 / NUM_LON_BUCKETS))));
    out[latBin * NUM_LON_BUCKETS + lonBin]!.push(r);
  }
  return out;
}

/**
 * Build one merged BufferGeometry covering every polyline in this
 * bucket. For each polyline of N vertices we emit 2N vertices (rungs)
 * and 2(N-1) triangles.
 *
 * Per-vertex attributes:
 *   position — centerline point on the unit sphere (vertex shader adds
 *              the elevation lift on top via a 9-tap blur, then offsets
 *              in clip space by the screen-space direction of `aPerp` ×
 *              pixel width)
 *   aPerp    — signed unit perpendicular to the local tangent on the
 *              sphere; +perp on one ribbon side, -perp on the other.
 *              Magnitude is irrelevant — only the direction matters; the
 *              vertex shader uses it as a tiny world-space nudge to find
 *              the screen-space ribbon direction.
 *   aKind    — 0.0=major, 1.0=arterial, 2.0=local, 3.0=local2. Picks the
 *              width uniform and feeds the per-kind brightness boost.
 *
 * Cross-ribbon coordinate (`vU` in the vertex shader) is reconstructed
 * from `gl_VertexID` parity: even-indexed vertex = +1 side, odd = -1 side.
 * The build order below is what makes that hold.
 *
 * Also returns the bucket's mean centroid direction (unit vector from
 * origin to the average centerline position) — used by the layer's
 * per-frame hemisphere-visibility test.
 *
 * Returns null if the bucket has no drawable triangles.
 */
function buildRibbonGeometry(
  roads: readonly RoadRecord[],
): { geometry: THREE.BufferGeometry; centroidDir: THREE.Vector3 } | null {
  // Two passes: one to size the buffers, one to fill them.
  let totalVerts = 0;
  let totalTris = 0;
  for (const r of roads) {
    const n = r.vertices.length;
    if (n < 2) continue;
    totalVerts += n * 2;
    totalTris += (n - 1) * 2;
  }

  if (totalTris === 0) return null;

  const positions = new Float32Array(totalVerts * 3);
  const perps = new Float32Array(totalVerts * 3);
  const kinds = new Float32Array(totalVerts);
  // Use a 32-bit index buffer — 16-bit caps at 65k vertices and a real
  // bake easily exceeds that even after bucketing.
  const indices = new Uint32Array(totalTris * 3);

  // Reusable vectors so the build loop doesn't allocate per vertex.
  const pPrev = new THREE.Vector3();
  const pCur = new THREE.Vector3();
  const pNext = new THREE.Vector3();
  const tIn = new THREE.Vector3();
  const tOut = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const perp = new THREE.Vector3();
  const radialOut = new THREE.Vector3();

  let vi = 0; // vertex write head
  let ii = 0; // index buffer write head

  // Track bbox for the boundingSphere.
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  for (const r of roads) {
    const verts = r.vertices;
    const n = verts.length;
    if (n < 2) continue;
    const kindFloat =
      r.kind === 'major' ? 0.0
      : r.kind === 'arterial' ? 1.0
      : r.kind === 'local' ? 2.0
      : /* local2 */ 3.0;

    const baseV = vi;

    for (let i = 0; i < n; i++) {
      latLonToUnit(pCur, verts[i]![0], verts[i]![1]);

      // Tangent at vertex i: average of incoming + outgoing edge directions.
      // Endpoints use whichever single edge they have.
      tangent.set(0, 0, 0);
      if (i > 0) {
        latLonToUnit(pPrev, verts[i - 1]![0], verts[i - 1]![1]);
        tIn.subVectors(pCur, pPrev).normalize();
        tangent.add(tIn);
      }
      if (i < n - 1) {
        latLonToUnit(pNext, verts[i + 1]![0], verts[i + 1]![1]);
        tOut.subVectors(pNext, pCur).normalize();
        tangent.add(tOut);
      }
      if (tangent.lengthSq() < 1e-12) {
        // Degenerate (consecutive identical coords); pick anything orthogonal.
        tangent.set(1, 0, 0);
      }
      tangent.normalize();

      radialOut.copy(pCur).normalize();
      perp.crossVectors(tangent, radialOut).normalize();

      const px = pCur.x;
      const py = pCur.y;
      const pz = pCur.z;

      if (px < minX) minX = px; if (px > maxX) maxX = px;
      if (py < minY) minY = py; if (py > maxY) maxY = py;
      if (pz < minZ) minZ = pz; if (pz > maxZ) maxZ = pz;

      // +perp side (centerline + unit perp; vertex shader scales to pixels)
      positions[vi * 3] = px;
      positions[vi * 3 + 1] = py;
      positions[vi * 3 + 2] = pz;
      perps[vi * 3] = perp.x;
      perps[vi * 3 + 1] = perp.y;
      perps[vi * 3 + 2] = perp.z;
      kinds[vi] = kindFloat;
      vi++;
      // -perp side (same centerline, opposite perp). Even index = +perp,
      // odd index = -perp — the vertex shader reads gl_VertexID parity to
      // recover the cross-ribbon coordinate without a separate attribute.
      positions[vi * 3] = px;
      positions[vi * 3 + 1] = py;
      positions[vi * 3 + 2] = pz;
      perps[vi * 3] = -perp.x;
      perps[vi * 3 + 1] = -perp.y;
      perps[vi * 3 + 2] = -perp.z;
      kinds[vi] = kindFloat;
      vi++;
    }

    // Triangulate consecutive rungs into two-triangle quads.
    for (let i = 0; i < n - 1; i++) {
      const a = baseV + i * 2;       // +perp at i
      const b = baseV + i * 2 + 1;   // -perp at i
      const c = baseV + (i + 1) * 2; // +perp at i+1
      const d = baseV + (i + 1) * 2 + 1; // -perp at i+1
      indices[ii++] = a;
      indices[ii++] = c;
      indices[ii++] = b;
      indices[ii++] = b;
      indices[ii++] = c;
      indices[ii++] = d;
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('aPerp', new THREE.BufferAttribute(perps, 3));
  geom.setAttribute('aKind', new THREE.BufferAttribute(kinds, 1));
  geom.setIndex(new THREE.BufferAttribute(indices, 1));

  // Bounding sphere over this bucket's centerline positions, slightly
  // inflated to cover the elevation lift + radial bias and the
  // screen-space ribbon offset (which projects out beyond the centerline
  // by ≤ a few pixels in clip space — irrelevant at world-space radius
  // 1, so 1e-2 headroom is generous).
  const cx = (minX + maxX) * 0.5;
  const cy = (minY + maxY) * 0.5;
  const cz = (minZ + maxZ) * 0.5;
  let rSq = 0;
  for (let i = 0; i < totalVerts; i++) {
    const dx = positions[i * 3]! - cx;
    const dy = positions[i * 3 + 1]! - cy;
    const dz = positions[i * 3 + 2]! - cz;
    const d = dx * dx + dy * dy + dz * dz;
    if (d > rSq) rSq = d;
  }
  const radius = Math.sqrt(rSq) + 1e-2;
  geom.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, cy, cz), radius);

  // Mean direction from origin → centerline cloud, normalised. Each
  // position pair (the +perp and -perp twin) shares the same centerline
  // so summing all `totalVerts` positions is equivalent to summing each
  // centerline twice — direction is unchanged after normalise.
  let sx = 0, sy = 0, sz = 0;
  for (let i = 0; i < totalVerts; i++) {
    sx += positions[i * 3]!;
    sy += positions[i * 3 + 1]!;
    sz += positions[i * 3 + 2]!;
  }
  const slen = Math.max(1e-9, Math.sqrt(sx * sx + sy * sy + sz * sz));
  const centroidDir = new THREE.Vector3(sx / slen, sy / slen, sz / slen);

  return { geometry: geom, centroidDir };
}

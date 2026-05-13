/**
 * Cities layer — far-LOD polygon-shape glow that paints every urban-area
 * polygon as a soft, organically-textured patch tangent to the globe.
 *
 * Geometry: each polygon is triangulated at construction (earcut via
 * `THREE.ShapeUtils.triangulateShape`) into a real triangle mesh in the
 * city's tangent frame, then merged into one BufferGeometry per spatial
 * bucket. Per-vertex attributes carry the tangent-frame km coordinate
 * (`aLocalKm`), the city's half-extent (`aHalfExtentKm`), population,
 * and pattern seed. The fragment shader paints the existing organic
 * block-spray pattern — no per-fragment point-in-polygon loop, no
 * wasted fragments outside the polygon.
 *
 * Spatial bucketing: cities are split into NUM_LAT × NUM_LON buckets by
 * centroid lat/lon. Each non-empty bucket becomes its own Mesh with a
 * proper boundingSphere, so Three.js frustum-culls back-hemisphere /
 * off-screen buckets automatically.
 *
 * Coastline-clipped via the HEALPix id raster (per-fragment).
 */

import * as THREE from 'three';

import { source as healpixGlsl } from '../globe/shaders/healpix.glsl.js';
import { DEFAULT_ELEVATION_SCALE } from '../globe/LandMaterial.js';

const CITIES_VERT = `// Cities vertex shader — triangulated polygon mesh.
//
// Each polygon vertex carries its own unit-sphere position plus the
// per-vertex tangent-frame (x_km, y_km) coordinate \`aLocalKm\` (computed
// at construction in CitiesLayer.ts). The fragment shader uses
// \`vLocalKm\` directly to drive the block-spray hashing — no shared
// quad envelope, no per-fragment point-in-polygon test.
//
// Radial lift: pre-baked CPU-side into the per-vertex
// \`aLiftMeters\` attribute (see web/src/render/util/elevation-lift-bake.ts),
// which mirrors the same 9-tap blur + 8-neighbour coast fade the older
// shader did per frame. The shader just multiplies by
// \`uElevationScale\` so the altitude slider still works — that's the
// only run-time elevation work left on this layer.

precision highp float;
precision highp int;
precision highp sampler2D;

uniform float uElevationScale;
uniform float uCityRadialBias;

in vec2 aLocalKm;
in vec2 aHalfExtentKm;
in float aPopulation;
in float aPatternSeed;
in float aLiftMeters;

out vec2 vLocalKm;
flat out vec2 vHalfExtentKm;
out vec3 vWorldPos;
out float vPopulation;
out float vPatternSeed;

void main() {
  vLocalKm = aLocalKm;
  vHalfExtentKm = aHalfExtentKm;
  vPopulation = aPopulation;
  vPatternSeed = aPatternSeed;

  vec3 dir = normalize(position);

  float landDisplace = aLiftMeters * uElevationScale;
  float radial = 1.0 + landDisplace + uCityRadialBias;
  vec3 worldPos = dir * radial;
  vWorldPos = worldPos;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPos, 1.0);
}
`;

const CITIES_FRAG = `// Cities fragment shader — triangulated polygon mesh.
//
// The geometry IS the polygon now (triangulated CPU-side, see
// CitiesLayer.ts), so there's no point-in-polygon loop and no
// per-instance bbox reject — every shaded fragment is already inside
// its city's polygon. The fragment paints the organic block-spray +
// warm tungsten night palette using the interpolated tangent-frame
// km coordinate, normalised by the city's half-extent for the
// radial-density falloff.
//
// Coastline-clipped via the same HEALPix id raster the land/water
// meshes use, so a coastal polygon never paints onto ocean cells.

precision highp float;
precision highp int;
precision highp sampler2D;

in vec2 vLocalKm;
flat in vec2 vHalfExtentKm;
in vec3 vWorldPos;
in float vPopulation;
in float vPatternSeed;

uniform vec3 uSunDirection;

uniform sampler2D uIdRaster;
uniform sampler2D uWastelandTex;
uniform int uHealpixNside;
uniform int uHealpixOrdering;
uniform int uAttrTexWidth;

uniform float uMinPopulation;

uniform float uGridDensity;
uniform float uAspectJitter;
uniform float uRowOffset;
uniform float uBlockThreshold;
uniform float uOutlineMin;
uniform float uOutlineMax;
uniform float uNightBrightness;
uniform float uTileSparkle;
uniform float uDayContrast;
uniform float uOpacity;
uniform float uNightOpacity;

out vec4 fragColor;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float hash11(float n) {
  return fract(sin(n) * 43758.5453123);
}

float seedToThreshold(float seed) {
  float h = fract(sin(seed * 12.9898 + 78.233) * 43758.5453);
  // Skewed toward the low end so most features only reappear once wasteland
  // is mostly gone. Kept in lockstep with highways.frag.glsl.ts so cities
  // and roads recover at the same pace.
  return mix(0.0, 0.5, h);
}

void main() {
  if (vPopulation < uMinPopulation) discard;

  // HEALPix texel for this fragment — reused below for the coastline mask.
  vec3 sphereDir = normalize(vWorldPos);
  int ipx = healpixZPhiToPix(uHealpixNside, uHealpixOrdering, sphereDir.z, atan(sphereDir.y, sphereDir.x));
  ivec2 tx = healpixIpixToTexel(ipx, uAttrTexWidth);

  // Wasteland kill — per-city threshold sweeps as wasteland decays, so
  // cities pop back one-by-one rather than fading in unison.
  float wasteland = texelFetch(uWastelandTex, tx, 0).r;
  if (wasteland > seedToThreshold(vPatternSeed)) discard;

  vec2 localKm = vLocalKm;

  // Normalised intra-polygon coord. Reaches ~1 at the polygon's bbox
  // edge in either axis; the radial-density term below uses length(local)
  // so the layer fades toward the polygon's outer extents.
  vec2 local = localKm / max(vHalfExtentKm, vec2(1.0));

  // Cell grid in km. Per-row x-stretch + half-cell running-bond offset
  // turn the uniform squares into irregular brickwork. uAspectJitter=0
  // collapses back to the original square grid; uRowOffset=0 keeps rows
  // aligned.
  float cellsPerHalf = uGridDensity;
  vec2 cellCoord = localKm / max(vHalfExtentKm.x, vHalfExtentKm.y) * cellsPerHalf;
  float rowId = floor(cellCoord.y);
  float rowHash = hash11(rowId * 13.13 + vPatternSeed * 0.137);
  float xStretch = 1.0 + uAspectJitter * rowHash;
  float xOffset = uRowOffset * (rowHash - 0.5);
  float xWarped = (cellCoord.x + xOffset) / xStretch;
  vec2 cellId = vec2(floor(xWarped), rowId);
  vec2 cellLocal = vec2(fract(xWarped), fract(cellCoord.y));
  float h = hash21(cellId + vec2(vPatternSeed * 0.0123, vPatternSeed * 0.0719));
  float h2 = hash11(h * 91.7);

  // Radial centre boost — denser near the centroid so even spread-out
  // polygons still read as "dense downtown, lighter outskirts".
  float r = length(local);
  float density = exp(-r * r * 1.6);

  float blockExists = step(uBlockThreshold + (1.0 - density), h);
  float inset = mix(0.05, 0.18, h2) * (0.4 + 0.6 * density);
  float dx = min(cellLocal.x, 1.0 - cellLocal.x);
  float dy = min(cellLocal.y, 1.0 - cellLocal.y);
  float edgeDist = min(dx, dy);
  float fill = step(inset, edgeDist) * blockExists;

  float outlineWidth = mix(uOutlineMin, uOutlineMax, density);
  float outline = (1.0 - smoothstep(inset, inset + outlineWidth, edgeDist))
                  * step(edgeDist, inset)
                  * blockExists;

  // Inner-tile highlight — the deep interior of each filled tile gets a
  // brightness boost, reading as a "lit window cluster". The rim stays
  // dimmer so local contrast climbs without the whole layer washing out.
  float sparkle = smoothstep(inset, inset + 0.18, edgeDist) * blockExists;

  float blockBright = mix(0.55, 1.0, h2);

  // Coastline mask via the HEALPix id raster (uses tx from the top).
  float landMask = isOceanIdTexel(texelFetch(uIdRaster, tx, 0)) ? 0.0 : 1.0;

  float dayFill = mix(0.20, 0.35, blockBright);
  float dayOutline = 0.14;
  vec3 dayCol = vec3(mix(dayFill, dayOutline, outline));
  dayCol = mix(vec3(0.7), dayCol, 0.5 + uDayContrast);

  float popLight = clamp(log(max(vPopulation, 100.0)) / log(2.0e7), 0.35, 1.0);
  vec3 nightFill = vec3(1.0, 0.85, 0.55) * blockBright * popLight * uNightBrightness;
  nightFill *= (1.0 + uTileSparkle * sparkle);
  vec3 nightOutline = vec3(0.04, 0.03, 0.02);
  vec3 nightCol = mix(nightFill, nightOutline, outline);

  // Surface normal at this fragment is just the unit direction from the
  // globe centre — the polygon hugs the unit sphere, so this matches
  // the land mesh's lighting frame within fractions of a degree.
  vec3 surfaceNormal = sphereDir;
  float wrap = smoothstep(-0.05, 0.15, dot(surfaceNormal, normalize(uSunDirection)));
  vec3 col = mix(nightCol, dayCol, wrap);

  float popOpacity = clamp(log(max(vPopulation, 100.0)) / log(2.0e7), 0.25, 1.0);
  float a = (fill * (0.55 + 0.45 * density) + outline * 0.7);
  // Night-only alpha boost — separate from uOpacity so the city feels more
  // "present" on the dark side without colour saturating to white the way
  // pushing uNightBrightness does.
  float nightAlphaMul = mix(uNightOpacity, 1.0, wrap);
  a *= popOpacity * landMask * uOpacity * nightAlphaMul;
  if (a < 0.01) discard;

  fragColor = vec4(col, a);
}
`;
import { tangentBasisAt } from '../../world/coordinates.js';
import { bakeLiftMeters, type LiftBakeContext } from '../util/elevation-lift-bake.js';
import type { UrbanAreaRecord, WorldRuntime } from '../../world/index.js';
import { DEFAULTS } from '../../debug/defaults.js';

const EARTH_RADIUS_KM = 6371;

/**
 * Spatial bucket grid. 4 lat bands × 8 lon bands = 32 buckets, ~45°×45°
 * each. Coarse enough to keep draw-call overhead negligible, fine enough
 * that the back hemisphere (~half the buckets) frustum-culls cleanly.
 */
const NUM_LAT_BUCKETS = 4;
const NUM_LON_BUCKETS = 8;

/**
 * Radial bias applied on top of the elevation-matched lift, in unit-sphere
 * units. 5e-4 ≈ 3.2 km on real Earth — invisibly small at any reasonable
 * camera distance, but well past the 24-bit depth-buffer noise floor at
 * the surface so cities never z-fight with the displaced land mesh.
 */
const DEFAULT_CITY_RADIAL_BIAS = 5e-4;

export type CitiesUniforms = {
  uSunDirection: { value: THREE.Vector3 };

  uIdRaster: { value: THREE.DataTexture | null };
  uWastelandTex: { value: THREE.DataTexture | null };
  uHealpixNside: { value: number };
  uHealpixOrdering: { value: number };
  uAttrTexWidth: { value: number };

  uElevationMeters: { value: THREE.DataTexture | null };
  uElevationScale: { value: number };
  uCityRadialBias: { value: number };

  uMinPopulation: { value: number };

  uGridDensity: { value: number };
  uAspectJitter: { value: number };
  uRowOffset: { value: number };
  uBlockThreshold: { value: number };
  uOutlineMin: { value: number };
  uOutlineMax: { value: number };
  uNightBrightness: { value: number };
  uTileSparkle: { value: number };
  uDayContrast: { value: number };
  uOpacity: { value: number };
  uNightOpacity: { value: number };
};

// All city tuning lives in [../../debug/defaults.ts] under
// `DEFAULTS.materials.cities`.

/**
 * Hemisphere-visibility threshold for bucket meshes: a bucket is shown
 * when `dot(bucketCentroidDir, cameraDir) > HEMISPHERE_THRESHOLD`. 0.0
 * is strict front-hemisphere — the bucket's centroid must lie on the
 * camera-facing half of the sphere. Three's frustum culling can't help
 * here: the back hemisphere is still inside the camera FOV cone, just
 * occluded by the globe in front; this CPU-side test is what actually
 * drops those buckets' draw calls + vertex shading.
 */
const HEMISPHERE_THRESHOLD = 0.0;

type Bucket = {
  mesh: THREE.Mesh;
  /** Mean direction from origin to the bucket's vertex positions (unit). */
  centroidDir: THREE.Vector3;
};

export class CitiesLayer {
  readonly group: THREE.Group;
  readonly uniforms: CitiesUniforms;
  private readonly material: THREE.ShaderMaterial;
  private readonly buckets: Bucket[] = [];
  private readonly geometries: THREE.BufferGeometry[] = [];
  private drawableCount = 0;
  private layerActive = true;

  constructor(world: WorldRuntime, urbanAreas: readonly UrbanAreaRecord[]) {
    const { nside, ordering } = world.getHealpixSpec();

    this.group = new THREE.Group();
    console.info(`[cities] constructing CitiesLayer with ${urbanAreas.length} polygons`);

    const c = DEFAULTS.materials.cities;
    this.uniforms = {
      uSunDirection: { value: new THREE.Vector3(1, 0, 0.3).normalize() },

      uIdRaster: { value: world.getIdRaster() },
      uWastelandTex: { value: world.getWastelandTexture() },
      uHealpixNside: { value: nside },
      uHealpixOrdering: { value: ordering === 'ring' ? 0 : 1 },
      uAttrTexWidth: { value: 4 * nside },

      uElevationMeters: { value: world.getElevationMetersTexture() },
      uElevationScale: { value: DEFAULT_ELEVATION_SCALE },
      uCityRadialBias: { value: DEFAULT_CITY_RADIAL_BIAS },

      uMinPopulation: { value: c.minPopulation },

      uGridDensity: { value: c.gridDensity },
      uAspectJitter: { value: c.aspectJitter },
      uRowOffset: { value: c.rowOffset },
      uBlockThreshold: { value: c.blockThreshold },
      uOutlineMin: { value: c.outlineMin },
      uOutlineMax: { value: c.outlineMax },
      uNightBrightness: { value: c.nightBrightness },
      uTileSparkle: { value: c.tileSparkle },
      uDayContrast: { value: c.dayContrast },
      uOpacity: { value: c.opacity },
      uNightOpacity: { value: c.nightOpacity },
    };

    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms as unknown as { [u: string]: THREE.IUniform },
      glslVersion: THREE.GLSL3,
      vertexShader: `${healpixGlsl}\n${CITIES_VERT}`,
      fragmentShader: `${healpixGlsl}\n${CITIES_FRAG}`,
      transparent: true,
      depthWrite: false,
      depthTest: true,
    });

    if (urbanAreas.length > 0) {
      const liftCtx: LiftBakeContext = {
        world,
        nside,
        ordering,
        coastFade: { kind: 'ocean-count-8' },
      };
      const cityBuckets = bucketByCentroid(urbanAreas);
      for (const bucket of cityBuckets) {
        if (bucket.length === 0) continue;
        const built = buildBucketGeometry(bucket, liftCtx);
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

  setOpacity(v: number): void {
    this.uniforms.uOpacity.value = v;
  }

  dispose(): void {
    for (const g of this.geometries) g.dispose();
    this.geometries.length = 0;
    this.buckets.length = 0;
    this.material.dispose();
  }
}

function bucketByCentroid(records: readonly UrbanAreaRecord[]): UrbanAreaRecord[][] {
  const out: UrbanAreaRecord[][] = [];
  for (let i = 0; i < NUM_LAT_BUCKETS * NUM_LON_BUCKETS; i++) out.push([]);
  for (const r of records) {
    const latBin = Math.min(NUM_LAT_BUCKETS - 1, Math.max(0, Math.floor((r.lat + 90) / (180 / NUM_LAT_BUCKETS))));
    const lonBin = Math.min(NUM_LON_BUCKETS - 1, Math.max(0, Math.floor((r.lon + 180) / (360 / NUM_LON_BUCKETS))));
    out[latBin * NUM_LON_BUCKETS + lonBin]!.push(r);
  }
  return out;
}

/**
 * Triangulate every polygon in the bucket and merge into a single
 * BufferGeometry. Per-vertex attributes carry the tangent-frame km
 * coordinate, the per-city half-extent, population, and pattern seed.
 *
 * Also returns the bucket's mean centroid direction (unit vector from
 * origin to the average vertex position) — used by the layer's per-
 * frame hemisphere-visibility test.
 *
 * Returns null if the bucket triangulates to zero triangles (every
 * polygon was degenerate).
 */
function buildBucketGeometry(
  records: UrbanAreaRecord[],
  liftCtx: LiftBakeContext,
): { geometry: THREE.BufferGeometry; centroidDir: THREE.Vector3 } | null {
  // First pass — triangulate each polygon and sum vertex / triangle counts.
  type Triangulated = {
    record: UrbanAreaRecord;
    /** Unit-sphere (x,y,z) per polygon vertex. */
    positions: Float32Array;
    /** Tangent-frame (x_km, y_km) per polygon vertex. */
    localKm: Float32Array;
    halfExtentKm: { x: number; y: number };
    /** Flat triangle indices into the polygon's own vertex array. */
    indices: Uint32Array;
  };

  const tris: Triangulated[] = [];
  let totalVerts = 0;
  let totalIdx = 0;

  // Vector2-likes for ShapeUtils.triangulateShape — it uses .x, .y, .equals.
  // Reusable scratch contour array, recycled per polygon.
  for (const rec of records) {
    if (rec.polygon.length < 3) continue;
    const basis = tangentBasisAt(rec.lat, rec.lon);
    const { centre, tangentX, tangentY } = basis;
    const n = rec.polygon.length;
    const positions = new Float32Array(n * 3);
    const localKm = new Float32Array(n * 2);
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const contour: THREE.Vector2[] = new Array(n);
    for (let i = 0; i < n; i++) {
      const lat = rec.polygon[i]![0] * Math.PI / 180;
      const lon = rec.polygon[i]![1] * Math.PI / 180;
      const cosLat = Math.cos(lat);
      const px = cosLat * Math.cos(lon);
      const py = cosLat * Math.sin(lon);
      const pz = Math.sin(lat);
      positions[i * 3] = px;
      positions[i * 3 + 1] = py;
      positions[i * 3 + 2] = pz;
      const dx = px - centre.x;
      const dy = py - centre.y;
      const dz = pz - centre.z;
      const ex = (dx * tangentX.x + dy * tangentX.y + dz * tangentX.z) * EARTH_RADIUS_KM;
      const ey = (dx * tangentY.x + dy * tangentY.y + dz * tangentY.z) * EARTH_RADIUS_KM;
      localKm[i * 2] = ex;
      localKm[i * 2 + 1] = ey;
      if (ex < minX) minX = ex;
      if (ex > maxX) maxX = ex;
      if (ey < minY) minY = ey;
      if (ey > maxY) maxY = ey;
      contour[i] = new THREE.Vector2(ex, ey);
    }
    // Same 5% headroom convention used by PolygonAtlas (so the radial
    // density falloff in the fragment shader sees the same half-extent).
    const halfExtent = {
      x: Math.max(1, (maxX - minX) * 0.55),
      y: Math.max(1, (maxY - minY) * 0.55),
    };
    // Earcut needs CCW winding; flip if clockwise. The triangulator
    // tolerates degenerate input but returns zero tris for collapsed
    // contours — those get skipped below.
    const reversed = THREE.ShapeUtils.isClockWise(contour);
    if (reversed) contour.reverse();
    // ShapeUtils mutates contour (drops a duplicated closing vertex if
    // present). The artifact already omits the closing vertex, so the
    // call is a no-op there.
    const faces = THREE.ShapeUtils.triangulateShape(contour, []);
    if (faces.length === 0) continue;
    // If we reversed the contour, face indices reference the reversed
    // order; remap each index i to (n-1-i) so they index back into the
    // original positions / localKm arrays.
    const indices = new Uint32Array(faces.length * 3);
    if (reversed) {
      for (let i = 0; i < faces.length; i++) {
        indices[i * 3] = n - 1 - faces[i]![0]!;
        indices[i * 3 + 1] = n - 1 - faces[i]![1]!;
        indices[i * 3 + 2] = n - 1 - faces[i]![2]!;
      }
    } else {
      for (let i = 0; i < faces.length; i++) {
        indices[i * 3] = faces[i]![0]!;
        indices[i * 3 + 1] = faces[i]![1]!;
        indices[i * 3 + 2] = faces[i]![2]!;
      }
    }
    tris.push({ record: rec, positions, localKm, halfExtentKm: halfExtent, indices });
    totalVerts += n;
    totalIdx += indices.length;
  }

  if (totalIdx === 0) return null;

  // Second pass — pack into merged buffers.
  const positions = new Float32Array(totalVerts * 3);
  const localKmAttr = new Float32Array(totalVerts * 2);
  const halfExtents = new Float32Array(totalVerts * 2);
  const populations = new Float32Array(totalVerts);
  const seeds = new Float32Array(totalVerts);
  const lifts = new Float32Array(totalVerts);
  const indices = new Uint32Array(totalIdx);

  let vBase = 0;
  let iWrite = 0;
  // Track bbox in world-space for the boundingSphere.
  let minPx = Infinity, maxPx = -Infinity;
  let minPy = Infinity, maxPy = -Infinity;
  let minPz = Infinity, maxPz = -Infinity;
  for (const t of tris) {
    const n = t.positions.length / 3;
    positions.set(t.positions, vBase * 3);
    localKmAttr.set(t.localKm, vBase * 2);
    for (let i = 0; i < n; i++) {
      halfExtents[(vBase + i) * 2] = t.halfExtentKm.x;
      halfExtents[(vBase + i) * 2 + 1] = t.halfExtentKm.y;
      populations[vBase + i] = t.record.pop;
      seeds[vBase + i] = t.record.id;
      const px = t.positions[i * 3]!;
      const py = t.positions[i * 3 + 1]!;
      const pz = t.positions[i * 3 + 2]!;
      if (px < minPx) minPx = px; if (px > maxPx) maxPx = px;
      if (py < minPy) minPy = py; if (py > maxPy) maxPy = py;
      if (pz < minPz) minPz = pz; if (pz > maxPz) maxPz = pz;
      // 9-tap lift baked once per vertex; the shader scales by
      // uElevationScale so the altitude slider keeps working without
      // re-baking. Terraforming would need a `rebakeLifts()` pass to
      // overwrite this buffer + flip needsUpdate.
      lifts[vBase + i] = bakeLiftMeters(px, py, pz, liftCtx);
    }
    for (let i = 0; i < t.indices.length; i++) {
      indices[iWrite + i] = t.indices[i]! + vBase;
    }
    vBase += n;
    iWrite += t.indices.length;
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('aLocalKm', new THREE.BufferAttribute(localKmAttr, 2));
  geom.setAttribute('aHalfExtentKm', new THREE.BufferAttribute(halfExtents, 2));
  geom.setAttribute('aPopulation', new THREE.BufferAttribute(populations, 1));
  geom.setAttribute('aPatternSeed', new THREE.BufferAttribute(seeds, 1));
  geom.setAttribute('aLiftMeters', new THREE.BufferAttribute(lifts, 1));
  geom.setIndex(new THREE.BufferAttribute(indices, 1));

  // Bounding sphere over this bucket's vertex positions, slightly
  // inflated to cover the elevation lift (max ~9 km × default
  // elevation scale ≈ 1e-4 unit; 1e-3 is generous headroom).
  const cx = (minPx + maxPx) * 0.5;
  const cy = (minPy + maxPy) * 0.5;
  const cz = (minPz + maxPz) * 0.5;
  let rSq = 0;
  for (let i = 0; i < totalVerts; i++) {
    const dx = positions[i * 3]! - cx;
    const dy = positions[i * 3 + 1]! - cy;
    const dz = positions[i * 3 + 2]! - cz;
    const d = dx * dx + dy * dy + dz * dz;
    if (d > rSq) rSq = d;
  }
  const radius = Math.sqrt(rSq) + 1e-3;
  geom.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, cy, cz), radius);

  // Mean direction from origin → vertex cloud, normalised. Used per-frame
  // by the hemisphere-visibility test in update(). For a 45°×45° bucket
  // tile this is well-defined (vertices span < ~32° from the bucket
  // centre, so their mean direction lands cleanly inside the patch).
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

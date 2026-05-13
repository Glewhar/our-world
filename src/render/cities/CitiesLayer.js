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
import { source as vertGlsl } from './shaders/cities.vert.glsl.js';
import { source as fragGlsl } from './shaders/cities.frag.glsl.js';
import { DEFAULT_ELEVATION_SCALE } from '../globe/LandMaterial.js';
import { tangentBasisAt } from '../../world/coordinates.js';
import { bakeLiftMeters } from '../util/elevation-lift-bake.js';
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
const DEFAULT_UNIFORM_VALUES = {
    minPopulation: 0,
    gridDensity: 35,
    aspectJitter: 0.1,
    rowOffset: 0.5,
    blockThreshold: 0.1,
    outlineMin: 0.01,
    outlineMax: 0.06,
    nightBrightness: 0.9,
    tileSparkle: 0.8,
    dayContrast: 0.6,
    opacity: 0.65,
    nightOpacity: 2.9,
};
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
export class CitiesLayer {
    group;
    uniforms;
    material;
    buckets = [];
    geometries = [];
    drawableCount = 0;
    layerActive = true;
    constructor(world, urbanAreas) {
        const { nside, ordering } = world.getHealpixSpec();
        this.group = new THREE.Group();
        console.info(`[cities] constructing CitiesLayer with ${urbanAreas.length} polygons`);
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
            uMinPopulation: { value: DEFAULT_UNIFORM_VALUES.minPopulation },
            uGridDensity: { value: DEFAULT_UNIFORM_VALUES.gridDensity },
            uAspectJitter: { value: DEFAULT_UNIFORM_VALUES.aspectJitter },
            uRowOffset: { value: DEFAULT_UNIFORM_VALUES.rowOffset },
            uBlockThreshold: { value: DEFAULT_UNIFORM_VALUES.blockThreshold },
            uOutlineMin: { value: DEFAULT_UNIFORM_VALUES.outlineMin },
            uOutlineMax: { value: DEFAULT_UNIFORM_VALUES.outlineMax },
            uNightBrightness: { value: DEFAULT_UNIFORM_VALUES.nightBrightness },
            uTileSparkle: { value: DEFAULT_UNIFORM_VALUES.tileSparkle },
            uDayContrast: { value: DEFAULT_UNIFORM_VALUES.dayContrast },
            uOpacity: { value: DEFAULT_UNIFORM_VALUES.opacity },
            uNightOpacity: { value: DEFAULT_UNIFORM_VALUES.nightOpacity },
        };
        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            glslVersion: THREE.GLSL3,
            vertexShader: `${healpixGlsl}\n${vertGlsl}`,
            fragmentShader: `${healpixGlsl}\n${fragGlsl}`,
            transparent: true,
            depthWrite: false,
            depthTest: true,
        });
        if (urbanAreas.length > 0) {
            const liftCtx = {
                world,
                nside,
                ordering,
                coastFade: { kind: 'ocean-count-8' },
            };
            const cityBuckets = bucketByCentroid(urbanAreas);
            for (const bucket of cityBuckets) {
                if (bucket.length === 0)
                    continue;
                const built = buildBucketGeometry(bucket, liftCtx);
                if (built === null)
                    continue;
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
    setSunDirection(dir) {
        this.uniforms.uSunDirection.value.copy(dir);
    }
    setActive(active) {
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
    update(cameraDir) {
        if (!this.layerActive)
            return;
        for (const b of this.buckets) {
            const d = b.centroidDir.x * cameraDir.x + b.centroidDir.y * cameraDir.y + b.centroidDir.z * cameraDir.z;
            b.mesh.visible = d > HEMISPHERE_THRESHOLD;
        }
    }
    setElevationScale(v) {
        this.uniforms.uElevationScale.value = v;
    }
    setOpacity(v) {
        this.uniforms.uOpacity.value = v;
    }
    dispose() {
        for (const g of this.geometries)
            g.dispose();
        this.geometries.length = 0;
        this.buckets.length = 0;
        this.material.dispose();
    }
}
function bucketByCentroid(records) {
    const out = [];
    for (let i = 0; i < NUM_LAT_BUCKETS * NUM_LON_BUCKETS; i++)
        out.push([]);
    for (const r of records) {
        const latBin = Math.min(NUM_LAT_BUCKETS - 1, Math.max(0, Math.floor((r.lat + 90) / (180 / NUM_LAT_BUCKETS))));
        const lonBin = Math.min(NUM_LON_BUCKETS - 1, Math.max(0, Math.floor((r.lon + 180) / (360 / NUM_LON_BUCKETS))));
        out[latBin * NUM_LON_BUCKETS + lonBin].push(r);
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
function buildBucketGeometry(records, liftCtx) {
    const tris = [];
    let totalVerts = 0;
    let totalIdx = 0;
    // Vector2-likes for ShapeUtils.triangulateShape — it uses .x, .y, .equals.
    // Reusable scratch contour array, recycled per polygon.
    for (const rec of records) {
        if (rec.polygon.length < 3)
            continue;
        const basis = tangentBasisAt(rec.lat, rec.lon);
        const { centre, tangentX, tangentY } = basis;
        const n = rec.polygon.length;
        const positions = new Float32Array(n * 3);
        const localKm = new Float32Array(n * 2);
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        const contour = new Array(n);
        for (let i = 0; i < n; i++) {
            const lat = rec.polygon[i][0] * Math.PI / 180;
            const lon = rec.polygon[i][1] * Math.PI / 180;
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
            if (ex < minX)
                minX = ex;
            if (ex > maxX)
                maxX = ex;
            if (ey < minY)
                minY = ey;
            if (ey > maxY)
                maxY = ey;
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
        if (reversed)
            contour.reverse();
        // ShapeUtils mutates contour (drops a duplicated closing vertex if
        // present). The artifact already omits the closing vertex, so the
        // call is a no-op there.
        const faces = THREE.ShapeUtils.triangulateShape(contour, []);
        if (faces.length === 0)
            continue;
        // If we reversed the contour, face indices reference the reversed
        // order; remap each index i to (n-1-i) so they index back into the
        // original positions / localKm arrays.
        const indices = new Uint32Array(faces.length * 3);
        if (reversed) {
            for (let i = 0; i < faces.length; i++) {
                indices[i * 3] = n - 1 - faces[i][0];
                indices[i * 3 + 1] = n - 1 - faces[i][1];
                indices[i * 3 + 2] = n - 1 - faces[i][2];
            }
        }
        else {
            for (let i = 0; i < faces.length; i++) {
                indices[i * 3] = faces[i][0];
                indices[i * 3 + 1] = faces[i][1];
                indices[i * 3 + 2] = faces[i][2];
            }
        }
        tris.push({ record: rec, positions, localKm, halfExtentKm: halfExtent, indices });
        totalVerts += n;
        totalIdx += indices.length;
    }
    if (totalIdx === 0)
        return null;
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
            const px = t.positions[i * 3];
            const py = t.positions[i * 3 + 1];
            const pz = t.positions[i * 3 + 2];
            if (px < minPx)
                minPx = px;
            if (px > maxPx)
                maxPx = px;
            if (py < minPy)
                minPy = py;
            if (py > maxPy)
                maxPy = py;
            if (pz < minPz)
                minPz = pz;
            if (pz > maxPz)
                maxPz = pz;
            // 9-tap lift baked once per vertex; the shader scales by
            // uElevationScale so the altitude slider keeps working without
            // re-baking. Terraforming would need a `rebakeLifts()` pass to
            // overwrite this buffer + flip needsUpdate.
            lifts[vBase + i] = bakeLiftMeters(px, py, pz, liftCtx);
        }
        for (let i = 0; i < t.indices.length; i++) {
            indices[iWrite + i] = t.indices[i] + vBase;
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
        const dx = positions[i * 3] - cx;
        const dy = positions[i * 3 + 1] - cy;
        const dz = positions[i * 3 + 2] - cz;
        const d = dx * dx + dy * dy + dz * dz;
        if (d > rSq)
            rSq = d;
    }
    const radius = Math.sqrt(rSq) + 1e-3;
    geom.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, cy, cz), radius);
    // Mean direction from origin → vertex cloud, normalised. Used per-frame
    // by the hemisphere-visibility test in update(). For a 45°×45° bucket
    // tile this is well-defined (vertices span < ~32° from the bucket
    // centre, so their mean direction lands cleanly inside the patch).
    let sx = 0, sy = 0, sz = 0;
    for (let i = 0; i < totalVerts; i++) {
        sx += positions[i * 3];
        sy += positions[i * 3 + 1];
        sz += positions[i * 3 + 2];
    }
    const slen = Math.max(1e-9, Math.sqrt(sx * sx + sy * sy + sz * sz));
    const centroidDir = new THREE.Vector3(sx / slen, sy / slen, sz / slen);
    return { geometry: geom, centroidDir };
}

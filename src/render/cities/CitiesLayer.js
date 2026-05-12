/**
 * Cities layer — far-LOD polygon-shape glow that paints every urban-area
 * polygon as a soft, organically-textured patch tangent to the globe.
 *
 * The geometry is one instanced quad per polygon. The fragment shader
 * runs a point-in-polygon test against the polygon's vertices (packed
 * into a single RG32F texture by `PolygonAtlas`) so each city reads as
 * a polygon-shaped glow instead of a perfect circle. Inside the polygon
 * the shader paints the same organic block spray + tungsten warm-night
 * palette the previous CitiesLayer used, scaled by population.
 *
 * Coastline-clipped via the HEALPix id raster (so a coastal polygon
 * that overlaps water never paints onto ocean cells).
 */
import * as THREE from 'three';
import { source as healpixGlsl } from '../globe/shaders/healpix.glsl.js';
import { source as vertGlsl } from './shaders/cities.vert.glsl.js';
import { source as fragGlsl } from './shaders/cities.frag.glsl.js';
import { DEFAULT_ELEVATION_SCALE } from '../globe/LandMaterial.js';
import { ATLAS_WIDTH, buildPolygonAtlas } from '../urban/PolygonAtlas.js';
const EARTH_RADIUS_KM = 6371;
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
export class CitiesLayer {
    mesh;
    uniforms;
    material;
    geometry;
    atlasTexture;
    constructor(world, urbanAreas) {
        const { nside, ordering } = world.getHealpixSpec();
        const count = urbanAreas.length;
        // One-time diagnostic — confirms the layer constructed with data.
        console.info(`[cities] constructing CitiesLayer with ${count} polygons`);
        let halfQuadSizeKm = 30; // sane fallback when no records arrived
        let atlasTex = null;
        let atlasMeta = [];
        if (count > 0) {
            const atlas = buildPolygonAtlas(urbanAreas);
            atlasTex = atlas.texture;
            atlasMeta = atlas.meta;
            // 10% headroom on top of the largest polygon so the falloff at the
            // polygon edge has room to fade before the quad clip.
            halfQuadSizeKm = atlas.maxHalfExtentKm * 1.1;
        }
        this.atlasTexture = atlasTex;
        const halfQuadSizeUnit = halfQuadSizeKm / EARTH_RADIUS_KM;
        this.uniforms = {
            uSunDirection: { value: new THREE.Vector3(1, 0, 0.3).normalize() },
            uIdRaster: { value: world.getIdRaster() },
            uHealpixNside: { value: nside },
            uHealpixOrdering: { value: ordering === 'ring' ? 0 : 1 },
            uAttrTexWidth: { value: 4 * nside },
            uElevationMeters: { value: world.getElevationMetersTexture() },
            uElevationScale: { value: DEFAULT_ELEVATION_SCALE },
            uCityRadialBias: { value: DEFAULT_CITY_RADIAL_BIAS },
            uHalfQuadSizeUnit: { value: halfQuadSizeUnit },
            uHalfQuadSizeKm: { value: halfQuadSizeKm },
            uPolyAtlas: { value: atlasTex },
            uPolyAtlasWidth: { value: ATLAS_WIDTH },
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
        this.geometry = new THREE.PlaneGeometry(1, 1);
        this.mesh = new THREE.InstancedMesh(this.geometry, this.material, Math.max(1, count));
        this.mesh.frustumCulled = false;
        this.mesh.renderOrder = 0;
        // Per-instance attribute layout. PIP requires (polyOffset, polyCount)
        // and the polygon's per-city half-extent so each fragment can clip to
        // its polygon's own bbox before the loop.
        const populations = new Float32Array(Math.max(1, count));
        const latLons = new Float32Array(Math.max(1, count) * 2);
        const seeds = new Float32Array(Math.max(1, count));
        const polyOffsetCount = new Float32Array(Math.max(1, count) * 2);
        const halfExtents = new Float32Array(Math.max(1, count) * 2);
        const dummy = new THREE.Object3D();
        for (let i = 0; i < count; i++) {
            const u = urbanAreas[i];
            const m = atlasMeta[i];
            populations[i] = u.pop;
            latLons[i * 2] = u.lat;
            latLons[i * 2 + 1] = u.lon;
            seeds[i] = u.id; // deterministic per-city seed, stable across re-bakes
            polyOffsetCount[i * 2] = m.polyOffset;
            polyOffsetCount[i * 2 + 1] = m.polyCount;
            halfExtents[i * 2] = m.halfExtentKm.x;
            halfExtents[i * 2 + 1] = m.halfExtentKm.y;
            // InstancedMesh wants a non-degenerate matrix per instance even
            // when the shader doesn't use it.
            dummy.position.set(0, 0, 0);
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            this.mesh.setMatrixAt(i, dummy.matrix);
        }
        this.mesh.count = count;
        this.geometry.setAttribute('aPopulation', new THREE.InstancedBufferAttribute(populations, 1));
        this.geometry.setAttribute('aLatLon', new THREE.InstancedBufferAttribute(latLons, 2));
        this.geometry.setAttribute('aPatternSeed', new THREE.InstancedBufferAttribute(seeds, 1));
        this.geometry.setAttribute('aPolyOffsetCount', new THREE.InstancedBufferAttribute(polyOffsetCount, 2));
        this.geometry.setAttribute('aHalfExtentKm', new THREE.InstancedBufferAttribute(halfExtents, 2));
        this.mesh.instanceMatrix.needsUpdate = true;
        if (count === 0) {
            this.mesh.visible = false;
        }
    }
    setSunDirection(dir) {
        this.uniforms.uSunDirection.value.copy(dir);
    }
    setActive(active) {
        this.mesh.visible = active && this.mesh.count > 0;
    }
    setElevationScale(v) {
        this.uniforms.uElevationScale.value = v;
    }
    setOpacity(v) {
        this.uniforms.uOpacity.value = v;
    }
    dispose() {
        this.geometry.dispose();
        this.material.dispose();
        this.atlasTexture?.dispose();
        this.mesh.dispose();
    }
}

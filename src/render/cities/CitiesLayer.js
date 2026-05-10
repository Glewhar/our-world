/**
 * Cities layer — instanced quads tangent to the globe, painted with an
 * organic spray of rectangular building blocks (dense downtown, thin
 * suburbs) and clipped at coastlines via the HEALPix id raster.
 *
 * One quad per city, all sized to the same world-space envelope; the
 * fragment shader masks the visible footprint by population radius +
 * coastline. No HEALPix integration for picking — picking still flows
 * through `world.pickFromRay` against the globe id raster.
 */
import * as THREE from 'three';
import { source as healpixGlsl } from '../globe/shaders/healpix.glsl.js';
import { source as vertGlsl } from './shaders/cities.vert.glsl.js';
import { source as fragGlsl } from './shaders/cities.frag.glsl.js';
import { DEFAULT_ELEVATION_SCALE } from '../globe/LandMaterial.js';
/** Mean Earth radius — the lever the layer uses to convert km → unit-sphere. */
const EARTH_RADIUS_KM = 6371;
/**
 * Radial bias applied on top of the elevation-matched lift, in unit-sphere
 * units. 5e-4 ≈ 3.2 km on real Earth — invisibly small at any reasonable
 * camera distance, but well past the 24-bit depth-buffer noise floor at
 * the surface so cities never z-fight with the displaced land mesh.
 */
const DEFAULT_CITY_RADIAL_BIAS = 5e-4;
const DEFAULT_UNIFORM_VALUES = {
    baseRadiusKm: 30,
    minRadiusKm: 5,
    maxRadiusKm: 80,
    minPopulation: 0,
    falloffStrength: 3.0,
    gridDensity: 10,
    blockThreshold: 0.25,
    outlineMin: 0.01,
    outlineMax: 0.06,
    nightBrightness: 1.5,
    dayContrast: 0.5,
    opacity: 0.65,
};
export class CitiesLayer {
    mesh;
    uniforms;
    material;
    geometry;
    constructor(world, cities) {
        const { nside, ordering } = world.getHealpixSpec();
        // Quad envelope: max city radius + 10% headroom so the radial-fade
        // edge doesn't kiss the quad boundary.
        const halfQuadSizeKm = DEFAULT_UNIFORM_VALUES.maxRadiusKm * 1.1;
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
            uMaxRadiusKm: { value: DEFAULT_UNIFORM_VALUES.maxRadiusKm },
            uBaseRadiusKm: { value: DEFAULT_UNIFORM_VALUES.baseRadiusKm },
            uMinRadiusKm: { value: DEFAULT_UNIFORM_VALUES.minRadiusKm },
            uMinPopulation: { value: DEFAULT_UNIFORM_VALUES.minPopulation },
            uFalloffStrength: { value: DEFAULT_UNIFORM_VALUES.falloffStrength },
            uGridDensity: { value: DEFAULT_UNIFORM_VALUES.gridDensity },
            uBlockThreshold: { value: DEFAULT_UNIFORM_VALUES.blockThreshold },
            uOutlineMin: { value: DEFAULT_UNIFORM_VALUES.outlineMin },
            uOutlineMax: { value: DEFAULT_UNIFORM_VALUES.outlineMax },
            uNightBrightness: { value: DEFAULT_UNIFORM_VALUES.nightBrightness },
            uDayContrast: { value: DEFAULT_UNIFORM_VALUES.dayContrast },
            uOpacity: { value: DEFAULT_UNIFORM_VALUES.opacity },
        };
        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            glslVersion: THREE.GLSL3,
            // Both stages call `healpixZPhiToPix` / `healpixIpixToTexel`:
            // the vertex stage to look up land elevation for the radial lift,
            // the fragment stage for the coastline mask. ShaderMaterial doesn't
            // process #include, so concatenate the helper module ourselves.
            vertexShader: `${healpixGlsl}\n${vertGlsl}`,
            fragmentShader: `${healpixGlsl}\n${fragGlsl}`,
            transparent: true,
            depthWrite: false,
            depthTest: true,
        });
        this.geometry = new THREE.PlaneGeometry(1, 1);
        // Per-instance attributes. We can't rely on `setMatrixAt` for the
        // tangent rotation because the shader builds the basis itself from
        // (lat, lon) — saves us from packing a 4x4 per instance and lets
        // the basis stay numerically aligned with the HEALPix lookup.
        const count = cities.length;
        this.mesh = new THREE.InstancedMesh(this.geometry, this.material, Math.max(1, count));
        this.mesh.frustumCulled = false;
        this.mesh.renderOrder = 0;
        const populations = new Float32Array(Math.max(1, count));
        const latLons = new Float32Array(Math.max(1, count) * 2);
        const seeds = new Float32Array(Math.max(1, count));
        const dummy = new THREE.Object3D();
        for (let i = 0; i < count; i++) {
            const c = cities[i];
            populations[i] = c.pop;
            latLons[i * 2] = c.lat;
            latLons[i * 2 + 1] = c.lon;
            // Stable per-city pattern seed — bit-mixed lat/lon so each city has
            // its own block layout that doesn't change frame-to-frame.
            seeds[i] = Math.abs(Math.sin(c.lat * 12.9898 + c.lon * 78.233) * 43758.5453123) % 1000;
            // InstancedMesh requires a per-instance matrix. We don't use the
            // translation/rotation in the shader, but Three.js still expects
            // each instance to have a non-degenerate transform; identity works.
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
    dispose() {
        this.geometry.dispose();
        this.material.dispose();
        this.mesh.dispose();
    }
}

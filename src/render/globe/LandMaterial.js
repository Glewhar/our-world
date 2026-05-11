/**
 * Land material — owns the land icosphere's shader pair.
 *
 * Split out of the previous unified `GlobeMaterial`. Drives the dry-land
 * icosphere: vertex displacement by `max(elevation_meters, 0)` and
 * fragment-shader land colouring (biome → elevation brightness → snow-line →
 * dynamic recolour). Ocean cells (`bodyId == 0`) discard in the fragment
 * shader — the separate `WaterMaterial` paints the water surface.
 *
 * Ocean colour uniforms (`uOceanDeep`/`uOceanShallow`) live on
 * `WaterMaterial` now. Everything else mirrors the old `GlobeUniforms`.
 *
 * `_landUniforms` is exposed (non-enumerable) so Tweakpane bindings and the
 * scene graph can poke uniforms by name without re-reaching into
 * `material.uniforms`.
 */
import * as THREE from 'three';
import { source as healpixGlsl } from './shaders/healpix.glsl.js';
import { source as vertGlsl } from './shaders/land.vert.glsl.js';
import { source as fragGlsl } from './shaders/land.frag.glsl.js';
/**
 * The renderer's altitude exaggeration is a single scalar `factor × BASE`
 * applied uniformly to every metres-based altitude in the project (terrain,
 * water level, clouds, cities, plane bow arcs, atmosphere shell).
 *
 * The Tweakpane "Altitude" slider exposes `factor ∈ [1, 10]`; everything
 * else is derived from it. `factor = 5` is the project baseline so the
 * slider feels symmetric (1× compresses toward physical scale, 10× doubles
 * the current exaggeration). At baseline, Mt. Everest renders at ~14% of
 * unit-radius — readable at orbital zoom without crossing into spike
 * territory.
 *
 * `DEFAULT_ELEVATION_SCALE` MUST match `WaterMaterial`'s value so the land
 * surface and water surface stay in vertical sync; the per-frame slider
 * push in the scene graph keeps both in sync at runtime.
 */
export const BASELINE_ALTITUDE_FACTOR = 5;
export const ELEVATION_SCALE_PER_FACTOR = 2.4e-6;
export const DEFAULT_ELEVATION_SCALE = BASELINE_ALTITUDE_FACTOR * ELEVATION_SCALE_PER_FACTOR;
/**
 * Atmosphere top in km above sea level. Drives the outer shell radius via
 * `atmosphereRadiusFromFactor` — the shell scales with the altitude factor
 * so the integration domain follows the exaggeration. At factor=5 this
 * gives outer ≈ 1.48. Halo-vs-terrain occlusion is handled by the depth
 * test in `AtmospherePass`, not by this radius.
 */
export const ATMOSPHERE_TOP_KM = 40;
export function elevationScaleFromFactor(factor) {
    return factor * ELEVATION_SCALE_PER_FACTOR;
}
/**
 * Per-biome amplitude defaults for the surface variation noise (one
 * entry per biome class 0..11). Indices follow `attrs.yaml`'s
 * `biome_class.esa_worldcover` mapping. Values are starting points for
 * the user to tune via Tweakpane; the array is copied into the uniform
 * so per-biome edits don't mutate this default.
 */
export const DEFAULT_BIOME_SURFACE_AMPS = [
    0.8, // 0  fallback / no-data
    0.7, // 1  tree cover (forest)
    0.6, // 2  shrubland
    0.5, // 3  grassland
    0.6, // 4  cropland
    0.4, // 5  built-up
    0.9, // 6  bare / sparse veg (desert)
    0.3, // 7  snow & ice
    0.7, // 8  permanent water
    0.4, // 9  herbaceous wetland
    0.6, // 10 mangroves
    1.0, // 11 moss & lichen / tundra / alpine
];
/**
 * Per-biome specular smoothness defaults. Snow & ice get real shine
 * (0.55), wet biomes (water, wetland, mangroves) get satin (0.30–0.40),
 * forests / crops a hint of wet-leaf gloss (0.06–0.10), deserts and
 * built-up stay matte. Tunable via Tweakpane.
 */
export const DEFAULT_BIOME_SPEC_AMPS = [
    0.05, // 0  fallback
    0.10, // 1  forest (subtle wet-leaf)
    0.04, // 2  shrubland
    0.06, // 3  grassland
    0.06, // 4  cropland
    0.05, // 5  built-up
    0.00, // 6  bare / desert (matte)
    0.40, // 7  snow & ice (real shine)
    0.20, // 8  permanent water
    0.15, // 9  herbaceous wetland
    0.12, // 10 mangroves
    0.20, // 11 tundra / lichen
];
/**
 * Atmosphere outer-shell radius. The atmosphere integrates from PLANET_RADIUS
 * (1.0, unit-sphere) up to this radius. Depth-buffer occlusion in the
 * atmosphere fragment shader keeps the halo from painting over the rendered
 * terrain silhouette — see `AtmospherePass`.
 */
export function atmosphereRadiusFromFactor(factor) {
    return 1.0 + ATMOSPHERE_TOP_KM * 1000 * elevationScaleFromFactor(factor);
}
export function createLandMaterial() {
    const uniforms = {
        uSunDirection: { value: new THREE.Vector3(1, 0, 0.3).normalize() },
        uNightTint: { value: new THREE.Color(0.08, 0.1, 0.16) },
        uAmbient: { value: 0.3 },
        uIdRaster: { value: null },
        uAttrStatic: { value: null },
        uAttrClimate: { value: null },
        uAttrDynamic: { value: null },
        uElevationMeters: { value: null },
        uElevationEquirect: { value: null },
        uDistanceField: { value: null },
        uBiomeColor: { value: null },
        uHealpixNside: { value: 1 },
        uHealpixOrdering: { value: 0 },
        uAttrTexWidth: { value: 1 },
        uElevationScale: { value: DEFAULT_ELEVATION_SCALE },
        uColorFire: { value: new THREE.Color('#1a1014') },
        uColorIce: { value: new THREE.Color('#d4ecff') },
        uColorInfection: { value: new THREE.Color('#bb33cc') },
        uColorPollution: { value: new THREE.Color('#7a6a3a') },
        uLerpStrength: { value: new THREE.Vector4(1, 1, 1, 1) },
        uBiomeStrength: { value: 0.85 },
        uSnowLineStrength: { value: 0.55 },
        uSeasonOffsetC: { value: 0.0 },
        uAlpineStrength: { value: 0.7 },
        uCoastSharpness: { value: 50.0 },
        // Within this many km of a biome boundary, blend toward a mipmap
        // sample of the prebaked biome COLOR map. The slider also picks the
        // mip LOD, so it controls both the blend distance AND the blur
        // radius. 0 = hard categorical cell edges.
        uBiomeEdgeSharpness: { value: 80.0 },
        uBiomeSurfaceStrength: { value: 1.0 },
        uBiomeColorVar: { value: 0.6 },
        uBiomeBumpStrength: { value: 0.6 },
        uBiomeNoiseFreq: { value: 12.0 },
        uBiomeSurfaceAmps: { value: new Float32Array(DEFAULT_BIOME_SURFACE_AMPS) },
        uBiomeSpecAmps: { value: new Float32Array(DEFAULT_BIOME_SPEC_AMPS) },
        uSpecularStrength: { value: 1.0 },
        uSkyView: { value: null },
        uHazeExposure: { value: 3.5 },
        uHazeAmount: { value: 0.7 },
        uHazeFalloffM: { value: 3000.0 },
    };
    // Three.js ShaderMaterial doesn't process GLSL `#include`, so the helper
    // module is concatenated by hand (vertex AND fragment use HEALPix lookups).
    const vertexShader = `${healpixGlsl}\n${vertGlsl}`;
    const fragmentShader = `${healpixGlsl}\n${fragGlsl}`;
    const material = new THREE.ShaderMaterial({
        uniforms,
        glslVersion: THREE.GLSL3,
        vertexShader,
        fragmentShader,
        // Alpha-to-coverage turns the distance-field coast smoothstep into an
        // MSAA coverage mask: ocean fragments (alpha ≈ 0) drop out so the
        // water mesh below shows through, and the few-km coast band gets
        // dithered across MSAA samples for a smooth shoreline. Plain alpha
        // blending would z-fight against the water mesh at coast vertices
        // (both sit at radius ≈ 1.0).
        alphaToCoverage: true,
    });
    Object.defineProperty(material, '_landUniforms', {
        value: uniforms,
        enumerable: false,
    });
    return material;
}

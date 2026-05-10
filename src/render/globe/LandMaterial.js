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
 * Atmosphere shell top in real-world km. The Hillaire LUTs map this onto
 * the unit-sphere via the elevation scale, so the atmosphere shell rises
 * with the altitude slider. 25 km comfortably encompasses long-haul trail
 * peaks (~16 km at factor=5) inside the rim glow, and roughly matches the
 * band where most visible Rayleigh blue lives — pushing closer to the
 * canonical 100 km TOA places the integration domain past any remaining
 * density, which has no visible effect.
 *
 * At factor=5 → atmosphere radius ≈ 1.30; at factor=1 → ≈ 1.06 (close to
 * the original stylised shell); at factor=10 → ≈ 1.60.
 */
export const ATMOSPHERE_TOP_KM = 25;
export function elevationScaleFromFactor(factor) {
    return factor * ELEVATION_SCALE_PER_FACTOR;
}
export function atmosphereRadiusFromFactor(factor) {
    return 1.0 + ATMOSPHERE_TOP_KM * 1000 * elevationScaleFromFactor(factor);
}
export function createLandMaterial() {
    const uniforms = {
        uSunDirection: { value: new THREE.Vector3(1, 0, 0.3).normalize() },
        uNightTint: { value: new THREE.Color(0.08, 0.10, 0.16) },
        uAmbient: { value: 0.30 },
        uIdRaster: { value: null },
        uAttrStatic: { value: null },
        uAttrClimate: { value: null },
        uAttrDynamic: { value: null },
        uElevationMeters: { value: null },
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
        // alpha-to-coverage uses the MSAA samples already enabled on the
        // PostFXChain composer to translate partial alpha into partial pixel
        // coverage. Lets the land's coast fade to invisible without the depth
        // ordering issues `transparent: true` would introduce.
        alphaToCoverage: true,
    });
    Object.defineProperty(material, '_landUniforms', {
        value: uniforms,
        enumerable: false,
    });
    return material;
}

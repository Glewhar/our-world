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

export type LandUniforms = {
  uSunDirection: { value: THREE.Vector3 };
  uNightTint: { value: THREE.Color };
  uAmbient: { value: number };

  uIdRaster: { value: THREE.DataTexture | null };
  uAttrStatic: { value: THREE.DataTexture | null };
  uAttrClimate: { value: THREE.DataTexture | null };
  uAttrDynamic: { value: THREE.DataTexture | null };
  uElevationMeters: { value: THREE.DataTexture | null };
  /**
   * Equirectangular R16F resample of `uElevationMeters`, baked once at
   * startup on the GPU. Sampled bilinearly by the fragment shader's
   * normal Sobel — gives a continuous per-pixel gradient instead of
   * the cell-aligned banding produced by `texelFetch` on the HEALPix
   * texture.
   */
  uElevationEquirect: { value: THREE.Texture | null };
  /**
   * Equirectangular RG16F distance field. R = signed km to coast
   * (positive on land); G = km to nearest biome boundary. Bilinear
   * filtering is what gives the shader sub-cell precision; null until
   * the bake ships, in which case the shader treats every pixel as
   * "deep land, far from any boundary".
   */
  uDistanceField: { value: THREE.DataTexture | null };
  /**
   * Equirectangular RGB biome COLOR map, baked once at startup from the
   * HEALPix biome IDs through the same palette the fragment shader uses
   * for the centre lookup. Sampled bilinearly to give smooth biome→biome
   * blends without requiring an extra disk artifact. Null falls back to
   * the centre HEALPix lookup unblended.
   */
  uBiomeColor: { value: THREE.Texture | null };

  uHealpixNside: { value: number };
  uHealpixOrdering: { value: number };
  uAttrTexWidth: { value: number };

  /** Unit-sphere displacement per metre of real elevation. */
  uElevationScale: { value: number };

  uColorFire: { value: THREE.Color };
  uColorIce: { value: THREE.Color };
  uColorInfection: { value: THREE.Color };
  uColorPollution: { value: THREE.Color };
  uLerpStrength: { value: THREE.Vector4 };

  uBiomeStrength: { value: number };
  uSnowLineStrength: { value: number };

  /**
   * Global temperature offset in °C added to every cell's baked annual-mean
   * temperature. 0 = baseline; negative = winter; positive = summer. Drives
   * the dynamic snow line + the hot/cold biome tints.
   */
  uSeasonOffsetC: { value: number };

  /**
   * Alpine thinning strength: 0 leaves biome colours untouched at altitude;
   * 1 fully blends to bare-rock grey-tan above ~4 km.
   */
  uAlpineStrength: { value: number };

  /**
   * Half-width (km) of the smoothstep that turns the signed distance-to-
   * coast into the fragment alpha. Smaller = razor coast; larger = soft
   * dissolve. Default 3 km gives a clean hairline at orbital zoom.
   */
  uCoastSharpness: { value: number };

  /**
   * Distance (km) over which the biome colour is interpolated toward a
   * neutral landfall tone at biome boundaries. 0 = no fade (hard
   * categorical edges); 50 = ~50 km of smooth blending.
   */
  uBiomeEdgeSharpness: { value: number };

  /**
   * Master gate for the per-biome procedural surface variation. 0 = the
   * shader skips the noise path entirely (zero-cost off); 1 = full
   * effect. Per-biome amps + the color/bump knobs scale within this.
   */
  uBiomeSurfaceStrength: { value: number };

  /** Color modulation strength of the biome noise (0..1). */
  uBiomeColorVar: { value: number };

  /** Fake-bump strength of the biome noise gradient (0..1). */
  uBiomeBumpStrength: { value: number };

  /**
   * Spatial frequency of the biome surface noise in unit-sphere
   * coordinates. ~12 gives detail at the moderate-zoom scale; bump up
   * for finer texture, down for broader patches.
   */
  uBiomeNoiseFreq: { value: number };

  /**
   * Per-biome-class amplitude (0..2) for the surface variation. Indexed
   * by biome ID 0..11. A 0 here suppresses variation on that biome only
   * (e.g. set [9] = 0 to keep ice clean while deserts get strong sand
   * patterns).
   */
  uBiomeSurfaceAmps: { value: Float32Array };

  /**
   * Per-biome-class specular smoothness (0..1) for the Blinn-Phong
   * highlight. 0 = pure Lambert; ~0.5 = strongly shiny. Snow & wet
   * biomes typically want real shine; deserts stay matte.
   */
  uBiomeSpecAmps: { value: Float32Array };

  /**
   * Master multiplier on the per-biome specular contribution. 0 disables
   * the highlight entirely; 1 is the design default; >1 overdrives.
   */
  uSpecularStrength: { value: number };

  /**
   * Sky-view LUT shared with the atmosphere pass. Sampled per-fragment in
   * the direction camera→surface to tint distant terrain toward the same
   * inscattered sky colour the rim halo shows — aerial perspective without
   * a postFX raymarch. Null until plumbed.
   */
  uSkyView: { value: THREE.Texture | null };

  /**
   * Exposure multiplier applied to the LUT sample before mixing. Should
   * track the atmosphere pass's exposure so haze colour matches the halo.
   */
  uHazeExposure: { value: number };

  /**
   * Aerial-perspective strength. 0 disables the tint; ~0.25 gives a clean
   * blue limb without crushing disc-centre colour.
   */
  uHazeAmount: { value: number };
};

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

export function elevationScaleFromFactor(factor: number): number {
  return factor * ELEVATION_SCALE_PER_FACTOR;
}

/**
 * Per-biome amplitude defaults for the surface variation noise (one
 * entry per biome class 0..11). Indices follow `attrs.yaml`'s
 * `biome_class.esa_worldcover` mapping. Values are starting points for
 * the user to tune via Tweakpane; the array is copied into the uniform
 * so per-biome edits don't mutate this default.
 */
export const DEFAULT_BIOME_SURFACE_AMPS: readonly number[] = [
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
export const DEFAULT_BIOME_SPEC_AMPS: readonly number[] = [
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
export function atmosphereRadiusFromFactor(factor: number): number {
  return 1.0 + ATMOSPHERE_TOP_KM * 1000 * elevationScaleFromFactor(factor);
}

export function createLandMaterial(): THREE.ShaderMaterial & {
  _landUniforms: LandUniforms;
} {
  const uniforms: LandUniforms = {
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
    uHazeAmount: { value: 0.25 },
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
  return material as THREE.ShaderMaterial & { _landUniforms: LandUniforms };
}

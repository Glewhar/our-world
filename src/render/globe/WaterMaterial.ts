/**
 * Water material — owns the water icosphere's shader pair.
 *
 * Split out of the previous unified `GlobeMaterial`. Drives a separate
 * water icosphere whose vertices are displaced by the per-cell
 * `water_level_meters` texture (R16F, init = 0 = sea level everywhere; sim
 * later raises cells for floods, tsunamis, sea-level rise).
 *
 * Fragment shader paints ocean depth tint then discards on dry-land cells
 * (`bodyId != 0u && waterSurface <= landElev`). This makes the water mesh
 * a real geometric surface that can rise per-cell, ready for transparency
 * and refraction work later.
 *
 * `uElevationScale` MUST match `LandMaterial`'s value — otherwise the
 * land terrain and water surface drift out of vertical sync.
 *
 * `_waterUniforms` is exposed (non-enumerable) so Tweakpane bindings and
 * the scene graph can poke uniforms by name without re-reaching into
 * `material.uniforms`.
 */

import * as THREE from 'three';

import { source as healpixGlsl } from './shaders/healpix.glsl.js';
import { source as wavesGlsl } from './shaders/water_waves.glsl.js';
import { source as vertGlsl } from './shaders/water.vert.glsl.js';
import { source as fragGlsl } from './shaders/water.frag.glsl.js';

import { DEFAULT_ELEVATION_SCALE } from './LandMaterial.js';

export type WaterUniforms = {
  uSunDirection: { value: THREE.Vector3 };
  uNightTint: { value: THREE.Color };
  uAmbient: { value: number };

  uIdRaster: { value: THREE.DataTexture | null };
  uElevationMeters: { value: THREE.DataTexture | null };
  uWaterLevelMeters: { value: THREE.DataTexture | null };

  uHealpixNside: { value: number };
  uHealpixOrdering: { value: number };
  uAttrTexWidth: { value: number };

  /** Unit-sphere displacement per metre of real elevation. MUST match LandMaterial. */
  uElevationScale: { value: number };
  /**
   * Tiny outward bias on the water shell so an init-zero water level (sea
   * level) sits a hair above any zero-elevation land cells, avoiding
   * z-fighting at coastlines while remaining visually imperceptible.
   */
  uWaterRadialBias: { value: number };

  uOceanAbyssal: { value: THREE.Color };
  uOceanDeep: { value: THREE.Color };
  uOceanShelf: { value: THREE.Color };
  uOceanShallow: { value: THREE.Color };
  /** Trench gate start depth (m). Below this, no abyssal mixed in. */
  uOceanTrenchStart: { value: number };
  /** Trench gate end depth (m). Above this, fully abyssal. */
  uOceanTrenchEnd: { value: number };
  /** Coastal sediment / chlorophyll cast — mixed over the shallowest band. */
  uCoastalTintColor: { value: THREE.Color };
  /** 0 disables the tint; 0.25 is the default subtle cast; 1 saturates. */
  uCoastalTintStrength: { value: number };
  /** Exponential falloff scale (m) for the coastal tint. 80 m by default. */
  uCoastalTintFalloff: { value: number };
  /** Exponential depth-falloff scale (m). depthT = exp(-depth / k).
   * Smaller = sharper/narrower shelves, larger = softer/wider shelves. */
  uDepthFalloff: { value: number };

  // M-water — Gerstner waves. `uTime` is driven by the scene-graph update
  // loop; the rest are exposed in Tweakpane (Materials → Ocean).
  uTime: { value: number };
  uWaveAmplitude: { value: number };
  uWaveSpeed: { value: number };
  uWaveSteepness: { value: number };
  uFresnelStrength: { value: number };

  // Surface ocean current visualisation — animated streamlines on the
  // water surface. `uOceanCurrents` is the RG16F equirectangular m/s
  // texture (null until the bake ships real bytes). `uCurrentStrength`
  // is the Tweakpane intensity slider; 0 disables, 1 is the default.
  uOceanCurrents: { value: THREE.DataTexture | null };
  uCurrentStrength: { value: number };
  /** Master on/off for the streamline overlay (0 = hidden, 1 = visible). */
  uStreamlinesEnabled: { value: number };
  /** When 1, the speed gate restricts streamlines to the major jets
   * (Gulf Stream / Kuroshio / ACC) only. 0 = gentle gate showing
   * most surface currents. */
  uStrongJetsOnly: { value: number };

  /**
   * Sky-view LUT shared with the atmosphere pass — see `LandUniforms.uSkyView`.
   * Same texture handle; both surface shaders tint toward the rim haze
   * the atmosphere already paints in the sky around the planet.
   */
  uSkyView: { value: THREE.Texture | null };

  /** Exposure multiplier on the LUT sample. Should track atmosphere exposure. */
  uHazeExposure: { value: number };

  /** Aerial-perspective haze strength. 0 disables; ~0.25 is the design default. */
  uHazeAmount: { value: number };
};

// 30 m of ocean rise. `bias_in_unit_sphere = metres * uElevationScale`,
// and `uElevationScale = 1.2e-5`, so 30 * 1.2e-5 = 3.6e-4.
export const DEFAULT_WATER_RADIAL_BIAS = 3.6e-4;

// Wave amplitude is in metres (same unit as `water_level_meters`); the
// shader scales by `uElevationScale` to land in the same visual regime as
// terrain bumps. 150 m × 1.2e-5 ≈ 0.18 % of unit radius — subtle silhouette
// rise. The "alive" feel comes from the fragment-side FBM ripple normal
// + tight sun glint, not from amplitude. Wave amplitude is also faded to
// zero at coasts (water depth < ~400 m) so coastlines stay calm.
export const DEFAULT_WAVE_AMPLITUDE_M = 150;
export const DEFAULT_WAVE_SPEED = 1.0;
export const DEFAULT_WAVE_STEEPNESS = 0.5;
export const DEFAULT_FRESNEL_STRENGTH = 1.0;

// Depth-falloff scale for the exponential ocean tint. depthT = exp(-depth / k).
// 25 gives very tight shelves — depthT drops to ~0.02 by 100 m of depth, so
// only the literal coast strip catches the shallow tint and everything else
// reads as deep. Tunable in Tweakpane (Materials → Ocean → depth falloff).
export const DEFAULT_DEPTH_FALLOFF_M = 50;

// Default ocean-current visualisation strength. 0 hides streamlines, 1 is
// "subtle but visible" — the streamlines are a low-contrast additive
// overlay on the day-side ocean, dimmed in shallow water and gated to
// cells where the current speed exceeds ~5 cm/s. Tunable from Tweakpane.
export const DEFAULT_CURRENT_STRENGTH = 1.0;

export function createWaterMaterial(): THREE.ShaderMaterial & {
  _waterUniforms: WaterUniforms;
} {
  const uniforms: WaterUniforms = {
    uSunDirection: { value: new THREE.Vector3(1, 0, 0.3).normalize() },
    uNightTint: { value: new THREE.Color(0.04, 0.05, 0.09) },
    uAmbient: { value: 0.18 },

    uIdRaster: { value: null },
    uElevationMeters: { value: null },
    uWaterLevelMeters: { value: null },

    uHealpixNside: { value: 1 },
    uHealpixOrdering: { value: 0 },
    uAttrTexWidth: { value: 1 },

    uElevationScale: { value: DEFAULT_ELEVATION_SCALE },
    uWaterRadialBias: { value: DEFAULT_WATER_RADIAL_BIAS },

    uOceanAbyssal: { value: new THREE.Color('#03081a') },
    uOceanDeep: { value: new THREE.Color('#143e7a') },
    uOceanShelf: { value: new THREE.Color('#1a6b95') },
    uOceanShallow: { value: new THREE.Color('#3da6c2') },
    uOceanTrenchStart: { value: 4500 },
    uOceanTrenchEnd: { value: 8000 },
    uCoastalTintColor: { value: new THREE.Color('#2d8c80') },
    uCoastalTintStrength: { value: 0.4 },
    uCoastalTintFalloff: { value: 400 },
    uDepthFalloff: { value: DEFAULT_DEPTH_FALLOFF_M },

    uTime: { value: 0 },
    uWaveAmplitude: { value: DEFAULT_WAVE_AMPLITUDE_M },
    uWaveSpeed: { value: DEFAULT_WAVE_SPEED },
    uWaveSteepness: { value: DEFAULT_WAVE_STEEPNESS },
    uFresnelStrength: { value: DEFAULT_FRESNEL_STRENGTH },
    uOceanCurrents: { value: null },
    uCurrentStrength: { value: DEFAULT_CURRENT_STRENGTH },
    uStreamlinesEnabled: { value: 1 },
    uStrongJetsOnly: { value: 0 },

    uSkyView: { value: null },
    uHazeExposure: { value: 3.5 },
    uHazeAmount: { value: 0.25 },
  };

  const vertexShader = `${healpixGlsl}\n${wavesGlsl}\n${vertGlsl}`;
  const fragmentShader = `${healpixGlsl}\n${wavesGlsl}\n${fragGlsl}`;

  const material = new THREE.ShaderMaterial({
    uniforms,
    glslVersion: THREE.GLSL3,
    vertexShader,
    fragmentShader,
  });
  Object.defineProperty(material, '_waterUniforms', {
    value: uniforms,
    enumerable: false,
  });
  return material as THREE.ShaderMaterial & { _waterUniforms: WaterUniforms };
}

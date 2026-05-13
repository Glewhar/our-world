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
// Shimmer-drift coupling to the current vector. The current m/s vector
// is multiplied by this factor and added once to the ripple-noise sample
// point — so jets read as a visibly distinct shimmer pattern from calm
// seas. The default is high (≈17) because the noise feature size at
// K=110 is small in noise-space and you need a sizeable offset to
// notice the jet patch is different.
export const DEFAULT_SHIMMER_CURRENT_DRIFT = 17;
// Depth-falloff scale for the exponential ocean tint. depthT = exp(-depth / k).
// 25 gives very tight shelves — depthT drops to ~0.02 by 100 m of depth, so
// only the literal coast strip catches the shallow tint and everything else
// reads as deep. Tunable in Tweakpane (Materials → Ocean → depth falloff).
export const DEFAULT_DEPTH_FALLOFF_M = 50;
// Default master scale for the current-speed tint. 0 hides the tint,
// 1 is "subtle but visible" — a low-contrast cool cast on the day-side
// ocean, faded toward shore and gated by speed so only the major jets
// (Gulf Stream / Kuroshio / ACC) light up at default settings.
export const DEFAULT_CURRENT_STRENGTH = 1.0;
export function createWaterMaterial() {
    const uniforms = {
        // Lighting uniforms are placeholders only — `scene-graph.applyTimeOfDay`
        // and `applyMaterials` overwrite them every frame. See LandMaterial.
        uSunDirection: { value: new THREE.Vector3(1, 0, 0.3).normalize() },
        uSunColor: { value: new THREE.Vector3(1, 1, 1) },
        uNightTint: { value: new THREE.Color(0, 0, 0) },
        uAmbient: { value: 0.2 },
        uIdRaster: { value: null },
        uElevationMeters: { value: null },
        uWaterLevelMeters: { value: null },
        uHealpixNside: { value: 1 },
        uHealpixOrdering: { value: 0 },
        uAttrTexWidth: { value: 1 },
        uElevationScale: { value: DEFAULT_ELEVATION_SCALE },
        uWaterRadialBias: { value: DEFAULT_WATER_RADIAL_BIAS },
        uOceanAbyssal: { value: new THREE.Color('#192551') },
        uOceanDeep: { value: new THREE.Color('#5b7cb7') },
        uOceanShelf: { value: new THREE.Color('#296aa7') },
        uOceanShallow: { value: new THREE.Color('#7bdbfa') },
        uOceanTrenchStart: { value: 2200 },
        uOceanTrenchEnd: { value: 7700 },
        uCoastalTintColor: { value: new THREE.Color('#ffffff') },
        uCoastalTintStrength: { value: 0.08 },
        uCoastalTintFalloff: { value: 400 },
        uDepthFalloff: { value: DEFAULT_DEPTH_FALLOFF_M },
        uTime: { value: 0 },
        uWaveAmplitude: { value: DEFAULT_WAVE_AMPLITUDE_M },
        uWaveSpeed: { value: DEFAULT_WAVE_SPEED },
        uWaveSteepness: { value: DEFAULT_WAVE_STEEPNESS },
        uFresnelStrength: { value: DEFAULT_FRESNEL_STRENGTH },
        uShimmerCurrentDrift: { value: DEFAULT_SHIMMER_CURRENT_DRIFT },
        uOceanCurrents: { value: null },
        uCurrentStrength: { value: DEFAULT_CURRENT_STRENGTH },
        uCurrentTintEnabled: { value: 1 },
        uShowMediumCurrents: { value: 0 },
        uSkyView: { value: null },
        uHazeExposure: { value: 3.5 },
        uHazeAmount: { value: 0.7 },
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
    return material;
}

/**
 * Sky-view LUT (200×100 RGBA16F) — pre-rendered atmosphere radiance per
 * (azimuth-from-sun, view-zenith). Re-rendered on `setSunDirection` and on
 * camera-position change. The runtime atmosphere fragment shader samples
 * this once per pixel instead of ray-marching.
 *
 * Sun-direction-dependent and camera-position-dependent — uniforms
 * `uCameraPos` and `uSunDirection` must be updated before each render.
 */

import * as THREE from 'three';

import { source as commonGlsl } from '../shaders/common.glsl.js';
import { source as vertGlsl } from '../shaders/fullscreen.vert.glsl.js';
import { source as fragGlsl } from '../shaders/lut-skyview.frag.glsl.js';

export const SKY_VIEW_LUT_WIDTH = 200;
export const SKY_VIEW_LUT_HEIGHT = 100;

export type SkyViewLutOptions = {
  rayleighScale?: number;
  mieScale?: number;
  solarIrradiance?: THREE.Vector3;
  atmosphereRadius?: number;
};

export function createSkyViewMaterial(
  transmittanceTex: THREE.Texture,
  multiScatteringTex: THREE.Texture,
  opts: SkyViewLutOptions = {},
): THREE.RawShaderMaterial {
  return new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: vertGlsl,
    fragmentShader: `${commonGlsl}\n${fragGlsl}`,
    uniforms: {
      uTransmittance: { value: transmittanceTex },
      uMultiScattering: { value: multiScatteringTex },
      uCameraPos: { value: new THREE.Vector3(3, 0, 0) },
      uSunDirection: { value: new THREE.Vector3(1, 0, 0.3).normalize() },
      uRayleighScale: { value: opts.rayleighScale ?? 1 },
      uMieScale: { value: opts.mieScale ?? 1 },
      uSolarIrradiance: {
        value: opts.solarIrradiance?.clone() ?? new THREE.Vector3(1.474, 1.8504, 1.91198),
      },
      uAtmosphereRadius: { value: opts.atmosphereRadius ?? 1.07 },
    },
    depthTest: false,
    depthWrite: false,
  });
}

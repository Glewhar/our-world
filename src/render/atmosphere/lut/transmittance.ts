/**
 * Transmittance LUT (256×64 RGBA16F) — pre-rendered once at boot.
 *
 * Each texel encodes `exp(-∫extinction·ds)` from a sample point at altitude
 * `h` in view direction `μ` (cos zenith) all the way to the top of the
 * atmosphere shell. Sun-direction independent. Used by both the
 * multi-scattering LUT pass and the runtime atmosphere fragment shader.
 */

import * as THREE from 'three';

import { source as commonGlsl } from '../shaders/common.glsl.js';
import { source as vertGlsl } from '../shaders/fullscreen.vert.glsl.js';
import { source as fragGlsl } from '../shaders/lut-transmittance.frag.glsl.js';

export const TRANSMITTANCE_LUT_WIDTH = 256;
export const TRANSMITTANCE_LUT_HEIGHT = 64;

export type TransmittanceLutOptions = {
  rayleighScale?: number;
  mieScale?: number;
  atmosphereRadius?: number;
};

export function createTransmittanceMaterial(
  opts: TransmittanceLutOptions = {},
): THREE.RawShaderMaterial {
  return new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: vertGlsl,
    fragmentShader: `${commonGlsl}\n${fragGlsl}`,
    uniforms: {
      uRayleighScale: { value: opts.rayleighScale ?? 1 },
      uMieScale: { value: opts.mieScale ?? 1 },
      uAtmosphereRadius: { value: opts.atmosphereRadius ?? 1.07 },
    },
    depthTest: false,
    depthWrite: false,
  });
}

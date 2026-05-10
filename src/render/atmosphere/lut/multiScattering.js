/**
 * Multi-scattering LUT (32×32 RGBA16F) — pre-rendered once at boot.
 *
 * Each texel encodes the multi-scattering contribution `F_ms` per
 * Hillaire 2020 §5.5 Eq. (10) at sample altitude `h` and sun-zenith cos
 * `μ_sun`. Reads the transmittance LUT to determine sun visibility from
 * each ray-march sample point.
 */
import * as THREE from 'three';
import { source as commonGlsl } from '../shaders/common.glsl.js';
import { source as vertGlsl } from '../shaders/fullscreen.vert.glsl.js';
import { source as fragGlsl } from '../shaders/lut-multiscattering.frag.glsl.js';
export const MULTI_SCATTERING_LUT_WIDTH = 32;
export const MULTI_SCATTERING_LUT_HEIGHT = 32;
export function createMultiScatteringMaterial(transmittanceTex, opts = {}) {
    return new THREE.RawShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: vertGlsl,
        fragmentShader: `${commonGlsl}\n${fragGlsl}`,
        uniforms: {
            uTransmittance: { value: transmittanceTex },
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

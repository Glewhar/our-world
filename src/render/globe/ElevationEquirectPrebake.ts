/**
 * ElevationEquirectPrebake — one-shot GPU pass that resamples the
 * HEALPix-indexed `uElevationMeters` texture into an equirectangular
 * R16F texture, sampled bilinearly by the land shader.
 *
 * Why: the land shader's per-fragment Sobel previously did `texelFetch`
 * on the HEALPix elevation texture. HEALPix texels aren't spatially
 * adjacent on the sphere, so hardware bilinear filtering is unusable —
 * the gradient kernel reads neighbours at cell granularity and produces
 * visible cell-grid lighting bands as fragments cross cell boundaries.
 *
 * The fix: bake the per-cell value into an equirect texture once at
 * startup, sample it bilinearly in the land shader. With a continuously-
 * filterable source the 4-tap Sobel produces a smooth per-pixel gradient
 * with no banding.
 *
 * Size: 4096 × 2048 — at 2π·6371/4096 ≈ 9.8 km/px equator pitch this is
 * slightly oversampled vs the ~6.4 km HEALPix cell pitch at Nside=1024,
 * which is exactly what bilinear filtering wants. Memory cost: ~16 MB
 * GPU at half-float.
 */

import * as THREE from 'three';

import { source as healpixGlsl } from './shaders/healpix.glsl.js';
import type { WorldRuntime } from '../../world/index.js';

const PREBAKE_WIDTH = 4096;
const PREBAKE_HEIGHT = 2048;

const VERT = /* glsl */ `
out vec2 vEquirectUv;
void main() {
  vEquirectUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const FRAG = /* glsl */ `
precision highp float;
precision highp int;
precision highp sampler2D;

in vec2 vEquirectUv;
out vec4 fragColor;

uniform sampler2D uElevationMeters;
uniform int uHealpixNside;
uniform int uHealpixOrdering;
uniform int uAttrTexWidth;

void main() {
  // Equirect UV → sphere direction → HEALPix cell. Same convention as
  // the land shader's sphereDirToEquirectUv inverse.
  float u = vEquirectUv.x;
  float v = vEquirectUv.y;
  float phi = u * 6.28318530 - 3.14159265;
  float theta = 1.5707963 - v * 3.14159265;
  float z = sin(theta);
  int ipx = healpixZPhiToPix(uHealpixNside, uHealpixOrdering, z, phi);
  ivec2 tx = healpixIpixToTexel(ipx, uAttrTexWidth);
  float elev = texelFetch(uElevationMeters, tx, 0).r;
  // R16F render target — only .r is read by the shader. Keep negative
  // ocean depths as-is so the consumer can decide how to clamp.
  fragColor = vec4(elev, 0.0, 0.0, 1.0);
}
`;

export function bakeElevationEquirectTexture(
  renderer: THREE.WebGLRenderer,
  world: WorldRuntime,
): THREE.Texture {
  const rt = new THREE.WebGLRenderTarget(PREBAKE_WIDTH, PREBAKE_HEIGHT, {
    format: THREE.RedFormat,
    type: THREE.HalfFloatType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    wrapS: THREE.RepeatWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    depthBuffer: false,
    stencilBuffer: false,
    generateMipmaps: false,
  });

  const { nside, ordering } = world.getHealpixSpec();
  const material = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: VERT,
    fragmentShader: `${healpixGlsl}\n${FRAG}`,
    uniforms: {
      uElevationMeters: { value: world.getElevationMetersTexture() },
      uHealpixNside: { value: nside },
      uHealpixOrdering: { value: ordering === 'ring' ? 0 : 1 },
      uAttrTexWidth: { value: 4 * nside },
    },
    depthTest: false,
    depthWrite: false,
  });

  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(quad);

  const prevTarget = renderer.getRenderTarget();
  renderer.setRenderTarget(rt);
  renderer.render(scene, cam);
  renderer.setRenderTarget(prevTarget);

  quad.geometry.dispose();
  material.dispose();

  return rt.texture;
}

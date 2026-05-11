/**
 * BiomeColorPrebake — one-shot GPU pass that turns the per-cell HEALPix
 * biome ID into a low-res equirectangular RGB color texture, sampled
 * bilinearly by the land shader for smooth biome→biome transitions.
 *
 * The land shader's HEALPix biome lookup is `texelFetch` — categorical,
 * not interpolatable. Doing a multi-tap blur in the land shader helps,
 * but every fragment inside the same HEALPix cell gets the same N-tap
 * average, so the average itself jumps in steps at every cell boundary.
 * Result: the cells stay visibly pixelated even with a blur.
 *
 * The fix is to bake biome → palette color into an equirect texture and
 * let the GPU's hardware bilinear filter do the smoothing. At 2048×1024
 * each pixel is ~20 km → bilinear gives a ~40 km blend band naturally,
 * with no shader cost beyond the `texture()` call.
 *
 * The pre-bake is one render pass at startup. It samples the same
 * `attribute_static` HEALPix texture the land shader does, so the
 * resulting color map is exactly consistent with the per-fragment biome
 * lookup the shader still uses for amp / per-biome logic.
 */

import * as THREE from 'three';

import { source as healpixGlsl } from './shaders/healpix.glsl.js';
import type { WorldRuntime } from '../../world/index.js';

// Power-of-two so the mipmap chain goes down cleanly. At LOD 0 the
// equirect pixel is πR/H ≈ 20 km, doubling at each subsequent level —
// the land shader picks a LOD from `uBiomeEdgeSharpness` so the slider
// controls the blur radius without any extra texture samples per
// fragment.
const PREBAKE_WIDTH = 2048;
const PREBAKE_HEIGHT = 1024;
const KM_PER_PIXEL_LOD0 = (Math.PI * 6371) / PREBAKE_HEIGHT;
export const BIOME_COLOR_KM_PER_PIXEL_LOD0 = KM_PER_PIXEL_LOD0;

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

uniform sampler2D uAttrStatic;
uniform int uHealpixNside;
uniform int uHealpixOrdering;
uniform int uAttrTexWidth;

vec3 biomePalette(int code) {
  if (code <= 0) return vec3(0.55, 0.5, 0.4);
  if (code == 1)  return vec3(0.157, 0.431, 0.235);
  if (code == 2)  return vec3(0.522, 0.541, 0.298);
  if (code == 3)  return vec3(0.553, 0.659, 0.345);
  if (code == 4)  return vec3(0.745, 0.706, 0.380);
  if (code == 5)  return vec3(0.451, 0.439, 0.424);
  if (code == 6)  return vec3(0.882, 0.765, 0.510);
  if (code == 7)  return vec3(0.882, 0.922, 0.961);
  if (code == 8)  return vec3(0.235, 0.510, 0.784);
  if (code == 9)  return vec3(0.353, 0.510, 0.431);
  if (code == 10) return vec3(0.235, 0.412, 0.314);
  if (code == 11) return vec3(0.706, 0.765, 0.784);
  return vec3(0.55, 0.5, 0.4);
}

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
  int biomeC = clamp(int(texelFetch(uAttrStatic, tx, 0).g * 255.0 + 0.5), 0, 11);
  // Water cells emit transparent black — premultiplied alpha. The land
  // shader unpremultiplies after sampling, so bilinear/mipmap filtering
  // near a coast naturally pulls land color toward the land-side average
  // instead of bleeding water blue into land fragments. Without this,
  // every coast picks up a teal/blue fringe at non-zero biomeEdgeSharpness
  // (and even at LOD 0 at fine coastline detail).
  if (biomeC == 8) {
    fragColor = vec4(0.0);
  } else {
    fragColor = vec4(biomePalette(biomeC), 1.0);
  }
}
`;

export function bakeBiomeColorTexture(
  renderer: THREE.WebGLRenderer,
  world: WorldRuntime,
): THREE.Texture {
  const rt = new THREE.WebGLRenderTarget(PREBAKE_WIDTH, PREBAKE_HEIGHT, {
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType,
    // Trilinear with mipmaps — the land shader picks a LOD from
    // uBiomeEdgeSharpness (km) so the slider controls the blur radius
    // for free at sample time.
    minFilter: THREE.LinearMipmapLinearFilter,
    magFilter: THREE.LinearFilter,
    wrapS: THREE.RepeatWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    depthBuffer: false,
    stencilBuffer: false,
    generateMipmaps: true,
  });

  const { nside, ordering } = world.getHealpixSpec();
  const material = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: VERT,
    fragmentShader: `${healpixGlsl}\n${FRAG}`,
    uniforms: {
      uAttrStatic: { value: world.getAttributeTexture('elevation') },
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

  // three.js allocates the mipmap chain when the render target is set
  // up but only writes mip 0 during render(). Generate the rest of the
  // chain explicitly so the shader's textureLod() actually pulls from
  // smaller, blurrier copies at higher LODs.
  const gl = renderer.getContext();
  const props = renderer.properties.get(rt.texture) as { __webglTexture?: WebGLTexture };
  if (props.__webglTexture) {
    const prevTex = gl.getParameter(gl.TEXTURE_BINDING_2D);
    gl.bindTexture(gl.TEXTURE_2D, props.__webglTexture);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, prevTex);
  }

  quad.geometry.dispose();
  material.dispose();

  return rt.texture;
}

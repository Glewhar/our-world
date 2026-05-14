/**
 * BiomeColorEquirect — pre-blurred biome-colour globe.
 *
 * Cells on the data side are HEALPix; sampling them per-fragment from the
 * land shader paints crisp cell edges between adjacent classes. To soften
 * those edges (and only those edges — the per-fragment elevation, snow,
 * wasteland tints stay sharp on top), we bake the palette into an
 * equirectangular colour texture, blur it once with a separable gaussian,
 * and let the land shader take a single bilinear sample.
 *
 * Two modes — the class auto-detects which by inspecting the world
 * runtime at construction time:
 *
 *   - **Ecoregion mode** (modern bake). Source = `attribute_eco` (RG8
 *     dense ecoregion index, 0..825). Palette = a 1D RGBA8 DataTexture
 *     of length `count + 1` built CPU-side from
 *     `biomePalette[14] × realmTint[8] × jitter`. The land surface
 *     shows 826 distinct visual classes from 14 hand-picked colours
 *     plus a few realm/jitter knobs.
 *
 *   - **Legacy 14-biome mode** (older bakes that didn't ship
 *     `attribute_eco`). Source = `attribute_static.G` (R8 biome ID,
 *     0..14). Palette = the existing 15-vec3 uniform array. Identical
 *     behaviour to pre-Phase-2.B.
 *
 * Three textures, two passes (both modes):
 *
 *   1. Index equirect: one-shot bake at startup. Maps every equirect
 *      texel to its HEALPix cell's class index. Texel-fetched
 *      (NearestFilter) so each tap reads a clean discrete index.
 *      Width = 4096, height = 2048. Format = R8 in legacy mode, RG8 in
 *      ecoregion mode (low byte → R, high byte → G; shader rebuilds
 *      `idx = r + g * 256`).
 *
 *   2. Horizontal blur (RGBA8, 4096×2048): for each output texel,
 *      sample (2k+1) index taps along the row, palette-look-up each,
 *      weighted-sum with a discrete gaussian.
 *
 *   3. Vertical blur (RGBA8, 4096×2048) = final colour: same kernel
 *      along the column, sampling the horizontal target.
 *
 * Rebuild trigger: a dirty bit set by the palette colour pickers, the
 * blur slider, or any future code path that mutates the per-cell index.
 * The two blur passes only run when the bit is set; the land shader
 * keeps reading the previous frame's final texture in between.
 *
 * Pole behaviour: equirect texels crowd the poles, so a fixed-texel-
 * radius kernel covers a smaller arc up there. Polar classes are
 * tundra/ice — they share a cold-grey tone with neighbours, so the
 * over-smoothing is invisible.
 */

import * as THREE from 'three';

import {
  buildEcoregionPalette,
  type EcoregionPaletteInputs,
  type RealmTint,
} from './ecoregionPalette.js';
import { source as healpixGlsl } from './shaders/healpix.glsl.js';
import type { EcoregionLookup, WorldRuntime } from '../../world/index.js';

const TEX_WIDTH = 4096;
const TEX_HEIGHT = 2048;
const LEGACY_PALETTE_SIZE = 15;

const FULLSCREEN_VERT = /* glsl */ `
out vec2 vEquirectUv;
void main() {
  vEquirectUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

// Legacy index bake — HEALPix attribute_static → equirect R8 biome ID.
const INDEX_BAKE_FRAG_LEGACY = /* glsl */ `
precision highp float;
precision highp int;
precision highp sampler2D;

in vec2 vEquirectUv;
out vec4 fragColor;

uniform sampler2D uAttrStatic;
uniform int uHealpixNside;
uniform int uHealpixOrdering;
uniform int uAttrTexWidth;

void main() {
  float u = vEquirectUv.x;
  float v = vEquirectUv.y;
  float phi = u * 6.28318530 - 3.14159265;
  float theta = 1.5707963 - v * 3.14159265;
  float z = sin(theta);
  int ipx = healpixZPhiToPix(uHealpixNside, uHealpixOrdering, z, phi);
  ivec2 tx = healpixIpixToTexel(ipx, uAttrTexWidth);
  // attribute_static.G stores the biome code in [0,1] (encoded as code/255).
  float biomeF = texelFetch(uAttrStatic, tx, 0).g;
  fragColor = vec4(biomeF, 0.0, 0.0, 1.0);
}
`;

// Ecoregion index bake — HEALPix attribute_eco → equirect RG8 dense ID.
// attribute_eco stores `idx = r + g * 256` per cell (little-endian uint16
// packed across two uint8 channels). We pass it through to the equirect
// target unchanged; the blur stage rebuilds the integer.
const INDEX_BAKE_FRAG_ECO = /* glsl */ `
precision highp float;
precision highp int;
precision highp sampler2D;

in vec2 vEquirectUv;
out vec4 fragColor;

uniform sampler2D uAttrEco;
uniform int uHealpixNside;
uniform int uHealpixOrdering;
uniform int uAttrTexWidth;

void main() {
  float u = vEquirectUv.x;
  float v = vEquirectUv.y;
  float phi = u * 6.28318530 - 3.14159265;
  float theta = 1.5707963 - v * 3.14159265;
  float z = sin(theta);
  int ipx = healpixZPhiToPix(uHealpixNside, uHealpixOrdering, z, phi);
  ivec2 tx = healpixIpixToTexel(ipx, uAttrTexWidth);
  vec2 lohi = texelFetch(uAttrEco, tx, 0).rg;
  fragColor = vec4(lohi.r, lohi.g, 0.0, 1.0);
}
`;

// Legacy horizontal blur — palette-uniform path with 15 entries.
const H_BLUR_FRAG_LEGACY = /* glsl */ `
precision highp float;
precision highp int;
precision highp sampler2D;

in vec2 vEquirectUv;
out vec4 fragColor;

uniform sampler2D uIndexEquirect;
uniform vec3 uPalette[${LEGACY_PALETTE_SIZE}];
uniform int uKernelHalf;
uniform float uSigma;
uniform int uTexWidth;
uniform int uTexHeight;

vec3 paletteAt(int idx) {
  if (idx <= 0)  return uPalette[0];
  if (idx == 1)  return uPalette[1];
  if (idx == 2)  return uPalette[2];
  if (idx == 3)  return uPalette[3];
  if (idx == 4)  return uPalette[4];
  if (idx == 5)  return uPalette[5];
  if (idx == 6)  return uPalette[6];
  if (idx == 7)  return uPalette[7];
  if (idx == 8)  return uPalette[8];
  if (idx == 9)  return uPalette[9];
  if (idx == 10) return uPalette[10];
  if (idx == 11) return uPalette[11];
  if (idx == 12) return uPalette[12];
  if (idx == 13) return uPalette[13];
  return uPalette[14];
}

void main() {
  ivec2 base = ivec2(vEquirectUv * vec2(float(uTexWidth), float(uTexHeight)));
  int kH = uKernelHalf;

  vec3 acc = vec3(0.0);
  float wsum = 0.0;
  float invTwoSig2 = (uSigma > 0.0) ? 1.0 / (2.0 * uSigma * uSigma) : 0.0;

  for (int i = -64; i <= 64; i++) {
    if (i < -kH || i > kH) continue;
    int u = base.x + i;
    u = (u % uTexWidth + uTexWidth) % uTexWidth;
    float idxF = texelFetch(uIndexEquirect, ivec2(u, base.y), 0).r;
    int idx = int(idxF * 255.0 + 0.5);
    if (idx < 0) idx = 0;
    if (idx > 14) idx = 14;
    float w = (uSigma > 0.0)
      ? exp(-float(i * i) * invTwoSig2)
      : (i == 0 ? 1.0 : 0.0);
    acc += paletteAt(idx) * w;
    wsum += w;
  }
  fragColor = vec4(acc / max(wsum, 1e-6), 1.0);
}
`;

// Ecoregion horizontal blur — palette is a 1D RGBA8 texture; index is
// reconstructed from RG8 of the index equirect. Same gaussian shape as
// the legacy path; only the palette source and index decode change.
const H_BLUR_FRAG_ECO = /* glsl */ `
precision highp float;
precision highp int;
precision highp sampler2D;

in vec2 vEquirectUv;
out vec4 fragColor;

uniform sampler2D uIndexEquirect;
uniform sampler2D uPaletteTex;
uniform int uPaletteSize;
uniform int uKernelHalf;
uniform float uSigma;
uniform int uTexWidth;
uniform int uTexHeight;

vec3 paletteAt(int idx) {
  if (idx < 0) idx = 0;
  if (idx > uPaletteSize - 1) idx = uPaletteSize - 1;
  return texelFetch(uPaletteTex, ivec2(idx, 0), 0).rgb;
}

void main() {
  ivec2 base = ivec2(vEquirectUv * vec2(float(uTexWidth), float(uTexHeight)));
  int kH = uKernelHalf;

  vec3 acc = vec3(0.0);
  float wsum = 0.0;
  float invTwoSig2 = (uSigma > 0.0) ? 1.0 / (2.0 * uSigma * uSigma) : 0.0;

  for (int i = -64; i <= 64; i++) {
    if (i < -kH || i > kH) continue;
    int u = base.x + i;
    u = (u % uTexWidth + uTexWidth) % uTexWidth;
    vec2 lohi = texelFetch(uIndexEquirect, ivec2(u, base.y), 0).rg;
    int idx = int(lohi.r * 255.0 + 0.5) | (int(lohi.g * 255.0 + 0.5) << 8);
    float w = (uSigma > 0.0)
      ? exp(-float(i * i) * invTwoSig2)
      : (i == 0 ? 1.0 : 0.0);
    acc += paletteAt(idx) * w;
    wsum += w;
  }
  fragColor = vec4(acc / max(wsum, 1e-6), 1.0);
}
`;

// Vertical blur — same in both modes (it samples the H-blur RGBA8
// target, not the index equirect).
const V_BLUR_FRAG = /* glsl */ `
precision highp float;
precision highp int;
precision highp sampler2D;

in vec2 vEquirectUv;
out vec4 fragColor;

uniform sampler2D uHorizontal;
uniform int uKernelHalf;
uniform float uSigma;
uniform int uTexWidth;
uniform int uTexHeight;

void main() {
  ivec2 base = ivec2(vEquirectUv * vec2(float(uTexWidth), float(uTexHeight)));
  int kH = uKernelHalf;

  vec3 acc = vec3(0.0);
  float wsum = 0.0;
  float invTwoSig2 = (uSigma > 0.0) ? 1.0 / (2.0 * uSigma * uSigma) : 0.0;

  for (int i = -64; i <= 64; i++) {
    if (i < -kH || i > kH) continue;
    int v = base.y + i;
    if (v < 0) v = 0;
    if (v > uTexHeight - 1) v = uTexHeight - 1;
    vec3 c = texelFetch(uHorizontal, ivec2(base.x, v), 0).rgb;
    float w = (uSigma > 0.0)
      ? exp(-float(i * i) * invTwoSig2)
      : (i == 0 ? 1.0 : 0.0);
    acc += c * w;
    wsum += w;
  }
  fragColor = vec4(acc / max(wsum, 1e-6), 1.0);
}
`;

// Maximum half-kernel width the shader unrolls. 64 texels at the equator
// (4096 px around 360°) ≈ 5.6° — matches the slider's 5° max with a
// touch of headroom.
const MAX_KERNEL_HALF = 64;

function paletteHash(palette: readonly THREE.Color[]): string {
  let s = '';
  for (let i = 0; i < palette.length; i++) {
    const c = palette[i];
    if (!c) continue;
    s += `${(c.r * 1000) | 0}.${(c.g * 1000) | 0}.${(c.b * 1000) | 0}|`;
  }
  return s;
}

function realmTintHash(tints: readonly RealmTint[]): string {
  let s = '';
  for (let i = 0; i < tints.length; i++) {
    const t = tints[i];
    if (!t) continue;
    s += `${(t.dHue * 100) | 0}.${(t.satMult * 1000) | 0}.${(t.valMult * 1000) | 0}|`;
  }
  return s;
}

export type EcoTuning = {
  /** Hex strings from `state.materials.globe.biomePalette` (length 15). */
  biomePalette: readonly string[];
  /** Per-realm HSV tint table (length 9; slot 0 unused). */
  realmTint: readonly RealmTint[];
  /** 0..1 strength of the per-ecoregion deterministic HSV wobble. */
  ecoregionJitter: number;
};

export class BiomeColorEquirect {
  private indexRT: THREE.WebGLRenderTarget;
  private hBlurRT: THREE.WebGLRenderTarget;
  private finalRT: THREE.WebGLRenderTarget;

  private hMat: THREE.ShaderMaterial;
  private vMat: THREE.ShaderMaterial;
  private indexMat: THREE.ShaderMaterial;

  private quadScene: THREE.Scene;
  private quadCam: THREE.OrthographicCamera;
  private quadMesh: THREE.Mesh;

  private dirty = true;
  private indexBaked = false;
  private currentBlurDeg = -1;
  private cachedPaletteHash = '';
  private cachedRealmHash = '';
  private cachedJitter = -1;

  /** True if the runtime shipped the new ecoregion artifacts. */
  private readonly ecoMode: boolean;
  private readonly ecoLookup: EcoregionLookup | null;
  private paletteTexture: THREE.DataTexture | null = null;

  constructor(world: WorldRuntime) {
    const ecoTex = world.getEcoregionTexture();
    const ecoLookup = world.getEcoregionLookup();
    this.ecoMode = !!(ecoTex && ecoLookup);
    this.ecoLookup = ecoLookup;

    // Index equirect: R8 in legacy mode, RG8 in ecoregion mode.
    this.indexRT = new THREE.WebGLRenderTarget(TEX_WIDTH, TEX_HEIGHT, {
      format: this.ecoMode ? THREE.RGFormat : THREE.RedFormat,
      type: THREE.UnsignedByteType,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      wrapS: THREE.RepeatWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      depthBuffer: false,
      stencilBuffer: false,
      generateMipmaps: false,
    });
    this.hBlurRT = new THREE.WebGLRenderTarget(TEX_WIDTH, TEX_HEIGHT, {
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.RepeatWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      depthBuffer: false,
      stencilBuffer: false,
      generateMipmaps: false,
    });
    this.finalRT = new THREE.WebGLRenderTarget(TEX_WIDTH, TEX_HEIGHT, {
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.RepeatWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      depthBuffer: false,
      stencilBuffer: false,
      generateMipmaps: false,
    });

    const { nside, ordering } = world.getHealpixSpec();

    if (this.ecoMode && ecoTex) {
      this.indexMat = new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: FULLSCREEN_VERT,
        fragmentShader: `${healpixGlsl}\n${INDEX_BAKE_FRAG_ECO}`,
        uniforms: {
          uAttrEco: { value: ecoTex },
          uHealpixNside: { value: nside },
          uHealpixOrdering: { value: ordering === 'ring' ? 0 : 1 },
          uAttrTexWidth: { value: 4 * nside },
        },
        depthTest: false,
        depthWrite: false,
      });
    } else {
      this.indexMat = new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: FULLSCREEN_VERT,
        fragmentShader: `${healpixGlsl}\n${INDEX_BAKE_FRAG_LEGACY}`,
        uniforms: {
          uAttrStatic: { value: world.getAttributeTexture('elevation') },
          uHealpixNside: { value: nside },
          uHealpixOrdering: { value: ordering === 'ring' ? 0 : 1 },
          uAttrTexWidth: { value: 4 * nside },
        },
        depthTest: false,
        depthWrite: false,
      });
    }

    if (this.ecoMode && ecoLookup) {
      // Ecoregion mode: palette comes from a 1D DataTexture rebuilt on
      // each tuning change. Allocate the buffer once at the right size.
      const w = ecoLookup.count + 1;
      this.paletteTexture = new THREE.DataTexture(
        new Uint8Array(w * 4) as Uint8Array<ArrayBuffer>,
        w,
        1,
        THREE.RGBAFormat,
        THREE.UnsignedByteType,
      );
      this.paletteTexture.minFilter = THREE.NearestFilter;
      this.paletteTexture.magFilter = THREE.NearestFilter;
      this.paletteTexture.wrapS = THREE.ClampToEdgeWrapping;
      this.paletteTexture.wrapT = THREE.ClampToEdgeWrapping;
      this.paletteTexture.needsUpdate = true;

      this.hMat = new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: FULLSCREEN_VERT,
        fragmentShader: H_BLUR_FRAG_ECO,
        uniforms: {
          uIndexEquirect: { value: this.indexRT.texture },
          uPaletteTex: { value: this.paletteTexture },
          uPaletteSize: { value: w },
          uKernelHalf: { value: 0 },
          uSigma: { value: 0 },
          uTexWidth: { value: TEX_WIDTH },
          uTexHeight: { value: TEX_HEIGHT },
        },
        depthTest: false,
        depthWrite: false,
      });
    } else {
      const paletteUniform: THREE.Vector3[] = [];
      for (let i = 0; i < LEGACY_PALETTE_SIZE; i++) {
        paletteUniform.push(new THREE.Vector3(0, 0, 0));
      }
      this.hMat = new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: FULLSCREEN_VERT,
        fragmentShader: H_BLUR_FRAG_LEGACY,
        uniforms: {
          uIndexEquirect: { value: this.indexRT.texture },
          uPalette: { value: paletteUniform },
          uKernelHalf: { value: 0 },
          uSigma: { value: 0 },
          uTexWidth: { value: TEX_WIDTH },
          uTexHeight: { value: TEX_HEIGHT },
        },
        depthTest: false,
        depthWrite: false,
      });
    }

    this.vMat = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: V_BLUR_FRAG,
      uniforms: {
        uHorizontal: { value: this.hBlurRT.texture },
        uKernelHalf: { value: 0 },
        uSigma: { value: 0 },
        uTexWidth: { value: TEX_WIDTH },
        uTexHeight: { value: TEX_HEIGHT },
      },
      depthTest: false,
      depthWrite: false,
    });

    this.quadScene = new THREE.Scene();
    this.quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quadMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.indexMat);
    this.quadScene.add(this.quadMesh);
  }

  /** Texture handed to the land shader. Stable reference; contents update on rebuild. */
  get colorTexture(): THREE.Texture {
    return this.finalRT.texture;
  }

  markDirty(): void {
    this.dirty = true;
  }

  markIndexDirty(): void {
    this.indexBaked = false;
    this.dirty = true;
  }

  /**
   * Run the blur passes if dirty. Called once per frame from the scene
   * graph; cheap when nothing changed.
   *
   * `palette` is the 14-biome palette (15 entries with the no-data
   * fallback). In ecoregion mode `eco` carries the realm-tint table and
   * jitter strength used to compose the 826-entry palette texture; the
   * legacy biome colours still drive the per-ecoregion HSV bases. In
   * legacy mode `eco` is ignored.
   */
  rebuildIfDirty(
    renderer: THREE.WebGLRenderer,
    palette: readonly THREE.Color[],
    blurDeg: number,
    eco?: EcoTuning,
  ): void {
    const hash = paletteHash(palette);
    if (hash !== this.cachedPaletteHash) this.dirty = true;
    if (blurDeg !== this.currentBlurDeg) this.dirty = true;
    if (this.ecoMode && eco) {
      const rHash = realmTintHash(eco.realmTint);
      if (rHash !== this.cachedRealmHash) this.dirty = true;
      if (eco.ecoregionJitter !== this.cachedJitter) this.dirty = true;
    }
    if (!this.dirty) return;
    this.cachedPaletteHash = hash;

    const prevTarget = renderer.getRenderTarget();

    if (!this.indexBaked) {
      this.quadMesh.material = this.indexMat;
      renderer.setRenderTarget(this.indexRT);
      renderer.render(this.quadScene, this.quadCam);
      this.indexBaked = true;
    }

    const halfWidth = Math.min(
      MAX_KERNEL_HALF,
      Math.max(0, Math.round((blurDeg / 360.0) * TEX_WIDTH)),
    );
    const sigma = halfWidth > 0 ? halfWidth / 2.5 : 0;

    if (this.ecoMode && this.ecoLookup && this.paletteTexture && eco) {
      // Recompose the 1D palette texture from the current biome
      // colours, realm tints, and jitter strength. ~1 ms on 825 entries.
      const inputs: EcoregionPaletteInputs = {
        biomePalette: eco.biomePalette,
        realmTint: eco.realmTint,
        ecoregionJitter: eco.ecoregionJitter,
        biomeOf: this.ecoLookup.biome,
        realmOf: this.ecoLookup.realm,
      };
      const bytes = buildEcoregionPalette(inputs);
      const dst = this.paletteTexture.image.data as Uint8Array;
      dst.set(bytes);
      this.paletteTexture.needsUpdate = true;
      this.cachedRealmHash = realmTintHash(eco.realmTint);
      this.cachedJitter = eco.ecoregionJitter;
    } else {
      // Legacy path: push the 15-entry vec3 palette directly.
      const pUni = this.hMat.uniforms['uPalette']!.value as THREE.Vector3[];
      for (let i = 0; i < LEGACY_PALETTE_SIZE; i++) {
        const c = palette[i];
        if (c) pUni[i]!.set(c.r, c.g, c.b);
      }
    }

    this.hMat.uniforms['uKernelHalf']!.value = halfWidth;
    this.hMat.uniforms['uSigma']!.value = sigma;

    this.quadMesh.material = this.hMat;
    renderer.setRenderTarget(this.hBlurRT);
    renderer.render(this.quadScene, this.quadCam);

    this.vMat.uniforms['uKernelHalf']!.value = halfWidth;
    this.vMat.uniforms['uSigma']!.value = sigma;

    this.quadMesh.material = this.vMat;
    renderer.setRenderTarget(this.finalRT);
    renderer.render(this.quadScene, this.quadCam);

    renderer.setRenderTarget(prevTarget);

    this.currentBlurDeg = blurDeg;
    this.dirty = false;
  }

  dispose(): void {
    this.indexRT.dispose();
    this.hBlurRT.dispose();
    this.finalRT.dispose();
    this.indexMat.dispose();
    this.hMat.dispose();
    this.vMat.dispose();
    this.quadMesh.geometry.dispose();
    if (this.paletteTexture) this.paletteTexture.dispose();
  }
}

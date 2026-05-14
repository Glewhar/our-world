/**
 * BiomeOverrideEquirect — pre-blurred climate-scenario override.
 *
 * The climate-scenario override paints a different biome colour onto cells
 * the scenario has selected (e.g. ice age turns tundra/boreal to ice id 15).
 * This module bakes the override into a 4096×2048 RGBA8 equirect and blurs
 * it with the same separable gaussian as the base biome path:
 *
 *   RGB = blurred `paletteAt(overrideClass[cell])`
 *   A   = blurred `stampWeight[cell]`
 *
 * The LAND shader samples once bilinearly; `tStart01` stays per-cell HEALPix
 * because the visible mask is `stampWeight × cellEnv` and the blurred
 * `stampWeight` already feathers smoothly to 0 at the stamp's edge.
 *
 * Rebuild trigger: dirty when any of
 *   - palette colours change (live Tweakpane edit)
 *   - blur degrees change (slider)
 *   - override class or stamp textures change (scenario start/end/repeat)
 * The two blur passes only run when the bit is set; in steady state with
 * no scenario active, this is a near-free per-frame check.
 *
 * Cold start (no scenario): the override class/stamp textures are still
 * allocated as zeros — the bake produces RGB = fallback colour, A = 0,
 * and the LAND shader's `uClimateEnvelope > 0` gate keeps the texture
 * untouched. No cost paid for the override path when nothing is active.
 */
import * as THREE from 'three';
import { PALETTE_AT_GLSL } from './paletteAt.glsl.js';
import { source as healpixGlsl } from './shaders/healpix.glsl.js';
const TEX_WIDTH = 4096;
const TEX_HEIGHT = 2048;
const PALETTE_SIZE = 16;
const MAX_KERNEL_HALF = 64;
const FULLSCREEN_VERT = /* glsl */ `
out vec2 vEquirectUv;
void main() {
  vEquirectUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;
// Index bake — HEALPix override class (RG8) + stamp (RGBA8) → equirect.
//   R = override class id / 255  (.r for slot 0, .g for slot 1)
//   G = stamp weight              (.r for slot 0, .b for slot 1)
// tStart01 stays HEALPix; the LAND shader still reads it via texelFetch.
const INDEX_BAKE_FRAG = /* glsl */ `
precision highp float;
precision highp int;
precision highp sampler2D;

in vec2 vEquirectUv;
out vec4 fragColor;

uniform sampler2D uOverrideClass;
uniform sampler2D uOverrideStamp;
uniform int uHealpixNside;
uniform int uHealpixOrdering;
uniform int uAttrTexWidth;
uniform int uSlot;

void main() {
  float u = vEquirectUv.x;
  float v = vEquirectUv.y;
  float phi = u * 6.28318530 - 3.14159265;
  float theta = 1.5707963 - v * 3.14159265;
  float z = sin(theta);
  int ipx = healpixZPhiToPix(uHealpixNside, uHealpixOrdering, z, phi);
  ivec2 tx = healpixIpixToTexel(ipx, uAttrTexWidth);
  vec2 cls2 = texelFetch(uOverrideClass, tx, 0).rg;
  vec4 stamp = texelFetch(uOverrideStamp, tx, 0);
  float cls = uSlot == 0 ? cls2.r : cls2.g;
  float weight = uSlot == 0 ? stamp.r : stamp.b;
  fragColor = vec4(cls, weight, 0.0, 1.0);
}
`;
// Horizontal blur — for each tap, paletteAt(classId) gives the colour;
// stampWeight blurs as a scalar. Output RGBA8 packs both: RGB = colour,
// A = stampWeight.
const H_BLUR_FRAG = /* glsl */ `
precision highp float;
precision highp int;
precision highp sampler2D;

in vec2 vEquirectUv;
out vec4 fragColor;

uniform sampler2D uIndexEquirect;
uniform vec3 uPalette[${PALETTE_SIZE}];
uniform int uKernelHalf;
uniform float uSigma;
uniform int uTexWidth;
uniform int uTexHeight;
${PALETTE_AT_GLSL}
void main() {
  ivec2 base = ivec2(vEquirectUv * vec2(float(uTexWidth), float(uTexHeight)));
  int kH = uKernelHalf;

  vec3 accColor = vec3(0.0);
  float accWeight = 0.0;
  float wsum = 0.0;
  float invTwoSig2 = (uSigma > 0.0) ? 1.0 / (2.0 * uSigma * uSigma) : 0.0;

  for (int i = -64; i <= 64; i++) {
    if (i < -kH || i > kH) continue;
    int u = base.x + i;
    u = (u % uTexWidth + uTexWidth) % uTexWidth;
    vec2 cw = texelFetch(uIndexEquirect, ivec2(u, base.y), 0).rg;
    int idx = int(cw.r * 255.0 + 0.5);
    if (idx < 0) idx = 0;
    if (idx > 15) idx = 15;
    float w = (uSigma > 0.0)
      ? exp(-float(i * i) * invTwoSig2)
      : (i == 0 ? 1.0 : 0.0);
    accColor += paletteAt(idx) * w;
    accWeight += cw.g * w;
    wsum += w;
  }
  float inv = 1.0 / max(wsum, 1e-6);
  fragColor = vec4(accColor * inv, accWeight * inv);
}
`;
// Vertical blur — samples the H-blur RGBA8 target, gaussian over rows.
// Both colour (RGB) and stampWeight (A) blur with the same kernel.
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

  vec4 acc = vec4(0.0);
  float wsum = 0.0;
  float invTwoSig2 = (uSigma > 0.0) ? 1.0 / (2.0 * uSigma * uSigma) : 0.0;

  for (int i = -64; i <= 64; i++) {
    if (i < -kH || i > kH) continue;
    int v = base.y + i;
    if (v < 0) v = 0;
    if (v > uTexHeight - 1) v = uTexHeight - 1;
    vec4 c = texelFetch(uHorizontal, ivec2(base.x, v), 0);
    float w = (uSigma > 0.0)
      ? exp(-float(i * i) * invTwoSig2)
      : (i == 0 ? 1.0 : 0.0);
    acc += c * w;
    wsum += w;
  }
  fragColor = acc / max(wsum, 1e-6);
}
`;
function paletteHash(palette) {
    let s = '';
    for (let i = 0; i < palette.length; i++) {
        const c = palette[i];
        if (!c)
            continue;
        s += `${(c.r * 1000) | 0}.${(c.g * 1000) | 0}.${(c.b * 1000) | 0}|`;
    }
    return s;
}
export class BiomeOverrideEquirect {
    indexRT;
    hBlurRT;
    finalRT;
    indexMat;
    hMat;
    vMat;
    quadScene;
    quadCam;
    quadMesh;
    dirty = true;
    indexBaked = false;
    currentBlurDeg = -1;
    cachedPaletteHash = '';
    cachedClassVersion = -1;
    cachedStampVersion = -1;
    overrideClassTex = null;
    overrideStampTex = null;
    slot;
    constructor(world, slot = 0) {
        this.slot = slot;
        this.overrideClassTex = world.getBiomeOverrideTexture?.() ?? null;
        this.overrideStampTex = world.getBiomeOverrideStampTexture?.() ?? null;
        // Index equirect: RG8 (R = class, G = stampWeight).
        this.indexRT = new THREE.WebGLRenderTarget(TEX_WIDTH, TEX_HEIGHT, {
            format: THREE.RGFormat,
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
        this.indexMat = new THREE.ShaderMaterial({
            glslVersion: THREE.GLSL3,
            vertexShader: FULLSCREEN_VERT,
            fragmentShader: `${healpixGlsl}\n${INDEX_BAKE_FRAG}`,
            uniforms: {
                uOverrideClass: { value: this.overrideClassTex },
                uOverrideStamp: { value: this.overrideStampTex },
                uHealpixNside: { value: nside },
                uHealpixOrdering: { value: ordering === 'ring' ? 0 : 1 },
                uAttrTexWidth: { value: 4 * nside },
                uSlot: { value: slot },
            },
            depthTest: false,
            depthWrite: false,
        });
        const paletteUniform = [];
        for (let i = 0; i < PALETTE_SIZE; i++) {
            paletteUniform.push(new THREE.Vector3(0, 0, 0));
        }
        this.hMat = new THREE.ShaderMaterial({
            glslVersion: THREE.GLSL3,
            vertexShader: FULLSCREEN_VERT,
            fragmentShader: H_BLUR_FRAG,
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
    /** Texture handed to the land shader. RGB = blurred override colour, A = blurred stamp weight. */
    get colorTexture() {
        return this.finalRT.texture;
    }
    /**
     * Run the blur passes if anything dirty. Called once per frame from the
     * scene graph; cheap when nothing changed.
     */
    rebuildIfDirty(renderer, palette, blurDeg) {
        const hash = paletteHash(palette);
        if (hash !== this.cachedPaletteHash)
            this.dirty = true;
        if (blurDeg !== this.currentBlurDeg)
            this.dirty = true;
        const classVer = this.overrideClassTex?.version ?? -1;
        const stampVer = this.overrideStampTex?.version ?? -1;
        if (classVer !== this.cachedClassVersion) {
            this.indexBaked = false;
            this.dirty = true;
        }
        if (stampVer !== this.cachedStampVersion) {
            this.indexBaked = false;
            this.dirty = true;
        }
        if (!this.dirty)
            return;
        this.cachedPaletteHash = hash;
        this.cachedClassVersion = classVer;
        this.cachedStampVersion = stampVer;
        const prevTarget = renderer.getRenderTarget();
        if (!this.indexBaked) {
            this.quadMesh.material = this.indexMat;
            renderer.setRenderTarget(this.indexRT);
            renderer.render(this.quadScene, this.quadCam);
            this.indexBaked = true;
        }
        const halfWidth = Math.min(MAX_KERNEL_HALF, Math.max(0, Math.round((blurDeg / 360.0) * TEX_WIDTH)));
        const sigma = halfWidth > 0 ? halfWidth / 2.5 : 0;
        // Push live palette into the H-blur uniform.
        const pUni = this.hMat.uniforms['uPalette'].value;
        for (let i = 0; i < PALETTE_SIZE; i++) {
            const c = palette[i];
            if (c)
                pUni[i].set(c.r, c.g, c.b);
        }
        this.hMat.uniforms['uKernelHalf'].value = halfWidth;
        this.hMat.uniforms['uSigma'].value = sigma;
        this.quadMesh.material = this.hMat;
        renderer.setRenderTarget(this.hBlurRT);
        renderer.render(this.quadScene, this.quadCam);
        this.vMat.uniforms['uKernelHalf'].value = halfWidth;
        this.vMat.uniforms['uSigma'].value = sigma;
        this.quadMesh.material = this.vMat;
        renderer.setRenderTarget(this.finalRT);
        renderer.render(this.quadScene, this.quadCam);
        renderer.setRenderTarget(prevTarget);
        this.currentBlurDeg = blurDeg;
        this.dirty = false;
    }
    dispose() {
        this.indexRT.dispose();
        this.hBlurRT.dispose();
        this.finalRT.dispose();
        this.indexMat.dispose();
        this.hMat.dispose();
        this.vMat.dispose();
        this.quadMesh.geometry.dispose();
    }
}

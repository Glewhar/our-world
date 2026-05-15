/**
 * EquirectBlurPass — shared two-pass separable Gaussian blur for the
 * LAND fragment shader's pre-blurred inputs (biome colour, climate
 * override, mountain elevation, snow temperature, seafloor mask).
 *
 * Each baker owns one of these: it hands a crisp source texture in,
 * picks the per-axis texel direction, sets `uBlurRadiusPx`, and gets a
 * blurred texture back. Two RTs (hBlur → final) ping-pong the
 * horizontal then vertical pass.
 *
 * The blur material premultiplies by sampled alpha so cut-out bakes
 * (RGBA8 with alpha = 0 outside the foreground region) don't drag the
 * blurred colour toward black at the foreground edge. Plain
 * single-channel bakes (Red/HalfFloat for elevation + temperature)
 * sample as alpha = 1 by default, so the same kernel produces a
 * standard normalized Gaussian.
 *
 * `maxRadius` is templated into the fragment shader as a compile-time
 * constant so the loop bound stays uniform-control-flow. Bakers that
 * push σ > 30 px (e.g. seafloor at σ = 150) pass a larger `maxRadius`
 * so the kernel can spread without flat-topping.
 */

import * as THREE from 'three';

const FULLSCREEN_VERT = /* glsl */ `
out vec2 vEquirectUv;
void main() {
  vEquirectUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

function makeBlurFragSource(maxRadius: number): string {
  return /* glsl */ `
precision highp float;
precision highp int;
precision highp sampler2D;

in vec2 vEquirectUv;
out vec4 fragColor;

uniform sampler2D uSrc;
uniform vec2 uTexelDir;
uniform float uBlurRadiusPx;

void main() {
  const int MAX_RADIUS = ${maxRadius};
  int radius = int(min(uBlurRadiusPx * 2.0, float(MAX_RADIUS)));
  float sigma = max(uBlurRadiusPx, 0.5);
  float twoSig2 = 2.0 * sigma * sigma;

  vec3 colAcc = vec3(0.0);
  float alphaAcc = 0.0;
  float wAcc = 0.0;
  for (int k = -MAX_RADIUS; k <= MAX_RADIUS; k++) {
    if (k < -radius || k > radius) continue;
    vec2 off = uTexelDir * float(k);
    vec4 s = texture(uSrc, vEquirectUv + off);
    float gw = exp(-float(k * k) / twoSig2);
    colAcc += s.rgb * (gw * s.a);
    wAcc += gw * s.a;
    alphaAcc += gw * s.a;
  }
  float kernelNorm = 0.0;
  for (int k = -MAX_RADIUS; k <= MAX_RADIUS; k++) {
    if (k < -radius || k > radius) continue;
    kernelNorm += exp(-float(k * k) / twoSig2);
  }
  vec3 col = wAcc > 1e-6 ? colAcc / wAcc : vec3(0.0);
  float a = alphaAcc / max(kernelNorm, 1e-6);
  fragColor = vec4(col, a);
}
`;
}

export type EquirectBlurPassOptions = {
  width: number;
  height: number;
  /** Compile-time loop bound. Pass ≥ 2 × maximum desired sigma. */
  maxRadius: number;
  format: THREE.PixelFormat;
  type: THREE.TextureDataType;
};

export class EquirectBlurPass {
  private readonly hBlurRT: THREE.WebGLRenderTarget;
  private readonly finalRT: THREE.WebGLRenderTarget;
  private readonly blurMat: THREE.ShaderMaterial;
  private readonly quadScene: THREE.Scene;
  private readonly quadCam: THREE.OrthographicCamera;
  private readonly quadMesh: THREE.Mesh;
  private readonly width: number;
  private readonly height: number;

  constructor(opts: EquirectBlurPassOptions) {
    this.width = opts.width;
    this.height = opts.height;

    const rtOpts: THREE.RenderTargetOptions = {
      format: opts.format,
      type: opts.type,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.RepeatWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      depthBuffer: false,
      stencilBuffer: false,
      generateMipmaps: false,
    };
    this.hBlurRT = new THREE.WebGLRenderTarget(opts.width, opts.height, rtOpts);
    this.finalRT = new THREE.WebGLRenderTarget(opts.width, opts.height, rtOpts);

    this.blurMat = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: makeBlurFragSource(opts.maxRadius),
      uniforms: {
        uSrc: { value: null },
        uTexelDir: { value: new THREE.Vector2(0, 0) },
        uBlurRadiusPx: { value: 0 },
      },
      depthTest: false,
      depthWrite: false,
    });

    this.quadScene = new THREE.Scene();
    this.quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quadMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.blurMat);
    this.quadScene.add(this.quadMesh);
  }

  /** Blurred output texture. Stable reference; contents update on `run`. */
  get texture(): THREE.Texture {
    return this.finalRT.texture;
  }

  /**
   * Run the two-pass blur. `srcTexture` is the crisp input; the result
   * lands in `this.texture`. Caller restores the previous render target
   * if needed — this helper does it on its own to match the existing
   * baker pattern.
   */
  run(renderer: THREE.WebGLRenderer, srcTexture: THREE.Texture, sigmaPx: number): void {
    const prevTarget = renderer.getRenderTarget();
    const u = this.blurMat.uniforms;
    u.uBlurRadiusPx!.value = sigmaPx;

    // Horizontal pass — src → hBlurRT.
    u.uSrc!.value = srcTexture;
    (u.uTexelDir!.value as THREE.Vector2).set(1.0 / this.width, 0);
    renderer.setRenderTarget(this.hBlurRT);
    renderer.render(this.quadScene, this.quadCam);

    // Vertical pass — hBlurRT → finalRT.
    u.uSrc!.value = this.hBlurRT.texture;
    (u.uTexelDir!.value as THREE.Vector2).set(0, 1.0 / this.height);
    renderer.setRenderTarget(this.finalRT);
    renderer.render(this.quadScene, this.quadCam);

    renderer.setRenderTarget(prevTarget);
  }

  dispose(): void {
    this.hBlurRT.dispose();
    this.finalRT.dispose();
    this.blurMat.dispose();
    this.quadMesh.geometry.dispose();
  }
}

export const EQUIRECT_BLUR_FULLSCREEN_VERT = FULLSCREEN_VERT;

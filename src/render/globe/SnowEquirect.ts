/**
 * SnowEquirect — HEALPix temperature → blurred equirect for the LAND
 * fragment shader's snow / cold / hot tints.
 *
 * Why: the seasonal-temperature lookup previously did
 * `texelFetch(uAttrClimate, tx).r` at HEALPix cell granularity, so the
 * snow line snapped at each ~5 km cell boundary. The polar snow
 * silhouette ended up dotted with rectangular cell edges.
 *
 * The fix: bake the per-cell °C into an equirect R16F, blur with two
 * passes of separable Gaussian (σ driven by the `snowBlur` slider ×
 * 375 px), and let the LAND shader bilinear-sample the blurred result.
 * Seasonal swing + climate Δ math stays analytic on top of the
 * smoothed base — only the per-cell climatology is blurred.
 *
 * Dirty trigger: slider value changes. Source temperature buffer is
 * baked once (climate frame zero); only the blur sigma is live.
 */

import * as THREE from 'three';

import { EquirectBlurPass } from './EquirectBlurPass.js';
import { source as healpixGlsl } from './shaders/healpix.glsl.js';
import type { WorldRuntime } from '../../world/index.js';

const EQUIRECT_WIDTH = 4096;
const EQUIRECT_HEIGHT = 2048;
const MAX_RADIUS = 60;

const FULLSCREEN_VERT = /* glsl */ `
out vec2 vEquirectUv;
void main() {
  vEquirectUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const BAKE_FRAG = /* glsl */ `
precision highp float;
precision highp int;
precision highp sampler2D;

in vec2 vEquirectUv;
out vec4 fragColor;

uniform sampler2D uAttrClimate;
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
  float tC = texelFetch(uAttrClimate, tx, 0).r;
  fragColor = vec4(tC, 0.0, 0.0, 1.0);
}
`;

export class SnowEquirect {
  private readonly crispRT: THREE.WebGLRenderTarget;
  private readonly bakeMat: THREE.ShaderMaterial;
  private readonly blurPass: EquirectBlurPass;
  private readonly quadScene: THREE.Scene;
  private readonly quadCam: THREE.OrthographicCamera;
  private readonly quadMesh: THREE.Mesh;

  private dirty = true;
  private crispBaked = false;
  private cachedSigma = -1;
  private pendingSigma = 0;

  constructor(world: WorldRuntime) {
    const rtOpts: THREE.RenderTargetOptions = {
      format: THREE.RedFormat,
      type: THREE.HalfFloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.RepeatWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      depthBuffer: false,
      stencilBuffer: false,
      generateMipmaps: false,
    };
    this.crispRT = new THREE.WebGLRenderTarget(EQUIRECT_WIDTH, EQUIRECT_HEIGHT, rtOpts);

    this.blurPass = new EquirectBlurPass({
      width: EQUIRECT_WIDTH,
      height: EQUIRECT_HEIGHT,
      maxRadius: MAX_RADIUS,
      format: THREE.RedFormat,
      type: THREE.HalfFloatType,
    });

    const { nside, ordering } = world.getHealpixSpec();
    this.bakeMat = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: `${healpixGlsl}\n${BAKE_FRAG}`,
      uniforms: {
        uAttrClimate: { value: world.getAttributeTexture('temperature') },
        uHealpixNside: { value: nside },
        uHealpixOrdering: { value: ordering === 'ring' ? 0 : 1 },
        uAttrTexWidth: { value: 4 * nside },
      },
      depthTest: false,
      depthWrite: false,
    });

    this.quadScene = new THREE.Scene();
    this.quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quadMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.bakeMat);
    this.quadScene.add(this.quadMesh);
  }

  get colorTexture(): THREE.Texture {
    return this.blurPass.texture;
  }

  setSigmaPx(sigmaPx: number): void {
    this.pendingSigma = sigmaPx;
  }

  markDirty(): void {
    this.dirty = true;
  }

  rebuildIfDirty(renderer: THREE.WebGLRenderer): void {
    if (this.pendingSigma !== this.cachedSigma) this.dirty = true;
    if (!this.dirty) return;
    this.cachedSigma = this.pendingSigma;

    const prevTarget = renderer.getRenderTarget();
    if (!this.crispBaked) {
      renderer.setRenderTarget(this.crispRT);
      renderer.render(this.quadScene, this.quadCam);
      renderer.setRenderTarget(prevTarget);
      this.crispBaked = true;
    }

    this.blurPass.run(renderer, this.crispRT.texture, this.cachedSigma);
    this.dirty = false;
  }

  dispose(): void {
    this.crispRT.dispose();
    this.bakeMat.dispose();
    this.blurPass.dispose();
    this.quadMesh.geometry.dispose();
  }
}

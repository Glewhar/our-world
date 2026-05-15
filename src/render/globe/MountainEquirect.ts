/**
 * MountainEquirect — HEALPix elevation → blurred equirect for the LAND
 * fragment shader's alpine smoothstep.
 *
 * Why: the alpine tint previously did `texelFetch(uElevationMeters, tx)`
 * at HEALPix cell granularity. Each ~5 km cell snaps to a single
 * elevation value, which stair-steps across mountain ridges and
 * produces visible cell-grid highlights at high zoom.
 *
 * The fix: bake the per-cell metres into an equirect R16F, blur with
 * two passes of separable Gaussian (σ driven by the `mountainBlur`
 * slider × 375 px), and let the LAND shader bilinear-sample the
 * blurred result for a smooth alpine smoothstep instead of cell-snapped
 * steps. Negative ocean depths fall out below the smoothstep's lower
 * edge so the blur doesn't pull mountain colour into coastal pixels.
 *
 * Dirty trigger: slider value changes. Source elevation buffer is
 * baked once (static HEALPix data); only the blur sigma is live.
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

// HEALPix → equirect resample for the elevation buffer. Same convention
// as ElevationEquirectPrebake (equirect UV → sphere direction → HEALPix
// cell). Writes raw metres into .r; the consumer (LAND alpine block)
// clamps via smoothstep so negative depths fall out below the lower
// edge.
const BAKE_FRAG = /* glsl */ `
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
  float u = vEquirectUv.x;
  float v = vEquirectUv.y;
  float phi = u * 6.28318530 - 3.14159265;
  float theta = 1.5707963 - v * 3.14159265;
  float z = sin(theta);
  int ipx = healpixZPhiToPix(uHealpixNside, uHealpixOrdering, z, phi);
  ivec2 tx = healpixIpixToTexel(ipx, uAttrTexWidth);
  float elev = texelFetch(uElevationMeters, tx, 0).r;
  fragColor = vec4(elev, 0.0, 0.0, 1.0);
}
`;

export class MountainEquirect {
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
        uElevationMeters: { value: world.getElevationMetersTexture() },
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

  /** Blurred elevation texture handed to the LAND shader. */
  get colorTexture(): THREE.Texture {
    return this.blurPass.texture;
  }

  /** Pushed every frame from scene-graph; baker rebakes on actual change. */
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

    // Crisp HEALPix → equirect bake runs once; only the blur step re-
    // runs on sigma change.
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

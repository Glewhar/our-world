/**
 * SeafloorColorEquirect — pre-blurred shelf-palette mask for the LAND
 * fragment shader's seafloor branch.
 *
 * Why: the previous seafloor branch read `biomeId == 16/17/18` per
 * fragment and switched between three shelf-palette colours with no
 * blending. The 23.5°/60° latitude lines snapped between bands and the
 * coast snapped between blurred-biome land and the unblurred shelf
 * palette. Both reads were per-cell HEALPix `texelFetch`, so each
 * transition pixelated at the cell grid.
 *
 * The fix: bake an equirect that paints the per-cell shelf palette
 * colour with alpha = 1 on shelf cells and vec4(0) elsewhere, then
 * blur. The blurred alpha gates the LAND shader's mix between base
 * land colour and shelf colour, so the coast and latitude-band seams
 * dissolve at the same wide sigma. The σ ≈ 150 px default needs a
 * larger `MAX_RADIUS` than the biome blur — 300 px caps the kernel.
 *
 * CPU-side mixing: scene-graph hands in the default palette plus per-
 * slot scenario palettes + weights every frame. The baker mixes them
 * into three final shelf colours, hashes the result, and re-bakes only
 * when the mix actually changed. So Ice Age ramping live still drives
 * a re-bake each frame the weight changes, but a static scenario
 * settles to one bake.
 */

import * as THREE from 'three';

import { EquirectBlurPass } from './EquirectBlurPass.js';
import { source as healpixGlsl } from './shaders/healpix.glsl.js';
import type { WorldRuntime } from '../../world/index.js';

const EQUIRECT_WIDTH = 4096;
const EQUIRECT_HEIGHT = 2048;
const MAX_RADIUS = 300;

const FULLSCREEN_VERT = /* glsl */ `
out vec2 vEquirectUv;
void main() {
  vEquirectUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

// HEALPix → equirect resample that gates on the shelf-biome ids (16, 17,
// 18) carried by attribute_static.G. Cells in those bands write the
// matching palette colour with alpha = 1; everything else writes
// vec4(0). Blurring this mask produces a soft shelf-vs-land alpha
// falloff at coastlines and a soft band-to-band gradient across
// the latitude cutoffs.
const BAKE_FRAG = /* glsl */ `
precision highp float;
precision highp int;
precision highp sampler2D;

in vec2 vEquirectUv;
out vec4 fragColor;

uniform sampler2D uAttrStatic;
uniform vec3 uShelfColors[3];
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
  int biomeId = int(texelFetch(uAttrStatic, tx, 0).g * 255.0 + 0.5);
  if (biomeId >= 16 && biomeId <= 18) {
    int shelfIdx = biomeId - 16;
    vec3 col = uShelfColors[shelfIdx];
    fragColor = vec4(col, 1.0);
  } else {
    fragColor = vec4(0.0);
  }
}
`;

export type SeafloorPaletteFrame = {
  defaultPolar: { r: number; g: number; b: number };
  defaultTemperate: { r: number; g: number; b: number };
  defaultEquatorial: { r: number; g: number; b: number };
  scenarioAPolar: { r: number; g: number; b: number };
  scenarioATemperate: { r: number; g: number; b: number };
  scenarioAEquatorial: { r: number; g: number; b: number };
  scenarioBPolar: { r: number; g: number; b: number };
  scenarioBTemperate: { r: number; g: number; b: number };
  scenarioBEquatorial: { r: number; g: number; b: number };
  weightA: number;
  weightB: number;
};

function mixShelfTriplet(
  defaultC: { r: number; g: number; b: number },
  scenA: { r: number; g: number; b: number },
  scenB: { r: number; g: number; b: number },
  weightA: number,
  weightB: number,
): { r: number; g: number; b: number } {
  const wA = Math.max(0, Math.min(1, weightA));
  const wB = Math.max(0, Math.min(1, weightB));
  const wSum = wA + wB;
  const blendW = Math.max(wA, wB);
  // Match the legacy LAND-shader mix exactly: pick the dominant scenario
  // slot and let the smaller weight nudge toward the other; then blend
  // the scenario combo against the default by the dominant weight.
  let sR: number;
  let sG: number;
  let sB: number;
  if (wA >= wB) {
    const k = wSum > 1e-4 ? wB / wSum : 0;
    sR = scenA.r * (1 - k) + scenB.r * k;
    sG = scenA.g * (1 - k) + scenB.g * k;
    sB = scenA.b * (1 - k) + scenB.b * k;
  } else {
    const k = wSum > 1e-4 ? wA / wSum : 0;
    sR = scenB.r * (1 - k) + scenA.r * k;
    sG = scenB.g * (1 - k) + scenA.g * k;
    sB = scenB.b * (1 - k) + scenA.b * k;
  }
  return {
    r: defaultC.r * (1 - blendW) + sR * blendW,
    g: defaultC.g * (1 - blendW) + sG * blendW,
    b: defaultC.b * (1 - blendW) + sB * blendW,
  };
}

function colorHash(c: { r: number; g: number; b: number }): string {
  return `${(c.r * 1000) | 0}.${(c.g * 1000) | 0}.${(c.b * 1000) | 0}`;
}

export class SeafloorColorEquirect {
  private readonly crispRT: THREE.WebGLRenderTarget;
  private readonly bakeMat: THREE.ShaderMaterial;
  private readonly blurPass: EquirectBlurPass;
  private readonly quadScene: THREE.Scene;
  private readonly quadCam: THREE.OrthographicCamera;
  private readonly quadMesh: THREE.Mesh;

  private dirty = true;
  private cachedSigma = -1;
  private cachedColorsHash = '';
  private pendingSigma = 0;
  private pendingFrame: SeafloorPaletteFrame | null = null;

  constructor(world: WorldRuntime) {
    const rtOpts: THREE.RenderTargetOptions = {
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
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
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
    });

    const { nside, ordering } = world.getHealpixSpec();
    this.bakeMat = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: `${healpixGlsl}\n${BAKE_FRAG}`,
      uniforms: {
        uAttrStatic: { value: world.getAttributeTexture('elevation') },
        uShelfColors: {
          value: [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
          ],
        },
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

  setFrame(frame: SeafloorPaletteFrame): void {
    this.pendingFrame = frame;
  }

  markDirty(): void {
    this.dirty = true;
  }

  rebuildIfDirty(renderer: THREE.WebGLRenderer): void {
    if (this.pendingSigma !== this.cachedSigma) this.dirty = true;

    const frame = this.pendingFrame;
    let mixedPolar = { r: 0, g: 0, b: 0 };
    let mixedTemperate = { r: 0, g: 0, b: 0 };
    let mixedEquatorial = { r: 0, g: 0, b: 0 };
    if (frame) {
      mixedPolar = mixShelfTriplet(
        frame.defaultPolar,
        frame.scenarioAPolar,
        frame.scenarioBPolar,
        frame.weightA,
        frame.weightB,
      );
      mixedTemperate = mixShelfTriplet(
        frame.defaultTemperate,
        frame.scenarioATemperate,
        frame.scenarioBTemperate,
        frame.weightA,
        frame.weightB,
      );
      mixedEquatorial = mixShelfTriplet(
        frame.defaultEquatorial,
        frame.scenarioAEquatorial,
        frame.scenarioBEquatorial,
        frame.weightA,
        frame.weightB,
      );
    }
    const hash = `${colorHash(mixedPolar)}|${colorHash(mixedTemperate)}|${colorHash(mixedEquatorial)}`;
    if (hash !== this.cachedColorsHash) this.dirty = true;
    if (!this.dirty) return;
    this.cachedSigma = this.pendingSigma;
    this.cachedColorsHash = hash;

    const shelfVecs = this.bakeMat.uniforms.uShelfColors!.value as THREE.Vector3[];
    shelfVecs[0]!.set(mixedPolar.r, mixedPolar.g, mixedPolar.b);
    shelfVecs[1]!.set(mixedTemperate.r, mixedTemperate.g, mixedTemperate.b);
    shelfVecs[2]!.set(mixedEquatorial.r, mixedEquatorial.g, mixedEquatorial.b);

    const prevTarget = renderer.getRenderTarget();
    renderer.setRenderTarget(this.crispRT);
    renderer.render(this.quadScene, this.quadCam);
    renderer.setRenderTarget(prevTarget);

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

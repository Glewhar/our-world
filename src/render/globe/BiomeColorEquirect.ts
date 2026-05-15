/**
 * BiomeColorEquirect — polygon-keyed biome-colour globe.
 *
 * Source = the equirect polygon-ID raster (`attribute_polygon`,
 * 8192×4096). Each output pixel maps 1:1 to an input pixel after
 * `(uv → ivec2)` index, so no HEALPix indirection is needed: this is
 * a direct polygon-ID texelFetch + palette lookup + sea-mask gate,
 * rendered into an 8192×4096 RGBA8 colour equirect that the LAND
 * shader samples bilinearly.
 *
 * The palette is a 1D RGBA8 DataTexture sized to the polygon count
 * (~14k entries × 4 B = ~56 KB), composed CPU-side from
 * `biomePalette[14] × realmTint[8] × jitter` keyed by each polygon's
 * baseline biome + realm.
 *
 * Rebuild trigger: a dirty bit flips on palette change, realm-tint
 * change, or ecoregion-jitter change. The bake runs once per dirty
 * flip; in steady state the LAND shader keeps reading the previous
 * frame's final texture.
 *
 * Sea-mask gate: `distance_field.R > 0` (signed km to coast, positive
 * on land) clips open-ocean pixels so the polygon raster's no-data
 * holes don't paint land colour over water.
 */

import * as THREE from 'three';

import { EquirectBlurPass } from './EquirectBlurPass.js';
import {
  buildEcoregionPalette,
  type EcoregionPaletteInputs,
  type RealmTint,
} from './ecoregionPalette.js';
import type { PolygonLookup, WorldRuntime } from '../../world/index.js';

// Output target dimensions = polygon-ID raster dimensions (8192×4096).
// At any smaller resolution each output texel covers a 2×2 polygon-ID
// block and snaps to a single biome, re-introducing HEALPix-scale
// stair-stepping along polygon edges.
const POLY_TEX_WIDTH = 8192;
const POLY_TEX_HEIGHT = 4096;

const FULLSCREEN_VERT = /* glsl */ `
out vec2 vEquirectUv;
void main() {
  vEquirectUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

// Polygon-mode colour bake — equirect polygon-ID texture → equirect
// RGBA8 colour. The polygon raster IS already equirect, so each output
// pixel maps 1:1 to an input pixel. Palette is sampled by polygon ID
// and gated by `distance_field.R > 0` so open ocean doesn't paint land
// colour where the polygon raster has no-data gaps.
const POLY_BAKE_FRAG = /* glsl */ `
precision highp float;
precision highp int;
precision highp sampler2D;

in vec2 vEquirectUv;
out vec4 fragColor;

uniform sampler2D uPolyId;
uniform sampler2D uColorByPoly;
uniform sampler2D uDistanceField;
uniform int uHasDistanceField;
uniform int uPaletteSize;
uniform int uPolyTexWidth;
uniform int uPolyTexHeight;

void main() {
  ivec2 px = ivec2(vEquirectUv * vec2(float(uPolyTexWidth), float(uPolyTexHeight)));
  vec2 lohi = texelFetch(uPolyId, px, 0).rg;
  int polyId = int(lohi.r * 255.0 + 0.5) | (int(lohi.g * 255.0 + 0.5) << 8);
  // Sea-mask clip: distance_field.R is signed km to coast (positive
  // on land). When the bake didn't ship a distance field, we trust the
  // polygon raster's no-data sentinel (id == 0 → black + alpha 0).
  float coastKm = uHasDistanceField == 1
    ? texture(uDistanceField, vEquirectUv).r
    : (polyId == 0 ? -1.0 : 1.0);
  if (coastKm <= 0.0) {
    fragColor = vec4(0.0, 0.0, 0.0, 0.0);
    return;
  }
  int paletteIdx = polyId;
  if (paletteIdx < 0) paletteIdx = 0;
  if (paletteIdx > uPaletteSize - 1) paletteIdx = uPaletteSize - 1;
  vec3 col = texelFetch(uColorByPoly, ivec2(paletteIdx, 0), 0).rgb;
  fragColor = vec4(col, 1.0);
}
`;

// Separable Gaussian blur lives in `EquirectBlurPass` now — both
// `BiomeColorEquirect` and `BiomeOverrideEquirect` instantiate one with
// `maxRadius = 60` (σ up to 30 px) and run it after their crisp polygon
// bake. Alpha-weighted accumulation in the shared pass keeps coastline
// land colour clean even when the kernel straddles ocean cut-out
// pixels.

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
  /** Hex strings from `state.materials.globe.biomePalette` (length 16: 0 = fallback, 1..14 = TEOW biomes, 15 = synthetic ice override). */
  biomePalette: readonly string[];
  /** Per-realm HSV tint table (length 9; slot 0 unused). */
  realmTint: readonly RealmTint[];
  /** 0..1 strength of the per-ecoregion deterministic HSV wobble. */
  ecoregionJitter: number;
};

/**
 * Default Gaussian sigma for the colour-equirect blur, in pixels of
 * the 8192×4096 grid. Thirty pixels gives ~50° of soft transition
 * along the equator — the polygon mosaic dissolves into broad
 * continental tints, biome borders read as zones rather than lines.
 * The shared `EquirectBlurPass` caps the kernel half-width at
 * `maxRadius = 60` (= 2σ for σ = 30); bumping much further requires
 * raising that constant.
 *
 * The live value is driven from `materials.globe.biomeBlur` × 375 by
 * `scene-graph.ts`; this default stands in until that wiring runs.
 */
export const BLUR_SIGMA_PX = 30.0;
export const BLUR_FULLSCREEN_VERT = FULLSCREEN_VERT;

export class BiomeColorEquirect {
  private polyRT: THREE.WebGLRenderTarget;
  private polyMat: THREE.ShaderMaterial;
  private blurPass: EquirectBlurPass;
  private paletteTexture: THREE.DataTexture;

  private quadScene: THREE.Scene;
  private quadCam: THREE.OrthographicCamera;
  private quadMesh: THREE.Mesh;

  private dirty = true;
  private cachedPaletteHash = '';
  private cachedRealmHash = '';
  private cachedJitter = -1;
  private cachedSigma = -1;
  private pendingSigma = BLUR_SIGMA_PX;

  private readonly polyLookup: PolygonLookup;

  constructor(world: WorldRuntime) {
    const polyTex = world.getPolygonTexture();
    const polyLookup = world.getPolygonLookup();
    if (!polyTex || !polyLookup) {
      throw new Error(
        'BiomeColorEquirect: polygon artifacts missing — `attribute_polygon` and `polygon_lookup` are now required',
      );
    }
    this.polyLookup = polyLookup;

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
    // Crisp polygon bake target; the blur step then runs through the
    // shared `EquirectBlurPass`, which owns its own hBlur + final RTs.
    this.polyRT = new THREE.WebGLRenderTarget(POLY_TEX_WIDTH, POLY_TEX_HEIGHT, rtOpts);
    this.blurPass = new EquirectBlurPass({
      width: POLY_TEX_WIDTH,
      height: POLY_TEX_HEIGHT,
      maxRadius: 60,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
    });

    // 1D palette texture, length = polygon count + 1. ~14k entries × 4 B
    // = ~56 KB. Rebuilt CPU-side every dirty flip from biome × realm ×
    // jitter using the polygon-keyed `biomeOf` / `realmOf` arrays.
    const w = polyLookup.count + 1;
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

    const distanceField = world.getDistanceFieldTexture();
    this.polyMat = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: POLY_BAKE_FRAG,
      uniforms: {
        uPolyId: { value: polyTex },
        uColorByPoly: { value: this.paletteTexture },
        uDistanceField: { value: distanceField },
        uHasDistanceField: { value: distanceField ? 1 : 0 },
        uPaletteSize: { value: w },
        uPolyTexWidth: { value: polyLookup.rasterWidth },
        uPolyTexHeight: { value: polyLookup.rasterHeight },
      },
      depthTest: false,
      depthWrite: false,
    });

    this.quadScene = new THREE.Scene();
    this.quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quadMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.polyMat);
    this.quadScene.add(this.quadMesh);
  }

  /** Texture handed to the land shader. Stable reference; contents update on rebuild. */
  get colorTexture(): THREE.Texture {
    return this.blurPass.texture;
  }

  /** Live blur sigma in pixels of the 8192×4096 grid. Scene-graph pushes this every frame. */
  setSigmaPx(sigmaPx: number): void {
    this.pendingSigma = sigmaPx;
  }

  /**
   * 1D `RGBAFormat / UnsignedByteType` palette indexed by polygon ID
   * (length = polygon count + 1). Same buffer the bake material reads
   * to colour each polygon; exposed so the LAND shader's mode-1 path
   * can look up `colA = colorByPoly[polyA]` and
   * `colB = colorByPoly[polyB]` at fragment rate without re-baking the
   * whole equirect. Contents update on the same dirty-bit cadence as
   * `colorTexture`.
   */
  get colorByPolyTexture(): THREE.DataTexture {
    return this.paletteTexture;
  }

  markDirty(): void {
    this.dirty = true;
  }

  /**
   * Rebuild the colour equirect if anything changed. Called once per
   * frame from the scene graph; cheap when nothing is dirty.
   */
  rebuildIfDirty(
    renderer: THREE.WebGLRenderer,
    palette: readonly THREE.Color[],
    eco: EcoTuning,
  ): void {
    const hash = paletteHash(palette);
    const rHash = realmTintHash(eco.realmTint);
    if (hash !== this.cachedPaletteHash) this.dirty = true;
    if (rHash !== this.cachedRealmHash) this.dirty = true;
    if (eco.ecoregionJitter !== this.cachedJitter) this.dirty = true;
    if (this.pendingSigma !== this.cachedSigma) this.dirty = true;
    if (!this.dirty) return;
    this.cachedPaletteHash = hash;
    this.cachedRealmHash = rHash;
    this.cachedJitter = eco.ecoregionJitter;
    this.cachedSigma = this.pendingSigma;

    const inputs: EcoregionPaletteInputs = {
      biomePalette: eco.biomePalette,
      realmTint: eco.realmTint,
      ecoregionJitter: eco.ecoregionJitter,
      // PolygonLookup carries biome/realm as Int8Array (values 0..14
      // / 0..8 fit safely); reinterpret the underlying bytes as
      // Uint8Array without copying.
      biomeOf: new Uint8Array(
        this.polyLookup.biome.buffer,
        this.polyLookup.biome.byteOffset,
        this.polyLookup.biome.byteLength,
      ),
      realmOf: new Uint8Array(
        this.polyLookup.realm.buffer,
        this.polyLookup.realm.byteOffset,
        this.polyLookup.realm.byteLength,
      ),
    };
    const bytes = buildEcoregionPalette(inputs);
    const dst = this.paletteTexture.image.data as Uint8Array;
    dst.set(bytes);
    this.paletteTexture.needsUpdate = true;

    const prevTarget = renderer.getRenderTarget();

    // Crisp polygon-ID → palette colour into polyRT.
    renderer.setRenderTarget(this.polyRT);
    renderer.render(this.quadScene, this.quadCam);
    renderer.setRenderTarget(prevTarget);

    // Two-pass separable Gaussian blur via the shared helper.
    this.blurPass.run(renderer, this.polyRT.texture, this.cachedSigma);

    this.dirty = false;
  }

  dispose(): void {
    this.polyRT.dispose();
    this.polyMat.dispose();
    this.blurPass.dispose();
    this.quadMesh.geometry.dispose();
    this.paletteTexture.dispose();
  }
}

/**
 * BiomeOverrideEquirect — polygon-keyed climate-scenario override.
 *
 * The climate-scenario override paints a different biome colour onto
 * polygons the scenario has selected (e.g. ice age maps tundra/boreal
 * to ice id 15). This module reads three 1D R8 per-polygon textures —
 * `class[poly]`, `weight[poly]`, `tStart01[poly]` (the last is parked
 * for v1) — plus the equirect polygon-ID raster, looks up the live
 * biome palette, and writes RGBA8 into an 8192×4096 equirect:
 *
 *   RGB = palette[class[polyId]]
 *   A   = weight[polyId]
 *
 * The LAND shader samples once bilinearly. `tStart01` staging is parked
 * for v1: the per-cell stamp.g read is undefined in this path but the
 * buffer is zero-initialised, so cellEnv resolves to `uClimateEnvelope`
 * and the slot's global envelope drives the ramp.
 *
 * Rebuild trigger: dirty bit flips when the per-polygon class / weight
 * textures change (scenario start/end via `bakePolygonOverride`) or
 * the live biome palette changes. Cold start (no scenario): the class
 * + weight textures are zero-initialised — the bake produces
 * `RGB = palette[0]`, `A = 0`, and the LAND shader's
 * `uClimateEnvelope > 0` gate keeps the texture untouched.
 */
import * as THREE from 'three';
import { BLUR_SIGMA_PX } from './BiomeColorEquirect.js';
import { EquirectBlurPass } from './EquirectBlurPass.js';
// Output target dimensions = polygon-ID raster dimensions (8192×4096).
// Anything smaller re-quantizes polygon edges back to HEALPix scale and
// undoes the whole point of the polygon-keyed path.
const POLY_TEX_WIDTH = 8192;
const POLY_TEX_HEIGHT = 4096;
const PALETTE_SIZE = 16;
const FULLSCREEN_VERT = /* glsl */ `
out vec2 vEquirectUv;
void main() {
  vEquirectUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;
// Polygon-mode colour bake — direct to finalRT (no blur). Reads the
// polygon-ID raster + two per-polygon 1D textures (class, weight),
// looks up the palette, and writes RGBA8 with RGB = palette[class],
// A = weight.
const POLY_OVERRIDE_FRAG = /* glsl */ `
precision highp float;
precision highp int;
precision highp sampler2D;

in vec2 vEquirectUv;
out vec4 fragColor;

uniform sampler2D uPolyId;
uniform sampler2D uClassByPoly;
uniform sampler2D uWeightByPoly;
uniform sampler2D uColorByPoly;
uniform int uPaletteSize;
uniform int uPolyTexWidth;
uniform int uPolyTexHeight;
uniform int uPerPolyLength;

void main() {
  ivec2 px = ivec2(vEquirectUv * vec2(float(uPolyTexWidth), float(uPolyTexHeight)));
  vec2 lohi = texelFetch(uPolyId, px, 0).rg;
  int polyId = int(lohi.r * 255.0 + 0.5) | (int(lohi.g * 255.0 + 0.5) << 8);
  if (polyId < 0) polyId = 0;
  if (polyId > uPerPolyLength - 1) polyId = uPerPolyLength - 1;
  int cls = int(texelFetch(uClassByPoly, ivec2(polyId, 0), 0).r * 255.0 + 0.5);
  float weight = texelFetch(uWeightByPoly, ivec2(polyId, 0), 0).r;
  int paletteIdx = cls;
  if (paletteIdx < 0) paletteIdx = 0;
  if (paletteIdx > uPaletteSize - 1) paletteIdx = uPaletteSize - 1;
  vec3 col = texelFetch(uColorByPoly, ivec2(paletteIdx, 0), 0).rgb;
  fragColor = vec4(col, weight);
}
`;
function clampByteUnit(v) {
    if (!Number.isFinite(v))
        return 0;
    const x = Math.round(v * 255);
    if (x <= 0)
        return 0;
    if (x >= 255)
        return 255;
    return x;
}
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
    polyRT;
    polyMat;
    blurPass;
    paletteTexture;
    quadScene;
    quadCam;
    quadMesh;
    dirty = true;
    cachedPaletteHash = '';
    cachedClassByPolyVer = -1;
    cachedWeightByPolyVer = -1;
    cachedSigma = -1;
    pendingSigma = BLUR_SIGMA_PX;
    classByPolyTex;
    weightByPolyTex;
    constructor(world, slot = 0) {
        const polyTex = world.getPolygonTexture();
        const polyLookup = world.getPolygonLookup();
        if (!polyTex || !polyLookup) {
            throw new Error('BiomeOverrideEquirect: polygon artifacts missing — `attribute_polygon` and `polygon_lookup` are now required');
        }
        this.classByPolyTex = world.getPolygonOverrideClassTexture(slot);
        this.weightByPolyTex = world.getPolygonOverrideWeightTexture(slot);
        const rtOpts = {
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
        // Crisp polygon-override bake target; the shared `EquirectBlurPass`
        // owns the two-pass blur, matching the base `BiomeColorEquirect`
        // pipeline so the scenario override softens its polygon borders the
        // same way the baseline biomes do.
        this.polyRT = new THREE.WebGLRenderTarget(POLY_TEX_WIDTH, POLY_TEX_HEIGHT, rtOpts);
        this.blurPass = new EquirectBlurPass({
            width: POLY_TEX_WIDTH,
            height: POLY_TEX_HEIGHT,
            maxRadius: 60,
            format: THREE.RGBAFormat,
            type: THREE.UnsignedByteType,
        });
        // 1D palette texture, 16 entries × 4 B = trivial. Rebuilt every
        // dirty flip from the live biome colours; same indices the legacy
        // override fragment shader expected.
        this.paletteTexture = new THREE.DataTexture(new Uint8Array(PALETTE_SIZE * 4), PALETTE_SIZE, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
        this.paletteTexture.minFilter = THREE.NearestFilter;
        this.paletteTexture.magFilter = THREE.NearestFilter;
        this.paletteTexture.wrapS = THREE.ClampToEdgeWrapping;
        this.paletteTexture.wrapT = THREE.ClampToEdgeWrapping;
        this.paletteTexture.needsUpdate = true;
        this.polyMat = new THREE.ShaderMaterial({
            glslVersion: THREE.GLSL3,
            vertexShader: FULLSCREEN_VERT,
            fragmentShader: POLY_OVERRIDE_FRAG,
            uniforms: {
                uPolyId: { value: polyTex },
                uClassByPoly: { value: this.classByPolyTex },
                uWeightByPoly: { value: this.weightByPolyTex },
                uColorByPoly: { value: this.paletteTexture },
                uPaletteSize: { value: PALETTE_SIZE },
                uPolyTexWidth: { value: polyLookup.rasterWidth },
                uPolyTexHeight: { value: polyLookup.rasterHeight },
                uPerPolyLength: { value: polyLookup.count + 1 },
            },
            depthTest: false,
            depthWrite: false,
        });
        this.quadScene = new THREE.Scene();
        this.quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.quadMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.polyMat);
        this.quadScene.add(this.quadMesh);
    }
    /** Texture handed to the land shader. RGB = override colour, A = stamp weight. */
    get colorTexture() {
        return this.blurPass.texture;
    }
    /** Live blur sigma in pixels of the 8192×4096 grid. Scene-graph pushes this every frame. */
    setSigmaPx(sigmaPx) {
        this.pendingSigma = sigmaPx;
    }
    /**
     * Rebake the override equirect if anything changed. Called once per
     * frame from the scene graph; cheap when nothing is dirty.
     */
    rebuildIfDirty(renderer, palette) {
        const hash = paletteHash(palette);
        if (hash !== this.cachedPaletteHash)
            this.dirty = true;
        const classVer = this.classByPolyTex.version;
        const weightVer = this.weightByPolyTex.version;
        if (classVer !== this.cachedClassByPolyVer)
            this.dirty = true;
        if (weightVer !== this.cachedWeightByPolyVer)
            this.dirty = true;
        if (this.pendingSigma !== this.cachedSigma)
            this.dirty = true;
        if (!this.dirty)
            return;
        this.cachedPaletteHash = hash;
        this.cachedClassByPolyVer = classVer;
        this.cachedWeightByPolyVer = weightVer;
        this.cachedSigma = this.pendingSigma;
        // Repopulate the 1D palette (16 entries) from the live biome
        // colours.
        const dst = this.paletteTexture.image.data;
        for (let i = 0; i < PALETTE_SIZE; i++) {
            const c = palette[i];
            const r = c ? clampByteUnit(c.r) : 0;
            const g = c ? clampByteUnit(c.g) : 0;
            const b = c ? clampByteUnit(c.b) : 0;
            dst[i * 4 + 0] = r;
            dst[i * 4 + 1] = g;
            dst[i * 4 + 2] = b;
            dst[i * 4 + 3] = 255;
        }
        this.paletteTexture.needsUpdate = true;
        const prevTarget = renderer.getRenderTarget();
        // Crisp polygon-override colour into polyRT.
        renderer.setRenderTarget(this.polyRT);
        renderer.render(this.quadScene, this.quadCam);
        renderer.setRenderTarget(prevTarget);
        // Two-pass separable Gaussian blur via the shared helper.
        this.blurPass.run(renderer, this.polyRT.texture, this.cachedSigma);
        this.dirty = false;
    }
    dispose() {
        this.polyRT.dispose();
        this.polyMat.dispose();
        this.blurPass.dispose();
        this.paletteTexture.dispose();
        this.quadMesh.geometry.dispose();
    }
}

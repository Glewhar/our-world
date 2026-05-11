/**
 * Volumetric cloud pass (M5).
 *
 * Renders the cloud raymarch into a half-resolution offscreen target, then
 * composites that target onto the main framebuffer via a fullscreen quad
 * (the public `mesh`). The composite mesh lives in the main scene at
 * `renderOrder = 0`, so the existing draw order (opaque globe → cloud
 * composite → atmosphere with renderOrder=1) is preserved by Three.js's
 * own sorting.
 *
 * Half-res rendering is the dominant win here on tile-based mobile GPUs:
 * the raymarch is ~80 noise-volume samples per pixel, so quartering the
 * pixel count quarters the cost. The composite is a single bilinear tap
 * — net ~3.5× cheaper than full-res. Quality cost is minor: cloud
 * silhouettes against the planet are already soft thanks to the hash-
 * jittered integration, and the `LinearFilter` on the half-res target
 * does the 4-tap upsample for free.
 *
 * Domain: spherical shell `[CLOUD_BASE_M, CLOUD_TOP_M]` above the unit
 * sphere. Density is procedural (FBM + Worley); advection comes from
 * the pre-baked wind field bound at `attachWorld` time.
 *
 * Public API: scene-graph pushes Tweakpane state in via the `setX`
 * setters each frame; `update` advances `uTime`; `syncFromCamera`
 * refreshes `uInvViewProj` + `uCameraPos` so the fragment can
 * reconstruct the view ray; `renderHalfRes(renderer, camera)` MUST be
 * called once per frame BEFORE the main scene render so the composite
 * mesh has fresh half-res cloud data; `setSize(w, h)` keeps the
 * half-res target sized to half the canvas.
 */
import * as THREE from 'three';
import { source as noiseGlsl } from './shaders/cloud_noise.glsl.js';
import { source as healpixGlsl } from '../globe/shaders/healpix.glsl.js';
import { source as vertGlsl } from './shaders/fullscreen.vert.glsl.js';
import { source as fragGlsl } from './shaders/clouds.frag.glsl.js';
import { source as upsampleFragGlsl } from './shaders/upsample.frag.glsl.js';
import { DEFAULT_ELEVATION_SCALE } from '../globe/LandMaterial.js';
export const DEFAULT_CLOUD_DENSITY = 0.1;
export const DEFAULT_CLOUD_COVERAGE = 0.5;
export const DEFAULT_CLOUD_BEER = 1.4;
export const DEFAULT_CLOUD_HENYEY = 0.4;
export const DEFAULT_CLOUD_ADVECTION = 14;
// `uTime` in the shader feeds into a physically-honest wind integration:
// `wind_m_per_s × uTime × 1.566e-7 rad/s/m/s` (one radian per planet
// radius). At Earth scale that's so slow the eye can't see it — even
// jet-stream winds shift the pattern by < 0.1° per minute. Speed up
// the clock by this factor before handing it to the shader so the
// `advection` slider's defaults produce visible drift in real time.
const CLOUD_TIME_SCALE = 400;
// Cloud raymarch resolution divisor — render target is `canvas / N` per
// axis (so 1/N² of total pixels). 2 = half-res (4× speedup vs full),
// 4 = quarter-res (16× speedup vs full, 4× speedup vs half). Bilinear
// upsample softens cloud silhouettes at higher divisors — works well
// for fluffy procedural clouds, breaks down past ~4 where edges turn
// visibly blurry.
const CLOUD_RES_DIVISOR = 4;
// Initial uTime offset — pre-rolls the simulation so the first rendered
// frame already shows wind-streaked, mid-morph clouds rather than a
// pristine static noise field. With the two-phase wind crossfade
// (WIND_PERIOD=6400 in the shader), 30000 lands phaseA at 4400 (68%
// through cycle, weight 0.69, ~11 sec of wind buildup visible) and
// phaseB at 1200 (18%, weight 0.31, ~3 sec buildup). Net: clear wind
// motion from frame 1, no "wait for the simulation to warm up" gap.
// Morph offset at this seed = 9 noise units — well past the boring
// initial slice. If you bump CLOUD_TIME_SCALE or WIND_PERIOD, revisit.
const INITIAL_TIME = 30000;
export class VolumetricCloudPass {
    /** Composite mesh — lives in the main scene at `renderOrder = 0`. Samples
     *  the half-res cloud target via the upsample shader and blends with the
     *  same premultiplied-alpha contract the raymarch wrote with. */
    mesh;
    material;
    cloudMaterial;
    cloudMesh;
    cloudsScene;
    compositeGeometry;
    cloudGeometry;
    halfResTarget;
    tmpInvViewProj = new THREE.Matrix4();
    tmpCameraPos = new THREE.Vector3();
    tmpClearColor = new THREE.Color();
    hasWindField = false;
    constructor(world) {
        const windField = world.getWindFieldTexture();
        this.hasWindField = windField !== null;
        const { nside, ordering } = world.getHealpixSpec();
        this.cloudMaterial = new THREE.RawShaderMaterial({
            glslVersion: THREE.GLSL3,
            vertexShader: vertGlsl,
            // Concat order: noise (declares precision) → healpix (uses precision)
            // → frag (uses both).
            fragmentShader: `${noiseGlsl}\n${healpixGlsl}\n${fragGlsl}`,
            uniforms: {
                uWindField: { value: windField },
                uCameraPos: { value: new THREE.Vector3() },
                uSunDirection: { value: new THREE.Vector3(1, 0, 0.3).normalize() },
                uInvViewProj: { value: new THREE.Matrix4() },
                uTime: { value: INITIAL_TIME },
                uDensity: { value: DEFAULT_CLOUD_DENSITY },
                uCoverage: { value: DEFAULT_CLOUD_COVERAGE },
                uBeer: { value: DEFAULT_CLOUD_BEER },
                uHenyey: { value: DEFAULT_CLOUD_HENYEY },
                uAdvection: { value: DEFAULT_CLOUD_ADVECTION },
                // Geo data — biome / temperature / moisture / elevation. The cloud
                // shader samples these via a heavy multi-tap blur in `sampleCoverMul`,
                // so per-cell discontinuities are smeared over ~300 km before they
                // reach the cloud opacity. Elevation is used to suppress cloud cover
                // over high mountains (peaks above 2500 m fade clouds to zero).
                uIdRaster: { value: world.getIdRaster() },
                uAttrStatic: { value: world.getAttributeTexture('elevation') },
                uAttrClimate: { value: world.getAttributeTexture('temperature') },
                uElevationMeters: { value: world.getElevationMetersTexture() },
                uHealpixNside: { value: nside },
                uHealpixOrdering: { value: ordering === 'ring' ? 0 : 1 },
                uAttrTexWidth: { value: 4 * nside },
                // Same metres → unit-sphere scale Land/Water use. Drives the cloud
                // shell altitude so the cloud base sits at exactly CLOUD_BASE_M
                // (3000 m) above the rendered sea-level radius. MUST stay in sync
                // with LandMaterial / WaterMaterial.
                uElevationScale: { value: DEFAULT_ELEVATION_SCALE },
            },
            // Rendering into the half-res target — we want raw color writes, no
            // blending against whatever was there before. The target is cleared
            // each frame so the first fragment hit just stamps its premultiplied
            // (col, alpha) into the pixel.
            //
            // NoBlending is essential here: the fragment outputs premultiplied
            // alpha (col is already weighted by per-step visibility). With the
            // default NormalBlending, gl.BLEND would multiply col by alpha a
            // second time and overwrite the alpha channel with alpha² — the
            // composite then re-applies its own One/OneMinusSrcAlpha over that
            // corrupted texel, producing dim "wisp" clouds with dark holes
            // where the partial-alpha math collapses.
            transparent: false,
            depthTest: false,
            depthWrite: false,
            blending: THREE.NoBlending,
        });
        this.cloudGeometry = new THREE.BufferGeometry();
        this.cloudGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
        this.cloudGeometry.setDrawRange(0, 3);
        this.cloudMesh = new THREE.Mesh(this.cloudGeometry, this.cloudMaterial);
        this.cloudMesh.frustumCulled = false;
        this.cloudsScene = new THREE.Scene();
        this.cloudsScene.add(this.cloudMesh);
        // Half-res render target — quartered pixel count is the FPS win this
        // pass exists to deliver. LinearFilter on the upsample is what makes
        // cloud silhouettes read as soft instead of staircased; bilinear
        // sampling of premultiplied alpha is mathematically correct (a tap
        // halfway between (col, alpha) and (0,0,0,0) gives (col/2, alpha/2),
        // which the One/OneMinusSrcAlpha composite then renders as
        // col/2 + bg*(1 - alpha/2) — exactly the correct soft edge with no
        // darkening artefact). Requires the half-res clear to be (0,0,0,0)
        // — see `renderHalfRes` for why we explicitly set clear-alpha=0.
        this.halfResTarget = new THREE.WebGLRenderTarget(1, 1, {
            type: THREE.UnsignedByteType,
            format: THREE.RGBAFormat,
            samples: 0,
            depthBuffer: false,
            stencilBuffer: false,
        });
        this.halfResTarget.texture.minFilter = THREE.LinearFilter;
        this.halfResTarget.texture.magFilter = THREE.LinearFilter;
        this.halfResTarget.texture.wrapS = THREE.ClampToEdgeWrapping;
        this.halfResTarget.texture.wrapT = THREE.ClampToEdgeWrapping;
        // Composite material — fullscreen quad that samples the half-res
        // target and blends onto the canvas. Same custom blend the raymarch
        // mesh used previously, so the visual result is unchanged apart from
        // the (intentional) softer half-res sampling.
        this.material = new THREE.RawShaderMaterial({
            glslVersion: THREE.GLSL3,
            vertexShader: vertGlsl,
            fragmentShader: upsampleFragGlsl,
            uniforms: {
                uCloudTex: { value: this.halfResTarget.texture },
            },
            transparent: true,
            depthTest: false,
            depthWrite: false,
            blending: THREE.CustomBlending,
            blendSrc: THREE.OneFactor,
            blendDst: THREE.OneMinusSrcAlphaFactor,
            blendSrcAlpha: THREE.OneFactor,
            blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
        });
        this.compositeGeometry = new THREE.BufferGeometry();
        this.compositeGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
        this.compositeGeometry.setDrawRange(0, 3);
        this.mesh = new THREE.Mesh(this.compositeGeometry, this.material);
        this.mesh.frustumCulled = false;
        this.mesh.renderOrder = 0;
        // Hidden by default until the scene graph turns the layer on AND
        // confirms a wind field is bound — see `setActive`.
        this.mesh.visible = false;
    }
    setSunDirection(dir) {
        this.cloudMaterial.uniforms.uSunDirection.value
            .copy(dir)
            .normalize();
    }
    /**
     * Toggle cloud rendering. If the bake didn't ship a wind field
     * (`size_bytes <= 32` placeholder), forced off — the shader has no
     * advection source and would just show a static noise field.
     */
    setActive(active) {
        this.mesh.visible = active && this.hasWindField;
    }
    setDensity(v) {
        this.cloudMaterial.uniforms.uDensity.value = v;
    }
    setCoverage(v) {
        this.cloudMaterial.uniforms.uCoverage.value = v;
    }
    setBeer(v) {
        this.cloudMaterial.uniforms.uBeer.value = v;
    }
    setHenyey(v) {
        this.cloudMaterial.uniforms.uHenyey.value = v;
    }
    setAdvection(v) {
        this.cloudMaterial.uniforms.uAdvection.value = v;
    }
    setElevationScale(v) {
        this.cloudMaterial.uniforms.uElevationScale.value = v;
    }
    /**
     * Refresh the view-ray reconstruction matrix + camera position. Call
     * once per frame from the scene graph (after `OrbitControls.update`)
     * so the ray reconstruction lines up with what the globe pass sees.
     */
    syncFromCamera(camera) {
        camera.getWorldPosition(this.tmpCameraPos);
        this.cloudMaterial.uniforms.uCameraPos.value.copy(this.tmpCameraPos);
        this.tmpInvViewProj.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        this.tmpInvViewProj.invert();
        this.cloudMaterial.uniforms.uInvViewProj.value.copy(this.tmpInvViewProj);
    }
    update(deltaSec) {
        this.cloudMaterial.uniforms.uTime.value += deltaSec * CLOUD_TIME_SCALE;
    }
    /**
     * Resize the cloud raymarch target. Call from the scene-graph's
     * `resize` hook with the canvas dimensions; the target is sized to
     * a fraction of each axis (1/CLOUD_RES_DIVISOR per axis → 1/N² total
     * pixel count).
     */
    setSize(width, height) {
        const w = Math.max(1, Math.floor(width / CLOUD_RES_DIVISOR));
        const h = Math.max(1, Math.floor(height / CLOUD_RES_DIVISOR));
        this.halfResTarget.setSize(w, h);
    }
    /**
     * Render the cloud raymarch into the half-res target. MUST be called
     * once per frame BEFORE the main scene renders, so the composite mesh
     * (which lives in the main scene) has fresh half-res cloud data when
     * its draw call lands. No-op when the layer is hidden.
     *
     * Clear contract: the target is cleared to (0,0,0,0) so any pixel the
     * raymarch `discard`s reads as fully transparent in the composite. We
     * have to set this explicitly because `WebGLRenderer` constructed with
     * the default `alpha: false` initializes `_clearAlpha = 1`, and the
     * cloudsScene has no `background`, so without this override every
     * empty pixel would be stamped as `(0,0,0,1)` — the composite then
     * sees `c.a = 1` everywhere outside cloud puffs and the One/
     * OneMinusSrcAlpha blend writes solid black across the framebuffer
     * (`src*1 + bg*(1-1) = src`), darkening the world below.
     */
    renderHalfRes(renderer, camera) {
        if (!this.mesh.visible)
            return;
        const prevTarget = renderer.getRenderTarget();
        const prevAutoClear = renderer.autoClear;
        const prevClearAlpha = renderer.getClearAlpha();
        renderer.getClearColor(this.tmpClearColor);
        renderer.setRenderTarget(this.halfResTarget);
        renderer.setClearColor(0x000000, 0);
        renderer.autoClear = true;
        renderer.clear(true, false, false);
        renderer.render(this.cloudsScene, camera);
        renderer.setClearColor(this.tmpClearColor, prevClearAlpha);
        renderer.autoClear = prevAutoClear;
        renderer.setRenderTarget(prevTarget);
    }
    dispose() {
        this.cloudGeometry.dispose();
        this.cloudMaterial.dispose();
        this.compositeGeometry.dispose();
        this.material.dispose();
        this.halfResTarget.dispose();
    }
}

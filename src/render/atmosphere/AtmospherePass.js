/**
 * Hillaire 2020 atmosphere pass.
 *
 * Three precomputed LUTs (transmittance, multi-scattering, sky-view) feed
 * a runtime fullscreen-triangle Mesh that alpha-composites the sky over
 * the globe. The Mesh draws at `renderOrder=1` with `depthTest=true` and
 * the vertex shader emits at the far plane (`gl_Position.z = 1.0`), so the
 * fragment passes only where no opaque geometry has written depth. The
 * rendered terrain silhouette (including displaced mountain peaks) thus
 * punches through the halo naturally.
 *
 * The constructor requires a `THREE.WebGLRenderer` because the two static
 * LUTs (transmittance, multi-scatter) bake at construction.
 *
 * See `docs/adr/0007-bruneton-hillaire-atmosphere.md`.
 */
import * as THREE from 'three';
import { AtmosphereLuts } from './AtmosphereLuts.js';
import { source as commonGlsl } from './shaders/common.glsl.js';
import { source as vertGlsl } from './shaders/fullscreen.vert.glsl.js';
import { source as fragGlsl } from './shaders/atmosphere.frag.glsl.js';
export class AtmospherePass {
    mesh;
    material;
    luts;
    geometry;
    tmpInvViewProj = new THREE.Matrix4();
    tmpCameraPos = new THREE.Vector3();
    sunDir = new THREE.Vector3(1, 0, 0.3).normalize();
    cameraPos = new THREE.Vector3(3, 0, 0);
    dirty = true;
    prevRayleighScale = NaN;
    prevMieScale = NaN;
    prevAtmosphereRadius = NaN;
    constructor(renderer, opts = {}) {
        const atmosphereRadius = opts.atmosphereRadius ?? 1.07;
        this.luts = new AtmosphereLuts(renderer, {
            rayleighScale: opts.rayleighScale ?? 1,
            mieScale: opts.mieScale ?? 1,
            atmosphereRadius,
            ...(opts.solarIrradiance ? { solarIrradiance: opts.solarIrradiance } : {}),
        });
        const sunDiskAngleDeg = opts.sunDiskAngleDeg ?? 0.535; // ~Sun angular diameter
        this.material = new THREE.RawShaderMaterial({
            glslVersion: THREE.GLSL3,
            vertexShader: vertGlsl,
            fragmentShader: `${commonGlsl}\n${fragGlsl}`,
            uniforms: {
                uSkyView: { value: this.luts.skyView.texture },
                uTransmittance: { value: this.luts.transmittance.texture },
                uCameraPos: { value: this.cameraPos.clone() },
                uSunDirection: { value: this.sunDir.clone() },
                uInvViewProj: { value: new THREE.Matrix4() },
                uExposure: { value: opts.exposure ?? 1.0 },
                uSunDiskAngle: { value: (sunDiskAngleDeg * Math.PI) / 180 },
                uSolarIrradiance: {
                    value: opts.solarIrradiance?.clone() ?? new THREE.Vector3(1.474, 1.8504, 1.91198),
                },
                uAtmosphereRadius: { value: atmosphereRadius },
            },
            transparent: true,
            depthTest: true,
            depthWrite: false,
            blending: THREE.NormalBlending,
        });
        // Fullscreen-triangle geometry. The vertex shader generates the clip
        // positions from `gl_VertexID`, so the buffer just provides 3 verts.
        this.geometry = new THREE.BufferGeometry();
        this.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
        this.geometry.setDrawRange(0, 3);
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.frustumCulled = false;
        this.mesh.renderOrder = 1;
    }
    /**
     * Sky-view LUT colour texture. Exposed so the land/water shaders can
     * sample the same precomputed sky radiance for in-shader aerial
     * perspective (haze tint) — see `LandMaterial`/`WaterMaterial`
     * `uSkyView`. The LUT updates whenever camera or sun moves.
     */
    get skyViewTexture() {
        return this.luts.skyView.texture;
    }
    /** Current exposure multiplier; surface haze uses the same value so the
     *  rim tint colour-matches the visible halo. */
    get exposure() {
        return this.material.uniforms.uExposure.value;
    }
    setSunDirection(dir) {
        this.sunDir.copy(dir).normalize();
        this.material.uniforms.uSunDirection.value.copy(this.sunDir);
        this.dirty = true;
    }
    syncFromCamera(camera) {
        camera.getWorldPosition(this.tmpCameraPos);
        if (!this.tmpCameraPos.equals(this.cameraPos)) {
            this.cameraPos.copy(this.tmpCameraPos);
            this.dirty = true;
        }
        this.material.uniforms.uCameraPos.value.copy(this.cameraPos);
        this.tmpInvViewProj.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        this.tmpInvViewProj.invert();
        this.material.uniforms.uInvViewProj.value.copy(this.tmpInvViewProj);
        if (this.dirty) {
            this.luts.recompute(this.cameraPos, this.sunDir);
            this.dirty = false;
        }
    }
    // `scene-graph.ts` calls this every frame from the Tweakpane apply path.
    // Skip the LUT rebake when nothing actually changed — otherwise `recomputeAll`
    // re-renders the sky-view LUT every frame on top of `syncFromCamera` doing the
    // same, doubling the sky-view bake cost.
    setScales(rayleigh, mie, atmosphereRadius) {
        if (rayleigh === this.prevRayleighScale &&
            mie === this.prevMieScale &&
            atmosphereRadius === this.prevAtmosphereRadius) {
            return;
        }
        this.prevRayleighScale = rayleigh;
        this.prevMieScale = mie;
        this.prevAtmosphereRadius = atmosphereRadius;
        this.material.uniforms.uAtmosphereRadius.value = atmosphereRadius;
        this.luts.recomputeAll(this.cameraPos, this.sunDir, {
            rayleigh,
            mie,
            atmosphereRadius,
        });
    }
    setExposure(exposure) {
        this.material.uniforms.uExposure.value = exposure;
    }
    setSunDiskAngleDeg(deg) {
        this.material.uniforms.uSunDiskAngle.value = (deg * Math.PI) / 180;
    }
    dispose() {
        this.geometry.dispose();
        this.material.dispose();
        this.luts.dispose();
    }
}

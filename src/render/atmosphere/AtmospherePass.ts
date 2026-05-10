/**
 * Hillaire 2020 atmosphere pass — replaces the Phase 2 fresnel placeholder.
 *
 * Three precomputed LUTs (transmittance, multi-scattering, sky-view) feed
 * a runtime fullscreen-triangle Mesh that alpha-composites the sky over
 * the globe. The Mesh is `attached to the scene with `depthTest=false` and
 * `renderOrder=1`, so it draws after the globe and before any post-FX.
 *
 * Public API preserved from Phase 2 (constructor, mesh, material,
 * `setSunDirection`, `dispose`) so [scene-graph.ts](../scene-graph.ts)'s
 * `scene.add(atmosphere.mesh)` line works unchanged. The constructor now
 * also requires a `THREE.WebGLRenderer` because LUT precompute happens at
 * construction.
 *
 * See `docs/adr/0007-bruneton-hillaire-atmosphere.md`.
 */

import * as THREE from 'three';

import { AtmosphereLuts } from './AtmosphereLuts.js';
import { source as commonGlsl } from './shaders/common.glsl.js';
import { source as vertGlsl } from './shaders/fullscreen.vert.glsl.js';
import { source as fragGlsl } from './shaders/atmosphere.frag.glsl.js';

export type AtmosphereOptions = {
  rayleighScale?: number;
  mieScale?: number;
  exposure?: number;
  sunDiskAngleDeg?: number;
  solarIrradiance?: THREE.Vector3;
  atmosphereRadius?: number;
};

export class AtmospherePass {
  readonly mesh: THREE.Mesh;
  readonly material: THREE.RawShaderMaterial;
  private readonly luts: AtmosphereLuts;
  private readonly geometry: THREE.BufferGeometry;
  private readonly tmpInvViewProj = new THREE.Matrix4();
  private readonly tmpCameraPos = new THREE.Vector3();
  private readonly sunDir = new THREE.Vector3(1, 0, 0.3).normalize();
  private readonly cameraPos = new THREE.Vector3(3, 0, 0);
  private dirty = true;

  constructor(renderer: THREE.WebGLRenderer, opts: AtmosphereOptions = {}) {
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
      depthTest: false,
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

  setSunDirection(dir: THREE.Vector3): void {
    this.sunDir.copy(dir).normalize();
    (this.material.uniforms.uSunDirection!.value as THREE.Vector3).copy(this.sunDir);
    this.dirty = true;
  }

  /**
   * Push the current camera state into uniforms + re-render the sky-view
   * LUT if anything changed since last frame. Called by `scene-graph.ts`
   * before composer.render so the runtime fragment shader has fresh
   * `uInvViewProj` + a coherent sky-view LUT.
   */
  syncFromCamera(camera: THREE.PerspectiveCamera): void {
    camera.getWorldPosition(this.tmpCameraPos);
    if (!this.tmpCameraPos.equals(this.cameraPos)) {
      this.cameraPos.copy(this.tmpCameraPos);
      this.dirty = true;
    }
    (this.material.uniforms.uCameraPos!.value as THREE.Vector3).copy(this.cameraPos);
    this.tmpInvViewProj.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.tmpInvViewProj.invert();
    (this.material.uniforms.uInvViewProj!.value as THREE.Matrix4).copy(this.tmpInvViewProj);

    if (this.dirty) {
      this.luts.recompute(this.cameraPos, this.sunDir);
      this.dirty = false;
    }
  }

  setScales(rayleigh: number, mie: number, atmosphereRadius?: number): void {
    const radius = atmosphereRadius ?? this.luts.getAtmosphereRadius();
    this.material.uniforms.uAtmosphereRadius!.value = radius;
    this.luts.recomputeAll(this.cameraPos, this.sunDir, {
      rayleigh,
      mie,
      atmosphereRadius: radius,
    });
  }

  setExposure(exposure: number): void {
    this.material.uniforms.uExposure!.value = exposure;
  }

  setSunDiskAngleDeg(deg: number): void {
    this.material.uniforms.uSunDiskAngle!.value = (deg * Math.PI) / 180;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.luts.dispose();
  }
}

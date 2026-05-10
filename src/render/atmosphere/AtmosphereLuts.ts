/**
 * Owns the three Hillaire-2020 atmosphere LUTs and runs the precompute
 * passes. Two LUTs are sun-direction-independent (transmittance,
 * multi-scattering) and built once at construction. The sky-view LUT is
 * sun-and-camera-dependent and re-rendered on `recompute(...)`.
 *
 * All three are RGBA16F (or RGBA32F if EXT_color_buffer_float is missing —
 * unlikely on modern WebGL2 hardware). NoColorSpace, LinearFilter, the two
 * 2D LUTs use ClampToEdge; the sky-view LUT uses RepeatWrapping on U so the
 * azimuth seam at 0/2π is invisible.
 */

import * as THREE from 'three';

import {
  TRANSMITTANCE_LUT_WIDTH,
  TRANSMITTANCE_LUT_HEIGHT,
  createTransmittanceMaterial,
} from './lut/transmittance.js';
import {
  MULTI_SCATTERING_LUT_WIDTH,
  MULTI_SCATTERING_LUT_HEIGHT,
  createMultiScatteringMaterial,
} from './lut/multiScattering.js';
import { SKY_VIEW_LUT_WIDTH, SKY_VIEW_LUT_HEIGHT, createSkyViewMaterial } from './lut/skyView.js';

export type AtmosphereLutsOptions = {
  rayleighScale?: number;
  mieScale?: number;
  solarIrradiance?: THREE.Vector3;
  atmosphereRadius?: number;
};

export class AtmosphereLuts {
  readonly transmittance: THREE.WebGLRenderTarget;
  readonly multiScattering: THREE.WebGLRenderTarget;
  readonly skyView: THREE.WebGLRenderTarget;

  private readonly transmittanceMat: THREE.RawShaderMaterial;
  private readonly multiScatteringMat: THREE.RawShaderMaterial;
  private readonly skyViewMat: THREE.RawShaderMaterial;

  private readonly quadGeom: THREE.BufferGeometry;
  private readonly quadMesh: THREE.Mesh;
  private readonly quadScene: THREE.Scene;
  private readonly quadCamera: THREE.OrthographicCamera;

  private rayleighScale: number;
  private mieScale: number;
  private atmosphereRadius: number;

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    opts: AtmosphereLutsOptions = {},
  ) {
    const ctx = renderer.getContext() as WebGL2RenderingContext;
    const hasFloatBuffer = ctx.getExtension('EXT_color_buffer_float') !== null;
    const textureType = hasFloatBuffer ? THREE.HalfFloatType : THREE.FloatType;

    this.rayleighScale = opts.rayleighScale ?? 1;
    this.mieScale = opts.mieScale ?? 1;
    this.atmosphereRadius = opts.atmosphereRadius ?? 1.07;

    this.transmittance = makeRT(
      TRANSMITTANCE_LUT_WIDTH,
      TRANSMITTANCE_LUT_HEIGHT,
      textureType,
      false,
    );
    this.multiScattering = makeRT(
      MULTI_SCATTERING_LUT_WIDTH,
      MULTI_SCATTERING_LUT_HEIGHT,
      textureType,
      false,
    );
    this.skyView = makeRT(SKY_VIEW_LUT_WIDTH, SKY_VIEW_LUT_HEIGHT, textureType, /* wrapU */ true);

    const irradiance = opts.solarIrradiance;
    this.transmittanceMat = createTransmittanceMaterial({
      rayleighScale: this.rayleighScale,
      mieScale: this.mieScale,
      atmosphereRadius: this.atmosphereRadius,
    });
    this.multiScatteringMat = createMultiScatteringMaterial(this.transmittance.texture, {
      rayleighScale: this.rayleighScale,
      mieScale: this.mieScale,
      atmosphereRadius: this.atmosphereRadius,
      ...(irradiance ? { solarIrradiance: irradiance } : {}),
    });
    this.skyViewMat = createSkyViewMaterial(
      this.transmittance.texture,
      this.multiScattering.texture,
      {
        rayleighScale: this.rayleighScale,
        mieScale: this.mieScale,
        atmosphereRadius: this.atmosphereRadius,
        ...(irradiance ? { solarIrradiance: irradiance } : {}),
      },
    );

    // Fullscreen-triangle setup. The vertex shader synthesises clip-space
    // positions from `gl_VertexID`, so the geometry just needs three vertices.
    this.quadGeom = new THREE.BufferGeometry();
    this.quadGeom.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array([0, 0, 0, 0, 0, 0, 0, 0, 0]), 3),
    );
    this.quadGeom.setDrawRange(0, 3);
    this.quadMesh = new THREE.Mesh(this.quadGeom, this.transmittanceMat);
    this.quadMesh.frustumCulled = false;
    this.quadScene = new THREE.Scene();
    this.quadScene.add(this.quadMesh);
    this.quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.precomputeTwoStaticLuts();
  }

  private precomputeTwoStaticLuts(): void {
    const prevTarget = this.renderer.getRenderTarget();
    const prevAuto = this.renderer.autoClear;
    this.renderer.autoClear = true;

    this.quadMesh.material = this.transmittanceMat;
    this.renderer.setRenderTarget(this.transmittance);
    this.renderer.render(this.quadScene, this.quadCamera);

    this.quadMesh.material = this.multiScatteringMat;
    this.renderer.setRenderTarget(this.multiScattering);
    this.renderer.render(this.quadScene, this.quadCamera);

    this.renderer.setRenderTarget(prevTarget);
    this.renderer.autoClear = prevAuto;
  }

  /**
   * Re-render the sky-view LUT for the current camera position + sun
   * direction. Cheap (~0.5 ms on integrated GPU); call freely on slider
   * input.
   */
  recompute(cameraPos: THREE.Vector3, sunDir: THREE.Vector3): void {
    const u = this.skyViewMat.uniforms;
    (u.uCameraPos!.value as THREE.Vector3).copy(cameraPos);
    (u.uSunDirection!.value as THREE.Vector3).copy(sunDir).normalize();

    const prevTarget = this.renderer.getRenderTarget();
    const prevAuto = this.renderer.autoClear;
    this.renderer.autoClear = true;
    this.quadMesh.material = this.skyViewMat;
    this.renderer.setRenderTarget(this.skyView);
    this.renderer.render(this.quadScene, this.quadCamera);
    this.renderer.setRenderTarget(prevTarget);
    this.renderer.autoClear = prevAuto;
  }

  /**
   * Re-render every LUT (used when rayleighScale / mieScale change — those
   * affect optical depth, so transmittance + multi-scatter + sky-view all
   * change). Caller is responsible for also passing the current camera +
   * sun via `recompute(...)` afterward.
   */
  recomputeAll(
    cameraPos: THREE.Vector3,
    sunDir: THREE.Vector3,
    scales: { rayleigh: number; mie: number; atmosphereRadius: number },
  ): void {
    const radiusChanged = scales.atmosphereRadius !== this.atmosphereRadius;
    const scalesChanged =
      scales.rayleigh !== this.rayleighScale || scales.mie !== this.mieScale;
    if (scalesChanged || radiusChanged) {
      this.rayleighScale = scales.rayleigh;
      this.mieScale = scales.mie;
      this.atmosphereRadius = scales.atmosphereRadius;
      this.transmittanceMat.uniforms.uRayleighScale!.value = scales.rayleigh;
      this.transmittanceMat.uniforms.uMieScale!.value = scales.mie;
      this.transmittanceMat.uniforms.uAtmosphereRadius!.value = scales.atmosphereRadius;
      this.multiScatteringMat.uniforms.uRayleighScale!.value = scales.rayleigh;
      this.multiScatteringMat.uniforms.uMieScale!.value = scales.mie;
      this.multiScatteringMat.uniforms.uAtmosphereRadius!.value = scales.atmosphereRadius;
      this.skyViewMat.uniforms.uRayleighScale!.value = scales.rayleigh;
      this.skyViewMat.uniforms.uMieScale!.value = scales.mie;
      this.skyViewMat.uniforms.uAtmosphereRadius!.value = scales.atmosphereRadius;
      this.precomputeTwoStaticLuts();
    }
    this.recompute(cameraPos, sunDir);
  }

  getAtmosphereRadius(): number {
    return this.atmosphereRadius;
  }

  dispose(): void {
    this.transmittance.dispose();
    this.multiScattering.dispose();
    this.skyView.dispose();
    this.transmittanceMat.dispose();
    this.multiScatteringMat.dispose();
    this.skyViewMat.dispose();
    this.quadGeom.dispose();
  }
}

function makeRT(
  width: number,
  height: number,
  type: THREE.TextureDataType,
  wrapU: boolean,
): THREE.WebGLRenderTarget {
  const rt = new THREE.WebGLRenderTarget(width, height, {
    type,
    format: THREE.RGBAFormat,
    colorSpace: THREE.NoColorSpace,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    wrapS: wrapU ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    depthBuffer: false,
    stencilBuffer: false,
  });
  rt.texture.generateMipmaps = false;
  return rt;
}

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

import { DEFAULTS } from '../../debug/defaults.js';

const ATMOSPHERE_FRAG = `// Runtime atmosphere fragment shader (GLSL3). Hillaire 2020-style
// precomputed-LUT lookup + sun disk.
//
// The pass is a fullscreen triangle (see \`fullscreen.vert.glsl\`) drawn at
// \`renderOrder=1\` with \`depthTest=true\`. The vertex shader emits at the far
// plane so the depth test passes only where no opaque geometry was drawn —
// the rendered terrain silhouette punches through the halo. Alpha is 1
// where the line of sight passes only through atmosphere, fading to ~0 if
// the ray exits without hitting anything (deep space) — but we keep alpha
// slightly above 0 so the rim isn't crushed against the dark background.

precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uSkyView;
uniform sampler2D uTransmittance;
uniform vec3 uCameraPos;       // world-space, planet at origin
uniform vec3 uSunDirection;    // world-space, normalised
uniform mat4 uInvViewProj;     // inverse(projection * view)
uniform float uExposure;
uniform float uSunDiskAngle;   // radians (cos threshold derived in shader)
uniform vec3 uSolarIrradiance;

void cameraBasisRuntime(vec3 cam, vec3 sunDir, out vec3 cUp, out vec3 cAzRef, out vec3 cTangent) {
  cUp = normalize(cam);
  vec3 sunInPlane = sunDir - dot(sunDir, cUp) * cUp;
  float l = length(sunInPlane);
  cAzRef = (l > 1e-4)
    ? sunInPlane / l
    : normalize(cross(cUp, vec3(1.0, 0.0, 0.0)));
  cTangent = cross(cUp, cAzRef);
}

void main() {
  // Reconstruct world-space view ray from screen UV.
  vec4 ndcNear = vec4(vUv * 2.0 - 1.0, -1.0, 1.0);
  vec4 ndcFar  = vec4(vUv * 2.0 - 1.0,  1.0, 1.0);
  vec4 wn = uInvViewProj * ndcNear;
  vec4 wf = uInvViewProj * ndcFar;
  vec3 worldNear = wn.xyz / wn.w;
  vec3 worldFar = wf.xyz / wf.w;
  vec3 dir = normalize(worldFar - worldNear);

  // Project view dir into camera-local (up, az-ref-toward-sun, tangent) frame.
  vec3 cUp, cAzRef, cTangent;
  cameraBasisRuntime(uCameraPos, uSunDirection, cUp, cAzRef, cTangent);

  float zenith = acos(clamp(dot(dir, cUp), -1.0, 1.0));
  float az = atan(dot(dir, cTangent), dot(dir, cAzRef));
  if (az < 0.0) az += 2.0 * PI;

  // Match the sky-view LUT's non-linear zenith parameterization: samples
  // are clustered around the camera's horizon so a thin atmosphere shell
  // occupies enough LUT pixels to survive bilinear filtering. Both shaders
  // must compute horizonZ identically from uCameraPos.
  float r0 = length(uCameraPos);
  float s0 = clamp(PLANET_RADIUS / r0, 0.0, 1.0);
  float horizonZ = PI - asin(s0);
  float vCoord;
  if (zenith < horizonZ) {
    float t = sqrt(max(0.0, 1.0 - zenith / horizonZ));
    vCoord = 0.5 - 0.5 * t;
  } else {
    float t = sqrt(clamp((zenith - horizonZ) / (PI - horizonZ), 0.0, 1.0));
    vCoord = 0.5 + 0.5 * t;
  }
  vec2 lutUv = vec2(az / (2.0 * PI), vCoord);
  vec3 sky = texture(uSkyView, lutUv).rgb;

  // Sun disk: visible if cosTheta with sun > cos(uSunDiskAngle), modulated by
  // transmittance from camera through atmosphere along the view ray.
  float cosTheta = dot(dir, uSunDirection);
  float cosDisk = cos(uSunDiskAngle);
  if (cosTheta > cosDisk) {
    float edge = smoothstep(cosDisk, cosDisk + 0.0008, cosTheta);
    // Transmittance from camera to sun along view ray. Approximate by
    // sampling LUT at camera altitude × view-zenith (μ = dot(dir, cUp)).
    float r = length(uCameraPos);
    // Camera is outside atmosphere; clamp h to atmosphere radius for LUT.
    float h = min(r, uAtmosphereRadius);
    float mu = clamp(dot(dir, cUp), -1.0, 1.0);
    vec3 T = sampleTransmittance(uTransmittance, h, mu);
    sky += edge * T * uSolarIrradiance;
  }

  // Apply exposure, output linear (postfx grade does final tonemap in M8).
  vec3 col = sky * uExposure;

  // Alpha: exponential rolloff so faint outer pixels fade smoothly into
  // space rather than cutting off as a hard line.
  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
  float alpha = 1.0 - exp(-lum * 6.0);

  fragColor = vec4(col, alpha);
}
`;

export type AtmosphereOptions = {
  rayleighScale?: number;
  mieScale?: number;
  exposure?: number;
  sunDiskAngleDeg?: number;
  solarIrradiance?: THREE.Vector3;
  atmosphereRadius?: number;
};

// Tweakpane stores `sunDiskSize`; `scene-graph.applyMaterials` multiplies
// by 3 to get the angular degrees the atmosphere shader integrates.
// Mirror that here for the first-frame default so the LUT bake and the
// Tweakpane state agree before any frame ticks.
const SUN_DISK_DEG_PER_TWEAK = 3;

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
  private prevRayleighScale = NaN;
  private prevMieScale = NaN;
  private prevAtmosphereRadius = NaN;
  private readonly prevSolarIrradiance: { r: number; g: number; b: number };

  constructor(renderer: THREE.WebGLRenderer, opts: AtmosphereOptions = {}) {
    const a = DEFAULTS.materials.atmosphere;
    const atmosphereRadius = opts.atmosphereRadius ?? 1.07;
    this.luts = new AtmosphereLuts(renderer, {
      rayleighScale: opts.rayleighScale ?? a.rayleighScale,
      mieScale: opts.mieScale ?? a.mieScale,
      atmosphereRadius,
      ...(opts.solarIrradiance ? { solarIrradiance: opts.solarIrradiance } : {}),
    });

    const initialIrradiance = opts.solarIrradiance ?? new THREE.Vector3(1.474, 1.8504, 1.91198);
    this.prevSolarIrradiance = {
      r: initialIrradiance.x,
      g: initialIrradiance.y,
      b: initialIrradiance.z,
    };

    const sunDiskAngleDeg = opts.sunDiskAngleDeg ?? a.sunDiskSize * SUN_DISK_DEG_PER_TWEAK;
    this.material = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: vertGlsl,
      fragmentShader: `${commonGlsl}\n${ATMOSPHERE_FRAG}`,
      uniforms: {
        uSkyView: { value: this.luts.skyView.texture },
        uTransmittance: { value: this.luts.transmittance.texture },
        uCameraPos: { value: this.cameraPos.clone() },
        uSunDirection: { value: this.sunDir.clone() },
        uInvViewProj: { value: new THREE.Matrix4() },
        uExposure: { value: opts.exposure ?? a.exposure },
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
  get skyViewTexture(): THREE.Texture {
    return this.luts.skyView.texture;
  }

  /** Current exposure multiplier; surface haze uses the same value so the
   *  rim tint colour-matches the visible halo. */
  get exposure(): number {
    return this.material.uniforms.uExposure!.value as number;
  }

  setSunDirection(dir: THREE.Vector3): void {
    this.sunDir.copy(dir).normalize();
    (this.material.uniforms.uSunDirection!.value as THREE.Vector3).copy(this.sunDir);
    this.dirty = true;
  }

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

  // `scene-graph.ts` calls this every frame from the Tweakpane apply path.
  // Skip the LUT rebake when nothing actually changed — otherwise `recomputeAll`
  // re-renders the sky-view LUT every frame on top of `syncFromCamera` doing the
  // same, doubling the sky-view bake cost.
  setScales(rayleigh: number, mie: number, atmosphereRadius: number): void {
    if (
      rayleigh === this.prevRayleighScale &&
      mie === this.prevMieScale &&
      atmosphereRadius === this.prevAtmosphereRadius
    ) {
      return;
    }
    this.prevRayleighScale = rayleigh;
    this.prevMieScale = mie;
    this.prevAtmosphereRadius = atmosphereRadius;
    this.material.uniforms.uAtmosphereRadius!.value = atmosphereRadius;
    this.luts.recomputeAll(this.cameraPos, this.sunDir, {
      rayleigh,
      mie,
      atmosphereRadius,
    });
  }

  setExposure(exposure: number): void {
    this.material.uniforms.uExposure!.value = exposure;
  }

  // Tints the haze/sky by shifting the per-channel top-of-atmosphere sun
  // colour. Re-bakes the multi-scatter LUT (which depends on irradiance)
  // and marks dirty so the sky-view LUT rebakes next syncFromCamera.
  // Cached: idle frames short-circuit when the value hasn't moved.
  setSolarIrradiance(r: number, g: number, b: number): void {
    if (
      r === this.prevSolarIrradiance.r &&
      g === this.prevSolarIrradiance.g &&
      b === this.prevSolarIrradiance.b
    ) {
      return;
    }
    this.prevSolarIrradiance.r = r;
    this.prevSolarIrradiance.g = g;
    this.prevSolarIrradiance.b = b;
    (this.material.uniforms.uSolarIrradiance!.value as THREE.Vector3).set(r, g, b);
    this.luts.setSolarIrradiance(r, g, b);
    this.dirty = true;
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

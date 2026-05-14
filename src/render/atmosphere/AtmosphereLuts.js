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
import { source as commonGlsl } from './shaders/common.glsl.js';
import { source as vertGlsl } from './shaders/fullscreen.vert.glsl.js';
export const TRANSMITTANCE_LUT_WIDTH = 256;
export const TRANSMITTANCE_LUT_HEIGHT = 64;
export const MULTI_SCATTERING_LUT_WIDTH = 32;
export const MULTI_SCATTERING_LUT_HEIGHT = 32;
export const SKY_VIEW_LUT_WIDTH = 200;
export const SKY_VIEW_LUT_HEIGHT = 100;
const LUT_TRANSMITTANCE_FRAG = `// Transmittance LUT (256×64 RGBA16F).
// Output: exp(-∫extinction·ds) along the ray from a point at height \`h\` in
// direction \`μ\` (cos view-zenith) all the way to the top of atmosphere (or
// hits the planet surface — in that case t→ground hit, giving full
// occlusion which the runtime sees as "this sunlight is blocked").
//
// \`common.glsl\` is concatenated above this file at material creation.

precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform float uRayleighScale;
uniform float uMieScale;

const int TRANSMITTANCE_STEPS = 40;

void main() {
  float h, mu;
  transmittanceUvToHmu(vUv, h, mu);

  // Ray from (0, 0, h) along (sqrt(1-μ²), 0, μ). We don't need world axes —
  // the transmittance integral only depends on h(s) along the ray.
  vec3 origin = vec3(0.0, 0.0, h);
  vec3 dir = vec3(sqrt(max(0.0, 1.0 - mu * mu)), 0.0, mu);

  float tTop = raySphereFar(origin, dir, uAtmosphereRadius);
  float tGround = raySphereNearest(origin, dir, PLANET_RADIUS);
  float tEnd = (tGround > 0.0) ? tGround : tTop;
  if (tEnd < 0.0) {
    fragColor = vec4(1.0, 1.0, 1.0, 1.0);
    return;
  }
  float ds = tEnd / float(TRANSMITTANCE_STEPS);

  vec3 opticalDepth = vec3(0.0);
  for (int i = 0; i < TRANSMITTANCE_STEPS; ++i) {
    float t = (float(i) + 0.5) * ds;
    vec3 p = origin + dir * t;
    float altKm = positionToAltKm(p);
    opticalDepth += extinctionPerUnit(altKm, uRayleighScale, uMieScale) * ds;
  }

  vec3 transmittance = exp(-opticalDepth);
  fragColor = vec4(transmittance, 1.0);
}
`;
const LUT_MULTISCATTERING_FRAG = `// Multi-scattering LUT (32×32 RGBA16F).
// For each (height, μ_sun): computes the integrated multi-scattering
// contribution L_2 by averaging single-scatter radiance over a small set of
// directions, then folding the geometric series 1 + ψ + ψ² + … = 1/(1-ψ)
// per Hillaire 2020 §5.5.
//
// Reads the precomputed \`uTransmittance\` LUT.
// Output is in linear radiance, RGB. The runtime pass (or the sky-view LUT)
// looks this up at every march step and adds it to single-scatter.

precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uTransmittance;
uniform float uRayleighScale;
uniform float uMieScale;
uniform vec3 uSolarIrradiance; // top-of-atmosphere solar spectrum (RGB)

const int MS_RAY_DIRS_SQRT = 8;       // 8×8 = 64 directions on the unit sphere
const int MS_RAY_STEPS = 20;          // ray-march per direction

// Sample point's (h, μ_sun) → world-frame: place planet center at origin,
// point at (0,0,h), sun direction parameterised by μ_sun (cos angle from zenith).
//
// Multi-scattering integrand at sample point:
//   L_2(p, ω) = ∫ φ_iso · σ_s(p) · T(p, p+ω·s) · L_sun(p+ω·s) ds
// where the inner is single-scatter from the sun along the ray ω, computed
// by ray-march. The outer integral over ω uses uniform-sphere directions.

vec3 marchDir(int dirIdx, vec3 origin, vec3 dir, vec3 sunDir) {
  // March from \`origin\` along \`dir\`, accumulate single-scatter contribution
  // out to TOA / ground, return integrated radiance.
  float tTop = raySphereFar(origin, dir, uAtmosphereRadius);
  float tGround = raySphereNearest(origin, dir, PLANET_RADIUS);
  float tEnd = (tGround > 0.0) ? tGround : tTop;
  if (tEnd <= 0.0) return vec3(0.0);

  float ds = tEnd / float(MS_RAY_STEPS);
  vec3 transmittanceFromOrigin = vec3(1.0);
  vec3 inscattering = vec3(0.0);

  for (int i = 0; i < MS_RAY_STEPS; ++i) {
    float t = (float(i) + 0.5) * ds;
    vec3 p = origin + dir * t;
    float h = length(p);
    float altKm = max(0.0, h - PLANET_RADIUS) * kmPerUnit();

    vec3 ext = extinctionPerUnit(altKm, uRayleighScale, uMieScale);
    vec3 stepT = exp(-ext * ds);

    ScatteringPerUnit sc = scatteringPerUnit(altKm, uRayleighScale, uMieScale);

    // Sun visibility from this sample point.
    float muSunLocal = dot(normalize(p), sunDir);
    vec3 sunT = sampleTransmittance(uTransmittance, h, muSunLocal);

    // Isotropic phase (per-direction-averaged single-scatter; runtime pass
    // applies the proper phase later for primary scatter).
    vec3 phaseR = vec3(1.0 / (4.0 * PI));
    float phaseM = 1.0 / (4.0 * PI);

    vec3 stepInscatter = (sc.rayleigh * phaseR + sc.mie * phaseM) * sunT * uSolarIrradiance;
    // Riemann segment under exponential transmittance.
    vec3 segment = stepInscatter * (vec3(1.0) - stepT) / max(ext, vec3(1e-6));
    inscattering += transmittanceFromOrigin * segment;
    transmittanceFromOrigin *= stepT;
  }

  return inscattering;
}

void main() {
  float h, muSun;
  multiScatteringUvToHmu(vUv, h, muSun);

  // World frame: planet at origin, point at (0,0,h), sun direction in xz plane
  // with z = μ_sun. (Multi-scatter is rotationally symmetric around z, so this
  // choice is canonical.)
  vec3 origin = vec3(0.0, 0.0, h);
  vec3 sunDir = vec3(sqrt(max(0.0, 1.0 - muSun * muSun)), 0.0, muSun);

  vec3 lumTotal = vec3(0.0);
  vec3 fmsTotal = vec3(0.0);  // luminance ratio for the geometric-series factor
  float invDirCount = 1.0 / (float(MS_RAY_DIRS_SQRT) * float(MS_RAY_DIRS_SQRT));

  // Uniform spherical sampling: 8x8 grid in (cosθ, φ).
  for (int i = 0; i < MS_RAY_DIRS_SQRT; ++i) {
    for (int j = 0; j < MS_RAY_DIRS_SQRT; ++j) {
      float u1 = (float(i) + 0.5) / float(MS_RAY_DIRS_SQRT);
      float u2 = (float(j) + 0.5) / float(MS_RAY_DIRS_SQRT);
      float cosTheta = 1.0 - 2.0 * u1;
      float sinTheta = sqrt(max(0.0, 1.0 - cosTheta * cosTheta));
      float phi = 2.0 * PI * u2;
      vec3 dir = vec3(sinTheta * cos(phi), sinTheta * sin(phi), cosTheta);

      vec3 L = marchDir(0, origin, dir, sunDir);
      lumTotal += L * invDirCount;

      // Compute albedo-like ratio for ψ_ms: the fraction of light that comes
      // back as multi-scatter. Approximate with \`L / sunIrradiance\`.
      fmsTotal += (L / max(uSolarIrradiance, vec3(1e-6))) * invDirCount;
    }
  }

  // Hillaire Eq. 10: F_ms = L_2nd / (1 - ψ_ms)
  vec3 oneMinusPsi = max(vec3(1.0) - fmsTotal, vec3(1e-3));
  vec3 fms = lumTotal / oneMinusPsi;

  fragColor = vec4(fms, 1.0);
}
`;
const LUT_SKYVIEW_FRAG = `// Sky-view LUT (200×100 RGBA16F).
// Pre-rendered atmosphere radiance for each (azimuth-from-sun, view zenith)
// direction, *as seen from the current camera*. Re-rendered on
// \`setSunDirection\` and on camera-distance change. The runtime atmosphere
// fragment shader just samples this — saving the per-screen-pixel ray-march.
//
// Parameterisation:
//   u ∈ [0,1] : view azimuth relative to sun azimuth, [0, 2π] → [0, 1]
//   v ∈ [0,1] : view zenith from camera-local up, [0, π] (linear; we want
//               equal precision through both hemispheres, since "down" is
//               toward the planet and contains the bright limb)

precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uTransmittance;
uniform sampler2D uMultiScattering;
uniform vec3 uCameraPos;        // world-space, planet at origin
uniform vec3 uSunDirection;     // world-space, normalised
uniform float uRayleighScale;
uniform float uMieScale;
uniform vec3 uSolarIrradiance;

const int SKYVIEW_STEPS = 96;

// Non-linear zenith parameterization that clusters LUT samples around the
// horizon. Without this, a thin atmosphere shell occupies a sub-pixel slice
// of a uniformly-sampled LUT and bilinear filtering washes the halo out.
// The horizon angle depends on camera distance, so both bake and runtime
// shaders must compute it identically from \`uCameraPos\`.
float horizonZenithFromCam(vec3 cam) {
  float r = length(cam);
  float s = clamp(PLANET_RADIUS / r, 0.0, 1.0);
  return PI - asin(s);
}

// Decode LUT v ∈ [0,1] to view-zenith ∈ [0, π].
//   v < 0.5 → above horizon, sqrt-spaced from zenith=0 to horizon
//   v > 0.5 → below horizon, sqrt-spaced from horizon to zenith=π
float zenithFromV(float v, float horizonZenith) {
  if (v < 0.5) {
    float t = (0.5 - v) * 2.0;
    return horizonZenith * (1.0 - t * t);
  } else {
    float t = (v - 0.5) * 2.0;
    return horizonZenith + (PI - horizonZenith) * t * t;
  }
}

// Build an orthonormal basis at the camera. The basis vector \`up\` is the
// camera-to-planet "up" direction (away from planet center), \`right\` is
// perpendicular to (up, sunProjected), \`forward\` is up × right.
//
// \`sunDir\` is the sun direction in world space; we project it onto the plane
// perpendicular to \`up\` to get the azimuth reference direction.
void cameraBasis(vec3 cam, vec3 sunDir, out vec3 cUp, out vec3 cAzRef, out vec3 cTangent) {
  cUp = normalize(cam);
  vec3 sunInPlane = sunDir - dot(sunDir, cUp) * cUp;
  float sunInPlaneLen = length(sunInPlane);
  cAzRef = (sunInPlaneLen > 1e-4)
    ? sunInPlane / sunInPlaneLen
    : normalize(cross(cUp, vec3(1.0, 0.0, 0.0)));
  cTangent = cross(cUp, cAzRef);  // right-handed
}

// Convert (azimuth, zenith) to a world-space view direction.
vec3 dirFromAzimuthZenith(float az, float zenith, vec3 cUp, vec3 cAzRef, vec3 cTangent) {
  float sinZ = sin(zenith);
  float cosZ = cos(zenith);
  return cosZ * cUp + sinZ * (cos(az) * cAzRef + sin(az) * cTangent);
}

// March along view ray, accumulate radiance.
vec3 marchAtmosphere(vec3 origin, vec3 dir, vec3 sunDir) {
  // Find the segment of the ray inside the atmosphere shell.
  float tEnter = raySphereNearest(origin, dir, uAtmosphereRadius);
  float tFar = raySphereFar(origin, dir, uAtmosphereRadius);
  if (tFar <= 0.0) return vec3(0.0);
  // If camera is inside the atmosphere shell, integration begins at the camera
  // (t = 0). Otherwise it begins at the shell entry. raySphereNearest returns
  // the exit point when origin is inside, which would collapse tStart == tEnd
  // and produce zero radiance — visible as flicker as the camera crosses the
  // shell during zoom.
  bool insideAtm = dot(origin, origin) < uAtmosphereRadius * uAtmosphereRadius;
  float tStart = insideAtm ? 0.0 : max(tEnter, 0.0);
  // If the ray hits the planet, integrate up to the ground hit.
  float tGround = raySphereNearest(origin, dir, PLANET_RADIUS);
  float tEnd = (tGround > 0.0 && tGround > tStart) ? tGround : tFar;
  if (tEnd <= tStart) return vec3(0.0);

  float ds = (tEnd - tStart) / float(SKYVIEW_STEPS);
  vec3 inscattering = vec3(0.0);
  vec3 throughput = vec3(1.0);

  float cosTheta = dot(dir, sunDir);
  float pR = phaseRayleigh(cosTheta);
  float pM = phaseMie(cosTheta);

  for (int i = 0; i < SKYVIEW_STEPS; ++i) {
    float t = tStart + (float(i) + 0.5) * ds;
    vec3 p = origin + dir * t;
    float h = length(p);
    float altKm = max(0.0, h - PLANET_RADIUS) * kmPerUnit();

    vec3 ext = extinctionPerUnit(altKm, uRayleighScale, uMieScale);
    vec3 stepT = exp(-ext * ds);

    ScatteringPerUnit sc = scatteringPerUnit(altKm, uRayleighScale, uMieScale);

    // Sun visibility from sample point (transmittance LUT lookup).
    float muSun = dot(normalize(p), sunDir);
    vec3 sunT = sampleTransmittance(uTransmittance, h, muSun);

    // Multi-scatter ambient at this point.
    vec3 ms = sampleMultiScattering(uMultiScattering, h, muSun);

    vec3 single = (sc.rayleigh * pR + sc.mie * pM) * sunT * uSolarIrradiance;
    vec3 multi = (sc.rayleigh + sc.mie) * ms;
    vec3 stepIn = single + multi;
    vec3 segment = stepIn * (vec3(1.0) - stepT) / max(ext, vec3(1e-6));

    inscattering += throughput * segment;
    throughput *= stepT;
  }

  return inscattering;
}

void main() {
  float azimuth = vUv.x * 2.0 * PI;
  float horizonZ = horizonZenithFromCam(uCameraPos);
  float zenith = zenithFromV(vUv.y, horizonZ);

  vec3 cUp, cAzRef, cTangent;
  cameraBasis(uCameraPos, uSunDirection, cUp, cAzRef, cTangent);

  vec3 dir = dirFromAzimuthZenith(azimuth, zenith, cUp, cAzRef, cTangent);
  vec3 L = marchAtmosphere(uCameraPos, dir, uSunDirection);
  fragColor = vec4(L, 1.0);
}
`;
function createTransmittanceMaterial(opts) {
    return new THREE.RawShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: vertGlsl,
        fragmentShader: `${commonGlsl}\n${LUT_TRANSMITTANCE_FRAG}`,
        uniforms: {
            uRayleighScale: { value: opts.rayleighScale },
            uMieScale: { value: opts.mieScale },
            uAtmosphereRadius: { value: opts.atmosphereRadius },
            uPlanetRadius: { value: opts.planetRadius },
        },
        depthTest: false,
        depthWrite: false,
    });
}
function createMultiScatteringMaterial(transmittanceTex, opts) {
    return new THREE.RawShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: vertGlsl,
        fragmentShader: `${commonGlsl}\n${LUT_MULTISCATTERING_FRAG}`,
        uniforms: {
            uTransmittance: { value: transmittanceTex },
            uRayleighScale: { value: opts.rayleighScale },
            uMieScale: { value: opts.mieScale },
            uSolarIrradiance: { value: opts.solarIrradiance },
            uAtmosphereRadius: { value: opts.atmosphereRadius },
            uPlanetRadius: { value: opts.planetRadius },
        },
        depthTest: false,
        depthWrite: false,
    });
}
function createSkyViewMaterial(transmittanceTex, multiScatteringTex, opts) {
    return new THREE.RawShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: vertGlsl,
        fragmentShader: `${commonGlsl}\n${LUT_SKYVIEW_FRAG}`,
        uniforms: {
            uTransmittance: { value: transmittanceTex },
            uMultiScattering: { value: multiScatteringTex },
            uCameraPos: { value: new THREE.Vector3(3, 0, 0) },
            uSunDirection: { value: new THREE.Vector3(1, 0, 0.3).normalize() },
            uRayleighScale: { value: opts.rayleighScale },
            uMieScale: { value: opts.mieScale },
            uSolarIrradiance: { value: opts.solarIrradiance },
            uAtmosphereRadius: { value: opts.atmosphereRadius },
            uPlanetRadius: { value: opts.planetRadius },
        },
        depthTest: false,
        depthWrite: false,
    });
}
export class AtmosphereLuts {
    renderer;
    transmittance;
    multiScattering;
    skyView;
    transmittanceMat;
    multiScatteringMat;
    skyViewMat;
    quadGeom;
    quadMesh;
    quadScene;
    quadCamera;
    rayleighScale;
    mieScale;
    atmosphereRadius;
    planetRadius;
    constructor(renderer, opts = {}) {
        this.renderer = renderer;
        const ctx = renderer.getContext();
        const hasFloatBuffer = ctx.getExtension('EXT_color_buffer_float') !== null;
        const textureType = hasFloatBuffer ? THREE.HalfFloatType : THREE.FloatType;
        this.rayleighScale = opts.rayleighScale ?? 1;
        this.mieScale = opts.mieScale ?? 1;
        this.atmosphereRadius = opts.atmosphereRadius ?? 1.07;
        this.planetRadius = opts.planetRadius ?? 1.0;
        this.transmittance = makeRT(TRANSMITTANCE_LUT_WIDTH, TRANSMITTANCE_LUT_HEIGHT, textureType, false);
        this.multiScattering = makeRT(MULTI_SCATTERING_LUT_WIDTH, MULTI_SCATTERING_LUT_HEIGHT, textureType, false);
        this.skyView = makeRT(SKY_VIEW_LUT_WIDTH, SKY_VIEW_LUT_HEIGHT, textureType, /* wrapU */ true);
        const irradiance = opts.solarIrradiance?.clone() ?? new THREE.Vector3(1.474, 1.8504, 1.91198);
        this.transmittanceMat = createTransmittanceMaterial({
            rayleighScale: this.rayleighScale,
            mieScale: this.mieScale,
            atmosphereRadius: this.atmosphereRadius,
            planetRadius: this.planetRadius,
        });
        this.multiScatteringMat = createMultiScatteringMaterial(this.transmittance.texture, {
            rayleighScale: this.rayleighScale,
            mieScale: this.mieScale,
            atmosphereRadius: this.atmosphereRadius,
            planetRadius: this.planetRadius,
            solarIrradiance: irradiance,
        });
        this.skyViewMat = createSkyViewMaterial(this.transmittance.texture, this.multiScattering.texture, {
            rayleighScale: this.rayleighScale,
            mieScale: this.mieScale,
            atmosphereRadius: this.atmosphereRadius,
            planetRadius: this.planetRadius,
            solarIrradiance: irradiance,
        });
        // Fullscreen-triangle setup. The vertex shader synthesises clip-space
        // positions from `gl_VertexID`, so the geometry just needs three vertices.
        this.quadGeom = new THREE.BufferGeometry();
        this.quadGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0, 0, 0, 0, 0, 0, 0]), 3));
        this.quadGeom.setDrawRange(0, 3);
        this.quadMesh = new THREE.Mesh(this.quadGeom, this.transmittanceMat);
        this.quadMesh.frustumCulled = false;
        this.quadScene = new THREE.Scene();
        this.quadScene.add(this.quadMesh);
        this.quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.precomputeTwoStaticLuts();
    }
    precomputeTwoStaticLuts() {
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
    recompute(cameraPos, sunDir) {
        const u = this.skyViewMat.uniforms;
        u.uCameraPos.value.copy(cameraPos);
        u.uSunDirection.value.copy(sunDir).normalize();
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
    recomputeAll(cameraPos, sunDir, scales) {
        const radiusChanged = scales.atmosphereRadius !== this.atmosphereRadius;
        const planetRadiusChanged = scales.planetRadius !== this.planetRadius;
        const scalesChanged = scales.rayleigh !== this.rayleighScale || scales.mie !== this.mieScale;
        if (scalesChanged || radiusChanged || planetRadiusChanged) {
            this.rayleighScale = scales.rayleigh;
            this.mieScale = scales.mie;
            this.atmosphereRadius = scales.atmosphereRadius;
            this.planetRadius = scales.planetRadius;
            this.transmittanceMat.uniforms.uRayleighScale.value = scales.rayleigh;
            this.transmittanceMat.uniforms.uMieScale.value = scales.mie;
            this.transmittanceMat.uniforms.uAtmosphereRadius.value = scales.atmosphereRadius;
            this.transmittanceMat.uniforms.uPlanetRadius.value = scales.planetRadius;
            this.multiScatteringMat.uniforms.uRayleighScale.value = scales.rayleigh;
            this.multiScatteringMat.uniforms.uMieScale.value = scales.mie;
            this.multiScatteringMat.uniforms.uAtmosphereRadius.value = scales.atmosphereRadius;
            this.multiScatteringMat.uniforms.uPlanetRadius.value = scales.planetRadius;
            this.skyViewMat.uniforms.uRayleighScale.value = scales.rayleigh;
            this.skyViewMat.uniforms.uMieScale.value = scales.mie;
            this.skyViewMat.uniforms.uAtmosphereRadius.value = scales.atmosphereRadius;
            this.skyViewMat.uniforms.uPlanetRadius.value = scales.planetRadius;
            this.precomputeTwoStaticLuts();
        }
        this.recompute(cameraPos, sunDir);
    }
    /**
     * Update solar irradiance and re-bake the multi-scatter LUT. The
     * transmittance LUT does not depend on irradiance (it integrates
     * extinction only), so it's untouched. The sky-view LUT's uniform is
     * updated here; its rebake happens next frame via `recompute()` when
     * the caller (AtmospherePass) marks itself dirty.
     */
    setSolarIrradiance(r, g, b) {
        this.multiScatteringMat.uniforms.uSolarIrradiance.value.set(r, g, b);
        this.skyViewMat.uniforms.uSolarIrradiance.value.set(r, g, b);
        const prevTarget = this.renderer.getRenderTarget();
        const prevAuto = this.renderer.autoClear;
        this.renderer.autoClear = true;
        this.quadMesh.material = this.multiScatteringMat;
        this.renderer.setRenderTarget(this.multiScattering);
        this.renderer.render(this.quadScene, this.quadCamera);
        this.renderer.setRenderTarget(prevTarget);
        this.renderer.autoClear = prevAuto;
    }
    getAtmosphereRadius() {
        return this.atmosphereRadius;
    }
    dispose() {
        this.transmittance.dispose();
        this.multiScattering.dispose();
        this.skyView.dispose();
        this.transmittanceMat.dispose();
        this.multiScatteringMat.dispose();
        this.skyViewMat.dispose();
        this.quadGeom.dispose();
    }
}
function makeRT(width, height, type, wrapU) {
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

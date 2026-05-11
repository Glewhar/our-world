// Inlined from lut-skyview.frag.glsl. Edit the GLSL inside the template literal —
// the source of truth lives here, no separate .glsl file on disk.
export const source = `// Sky-view LUT (200×100 RGBA16F).
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

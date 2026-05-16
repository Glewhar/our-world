// Inlined from common.glsl. Edit the GLSL inside the template literal —
// the source of truth lives here, no separate .glsl file on disk.
export const source = `// Hillaire 2020 atmosphere — shared physical constants & helpers (GLSL3).
//
// All distances are in *unit-sphere* units where 1.0 is the baseline (sea
// level at slider zero). Planet surface and atmosphere top are both
// uniforms (\`uPlanetRadius\`, \`uAtmosphereRadius\`) so the shell rides the
// sea-level slider and the altitude-exaggeration knob (Tweakpane →
// Altitude). \`100 km\` of real atmosphere is mapped onto the shell, so
// changing the radius dilates the integration domain while preserving the
// column-integral optical depth.
//
// Math source: \`jeantimex/precomputed_atmospheric_scattering\`.

// GLSL ES 3.00 requires explicit precision before any non-const float decl.
// common.glsl is concatenated before each frag shader, so set it here so the
// function signatures below (e.g. \`float raySphereNearest(...)\`) are valid.
precision highp float;
precision highp sampler2D;

const float PI = 3.14159265359;

// Planet radius tracks the rendered ocean surface (sea-level slider × altitude
// exaggeration), so the LUT physics and the visible water stay anchored to the
// same number. Atmosphere top is dynamic — driven from JS via Tweakpane →
// Altitude. All derived geometric values (thickness, horizon, km-per-unit
// conversion) are helpers that read the uniform; the GLSL compiler hoists
// them per draw. The \`PLANET_RADIUS\` define keeps existing call sites readable.
uniform float uPlanetRadius;
uniform float uAtmosphereRadius;
#define PLANET_RADIUS uPlanetRadius

const float REAL_ATMOS_KM = 100.0;

float atmosThickness() { return uAtmosphereRadius - PLANET_RADIUS; }
float hHorizon() {
  return sqrt(max(0.0, uAtmosphereRadius * uAtmosphereRadius - PLANET_RADIUS * PLANET_RADIUS));
}
float unitPerKm() { return atmosThickness() / REAL_ATMOS_KM; }
float kmPerUnit() { return REAL_ATMOS_KM / max(atmosThickness(), 1e-6); }

// Hillaire 2020 default Earth coefficients (per Mm = mega-meter = 1e6 m).
// Convert to per-km (× 1e-3), then × kmPerUnit() to get per-unit-radius.
// Stylisation multipliers are baked into uRayleighScale / uMieScale uniforms
// at the runtime, so leave the unit conversion only here.
const vec3 RAYLEIGH_BETA_PER_KM = vec3(5.802, 13.558, 33.1) * 1e-3; // 1/km
const float MIE_SCATTERING_PER_KM = 3.996e-3;                       // 1/km
const float MIE_EXTINCTION_PER_KM = MIE_SCATTERING_PER_KM * 1.11;
const vec3 OZONE_ABSORPTION_PER_KM = vec3(0.650, 1.881, 0.085) * 1e-3;

const float RAYLEIGH_SCALE_HEIGHT_KM = 8.0;
const float MIE_SCALE_HEIGHT_KM = 1.2;
const float OZONE_TENT_CENTER_KM = 25.0;
const float OZONE_TENT_HALFWIDTH_KM = 15.0;

// Mie phase parameter (Cornette-Shanks). 0.8 is a typical hazy-day value.
const float MIE_G = 0.8;

// Ray-sphere intersect from \`origin\` along unit \`dir\`. Returns the smallest
// non-negative t such that |origin + t·dir| = radius, or -1 if no hit.
float raySphereNearest(vec3 origin, vec3 dir, float radius) {
  float b = dot(origin, dir);
  float c = dot(origin, origin) - radius * radius;
  float disc = b * b - c;
  if (disc < 0.0) return -1.0;
  float sq = sqrt(disc);
  float t0 = -b - sq;
  float t1 = -b + sq;
  if (t0 >= 0.0) return t0;
  if (t1 >= 0.0) return t1;
  return -1.0;
}

// Far hit (largest non-negative t).
float raySphereFar(vec3 origin, vec3 dir, float radius) {
  float b = dot(origin, dir);
  float c = dot(origin, origin) - radius * radius;
  float disc = b * b - c;
  if (disc < 0.0) return -1.0;
  return -b + sqrt(disc);
}

// Density profile at altitude in km above ground. Returns vec3 = (Rayleigh, Mie, Ozone)
// number-density relative to ground level. Rayleigh + Mie are exponential;
// ozone is a tent centred on \`OZONE_TENT_CENTER_KM\`.
vec3 sampleDensityKm(float altKm) {
  float rho_R = exp(-altKm / RAYLEIGH_SCALE_HEIGHT_KM);
  float rho_M = exp(-altKm / MIE_SCALE_HEIGHT_KM);
  float rho_O = max(0.0, 1.0 - abs(altKm - OZONE_TENT_CENTER_KM) / OZONE_TENT_HALFWIDTH_KM);
  return vec3(rho_R, rho_M, rho_O);
}

// Extinction (per unit-radius) at altitude km. Caller multiplies by ds in
// unit-radius and exp-integrates.
vec3 extinctionPerUnit(float altKm, float rayleighScale, float mieScale) {
  vec3 d = sampleDensityKm(altKm);
  vec3 sigmaR = RAYLEIGH_BETA_PER_KM * rayleighScale * d.r * kmPerUnit();
  float sigmaMs = MIE_SCATTERING_PER_KM * mieScale * d.g * kmPerUnit();
  float sigmaMa = (MIE_EXTINCTION_PER_KM - MIE_SCATTERING_PER_KM) * mieScale * d.g * kmPerUnit();
  vec3 sigmaO = OZONE_ABSORPTION_PER_KM * d.b * kmPerUnit();
  return sigmaR + vec3(sigmaMs + sigmaMa) + sigmaO;
}

// Scattering coefficients (per unit-radius) at altitude km. These appear in
// the in-scattering integrand (multiplied by phase functions).
struct ScatteringPerUnit {
  vec3 rayleigh;
  float mie;
};

ScatteringPerUnit scatteringPerUnit(float altKm, float rayleighScale, float mieScale) {
  vec3 d = sampleDensityKm(altKm);
  ScatteringPerUnit s;
  s.rayleigh = RAYLEIGH_BETA_PER_KM * rayleighScale * d.r * kmPerUnit();
  s.mie = MIE_SCATTERING_PER_KM * mieScale * d.g * kmPerUnit();
  return s;
}

// Phase functions. cosTheta is angle between view ray and (sun-direction or
// in-scattered light direction).
float phaseRayleigh(float cosTheta) {
  return (3.0 / (16.0 * PI)) * (1.0 + cosTheta * cosTheta);
}

float phaseMie(float cosTheta) {
  float g = MIE_G;
  float g2 = g * g;
  float num = (1.0 - g2) * (1.0 + cosTheta * cosTheta);
  float denom = pow(max(0.0, 1.0 + g2 - 2.0 * g * cosTheta), 1.5) * (2.0 + g2);
  return (3.0 / (8.0 * PI)) * num / denom;
}

// LUT mapping: (height-from-center, μ = cos view zenith) → uv ∈ [0,1]² for the
// transmittance LUT. Uses Hillaire 2020 sqrt-parameterisation that compresses
// the horizon transition smoothly.
//
// \`h\` ∈ [PLANET_RADIUS, uAtmosphereRadius]. \`mu\` ∈ [-1, 1].
vec2 transmittanceHmuToUv(float h, float mu) {
  float rho = sqrt(max(0.0, h * h - PLANET_RADIUS * PLANET_RADIUS));
  // Distance along ray to TOA, accounting for ground intersection if mu<0.
  float discr = h * h * (mu * mu - 1.0) + uAtmosphereRadius * uAtmosphereRadius;
  float d = max(0.0, -h * mu + sqrt(max(0.0, discr)));
  float dmin = uAtmosphereRadius - h;
  float dmax = rho + hHorizon();
  float u_mu = (dmax > dmin) ? (d - dmin) / (dmax - dmin) : 0.0;
  float u_r = (hHorizon() > 0.0) ? rho / hHorizon() : 0.0;
  return vec2(clamp(u_mu, 0.0, 1.0), clamp(u_r, 0.0, 1.0));
}

void transmittanceUvToHmu(vec2 uv, out float h, out float mu) {
  float u_mu = clamp(uv.x, 0.0, 1.0);
  float u_r = clamp(uv.y, 0.0, 1.0);
  float rho = u_r * hHorizon();
  h = sqrt(rho * rho + PLANET_RADIUS * PLANET_RADIUS);
  float dmin = uAtmosphereRadius - h;
  float dmax = rho + hHorizon();
  float d = u_mu * (dmax - dmin) + dmin;
  if (d <= 1e-6) {
    mu = 1.0;
  } else {
    mu = (hHorizon() * hHorizon() - rho * rho - d * d) / (2.0 * h * d);
  }
  mu = clamp(mu, -1.0, 1.0);
}

// Sample the transmittance LUT given (height-from-center, μ).
vec3 sampleTransmittance(sampler2D lut, float h, float mu) {
  vec2 uv = transmittanceHmuToUv(h, mu);
  return texture(lut, uv).rgb;
}

// Multi-scattering LUT: parameterised by (height, μ_sun) — both effectively
// linear because multi-scattering is smooth across the horizon.
vec2 multiScatteringHmuToUv(float h, float muSun) {
  float u_mu = 0.5 * muSun + 0.5;          // [-1,1] → [0,1]
  float u_h = (h - PLANET_RADIUS) / atmosThickness();
  return vec2(clamp(u_mu, 0.0, 1.0), clamp(u_h, 0.0, 1.0));
}

void multiScatteringUvToHmu(vec2 uv, out float h, out float muSun) {
  muSun = clamp(uv.x * 2.0 - 1.0, -1.0, 1.0);
  h = PLANET_RADIUS + clamp(uv.y, 0.0, 1.0) * atmosThickness();
}

vec3 sampleMultiScattering(sampler2D lut, float h, float muSun) {
  vec2 uv = multiScatteringHmuToUv(h, muSun);
  return texture(lut, uv).rgb;
}

// Convert a unit-sphere position to altitude in km above ground.
float positionToAltKm(vec3 p) {
  float r = length(p);
  return max(0.0, r - PLANET_RADIUS) * kmPerUnit();
}
`;

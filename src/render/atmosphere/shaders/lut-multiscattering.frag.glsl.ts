// Inlined from lut-multiscattering.frag.glsl. Edit the GLSL inside the template literal —
// the source of truth lives here, no separate .glsl file on disk.
export const source = `// Multi-scattering LUT (32×32 RGBA16F).
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

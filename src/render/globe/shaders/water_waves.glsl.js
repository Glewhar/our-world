// Inlined from water_waves.glsl. Edit the GLSL inside the template literal —
// the source of truth lives here, no separate .glsl file on disk.
export const source = `// Shared Gerstner-wave helper for the water mesh. Imported by
// water.vert.glsl (for displacement) and water.frag.glsl (for the
// analytic perturbed normal that drives Fresnel + glint).
//
// Each wave is a 3D sinusoid \`A_i * sin(K_i · dir - ω_i * t)\` evaluated on
// the un-displaced unit-sphere direction. Summing 4 waves with mismatched
// directions and frequencies gives a non-repeating, stylized swell.
//
// The "Gerstner" steepness term pinches crests by adding a tangential
// displacement proportional to cos(phase) along the wave direction.
// Steepness 0 = pure sum-of-sines (rounded), 1 = sharp peaks. Q is clamped
// to [0,1] so waves never invert.
//
// Output \`normal\` is the analytic outward normal of the displaced surface
// at \`dir\`: \`normalize(dir - elevScale · ∇_sphere h)\`, where ∇_sphere is
// the sphere-tangent component of the 3D height gradient. The fragment
// shader uses this directly (no normal map, no varying interpolation).

#define WATER_NUM_WAVES 4

void waterWaves(
  in vec3 dir,
  in float t,
  in float amplitudeM,
  in float steepness,
  in float elevScale,
  out float radialM,
  out vec3 tangent,
  out vec3 normal
) {
  // Wave 3D wave-vectors. Magnitudes ~22–25 → wavelengths ~0.25–0.28 of
  // unit radius (~1700 km on a 6371 km Earth — ocean-swell scale).
  vec3 K[WATER_NUM_WAVES];
  K[0] = vec3( 19.0,  11.0,   5.0);
  K[1] = vec3(-13.0,  17.0,   7.0);
  K[2] = vec3( 23.0,  -9.0,  -3.0);
  K[3] = vec3(  7.0,  13.0,  19.0);

  // Per-wave amplitude weights (sum = 2.3, normalized below) and angular
  // frequencies. Spread over a ~2× range so the swell never resyncs.
  float ampW[WATER_NUM_WAVES];
  ampW[0] = 1.00;
  ampW[1] = 0.60;
  ampW[2] = 0.40;
  ampW[3] = 0.30;
  float ampSum = 2.30;

  float omega[WATER_NUM_WAVES];
  omega[0] = 0.55;
  omega[1] = 0.80;
  omega[2] = 1.05;
  omega[3] = 0.40;

  float Q = clamp(steepness, 0.0, 1.0);

  radialM = 0.0;
  tangent = vec3(0.0);
  vec3 dh = vec3(0.0); // 3D gradient of height (m / unit-radius).

  for (int i = 0; i < WATER_NUM_WAVES; ++i) {
    vec3 Ki = K[i];
    float kLen = max(length(Ki), 1e-4);
    vec3 T = Ki - dot(Ki, dir) * dir; // sphere-tangent component of K.
    float phase = dot(dir, Ki) - omega[i] * t;
    float a = amplitudeM * ampW[i] / ampSum;
    float s = sin(phase);
    float c = cos(phase);
    radialM += a * s;
    // Gerstner horizontal pinch: small tangential offset along K_tangent.
    // Convert from metres to unit-radius via elevScale, normalize by k so
    // the offset stays bounded.
    tangent += Q * a * elevScale * (T / kLen) * c;
    // Gradient of \`a * sin(K · dir - ω t)\` w.r.t. position dir = a * cos * K.
    dh += a * c * Ki;
  }

  vec3 dhUnit = dh * elevScale; // metres → unit-radius units.
  vec3 dhTan = dhUnit - dot(dhUnit, dir) * dir; // sphere-tangent gradient.
  normal = normalize(dir - dhTan);
}
`;

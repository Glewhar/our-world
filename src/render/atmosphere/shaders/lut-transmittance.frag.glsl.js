// Inlined from lut-transmittance.frag.glsl. Edit the GLSL inside the template literal —
// the source of truth lives here, no separate .glsl file on disk.
export const source = `// Transmittance LUT (256×64 RGBA16F).
// Output: exp(-∫extinction·ds) along the ray from a point at height \`h\` in
// direction \`μ\` (cos view-zenith) all the way to the top of atmosphere (or
// hits the planet surface — in that case t→ground hit, giving full
// occlusion which the runtime sees as "this sunlight is blocked").
//
// \`common.glsl\` is concatenated above this file at material creation
// (see \`lut/transmittance.ts\`).

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

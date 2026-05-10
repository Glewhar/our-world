// Inlined from cloud_noise.glsl. Edit the GLSL inside the template literal —
// the source of truth lives here, no separate .glsl file on disk.
export const source = `// Procedural noise helpers for the volumetric cloud pass.
//
// Concatenated ABOVE the cloud frag shader at material build time, so this
// chunk owns the global \`precision\` declarations. (\`RawShaderMaterial\` +
// GLSL3 supplies no implicit precision; the first float/vec3 declaration
// without one fails to compile.)

precision highp float;
precision highp int;
precision highp sampler2D;


//
// All sampled in 3D so the cloud field stays coherent across the spherical
// shell — sampling a 2D equirect noise in a 3D shell produces obvious
// "vertical pillars" that look fake on a planet. 3D coverage costs a
// little more per fetch but the result holds up at any zoom.
//
// Two layers compose the cloud density field:
//   * \`cn_fbm(p)\` — 4-octave value-noise FBM. Macro cloud cells, gentle
//     cumulus shapes. This drives coverage.
//   * \`cn_worley(p)\` — distance to the nearest 3D feature point, computed
//     over a 3×3×3 cell neighbourhood. Inverted (1 - d) gives sharper
//     internal billows that erode the FBM edges so cloud silhouettes
//     don't all look like soft blobs.
//
// Both use the same \`cn_hash13\` so jitter is deterministic per
// integer-grid cell. Frequencies in the cloud frag are tuned empirically
// against a 6371 km Earth — see comments in clouds.frag.glsl.

float cn_hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

vec3 cn_hash33(vec3 p) {
  return vec3(
    cn_hash13(p),
    cn_hash13(p + vec3(7.7, 11.3, 13.7)),
    cn_hash13(p + vec3(19.1, 23.9, 29.3))
  );
}

float cn_vnoise3(vec3 x) {
  vec3 p = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = cn_hash13(p);
  float n100 = cn_hash13(p + vec3(1.0, 0.0, 0.0));
  float n010 = cn_hash13(p + vec3(0.0, 1.0, 0.0));
  float n110 = cn_hash13(p + vec3(1.0, 1.0, 0.0));
  float n001 = cn_hash13(p + vec3(0.0, 0.0, 1.0));
  float n101 = cn_hash13(p + vec3(1.0, 0.0, 1.0));
  float n011 = cn_hash13(p + vec3(0.0, 1.0, 1.0));
  float n111 = cn_hash13(p + vec3(1.0, 1.0, 1.0));
  return mix(
    mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
    mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
    f.z
  );
}

float cn_fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; ++i) {
    v += a * cn_vnoise3(p);
    p = p * 2.03 + vec3(0.71, 0.13, 0.49);
    a *= 0.5;
  }
  return v;
}

// FBM with caller-supplied per-octave weights. Same underlying grid as
// \`cn_fbm\` (same offsets per octave, same frequency doubling) so the
// noise pattern is spatially coherent across all weight choices.
// Modulating w smoothly across the surface produces clouds that visually
// morph between "low-frequency-dominant big rolling shapes" and "all-
// octaves-balanced small puffy texture" without tearing — the underlying
// noise samples don't change, only how they're combined.
float cn_fbm_weighted(vec3 p, vec4 w) {
  float v = 0.0;
  v += w.x * cn_vnoise3(p);
  p = p * 2.03 + vec3(0.71, 0.13, 0.49);
  v += w.y * cn_vnoise3(p);
  p = p * 2.03 + vec3(0.71, 0.13, 0.49);
  v += w.z * cn_vnoise3(p);
  p = p * 2.03 + vec3(0.71, 0.13, 0.49);
  v += w.w * cn_vnoise3(p);
  return v;
}

// 3D Worley — distance² to the nearest jittered feature point in the 27
// neighbour cells. Caller takes sqrt or maps as needed. Returns ~[0, 1].
float cn_worley(vec3 x) {
  vec3 p = floor(x);
  vec3 f = fract(x);
  float minD2 = 1e9;
  for (int kz = -1; kz <= 1; ++kz) {
    for (int ky = -1; ky <= 1; ++ky) {
      for (int kx = -1; kx <= 1; ++kx) {
        vec3 cell = vec3(float(kx), float(ky), float(kz));
        vec3 jitter = cn_hash33(p + cell);
        vec3 d = cell + jitter - f;
        minD2 = min(minD2, dot(d, d));
      }
    }
  }
  return sqrt(minD2);
}
`;

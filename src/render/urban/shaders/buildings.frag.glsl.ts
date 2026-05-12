// Inlined from buildings.frag.glsl. Edit the GLSL inside the template literal —
// the source of truth lives here, no separate .glsl file on disk.
export const source = `// Buildings fragment shader — flat lambert + small height-driven
// brightness lift so taller buildings catch a touch more light at the
// top. No texture maps. Day/night wrap computed per-fragment from
// dot(surfaceNormal, sun) to match the rest of the globe layers.

precision highp float;

in vec3 vWorldPos;
in vec3 vWorldNormal;
in vec3 vSurfaceNormal;
in float vHeightNorm;

uniform vec3 uSunDirection;
uniform float uOpacity;

out vec4 fragColor;

void main() {
  vec3 N = normalize(vWorldNormal);
  vec3 L = normalize(uSunDirection);
  float ndotl = max(0.0, dot(N, L));

  // Base palette — light grey concrete, lifted slightly toward the top.
  vec3 base = mix(vec3(0.42, 0.41, 0.38), vec3(0.62, 0.6, 0.55), vHeightNorm * 0.6);
  float lit = 0.25 + 0.85 * ndotl;
  vec3 dayCol = base * lit;

  // Night palette — dim warm window glow biased toward the upper half.
  // Windows on the underside (the box's z=0 face) read as dark roofs.
  float topMask = smoothstep(0.05, 0.4, vHeightNorm);
  vec3 nightCol = mix(vec3(0.07, 0.07, 0.09), vec3(1.0, 0.85, 0.55) * 0.55, topMask * 0.6);

  // Day/night terminator: same smoothstep window the cities + land
  // shaders use, against the city's surface normal (planar approximation
  // for a < 100 km patch).
  float wrap = smoothstep(-0.05, 0.15, dot(vSurfaceNormal, L));
  vec3 col = mix(nightCol, dayCol, wrap);
  fragColor = vec4(col, uOpacity);
}
`;

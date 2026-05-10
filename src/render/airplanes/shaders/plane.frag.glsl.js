// Inlined from plane.frag.glsl. Edit the GLSL inside the template literal —
// the source of truth lives here, no separate .glsl file on disk.
export const source = `// Plane head — a tiny red dot that flashes once per second and is invisible
// the rest of the time. Trails are the always-visible thing; this dot is
// just a marker that briefly says "here I am" each second.
//
// \`uTime\` is in seconds. Each plane has its own \`vBlinkPhase\` so the blinks
// sweep through the fleet rather than pulsing in unison.

precision highp float;

uniform float uTime;
uniform vec3 uColorBlink;
uniform float uOpacity;

in vec2 vQuadUV;
in float vBlinkPhase;

out vec4 fragColor;

void main() {
  vec2 local = (vQuadUV - 0.5) * 2.0;
  float r2 = dot(local, local);
  if (r2 > 1.0) discard;

  // 1 Hz blink — abs(sin) raised to a high power so the dot is only visible
  // for a brief flash each second (FWHM ≈ 0.19 s) rather than half the cycle.
  float blink = abs(sin(3.14159265 * (uTime + vBlinkPhase)));
  blink = pow(blink, 16.0);

  // Soft circular core — bright centre, fuzzy edge.
  float core = (1.0 - r2);
  core *= core;

  float a = uOpacity * core * blink;
  if (a < 0.005) discard;
  fragColor = vec4(uColorBlink, a);
}
`;

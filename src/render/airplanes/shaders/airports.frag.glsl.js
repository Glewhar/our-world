// Inlined from airports.frag.glsl. Edit the GLSL inside the template literal —
// the source of truth lives here, no separate .glsl file on disk.
export const source = `// Airports — flat solid colour with a soft edge so the strip doesn't look
// like a crisp hard-edged rectangle from far away.

precision highp float;

uniform vec3 uColor;
uniform float uOpacity;

in vec2 vQuadUV;
in float vTraffic;

out vec4 fragColor;

void main() {
  vec2 local = (vQuadUV - 0.5) * 2.0;
  float dx = abs(local.x);
  float dy = abs(local.y);

  // Slight feather so the rectangle has a hint of soft edge.
  float edgeX = 1.0 - smoothstep(0.85, 1.0, dx);
  float edgeY = 1.0 - smoothstep(0.5, 1.0, dy);
  float mask = edgeX * edgeY;
  if (mask < 0.05) discard;

  // Brightness scales mildly with traffic so the eye notices the hubs.
  float bright = mix(0.7, 1.0, clamp(log(1.0 + vTraffic) / log(80.0), 0.0, 1.0));
  fragColor = vec4(uColor * bright, mask * uOpacity);
}
`;

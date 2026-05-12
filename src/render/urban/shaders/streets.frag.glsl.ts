// Inlined from streets.frag.glsl. Edit the GLSL inside the template literal —
// the source of truth lives here, no separate .glsl file on disk.
export const source = `// Streets fragment shader — dark asphalt by day, thin warm trace by night.

precision highp float;

in vec2 vUV;
in vec3 vSurfaceNormal;

uniform vec3 uSunDirection;
uniform float uOpacity;

out vec4 fragColor;

void main() {
  // Centre core: brighter near the cell midline.
  vec2 d = abs(vUV - 0.5);
  float core = 1.0 - smoothstep(0.18, 0.42, max(d.x, d.y));

  vec3 day = mix(vec3(0.18, 0.18, 0.19), vec3(0.32, 0.32, 0.33), core);
  vec3 night = mix(vec3(0.04, 0.04, 0.05), vec3(0.55, 0.45, 0.3), core);

  float wrap = smoothstep(-0.05, 0.15, dot(vSurfaceNormal, normalize(uSunDirection)));
  vec3 col = mix(night, day, wrap);

  // Cell-edge fade so adjacent street cells blend rather than reading
  // as a grid of squares.
  float alphaEdge = 1.0 - smoothstep(0.4, 0.5, max(d.x, d.y));
  fragColor = vec4(col, alphaEdge * uOpacity * 0.85);
}
`;

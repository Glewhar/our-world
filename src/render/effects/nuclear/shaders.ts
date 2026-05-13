// GLSL ported from the nuke-theta demo's particle system
// (bundle.pretty.js:19683–19754) and translated to GLSL ES 3.00 syntax
// (in/out + texture + out_FragColor), because the demo uses
// `flat varying int` which requires GLSL 3. Fog includes and the
// customDensity uniform have been stripped — we do not wire scene fog
// for the explosion.

export const PARTICLE_VERTEX_SHADER = `
uniform float pointMultiplier;

in float size;
in float angle;
in float blend;
in vec4 colour;
in int type;

out vec4 vColour;
out vec2 vAngle;
out float vBlend;
flat out int vType;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = size * pointMultiplier / gl_Position.w;

  vAngle = vec2(cos(angle), sin(angle));
  vColour = colour;
  vBlend = blend;
  vType = type;
}
`;

export const PARTICLE_FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D u_texturez[3];

in vec4 vColour;
in vec2 vAngle;
in float vBlend;
flat in int vType;

out vec4 out_FragColor;

void main() {
  vec2 coords = (gl_PointCoord - 0.5) * mat2(vAngle.x, vAngle.y, -vAngle.y, vAngle.x) + 0.5;

  vec4 sampled = vec4(0.0);
  if (vType == 0 || vType == 4 || vType == 5) {
    sampled = texture(u_texturez[0], coords);
  } else if (vType == 1 || vType == 3 || vType == 6) {
    sampled = texture(u_texturez[1], coords);
  } else if (vType == 2) {
    sampled = texture(u_texturez[2], coords);
  }

  vec4 col = sampled * vColour;
  col.rgb *= col.a;
  col.a *= vBlend;
  out_FragColor = col;
}
`;

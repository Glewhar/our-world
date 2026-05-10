// Inlined from fullscreen.vert.glsl. Edit the GLSL inside the template literal —
// the source of truth lives here, no separate .glsl file on disk.
export const source = `// Fullscreen-triangle vertex shader (GLSL3) for the volumetric cloud pass.
// Same convention as atmosphere/shaders/fullscreen.vert.glsl: a single
// triangle with clip-space coords (-1,-1), (3,-1), (-1,3); the viewport-
// clipped portion covers [0,1]² in UV. The fragment reconstructs a
// world-space view ray from \`vUv\` + \`uInvViewProj\`.

out vec2 vUv;

void main() {
  vec2 clip = vec2(
    (gl_VertexID == 1) ?  3.0 : -1.0,
    (gl_VertexID == 2) ?  3.0 : -1.0
  );
  vUv = 0.5 * (clip + 1.0);
  gl_Position = vec4(clip, 0.0, 1.0);
}
`;

// Inlined from fullscreen.vert.glsl. Edit the GLSL inside the template literal —
// the source of truth lives here, no separate .glsl file on disk.
export const source = `// Fullscreen-triangle vertex shader (GLSL3). Used by both the LUT-precompute
// passes (where it just lays a triangle over the render-target) and the
// runtime atmosphere pass (where the fragment reconstructs a world-space
// view ray from \`vUv\`).
//
// Convention: a single triangle with clip-space coords (-1,-1), (3,-1),
// (-1,3). The viewport-clipped screen-space portion of this triangle covers
// [0,1]² in UV. Cheaper than a quad — no shared edge → no overdraw.

out vec2 vUv;

void main() {
  // Three vertex IDs 0,1,2 → clip positions (-1,-1), (3,-1), (-1,3).
  vec2 clip = vec2(
    (gl_VertexID == 1) ?  3.0 : -1.0,
    (gl_VertexID == 2) ?  3.0 : -1.0
  );
  vUv = 0.5 * (clip + 1.0);
  // z=1 → fragment lands at far plane so the runtime atmosphere pass
  // depth-tests against the globe (LessEqualDepth) — it survives only where
  // no opaque geometry has written depth. The LUT bakes use depth-less
  // render-targets, so this z has no effect there.
  gl_Position = vec4(clip, 1.0, 1.0);
}
`;

// Inlined from arc.frag.glsl. Edit the GLSL inside the template literal —
// the source of truth lives here, no separate .glsl file on disk.
export const source = `// Generic arc / trail fragment shader.
// Colour + opacity multiplier come from uniforms; per-instance alpha
// modulation comes from \`vAlpha\`. The optional \`uTrailFade\` ramps the
// alpha along the trail length so the head end is brighter than the
// origin end — set to 0 for the scaffold (no fade) or 1 for trails.
//
// Width-wise we use \`vSide\` (interpolated -1..+1 across the ribbon) to
// fade alpha to zero at the edges. Combined with a thicker ribbon this
// reads as a soft smoke trail rather than a hairline.

precision highp float;

uniform vec3 uColor;
uniform float uOpacity;
uniform float uTrailFade;   // 0 = uniform alpha, 1 = fade origin → head

in float vV;
in float vAlpha;
in float vTMax;
in float vSide;

out vec4 fragColor;

void main() {
  // Trail length fade: vV ∈ [0,1] runs origin → head; head brightest.
  float lenFade = mix(1.0, vV, uTrailFade);

  // Width fade: bell curve across the ribbon, 1 at centre falling to 0 at
  // the edges. Kept as a single (1 - vSide²) — squaring it again gives a
  // very narrow visible core that disappears on a thin ribbon.
  float widthFade = 1.0 - vSide * vSide;

  // Head taper: fade alpha to 0 in the last few percent of the trail so
  // the leading edge dissolves into the plane instead of looking like a
  // hard rectangular cap. uTrailFade>0 marks "this is a trail, not the
  // scaffold" — only taper for trails. Tight range so the trail fills in
  // close to the plane and only blends out in the final few pixels.
  float headTaper = mix(1.0, 1.0 - smoothstep(0.96, 1.0, vV), step(0.001, uTrailFade));

  float a = uOpacity * vAlpha * lenFade * widthFade * headTaper;
  if (a < 0.005) discard;
  fragColor = vec4(uColor, a);
}
`;

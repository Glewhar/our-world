// Inlined from upsample.frag.glsl. Edit the GLSL inside the template literal —
// the source of truth lives here, no separate .glsl file on disk.
export const source = `// Half-res cloud composite. Samples the cloud raymarch's half-resolution
// target and blends onto the main framebuffer using the same premultiplied
// -alpha contract the raymarch wrote with. The half-res texture's own
// LinearFilter sampling does the bilinear 4-tap, so a single \`texture()\`
// call gives us a soft upsample at zero extra cost.
//
// The cloud raymarch already produces alpha-soft silhouettes (hash-jittered
// integration, smoothstep'd vertical fade), so plain bilinear is enough
// here — no depth-aware bilateral filter needed for the FPS win this
// pass exists to deliver. If a future pass needs a crisp cloud/terrain
// edge, swap this for the textbook 4-tap depth-aware variant; the half-
// res target layout already supports it.

precision highp float;
precision highp sampler2D;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uCloudTex;

void main() {
  vec4 c = texture(uCloudTex, vUv);
  // Skip empty pixels so the depth-test-disabled blend stage doesn't
  // touch the framebuffer where the cloud was fully transparent.
  if (c.a <= 0.0) discard;
  fragColor = c;
}
`;

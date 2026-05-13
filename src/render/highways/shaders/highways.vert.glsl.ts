// Inlined from highways.vert.glsl. Edit the GLSL inside the template literal —
// the source of truth lives here, no separate .glsl file on disk.
export const source = `// Highways vertex shader.
//
// Each vertex carries a centerline position on the unit sphere plus a
// signed unit perpendicular (\`aPerp\`), a kind flag (\`aKind\`,
// 0=major, 1=arterial, 2=local, 3=local2), and the pre-baked elevation
// lift in metres (\`aLiftMeters\`, from
// web/src/render/util/elevation-lift-bake.ts — mirrors the same 9-tap
// blur + distance-field coast fade the older shader did per frame).
// The shader multiplies by \`uElevationScale\` so the altitude slider
// still works without a rebake.
//
// After lifting the centerline, applies a *screen-space* offset of
// half the kind's pixel width along the projected ribbon direction.
// This is the standard Mapbox / Apple Maps trick: the line keeps a
// constant on-screen width at every zoom.
//
// Cross-ribbon coordinate \`vU\` runs from +1 on one side to -1 on the
// other, recovered from gl_VertexID parity (even = +side, odd = -side)
// matching the geometry build order in HighwaysLayer.

precision highp float;
precision highp int;
precision highp sampler2D;

uniform float uElevationScale;
uniform float uHighwayRadialBiasM;

uniform vec2 uViewportSize;
uniform float uMajorWidthPx;
uniform float uArterialWidthPx;
uniform float uLocalWidthPx;
uniform float uLocal2WidthPx;
uniform float uDayCasingPx;
uniform float uDayFillScale;

in vec3 aPerp;
in float aKind;
in float aLiftMeters;

out vec3 vSurfaceNormal;
out vec3 vWorldPos;
out float vKind;
out float vU;
out float vFillFrac;

void main() {
  vKind = aKind;

  // Centerline direction. position is on the unit sphere by construction.
  vec3 centerline = position;
  vec3 dir = normalize(centerline);
  vSurfaceNormal = dir;

  // Lift = baked metres × slider scale; the bias is in metres too so it
  // tracks the slider in lock-step, preserving the depth-fight safety
  // margin at every factor.
  float landDisplace = aLiftMeters * uElevationScale;
  float radial = 1.0 + landDisplace + uHighwayRadialBiasM * uElevationScale;

  vec3 liftedCenter = dir * radial;

  // ---- Screen-space ribbon offset --------------------------------------
  // Project the lifted centerline to clip space. We then nudge the world
  // position by a tiny multiple of \`aPerp\`, project again, and take the
  // difference in pixel space. That gives us a *screen-space* unit vector
  // pointing along the ribbon's perpendicular — signed by aPerp's side.
  // Scaling by the kind's pixel half-width gives a constant on-screen
  // width at every zoom.
  vec4 clipCenter = projectionMatrix * modelViewMatrix * vec4(liftedCenter, 1.0);
  vec4 clipNudged = projectionMatrix * modelViewMatrix * vec4(liftedCenter + aPerp * 1.0e-3, 1.0);

  vec2 ndcA = clipCenter.xy / clipCenter.w;
  vec2 ndcB = clipNudged.xy / clipNudged.w;
  vec2 pxDiff = (ndcB - ndcA) * uViewportSize * 0.5;
  float pxLen = length(pxDiff);
  vec2 pxPerp = pxLen > 1.0e-6 ? pxDiff / pxLen : vec2(0.0);

  // Pick the visible width in pixels for this road's kind.
  // aKind: 0=major, 1=arterial, 2=local, 3=local2.
  float widthPx =
    (aKind < 0.5) ? uMajorWidthPx :
    (aKind < 1.5) ? uArterialWidthPx :
    (aKind < 2.5) ? uLocalWidthPx :
                    uLocal2WidthPx;
  // Cartographic casing: widen the ribbon by uDayCasingPx pixels on each
  // side beyond the road's nominal width. The inner |vU| < vFillFrac
  // region is the bright fill; the outer rim is the dark casing.
  float casingPx = max(uDayCasingPx, 0.0);
  float halfWidthPx = max(widthPx * 0.5 + casingPx, 0.5);
  // Day fill width = the road's nominal width × uDayFillScale, clamped so
  // it never exceeds the ribbon. Night ignores vFillFrac entirely, so this
  // knob is day-only.
  float fillPx = max(widthPx * uDayFillScale, 0.0);
  vFillFrac = clamp(fillPx / max(widthPx + 2.0 * casingPx, 1.0e-3), 0.0, 1.0);

  vec2 pxOffset = pxPerp * halfWidthPx;
  vec2 ndcOffset = pxOffset * 2.0 / uViewportSize;
  clipCenter.xy += ndcOffset * clipCenter.w;

  vWorldPos = liftedCenter; // for the coastline lookup in the fragment

  // Cross-ribbon coordinate, +1 on one side and -1 on the other. The
  // geometry build emits even-indexed vertices on the +perp side and
  // odd-indexed on the -perp side — gl_VertexID parity recovers it.
  vU = ((gl_VertexID & 1) == 0) ? 1.0 : -1.0;

  gl_Position = clipCenter;
}
`;

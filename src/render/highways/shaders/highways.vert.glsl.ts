// Inlined from highways.vert.glsl. Edit the GLSL inside the template literal —
// the source of truth lives here, no separate .glsl file on disk.
export const source = `// Highways vertex shader.
//
// Each vertex carries a centerline position on the unit sphere plus a
// signed unit perpendicular (\`aPerp\`) and a kind flag (\`aKind\`,
// 0=major, 1=arterial, 2=local). The shader lifts the centerline by the
// local elevation (9-tap blur), then applies a *screen-space* offset of
// half the kind's pixel width along the projected ribbon direction. This
// is the standard Mapbox / Apple Maps trick: the line keeps a constant
// on-screen width at every zoom.
//
// Cross-ribbon coordinate \`vU\` runs from +1 on one side to -1 on the
// other, recovered from gl_VertexID parity (even = +side, odd = -side)
// matching the geometry build order in HighwaysLayer.
//
// The healpix.glsl helper is concatenated before this source by
// HighwaysLayer (Three.js ShaderMaterial doesn't process #include).

precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D uElevationMeters;
uniform sampler2D uDistanceField;
uniform int uHealpixNside;
uniform int uHealpixOrdering;
uniform int uAttrTexWidth;
uniform float uElevationScale;
uniform float uHighwayRadialBiasM;

uniform vec2 uViewportSize;
uniform float uMajorWidthPx;
uniform float uArterialWidthPx;
uniform float uLocalWidthPx;

in vec3 aPerp;
in float aKind;

out vec3 vSurfaceNormal;
out vec3 vWorldPos;
out float vKind;
out float vU;

ivec2 cellTexel(vec3 d) {
  int ipix = healpixZPhiToPix(uHealpixNside, uHealpixOrdering, d.z, atan(d.y, d.x));
  return healpixIpixToTexel(ipix, uAttrTexWidth);
}

void main() {
  vKind = aKind;

  // Centerline direction. position is on the unit sphere by construction.
  vec3 centerline = position;
  vec3 dir = normalize(centerline);
  vSurfaceNormal = dir;

  // 9-tap elevation blur — averages the cell-centre + 8 neighbours.
  vec3 axisUp = abs(dir.z) < 0.99 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
  vec3 t1 = normalize(cross(axisUp, dir));
  vec3 t2 = cross(dir, t1);
  const float eps = 3.0e-3;
  const float diag = 0.7071;

  vec3 d0 = dir;
  vec3 d1 = normalize(dir + t1 * eps);
  vec3 d2 = normalize(dir - t1 * eps);
  vec3 d3 = normalize(dir + t2 * eps);
  vec3 d4 = normalize(dir - t2 * eps);
  vec3 d5 = normalize(dir + (t1 + t2) * eps * diag);
  vec3 d6 = normalize(dir + (t1 - t2) * eps * diag);
  vec3 d7 = normalize(dir - (t1 - t2) * eps * diag);
  vec3 d8 = normalize(dir - (t1 + t2) * eps * diag);

  ivec2 tx0 = cellTexel(d0);
  ivec2 tx1 = cellTexel(d1);
  ivec2 tx2 = cellTexel(d2);
  ivec2 tx3 = cellTexel(d3);
  ivec2 tx4 = cellTexel(d4);
  ivec2 tx5 = cellTexel(d5);
  ivec2 tx6 = cellTexel(d6);
  ivec2 tx7 = cellTexel(d7);
  ivec2 tx8 = cellTexel(d8);

  float elev = (
    texelFetch(uElevationMeters, tx0, 0).r +
    texelFetch(uElevationMeters, tx1, 0).r +
    texelFetch(uElevationMeters, tx2, 0).r +
    texelFetch(uElevationMeters, tx3, 0).r +
    texelFetch(uElevationMeters, tx4, 0).r +
    texelFetch(uElevationMeters, tx5, 0).r +
    texelFetch(uElevationMeters, tx6, 0).r +
    texelFetch(uElevationMeters, tx7, 0).r +
    texelFetch(uElevationMeters, tx8, 0).r
  ) / 9.0;

  // Coast fade — single bilinear sample of the distance field's signed-km
  // channel. Matches Land's recipe exactly so the two meshes compute
  // identical radial displacement at any given lat/lon; the previous
  // 8-neighbour ocean count produced cell-quantized fades that
  // disagreed with Land's continuous smoothstep by hundreds of metres
  // in the coast band, losing the depth fight against the land mesh.
  vec2 dfUv = sphereDirToEquirectUv(dir);
  float distCoastKm = texture(uDistanceField, dfUv).r;
  float coastFade = smoothstep(0.0, 4.0, distCoastKm);

  float landDisplace = max(elev, 0.0) * uElevationScale * coastFade;
  // Bias is in metres so it tracks the altitude-exaggeration slider — the
  // multiplication by uElevationScale lifts both the land and the road in
  // lock-step, preserving the depth-fight safety margin at every factor.
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
  // aKind: 0=major, 1=arterial, 2=local.
  float widthPx =
    (aKind < 0.5) ? uMajorWidthPx :
    (aKind < 1.5) ? uArterialWidthPx :
                    uLocalWidthPx;
  // Half-width is the offset magnitude; aPerp's sign already chose the side.
  float halfWidthPx = max(widthPx * 0.5, 0.5);

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

// Inlined from land.vert.glsl. Edit the GLSL inside the template literal —
// the source of truth lives here, no separate .glsl file on disk.
export const source = `// Land vertex shader — displaces dry-land vertices outward by their
// continuous-elevation value from the R16F \`uElevationMeters\` texture.
//
// Two refinements vs the naive single-cell read:
//   1. Smoothing — 9-tap blur (centre + 8 sphere-neighbours arranged in
//      a circle) at ~3 HEALPix cells radius. Kills cell-to-cell elevation
//      jumps that show up as pointy triangles at high mesh density.
//   2. Coast fade — count how many of the 8 neighbours are ocean
//      (bodyId == 0). The more ocean nearby, the harder the displacement
//      tapers toward 0, so coastal land meets the flat water shell flush
//      instead of leaving a vertical gap.
//
// \`vSphereDir\` carries the pre-displacement direction so the fragment
// shader's HEALPix lookups stay anchored to the original cell, not the
// displaced position.

precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D uElevationMeters;
uniform sampler2D uIdRaster;
uniform int uHealpixNside;
uniform int uHealpixOrdering;
uniform int uAttrTexWidth;
uniform float uElevationScale;     // unit-sphere displacement per metre

out vec3 vWorldPos;
out vec3 vSphereDir;

ivec2 cellTexel(vec3 d) {
  int ipix = healpixZPhiToPix(uHealpixNside, uHealpixOrdering, d.z, atan(d.y, d.x));
  return healpixIpixToTexel(ipix, uAttrTexWidth);
}

void main() {
  vec3 dir = normalize(position);
  vSphereDir = dir;

  // Tangent basis. \`up\` picks any axis not parallel to dir.
  vec3 up = abs(dir.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 t1 = normalize(cross(up, dir));
  vec3 t2 = cross(dir, t1);

  // ~3 HEALPix cells (cell ~1e-3 rad at nside=1024). Wide enough that the
  // 8-neighbour ring straddles surrounding cells and the blur actually
  // averages distinct elevation values.
  const float eps = 3.0e-3;
  const float diag = 0.7071;  // 1/sqrt(2) — keeps diagonals at the same arc-length as cardinals

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

  int oceanCount = 0;
  if (isOceanIdTexel(texelFetch(uIdRaster, tx1, 0))) oceanCount++;
  if (isOceanIdTexel(texelFetch(uIdRaster, tx2, 0))) oceanCount++;
  if (isOceanIdTexel(texelFetch(uIdRaster, tx3, 0))) oceanCount++;
  if (isOceanIdTexel(texelFetch(uIdRaster, tx4, 0))) oceanCount++;
  if (isOceanIdTexel(texelFetch(uIdRaster, tx5, 0))) oceanCount++;
  if (isOceanIdTexel(texelFetch(uIdRaster, tx6, 0))) oceanCount++;
  if (isOceanIdTexel(texelFetch(uIdRaster, tx7, 0))) oceanCount++;
  if (isOceanIdTexel(texelFetch(uIdRaster, tx8, 0))) oceanCount++;

  // Quadratic taper: 0 ocean → 1.0, 4 ocean → 0.25, 8 ocean → 0.0.
  float coastFade = 1.0 - float(oceanCount) / 8.0;
  coastFade *= coastFade;

  float displace = max(elev, 0.0) * uElevationScale * coastFade;
  vec3 displaced = dir * (1.0 + displace);

  vec4 wp = modelMatrix * vec4(displaced, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

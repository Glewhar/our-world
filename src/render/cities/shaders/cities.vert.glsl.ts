// Inlined from cities.vert.glsl. Edit the GLSL inside the template literal —
// the source of truth lives here, no separate .glsl file on disk.
export const source = `// Cities vertex shader — triangulated polygon mesh.
//
// Each polygon vertex carries its own unit-sphere position plus the
// per-vertex tangent-frame (x_km, y_km) coordinate \`aLocalKm\` (computed
// at construction in CitiesLayer.ts). The fragment shader uses
// \`vLocalKm\` directly to drive the block-spray hashing — no shared
// quad envelope, no per-fragment point-in-polygon test.
//
// Radial lift: same 9-tap blur recipe as the land mesh, using each
// vertex's own surface direction. Polygon vertices in a single city
// span ≲ 20 km so all verts in one polygon end up with near-identical
// lifts (and the polygon is still rendered as a flat triangulation in
// the tangent plane, which is correct for a near-sea-level city patch).
//
// The healpix.glsl helper is concatenated before this source by
// CitiesLayer (Three.js ShaderMaterial doesn't process #include).

precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D uElevationMeters;
uniform sampler2D uIdRaster;
uniform int uHealpixNside;
uniform int uHealpixOrdering;
uniform int uAttrTexWidth;
uniform float uElevationScale;
uniform float uCityRadialBias;

in vec2 aLocalKm;
in vec2 aHalfExtentKm;
in float aPopulation;
in float aPatternSeed;

out vec2 vLocalKm;
flat out vec2 vHalfExtentKm;
out vec3 vWorldPos;
out float vPopulation;
out float vPatternSeed;

ivec2 cellTexel(vec3 d) {
  int ipix = healpixZPhiToPix(uHealpixNside, uHealpixOrdering, d.z, atan(d.y, d.x));
  return healpixIpixToTexel(ipix, uAttrTexWidth);
}

void main() {
  vLocalKm = aLocalKm;
  vHalfExtentKm = aHalfExtentKm;
  vPopulation = aPopulation;
  vPatternSeed = aPatternSeed;

  vec3 dir = normalize(position);

  // 9-tap elevation blur — averages the cell-centre + 8 neighbours,
  // matching land.vert.glsl's recipe so cities sit flush with the
  // displaced land mesh.
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

  float elev = (
    texelFetch(uElevationMeters, cellTexel(d0), 0).r +
    texelFetch(uElevationMeters, cellTexel(d1), 0).r +
    texelFetch(uElevationMeters, cellTexel(d2), 0).r +
    texelFetch(uElevationMeters, cellTexel(d3), 0).r +
    texelFetch(uElevationMeters, cellTexel(d4), 0).r +
    texelFetch(uElevationMeters, cellTexel(d5), 0).r +
    texelFetch(uElevationMeters, cellTexel(d6), 0).r +
    texelFetch(uElevationMeters, cellTexel(d7), 0).r +
    texelFetch(uElevationMeters, cellTexel(d8), 0).r
  ) / 9.0;

  int oceanCount = 0;
  if (isOceanIdTexel(texelFetch(uIdRaster, cellTexel(d1), 0))) oceanCount++;
  if (isOceanIdTexel(texelFetch(uIdRaster, cellTexel(d2), 0))) oceanCount++;
  if (isOceanIdTexel(texelFetch(uIdRaster, cellTexel(d3), 0))) oceanCount++;
  if (isOceanIdTexel(texelFetch(uIdRaster, cellTexel(d4), 0))) oceanCount++;
  if (isOceanIdTexel(texelFetch(uIdRaster, cellTexel(d5), 0))) oceanCount++;
  if (isOceanIdTexel(texelFetch(uIdRaster, cellTexel(d6), 0))) oceanCount++;
  if (isOceanIdTexel(texelFetch(uIdRaster, cellTexel(d7), 0))) oceanCount++;
  if (isOceanIdTexel(texelFetch(uIdRaster, cellTexel(d8), 0))) oceanCount++;
  float coastFade = 1.0 - float(oceanCount) / 8.0;
  coastFade *= coastFade;

  float landDisplace = max(elev, 0.0) * uElevationScale * coastFade;
  float radial = 1.0 + landDisplace + uCityRadialBias;
  vec3 worldPos = dir * radial;
  vWorldPos = worldPos;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPos, 1.0);
}
`;

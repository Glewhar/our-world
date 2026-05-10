// Inlined from cities.vert.glsl. Edit the GLSL inside the template literal —
// the source of truth lives here, no separate .glsl file on disk.
export const source = `// Cities vertex shader.
//
// Each instance is a quad sized as a fixed envelope (uMaxRadiusKm × 2.2,
// scaled into world units by uHalfQuadSizeUnit) anchored tangent to the
// globe at the city's lat/lon. The fragment shader paints the visible
// city as a sub-region of that envelope, masked by population radius and
// coastline.
//
// Radial lift: the land mesh displaces vertices outward by
// \`max(elevM, 0) * uElevationScale\`. Without matching that lift here,
// inland cities sit at unit radius while the land surface is above
// them, and the depth test silently buries them. We sample the same
// elevation field with the same 9-tap blur and coast-fade taper the
// land vertex shader uses, then add a small \`uCityRadialBias\` so the
// quad clears the land surface unambiguously.
//
// The healpix.glsl helper is concatenated before this source by
// CitiesLayer (Three.js ShaderMaterial doesn't process #include).
//
// Per-instance attributes:
//   aPopulation   — POP_MAX from Natural Earth (Float32)
//   aLatLon       — (lat°, lon°) — used to compute the surface normal
//                   precisely (instanceMatrix's translation column also
//                   carries it implicitly, but recomputing from lat/lon
//                   keeps numerical agreement with the HEALPix lookup
//                   the fragment shader uses for coastline masking)
//   aPatternSeed  — stable hash of (lat, lon) so each city has its own
//                   block pattern that doesn't change frame-to-frame

precision highp float;
precision highp int;
precision highp sampler2D;

uniform float uHalfQuadSizeUnit;

uniform sampler2D uElevationMeters;
uniform sampler2D uIdRaster;
uniform int uHealpixNside;
uniform int uHealpixOrdering;
uniform int uAttrTexWidth;
uniform float uElevationScale;
uniform float uCityRadialBias;

in float aPopulation;
in vec2 aLatLon;
in float aPatternSeed;

out vec2 vQuadUV;
out vec3 vSurfaceNormal;
out vec3 vWorldPos;
out float vPopulation;
out float vPatternSeed;

const float DEG = 0.017453292519943295;

ivec2 cellTexel(vec3 d) {
  int ipix = healpixZPhiToPix(uHealpixNside, uHealpixOrdering, d.z, atan(d.y, d.x));
  return healpixIpixToTexel(ipix, uAttrTexWidth);
}

void main() {
  vQuadUV = uv;
  vPopulation = aPopulation;
  vPatternSeed = aPatternSeed;

  float lat = aLatLon.x * DEG;
  float lon = aLatLon.y * DEG;
  float cosLat = cos(lat);
  vec3 centre = vec3(cosLat * cos(lon), cosLat * sin(lon), sin(lat));
  vSurfaceNormal = normalize(centre);

  // 9-tap elevation blur (mirrors land.vert.glsl). eps ≈ 3 HEALPix cells
  // at nside=1024.
  vec3 dir = vSurfaceNormal;
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

  int oceanCount = 0;
  if (isOceanIdTexel(texelFetch(uIdRaster, tx1, 0))) oceanCount++;
  if (isOceanIdTexel(texelFetch(uIdRaster, tx2, 0))) oceanCount++;
  if (isOceanIdTexel(texelFetch(uIdRaster, tx3, 0))) oceanCount++;
  if (isOceanIdTexel(texelFetch(uIdRaster, tx4, 0))) oceanCount++;
  if (isOceanIdTexel(texelFetch(uIdRaster, tx5, 0))) oceanCount++;
  if (isOceanIdTexel(texelFetch(uIdRaster, tx6, 0))) oceanCount++;
  if (isOceanIdTexel(texelFetch(uIdRaster, tx7, 0))) oceanCount++;
  if (isOceanIdTexel(texelFetch(uIdRaster, tx8, 0))) oceanCount++;
  float coastFade = 1.0 - float(oceanCount) / 8.0;
  coastFade *= coastFade;

  float landDisplace = max(elev, 0.0) * uElevationScale * coastFade;
  float radial = 1.0 + landDisplace + uCityRadialBias;

  vec3 worldUp = abs(vSurfaceNormal.z) < 0.99 ? vec3(0.0, 0.0, 1.0)
                                              : vec3(1.0, 0.0, 0.0);
  vec3 tangentX = normalize(cross(worldUp, vSurfaceNormal));
  vec3 tangentY = cross(vSurfaceNormal, tangentX);

  vec3 liftedCentre = centre * radial;
  vec2 local = (uv - 0.5) * 2.0 * uHalfQuadSizeUnit;
  vec3 worldPos = liftedCentre + tangentX * local.x + tangentY * local.y;
  vWorldPos = worldPos;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPos, 1.0);
}
`;

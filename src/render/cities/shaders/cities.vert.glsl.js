// Inlined from cities.vert.glsl. Edit the GLSL inside the template literal —
// the source of truth lives here, no separate .glsl file on disk.
export const source = `// Cities vertex shader.
//
// Each instance is a quad anchored tangent to the globe at the urban
// polygon's centroid. The shared envelope (uHalfQuadSizeKm) is large
// enough to contain the largest polygon globally; the fragment shader
// clips per-instance to that city's own bbox via aHalfExtentKm.
//
// Radial lift: same recipe as the land mesh vertex shader (9-tap
// elevation blur + coast fade), with a small uCityRadialBias on top so
// the quad always clears the land surface unambiguously.
//
// The healpix.glsl helper is concatenated before this source by
// CitiesLayer (Three.js ShaderMaterial doesn't process #include).

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
in vec2 aPolyOffsetCount;
in vec2 aHalfExtentKm;

out vec2 vQuadUV;
out vec3 vSurfaceNormal;
out vec3 vWorldPos;
out float vPopulation;
out float vPatternSeed;
flat out vec2 vPolyOffsetCount;
flat out vec2 vHalfExtentKm;

const float DEG = 0.017453292519943295;

ivec2 cellTexel(vec3 d) {
  int ipix = healpixZPhiToPix(uHealpixNside, uHealpixOrdering, d.z, atan(d.y, d.x));
  return healpixIpixToTexel(ipix, uAttrTexWidth);
}

void main() {
  vQuadUV = uv;
  vPopulation = aPopulation;
  vPatternSeed = aPatternSeed;
  vPolyOffsetCount = aPolyOffsetCount;
  vHalfExtentKm = aHalfExtentKm;

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

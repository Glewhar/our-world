// Inlined from cities.frag.glsl. Edit the GLSL inside the template literal —
// the source of truth lives here, no separate .glsl file on disk.
export const source = `// Cities fragment shader — far-LOD polygon-shape glow.
//
// Discard fragments outside the per-instance bounding box, then run a
// classic even-odd point-in-polygon test against the polygon vertices
// packed in uPolyAtlas (RG32F, vertex (x,y) in tangent-frame km). If the
// fragment is inside the polygon, paint an organic block-spray + warm
// tungsten night palette modulated by the city's population.
//
// Coastline-clipped via the same HEALPix id raster the land/water
// meshes use, so a coastal polygon never paints onto ocean cells.

precision highp float;
precision highp int;
precision highp sampler2D;

in vec2 vQuadUV;
in vec3 vSurfaceNormal;
in vec3 vWorldPos;
in float vPopulation;
in float vPatternSeed;
flat in vec2 vPolyOffsetCount;
flat in vec2 vHalfExtentKm;

uniform vec3 uSunDirection;

uniform sampler2D uIdRaster;
uniform int uHealpixNside;
uniform int uHealpixOrdering;
uniform int uAttrTexWidth;

uniform float uHalfQuadSizeKm;
uniform sampler2D uPolyAtlas;
uniform int uPolyAtlasWidth;

uniform float uMinPopulation;

uniform float uGridDensity;
uniform float uAspectJitter;
uniform float uRowOffset;
uniform float uBlockThreshold;
uniform float uOutlineMin;
uniform float uOutlineMax;
uniform float uNightBrightness;
uniform float uTileSparkle;
uniform float uDayContrast;
uniform float uOpacity;
uniform float uNightOpacity;

out vec4 fragColor;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float hash11(float n) {
  return fract(sin(n) * 43758.5453123);
}

vec2 fetchPolyVert(int idx) {
  int row = idx / uPolyAtlasWidth;
  int col = idx - row * uPolyAtlasWidth;
  return texelFetch(uPolyAtlas, ivec2(col, row), 0).xy;
}

// Even-odd PIP. Walk the polygon's vertex run in the atlas and count
// crossings of a horizontal ray cast to the right from (x, y). Inside
// when the count is odd.
bool pointInPolygon(vec2 p, int offset, int count) {
  bool inside = false;
  vec2 prev = fetchPolyVert(offset + count - 1);
  for (int i = 0; i < count; i++) {
    vec2 cur = fetchPolyVert(offset + i);
    bool crosses = ((cur.y > p.y) != (prev.y > p.y)) &&
      (p.x < (prev.x - cur.x) * (p.y - cur.y) / (prev.y - cur.y) + cur.x);
    if (crosses) inside = !inside;
    prev = cur;
  }
  return inside;
}

void main() {
  if (vPopulation < uMinPopulation) discard;

  // Quad-local coordinates in km, recovered from the shared envelope size.
  vec2 localKm = (vQuadUV - 0.5) * 2.0 * uHalfQuadSizeKm;

  // Cheap per-instance bbox reject before the PIP loop.
  if (abs(localKm.x) > vHalfExtentKm.x || abs(localKm.y) > vHalfExtentKm.y) discard;

  int polyOffset = int(vPolyOffsetCount.x);
  int polyCount  = int(vPolyOffsetCount.y);
  if (polyCount < 3) discard;
  if (!pointInPolygon(localKm, polyOffset, polyCount)) discard;

  // Normalised intra-bbox coord in [-1, 1]. Per-instance grid cells stay
  // square in km, so a wide polygon shows more blocks horizontally.
  vec2 local = localKm / vHalfExtentKm;

  // Cell grid in km. Per-row x-stretch + half-cell running-bond offset
  // turn the uniform squares into irregular brickwork. uAspectJitter=0
  // collapses back to the original square grid; uRowOffset=0 keeps rows
  // aligned.
  float cellsPerHalf = uGridDensity;
  vec2 cellCoord = localKm / max(vHalfExtentKm.x, vHalfExtentKm.y) * cellsPerHalf;
  float rowId = floor(cellCoord.y);
  float rowHash = hash11(rowId * 13.13 + vPatternSeed * 0.137);
  float xStretch = 1.0 + uAspectJitter * rowHash;
  float xOffset = uRowOffset * (rowHash - 0.5);
  float xWarped = (cellCoord.x + xOffset) / xStretch;
  vec2 cellId = vec2(floor(xWarped), rowId);
  vec2 cellLocal = vec2(fract(xWarped), fract(cellCoord.y));
  float h = hash21(cellId + vec2(vPatternSeed * 0.0123, vPatternSeed * 0.0719));
  float h2 = hash11(h * 91.7);

  // Radial centre boost — denser near the centroid so even spread-out
  // polygons still read as "dense downtown, lighter outskirts".
  float r = length(local);
  float density = exp(-r * r * 1.6);

  float blockExists = step(uBlockThreshold + (1.0 - density), h);
  float inset = mix(0.05, 0.18, h2) * (0.4 + 0.6 * density);
  float dx = min(cellLocal.x, 1.0 - cellLocal.x);
  float dy = min(cellLocal.y, 1.0 - cellLocal.y);
  float edgeDist = min(dx, dy);
  float fill = step(inset, edgeDist) * blockExists;

  float outlineWidth = mix(uOutlineMin, uOutlineMax, density);
  float outline = (1.0 - smoothstep(inset, inset + outlineWidth, edgeDist))
                  * step(edgeDist, inset)
                  * blockExists;

  // Inner-tile highlight — the deep interior of each filled tile gets a
  // brightness boost, reading as a "lit window cluster". The rim stays
  // dimmer so local contrast climbs without the whole layer washing out.
  float sparkle = smoothstep(inset, inset + 0.18, edgeDist) * blockExists;

  float blockBright = mix(0.55, 1.0, h2);

  // Coastline mask via the HEALPix id raster.
  vec3 sphereDir = normalize(vWorldPos);
  int ipx = healpixZPhiToPix(uHealpixNside, uHealpixOrdering, sphereDir.z, atan(sphereDir.y, sphereDir.x));
  ivec2 tx = healpixIpixToTexel(ipx, uAttrTexWidth);
  float landMask = isOceanIdTexel(texelFetch(uIdRaster, tx, 0)) ? 0.0 : 1.0;

  float dayFill = mix(0.20, 0.35, blockBright);
  float dayOutline = 0.14;
  vec3 dayCol = vec3(mix(dayFill, dayOutline, outline));
  dayCol = mix(vec3(0.7), dayCol, 0.5 + uDayContrast);

  float popLight = clamp(log(max(vPopulation, 100.0)) / log(2.0e7), 0.35, 1.0);
  vec3 nightFill = vec3(1.0, 0.85, 0.55) * blockBright * popLight * uNightBrightness;
  // Tile sparkle is night-only — boost just the inner core of each tile so
  // the city reads as a constellation of bright windows on a dark mass.
  nightFill *= (1.0 + uTileSparkle * sparkle);
  vec3 nightOutline = vec3(0.04, 0.03, 0.02);
  vec3 nightCol = mix(nightFill, nightOutline, outline);

  float wrap = smoothstep(-0.05, 0.15, dot(vSurfaceNormal, normalize(uSunDirection)));
  vec3 col = mix(nightCol, dayCol, wrap);

  float popOpacity = clamp(log(max(vPopulation, 100.0)) / log(2.0e7), 0.25, 1.0);
  float a = (fill * (0.55 + 0.45 * density) + outline * 0.7);
  // Night-only alpha boost — separate from uOpacity so the city feels more
  // "present" on the dark side without colour saturating to white the way
  // pushing uNightBrightness does.
  float nightAlphaMul = mix(uNightOpacity, 1.0, wrap);
  a *= popOpacity * landMask * uOpacity * nightAlphaMul;
  if (a < 0.01) discard;

  fragColor = vec4(col, a);
}
`;

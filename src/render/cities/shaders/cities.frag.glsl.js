// Inlined from cities.frag.glsl. Edit the GLSL inside the template literal —
// the source of truth lives here, no separate .glsl file on disk.
export const source = `// Cities fragment shader — triangulated polygon mesh.
//
// The geometry IS the polygon now (triangulated CPU-side, see
// CitiesLayer.ts), so there's no point-in-polygon loop and no
// per-instance bbox reject — every shaded fragment is already inside
// its city's polygon. The fragment paints the organic block-spray +
// warm tungsten night palette using the interpolated tangent-frame
// km coordinate, normalised by the city's half-extent for the
// radial-density falloff.
//
// Coastline-clipped via the same HEALPix id raster the land/water
// meshes use, so a coastal polygon never paints onto ocean cells.

precision highp float;
precision highp int;
precision highp sampler2D;

in vec2 vLocalKm;
flat in vec2 vHalfExtentKm;
in vec3 vWorldPos;
in float vPopulation;
in float vPatternSeed;

uniform vec3 uSunDirection;

uniform sampler2D uIdRaster;
uniform sampler2D uWastelandTex;
uniform int uHealpixNside;
uniform int uHealpixOrdering;
uniform int uAttrTexWidth;

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

float seedToThreshold(float seed) {
  float h = fract(sin(seed * 12.9898 + 78.233) * 43758.5453);
  // Skewed toward the low end so most features only reappear once wasteland
  // is mostly gone. Kept in lockstep with highways.frag.glsl.ts so cities
  // and roads recover at the same pace.
  return mix(0.0, 0.5, h);
}

void main() {
  if (vPopulation < uMinPopulation) discard;

  // HEALPix texel for this fragment — reused below for the coastline mask.
  vec3 sphereDir = normalize(vWorldPos);
  int ipx = healpixZPhiToPix(uHealpixNside, uHealpixOrdering, sphereDir.z, atan(sphereDir.y, sphereDir.x));
  ivec2 tx = healpixIpixToTexel(ipx, uAttrTexWidth);

  // Wasteland kill — per-city threshold sweeps as wasteland decays, so
  // cities pop back one-by-one rather than fading in unison.
  float wasteland = texelFetch(uWastelandTex, tx, 0).r;
  if (wasteland > seedToThreshold(vPatternSeed)) discard;

  vec2 localKm = vLocalKm;

  // Normalised intra-polygon coord. Reaches ~1 at the polygon's bbox
  // edge in either axis; the radial-density term below uses length(local)
  // so the layer fades toward the polygon's outer extents.
  vec2 local = localKm / max(vHalfExtentKm, vec2(1.0));

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

  // Coastline mask via the HEALPix id raster (uses tx from the top).
  float landMask = isOceanIdTexel(texelFetch(uIdRaster, tx, 0)) ? 0.0 : 1.0;

  float dayFill = mix(0.20, 0.35, blockBright);
  float dayOutline = 0.14;
  vec3 dayCol = vec3(mix(dayFill, dayOutline, outline));
  dayCol = mix(vec3(0.7), dayCol, 0.5 + uDayContrast);

  float popLight = clamp(log(max(vPopulation, 100.0)) / log(2.0e7), 0.35, 1.0);
  vec3 nightFill = vec3(1.0, 0.85, 0.55) * blockBright * popLight * uNightBrightness;
  nightFill *= (1.0 + uTileSparkle * sparkle);
  vec3 nightOutline = vec3(0.04, 0.03, 0.02);
  vec3 nightCol = mix(nightFill, nightOutline, outline);

  // Surface normal at this fragment is just the unit direction from the
  // globe centre — the polygon hugs the unit sphere, so this matches
  // the land mesh's lighting frame within fractions of a degree.
  vec3 surfaceNormal = sphereDir;
  float wrap = smoothstep(-0.05, 0.15, dot(surfaceNormal, normalize(uSunDirection)));
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

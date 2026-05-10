// Inlined from cities.frag.glsl. Edit the GLSL inside the template literal —
// the source of truth lives here, no separate .glsl file on disk.
export const source = `// Cities fragment shader.
//
// Paints an organic spray of rectangular building blocks per city:
// dense, opaque, thick-outlined downtown -> sparse, faint, thin-outlined
// suburbs that fade to nothing. Hard-clips at coastlines via the same
// HEALPix id raster Land/Clouds use, so coastal cities wrap around their
// shoreline (crescent / fan shapes) without ever painting onto water.
//
// Day/night blend mirrors land.frag.glsl:304-314 — smoothstep over
// dot(surfaceNormal, sunDir), mix between a grey building palette and a
// warm tungsten night palette. The PostFX bloom pass picks up the bright
// night pixels naturally.
//
// The shader composes the healpix.glsl chunk (Land + Clouds do the same)
// for \`healpixZPhiToPix\` / \`healpixIpixToTexel\`. Concatenation happens
// in CitiesMaterial.ts, NOT via #include (Three.js ShaderMaterial doesn't
// process GLSL #include).

precision highp float;
precision highp int;
precision highp sampler2D;

in vec2 vQuadUV;
in vec3 vSurfaceNormal;
in vec3 vWorldPos;
in float vPopulation;
in float vPatternSeed;

uniform vec3 uSunDirection;

uniform sampler2D uIdRaster;
uniform int uHealpixNside;
uniform int uHealpixOrdering;
uniform int uAttrTexWidth;

// World-unit conversions: globe radius = 1.0 unit, 1 km = (1 / EARTH_KM)
// units. Passed in so the layer can rescale if the globe grows.
uniform float uMaxRadiusKm;     // matches the quad envelope size
uniform float uBaseRadiusKm;    // sqrt(pop / 1e6) * baseRadius
uniform float uMinRadiusKm;
uniform float uMinPopulation;   // hide cities below this

uniform float uFalloffStrength; // suburb thinning aggressiveness (1..6)
uniform float uGridDensity;     // block count per radius (4..20)
uniform float uBlockThreshold;  // higher = sparser suburbs (0..0.6)
uniform float uOutlineMin;      // suburb outline thinness
uniform float uOutlineMax;      // downtown outline thickness
uniform float uNightBrightness;
uniform float uDayContrast;
uniform float uOpacity;         // overall layer opacity multiplier

out vec4 fragColor;

// Stable hash — same family as the popular GPU hash. Maps a vec2 to
// roughly-uniform [0,1]. Cheap and visually adequate; we don't need
// cryptographic-quality randomness.
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float hash11(float n) {
  return fract(sin(n) * 43758.5453123);
}

void main() {
  // Quad-local coordinates in [-1, +1].
  vec2 local = (vQuadUV - 0.5) * 2.0;
  float r = length(local);
  // Distance from the city centre, in km.
  float r_km = r * uMaxRadiusKm;

  // Per-city visible radius — population drives size.
  float visibleRadius_km =
      clamp(sqrt(max(vPopulation, 1.0) / 1.0e6) * uBaseRadiusKm, uMinRadiusKm, uMaxRadiusKm);
  float r_norm = r_km / max(visibleRadius_km, 1.0);  // 0 = centre, 1 = edge of city

  // Hard outer cutoff so blocks never appear outside the visible radius.
  if (r_norm > 1.05) discard;

  // Population gate.
  if (vPopulation < uMinPopulation) discard;

  // Organic radial density envelope: gaussian falloff. Centre dense,
  // suburbs sparse.
  float density = exp(-r_norm * r_norm * uFalloffStrength);

  // Two-octave block grid. Coarse cells = "city blocks"; fine cells =
  // "buildings". Each city's pattern is keyed by \`vPatternSeed\` so
  // patterns don't tile across cities.
  vec2 cellCoord = local * uGridDensity;
  vec2 cellId = floor(cellCoord);
  vec2 cellLocal = fract(cellCoord);

  // Per-cell randomness.
  float h = hash21(cellId + vec2(vPatternSeed, vPatternSeed * 1.7));
  float h2 = hash11(h * 91.7);

  // Block existence: at the centre \`density ≈ 1\`, threshold passes for
  // most cells. As \`density → 0\`, fewer and fewer cells render —
  // suburbs naturally thin out.
  float blockExists = step(uBlockThreshold + (1.0 - density), h);

  // Random per-block inset so block sizes vary (a little). Inset shrinks
  // toward the edges so suburbs feel "looser".
  float inset = mix(0.05, 0.18, h2) * (0.4 + 0.6 * density);
  float dx = min(cellLocal.x, 1.0 - cellLocal.x);
  float dy = min(cellLocal.y, 1.0 - cellLocal.y);
  float edgeDist = min(dx, dy);
  float fill = step(inset, edgeDist) * blockExists;

  // Outlines: thicker at the centre, hairline in the suburbs. The outline
  // sits just outside the inset filled region.
  float outlineWidth = mix(uOutlineMin, uOutlineMax, density);
  float outline = (1.0 - smoothstep(inset, inset + outlineWidth, edgeDist))
                  * step(edgeDist, inset)
                  * blockExists;

  // Block brightness — varies per cell so downtown isn't a uniform tone.
  float blockBright = mix(0.55, 1.0, h2);

  // Coastline mask: sample the HEALPix id raster at this fragment.
  // bodyId == 0 → ocean → fully transparent. The healpix chunk is
  // concatenated into the same shader source.
  vec3 sphereDir = normalize(vWorldPos);
  float phi = atan(sphereDir.y, sphereDir.x);
  int ipx = healpixZPhiToPix(uHealpixNside, uHealpixOrdering, sphereDir.z, phi);
  ivec2 tx = healpixIpixToTexel(ipx, uAttrTexWidth);
  float landMask = isOceanIdTexel(texelFetch(uIdRaster, tx, 0)) ? 0.0 : 1.0;

  // Day palette — dark grey buildings on dark grey streets, like a
  // satellite image of an urban grid. Inverted contrast vs. the biome
  // land underneath so the city pops against green / tan terrain.
  float dayFill = mix(0.20, 0.35, blockBright);
  float dayOutline = 0.14;
  vec3 dayCol = vec3(mix(dayFill, dayOutline, outline));
  // Slight contrast knob: pull blocks lighter, outlines darker.
  dayCol = mix(vec3(0.7), dayCol, 0.5 + uDayContrast);

  // Night palette — warm tungsten lights for fills, dark streets for
  // outlines. Brightness scales with population (centre cities glow
  // brighter than small towns).
  float popLight = clamp(log(max(vPopulation, 100.0)) / log(2.0e7), 0.35, 1.0);
  vec3 nightFill = vec3(1.0, 0.85, 0.55) * blockBright * popLight * uNightBrightness;
  vec3 nightOutline = vec3(0.04, 0.03, 0.02);
  vec3 nightCol = mix(nightFill, nightOutline, outline);

  // Day/night wrap. Narrow terminator so the day side is fully day
  // (no tungsten warmth leaking onto buildings well clear of the
  // shadow line) and the night side is fully night.
  float wrap = smoothstep(-0.05, 0.15, dot(vSurfaceNormal, normalize(uSunDirection)));
  vec3 col = mix(nightCol, dayCol, wrap);

  // Population-driven opacity envelope: small towns are faint; megacities
  // fully opaque. Multiplied by radial density and the block masks so the
  // suburbs naturally fade.
  float popOpacity = clamp(log(max(vPopulation, 100.0)) / log(2.0e7), 0.25, 1.0);
  float a = (fill * (0.55 + 0.45 * density) + outline * 0.7);
  a *= popOpacity * landMask * uOpacity;
  if (a < 0.01) discard;

  fragColor = vec4(col, a);
}
`;

// Inlined from land.frag.glsl. Edit the GLSL inside the template literal —
// the source of truth lives here, no separate .glsl file on disk.
export const source = `// Land fragment shader — climate-driven biome shading on the dry-land
// icosphere. Ocean cells are NOT discarded; coastlines fade to alpha 0
// and the separate water mesh paints the ocean.
//
// Pipeline (each step composes on top of the previous):
//   1. Biome blend            — 9-tap equal-weight neighbour average over
//                               the 12-entry biome palette (codes 0..11
//                               from \`attrs.yaml\` ESA-WorldCover remap).
//                               Ocean neighbours don't pull their colour
//                               into the blend (avoids blue bleed) but
//                               they bump \`oceanCount\` for the alpha fade.
//   2. Coast alpha fade       — fragAlpha = 1 - smoothstep(1, 6, oceanCount).
//                               Combined with \`alphaToCoverage\` on the
//                               material, cell-stepped coastlines dissolve
//                               into the water mesh without a hard edge.
//   3. Alpine thinning        — biome colour blends toward bare-rock
//                               grey-tan (\`ALPINE_BARE\`) as elevation
//                               rises 1.5 → 4 km. Strength = \`uAlpineStrength\`.
//   4. Cold tint              — below +22 °C the biome blends toward a
//                               dusty grey-tan (\`COLD_TONE\`); fully
//                               saturates at -2 °C, max 95 % blend.
//                               Differentiates cold deserts (Patagonia,
//                               Gobi, Tibet) from hot ones (Sahara) —
//                               both share biome code 6.
//   5. Hot tint               — above +22 °C, mild blend toward dry tan
//                               (\`HOT_DRY\`), max 25 %. Sun-baked look.
//   6. Snow line              — \`uColorIce\` blend driven by effective
//                               temperature (smoothstep -10 → -1 °C).
//                               WorldClim BIO1 already encodes altitude,
//                               so the snow line is NOT lapse-corrected
//                               (would double-count and over-snow
//                               equatorial mountains).
//   7. Dynamic recolour       — fire / ice / infection / pollution from
//                               \`attribute_dynamic\` (sim writes here).
//   8. Wrap-Lambert lighting  — Sobel-tilted normal, day/night wrap with
//                               soft falloff so lee-side slopes stay
//                               legible.
//
// Effective temperature for steps 4/5/6: \`temperatureC + uSeasonOffsetC\`.
// One slider rolls the whole globe between summer and winter — snow
// recedes/spreads, cold tint shrinks/grows, all coherent.
//
// \`vColor\` is intentionally unused — a per-body tint LUT is a follow-up.

precision highp float;
precision highp int;
precision highp sampler2D;

uniform vec3 uSunDirection;
uniform vec3 uNightTint;
uniform float uAmbient;

uniform sampler2D uIdRaster;
uniform sampler2D uAttrStatic;
uniform sampler2D uAttrClimate;
uniform sampler2D uAttrDynamic;
uniform sampler2D uElevationMeters;
uniform int uHealpixNside;
uniform int uHealpixOrdering;
uniform int uAttrTexWidth;
uniform float uElevationScale;

uniform vec3 uColorFire;
uniform vec3 uColorIce;
uniform vec3 uColorInfection;
uniform vec3 uColorPollution;
uniform vec4 uLerpStrength;

uniform float uBiomeStrength;
uniform float uSnowLineStrength;

// Global temperature offset in °C added to every cell's baked annual-mean
// temperature before any temperature-driven effect (snow line, cold/hot
// color tint). 0 = baseline; negative = winter; positive = summer.
uniform float uSeasonOffsetC;

// Alpine thinning strength: how strongly the biome colour fades toward
// bare-rock grey-tan as elevation rises from 1.5 km to 4 km. 0 = no
// effect; 1 = full bare-rock at 4 km+.
uniform float uAlpineStrength;

in vec3 vWorldPos;
in vec3 vSphereDir;

out vec4 fragColor;

// Biome destination palette. Indexed by canonical biome_class code
// (matches \`data-pipeline/config/attrs.yaml\` esa_worldcover remap).
//   0  no data / fallback     — vec3(0)         passthrough → ocean tone
//   1  tree cover (forest)    — deep green
//   2  shrubland              — olive / khaki
//   3  grassland              — light olive
//   4  cropland               — wheat / mustard
//   5  built-up               — neutral grey
//   6  bare / sparse veg      — desert tan
//   7  snow & ice             — pale blue-white
//   8  permanent water        — mid blue
//   9  herbaceous wetland     — muted teal-green
//  10  mangroves              — dark teal-green
//  11  moss & lichen / tundra — pale grey-blue
vec3 biomePalette(int code) {
  if (code <= 0) return vec3(0.55, 0.5, 0.4);    // landfall fallback (sand-ish)
  if (code == 1)  return vec3(0.157, 0.431, 0.235);
  if (code == 2)  return vec3(0.522, 0.541, 0.298);
  if (code == 3)  return vec3(0.553, 0.659, 0.345);
  if (code == 4)  return vec3(0.745, 0.706, 0.380);
  if (code == 5)  return vec3(0.451, 0.439, 0.424);
  if (code == 6)  return vec3(0.882, 0.765, 0.510);
  if (code == 7)  return vec3(0.882, 0.922, 0.961);
  if (code == 8)  return vec3(0.235, 0.510, 0.784);
  if (code == 9)  return vec3(0.353, 0.510, 0.431);
  if (code == 10) return vec3(0.235, 0.412, 0.314);
  if (code == 11) return vec3(0.706, 0.765, 0.784);
  return vec3(0.55, 0.5, 0.4);
}

// Shoreline tint used when a neighbour cell is ocean (bodyId == 0).
// Matches the water shader's \`uOceanShallow\` so coastal land fades toward
// the same blue the water mesh is painting next to it.
const vec3 SHORE_BLUE = vec3(0.239, 0.651, 0.761);

// Sample a neighbour cell. \`.rgb\` is its biome colour OR the supplied
// \`fallback\` (centre colour) if it's ocean — so ocean neighbours don't
// pull foreign colour into the blend, they only contribute to the alpha
// fade via \`.a == 1.0\`. The summed alpha across the 8 neighbours drives
// the coast-coverage value the alpha-to-coverage path consumes.
vec4 neighbourSample(ivec2 t, vec3 fallback) {
  if (isOceanIdTexel(texelFetch(uIdRaster, t, 0))) return vec4(fallback, 1.0);
  int b = int(texelFetch(uAttrStatic, t, 0).g * 255.0 + 0.5);
  return vec4(biomePalette(b), 0.0);
}

void main() {
  // Tangent basis matching the vertex shader.
  vec3 dir = normalize(vSphereDir);
  vec3 nUp = abs(dir.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 t1 = normalize(cross(nUp, dir));
  vec3 t2 = cross(dir, t1);

  // ----- Normal: 8-neighbour Sobel gradient at 4 cells -----
  // The straight central-difference gradient was a step function (raw cell
  // elevations on either side, snapping as fragments cross cell edges) and
  // produced visible banding. The Sobel kernel's [1,2,1] weighting acts as
  // a tiny Gaussian blur on the gradient itself — smoother slopes, no
  // banding. Slope is clamped so a single-cell elevation cliff can't tilt
  // the normal nearly horizontal.
  const float nEps = 4.0e-3;
  const float nDiag = 0.7071;
  vec3 nDe  = normalize(dir + t1 * nEps);
  vec3 nDw  = normalize(dir - t1 * nEps);
  vec3 nDn  = normalize(dir + t2 * nEps);
  vec3 nDs  = normalize(dir - t2 * nEps);
  vec3 nDne = normalize(dir + (t1 + t2) * nEps * nDiag);
  vec3 nDnw = normalize(dir + (-t1 + t2) * nEps * nDiag);
  vec3 nDse = normalize(dir + (t1 - t2) * nEps * nDiag);
  vec3 nDsw = normalize(dir + (-t1 - t2) * nEps * nDiag);
  ivec2 ntxE  = healpixIpixToTexel(healpixZPhiToPix(uHealpixNside, uHealpixOrdering, nDe.z,  atan(nDe.y,  nDe.x)),  uAttrTexWidth);
  ivec2 ntxW  = healpixIpixToTexel(healpixZPhiToPix(uHealpixNside, uHealpixOrdering, nDw.z,  atan(nDw.y,  nDw.x)),  uAttrTexWidth);
  ivec2 ntxN  = healpixIpixToTexel(healpixZPhiToPix(uHealpixNside, uHealpixOrdering, nDn.z,  atan(nDn.y,  nDn.x)),  uAttrTexWidth);
  ivec2 ntxS  = healpixIpixToTexel(healpixZPhiToPix(uHealpixNside, uHealpixOrdering, nDs.z,  atan(nDs.y,  nDs.x)),  uAttrTexWidth);
  ivec2 ntxNE = healpixIpixToTexel(healpixZPhiToPix(uHealpixNside, uHealpixOrdering, nDne.z, atan(nDne.y, nDne.x)), uAttrTexWidth);
  ivec2 ntxNW = healpixIpixToTexel(healpixZPhiToPix(uHealpixNside, uHealpixOrdering, nDnw.z, atan(nDnw.y, nDnw.x)), uAttrTexWidth);
  ivec2 ntxSE = healpixIpixToTexel(healpixZPhiToPix(uHealpixNside, uHealpixOrdering, nDse.z, atan(nDse.y, nDse.x)), uAttrTexWidth);
  ivec2 ntxSW = healpixIpixToTexel(healpixZPhiToPix(uHealpixNside, uHealpixOrdering, nDsw.z, atan(nDsw.y, nDsw.x)), uAttrTexWidth);
  float eE  = max(texelFetch(uElevationMeters, ntxE,  0).r, 0.0);
  float eW  = max(texelFetch(uElevationMeters, ntxW,  0).r, 0.0);
  float eN  = max(texelFetch(uElevationMeters, ntxN,  0).r, 0.0);
  float eS  = max(texelFetch(uElevationMeters, ntxS,  0).r, 0.0);
  float eNE = max(texelFetch(uElevationMeters, ntxNE, 0).r, 0.0);
  float eNW = max(texelFetch(uElevationMeters, ntxNW, 0).r, 0.0);
  float eSE = max(texelFetch(uElevationMeters, ntxSE, 0).r, 0.0);
  float eSW = max(texelFetch(uElevationMeters, ntxSW, 0).r, 0.0);
  // Sobel kernel: divisor 8 (sum of positive weights × distance ≈ 8·eps).
  float Gx = (eNE + 2.0 * eE + eSE) - (eNW + 2.0 * eW + eSW);
  float Gy = (eNW + 2.0 * eN + eNE) - (eSW + 2.0 * eS + eSE);
  float slopeT1 = clamp(Gx * uElevationScale / (8.0 * nEps), -0.6, 0.6);
  float slopeT2 = clamp(Gy * uElevationScale / (8.0 * nEps), -0.6, 0.6);
  vec3 n = normalize(dir - slopeT1 * t1 - slopeT2 * t2);

  // Use the *pre-displacement* direction for HEALPix lookups so the cell
  // we sample matches the cell that produced the displacement at this
  // vertex — not the cell the displaced position happens to fall on.
  int ipx = healpixZPhiToPix(uHealpixNside, uHealpixOrdering, vSphereDir.z, atan(vSphereDir.y, vSphereDir.x));
  ivec2 tx = healpixIpixToTexel(ipx, uAttrTexWidth);

  uint bodyId = unpackBodyId(texelFetch(uIdRaster, tx, 0));
  // No discard. Coast coverage is handled below via fragAlpha + the
  // material's alphaToCoverage flag.

  // Land: biome → alpine thinning → temp tint → snow line → dynamic recolour.
  // ----- Biome blend: 9-tap equal-weight at ~3 cells (aggressive) -----
  // Centre and 8 neighbours all weighted equally. Wide radius means
  // neighbouring biomes bleed multiple cells into each other → sharp
  // categorical jumps melt into smooth multi-cell gradients.
  vec4 staticTexel = texelFetch(uAttrStatic, tx, 0);
  int biomeC = int(staticTexel.g * 255.0 + 0.5);

  const float bEps = 6.0e-3;
  const float bDiag = 0.7071;
  vec3 bDe  = normalize(dir + t1 * bEps);
  vec3 bDw  = normalize(dir - t1 * bEps);
  vec3 bDn  = normalize(dir + t2 * bEps);
  vec3 bDs  = normalize(dir - t2 * bEps);
  vec3 bDne = normalize(dir + (t1 + t2) * bEps * bDiag);
  vec3 bDnw = normalize(dir + (-t1 + t2) * bEps * bDiag);
  vec3 bDse = normalize(dir + (t1 - t2) * bEps * bDiag);
  vec3 bDsw = normalize(dir + (-t1 - t2) * bEps * bDiag);
  ivec2 btxE  = healpixIpixToTexel(healpixZPhiToPix(uHealpixNside, uHealpixOrdering, bDe.z,  atan(bDe.y,  bDe.x)),  uAttrTexWidth);
  ivec2 btxW  = healpixIpixToTexel(healpixZPhiToPix(uHealpixNside, uHealpixOrdering, bDw.z,  atan(bDw.y,  bDw.x)),  uAttrTexWidth);
  ivec2 btxN  = healpixIpixToTexel(healpixZPhiToPix(uHealpixNside, uHealpixOrdering, bDn.z,  atan(bDn.y,  bDn.x)),  uAttrTexWidth);
  ivec2 btxS  = healpixIpixToTexel(healpixZPhiToPix(uHealpixNside, uHealpixOrdering, bDs.z,  atan(bDs.y,  bDs.x)),  uAttrTexWidth);
  ivec2 btxNE = healpixIpixToTexel(healpixZPhiToPix(uHealpixNside, uHealpixOrdering, bDne.z, atan(bDne.y, bDne.x)), uAttrTexWidth);
  ivec2 btxNW = healpixIpixToTexel(healpixZPhiToPix(uHealpixNside, uHealpixOrdering, bDnw.z, atan(bDnw.y, bDnw.x)), uAttrTexWidth);
  ivec2 btxSE = healpixIpixToTexel(healpixZPhiToPix(uHealpixNside, uHealpixOrdering, bDse.z, atan(bDse.y, bDse.x)), uAttrTexWidth);
  ivec2 btxSW = healpixIpixToTexel(healpixZPhiToPix(uHealpixNside, uHealpixOrdering, bDsw.z, atan(bDsw.y, bDsw.x)), uAttrTexWidth);
  float temperatureC = texelFetch(uAttrClimate, tx, 0).r;
  vec4 dyn = clamp(texelFetch(uAttrDynamic, tx, 0) * uLerpStrength,
                   vec4(0.0), vec4(1.0));

  // Equal-weight 9-tap. Ocean neighbours contribute the centre's biome
  // (no foreign colour pulled in) and bump the alpha-fade counter via
  // their \`.a\` channel.
  vec3 centerColor = biomePalette(biomeC);
  vec4 nE_  = neighbourSample(btxE,  centerColor);
  vec4 nW_  = neighbourSample(btxW,  centerColor);
  vec4 nN_  = neighbourSample(btxN,  centerColor);
  vec4 nS_  = neighbourSample(btxS,  centerColor);
  vec4 nNE_ = neighbourSample(btxNE, centerColor);
  vec4 nNW_ = neighbourSample(btxNW, centerColor);
  vec4 nSE_ = neighbourSample(btxSE, centerColor);
  vec4 nSW_ = neighbourSample(btxSW, centerColor);
  vec3 base = (
    centerColor +
    nE_.rgb + nW_.rgb + nN_.rgb + nS_.rgb +
    nNE_.rgb + nNW_.rgb + nSE_.rgb + nSW_.rgb
  ) * (1.0 / 9.0);
  float oceanCount = nE_.a + nW_.a + nN_.a + nS_.a + nNE_.a + nNW_.a + nSE_.a + nSW_.a;
  if (bodyId == 0u) oceanCount = 8.0;
  // Coast fade: starts at 1 ocean neighbour, fully transparent by 6.
  // Wider band → more dissolve, more "smoothed" coastline.
  float fragAlpha = 1.0 - smoothstep(1.0, 6.0, oceanCount);
  // uBiomeStrength is preserved as a uniform so the existing Tweakpane
  // slider keeps working; it lerps toward a neutral landfall tone.
  base = mix(vec3(0.55, 0.5, 0.4), base, clamp(uBiomeStrength, 0.0, 1.0));

  // Continuous elevation in metres at the centre cell (same texture the
  // vertex shader displaces from). Used for alpine thinning.
  float elevM = max(texelFetch(uElevationMeters, tx, 0).r, 0.0);

  // ----- Alpine thinning -----
  // Smoothly fade the biome colour toward bare-rock grey-tan as elevation
  // rises. Below ~1500 m: untouched. Above ~4000 m: ~70% rock. The blend
  // is \`smoothstep\` so there are no hard altitude lines.
  const vec3 ALPINE_BARE = vec3(0.55, 0.50, 0.45);
  float altThin = smoothstep(1500.0, 4000.0, elevM);
  base = mix(base, ALPINE_BARE, altThin * clamp(uAlpineStrength, 0.0, 1.0));

  // ----- Effective temperature (with season slider) -----
  // Baked WorldClim annual mean + uSeasonOffsetC. Drives both the
  // hot/cold colour tint below and the dynamic snow line. One value
  // means one slider rolls the whole globe between summer and winter.
  float effTempC = temperatureC + uSeasonOffsetC;

  // ----- Cold tint -----
  // Below ~18 °C the biome desaturates toward a muted grey-tan in the
  // same family as the alpine-bare colour. Cold deserts (Patagonia,
  // Gobi, Tibet, Atacama) share the same "bare" biome code as hot
  // deserts, so without a strong tint here they paint identical to
  // the Sahara. Pale-blue "frost" reads wrong on dry rocky desert —
  // dusty grey-tan reads right.
  //
  // Range +22 → -2 °C and 95 % max blend chosen so:
  //   Sahara/Outback (~28 °C)  → 0 %   (untouched)
  //   Mediterranean (~16 °C)    → ~24 % (visibly cooler)
  //   Patagonia (~8 °C)        → ~55 % (cold-desert character)
  //   Tibetan plateau (~3 °C)  → ~75 %
  //   Tundra/polar (-2 °C+)    → 95 %  (almost full takeover)
  const vec3 COLD_TONE = vec3(0.50, 0.48, 0.44);
  float coldBlend = smoothstep(22.0, -2.0, effTempC);
  base = mix(base, COLD_TONE, coldBlend * 0.95);

  // ----- Hot tint -----
  // Above ~22 °C a slight tan/dry tint creeps in (sun-baked vegetation,
  // dry grass). Capped at 25% blend.
  const vec3 HOT_DRY = vec3(0.78, 0.70, 0.50);
  float hotBlend = smoothstep(22.0, 36.0, effTempC);
  base = mix(base, HOT_DRY, hotBlend * 0.25);

  // ----- Snow line -----
  // Driven directly by effective temperature. WorldClim already encodes
  // altitude effects per cell (a 5 km equatorial peak reports its real
  // ~6 °C, not the sea-level value), so adding a lapse-rate term here
  // would double-count and over-snow tropical mountains.
  float snowMix = uSnowLineStrength * (1.0 - smoothstep(-10.0, -1.0, effTempC));
  base = mix(base, uColorIce, clamp(snowMix, 0.0, 1.0));

  base = mix(base, uColorFire, dyn.r);
  base = mix(base, uColorIce, dyn.g);
  base = mix(base, uColorInfection, dyn.b);
  base = mix(base, uColorPollution, dyn.a);

  // Wrap-lambert day/night with a wider band. The Sobel-tilted normal
  // can dip well below 0 on lee-side slopes; with the original [-0.2, 0.6]
  // range those slopes pinned to pure night (very dark). The wider
  // [-0.6, 0.8] range gives a softer falloff so shadowed slopes stay
  // legible.
  vec3 sunDir = normalize(uSunDirection);
  float ndotl = dot(n, sunDir);
  float wrap = smoothstep(-0.6, 0.8, ndotl);
  vec3 day = base * (uAmbient + (1.0 - uAmbient) * max(ndotl, 0.0));
  vec3 night = base * uNightTint;
  fragColor = vec4(mix(night, day, wrap), fragAlpha);
}
`;

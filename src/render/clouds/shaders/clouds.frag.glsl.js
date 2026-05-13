// Inlined from clouds.frag.glsl. Edit the GLSL inside the template literal —
// the source of truth lives here, no separate .glsl file on disk.
export const source = `// Volumetric cloud raymarch (M5).
//
// Drawn as a fullscreen triangle in the scene with \`transparent = true\`,
// \`depthTest = false\`, \`depthWrite = false\`, \`renderOrder = 0\` — so it
// composites *after* the opaque globe (which has written depth) and
// *before* the atmosphere (renderOrder = 1) which adds the rim glow on
// top. Premultiplied alpha output: the front-to-back integration already
// folds opacity into RGB.
//
// Domain: spherical shell \`[cloudInner(), cloudOuter()]\` — base at
// CLOUD_BASE_M (1500 m), top at CLOUD_TOP_M (2500 m), both expressed in
// the same metres-→-unit-sphere scale (\`uElevationScale\`) the land/water
// vertex shaders use. The mountain-mask cutoff in \`biomeProfileAt\`
// (2500–3000 m) clears cover from high terrain so peaks above 3000 m
// have no clouds forming on them in the first place.
// Density is procedural 3D noise; advection is a per-fragment lat/lon
// shift sampled from the pre-baked wind field.
//
// Algorithm (per fragment):
//   1. Reconstruct world-space view ray from \`vUv\` + \`uInvViewProj\`.
//   2. Intersect ray with planet, inner shell, outer shell.
//   3. Choose \`[t0, t1]\` = front segment of the cloud shell, clipped to
//      the planet hit if any. Discard if empty.
//   4. Front-to-back raymarch with a hash-jittered start to break
//      banding. 12 steps; transmittance early-out at 0.01.
//   5. Per active sample: short light march toward the sun (3 steps),
//      Henyey-Greenstein phase, Beer-Lambert absorption, day/night wrap.
//
// The pass requires the wind field bound to \`uWindField\`. If the bake
// shipped a placeholder, the runtime keeps the layer toggle off — see
// \`scene-graph.ts\`.

precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uWindField;       // RG16F equirect, m/s (u, v).
uniform vec3 uCameraPos;
uniform vec3 uSunDirection;
uniform mat4 uInvViewProj;
uniform float uTime;

uniform float uDensity;             // overall density scale (Tweakpane)
uniform float uCoverage;            // FBM threshold — higher = more sky covered
uniform float uBeer;                // Beer-Lambert extinction strength
uniform float uHenyey;              // Henyey-Greenstein g parameter
uniform float uAdvection;           // wind-shift multiplier

// Per-biome octave-weight profiles for cn_fbm_weighted. Modulating
// *which octaves dominate* — rather than the noise scale or sampling
// position — changes the visual "feel" (small busy puffs vs big smooth
// sheets) without ever shifting where the noise is sampled, so
// neighbouring biomes blend seamlessly through the 19-tap cover blur.
//   weights ≈ (oct0_lowfreq, oct1, oct2, oct3_highfreq)
const vec4 W_TEMPERATE = vec4(0.35, 0.40, 0.25, 0.15);  // pre-bake default
const vec4 W_TROPICAL  = vec4(0.20, 0.35, 0.30, 0.20);  // forest/wetland — busier, finer detail
const vec4 W_POLAR     = vec4(0.55, 0.30, 0.10, 0.05);  // ice/tundra — big smooth sheets
const vec4 W_ARID      = vec4(0.50, 0.30, 0.10, 0.05);  // desert — sparse broad shapes
const float NOISE_SCALE = 9.0;
const float WORLEY_MIX = 0.7;

// Per-fragment biome profile, produced by the 19-tap hex blur in
// \`sampleBiomeProfile\`. Both fields vary smoothly across biome edges
// thanks to the blur kernel (~300 km diameter), so adjacent fragments
// see near-identical values — no tearing at coastlines.
struct CoverSample {
  float cover;     // blurred cover multiplier, ~[0, 1.2]
  vec4 weights;    // blurred FBM octave weights
};

// Same metres → unit-sphere displacement scale used by Land/Water vertex
// shaders. Drives the cloud shell altitude so the cloud base sits at
// exactly CLOUD_BASE_M above the rendered sea-level radius.
uniform float uElevationScale;

// Geo data — biome class + climate + elevation. Sampled per HEALPix cell
// via \`biomeProfileAt()\` and blurred (19-tap hex) inside
// \`sampleBiomeProfile\`. The blur produces a smooth \`CoverSample\` that
// modulates two things per biome:
//   * cover — multiplies the coverage threshold (more clouds in
//     tropical / wetland, fewer in desert / ice / over high peaks).
//   * weights — reshapes the SAME noise samples octave-by-octave so
//     tropical biomes read as busy puffs and polar biomes as big
//     smooth sheets, without ever moving the sample positions (so no
//     tearing at biome edges).
// Elevation is read inside \`biomeProfileAt\` to fade cover above peaks
// (geometry choice — the cloud shell sits at 1500–2500 m, so high
// terrain pokes through and shouldn't carry cloud cover); horizontal
// terrain response (wind curving around ranges, piling up on windward
// sides) comes from the wind data itself.
uniform sampler2D uAttrStatic;     // RGBA8: elevClass / biomeClass / soilClass / urbanization
uniform sampler2D uAttrClimate;    // RG16F: temperature_c / moisture_frac
uniform sampler2D uElevationMeters; // R16F: continuous elevation in metres (read in biomeProfileAt)
uniform int uHealpixNside;
uniform int uHealpixOrdering;
uniform int uAttrTexWidth;

const float PI = 3.14159265359;
const float PLANET_R = 1.0;

// Cloud shell altitude in metres above sea level. The mountain-mask
// in \`biomeProfileAt\` (2500–3000 m suppression band) clears cover from
// high terrain so peaks above 3000 m carry no cloud cover at all.
// Lower peaks (Andes / Himalayan foothills) physically poke through
// the cloud shell — the per-cell cover suppression handles the
// visibility side; the geometry side resolves itself because the
// raymarch clips at the planet surface.
const float CLOUD_BASE_M = 1500.0;
const float CLOUD_TOP_M  = 2500.0;

const int RAY_STEPS = 12;
const int LIGHT_STEPS = 3;

// Cloud shell radii in unit-sphere units. These cannot be GLSL \`const\`
// because they depend on \`uElevationScale\` (a uniform), but the compiler
// inlines and constant-folds the uniform per draw, so call cost is zero.
float cloudInner() { return PLANET_R + CLOUD_BASE_M * uElevationScale; }
float cloudOuter() { return PLANET_R + CLOUD_TOP_M * uElevationScale; }
float shellThick() { return (CLOUD_TOP_M - CLOUD_BASE_M) * uElevationScale; }

// Extinction-coefficient scale. \`cloudDensity\` returns a normalised
// density in roughly [0, 1]; the raymarch consumes it as
// optical_depth = density * dt * uBeer * EXTINCTION_VIEW. Without this
// scale, dt is in unit-radius (≈ 6371 km per unit) and the per-step
// absorption is negligible — clouds would barely register at any
// \`uBeer\` the slider can push. 2000 puts a peak-density step at
// alpha ≈ 0.5 with default Tweakpane values, so out-of-the-box clouds
// read as solid silhouettes against the sky.
//
// Light march uses a smaller multiplier so even peak-density clouds
// retain some directly-lit brightness instead of going fully black —
// cheap proxy for the powder/multi-scattering term that real cloud
// renderers use.
const float EXTINCTION_VIEW = 2000.0;
const float EXTINCTION_LIGHT = 500.0;

// Wind is m/s. One radian on the unit sphere = ~6371 km. So at altitude
// ~6385 km, 1 m/s integrates to (1 / 6.385e6) rad/s ≈ 1.566e-7 rad/s.
// The Tweakpane \`advection\` multiplier scales this. Without the user
// dialing it up, real wind speeds (~10 m/s typical, ~100 m/s jet stream)
// move the pattern visibly over a minute or two of real time.
const float WIND_M_PER_S_TO_RAD_PER_S = 1.566e-7;

// Slow morph through the 3D noise volume — gives clouds a "lifetime"
// independent of wind drift. Without this, the noise field is purely
// spatial: blobs slide forever along streamlines but never bloom or
// dissolve. With this, every fragment slowly walks through a different
// slice of the same noise volume, so coverage at any fixed point flips
// between "below threshold" (clear sky) and "above threshold" (cloud)
// over time. Constant axis is irrational-ish so the walk doesn't lock
// onto a periodic orbit.
//
// Rate: 3.0e-4 per uTime unit. With CLOUD_TIME_SCALE=400 driving uTime
// at 400/sec of wall-clock, that's ~0.12 noise-units/sec → one full
// noise wavelength every ~8.5 sec real time. Doubled from the original
// 1.5e-4 to halve cloud lifetime — clouds bloom and dissolve faster so
// the global pattern doesn't read as one huge static streak.
const float MORPH_RATE = 3.0e-4;
const vec3 MORPH_AXIS = vec3(0.71, 0.39, 1.13);

// Ray-sphere helpers. Mirrors atmosphere/common.glsl's pair so we don't
// need to pull the whole atmosphere preamble into this shader.
float rayShellNearest(vec3 ro, vec3 dir, float radius) {
  float b = dot(ro, dir);
  float c = dot(ro, ro) - radius * radius;
  float disc = b * b - c;
  if (disc < 0.0) return -1.0;
  float sq = sqrt(disc);
  float t0 = -b - sq;
  float t1 = -b + sq;
  if (t0 >= 0.0) return t0;
  if (t1 >= 0.0) return t1;
  return -1.0;
}

float rayShellFar(vec3 ro, vec3 dir, float radius) {
  float b = dot(ro, dir);
  float c = dot(ro, ro) - radius * radius;
  float disc = b * b - c;
  if (disc < 0.0) return -1.0;
  return -b + sqrt(disc);
}

vec2 sampleWindLatLon(vec3 dir) {
  float lat = asin(clamp(dir.z, -1.0, 1.0));
  float lon = atan(dir.y, dir.x);
  // Equirect: u maps lon ∈ (-π, π] → (0, 1]; v maps lat ∈ [-π/2, π/2] → [1, 0]
  // (textures with origin at top-left: top row = +90°N).
  vec2 uv = vec2((lon + PI) / (2.0 * PI), 0.5 - lat / PI);
  return texture(uWindField, uv).rg;
}

// Sample cloud density at world position \`p\`. Returns ~[0, 1] scaled by
// \`uDensity\` so a value of 1 means "fully opaque per unit-radius step."
//
// DESIGN RULE: noise sample POSITIONS (scale, wind warp, morph) are
// globally identical at every pixel. What CAN vary per biome:
//   * coverage threshold (via \`profile.cover\`) — shifts which noise
//     peaks become cloud, so arid biomes have fewer cloud patches
//     instead of just dimmer ones.
//   * octave weights (via \`profile.weights\`) — re-mixes the SAME
//     underlying noise samples. Low-freq dominant reads as big smooth
//     sheets (polar); high-freq emphasised reads as busy puffs
//     (tropical). The samples themselves don't move.
//
// Both are safe because they ride the 19-tap blurred biome field. The
// blur kernel (~300 km diameter) is far wider than a screen pixel, so
// adjacent fragments see near-identical threshold + weights — no
// tearing at biome boundaries. What stays globally uniform: \`sampleP\`
// itself. Varying that per pixel WOULD tear, because neighbouring
// pixels would read disjoint regions of the noise field.
float cloudDensity(vec3 p, CoverSample profile, vec3 windOffset) {
  float r = length(p);

  // Vertical fade — density peaks in the middle of the shell, tapers to
  // zero at top + bottom so the silhouette doesn't read as a hard cube.
  float h = (r - cloudInner()) / shellThick();
  if (h < 0.0 || h > 1.0) return 0.0;
  float vFade = smoothstep(0.0, 0.18, h) * smoothstep(1.0, 0.75, h);
  if (vFade <= 0.0) return 0.0;

  vec3 dir = p / r;

  // \`windOffset\` is hoisted to main — sampled once at the segment
  // midpoint instead of per step. Within the ~1 km cloud shell, dir
  // changes by at most ~0.0002 rad, which is far below the noise
  // pattern's spatial scale, so a single evaluation is visually
  // indistinguishable from per-step. Saves the wind texture lookup,
  // the east/north basis, and the polarFade smoothstep at every
  // march step.
  vec3 morph = MORPH_AXIS * (uTime * MORPH_RATE);
  vec3 sampleP = dir * NOISE_SCALE + morph + windOffset;

  // FBM with per-biome octave weights. Sample positions are unchanged
  // across biomes — only the per-octave mix is biome-dependent — so the
  // cloud field stays spatially coherent and biome edges don't tear.
  float n = cn_fbm_weighted(sampleP, profile.weights);

  // Coverage threshold — biome modulates this so that low-cover regions
  // (deserts, mountain peaks) actually clear out instead of just showing
  // dimmer clouds. \`profile.cover\` is the 19-tap-blurred biome value in
  // [0, ~1.2]; the noise SAMPLES are globally identical so cloud SHAPE
  // remains coherent across biome edges. Only the threshold shifts
  // smoothly with the blur — clouds *form in fewer places* over
  // deserts, not just thinner.
  float effectiveCoverage = uCoverage * profile.cover;
  float thresh = 1.0 - effectiveCoverage;
  float baseSlab = smoothstep(thresh, 1.0, n);
  if (baseSlab <= 0.0) return 0.0;

  // Erosion: 3D Worley carves billows / chunkiness inside the slabs.
  // \`WORLEY_MIX\` controls how aggressively Worley bites in: 0 = pure FBM
  // slabs (no chunkiness), 1 = fully Worley-eroded.
  float wd = cn_worley(sampleP + vec3(3.7, 1.3, 5.1));
  float erosion = clamp(1.0 - wd, 0.0, 1.0);
  float density = baseSlab * (1.0 - WORLEY_MIX + WORLEY_MIX * erosion);

  return density * vFade * uDensity;
}

// Cheap FBM-only density for the light march. Skips the 27-cell Worley
// erosion call — by far the most expensive part of \`cloudDensity\`. The
// light march runs LIGHT_STEPS (3) inner taps per active view sample, so
// dropping Worley from the inner loop is the single biggest fragment-
// shader win on the light-march path.
//
// Erosion contributes roughly \`(0.45 + 0.55 * mean) ≈ 0.725\` on average
// (Worley distance is roughly uniform in [0, 1]). Substituting that
// constant keeps the light-march extinction in the same ballpark as the
// view march, so cloud self-shadowing stays in approximately the right
// range — clouds aren't suddenly darker or brighter, just slightly less
// crispy in their internal shadowing detail. Visually a near-no-op since
// the light march only feeds the directly-lit term, not the silhouette.
float cloudDensityLight(vec3 p, CoverSample profile, vec3 windOffset) {
  float r = length(p);
  float h = (r - cloudInner()) / shellThick();
  if (h < 0.0 || h > 1.0) return 0.0;
  float vFade = smoothstep(0.0, 0.18, h) * smoothstep(1.0, 0.75, h);
  if (vFade <= 0.0) return 0.0;

  vec3 dir = p / r;
  vec3 morph = MORPH_AXIS * (uTime * MORPH_RATE);
  vec3 sampleP = dir * NOISE_SCALE + morph + windOffset;

  float n = cn_fbm_weighted(sampleP, profile.weights);

  float effectiveCoverage = uCoverage * profile.cover;
  float thresh = 1.0 - effectiveCoverage;
  float baseSlab = smoothstep(thresh, 1.0, n);
  if (baseSlab <= 0.0) return 0.0;

  // Constant erosion factor stands in for the skipped Worley channel.
  // Mean Worley distance ≈ 0.5, so substituting that into the view
  // march's formula gives \`1.0 - 0.5 * WORLEY_MIX\` — keeps the light
  // march tracking the view march's average extinction.
  float density = baseSlab * (1.0 - 0.5 * WORLEY_MIX);

  return density * vFade * uDensity;
}

float henyeyGreenstein(float cosTheta, float g) {
  float g2 = g * g;
  float denom = pow(max(0.0, 1.0 + g2 - 2.0 * g * cosTheta), 1.5);
  return (1.0 - g2) / max(denom, 1e-4) / (4.0 * PI);
}

// Per-cell biome → CoverSample. One HEALPix lookup, returns a discrete
// per-cell pair (cover scalar + octave-weight vec4).
//
// Cover values:
//   forest / wetland   → 1.2   (cloudier than ocean — humid convection)
//   ocean (warm/cold)  → 1.0   (ITCZ + storm tracks)
//   moss / tundra      → 0.8
//   ice                → 0.5   (broad polar fronts, but thin)
//   default land       → smoothstep on moistureFrac (real precipitation cut)
//   desert             → 0.1   (Hadley descent, near-cloudless)
//
// Weight profiles (assigned alongside cover):
//   forest / wetland   → W_TROPICAL (busier puffs, more high-freq detail)
//   ice / tundra       → W_POLAR    (big smooth low-freq sheets)
//   desert             → W_ARID     (sparse broad low-freq shapes)
//   ocean / default    → W_TEMPERATE (current look — balanced)
//
// Mountain boundary: cells above 2500 m elevation get their cover faded
// to zero (full suppression by 3000 m). The 19-tap blur softens the
// boundary further so the suppression doesn't read as a hard outline.
//
// Biome codes (from \`attrs.yaml\`, encoded into G channel × 255):
//   1=tree-cover  6=bare/desert  7=snow/ice  8=water (ocean)
//   9=wetland     10=mangroves   11=moss/tundra
//
// Returns per-cell discrete values. Callers MUST blur (see
// \`sampleBiomeProfile\`) so coastlines don't stamp a hard step into
// either cover or weights.
CoverSample biomeProfileAt(vec3 dir) {
  int ipix = healpixZPhiToPix(uHealpixNside, uHealpixOrdering, dir.z, atan(dir.y, dir.x));
  ivec2 tx = healpixIpixToTexel(ipix, uAttrTexWidth);
  float biomeF = texelFetch(uAttrStatic, tx, 0).g * 255.0;
  vec2 climate = texelFetch(uAttrClimate, tx, 0).rg;
  float moistureFrac = climate.g;
  float elevM = texelFetch(uElevationMeters, tx, 0).r;

  float isOcean   = step(7.5, biomeF) * step(biomeF, 8.5);
  float isDesert  = step(5.5, biomeF) * step(biomeF, 6.5);
  float isForest  = step(0.5, biomeF) * step(biomeF, 1.5);
  float isWetland = step(8.5, biomeF) * step(biomeF, 10.5);
  float isIce     = step(6.5, biomeF) * step(biomeF, 7.5);
  float isTundra  = step(10.5, biomeF) * step(biomeF, 11.5);

  // Default land: precipitation-driven cover.
  float landCover = smoothstep(0.05, 0.35, moistureFrac);

  // Each \`is*\` flag (mutually exclusive) overrides defaults. Cover
  // values can exceed 1.0 — feeds the coverage threshold
  // (effectiveCoverage = uCoverage * cover), so > 1.0 means "more
  // covered than the global Tweakpane setting alone would give."
  float cover = landCover;
  cover = mix(cover, 0.10, isDesert);
  cover = mix(cover, 1.20, isForest);
  cover = mix(cover, 1.20, isWetland);
  cover = mix(cover, 0.50, isIce);
  cover = mix(cover, 0.80, isTundra);
  cover = mix(cover, 1.00, isOcean);

  // Mountain boundary: peaks above 2500 m suppress cloud formation,
  // fully cloud-free above 3000 m. The 500-m soft band keeps the edge
  // from looking stamped; the 19-tap blur outside softens it further.
  float mountainMask = 1.0 - smoothstep(2500.0, 3000.0, elevM);
  cover *= mountainMask;

  // Per-biome octave-weight profile. Same flags drive the choice;
  // ocean and default land both fall through to W_TEMPERATE.
  vec4 weights = W_TEMPERATE;
  weights = mix(weights, W_ARID,     isDesert);
  weights = mix(weights, W_TROPICAL, isForest);
  weights = mix(weights, W_TROPICAL, isWetland);
  weights = mix(weights, W_POLAR,    isIce);
  weights = mix(weights, W_POLAR,    isTundra);

  return CoverSample(cover, weights);
}

// 19-tap hex blur of biome profile (cover + octave weights). Centre +
// 6-tap inner ring (R) + 12-tap outer ring (2R). Inner R ≈ 0.012 rad
// ≈ 76 km (~6 HEALPix cells at nside=1024); kernel diameter ~300 km.
// Smooths per-cell biome transitions so coastlines and biome boundaries
// don't stamp hard steps into either cloud opacity OR cloud shape.
CoverSample sampleBiomeProfile(vec3 dir) {
  // Lat-tangent basis (see cloudDensity for the full explanation). The
  // previous \`abs(dir.z) < 0.99\` switch flipped the kernel orientation
  // at ~81.9° latitude — visible as a barrier circle around each pole
  // because the 19-tap blur sampled different neighbouring biome cells
  // on either side.
  vec3 east = vec3(-dir.y, dir.x, 0.0);
  float eastLen = length(east);
  east = (eastLen > 1e-3) ? east / eastLen : vec3(1.0, 0.0, 0.0);
  vec3 north = cross(dir, east);

  const float R = 0.012;
  CoverSample c0 = biomeProfileAt(dir);
  float cSum = c0.cover;
  vec4 wSum = c0.weights;

  for (int i = 0; i < 6; ++i) {
    float a = float(i) * 1.0471975512;  // π/3
    vec3 d = normalize(dir + east * (cos(a) * R) + north * (sin(a) * R));
    CoverSample s = biomeProfileAt(d);
    cSum += s.cover;
    wSum += s.weights;
  }

  for (int i = 0; i < 12; ++i) {
    float a = float(i) * 0.5235987756;  // π/6
    vec3 d = normalize(dir + east * (cos(a) * 2.0 * R) + north * (sin(a) * 2.0 * R));
    CoverSample s = biomeProfileAt(d);
    cSum += s.cover;
    wSum += s.weights;
  }

  return CoverSample(cSum * (1.0 / 19.0), wSum * (1.0 / 19.0));
}

void main() {
  // Reconstruct world-space view ray from screen UV.
  vec4 ndcNear = vec4(vUv * 2.0 - 1.0, -1.0, 1.0);
  vec4 ndcFar  = vec4(vUv * 2.0 - 1.0,  1.0, 1.0);
  vec4 wn = uInvViewProj * ndcNear;
  vec4 wf = uInvViewProj * ndcFar;
  vec3 worldNear = wn.xyz / wn.w;
  vec3 worldFar  = wf.xyz / wf.w;
  vec3 dir = normalize(worldFar - worldNear);

  vec3 ro = uCameraPos;

  // Ray vs cloud shell + planet. Camera sits at radius ~3 (well outside
  // the shell), so \`tOuterNear\` is the ray's first contact with the
  // shell from outside. \`tInnerNear\` is positive iff the ray plunges
  // into the cap that contains the planet.
  float rOuter = cloudOuter();
  float rInner = cloudInner();
  float tOuterNear = rayShellNearest(ro, dir, rOuter);
  float tOuterFar  = rayShellFar(ro, dir, rOuter);
  if (tOuterNear < 0.0 && tOuterFar < 0.0) discard;

  float tInnerNear = rayShellNearest(ro, dir, rInner);
  float tPlanet    = rayShellNearest(ro, dir, PLANET_R);

  float t0 = max(tOuterNear, 0.0);
  // Exit at the inner shell if we hit it (front lobe only — the back
  // lobe behind the planet is hidden by the globe's depth anyway), else
  // at the outer shell's far side.
  float t1 = (tInnerNear > 0.0) ? tInnerNear : tOuterFar;
  // Planet clip: never march past the surface.
  if (tPlanet > 0.0) t1 = min(t1, tPlanet);

  if (t1 <= t0) discard;

  // Cap segment so a near-miss grazing ray doesn't blow up step count.
  float thick = shellThick();
  float segLen = min(t1 - t0, 4.0 * thick);
  float dt = segLen / float(RAY_STEPS);

  // Surface-driven biome profile, sampled ONCE at the surface point
  // beneath the segment midpoint. Applies to every march step + every
  // light-march step in this fragment. 19-tap hex blur over biome data
  // (cover + per-octave FBM weights).
  vec3 segMid = ro + dir * (0.5 * (t0 + t1));
  vec3 segDir = normalize(segMid);
  CoverSample profile = sampleBiomeProfile(segDir);

  // Hoisted wind warp — sampled ONCE at the segment midpoint and reused
  // for every view-march and light-march step in this fragment. Within
  // the ~1 km cloud shell, dir changes by at most ~0.0002 rad which is
  // far below the noise pattern's spatial scale, so per-step recompute
  // would be visually identical at much higher cost. Lat-tangent basis:
  // east = unit eastward tangent ((-y, x, 0) normalised), the limit of
  // \`cross((0,0,1), dir) / cos(lat)\` away from the pole. \`eastLen\` =
  // cos(lat), so smoothstep(0.05, 0.20, eastLen) fades wind to zero
  // inside ~3° of the pole — where the lat-tangent basis spins
  // per-longitude and a fixed shift would scramble the cloud pattern.
  vec2 wind = sampleWindLatLon(segDir);
  vec3 east = vec3(-segDir.y, segDir.x, 0.0);
  float eastLen = length(east);
  east = (eastLen > 1e-3) ? east / eastLen : vec3(1.0, 0.0, 0.0);
  vec3 north = cross(segDir, east);
  float polarFade = smoothstep(0.05, 0.20, eastLen);
  // Wind contributes a bounded, direction-aligned warp of the noise
  // sample position — a STATIC deformation, not time-integrated. Using
  // a fixed time constant (not uTime) keeps the cloud pattern from
  // shearing unboundedly across the planet. All actual motion comes
  // from \`morph\` inside cloudDensity, which is globally uniform.
  const float WIND_WARP_TIME = 3200.0;
  float shift = WIND_M_PER_S_TO_RAD_PER_S * WIND_WARP_TIME * uAdvection * polarFade;
  vec3 windOffset = (east * wind.x + north * wind.y) * (shift * NOISE_SCALE);

  // Hash-jitter the start so undersampled steps spread their banding.
  // gl_FragCoord is in pixels; combining with uTime gives temporal
  // dither too without needing a blue-noise texture.
  float jitter = cn_hash13(vec3(gl_FragCoord.xy, uTime * 0.37));
  float t = t0 + jitter * dt;

  vec3 sunDir = normalize(uSunDirection);
  float cosTheta = dot(dir, sunDir);
  float phase = henyeyGreenstein(cosTheta, uHenyey);

  vec3 sunColor = vec3(1.00, 0.96, 0.88);
  vec3 ambientColor = vec3(0.55, 0.65, 0.80);

  vec3 col = vec3(0.0);
  float transmittance = 1.0;

  for (int i = 0; i < RAY_STEPS; ++i) {
    if (transmittance < 0.01) break;

    vec3 p = ro + dir * t;
    float d = cloudDensity(p, profile, windOffset);
    if (d > 0.001) {
      // Light march — a few exponentially-spaced samples toward the
      // sun. Cheap proxy for "how much sun reaches this voxel."
      float lightOptical = 0.0;
      float ls = thick * 0.05;
      vec3 lp = p;
      for (int j = 0; j < LIGHT_STEPS; ++j) {
        lp += sunDir * ls;
        lightOptical += cloudDensityLight(lp, profile, windOffset) * ls;
        ls *= 1.6;
      }
      float lightTransmit = exp(-lightOptical * uBeer * EXTINCTION_LIGHT);

      // Day/night wrap on the cloud sample's own normal — the part of
      // the shell facing away from the sun should darken regardless of
      // how thick the cloud is locally.
      vec3 nP = normalize(p);
      float wrap = smoothstep(-0.25, 0.55, dot(nP, sunDir));

      // In-scattering: directly-lit term + ambient sky tint.
      vec3 inscatter = sunColor * lightTransmit * phase * 4.0 * PI * mix(0.05, 1.0, wrap);
      inscatter += ambientColor * mix(0.20, 0.80, wrap);

      // Front-to-back integration. Beer extinction across this step,
      // then accumulate emitted/scattered light premultiplied by the
      // remaining transmittance.
      float absorb = exp(-d * dt * uBeer * EXTINCTION_VIEW);
      col += transmittance * (1.0 - absorb) * inscatter;
      transmittance *= absorb;
    }

    t += dt;
  }

  float alpha = clamp(1.0 - transmittance, 0.0, 1.0);
  if (alpha <= 0.0) discard;
  fragColor = vec4(col, alpha);
}
`;

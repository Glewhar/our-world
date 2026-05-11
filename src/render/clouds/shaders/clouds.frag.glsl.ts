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
// CLOUD_BASE_M (3000 m), top at CLOUD_TOP_M (4000 m), both expressed in
// the same metres-→-unit-sphere scale (\`uElevationScale\`) the land/water
// vertex shaders use. The cloud floor lines up with the mountain-mask
// cutoff in \`coverAt\` so peaks above 3000 m are above the cloud layer.
// Density is procedural 3D noise; advection is a per-fragment lat/lon
// shift sampled from the pre-baked wind field.
//
// Algorithm (per fragment):
//   1. Reconstruct world-space view ray from \`vUv\` + \`uInvViewProj\`.
//   2. Intersect ray with planet, inner shell, outer shell.
//   3. Choose \`[t0, t1]\` = front segment of the cloud shell, clipped to
//      the planet hit if any. Discard if empty.
//   4. Front-to-back raymarch with a hash-jittered start to break
//      banding. ~16 steps usually; transmittance early-out at 0.01.
//   5. Per active sample: short light march toward the sun, Henyey-
//      Greenstein phase, Beer-Lambert absorption, day/night wrap.
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

// Same metres → unit-sphere displacement scale used by Land/Water vertex
// shaders. Drives the cloud shell altitude so the cloud base sits at
// exactly CLOUD_BASE_M above the rendered sea-level radius.
uniform float uElevationScale;

// Geo data — biome class + climate + elevation. Sampled per HEALPix cell
// via \`coverAt()\` and blurred (19-tap hex) inside \`sampleCoverMul\`. The
// blur produces a smooth scalar [0, 1] that ONLY multiplies the final
// cloud density — the noise field that defines cloud SHAPES is globally
// uniform and ignores biome data entirely. Elevation is read inside
// \`coverAt\` to fade cover above peaks (geometry choice — the cloud shell
// sits at 1500–2500 m, so high terrain pokes through and shouldn't carry
// cloud cover); horizontal terrain response (wind curving around ranges,
// piling up on windward sides) comes from the wind data itself.
uniform sampler2D uIdRaster;
uniform sampler2D uAttrStatic;     // RGBA8: elevClass / biomeClass / soilClass / urbanization
uniform sampler2D uAttrClimate;    // RG16F: temperature_c / moisture_frac
uniform sampler2D uElevationMeters; // R16F: continuous elevation in metres (read in coverAt)
uniform int uHealpixNside;
uniform int uHealpixOrdering;
uniform int uAttrTexWidth;

const float PI = 3.14159265359;
const float PLANET_R = 1.0;

// Cloud shell altitude in metres above sea level. Base is at exactly
// CLOUD_BASE_M so the mountain-mask cutoff (also 3000 m, in \`coverAt\`)
// lines up with the cloud floor — peaks above 3000 m clear out from
// the cover map AND physically poke through the cloud base, no
// overlap, no funky intersection. Top is 1 km higher; cloud raymarch
// has room for volumetric depth.
const float CLOUD_BASE_M = 1500.0;
const float CLOUD_TOP_M  = 2500.0;

const int RAY_STEPS = 16;
const int LIGHT_STEPS = 4;

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

// Wind-shift crossfade period in uTime units. The wind-advection
// integral grows linearly with time and eventually pushes
// \`normalize(dir + huge*wind)\` into a degenerate regime where adjacent
// fragments collapse onto the same advected sample — visible as a
// single huge cloud streaking through high-wind regions. Solved by
// running TWO phases of the same density function offset by half a
// period; each phase's integral wraps every WIND_PERIOD, and a
// cosine crossfade hides the wraparound (the expiring phase has
// weight 0 at the moment its shift snaps back to zero). With
// CLOUD_TIME_SCALE=400 driving uTime at 400/sec wall-clock, 6400 = 16
// real seconds per cycle. Collapse begins around 22-25 sec (where
// max-wind × shift exceeds ~1 unit), so 16 leaves headroom while
// giving wind motion enough time per cycle to be clearly visible.
const float WIND_PERIOD = 6400.0;

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

// Single-phase noise contribution. Called twice by \`cloudDensity\` with
// two phaseTimes offset by half a wind cycle and crossfaded — see the
// WIND_PERIOD comment for why. \`phaseTime\` replaces \`uTime\` only in the
// wind-shift integral; the morph term is passed in directly so both
// phases sample the noise volume at the same morph offset (only their
// wind shift differs).
float phaseDensity(vec3 dir, vec2 wind, vec3 east, vec3 north,
                   float polarFade, vec3 morph, float phaseTime) {
  float shift = WIND_M_PER_S_TO_RAD_PER_S * phaseTime * uAdvection;
  float advShift = shift * polarFade;
  vec3 dShift = dir + east * (wind.x * advShift) + north * (wind.y * advShift);
  vec3 advDir = normalize(dShift);

  // Single FBM with FIXED octave weights — same noise function at every
  // pixel. No biome dependence here.
  const vec4 OCTAVE_W = vec4(0.40, 0.30, 0.20, 0.10);
  float n = cn_fbm_weighted(advDir * 8.0 + morph, OCTAVE_W);

  // Coverage threshold — globally uniform. Same Tweakpane control,
  // same value everywhere on the planet.
  float thresh = 1.0 - uCoverage;
  float baseSlab = smoothstep(thresh, 1.0, n);
  if (baseSlab <= 0.0) return 0.0;

  // Erosion: 3D Worley carves billows / chunkiness inside the slabs.
  float wd = cn_worley(advDir * 8.0 + vec3(3.7, 1.3, 5.1) + morph);
  float erosion = clamp(1.0 - wd, 0.0, 1.0);

  return baseSlab * (0.45 + 0.55 * erosion);
}

// Sample cloud density at world position \`p\`. Returns ~[0, 1] scaled by
// \`uDensity\` so a value of 1 means "fully opaque per unit-radius step."
//
// CRITICAL DESIGN RULE: the noise field — octave weights, wind rate,
// coverage threshold, sample positions — is GLOBALLY IDENTICAL at every
// pixel on the planet. Biome data does NOT enter any of those. It only
// multiplies the FINAL density at the end as an opacity scaler.
//
// Why: any per-pixel variation in the noise field's structure (different
// octave weights, different sampling positions, different threshold)
// makes adjacent pixels read different noise functions. Even with a
// heavy input blur on biome data, the noise itself becomes spatially
// incoherent and tears wherever the biome gradient is non-zero —
// visible as bright continent-outline ridges. End-of-pipeline
// multiplication keeps the cloud shapes coherent across the planet and
// only fades their visibility per region.
float cloudDensity(vec3 p, float coverMul) {
  float r = length(p);

  // Vertical fade — density peaks in the middle of the shell, tapers to
  // zero at top + bottom so the silhouette doesn't read as a hard cube.
  float h = (r - cloudInner()) / shellThick();
  if (h < 0.0 || h > 1.0) return 0.0;
  float vFade = smoothstep(0.0, 0.18, h) * smoothstep(1.0, 0.75, h);
  if (vFade <= 0.0) return 0.0;

  vec3 dir = p / r;

  // Wind advection — globally uniform rate. No biome multiplier here:
  // varying the rate per pixel would shift the noise sampling position
  // differently for adjacent pixels and tear the field at the boundary.
  // Real NCEP/NCAR sigma-995 surface wind already encodes terrain
  // response (continental friction, deflection around ranges, monsoon
  // shifts) so no procedural mountain-deflection workaround is needed.
  vec2 wind = sampleWindLatLon(dir);

  // Lat-tangent basis: east = unit eastward tangent ((-y, x, 0) normalised),
  // which is the limit of \`cross((0,0,1), dir) / cos(lat)\` everywhere away
  // from the pole. The previous \`abs(dir.z) < 0.99\` switch flipped the
  // basis vectors at ~81.9° latitude, producing a visible cloud-pattern
  // barrier in a circle around each pole. The fallback only triggers at
  // the actual pole now (where every direction is "south" anyway).
  vec3 east = vec3(-dir.y, dir.x, 0.0);
  float eastLen = length(east);
  east = (eastLen > 1e-3) ? east / eastLen : vec3(1.0, 0.0, 0.0);
  vec3 north = cross(dir, east);
  // Polar wind fade: within ~10° of either pole the lat-tangent basis
  // spins rapidly with longitude, so a fixed wind shift would sample
  // noise at radically different positions for adjacent fragments and
  // scramble the cloud pattern. \`eastLen\` = cos(lat), so fading shift
  // by smoothstep(0.05, 0.20, eastLen) kills wind inside ~3° of the
  // pole and recovers full wind by ~12° away. Real polar wind has no
  // well-defined direction anyway.
  float polarFade = smoothstep(0.05, 0.20, eastLen);

  // Morph drift. Stays bounded statistically (cn_fbm_weighted of any
  // input lives in roughly [-1, 1]), so it can keep using the
  // unbounded uTime directly.
  vec3 morph = MORPH_AXIS * (uTime * MORPH_RATE);

  // Two-phase wind crossfade — see WIND_PERIOD comment. Each phase's
  // wind shift wraps every WIND_PERIOD; phaseB lags phaseA by half a
  // cycle. Cosine weights sum to 1 always, so the wraparound moment
  // (when one phase's shift snaps from max back to zero) lands when
  // that phase's weight is exactly 0 → invisible discontinuity.
  float phaseA = mod(uTime, WIND_PERIOD);
  float phaseB = mod(uTime + WIND_PERIOD * 0.5, WIND_PERIOD);
  float wA = 0.5 - 0.5 * cos(6.2831853 * (phaseA / WIND_PERIOD));
  float wB = 0.5 - 0.5 * cos(6.2831853 * (phaseB / WIND_PERIOD));

  float dA = phaseDensity(dir, wind, east, north, polarFade, morph, phaseA);
  float dB = phaseDensity(dir, wind, east, north, polarFade, morph, phaseB);
  float density = dA * wA + dB * wB;

  // Biome-driven cover modifier — the ONLY place biome enters. Multiplies
  // the cloud's final opacity. Smooth \`coverMul\` → smooth visibility
  // gradient, even where the underlying biome class changes sharply
  // from one HEALPix cell to the next.
  return density * vFade * coverMul * uDensity;
}

float henyeyGreenstein(float cosTheta, float g) {
  float g2 = g * g;
  float denom = pow(max(0.0, 1.0 + g2 - 2.0 * g * cosTheta), 1.5);
  return (1.0 - g2) / max(denom, 1e-4) / (4.0 * PI);
}

// Per-cell biome → cover. One HEALPix lookup, returns a SCALAR cover
// multiplier in [0, 1] for THIS cell.
//
//   ocean (warm/cold)  → 1.0   (ITCZ + storm tracks fully cloudy)
//   forest / wetland   → 0.9   (humid convection, but slightly less than ocean)
//   moss / tundra      → 0.7
//   ice                → 0.5   (broad polar fronts, but thin)
//   default land       → smoothstep on moistureFrac (real precipitation cut)
//   desert             → 0.1   (Hadley descent, near-cloudless)
//
// Mountain boundary: cells above 2500 m elevation get their cover faded
// to zero (full suppression by 3000 m). High peaks act as a hard ceiling
// for cloud formation — visually creates clean cloud-free zones over
// alpine/Himalayan/Andean regions. The 19-tap blur softens the boundary
// further so the suppression doesn't read as a hard outline.
//
// Biome codes (from \`attrs.yaml\`, encoded into G channel × 255):
//   1=tree-cover  6=bare/desert  7=snow/ice  8=water (ocean)
//   9=wetland     10=mangroves   11=moss/tundra
//
// Returns a per-cell discrete value. Callers MUST blur (see
// \`sampleCoverMul\`) so that adjacent cells across a coastline don't
// stamp a hard step into the cloud's output opacity.
float coverAt(vec3 dir) {
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

  // Each \`is*\` flag (mutually exclusive) overrides the default land cover.
  float cover = landCover;
  cover = mix(cover, 0.10, isDesert);
  cover = mix(cover, 0.90, isForest);
  cover = mix(cover, 0.90, isWetland);
  cover = mix(cover, 0.50, isIce);
  cover = mix(cover, 0.70, isTundra);
  cover = mix(cover, 1.00, isOcean);

  // Mountain boundary: peaks above 2500 m suppress cloud formation,
  // fully cloud-free above 3000 m. The 500-m soft band keeps the edge
  // from looking stamped; the 19-tap blur outside softens it further.
  float mountainMask = 1.0 - smoothstep(2500.0, 3000.0, elevM);
  cover *= mountainMask;

  return cover;
}

// 19-tap hex blur of biome-driven cover. Centre + 6-tap inner ring (R) +
// 12-tap outer ring (2R). Inner R ≈ 0.012 rad ≈ 76 km (~6 HEALPix cells
// at nside=1024); kernel diameter ~300 km. Smooths per-cell biome
// transitions so coastlines and biome boundaries don't stamp hard steps
// into cloud opacity.
float sampleCoverMul(vec3 dir) {
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
  float cSum = coverAt(dir);

  for (int i = 0; i < 6; ++i) {
    float a = float(i) * 1.0471975512;  // π/3
    vec3 d = normalize(dir + east * (cos(a) * R) + north * (sin(a) * R));
    cSum += coverAt(d);
  }

  for (int i = 0; i < 12; ++i) {
    float a = float(i) * 0.5235987756;  // π/6
    vec3 d = normalize(dir + east * (cos(a) * 2.0 * R) + north * (sin(a) * 2.0 * R));
    cSum += coverAt(d);
  }

  return cSum * (1.0 / 19.0);
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

  // Surface-driven cover multiplier, sampled ONCE at the surface point
  // beneath the segment midpoint. Applies to every march step + every
  // light-march step in this fragment. 19-tap hex blur over biome cover.
  vec3 segMid = ro + dir * (0.5 * (t0 + t1));
  vec3 segDir = normalize(segMid);
  float coverMul = sampleCoverMul(segDir);

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
    float d = cloudDensity(p, coverMul);
    if (d > 0.001) {
      // Light march — a few exponentially-spaced samples toward the
      // sun. Cheap proxy for "how much sun reaches this voxel."
      float lightOptical = 0.0;
      float ls = thick * 0.05;
      vec3 lp = p;
      for (int j = 0; j < LIGHT_STEPS; ++j) {
        lp += sunDir * ls;
        lightOptical += cloudDensity(lp, coverMul) * ls;
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

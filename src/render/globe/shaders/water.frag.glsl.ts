// Inlined from water.frag.glsl. Edit the GLSL inside the template literal —
// the source of truth lives here, no separate .glsl file on disk.
export const source = `// Water fragment shader — paints the water shell over ocean cells.
//
// Lighting normal is built in three layers, all summed and re-normalized:
//   1. \`waterWaves()\` (water_waves.glsl) — the analytic perturbed normal
//      of a 4-Gerstner-wave swell. Same uniform field everywhere on the
//      globe; this is the big "ocean rises and falls" silhouette.
//   2. \`detailRippleNormal()\` fine layer — 3-octave value-noise gradient
//      at K=110. The shimmer that catches sun glint and makes water look
//      like water rather than displaced terrain.
//   3. \`detailRippleNormal()\` big layer — 2-octave value-noise gradient
//      at K=50, ramped in over deep water only, so open ocean reads
//      visibly different from coastal water.
//
// All three layers are attenuated by \`coastFade\` (a smoothstep over water
// depth = waterSurface - landElev), so coastlines stay calm and only the
// open ocean ripples at full strength.
//
// Per-fragment surface currents influence the ripple shimmer by warping
// the noise sample point (see \`uShimmerCurrentDrift\` below) — the noise
// in jet regions is sampled from a shifted patch of the field, so flow
// regions read visually distinct from calm seas. The warp is a one-shot
// static offset, NOT a time-multiplied scroll, so neighbouring fragments
// stay coherent over long runs.
//
// Depth tint is a 4-stop gradient (abyssal / deep / shelf / shallow)
// blended by exponential depth falloffs plus a coastal sediment cast.
// Specular cone is tight (pow 220) so the glint reads as crisp sparkles
// on the wave crests; Schlick Fresnel adds a sky-tinted rim at grazing
// angles, gated to the day side via the wrap term. Speed-based current
// tint (\`currentSpeedTint\`) overlays a subtle cool cast where flow speed
// exceeds the gate.
//
// No discard. The land mesh discards ocean cells, and where land elevation
// is taller than the water surface it draws front-most by depth test.

precision highp float;
precision highp int;

uniform vec3 uSunDirection;
uniform vec3 uSunColor;
uniform vec3 uNightTint;
uniform float uAmbient;

uniform sampler2D uIdRaster;
uniform sampler2D uElevationMeters;
uniform int uHealpixNside;
uniform int uHealpixOrdering;
uniform int uAttrTexWidth;
uniform float uElevationScale;

uniform vec3 uOceanAbyssal;
uniform vec3 uOceanDeep;
uniform vec3 uOceanShelf;
uniform vec3 uOceanShallow;
// Exponential depth-falloff scale (m) for the shallow stop only. Shelf
// uses a fixed 350 m falloff so the band stays at a realistic continental
// shelf scale; the shallow falloff is the most visible knob so it's the
// one we expose.
uniform float uDepthFalloff;
// Smoothstep band (m) over which \`uOceanAbyssal\` blends in for trenches.
// Below \`uOceanTrenchStart\` the colour is pure \`uOceanDeep\`; above
// \`uOceanTrenchEnd\` it's pure \`uOceanAbyssal\`. Earth's abyssal plain is
// 3–5 km and most major trenches are 6–11 km, so a 5000 → 9000 m gate
// keeps abyssal restricted to the deepest features.
uniform float uOceanTrenchStart;
uniform float uOceanTrenchEnd;

// Coastal sediment / chlorophyll tint. Real shallow water carries a
// greenish cast from algae and river runoff that pure-blue ramps can't
// produce. Mixed in over the 4-stop base after the shallow stop.
uniform vec3 uCoastalTintColor;
uniform float uCoastalTintStrength;
uniform float uCoastalTintFalloff;

uniform float uTime;
uniform float uWaveAmplitude;
uniform float uWaveSpeed;
uniform float uWaveSteepness;
uniform float uFresnelStrength;
// Per-fragment static offset to the ripple-noise sample point, scaled
// by the local current vector (m/s). Added ONCE inside
// \`detailRippleNormal\` — never multiplied by time — so the noise pattern
// in flow regions is shifted relative to calm seas without diverging
// neighbour-by-neighbour as time progresses. A larger value pushes the
// sample further off the calm-sea patch so jets read as a more
// distinct shimmer texture.
uniform float uShimmerCurrentDrift;

// Ocean current speed tint. Source data is RG16F equirectangular m/s
// (u = east, v = north); see \`uOceanCurrents\` and \`sampleCurrentLatLon\`
// below. \`uCurrentStrength\` is the master Tweakpane scale, the two
// boolean-as-float toggles gate which speed band shows up.
uniform sampler2D uOceanCurrents;
uniform float uCurrentStrength;
uniform float uCurrentTintEnabled;
uniform float uShowMediumCurrents;

// Aerial perspective — shared sky-view LUT with the atmosphere pass. See
// land.frag.glsl for the longer explanation; same uniforms, same lookup.
uniform sampler2D uSkyView;
uniform float uHazeExposure;
uniform float uHazeAmount;

in vec3 vSphereDir;
in float vWaterSurface;
in vec3 vWorldPos;

out vec4 fragColor;

// 3D value-noise helpers (Hugo Elias / Dave Hoskins style hash) used to
// build the high-frequency normal perturbation that gives water its
// shimmer. Inlined here so the chunk concatenation in WaterMaterial.ts
// stays small; only the fragment shader needs them.
float wn_hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

float wn_noise3(vec3 x) {
  vec3 p = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = wn_hash13(p);
  float n100 = wn_hash13(p + vec3(1.0, 0.0, 0.0));
  float n010 = wn_hash13(p + vec3(0.0, 1.0, 0.0));
  float n110 = wn_hash13(p + vec3(1.0, 1.0, 0.0));
  float n001 = wn_hash13(p + vec3(0.0, 0.0, 1.0));
  float n101 = wn_hash13(p + vec3(1.0, 0.0, 1.0));
  float n011 = wn_hash13(p + vec3(0.0, 1.0, 1.0));
  float n111 = wn_hash13(p + vec3(1.0, 1.0, 1.0));
  return mix(
    mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
    mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
    f.z
  );
}

float wn_fbm(vec3 p, int octaves) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < octaves; ++i) {
    v += a * wn_noise3(p);
    p = p * 2.03 + vec3(0.71, 0.13, 0.49);
    a *= 0.5;
  }
  return v;
}

// Sample the atmosphere's sky-view LUT in a world-space view direction.
// Mirrors the lookup in atmosphere.frag.glsl so the haze tint colour-matches
// the rim halo. \`dir\` is camera→surface; returns linear radiance (apply
// uHazeExposure at the call site).
vec3 sampleSkyViewHaze(vec3 dir, vec3 camPos, vec3 sunDir) {
  vec3 cUp = normalize(camPos);
  vec3 sunInPlane = sunDir - dot(sunDir, cUp) * cUp;
  float sunLen = length(sunInPlane);
  vec3 cAzRef = (sunLen > 1e-4)
    ? sunInPlane / sunLen
    : normalize(cross(cUp, vec3(1.0, 0.0, 0.0)));
  vec3 cTangent = cross(cUp, cAzRef);

  float zenith = acos(clamp(dot(dir, cUp), -1.0, 1.0));
  float az = atan(dot(dir, cTangent), dot(dir, cAzRef));
  if (az < 0.0) az += 6.28318530;

  float r0 = length(camPos);
  float s0 = clamp(1.0 / r0, 0.0, 1.0);
  float horizonZ = 3.14159265 - asin(s0);
  float vCoord;
  if (zenith < horizonZ) {
    float t = sqrt(max(0.0, 1.0 - zenith / horizonZ));
    vCoord = 0.5 - 0.5 * t;
  } else {
    float t = sqrt(clamp((zenith - horizonZ) / (3.14159265 - horizonZ), 0.0, 1.0));
    vCoord = 0.5 + 0.5 * t;
  }
  return texture(uSkyView, vec2(az / 6.28318530, vCoord)).rgb;
}

// Sample the ocean-current vector (m/s, lat-tangent frame: u east,
// v north) at a sphere direction. Equirect mapping mirrors the wind-
// field sampler in the cloud shader: u = (lon + π) / 2π, v = 0.5 - lat / π.
// Land cells store (0, 0) in the baked texture so callers can use
// \`length(c) > 0\` as an ocean gate.
vec2 sampleCurrentLatLon(vec3 dir) {
  const float PI_ = 3.14159265359;
  float lat = asin(clamp(dir.z, -1.0, 1.0));
  float lon = atan(dir.y, dir.x);
  vec2 uv = vec2((lon + PI_) / (2.0 * PI_), 0.5 - lat / PI_);
  return texture(uOceanCurrents, uv).rg;
}

// Lift a (east, north) m/s pair into a 3D tangent vector at \`dir\` on the
// unit sphere. Near the poles, fall back to a fixed east axis so the
// frame stays defined.
vec3 currentToWorld3D(vec3 dir, vec2 cur_en) {
  vec3 zUp = vec3(0.0, 0.0, 1.0);
  vec3 eastAxis = (abs(dir.z) > 0.999)
    ? vec3(1.0, 0.0, 0.0)
    : normalize(cross(zUp, dir));
  vec3 northAxis = cross(dir, eastAxis);
  return cur_en.x * eastAxis + cur_en.y * northAxis;
}

// Current-speed tint: a cool-blue additive cast scaled by local current
// speed, gated tightly so only fast flows light up. Static — no animated
// noise, no FBM blobs (those previously read as cloud-like patches over
// the ocean). The point is "where are the fast currents", not "how do
// they move"; directional motion is handled separately by the shimmer
// drift through the noise sample warp.
//
// Returns an RGB additive term; ready to scale by \`uCurrentStrength\`
// and the day-side \`wrap\` factor at the call site.
vec3 currentSpeedTint(vec3 dir, float coastFade, float wrap) {
  vec2 cur = sampleCurrentLatLon(dir);
  float speed = length(cur);
  if (speed < 0.02) return vec3(0.0);

  // Speed gate. OFF (default) = only major boundary jets (Gulf Stream,
  // Kuroshio, ACC) pass the smoothstep(0.65, 0.95) gate. ON expands to
  // include medium-speed currents via smoothstep(0.40, 0.80).
  float speedVis = mix(
    smoothstep(0.65, 0.95, speed),
    smoothstep(0.40, 0.80, speed),
    uShowMediumCurrents
  );

  vec3 tintColor = vec3(0.02, 0.05, 0.06);
  return tintColor * speedVis * coastFade * wrap * uCurrentTintEnabled;
}

// Tilt the outward normal by the gradient of an animated FBM, expressed
// in the sphere-tangent frame at \`dir\`. \`strength\` is the deviation in
// unit-radius units (small — typical 0.005–0.025). \`K\` is the base wave-
// number — larger K = smaller, finer ripples; smaller K = larger, slower-
// rolling ripples. \`driftAxis\` rotates the scroll direction so two layers
// don't lock into the same flow. \`staticOffset\` is added to the sample
// point once (NOT multiplied by t) — use it for per-fragment warping
// that must stay globally coherent over time (e.g. current-direction
// warp). 3 FBM lookups per call (one reference, two tangent finite-diff
// samples); each FBM is 3 octaves of value noise.
vec3 detailRippleNormal(vec3 dir, float t, float strength, float K, vec3 driftAxis, vec3 staticOffset, int octaves) {
  vec3 tup = abs(dir.z) < 0.99 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
  vec3 tx = normalize(cross(tup, dir));
  vec3 ty = cross(dir, tx);

  // eps in pre-K units; the gradient divides by eps so the result is
  // the spatial derivative of the noise field at this scale.
  float eps = 0.0008;
  // \`driftAxis * t\` is the time-scroll. If it varies per fragment, the
  // sample points of neighbouring fragments diverge linearly with time
  // and the surface dissolves into hash noise after a minute or two.
  // Callers therefore pass a globally-uniform \`driftAxis\` and put any
  // per-fragment variation into \`staticOffset\`, which is added once.
  vec3 drift = driftAxis * t + staticOffset;

  float n0 = wn_fbm(dir * K + drift, octaves);
  float nx = wn_fbm((dir + tx * eps) * K + drift, octaves);
  float ny = wn_fbm((dir + ty * eps) * K + drift, octaves);

  vec2 grad = vec2(nx - n0, ny - n0) / eps;
  return normalize(dir - (tx * grad.x + ty * grad.y) * strength);
}

void main() {
  int ipx = healpixZPhiToPix(uHealpixNside, uHealpixOrdering, vSphereDir.z, atan(vSphereDir.y, vSphereDir.x));
  ivec2 tx = healpixIpixToTexel(ipx, uAttrTexWidth);
  float landElev = texelFetch(uElevationMeters, tx, 0).r;

  // Layered ocean gradient. \`uOceanDeep\` is the open-ocean baseline that
  // most of the world ocean reads as. Shelf + shallow blend up via exp
  // falloffs as depth drops toward the coast; abyssal blends in via a
  // smoothstep gate restricted to trench-grade depths so it doesn't
  // smother the typical 3-4 km abyssal-plain depth.
  float depth = max(vWaterSurface - landElev, 0.0);
  float wShelf   = exp(-depth /  350.0);
  float wShallow = exp(-depth / uDepthFalloff);
  vec3 base = uOceanDeep;
  base = mix(base, uOceanShelf,   wShelf);
  base = mix(base, uOceanShallow, wShallow);
  float trenchT = smoothstep(uOceanTrenchStart, uOceanTrenchEnd, depth);
  base = mix(base, uOceanAbyssal, trenchT);

  // Coastal sediment / chlorophyll cast — green-teal tint over the
  // shallowest band only. River deltas (Amazon, Ganges, Mississippi)
  // and shallow seas pick this up; mid-depth shelves stay pure blue.
  float coastalT = exp(-depth / uCoastalTintFalloff);
  base = mix(base, uCoastalTintColor, coastalT * uCoastalTintStrength);

  // Coast fade: same formula as the vertex shader so swell + glint
  // attenuate together. 0 m depth → 0, 400 m depth → full.
  float coastFade = smoothstep(0.0, 400.0, depth);
  float ampAtt = uWaveAmplitude * coastFade;

  // Depth-varying Fresnel: shallow/coast water reflects the sky more
  // strongly than open ocean. 0.3 at coast → 0.1 in deep water.
  // \`uFresnelStrength\` (Tweakpane) scales the result on top.
  float fresnelMix = mix(0.3, 0.1, coastFade);

  // Sample local current for a static (non-accumulating) warp of the
  // ripple-noise sample point. The current vector is added once as a
  // \`staticOffset\` to detailRippleNormal — NOT multiplied by time —
  // so neighbouring fragments stay coherent over long runs. Visually:
  // jets read as a distinct shimmer pattern from calm seas (the noise
  // is sampled from a shifted patch), but the texture itself doesn't
  // dissolve into per-fragment hash noise as time progresses.
  vec2 curEN = sampleCurrentLatLon(vSphereDir);
  vec3 curVec3D = currentToWorld3D(vSphereDir, curEN);
  vec3 shimmerOffset = curVec3D * uShimmerCurrentDrift;

  // Layer 1: low-frequency Gerstner swell — analytic perturbed normal.
  float waveRadialM_;
  vec3 waveTangent_;
  vec3 waveNormal;
  waterWaves(
    vSphereDir,
    uTime * uWaveSpeed,
    ampAtt,
    uWaveSteepness,
    uElevationScale,
    waveRadialM_,
    waveTangent_,
    waveNormal
  );

  // Layer 2: medium ripple shimmer — features sized between the old
  // "tiny" K=180 and the deep-only "big rolling" K=50. K=110 lands
  // ~halfway, with strength bumped (0.020) so the effective tilt stays
  // visually similar to the old fine layer despite the lower K.
  // Strength is gently faded near coast (40 % at shore → 100 % at
  // deep) so shore ripples are calmer than open ocean without going
  // fully static — the animation still reaches the coast.
  float fineRippleFade = mix(0.15, 1.0, coastFade);
  vec3 detailFine = detailRippleNormal(
    vSphereDir,
    uTime * uWaveSpeed,
    0.020 * fineRippleFade,
    110.0,
    vec3(0.31, 0.17, -0.23),
    shimmerOffset,
    3
  );

  // Layer 3: bigger rolling ripples — larger features (low K), stronger
  // tilt. \`coastFade * coastFade\` ramps in only over deep water, so the
  // shore look stays clean and the open ocean gets visibly different
  // texture (broader, slower-moving patterns) than the shore. Reduced
  // to 2 octaves: this layer is already big features, so the smallest
  // sub-detail isn't doing visible work — saves ~1/6 of total ripple
  // cost without affecting the look.
  float bigRippleMix = coastFade * coastFade;
  vec3 detailBig = detailRippleNormal(
    vSphereDir,
    uTime * uWaveSpeed,
    0.028 * bigRippleMix,
    50.0,
    vec3(-0.19, 0.27, 0.41),
    shimmerOffset * 0.8,
    2
  );

  // Combine: each normal is \`vSphereDir + tangent_offset\`. Summing the
  // three normals and subtracting (n-1)·vSphereDir gives a re-normalizable
  // vector whose tangent component is the sum of the three perturbations.
  vec3 n = normalize(waveNormal + detailFine + detailBig - 2.0 * vSphereDir);

  vec3 sunDir = normalize(uSunDirection);
  vec3 viewDir = normalize(cameraPosition - vWorldPos);

  // Wrap-lambert day/night blend matching Land + the previous water look.
  float ndotl = dot(n, sunDir);
  float wrap = smoothstep(-0.2, 0.6, ndotl);
  vec3 day = base * uAmbient + base * uSunColor * max(ndotl, 0.0);
  vec3 night = base * uNightTint;
  vec3 col = mix(night, day, wrap);

  // Specular sun glint — tight cone (pow 220) so the highlight reads as
  // sparkles on individual ripples rather than a wide hot patch. Gated to
  // the day side. The 2.0× multiplier keeps the peak bright after
  // tightening.
  vec3 halfDir = normalize(sunDir + viewDir);
  float spec = pow(max(dot(n, halfDir), 0.0), 220.0);
  float sunMask = smoothstep(0.0, 0.15, ndotl);
  col += vec3(1.0, 0.97, 0.85) * spec * fresnelMix * uFresnelStrength * 2.0 * sunMask;

  // Schlick Fresnel sky tint — adds a brighter rim at grazing angles on
  // the day side. Cheap proxy for "ocean reflects the sky."
  float fresnel = pow(1.0 - max(dot(n, viewDir), 0.0), 5.0);
  vec3 skyTint = vec3(0.55, 0.70, 0.95);
  col += skyTint * fresnel * fresnelMix * uFresnelStrength * 0.25 * wrap;

  // Current-speed tint — additive cool cast, day-side only, faded toward
  // shore so the literal coastline stays clean. Master \`uCurrentStrength\`
  // scales the result; Tweakpane drops it to 0 to disable.
  if (uCurrentStrength > 0.0) {
    col += currentSpeedTint(vSphereDir, coastFade, wrap) * uCurrentStrength;
  }

  // ----- Aerial perspective (haze) -----
  // Same as land.frag.glsl: tint toward the inscattered sky-view LUT
  // colour, with strength tied to the halo's 1 - exp(-lum * 6) curve so
  // the two effects agree at the silhouette.
  if (uHazeAmount > 0.0) {
    vec3 hazeColor = sampleSkyViewHaze(-viewDir, cameraPosition, sunDir) * uHazeExposure;
    float lum = dot(hazeColor, vec3(0.2126, 0.7152, 0.0722));
    float hazeStrength = clamp((1.0 - exp(-lum * 6.0)) * uHazeAmount, 0.0, 0.95);
    col = mix(col, hazeColor, hazeStrength);
  }

  fragColor = vec4(col, 1.0);
}
`;

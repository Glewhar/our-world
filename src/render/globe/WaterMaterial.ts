/**
 * Water material — owns the water icosphere's shader pair.
 *
 * Drives a separate water icosphere whose vertices are displaced to
 * sea level (`uSeaLevelOffsetM`) plus a Gerstner-wave term. Fragment
 * shader paints the ocean depth tint (computed from
 * `uSeaLevelOffsetM - landElev`) and does NOT discard — the land mesh
 * draws front-most by depth test wherever land sticks above water.
 *
 * `uElevationScale` MUST match `LandMaterial`'s value — otherwise the
 * land terrain and water surface drift out of vertical sync.
 *
 * `_waterUniforms` is exposed (non-enumerable) so Tweakpane bindings and
 * the scene graph can poke uniforms by name without re-reaching into
 * `material.uniforms`.
 */

import * as THREE from 'three';

import { source as healpixGlsl } from './shaders/healpix.glsl.js';

import { DEFAULT_ELEVATION_SCALE } from './LandMaterial.js';
import { DEFAULTS } from '../../debug/defaults.js';

const WATER_WAVES = `// Shared Gerstner-wave helper for the water mesh. Imported by
// water.vert.glsl (for displacement) and water.frag.glsl (for the
// analytic perturbed normal that drives Fresnel + glint).
//
// Each wave is a 3D sinusoid \`A_i * sin(K_i · dir - ω_i * t)\` evaluated on
// the un-displaced unit-sphere direction. Summing 4 waves with mismatched
// directions and frequencies gives a non-repeating, stylized swell.
//
// The "Gerstner" steepness term pinches crests by adding a tangential
// displacement proportional to cos(phase) along the wave direction.
// Steepness 0 = pure sum-of-sines (rounded), 1 = sharp peaks. Q is clamped
// to [0,1] so waves never invert.
//
// Output \`normal\` is the analytic outward normal of the displaced surface
// at \`dir\`: \`normalize(dir - elevScale · ∇_sphere h)\`, where ∇_sphere is
// the sphere-tangent component of the 3D height gradient. The fragment
// shader uses this directly (no normal map, no varying interpolation).

#define WATER_NUM_WAVES 4

void waterWaves(
  in vec3 dir,
  in float t,
  in float amplitudeM,
  in float steepness,
  in float elevScale,
  out float radialM,
  out vec3 tangent,
  out vec3 normal
) {
  // Wave 3D wave-vectors. Magnitudes ~22–25 → wavelengths ~0.25–0.28 of
  // unit radius (~1700 km on a 6371 km Earth — ocean-swell scale).
  vec3 K[WATER_NUM_WAVES];
  K[0] = vec3( 19.0,  11.0,   5.0);
  K[1] = vec3(-13.0,  17.0,   7.0);
  K[2] = vec3( 23.0,  -9.0,  -3.0);
  K[3] = vec3(  7.0,  13.0,  19.0);

  // Per-wave amplitude weights (sum = 2.3, normalized below) and angular
  // frequencies. Spread over a ~2× range so the swell never resyncs.
  float ampW[WATER_NUM_WAVES];
  ampW[0] = 1.00;
  ampW[1] = 0.60;
  ampW[2] = 0.40;
  ampW[3] = 0.30;
  float ampSum = 2.30;

  float omega[WATER_NUM_WAVES];
  omega[0] = 0.55;
  omega[1] = 0.80;
  omega[2] = 1.05;
  omega[3] = 0.40;

  float Q = clamp(steepness, 0.0, 1.0);

  radialM = 0.0;
  tangent = vec3(0.0);
  vec3 dh = vec3(0.0); // 3D gradient of height (m / unit-radius).

  for (int i = 0; i < WATER_NUM_WAVES; ++i) {
    vec3 Ki = K[i];
    float kLen = max(length(Ki), 1e-4);
    vec3 T = Ki - dot(Ki, dir) * dir; // sphere-tangent component of K.
    float phase = dot(dir, Ki) - omega[i] * t;
    float a = amplitudeM * ampW[i] / ampSum;
    float s = sin(phase);
    float c = cos(phase);
    radialM += a * s;
    // Gerstner horizontal pinch: small tangential offset along K_tangent.
    // Convert from metres to unit-radius via elevScale, normalize by k so
    // the offset stays bounded.
    tangent += Q * a * elevScale * (T / kLen) * c;
    // Gradient of \`a * sin(K · dir - ω t)\` w.r.t. position dir = a * cos * K.
    dh += a * c * Ki;
  }

  vec3 dhUnit = dh * elevScale; // metres → unit-radius units.
  vec3 dhTan = dhUnit - dot(dhUnit, dir) * dir; // sphere-tangent gradient.
  normal = normalize(dir - dhTan);
}
`;

const WATER_VERT = `// Water vertex shader — displaces every vertex to (sea-level +
// Gerstner-wave) elevation. The base water surface is a single
// global value, \`uSeaLevelOffsetM\` (metres). The wave term is
// computed by \`waterWaves()\` (water_waves.glsl), summing 4 sinusoids
// on the un-displaced direction so phase is stable across frames at
// any zoom.
//
// \`vSphereDir\` carries the un-displaced direction so the fragment shader
// can re-look-up its HEALPix cell + recompute the analytic wave normal
// without drift from the displaced position. \`vWaterSurface\` carries the
// metres value the fragment shader uses for depth tint.
// \`vWorldPos\` carries the actual displaced world position for view-vector
// lookups (Fresnel + sun glint).

precision highp float;
precision highp int;
precision highp sampler2D;

uniform float uElevationScale;
uniform float uSeaLevelOffsetM;

uniform float uTime;
uniform float uWaveAmplitude;
uniform float uWaveSpeed;
uniform float uWaveSteepness;

out vec3 vSphereDir;
out float vWaterSurface;
out vec3 vWorldPos;

void main() {
  vec3 dir = normalize(position);
  vSphereDir = dir;

  float waterSurface = uSeaLevelOffsetM;
  vWaterSurface = waterSurface;

  float waveRadialM;
  vec3 waveTangent;
  vec3 waveNormal_;
  waterWaves(
    dir,
    uTime * uWaveSpeed,
    uWaveAmplitude,
    uWaveSteepness,
    uElevationScale,
    waveRadialM,
    waveTangent,
    waveNormal_
  );

  float displace = (waterSurface + waveRadialM) * uElevationScale;
  vec3 surfaceObj = dir * (1.0 + displace) + waveTangent;
  vec4 wp = modelMatrix * vec4(surfaceObj, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const WATER_FRAG = `// Water fragment shader — paints the water shell over ocean cells.
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
// The two ripple layers are attenuated by \`depthFade\` (a smoothstep
// over water depth = waterSurface - landElev), so the fine-detail
// shimmer fades toward shore while the Gerstner swell itself runs at
// full amplitude everywhere on the water surface.
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
// No discard. Land elevation taller than the water surface draws
// front-most by depth test; everywhere else the water shell paints.

precision highp float;
precision highp int;

uniform vec3 uSunDirection;
uniform vec3 uSunColor;
uniform vec3 uNightTint;
uniform float uAmbient;
uniform vec3 uMoonColor;
uniform float uMoonIntensity;

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
uniform vec3 uCurrentTintColor;
uniform vec3 uSunGlintColor;
uniform vec3 uSkyTintColor;

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
// the rim halo. \`dir\` must be camera→undisplaced-sphere-point — see
// LandMaterial's matching helper for the LUT-horizon discontinuity that
// makes the undisplaced anchor necessary. Returns linear radiance (apply
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

  return uCurrentTintColor * speedVis * coastFade * wrap * uCurrentTintEnabled;
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

  // No discard. Depth test handles every case: land taller than the
  // water surface (continents, exposed seafloor when slider drops) wins
  // via its outward vertex displacement; elsewhere water paints.

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

  // Depth-varying Fresnel: shallow/coast water reflects the sky more
  // strongly than open ocean. 0.3 at coast → 0.1 in deep water.
  // \`uFresnelStrength\` (Tweakpane) scales the result on top.
  float depthFade = smoothstep(0.0, 400.0, depth);
  float fresnelMix = mix(0.3, 0.1, depthFade);

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
    uWaveAmplitude,
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
  float fineRippleFade = mix(0.15, 1.0, depthFade);
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
  float bigRippleMix = depthFade * depthFade;
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
  // Night-side ocean stays near-black (real ocean has no diffuse
  // reflection of moonlight to speak of; what you see is the specular
  // glint patch a few lines down). uNightTint provides the deep-night
  // ambient floor; the moon-glint specular below paints the bright spot.
  vec3 night = base * uNightTint;
  vec3 col = mix(night, day, wrap);

  // Specular sun glint — tight cone (pow 220) so the highlight reads as
  // sparkles on individual ripples rather than a wide hot patch. Gated to
  // the day side. The 2.0× multiplier keeps the peak bright after
  // tightening.
  vec3 halfDir = normalize(sunDir + viewDir);
  float spec = pow(max(dot(n, halfDir), 0.0), 220.0);
  float sunMask = smoothstep(0.0, 0.15, ndotl);
  col += uSunGlintColor * spec * fresnelMix * uFresnelStrength * 2.0 * sunMask;

  // Antipodal-moon specular — the "path of moonlight" on night-side
  // ocean. Wider cone (pow 64) than the sun glint so the highlight
  // reads as a soft cyan patch rather than pixel-sized sparkles, since
  // moonlight is dimmer and observers perceive it as a glow not glint.
  // Gated to the night side via smoothstep(0, -0.15, ndotl).
  vec3 moonHalf = normalize(-sunDir + viewDir);
  float moonSpec = pow(max(dot(n, moonHalf), 0.0), 64.0);
  float moonMask = smoothstep(0.0, -0.15, ndotl);
  col += uMoonColor * moonSpec * fresnelMix * uFresnelStrength * 0.6 * moonMask * uMoonIntensity;

  // Schlick Fresnel sky tint — adds a brighter rim at grazing angles on
  // the day side. Cheap proxy for "ocean reflects the sky."
  float fresnel = pow(1.0 - max(dot(n, viewDir), 0.0), 5.0);
  col += uSkyTintColor * fresnel * fresnelMix * uFresnelStrength * 0.25 * wrap;

  // Current-speed tint — additive cool cast, day-side only, faded toward
  // shore so the literal coastline stays clean. Master \`uCurrentStrength\`
  // scales the result; Tweakpane drops it to 0 to disable.
  if (uCurrentStrength > 0.0) {
    col += currentSpeedTint(vSphereDir, depthFade, wrap) * uCurrentStrength;
  }

  // ----- Aerial perspective (haze) -----
  // Same as land.frag.glsl: tint toward the inscattered sky-view LUT
  // colour, with strength tied to the halo's 1 - exp(-lum * 6) curve so
  // the two effects agree at the silhouette. Lookup direction uses
  // \`vSphereDir\` (undisplaced) — see \`sampleSkyViewHaze\` for why.
  if (uHazeAmount > 0.0) {
    vec3 hazeDir = normalize(vSphereDir - cameraPosition);
    vec3 hazeColor = sampleSkyViewHaze(hazeDir, cameraPosition, sunDir) * uHazeExposure;
    float lum = dot(hazeColor, vec3(0.2126, 0.7152, 0.0722));
    float hazeStrength = clamp((1.0 - exp(-lum * 6.0)) * uHazeAmount, 0.0, 0.95);
    col = mix(col, hazeColor, hazeStrength);
  }

  fragColor = vec4(col, 1.0);
}
`;

export type WaterUniforms = {
  uSunDirection: { value: THREE.Vector3 };
  uSunColor: { value: THREE.Vector3 };
  uNightTint: { value: THREE.Color };
  uAmbient: { value: number };
  uMoonColor: { value: THREE.Color };
  uMoonIntensity: { value: number };

  uElevationMeters: { value: THREE.DataTexture | null };

  uHealpixNside: { value: number };
  uHealpixOrdering: { value: number };
  uAttrTexWidth: { value: number };

  /** Unit-sphere displacement per metre of real elevation. MUST match LandMaterial. */
  uElevationScale: { value: number };
  /**
   * Global metres-valued sea level used as the water-surface height in the
   * vertex shader. Tweakpane-driven "sea level" slider — raises (or, with
   * negative values, lowers) the entire ocean surface uniformly. Every
   * depth-driven tint band in the fragment shader re-derives from
   * `vWaterSurface - landElev` and follows automatically.
   */
  uSeaLevelOffsetM: { value: number };

  uOceanAbyssal: { value: THREE.Color };
  uOceanDeep: { value: THREE.Color };
  uOceanShelf: { value: THREE.Color };
  uOceanShallow: { value: THREE.Color };
  /** Trench gate start depth (m). Below this, no abyssal mixed in. */
  uOceanTrenchStart: { value: number };
  /** Trench gate end depth (m). Above this, fully abyssal. */
  uOceanTrenchEnd: { value: number };
  /** Coastal sediment / chlorophyll cast — mixed over the shallowest band. */
  uCoastalTintColor: { value: THREE.Color };
  /** 0 disables the tint; 0.25 is the default subtle cast; 1 saturates. */
  uCoastalTintStrength: { value: number };
  /** Exponential falloff scale (m) for the coastal tint. 80 m by default. */
  uCoastalTintFalloff: { value: number };
  /** Exponential depth-falloff scale (m). depthT = exp(-depth / k).
   * Smaller = sharper/narrower shelves, larger = softer/wider shelves. */
  uDepthFalloff: { value: number };

  // M-water — Gerstner waves. `uTime` is driven by the scene-graph update
  // loop; the rest are exposed in Tweakpane (Materials → Ocean).
  uTime: { value: number };
  uWaveAmplitude: { value: number };
  uWaveSpeed: { value: number };
  uWaveSteepness: { value: number };
  uFresnelStrength: { value: number };
  /** Scale on the per-fragment static offset added to the ripple-noise
   * sample point. The offset is `current_m/s × this`, added ONCE (not
   * multiplied by time), so jet regions read as a shifted shimmer
   * texture vs. calm seas while staying coherent over long runs.
   * 0 = no current influence; default ≈ 17 = clearly distinct jet
   * texture; high values push jets onto an unrelated noise patch. */
  uShimmerCurrentDrift: { value: number };

  // Surface ocean current speed tint — additive cast where currents are
  // fast enough. `uOceanCurrents` is the RG16F equirectangular m/s
  // texture (null until the bake ships real bytes). `uCurrentStrength`
  // is the Tweakpane intensity slider; 0 disables, 1 is the default.
  uOceanCurrents: { value: THREE.DataTexture | null };
  uCurrentStrength: { value: number };
  /** Master on/off for the current-speed colour tint (0 = hidden, 1 = visible). */
  uCurrentTintEnabled: { value: number };
  /** When 0, only the major boundary jets (Gulf Stream / Kuroshio / ACC)
   * pass the speed gate. When 1, the gate is lowered so medium-speed
   * currents also show up in the tint. */
  uShowMediumCurrents: { value: number };
  /** Additive cool cast painted onto ocean cells with fast surface currents. */
  uCurrentTintColor: { value: THREE.Color };
  /** Sun-glint specular highlight colour on water (warm-white). */
  uSunGlintColor: { value: THREE.Color };
  /** Schlick Fresnel sky-reflection tint at grazing angles (day side). */
  uSkyTintColor: { value: THREE.Color };

  /**
   * Sky-view LUT shared with the atmosphere pass — see `LandUniforms.uSkyView`.
   * Same texture handle; both surface shaders tint toward the rim haze
   * the atmosphere already paints in the sky around the planet.
   */
  uSkyView: { value: THREE.Texture | null };

  /** Exposure multiplier on the LUT sample. Should track atmosphere exposure. */
  uHazeExposure: { value: number };

  /** Aerial-perspective haze strength. 0 disables; ~0.25 is the design default. */
  uHazeAmount: { value: number };
};

// All ocean tuning lives in [../../debug/defaults.ts] under
// `DEFAULTS.materials.ocean`. The uniform initial values below pull from
// that table so the first frame matches what Tweakpane is about to
// push in via `scene-graph.applyMaterials`.

export function createWaterMaterial(): THREE.ShaderMaterial & {
  _waterUniforms: WaterUniforms;
} {
  const o = DEFAULTS.materials.ocean;
  const g = DEFAULTS.materials.globe;
  const a = DEFAULTS.materials.atmosphere;
  const uniforms: WaterUniforms = {
    // Lighting uniforms are placeholders only — `scene-graph.applyTimeOfDay`
    // and `applyMaterials` overwrite them every frame. See LandMaterial.
    uSunDirection: { value: new THREE.Vector3(1, 0, 0.3).normalize() },
    uSunColor: { value: new THREE.Vector3(1, 1, 1) },
    uNightTint: { value: new THREE.Color(g.nightTint).multiplyScalar(0.35) },
    uAmbient: { value: g.ambient },
    uMoonColor: { value: new THREE.Color(g.moonColor) },
    uMoonIntensity: { value: g.moonIntensity },

    uElevationMeters: { value: null },

    uHealpixNside: { value: 1 },
    uHealpixOrdering: { value: 0 },
    uAttrTexWidth: { value: 1 },

    uElevationScale: { value: DEFAULT_ELEVATION_SCALE },
    uSeaLevelOffsetM: { value: o.seaLevelOffsetM },

    uOceanAbyssal: { value: new THREE.Color(o.abyssalColor) },
    uOceanDeep: { value: new THREE.Color(o.deepColor) },
    uOceanShelf: { value: new THREE.Color(o.shelfColor) },
    uOceanShallow: { value: new THREE.Color(o.shallowColor) },
    uOceanTrenchStart: { value: o.trenchStart },
    uOceanTrenchEnd: { value: o.trenchEnd },
    uCoastalTintColor: { value: new THREE.Color(o.coastalTintColor) },
    uCoastalTintStrength: { value: o.coastalTintStrength },
    uCoastalTintFalloff: { value: o.coastalTintFalloff },
    uDepthFalloff: { value: o.depthFalloff },

    uTime: { value: 0 },
    uWaveAmplitude: { value: o.waveAmplitude },
    uWaveSpeed: { value: o.waveSpeed },
    uWaveSteepness: { value: o.waveSteepness },
    uFresnelStrength: { value: o.fresnelStrength },
    uShimmerCurrentDrift: { value: o.shimmerCurrentDrift },
    uOceanCurrents: { value: null },
    uCurrentStrength: { value: o.currentStrength },
    uCurrentTintEnabled: { value: o.currentTintEnabled ? 1 : 0 },
    uShowMediumCurrents: { value: o.showMediumCurrents ? 1 : 0 },
    uCurrentTintColor: { value: new THREE.Color(o.currentTintColor) },
    uSunGlintColor: { value: new THREE.Color(o.sunGlintColor) },
    uSkyTintColor: { value: new THREE.Color(o.skyTintColor) },

    uSkyView: { value: null },
    uHazeExposure: { value: a.exposure },
    uHazeAmount: { value: a.hazeAmount },
  };

  const vertexShader = `${healpixGlsl}\n${WATER_WAVES}\n${WATER_VERT}`;
  const fragmentShader = `${healpixGlsl}\n${WATER_WAVES}\n${WATER_FRAG}`;

  const material = new THREE.ShaderMaterial({
    uniforms,
    glslVersion: THREE.GLSL3,
    vertexShader,
    fragmentShader,
  });
  Object.defineProperty(material, '_waterUniforms', {
    value: uniforms,
    enumerable: false,
  });
  return material as THREE.ShaderMaterial & { _waterUniforms: WaterUniforms };
}

// Inlined from water.frag.glsl. Edit the GLSL inside the template literal —
// the source of truth lives here, no separate .glsl file on disk.
export const source = `// Water fragment shader — paints the water shell over ocean cells.
//
// Lighting normal is built in three layers:
//   1. The un-displaced sphere direction \`vSphereDir\` is the base.
//   2. \`waterWaves()\` (water_waves.glsl) adds a 4-Gerstner-wave swell —
//      the big "ocean rises and falls" silhouette you see at orbital zoom.
//   3. \`detailRippleNormal()\` adds a 3-octave value-noise gradient — the
//      fine shimmer that catches sun glint at every scale and is what
//      makes water look like water rather than displaced terrain.
//
// Both wave layers are attenuated by \`coastFade\` (a smoothstep over water
// depth = waterSurface - landElev), so coastlines stay calm and only the
// open ocean ripples at full strength.
//
// Depth tint mixes \`uOceanDeep\` → \`uOceanShallow\` over the first ~4 km of
// water. Specular cone is tight (pow 220) so the glint reads as crisp
// sparkles on the wave crests; Schlick Fresnel adds a sky-tinted rim at
// grazing angles, gated to the day side via the wrap term.
//
// No discard. The land mesh discards ocean cells, and where land elevation
// is taller than the water surface it draws front-most by depth test.

precision highp float;
precision highp int;

uniform vec3 uSunDirection;
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

// Ocean current visualisation. RG16F equirectangular m/s (u east, v north).
// Land cells store (0, 0) so length() gates rendering. Strength is the
// Tweakpane intensity; 0 hides the overlay, 1 is the default subtle look.
uniform sampler2D uOceanCurrents;
uniform float uCurrentStrength;
uniform float uStreamlinesEnabled;
uniform float uStrongJetsOnly;

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

// Sample the ocean-current vector (m/s, lat-tangent frame: u east, v north)
// at a sphere direction. Equirect mapping mirrors the wind field sampler
// in the cloud shader: u = (lon + π) / 2π, v = 0.5 - lat / π. Land cells
// return (0, 0) so callers can use \`length(c) > 0\` as an ocean gate.
vec2 sampleCurrentLatLon(vec3 dir) {
  const float PI_ = 3.14159265359;
  float lat = asin(clamp(dir.z, -1.0, 1.0));
  float lon = atan(dir.y, dir.x);
  vec2 uv = vec2((lon + PI_) / (2.0 * PI_), 0.5 - lat / PI_);
  return texture(uOceanCurrents, uv).rg;
}

// Streamline overlay: computes a low-contrast brightness-add at the
// current fragment, animated to flow along the local current direction.
// Cheap LIC-flavoured technique:
//   - sample 3D FBM at a position drifted FORWARD along the current by
//     accumulated time (so the noise pattern moves WITH the flow);
//   - shape it into narrow ridges via a smoothstep on the noise value;
//   - gate by speed (kills noise in calm interiors and on land where
//     current is exactly 0) and by \`coastFade\` (so the literal
//     coastline stays clean).
//
// Returns an RGB additive term; ready to scale by \`uCurrentStrength\`
// and the day-side \`wrap\` factor at the call site.
vec3 streamlineOverlay(vec3 dir, float coastFade, float wrap) {
  vec2 cur = sampleCurrentLatLon(dir);
  float speed = length(cur);
  if (speed < 0.02) return vec3(0.0);

  // Speed gate: gentle (most surface currents) vs strong-jets-only
  // (Gulf Stream / Kuroshio / ACC). Toggle in Tweakpane.
  float speedVis = mix(
    smoothstep(0.65, 0.95, speed),
    smoothstep(0.40, 0.80, speed),
    uStrongJetsOnly
  );

  // Speed heatmap: cool-blue tint scaled by speed. Doesn't show direction
  // but makes "where currents are" unambiguous — Gulf Stream / Kuroshio /
  // ACC pop as bright bands rather than fluffy patches.
  vec3 tintColor = vec3(0.02, 0.05, 0.06);
  return tintColor * speedVis * coastFade * wrap * uStreamlinesEnabled;
}

// Tilt the outward normal by the gradient of an animated FBM, expressed
// in the sphere-tangent frame at \`dir\`. \`strength\` is the deviation in
// unit-radius units (small — typical 0.005–0.025). \`K\` is the base wave-
// number — larger K = smaller, finer ripples; smaller K = larger, slower-
// rolling ripples. \`driftAxis\` rotates the scroll direction so two layers
// don't lock into the same flow. 3 FBM lookups per call (one reference,
// two tangent finite-diff samples); each FBM is 3 octaves of value noise.
vec3 detailRippleNormal(vec3 dir, float t, float strength, float K, vec3 driftAxis, int octaves) {
  vec3 tup = abs(dir.z) < 0.99 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
  vec3 tx = normalize(cross(tup, dir));
  vec3 ty = cross(dir, tx);

  // eps in pre-K units; the gradient divides by eps so the result is
  // the spatial derivative of the noise field at this scale.
  float eps = 0.0008;
  vec3 drift = driftAxis * t;

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
  vec3 day = base * (uAmbient + (1.0 - uAmbient) * max(ndotl, 0.0));
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

  // Surface current streamline overlay — additive, day-side only, faded
  // toward shore so the literal coastline stays clean. The overlay is
  // gated on \`uCurrentStrength\`; Tweakpane drops it to 0 to disable.
  if (uCurrentStrength > 0.0) {
    col += streamlineOverlay(vSphereDir, coastFade, wrap) * uCurrentStrength;
  }

  // ----- Aerial perspective (haze) -----
  // Same as land.frag.glsl: tint toward the inscattered sky colour by an
  // air-thickness factor that grows as the view ray slants. Reuses
  // \`viewDir\` already computed for the specular highlight above.
  if (uHazeAmount > 0.0) {
    vec3 outwardNormal = normalize(vWorldPos);
    float cosToCamera = max(dot(viewDir, outwardNormal), 0.0);
    float airThickness = 1.0 / max(cosToCamera, 0.1);
    float hazeStrength = clamp((airThickness - 1.0) * uHazeAmount, 0.0, 0.85);
    vec3 hazeColor = sampleSkyViewHaze(-viewDir, cameraPosition, sunDir) * uHazeExposure;
    col = mix(col, hazeColor, hazeStrength);
  }

  fragColor = vec4(col, 1.0);
}
`;

/**
 * Land material — owns the land icosphere's shader pair.
 *
 * Vertex shader displaces by raw signed elevation (seafloor dips inward,
 * mountains poke out). Fragment shader discards cells whose current
 * elevation sits below `uSeaLevelOffsetM` so the water mesh covers them
 * cleanly; lowering the slider exposes shelves, raising it drowns coast.
 *
 * Ocean colour uniforms (`uOceanDeep`/`uOceanShallow`) live on
 * `WaterMaterial`. Everything else mirrors the old `GlobeUniforms`.
 *
 * `_landUniforms` is exposed (non-enumerable) so Tweakpane bindings and the
 * scene graph can poke uniforms by name without re-reaching into
 * `material.uniforms`.
 */

import * as THREE from 'three';

import { source as healpixGlsl } from './shaders/healpix.glsl.js';

import { DEFAULTS } from '../../debug/defaults.js';

const LAND_VERT = `// Land vertex shader — displaces dry-land vertices outward by their
// continuous-elevation value from the R16F \`uElevationMeters\` texture.
//
// Two refinements vs the naive single-cell read:
//   1. Smoothing — 9-tap blur (centre + 8 sphere-neighbours arranged in
//      a circle) at ~3 HEALPix cells radius. Kills cell-to-cell elevation
//      jumps that show up as pointy triangles at high mesh density.
//   2. Coast fade — single bilinear sample of the distance field's R
//      channel (signed km to coast). Replaces the old 8-neighbour ocean
//      count (which produced quantized 0/0.25/0.5/.../1.0 fades, visible
//      as cell-stepped tapering near coasts) with a continuous taper
//      based on real distance.
//
// \`vSphereDir\` carries the pre-displacement direction so the fragment
// shader's HEALPix lookups stay anchored to the original cell, not the
// displaced position.

precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D uElevationMeters;
uniform sampler2D uDistanceField;
uniform int uHealpixNside;
uniform int uHealpixOrdering;
uniform int uAttrTexWidth;
uniform float uElevationScale;     // unit-sphere displacement per metre
uniform float uSeaLevelOffsetM;    // sea-level slider; matches WaterMaterial

out vec3 vWorldPos;
out vec3 vSphereDir;

ivec2 cellTexel(vec3 d) {
  int ipix = healpixZPhiToPix(uHealpixNside, uHealpixOrdering, d.z, atan(d.y, d.x));
  return healpixIpixToTexel(ipix, uAttrTexWidth);
}

void main() {
  vec3 dir = normalize(position);
  vSphereDir = dir;

  // Tangent basis. \`up\` picks any axis not parallel to dir.
  vec3 up = abs(dir.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 t1 = normalize(cross(up, dir));
  vec3 t2 = cross(dir, t1);

  // ~3 HEALPix cells (cell ~1e-3 rad at nside=1024). Wide enough that the
  // 8-neighbour ring straddles surrounding cells and the blur actually
  // averages distinct elevation values.
  const float eps = 3.0e-3;
  const float diag = 0.7071;  // 1/sqrt(2) — keeps diagonals at the same arc-length as cardinals

  vec3 d0 = dir;
  vec3 d1 = normalize(dir + t1 * eps);
  vec3 d2 = normalize(dir - t1 * eps);
  vec3 d3 = normalize(dir + t2 * eps);
  vec3 d4 = normalize(dir - t2 * eps);
  vec3 d5 = normalize(dir + (t1 + t2) * eps * diag);
  vec3 d6 = normalize(dir + (t1 - t2) * eps * diag);
  vec3 d7 = normalize(dir - (t1 - t2) * eps * diag);
  vec3 d8 = normalize(dir - (t1 + t2) * eps * diag);

  ivec2 tx0 = cellTexel(d0);
  ivec2 tx1 = cellTexel(d1);
  ivec2 tx2 = cellTexel(d2);
  ivec2 tx3 = cellTexel(d3);
  ivec2 tx4 = cellTexel(d4);
  ivec2 tx5 = cellTexel(d5);
  ivec2 tx6 = cellTexel(d6);
  ivec2 tx7 = cellTexel(d7);
  ivec2 tx8 = cellTexel(d8);

  float elev = (
    texelFetch(uElevationMeters, tx0, 0).r +
    texelFetch(uElevationMeters, tx1, 0).r +
    texelFetch(uElevationMeters, tx2, 0).r +
    texelFetch(uElevationMeters, tx3, 0).r +
    texelFetch(uElevationMeters, tx4, 0).r +
    texelFetch(uElevationMeters, tx5, 0).r +
    texelFetch(uElevationMeters, tx6, 0).r +
    texelFetch(uElevationMeters, tx7, 0).r +
    texelFetch(uElevationMeters, tx8, 0).r
  ) / 9.0;

  // Raw elevation everywhere: mountains poke out, seafloor sits at its
  // real depth, coast meets at whatever the data says. No taper.
  float displace = elev * uElevationScale;
  vec3 displaced = dir * (1.0 + displace);

  vec4 wp = modelMatrix * vec4(displaced, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const LAND_FRAG = `// Land fragment shader — climate-driven biome shading on the icosphere.
// Fully opaque everywhere; the water mesh draws on top of submerged
// cells so the ocean depth tint covers the land's seafloor paint.
//
// Pipeline (each step composes on top of the previous):
//   1. Distance field sample  — single bilinear lookup of the equirect
//                               \`uDistanceField\` (RG16F): R = signed km
//                               to coast (positive on land), G = km to
//                               nearest biome boundary.
//   2. Biome lookup           — centre HEALPix cell still drives the
//                               biome ID; the colour is faded toward
//                               a neutral landfall tone within
//                               uBiomeEdgeSharpness km of any biome
//                               border, so vivid colours stay only in
//                               biome interiors.
//   3. Biome surface variation — per-biome procedural noise (color +
//                               fake-bump). Master gate
//                               \`uBiomeSurfaceStrength\` zero = pre-
//                               feature look, no cost. Per-biome amps
//                               in \`uBiomeSurfaceAmps[12]\`.
//   4. Alpine thinning        — biome colour blends toward bare-rock
//                               grey-tan as elevation rises 1.5 → 4 km.
//   5. Cold/hot tints + snow line — same as before.
//   6. Dynamic recolour       — fire / ice / infection / pollution.
//   7. Wrap-Lambert lighting  — Sobel-tilted normal + fake-bump from
//                               step 3 so noise patterns catch the
//                               sun, day/night wrap.
//
// \`vColor\` is intentionally unused — a per-body tint LUT is a follow-up.

precision highp float;
precision highp int;
precision highp sampler2D;

uniform vec3 uSunDirection;
uniform vec3 uSunColor;
uniform vec3 uNightTint;
uniform float uAmbient;
uniform vec3 uMoonColor;
uniform float uMoonIntensity;

uniform sampler2D uAttrStatic;
uniform sampler2D uAttrClimate;
uniform sampler2D uAttrDynamic;
uniform sampler2D uElevationMeters;
uniform sampler2D uElevationEquirect;
uniform sampler2D uDistanceField;
uniform sampler2D uBiomeColor;
uniform int uHealpixNside;
uniform int uHealpixOrdering;
uniform int uAttrTexWidth;
uniform float uElevationScale;
uniform float uSeaLevelOffsetM;

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

// Distance (km) over which biome colour is blended toward neutral at
// boundaries. 0 = hard categorical edges; ~10 = clean clean-fade.
uniform float uBiomeEdgeSharpness;

// Biome surface variation knobs.
uniform float uBiomeSurfaceStrength;   // master gate; 0 = no cost, no effect
uniform float uBiomeColorVar;          // 0..1 colour modulation
uniform float uBiomeBumpStrength;      // 0..1 fake-bump from noise gradient
uniform float uBiomeNoiseFreq;         // ~12 sphere units = moderate detail
uniform float uBiomeSurfaceAmps[12];   // per-biome amplitude (indexed by biome ID)

// Per-biome specular smoothness (0..1). 0 = pure Lambert (matte); higher
// values produce a moving Blinn-Phong highlight that tracks the camera.
// Snow/ice and wet biomes typically need real shine; deserts stay flat.
uniform float uBiomeSpecAmps[12];
// Master multiplier on top of the per-biome amps; 0 disables all spec.
uniform float uSpecularStrength;

// Biome palette — indexed by biome ID 0..11. Authored in defaults.ts.
uniform vec3 uBiomePalette[12];

// Elevation / climate-driven tints (authored in defaults.ts).
uniform vec3 uAlpineBareColor;
uniform vec3 uColdToneColor;
uniform vec3 uHotDryColor;

// Two-tone specular tint (warm for non-snow, cool for snow); the shader
// lerps between them by the snow-line mix.
uniform vec3 uSpecularTintWarm;
uniform vec3 uSpecularTintCool;

// Moonlight reflectance — biome desaturates toward this neutral grey
// under antipodal moonlight before being tinted by uMoonColor.
uniform vec3 uMoonReflectanceBase;

// Aerial perspective. uSkyView is the same sky-view LUT the atmosphere
// halo samples — sampled here in the direction camera→undisplaced-sphere-
// point so distant terrain tints toward the same inscattered colour that
// paints the rim halo. Sun-position dependent (the LUT rebakes on sun/
// camera change), so haze warms at sunrise/sunset without any extra
// plumbing. See the haze block in main() for why the direction must
// ignore vertex displacement.
uniform sampler2D uSkyView;
uniform float uHazeExposure;
uniform float uHazeAmount;
uniform float uHazeFalloffM;

// Wasteland tint — scenario-driven dynamic attribute (R8 texture, one
// byte per HEALPix cell). Cells with w>0 lerp from the biome colour
// toward a desaturated wasteland tone, then toward uWastelandColor.
// Strength=0 short-circuits the entire branch.
uniform sampler2D uWastelandTex;
uniform float uWastelandStrength;
uniform vec3 uWastelandColor;
uniform float uWastelandDesaturate;

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
  int c = clamp(code, 0, 11);
  return uBiomePalette[c];
}

// \`sphereDirToEquirectUv(dir)\` comes from healpix.glsl (concatenated
// ahead of this source). wrapS=Repeat on the sampled equirect textures
// handles fragments that round to slightly outside [0,1].

// Compact 3D value-noise for the biome surface variation. Same hash as
// the cloud shader's \`cn_hash13\` so samples are deterministic per
// integer cell.
float landNoiseHash(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

float landValueNoise3(vec3 x) {
  vec3 p = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = landNoiseHash(p);
  float n100 = landNoiseHash(p + vec3(1.0, 0.0, 0.0));
  float n010 = landNoiseHash(p + vec3(0.0, 1.0, 0.0));
  float n110 = landNoiseHash(p + vec3(1.0, 1.0, 0.0));
  float n001 = landNoiseHash(p + vec3(0.0, 0.0, 1.0));
  float n101 = landNoiseHash(p + vec3(1.0, 0.0, 1.0));
  float n011 = landNoiseHash(p + vec3(0.0, 1.0, 1.0));
  float n111 = landNoiseHash(p + vec3(1.0, 1.0, 1.0));
  return mix(
    mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
    mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
    f.z
  );
}

// 2-octave FBM in [0, ~0.75]; remap to [-1, 1] at the call site.
float landFbm2(vec3 p) {
  float v = 0.5 * landValueNoise3(p);
  v += 0.25 * landValueNoise3(p * 2.03 + vec3(0.71, 0.13, 0.49));
  return v;
}

// Sample the atmosphere's sky-view LUT in a world-space view direction.
// Mirrors the lookup in atmosphere.frag.glsl so the colour matches the
// rim halo exactly. \`dir\` must be camera→undisplaced-sphere-point: the
// LUT has a sharp value step at vCoord = 0.5 and a direction derived
// from a displaced peak straddles that step, painting a circular outline
// around peaks at the limb. Returns linear radiance — apply uHazeExposure
// at the call site.
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

  // Planet radius is 1.0 in unit-sphere units (matches PLANET_RADIUS in
  // the atmosphere shaders). Camera distance > 1, so s0 < 1.
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

void main() {
  // Tangent basis matching the vertex shader.
  vec3 dir = normalize(vSphereDir);
  vec3 nUp = abs(dir.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 t1 = normalize(cross(nUp, dir));
  vec3 t2 = cross(dir, t1);

  // ----- Normal: 4-tap bilinear central-difference Sobel on equirect -----
  // Hardware bilinear filtering on the equirect resample gives a continuous
  // gradient with no cell-aligned banding, while still varying per pixel
  // (which a per-vertex normal cannot — fragments inside one HEALPix cell
  // would all read the same neighbourhood). U pitch at 4096-wide is
  // ~9.8 km/px at the equator, slightly finer than the ~6.4 km HEALPix
  // cell pitch at Nside=1024. The texture is 4096×2048, so one V texel
  // in UV is 1/2048 — same angular pitch (π/2048 rad) as one U texel
  // (2π/4096 rad). Each tap is floored at the current water surface
  // (\`uSeaLevelOffsetM\`) so still-submerged neighbours don't read as
  // inland cliffs at the active shoreline, while bathymetry the slider
  // has exposed contributes its real gradient — same relief shading as
  // land.
  const float kEpsU = 1.0 / 4096.0;
  const float kEpsV = 1.0 / 2048.0;
  vec2 nUv = sphereDirToEquirectUv(dir);
  float eE = max(texture(uElevationEquirect, nUv + vec2( kEpsU, 0.0)).r, uSeaLevelOffsetM);
  float eW = max(texture(uElevationEquirect, nUv + vec2(-kEpsU, 0.0)).r, uSeaLevelOffsetM);
  // +v points south (north pole at v=0), so eN uses -kEpsV and eS uses +kEpsV.
  float eN = max(texture(uElevationEquirect, nUv + vec2(0.0, -kEpsV)).r, uSeaLevelOffsetM);
  float eS = max(texture(uElevationEquirect, nUv + vec2(0.0,  kEpsV)).r, uSeaLevelOffsetM);
  float Gx = eE - eW;
  float Gy = eN - eS;
  // Two-texel arc length in radians, identical for U (2 × 2π/4096) and V
  // (2 × π/2048). Divides metres-per-radian into a unit-sphere slope
  // after the uElevationScale conversion.
  const float kArc = 6.28318530 / 2048.0;
  float slopeT1 = clamp(Gx * uElevationScale / kArc, -0.6, 0.6);
  float slopeT2 = clamp(Gy * uElevationScale / kArc, -0.6, 0.6);
  vec3 n = normalize(dir - slopeT1 * t1 - slopeT2 * t2);

  // Use the *pre-displacement* direction for HEALPix lookups so the cell
  // we sample matches the cell that produced the displacement at this
  // vertex — not the cell the displaced position happens to fall on.
  int ipx = healpixZPhiToPix(uHealpixNside, uHealpixOrdering, vSphereDir.z, atan(vSphereDir.y, vSphereDir.x));
  ivec2 tx = healpixIpixToTexel(ipx, uAttrTexWidth);

  // ----- Distance field: one bilinear sample, two channels -----
  //   df.r = signed km to coast (positive on land, negative in water)
  //   df.g = km to nearest biome boundary
  // wrapS=Repeat handles the antimeridian seam; wrapT=ClampToEdge handles
  // the poles. Sub-cell precision drives the smoothstep below.
  vec2 dfUv = sphereDirToEquirectUv(dir);
  vec2 df = texture(uDistanceField, dfUv).rg;

  // Submerged-cell discard: a cell renders iff its current elevation
  // sits at or above the sea-level slider. Slider lowered → seafloor
  // cells whose depth is shallower than the new sea level become
  // exposed; slider raised → low coast drowns. Single rule, no static
  // coast mask, sub-cell precision from the bilinear equirect resample.
  float elevHere = texture(uElevationEquirect, dfUv).r;
  if (elevHere < uSeaLevelOffsetM) discard;

  // Centre biome ID still comes from HEALPix attribute_static.G.
  vec4 staticTexel = texelFetch(uAttrStatic, tx, 0);
  int biomeC = int(staticTexel.g * 255.0 + 0.5);
  biomeC = clamp(biomeC, 0, 11);

  vec3 base = biomePalette(biomeC);

  // ----- Biome edge blend -----
  // Sample the prebaked biome COLOR map at a mipmap level chosen from
  // the slider. The mip chain is built once at startup; each LOD doubles
  // the effective blur radius in km. LOD 0 is ~20 km/pixel, so
  // LOD = log2(sharpness / 20) puts the slider value directly in the
  // blur-radius driver. One sample per fragment, all the work was paid
  // upfront at prebake time.
  if (uBiomeEdgeSharpness > 0.0) {
    float lod = max(0.0, log2(uBiomeEdgeSharpness / 20.0));
    // Prebake stores premultiplied RGBA: water cells are vec4(0). Bilinear/
    // mipmap filtering near a coast returns alpha < 1 for fragments whose
    // neighbourhood includes water pixels. Unpremultiply to recover the
    // land-only colour, and weight the blend by alpha so water-side
    // coverage drops the prebake influence to zero rather than bleeding
    // a teal/blue fringe into land.
    vec4 nbSample = textureLod(uBiomeColor, dfUv, lod);
    if (nbSample.a > 0.001) {
      vec3 nbColor = nbSample.rgb / nbSample.a;
      float blendT = (1.0 - smoothstep(0.0, uBiomeEdgeSharpness, max(df.g, 0.0))) * nbSample.a;
      base = mix(base, nbColor, blendT);
    }
  }
  base *= clamp(uBiomeStrength, 0.0, 1.0);

  // ----- Biome surface variation (gated) -----
  // Master = 0 → identical to pre-feature look. Per-biome amp scales the
  // effect on this biome only. Two extra noise taps along tangent +
  // bitangent build a finite-difference gradient that perturbs the
  // surface normal so the pattern catches the sun in step (8).
  if (uBiomeSurfaceStrength > 0.0) {
    float amp = uBiomeSurfaceAmps[biomeC];
    if (amp > 0.0) {
      float scale = uBiomeNoiseFreq;
      vec3 p = dir * scale;
      // Centre noise sample, remapped to [-1, 1].
      float n0 = landFbm2(p) * 2.0 - 0.75;
      // Color modulation: multiplicative ±~30% around 1.0.
      float colorMix = clamp(uBiomeColorVar * amp * uBiomeSurfaceStrength, 0.0, 1.0);
      base = mix(base, base * (0.85 + 0.30 * (n0 * 0.5 + 0.5)), colorMix);
      // Fake-bump: take two nearby taps and build a gradient in the
      // tangent plane. Step is small enough that it samples the same
      // octave detail the colour modulation reads.
      float bumpEps = 1.5 / max(scale, 1.0);
      float nE2 = landFbm2(p + t1 * bumpEps * scale) * 2.0 - 0.75;
      float nN2 = landFbm2(p + t2 * bumpEps * scale) * 2.0 - 0.75;
      vec2 grad = vec2(nE2 - n0, nN2 - n0);
      float bumpAmt = uBiomeBumpStrength * amp * uBiomeSurfaceStrength;
      n = normalize(n - bumpAmt * (grad.x * t1 + grad.y * t2));
    }
  }

  // Continuous elevation in metres at the centre cell (same texture the
  // vertex shader displaces from). Used for alpine thinning.
  float elevM = max(texelFetch(uElevationMeters, tx, 0).r, 0.0);

  // ----- Alpine thinning -----
  // Smoothly fade the biome colour toward bare-rock grey-tan as elevation
  // rises. Below ~1500 m: untouched. Above ~4000 m: ~70% rock. The blend
  // is \`smoothstep\` so there are no hard altitude lines.
  float altThin = smoothstep(1500.0, 4000.0, elevM);
  base = mix(base, uAlpineBareColor, altThin * clamp(uAlpineStrength, 0.0, 1.0));

  // ----- Effective temperature (with season slider) -----
  // Baked WorldClim annual mean + uSeasonOffsetC. Drives both the
  // hot/cold colour tint below and the dynamic snow line. One value
  // means one slider rolls the whole globe between summer and winter.
  float temperatureC = texelFetch(uAttrClimate, tx, 0).r;
  float effTempC = temperatureC + uSeasonOffsetC;

  // ----- Cold tint -----
  // Below ~18 °C the biome desaturates toward a muted grey-tan in the
  // same family as the alpine-bare colour. Cold deserts (Patagonia,
  // Gobi, Tibet, Atacama) share the same "bare" biome code as hot
  // deserts, so without a strong tint here they paint identical to
  // the Sahara. Pale-blue "frost" reads wrong on dry rocky desert —
  // dusty grey-tan reads right.
  float coldBlend = smoothstep(22.0, -2.0, effTempC);
  base = mix(base, uColdToneColor, coldBlend * 0.95);

  // ----- Hot tint -----
  // Above ~22 °C a slight tan/dry tint creeps in (sun-baked vegetation,
  // dry grass). Capped at 25% blend.
  float hotBlend = smoothstep(22.0, 36.0, effTempC);
  base = mix(base, uHotDryColor, hotBlend * 0.25);

  // ----- Snow line -----
  // Driven directly by effective temperature.
  float snowMix = uSnowLineStrength * (1.0 - smoothstep(-10.0, -1.0, effTempC));
  base = mix(base, uColorIce, clamp(snowMix, 0.0, 1.0));

  // ----- Dynamic recolour -----
  vec4 dyn = clamp(texelFetch(uAttrDynamic, tx, 0) * uLerpStrength,
                   vec4(0.0), vec4(1.0));
  base = mix(base, uColorFire, dyn.r);
  base = mix(base, uColorIce, dyn.g);
  base = mix(base, uColorInfection, dyn.b);
  base = mix(base, uColorPollution, dyn.a);

  // ----- Wasteland tint -----
  // Single-channel R8 attribute sampled at the centre cell. Composite as
  // (1) desaturate biome toward grey, (2) lerp toward uWastelandColor.
  // Specular contribution is also flattened on heavily-wasted cells so
  // the surface reads dead instead of glossy. The master strength gates
  // the whole branch; specCarry is the multiplier the spec contribution
  // gets later in the shader.
  float specCarry = 1.0;
  if (uWastelandStrength > 0.0) {
    float wRaw = texelFetch(uWastelandTex, tx, 0).r;
    float w = clamp(wRaw * uWastelandStrength, 0.0, 1.0);
    if (w > 0.0) {
      float luma = dot(base, vec3(0.2126, 0.7152, 0.0722));
      vec3 desat = mix(base, vec3(luma), clamp(uWastelandDesaturate, 0.0, 1.0));
      vec3 wasted = mix(desat, uWastelandColor, w);
      base = mix(base, wasted, w);
      // Flatten specular by up to 80% at full wasteland.
      specCarry = 1.0 - 0.8 * w;
    }
  }

  // Wrap-lambert day/night with a wider band. The Sobel-tilted normal
  // can dip well below 0 on lee-side slopes; the [-0.6, 0.8] range
  // gives a softer falloff so shadowed slopes stay legible.
  vec3 sunDir = normalize(uSunDirection);
  float ndotl = dot(n, sunDir);
  float wrap = smoothstep(-0.6, 0.8, ndotl);

  // Per-biome specular. Pure Lambert reads "frozen" as the camera orbits;
  // a wide Blinn-Phong cone tracking with the camera gives the globe
  // motion-life. Snow & wet biomes get real shine; deserts stay flat.
  // \`frostBonus\` adds extra shine to anything cold enough to ice over;
  // \`snowMix\` overrides any tepid biome smoothness on the snow line.
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  vec3 halfDir = normalize(sunDir + viewDir);
  float biomeSmooth = uBiomeSpecAmps[biomeC];
  float frostBonus  = smoothstep(5.0, -10.0, effTempC) * 0.15;
  float smoothness  = max(biomeSmooth + frostBonus, snowMix * 0.6);
  float spec = pow(max(dot(n, halfDir), 0.0), 24.0);
  float sunMask = smoothstep(0.0, 0.15, ndotl);
  vec3 specTint = mix(uSpecularTintWarm, uSpecularTintCool, snowMix);
  vec3 specContrib = specTint * spec * smoothness * sunMask * uSpecularStrength * specCarry;

  // \`specContrib\` already carries its own tint via \`specTint\` (cool on
  // snow, warm-neutral elsewhere). Multiplying by \`uSunColor\` here would
  // double-tint and warm-shift snow's highlight into gold; add it raw.
  vec3 day = base * uAmbient + base * uSunColor * max(ndotl, 0.0) + specContrib;
  // Antipodal-moon lambert. moonDir = -sunDir, so max(-ndotl, 0) is the
  // moon's n.L (positive only on the night hemisphere). uNightTint stays
  // as a deep-night biome ambient floor; moonlight rides on top.
  //
  // The reflectance under moonlight is biome base desaturated toward a
  // neutral grey (mix factor 0.25 = 75% neutral) so continents read as a
  // mostly uniform cool wash with only subtle biome character — matches
  // the cinematic "blue moonlit Earth" look. Set the mix factor to 1.0
  // to revert to fully biome-tinted moonlight.
  float moonDotL = max(-ndotl, 0.0);
  vec3 moonReflectance = mix(uMoonReflectanceBase, base, 0.25);
  vec3 moonGlow = moonReflectance * uMoonColor * moonDotL * uMoonIntensity;
  vec3 night = base * uNightTint + moonGlow;

  vec3 finalColor = mix(night, day, wrap);

  // ----- Aerial perspective (haze) -----
  // Tint toward the inscattered sky-view LUT colour. Strength uses the
  // same 1 - exp(-lum * 6) falloff that drives the atmosphere halo's
  // alpha (see atmosphere.frag.glsl), so surface haze and rim halo share
  // one source of truth and can't disagree at the silhouette. The lookup
  // direction uses \`vSphereDir\` (undisplaced) rather than \`vWorldPos\`
  // (displaced) — see \`sampleSkyViewHaze\` for why. \`elevM\` is in scope
  // from the elevation-texture read above (also used by alpine thinning);
  // \`uHazeFalloffM\` lets peaks lose haze with altitude so the jagged
  // mountain silhouette doesn't wash flat into the sphere outline.
  if (uHazeAmount > 0.0) {
    vec3 hazeDir = normalize(vSphereDir - cameraPosition);
    vec3 hazeColor = sampleSkyViewHaze(hazeDir, cameraPosition, sunDir) * uHazeExposure;
    float lum = dot(hazeColor, vec3(0.2126, 0.7152, 0.0722));
    float elevAtten = exp(-elevM / max(uHazeFalloffM, 1.0));
    float hazeStrength = clamp((1.0 - exp(-lum * 6.0)) * uHazeAmount * elevAtten, 0.0, 0.95);
    finalColor = mix(finalColor, hazeColor, hazeStrength);
  }

  fragColor = vec4(finalColor, 1.0);
}
`;

export type LandUniforms = {
  uSunDirection: { value: THREE.Vector3 };
  uSunColor: { value: THREE.Vector3 };
  uNightTint: { value: THREE.Color };
  uAmbient: { value: number };
  uMoonColor: { value: THREE.Color };
  uMoonIntensity: { value: number };

  uAttrStatic: { value: THREE.DataTexture | null };
  uAttrClimate: { value: THREE.DataTexture | null };
  uAttrDynamic: { value: THREE.DataTexture | null };
  uElevationMeters: { value: THREE.DataTexture | null };
  /**
   * Equirectangular R16F resample of `uElevationMeters`, baked once at
   * startup on the GPU. Sampled bilinearly by the fragment shader's
   * normal Sobel — gives a continuous per-pixel gradient instead of
   * the cell-aligned banding produced by `texelFetch` on the HEALPix
   * texture.
   */
  uElevationEquirect: { value: THREE.Texture | null };
  /**
   * Equirectangular RG16F distance field. R = signed km to coast
   * (positive on land); G = km to nearest biome boundary. Bilinear
   * filtering is what gives the shader sub-cell precision; null until
   * the bake ships, in which case the shader treats every pixel as
   * "deep land, far from any boundary".
   */
  uDistanceField: { value: THREE.DataTexture | null };
  /**
   * Equirectangular RGB biome COLOR map, baked once at startup from the
   * HEALPix biome IDs through the same palette the fragment shader uses
   * for the centre lookup. Sampled bilinearly to give smooth biome→biome
   * blends without requiring an extra disk artifact. Null falls back to
   * the centre HEALPix lookup unblended.
   */
  uBiomeColor: { value: THREE.Texture | null };

  uHealpixNside: { value: number };
  uHealpixOrdering: { value: number };
  uAttrTexWidth: { value: number };

  /** Unit-sphere displacement per metre of real elevation. */
  uElevationScale: { value: number };

  /**
   * Sea-level slider in metres, mirrored from the water material. Fragment
   * shader discards cells whose elevation sits below this value, so the
   * water mesh covers them; lowering the slider exposes seafloor.
   */
  uSeaLevelOffsetM: { value: number };

  uColorFire: { value: THREE.Color };
  uColorIce: { value: THREE.Color };
  uColorInfection: { value: THREE.Color };
  uColorPollution: { value: THREE.Color };
  uLerpStrength: { value: THREE.Vector4 };

  uBiomeStrength: { value: number };
  uSnowLineStrength: { value: number };

  /**
   * Global temperature offset in °C added to every cell's baked annual-mean
   * temperature. 0 = baseline; negative = winter; positive = summer. Drives
   * the dynamic snow line + the hot/cold biome tints.
   */
  uSeasonOffsetC: { value: number };

  /**
   * Alpine thinning strength: 0 leaves biome colours untouched at altitude;
   * 1 fully blends to bare-rock grey-tan above ~4 km.
   */
  uAlpineStrength: { value: number };

  /**
   * Distance (km) over which the biome colour is interpolated toward a
   * neutral landfall tone at biome boundaries. 0 = no fade (hard
   * categorical edges); 50 = ~50 km of smooth blending.
   */
  uBiomeEdgeSharpness: { value: number };

  /**
   * Master gate for the per-biome procedural surface variation. 0 = the
   * shader skips the noise path entirely (zero-cost off); 1 = full
   * effect. Per-biome amps + the color/bump knobs scale within this.
   */
  uBiomeSurfaceStrength: { value: number };

  /** Color modulation strength of the biome noise (0..1). */
  uBiomeColorVar: { value: number };

  /** Fake-bump strength of the biome noise gradient (0..1). */
  uBiomeBumpStrength: { value: number };

  /**
   * Spatial frequency of the biome surface noise in unit-sphere
   * coordinates. ~12 gives detail at the moderate-zoom scale; bump up
   * for finer texture, down for broader patches.
   */
  uBiomeNoiseFreq: { value: number };

  /**
   * Per-biome-class amplitude (0..2) for the surface variation. Indexed
   * by biome ID 0..11. A 0 here suppresses variation on that biome only
   * (e.g. set [9] = 0 to keep ice clean while deserts get strong sand
   * patterns).
   */
  uBiomeSurfaceAmps: { value: Float32Array };

  /**
   * Per-biome-class specular smoothness (0..1) for the Blinn-Phong
   * highlight. 0 = pure Lambert; ~0.5 = strongly shiny. Snow & wet
   * biomes typically want real shine; deserts stay matte.
   */
  uBiomeSpecAmps: { value: Float32Array };

  /**
   * Master multiplier on the per-biome specular contribution. 0 disables
   * the highlight entirely; 1 is the design default; >1 overdrives.
   */
  uSpecularStrength: { value: number };

  /** Biome palette (12 entries) — see DEFAULTS.materials.globe.biomePalette. */
  uBiomePalette: { value: THREE.Vector3[] };

  /** Bare rock at high altitude. */
  uAlpineBareColor: { value: THREE.Color };
  /** Cold-climate desaturation target. */
  uColdToneColor: { value: THREE.Color };
  /** Hot/dry sun-baked tint target. */
  uHotDryColor: { value: THREE.Color };
  /** Specular highlight tint for non-snow (warm). */
  uSpecularTintWarm: { value: THREE.Color };
  /** Specular highlight tint for snow (cool). */
  uSpecularTintCool: { value: THREE.Color };
  /** Neutral grey biome desaturates toward under moonlight. */
  uMoonReflectanceBase: { value: THREE.Color };

  /**
   * Sky-view LUT shared with the atmosphere pass. Sampled per-fragment in
   * the direction camera→undisplaced-sphere-point to tint distant terrain
   * toward the same inscattered sky colour the rim halo shows — aerial
   * perspective without a postFX raymarch. Null until plumbed.
   */
  uSkyView: { value: THREE.Texture | null };

  /**
   * Exposure multiplier applied to the LUT sample before mixing. Should
   * track the atmosphere pass's exposure so haze colour matches the halo.
   */
  uHazeExposure: { value: number };

  /**
   * Aerial-perspective strength. 0 disables the tint; ~0.25 gives a clean
   * blue limb without crushing disc-centre colour.
   */
  uHazeAmount: { value: number };
  /**
   * Aerial-perspective falloff distance in metres. Larger values keep the
   * haze tint visible from farther away; smaller values clamp it close
   * to the limb. The land shader samples this when blending the
   * sky-view LUT into the lit surface.
   */
  uHazeFalloffM: { value: number };

  /**
   * R8 wasteland attribute texture (one byte per HEALPix cell, value =
   * byte / 255). Driven by the ScenarioRegistry on the main thread, NOT
   * by the sim worker. Cells outside any active scenario stay at 0.
   */
  uWastelandTex: { value: THREE.DataTexture | null };

  /**
   * Master strength multiplier on the wasteland tint. 0 disables it
   * completely (zero shader cost in the early-out branch). Default 1.
   */
  uWastelandStrength: { value: number };

  /**
   * Destination colour the biome blends toward at full wasteland (1.0).
   * Default `#5a4d40` — warm gray-brown that reads as scorched earth at
   * orbital zoom.
   */
  uWastelandColor: { value: THREE.Color };

  /**
   * How much the biome colour desaturates toward gray BEFORE the wasteland
   * colour tint is applied. 0 leaves biome saturation intact; 1 fully
   * desaturates to gray then tints. 0.6 is the design default.
   */
  uWastelandDesaturate: { value: number };
};

/**
 * The renderer's altitude exaggeration is a single scalar `factor × BASE`
 * applied uniformly to every metres-based altitude in the project (terrain,
 * water level, clouds, cities, plane bow arcs, atmosphere shell).
 *
 * The Tweakpane "Altitude" slider exposes `factor ∈ [1, 10]`; everything
 * else is derived from it. `factor = 5` is the project baseline so the
 * slider feels symmetric (1× compresses toward physical scale, 10× doubles
 * the current exaggeration). At baseline, Mt. Everest renders at ~14% of
 * unit-radius — readable at orbital zoom without crossing into spike
 * territory.
 *
 * `DEFAULT_ELEVATION_SCALE` MUST match `WaterMaterial`'s value so the land
 * surface and water surface stay in vertical sync; the per-frame slider
 * push in the scene graph keeps both in sync at runtime.
 */
export const BASELINE_ALTITUDE_FACTOR = 5;
export const ELEVATION_SCALE_PER_FACTOR = 2.4e-6;
export const DEFAULT_ELEVATION_SCALE = BASELINE_ALTITUDE_FACTOR * ELEVATION_SCALE_PER_FACTOR;

/**
 * Atmosphere top in km above sea level. Drives the outer shell radius via
 * `atmosphereRadiusFromFactor` — the shell scales with the altitude factor
 * so the integration domain follows the exaggeration. At factor=5 this
 * gives outer ≈ 1.48. Halo-vs-terrain occlusion is handled by the depth
 * test in `AtmospherePass`, not by this radius.
 */
export const ATMOSPHERE_TOP_KM = 40;

export function elevationScaleFromFactor(factor: number): number {
  return factor * ELEVATION_SCALE_PER_FACTOR;
}

/**
 * Atmosphere outer-shell radius. The atmosphere integrates from PLANET_RADIUS
 * (1.0, unit-sphere) up to this radius. Depth-buffer occlusion in the
 * atmosphere fragment shader keeps the halo from painting over the rendered
 * terrain silhouette — see `AtmospherePass`.
 */
export function atmosphereRadiusFromFactor(factor: number): number {
  return 1.0 + ATMOSPHERE_TOP_KM * 1000 * elevationScaleFromFactor(factor);
}

export function createLandMaterial(): THREE.ShaderMaterial & {
  _landUniforms: LandUniforms;
} {
  const g = DEFAULTS.materials.globe;
  const a = DEFAULTS.materials.atmosphere;
  const o = DEFAULTS.materials.ocean;
  const s = DEFAULTS.scenarios;
  const uniforms: LandUniforms = {
    // Lighting uniforms are placeholders only — `scene-graph.applyTimeOfDay`
    // and `applyMaterials` overwrite them every frame from the directional
    // light + Tweakpane state. The values here just keep the first frame
    // from rendering pitch-black before the first `update()` call.
    uSunDirection: { value: new THREE.Vector3(1, 0, 0.3).normalize() },
    uSunColor: { value: new THREE.Vector3(1, 1, 1) },
    uNightTint: { value: new THREE.Color(g.nightTint) },
    uAmbient: { value: g.ambient },
    uMoonColor: { value: new THREE.Color(g.moonColor) },
    uMoonIntensity: { value: g.moonIntensity },

    uAttrStatic: { value: null },
    uAttrClimate: { value: null },
    uAttrDynamic: { value: null },
    uElevationMeters: { value: null },
    uElevationEquirect: { value: null },
    uDistanceField: { value: null },
    uBiomeColor: { value: null },

    uHealpixNside: { value: 1 },
    uHealpixOrdering: { value: 0 },
    uAttrTexWidth: { value: 1 },

    uElevationScale: { value: DEFAULT_ELEVATION_SCALE },
    uSeaLevelOffsetM: { value: o.seaLevelOffsetM },

    uColorFire: { value: new THREE.Color(g.lerpColorFire) },
    uColorIce: { value: new THREE.Color(g.lerpColorIce) },
    uColorInfection: { value: new THREE.Color(g.lerpColorInfection) },
    uColorPollution: { value: new THREE.Color(g.lerpColorPollution) },
    uLerpStrength: {
      value: new THREE.Vector4(
        g.lerpStrengthFire,
        g.lerpStrengthIce,
        g.lerpStrengthInfection,
        g.lerpStrengthPollution,
      ),
    },

    uBiomeStrength: { value: g.biomeStrength },
    uSnowLineStrength: { value: g.snowLineStrength },

    uSeasonOffsetC: { value: g.seasonOffsetC },
    uAlpineStrength: { value: g.alpineStrength },

    // Within this many km of a biome boundary, blend toward a mipmap
    // sample of the prebaked biome COLOR map. The slider also picks the
    // mip LOD, so it controls both the blend distance AND the blur
    // radius. 0 = hard categorical cell edges.
    uBiomeEdgeSharpness: { value: g.biomeEdgeSharpness },

    uBiomeSurfaceStrength: { value: g.biomeSurfaceStrength },
    uBiomeColorVar: { value: g.biomeColorVar },
    uBiomeBumpStrength: { value: g.biomeBumpStrength },
    uBiomeNoiseFreq: { value: g.biomeNoiseFreq },
    uBiomeSurfaceAmps: { value: new Float32Array(g.biomeSurfaceAmps) },
    uBiomeSpecAmps: { value: new Float32Array(g.biomeSpecAmps) },
    uSpecularStrength: { value: g.specularStrength },

    uBiomePalette: {
      value: g.biomePalette.map((hex) => {
        const c = new THREE.Color(hex);
        return new THREE.Vector3(c.r, c.g, c.b);
      }),
    },
    uAlpineBareColor: { value: new THREE.Color(g.alpineBareColor) },
    uColdToneColor: { value: new THREE.Color(g.coldToneColor) },
    uHotDryColor: { value: new THREE.Color(g.hotDryColor) },
    uSpecularTintWarm: { value: new THREE.Color(g.specularTintWarm) },
    uSpecularTintCool: { value: new THREE.Color(g.specularTintCool) },
    uMoonReflectanceBase: { value: new THREE.Color(g.moonReflectanceBase) },

    uSkyView: { value: null },
    uHazeExposure: { value: a.exposure },
    uHazeAmount: { value: a.hazeAmount },
    uHazeFalloffM: { value: a.hazeFalloffM },

    uWastelandTex: { value: null },
    uWastelandStrength: { value: s.wastelandStrength },
    uWastelandColor: { value: new THREE.Color(s.wastelandColor) },
    uWastelandDesaturate: { value: s.wastelandDesaturate },
  };

  // Three.js ShaderMaterial doesn't process GLSL `#include`, so the helper
  // module is concatenated by hand (vertex AND fragment use HEALPix lookups).
  const vertexShader = `${healpixGlsl}\n${LAND_VERT}`;
  const fragmentShader = `${healpixGlsl}\n${LAND_FRAG}`;

  const material = new THREE.ShaderMaterial({
    uniforms,
    glslVersion: THREE.GLSL3,
    vertexShader,
    fragmentShader,
  });
  Object.defineProperty(material, '_landUniforms', {
    value: uniforms,
    enumerable: false,
  });
  return material as THREE.ShaderMaterial & { _landUniforms: LandUniforms };
}

/**
 * Land material — owns the land icosphere's shader pair. Renders dry land
 * with a single base color modulated by snow/mountain/climate tints,
 * dynamic recolor, wasteland tint, lighting, and aerial-perspective haze.
 *
 * `_landUniforms` is exposed (non-enumerable) so Tweakpane bindings and
 * the scene graph can poke uniforms by name without re-reaching into
 * `material.uniforms`.
 */

import * as THREE from 'three';

import { source as healpixGlsl } from './shaders/healpix.glsl.js';

import { DEFAULTS } from '../../debug/defaults.js';

const LAND_VERT = `// Vertex shader: displaces by smoothed elevation (9-tap blur over ~3 HEALPix cells).

precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D uElevationMeters;
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

  vec3 up = abs(dir.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 t1 = normalize(cross(up, dir));
  vec3 t2 = cross(dir, t1);

  const float eps = 3.0e-3;
  const float diag = 0.7071;

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

  float displace = elev * uElevationScale;
  vec3 displaced = dir * (1.0 + displace);

  vec4 wp = modelMatrix * vec4(displaced, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const LAND_FRAG = `// Land fragment shader: single base color → climate/snow/dynamic/wasteland → lighting → haze.

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

uniform float uSnowLineStrength;

uniform float uTimeOfYear01;
uniform float uClimateTempDeltaC;
uniform sampler2D uBiomeOverrideTex;
uniform sampler2D uBiomeOverrideStamp;
uniform float uClimateEnvelope;
uniform float uClimateEnvelopeB;
uniform float uAlpineStrength;

// Pre-blurred biome-colour equirect. Built by BiomeColorEquirect — palette
// lookup happens in the bake; this shader takes one bilinear sample and
// uses the result as the base land colour. The downstream alpine, snow,
// climate, dynamic-recolor, and wasteland tints all stack on top per
// fragment with their own per-cell sharp boundaries.
uniform sampler2D uBiomeColorEquirect;
// Polygon-ID raster sampled by the coast fallback when the blurred
// alpha drops to zero (the kernel covered no land). uColorByPoly is
// the 1D palette indexed by polygon ID (RGBA8). The polygon-ID texture
// must be read with texelFetch — bilinear filtering would invent IDs.
uniform sampler2D uPolyIdRaster;
uniform sampler2D uColorByPoly;
uniform int uPolyTexWidth;
uniform int uPolyTexHeight;
// Pre-blurred climate-scenario override equirects, one per slot. RGB =
// blurred override colour, A = blurred stamp weight. Two slots so two
// concurrent climate scenarios can each crossfade independently.
uniform sampler2D uBiomeOverrideEquirect;
uniform sampler2D uBiomeOverrideEquirectB;
// Pre-blurred R16F elevation (metres) and temperature (degC) equirects.
// Replace the per-fragment HEALPix texelFetch lookups that previously
// drove the alpine smoothstep and the snow / cold / hot tints; without
// the blur, those snapped at ~5 km cell boundaries and pixelated the
// mountain highlights and snow line.
uniform sampler2D uMountainEquirect;
uniform sampler2D uSnowEquirect;
// Pre-blurred RGBA8 shelf-palette mask. Alpha = 1 inside shelf cells
// (biome ids 16/17/18); RGB = the CPU-mixed shelf palette (default
// blended with active climate scenarios). The blur smears alpha across
// the coast and the latitude-band seams, so the LAND seafloor branch
// just lerps base → shelf.rgb by shelf.a.
uniform sampler2D uSeafloorColorEquirect;
uniform float uLandSpecularSmoothness;
uniform float uSpecularStrength;

uniform vec3 uAlpineBareColor;
uniform vec3 uColdToneColor;
uniform vec3 uHotDryColor;

uniform vec3 uSpecularTintWarm;
uniform vec3 uSpecularTintCool;

uniform vec3 uMoonReflectanceBase;

uniform sampler2D uSkyView;
uniform float uHazeExposure;
uniform float uHazeAmount;
uniform float uHazeFalloffM;

uniform sampler2D uWastelandTex;
uniform float uWastelandStrength;
uniform vec3 uWastelandColor;
uniform float uWastelandDesaturate;

in vec3 vWorldPos;
in vec3 vSphereDir;

out vec4 fragColor;
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

void main() {
  vec3 dir = normalize(vSphereDir);
  vec3 nUp = abs(dir.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 t1 = normalize(cross(nUp, dir));
  vec3 t2 = cross(dir, t1);

  const float kEpsU = 1.0 / 4096.0;
  const float kEpsV = 1.0 / 2048.0;
  vec2 nUv = sphereDirToEquirectUv(dir);
  float eE = max(texture(uElevationEquirect, nUv + vec2( kEpsU, 0.0)).r, uSeaLevelOffsetM);
  float eW = max(texture(uElevationEquirect, nUv + vec2(-kEpsU, 0.0)).r, uSeaLevelOffsetM);
  float eN = max(texture(uElevationEquirect, nUv + vec2(0.0, -kEpsV)).r, uSeaLevelOffsetM);
  float eS = max(texture(uElevationEquirect, nUv + vec2(0.0,  kEpsV)).r, uSeaLevelOffsetM);
  float Gx = eE - eW;
  float Gy = eN - eS;
  const float kArc = 6.28318530 / 2048.0;
  float slopeT1 = clamp(Gx * uElevationScale / kArc, -0.6, 0.6);
  float slopeT2 = clamp(Gy * uElevationScale / kArc, -0.6, 0.6);
  vec3 n = normalize(dir - slopeT1 * t1 - slopeT2 * t2);

  int ipx = healpixZPhiToPix(uHealpixNside, uHealpixOrdering, vSphereDir.z, atan(vSphereDir.y, vSphereDir.x));
  ivec2 tx = healpixIpixToTexel(ipx, uAttrTexWidth);

  vec2 dfUv = sphereDirToEquirectUv(dir);

  // Submerged-cell discard: cell renders iff current elevation sits at or
  // above the sea-level slider. Sub-cell precision from the bilinear
  // equirect resample.
  float elevHere = texture(uElevationEquirect, dfUv).r;
  if (elevHere < uSeaLevelOffsetM) discard;

  // Base land colour: one bilinear sample of the pre-blurred polygon-
  // colour equirect. BiomeColorEquirect bakes the crisp polygon-ID →
  // palette map, then runs two passes of separable Gaussian blur on
  // it (alpha-weighted so the ocean cut-out doesn't darken the coast).
  // LAND just samples the result and stacks the alpine / snow /
  // climate / dynamic / wasteland tints on top per fragment.
  vec4 blurred = texture(uBiomeColorEquirect, dfUv);
  vec3 base;
  if (blurred.a < 1e-3) {
    // Coast fallback: blurred alpha at zero means the kernel saw no
    // land contribution — fall back to the 1D palette colour at the
    // raster polygon so the fragment still gets a sane land tone
    // instead of black.
    ivec2 pTex = ivec2(
      clamp(int(dfUv.x * float(uPolyTexWidth)),  0, uPolyTexWidth  - 1),
      clamp(int(dfUv.y * float(uPolyTexHeight)), 0, uPolyTexHeight - 1)
    );
    vec2 polyBytes = texelFetch(uPolyIdRaster, pTex, 0).rg;
    int rasterPoly = int(polyBytes.r * 255.0 + 0.5)
                   | (int(polyBytes.g * 255.0 + 0.5) << 8);
    base = texelFetch(uColorByPoly, ivec2(rasterPoly, 0), 0).rgb;
  } else {
    base = blurred.rgb;
  }

  // Seafloor branch: synthetic shelf biomes 16/17/18 cover every TEOW-
  // uncovered cell (open ocean / continental shelf). The shelf colour +
  // its falloff are baked into uSeafloorColorEquirect: alpha = 1 on
  // shelf cells fades to 0 inland and across the latitude-band seams,
  // and RGB is the CPU-mixed (default + scenario A + scenario B) shelf
  // colour. A single bilinear sample dissolves the coast and the seams
  // in one stroke.
  vec4 shelf = texture(uSeafloorColorEquirect, dfUv);
  base = mix(base, shelf.rgb, shelf.a);

  // Alpine + snow inputs now come from pre-blurred equirects: the
  // crisp HEALPix lookup is baked once into mountain/snow equirects
  // and Gaussian-blurred so peaks and the snow line transition
  // smoothly across cell boundaries.
  float elevM = max(texture(uMountainEquirect, dfUv).r, 0.0);

  // Alpine thinning: fade toward bare-rock grey-tan as elevation rises.
  float altThin = smoothstep(1500.0, 4000.0, elevM);
  base = mix(base, uAlpineBareColor, altThin * clamp(uAlpineStrength, 0.0, 1.0));

  float temperatureC = texture(uSnowEquirect, dfUv).r;
  // Sun-locked seasonal swing. Hemisphere-mirrored sinusoid scaled by
  // |sin(lat)|^E so the equator stays static and the poles swing
  // hardest. declNorm = -1 -> north winter, +1 -> north summer.
  const float MAX_SEASON_C = 25.0;
  const float SEASON_LAT_EXP = 1.7;
  const float YEAR_PHASE_OFFSET = 0.221; // matches scene-graph.ts
  float declNorm = sin((uTimeOfYear01 - YEAR_PHASE_OFFSET) * 6.28318530);
  float sinLat = vSphereDir.z;
  float seasonalDeltaC = MAX_SEASON_C
                         * pow(abs(sinLat), SEASON_LAT_EXP)
                         * sign(sinLat)
                         * declNorm;
  float effTempC = temperatureC + seasonalDeltaC + uClimateTempDeltaC;

  // Cold tint.
  float coldBlend = smoothstep(18.0, -2.0, effTempC);
  base = mix(base, uColdToneColor, coldBlend * 0.95);

  // Hot tint (capped at 40%).
  float hotBlend = smoothstep(22.0, 36.0, effTempC);
  base = mix(base, uHotDryColor, hotBlend * 0.40);

  // Snow line.
  float snowMix = uSnowLineStrength * (1.0 - smoothstep(-10.0, -1.0, effTempC));
  base = mix(base, uColorIce, clamp(snowMix, 0.0, 1.0));

  // Biome override (climate scenarios). Sits ON TOP of the seasonal
  // cold/hot/snow tints so a tundra override in winter still reads
  // tundra-coloured rather than the snow-blue of the underlying base.
  // Two slots so two concurrent climate scenarios can co-paint the
  // planet — the stamp texture (RGBA8) packs slot A in .rg and slot B
  // in .ba. Winner-take-all: per-pixel the dominant slot wins and
  // paints fully at its own weight; the loser is ignored. Opposing
  // scenarios no longer average to baseline — one paint wins on each
  // polygon based on which scenario's stamp fits it harder. Equal
  // weight ties default to slot A.
  if (uClimateEnvelope > 0.0 || uClimateEnvelopeB > 0.0) {
    vec4 stampSample = texelFetch(uBiomeOverrideStamp, tx, 0);
    float wA = 0.0;
    vec3 colorA = vec3(0.0);
    if (uClimateEnvelope > 0.0) {
      vec4 ovrA = texture(uBiomeOverrideEquirect, dfUv);
      float tStartA = stampSample.g;
      float remainingA = max(1.0 - tStartA, 0.05);
      float cellEnvA = clamp((uClimateEnvelope - tStartA) / remainingA, 0.0, 1.0);
      cellEnvA *= step(tStartA, uClimateEnvelope);
      float intensityA = ovrA.a * cellEnvA;
      wA = smoothstep(0.0, 0.7, intensityA);
      colorA = ovrA.rgb;
    }
    float wB = 0.0;
    vec3 colorB = vec3(0.0);
    if (uClimateEnvelopeB > 0.0) {
      vec4 ovrB = texture(uBiomeOverrideEquirectB, dfUv);
      float tStartB = stampSample.a;
      float remainingB = max(1.0 - tStartB, 0.05);
      float cellEnvB = clamp((uClimateEnvelopeB - tStartB) / remainingB, 0.0, 1.0);
      cellEnvB *= step(tStartB, uClimateEnvelopeB);
      float intensityB = ovrB.a * cellEnvB;
      wB = smoothstep(0.0, 0.7, intensityB);
      colorB = ovrB.rgb;
    }
    float winnerW = (wA >= wB) ? wA : wB;
    vec3 winnerCol = (wA >= wB) ? colorA : colorB;
    base = mix(base, winnerCol, winnerW);
  }

  // Dynamic recolor.
  vec4 dyn = clamp(texelFetch(uAttrDynamic, tx, 0) * uLerpStrength,
                   vec4(0.0), vec4(1.0));
  base = mix(base, uColorFire, dyn.r);
  base = mix(base, uColorIce, dyn.g);
  base = mix(base, uColorInfection, dyn.b);
  base = mix(base, uColorPollution, dyn.a);

  // Wasteland tint.
  float specCarry = 1.0;
  if (uWastelandStrength > 0.0) {
    float wRaw = texelFetch(uWastelandTex, tx, 0).r;
    float w = clamp(wRaw * uWastelandStrength, 0.0, 1.0);
    if (w > 0.0) {
      float luma = dot(base, vec3(0.2126, 0.7152, 0.0722));
      vec3 desat = mix(base, vec3(luma), clamp(uWastelandDesaturate, 0.0, 1.0));
      vec3 wasted = mix(desat, uWastelandColor, w);
      base = mix(base, wasted, w);
      specCarry = 1.0 - 0.8 * w;
    }
  }

  vec3 sunDir = normalize(uSunDirection);
  float ndotl = dot(n, sunDir);
  float wrap = smoothstep(-0.6, 0.8, ndotl);

  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  vec3 halfDir = normalize(sunDir + viewDir);
  float frostBonus  = smoothstep(5.0, -10.0, effTempC) * 0.15;
  float smoothness  = max(uLandSpecularSmoothness + frostBonus, snowMix * 0.6);
  float spec = pow(max(dot(n, halfDir), 0.0), 24.0);
  float sunMask = smoothstep(0.0, 0.15, ndotl);
  vec3 specTint = mix(uSpecularTintWarm, uSpecularTintCool, snowMix);
  vec3 specContrib = specTint * spec * smoothness * sunMask * uSpecularStrength * specCarry;

  vec3 day = base * uAmbient + base * uSunColor * max(ndotl, 0.0) + specContrib;
  float moonDotL = max(-ndotl, 0.0);
  vec3 moonReflectance = mix(uMoonReflectanceBase, base, 0.25);
  vec3 moonGlow = moonReflectance * uMoonColor * moonDotL * uMoonIntensity;
  vec3 night = base * uNightTint + moonGlow;

  vec3 finalColor = mix(night, day, wrap);

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
  uElevationEquirect: { value: THREE.Texture | null };

  uHealpixNside: { value: number };
  uHealpixOrdering: { value: number };
  uAttrTexWidth: { value: number };

  uElevationScale: { value: number };
  uSeaLevelOffsetM: { value: number };

  uColorFire: { value: THREE.Color };
  uColorIce: { value: THREE.Color };
  uColorInfection: { value: THREE.Color };
  uColorPollution: { value: THREE.Color };
  uLerpStrength: { value: THREE.Vector4 };

  uSnowLineStrength: { value: number };

  /** 0..1 calendar position from `debug.timeOfDay.timeOfYear01`. */
  uTimeOfYear01: { value: number };
  /** Frame-accumulated climate temp shift (degC), from ScenarioRegistry.getClimateFrame(). */
  uClimateTempDeltaC: { value: number };
  /** R8 per-cell biome class index (HEALPix). null = no override active. */
  uBiomeOverrideTex: { value: THREE.DataTexture | null };
  /** RG8 per-cell stamp (HEALPix): R = peak weight, G = per-cell tStart01. null = no override active. */
  uBiomeOverrideStamp: { value: THREE.DataTexture | null };
  /** Slot 0 climate envelope from `ScenarioRegistry.getClimateEnvelopes()[0]`. */
  uClimateEnvelope: { value: number };
  /** Slot 1 climate envelope from `ScenarioRegistry.getClimateEnvelopes()[1]`. */
  uClimateEnvelopeB: { value: number };
  uAlpineStrength: { value: number };

  /**
   * Pre-blurred biome-colour equirect (RGBA8, 4096×2048). Built by
   * BiomeColorEquirect from the palette + per-polygon ID, then blurred
   * with two passes of separable Gaussian (σ = 30 px, kernel half-width
   * 60 px). Single bilinear sample feeds the base land colour;
   * everything below (alpine, snow, wasteland, etc.) stacks on top
   * per fragment.
   */
  uBiomeColorEquirect: { value: THREE.Texture | null };
  /**
   * Equirect polygon-ID texture (`world.getPolygonTexture()`). Only
   * read by the coast fallback when the blurred equirect's alpha is
   * zero. Sampled with `texelFetch` — bilinear filtering would invent
   * IDs.
   */
  uPolyIdRaster: { value: THREE.Texture | null };
  /**
   * 1D palette keyed by polygon ID — `BiomeColorEquirect.colorByPolyTexture`.
   * Drives the coast fallback when the blurred equirect's alpha is
   * zero. Same dirty-bit cadence as the baked colour equirect: rebakes
   * when palette / realm tint / ecoregion jitter changes.
   */
  uColorByPoly: { value: THREE.Texture | null };
  /** Polygon-raster dimensions — needed for `texelFetch` integer indexing. */
  uPolyTexWidth: { value: number };
  uPolyTexHeight: { value: number };
  /**
   * Pre-blurred climate-scenario override equirect. Built by
   * BiomeOverrideEquirect on scenario start/end + palette/blur changes.
   * RGB = blurred `paletteAt(overrideClass[cell])`; A = blurred
   * `stampWeight[cell]`. Sampled bilinearly by the override block for a
   * soft scenario frontier. Two per-slot bakes — `uBiomeOverrideEquirect`
   * for slot 0 (climate slot A), `uBiomeOverrideEquirectB` for slot 1
   * (climate slot B). Both share the same class + stamp source textures
   * (RG8 / RGBA8 packed) and the same palette + blur slider; only the
   * channel each samples differs.
   */
  uBiomeOverrideEquirect: { value: THREE.Texture | null };
  uBiomeOverrideEquirectB: { value: THREE.Texture | null };
  /**
   * Pre-blurred elevation equirect (R16F, 4096×2048). Built by
   * `MountainEquirect` from `uElevationMeters`. Drives the alpine
   * smoothstep — sampled bilinearly so peaks transition smoothly
   * across HEALPix cell boundaries.
   */
  uMountainEquirect: { value: THREE.Texture | null };
  /**
   * Pre-blurred temperature equirect (R16F, 4096×2048). Built by
   * `SnowEquirect` from `uAttrClimate.r` (degC). Seasonal swing + the
   * climate Δ stay analytic; only the per-cell climatology is blurred.
   */
  uSnowEquirect: { value: THREE.Texture | null };
  /**
   * Pre-blurred shelf-palette mask (RGBA8, 4096×2048). Built by
   * `SeafloorColorEquirect` from the shelf-biome ids + CPU-mixed
   * default/scenario palette. The blurred alpha drives the LAND
   * shader's mix between base land colour and shelf colour so the
   * coast and the 23.5°/60° latitude seams dissolve at the same wide
   * sigma.
   */
  uSeafloorColorEquirect: { value: THREE.Texture | null };
  /** Single Blinn-Phong smoothness for all land (snow override stays in shader). */
  uLandSpecularSmoothness: { value: number };
  /** Master multiplier on the specular contribution; 0 disables the highlight entirely. */
  uSpecularStrength: { value: number };

  uAlpineBareColor: { value: THREE.Color };
  uColdToneColor: { value: THREE.Color };
  uHotDryColor: { value: THREE.Color };
  uSpecularTintWarm: { value: THREE.Color };
  uSpecularTintCool: { value: THREE.Color };
  uMoonReflectanceBase: { value: THREE.Color };

  uSkyView: { value: THREE.Texture | null };
  uHazeExposure: { value: number };
  uHazeAmount: { value: number };
  uHazeFalloffM: { value: number };

  uWastelandTex: { value: THREE.DataTexture | null };
  uWastelandStrength: { value: number };
  uWastelandColor: { value: THREE.Color };
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
 * Atmosphere top in km above sea level. The frame loop in `scene-graph.ts`
 * computes `atmRadius = planetRadius + ATMOSPHERE_TOP_KM * 1000 * elevScale`
 * each tick, so the shell rides the same sea-level offset as the water
 * surface. Halo-vs-terrain occlusion is handled by the depth test in
 * `AtmospherePass`, not by this radius.
 */
export const ATMOSPHERE_TOP_KM = 40;

export function elevationScaleFromFactor(factor: number): number {
  return factor * ELEVATION_SCALE_PER_FACTOR;
}

/**
 * Initial atmosphere outer-shell radius for bootstrap (sea level = 0). The
 * per-frame value is recomputed in `scene-graph.ts` from the live planet
 * radius + `ATMOSPHERE_TOP_KM`, so this is only used to pick the LUT bake
 * scale on construction. Depth-buffer occlusion in the atmosphere fragment
 * shader keeps the halo from painting over the rendered terrain silhouette
 * — see `AtmospherePass`.
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

    uSnowLineStrength: { value: g.snowLineStrength },

    uTimeOfYear01: { value: 0 },
    uClimateTempDeltaC: { value: 0 },
    uBiomeOverrideTex: { value: null },
    uBiomeOverrideStamp: { value: null },
    uClimateEnvelope: { value: 0 },
    uClimateEnvelopeB: { value: 0 },
    uAlpineStrength: { value: g.alpineStrength },

    uBiomeColorEquirect: { value: null },
    uPolyIdRaster: { value: null },
    uColorByPoly: { value: null },
    uPolyTexWidth: { value: 1 },
    uPolyTexHeight: { value: 1 },
    uBiomeOverrideEquirect: { value: null },
    uBiomeOverrideEquirectB: { value: null },
    uMountainEquirect: { value: null },
    uSnowEquirect: { value: null },
    uSeafloorColorEquirect: { value: null },
    uLandSpecularSmoothness: { value: g.landSpecularSmoothness },
    uSpecularStrength: { value: g.specularStrength },

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

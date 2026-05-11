// Inlined from land.frag.glsl. Edit the GLSL inside the template literal —
// the source of truth lives here, no separate .glsl file on disk.
export const source = `// Land fragment shader — climate-driven biome shading on the dry-land
// icosphere. Ocean cells fade to alpha 0 via a continuous distance-to-coast
// field; the separate water mesh paints the ocean.
//
// Pipeline (each step composes on top of the previous):
//   1. Distance field sample  — single bilinear lookup of the equirect
//                               \`uDistanceField\` (RG16F): R = signed km
//                               to coast (positive on land), G = km to
//                               nearest biome boundary. Replaces the
//                               old 9-tap HEALPix blur — sub-cell
//                               smooth, ~10× cheaper.
//   2. Coast alpha            — fragAlpha = smoothstep(-S, +S, d.r) where
//                               S = uCoastSharpness (km). Continuous,
//                               anti-aliased coastline that doesn't
//                               step on cell boundaries.
//   3. Biome lookup           — centre HEALPix cell still drives the
//                               biome ID; the colour is faded toward
//                               a neutral landfall tone within
//                               uBiomeEdgeSharpness km of any biome
//                               border, so vivid colours stay only in
//                               biome interiors.
//   4. Biome surface variation — per-biome procedural noise (color +
//                               fake-bump). Master gate
//                               \`uBiomeSurfaceStrength\` zero = pre-
//                               feature look, no cost. Per-biome amps
//                               in \`uBiomeSurfaceAmps[12]\`.
//   5. Alpine thinning        — biome colour blends toward bare-rock
//                               grey-tan as elevation rises 1.5 → 4 km.
//   6. Cold/hot tints + snow line — same as before.
//   7. Dynamic recolour       — fire / ice / infection / pollution.
//   8. Wrap-Lambert lighting  — Sobel-tilted normal + fake-bump from
//                               step 4 so noise patterns catch the
//                               sun, day/night wrap.
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
uniform sampler2D uElevationEquirect;
uniform sampler2D uDistanceField;
uniform sampler2D uBiomeColor;
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

// Half-width (km) of the smoothstep over distance-to-coast. Smaller =
// razor edge; larger = soft dissolve. The shader reads the signed km
// from the distance field's R channel, so this is in real-world km.
uniform float uCoastSharpness;

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

// Aerial perspective. uSkyView is the same sky-view LUT the atmosphere
// halo samples — sampled here in the direction camera→surface so distant
// terrain tints toward the same inscattered colour that paints the rim
// halo. Sun-position dependent (the LUT rebakes on sun/camera change), so
// haze warms at sunrise/sunset without any extra plumbing.
uniform sampler2D uSkyView;
uniform float uHazeExposure;
uniform float uHazeAmount;
uniform float uHazeFalloffM;

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

const vec3 LANDFALL_NEUTRAL = vec3(0.55, 0.50, 0.40);

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
// rim halo exactly. \`dir\` should be camera→surface (or any direction
// from the camera). Returns linear radiance — apply uHazeExposure at the
// call site.
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
  // (2π/4096 rad). \`max(_, 0)\` clamps ocean depths so coastlines don't
  // read as inland cliffs.
  const float kEpsU = 1.0 / 4096.0;
  const float kEpsV = 1.0 / 2048.0;
  vec2 nUv = sphereDirToEquirectUv(dir);
  float eE = max(texture(uElevationEquirect, nUv + vec2( kEpsU, 0.0)).r, 0.0);
  float eW = max(texture(uElevationEquirect, nUv + vec2(-kEpsU, 0.0)).r, 0.0);
  // +v points south (north pole at v=0), so eN uses -kEpsV and eS uses +kEpsV.
  float eN = max(texture(uElevationEquirect, nUv + vec2(0.0, -kEpsV)).r, 0.0);
  float eS = max(texture(uElevationEquirect, nUv + vec2(0.0,  kEpsV)).r, 0.0);
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
  const vec3 ALPINE_BARE = vec3(0.55, 0.50, 0.45);
  float altThin = smoothstep(1500.0, 4000.0, elevM);
  base = mix(base, ALPINE_BARE, altThin * clamp(uAlpineStrength, 0.0, 1.0));

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
  vec3 specTint = mix(vec3(1.0, 0.97, 0.92), vec3(0.95, 0.97, 1.05), snowMix);
  vec3 specContrib = specTint * spec * smoothness * sunMask * uSpecularStrength;

  vec3 day = base * (uAmbient + (1.0 - uAmbient) * max(ndotl, 0.0)) + specContrib;
  vec3 night = base * uNightTint;

  // ----- Coast alpha -----
  // Continuous km-based smoothstep on the signed coast distance. With a
  // bilinear-filtered distance field the transition is smooth at any
  // zoom; uCoastSharpness controls the fade width in real km. At 0 the
  // smoothstep edges collide (undefined in GLSL) so degrade to a hard
  // step at the coastline.
  float fragAlpha = (uCoastSharpness <= 0.0)
    ? step(0.0, df.r)
    : smoothstep(-uCoastSharpness, uCoastSharpness, df.r);

  vec3 finalColor = mix(night, day, wrap);

  // ----- Aerial perspective (haze) -----
  // Tint toward the inscattered sky-view LUT colour. Strength uses the
  // same 1 - exp(-lum * 6) falloff that drives the atmosphere halo's
  // alpha (see atmosphere.frag.glsl), so surface haze and rim halo
  // share one source of truth and can't disagree at the silhouette.
  if (uHazeAmount > 0.0) {
    vec3 hazeColor = sampleSkyViewHaze(-viewDir, cameraPosition, sunDir) * uHazeExposure;
    float lum = dot(hazeColor, vec3(0.2126, 0.7152, 0.0722));
    // Atmospheric perspective: peaks above the haze layer punch through
    // it. Sea-level fragments get full haze; mountain peaks get
    // progressively less. This is what makes the jagged mountain
    // silhouette survive at the limb instead of being washed flat into
    // the sphere outline. \`elevM\` is in scope from the elevation-texture
    // read above (also used by alpine thinning).
    float elevAtten = exp(-elevM / max(uHazeFalloffM, 1.0));
    float hazeStrength = clamp((1.0 - exp(-lum * 6.0)) * uHazeAmount * elevAtten, 0.0, 0.95);
    finalColor = mix(finalColor, hazeColor, hazeStrength);
  }

  fragColor = vec4(finalColor, fragAlpha);
}
`;

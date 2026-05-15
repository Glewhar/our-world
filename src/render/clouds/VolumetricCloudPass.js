/**
 * Volumetric cloud pass (M5).
 *
 * Renders the cloud raymarch into a reduced-resolution offscreen target
 * (1/CLOUD_RES_DIVISOR per axis), then composites that target onto the
 * main framebuffer via a fullscreen quad (the public `mesh`). The
 * composite mesh lives in the main scene at `renderOrder = 0`, so the
 * existing draw order (opaque globe → cloud composite → atmosphere with
 * renderOrder=1) is preserved by Three.js's own sorting.
 *
 * Reduced-res rendering is the dominant win on tile-based mobile GPUs:
 * the raymarch is up to ~12 view + ~36 light noise samples per pixel,
 * so cutting pixel count by 1/N² cuts the cost the same way. The
 * composite is a single bilinear tap. Quality cost is minor: cloud
 * silhouettes against the planet are already soft thanks to the hash-
 * jittered integration, and `LinearFilter` on the target does the
 * upsample for free. (The field name `halfResTarget` is historical —
 * the actual divisor is set by CLOUD_RES_DIVISOR below.)
 *
 * Domain: spherical shell `[CLOUD_BASE_M, CLOUD_TOP_M]` above the unit
 * sphere. Density is procedural (FBM + Worley); advection comes from
 * the pre-baked wind field bound at `attachWorld` time.
 *
 * Public API: scene-graph pushes Tweakpane state in via the `setX`
 * setters each frame; `update` advances `uTime`; `syncFromCamera`
 * refreshes `uInvViewProj` + `uCameraPos` so the fragment can
 * reconstruct the view ray; `renderHalfRes(renderer, camera)` MUST be
 * called once per frame BEFORE the main scene render so the composite
 * mesh has fresh cloud data; `setSize(w, h)` keeps the offscreen
 * target sized to `1/CLOUD_RES_DIVISOR` per axis of the canvas.
 */
import * as THREE from 'three';
import { source as healpixGlsl } from '../globe/shaders/healpix.glsl.js';
import { DEFAULT_ELEVATION_SCALE } from '../globe/LandMaterial.js';
import { DEFAULTS } from '../../debug/defaults.js';
const CLOUDS_VERT = `// Fullscreen-triangle vertex shader (GLSL3) for the volumetric cloud pass.
// Same convention as atmosphere/shaders/fullscreen.vert.glsl: a single
// triangle with clip-space coords (-1,-1), (3,-1), (-1,3); the viewport-
// clipped portion covers [0,1]² in UV. The fragment reconstructs a
// world-space view ray from \`vUv\` + \`uInvViewProj\`.

out vec2 vUv;

void main() {
  vec2 clip = vec2(
    (gl_VertexID == 1) ?  3.0 : -1.0,
    (gl_VertexID == 2) ?  3.0 : -1.0
  );
  vUv = 0.5 * (clip + 1.0);
  gl_Position = vec4(clip, 0.0, 1.0);
}
`;
const CLOUD_NOISE = `// Procedural noise helpers for the volumetric cloud pass.
//
// Concatenated ABOVE the cloud frag shader at material build time, so this
// chunk owns the global \`precision\` declarations. (\`RawShaderMaterial\` +
// GLSL3 supplies no implicit precision; the first float/vec3 declaration
// without one fails to compile.)

precision highp float;
precision highp int;
precision highp sampler2D;


//
// All sampled in 3D so the cloud field stays coherent across the spherical
// shell — sampling a 2D equirect noise in a 3D shell produces obvious
// "vertical pillars" that look fake on a planet. 3D coverage costs a
// little more per fetch but the result holds up at any zoom.
//
// Two layers compose the cloud density field:
//   * \`cn_fbm(p)\` — 4-octave value-noise FBM. Macro cloud cells, gentle
//     cumulus shapes. This drives coverage.
//   * \`cn_worley(p)\` — distance to the nearest 3D feature point, computed
//     over a 3×3×3 cell neighbourhood. Inverted (1 - d) gives sharper
//     internal billows that erode the FBM edges so cloud silhouettes
//     don't all look like soft blobs.
//
// Both use the same \`cn_hash13\` so jitter is deterministic per
// integer-grid cell. Frequencies in the cloud frag are tuned empirically
// against a 6371 km Earth — see comments in clouds.frag.glsl.

float cn_hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

vec3 cn_hash33(vec3 p) {
  return vec3(
    cn_hash13(p),
    cn_hash13(p + vec3(7.7, 11.3, 13.7)),
    cn_hash13(p + vec3(19.1, 23.9, 29.3))
  );
}

float cn_vnoise3(vec3 x) {
  vec3 p = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = cn_hash13(p);
  float n100 = cn_hash13(p + vec3(1.0, 0.0, 0.0));
  float n010 = cn_hash13(p + vec3(0.0, 1.0, 0.0));
  float n110 = cn_hash13(p + vec3(1.0, 1.0, 0.0));
  float n001 = cn_hash13(p + vec3(0.0, 0.0, 1.0));
  float n101 = cn_hash13(p + vec3(1.0, 0.0, 1.0));
  float n011 = cn_hash13(p + vec3(0.0, 1.0, 1.0));
  float n111 = cn_hash13(p + vec3(1.0, 1.0, 1.0));
  return mix(
    mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
    mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
    f.z
  );
}

float cn_fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; ++i) {
    v += a * cn_vnoise3(p);
    p = p * 2.03 + vec3(0.71, 0.13, 0.49);
    a *= 0.5;
  }
  return v;
}

// FBM with caller-supplied per-octave weights. Same underlying grid as
// \`cn_fbm\` (same offsets per octave, same frequency doubling) so the
// noise pattern is spatially coherent across all weight choices.
// Modulating w smoothly across the surface produces clouds that visually
// morph between "low-frequency-dominant big rolling shapes" and "all-
// octaves-balanced small puffy texture" without tearing — the underlying
// noise samples don't change, only how they're combined.
float cn_fbm_weighted(vec3 p, vec4 w) {
  float v = 0.0;
  v += w.x * cn_vnoise3(p);
  p = p * 2.03 + vec3(0.71, 0.13, 0.49);
  v += w.y * cn_vnoise3(p);
  p = p * 2.03 + vec3(0.71, 0.13, 0.49);
  v += w.z * cn_vnoise3(p);
  p = p * 2.03 + vec3(0.71, 0.13, 0.49);
  v += w.w * cn_vnoise3(p);
  return v;
}

// 3D Worley — distance² to the nearest jittered feature point in the 27
// neighbour cells. Caller takes sqrt or maps as needed. Returns ~[0, 1].
float cn_worley(vec3 x) {
  vec3 p = floor(x);
  vec3 f = fract(x);
  float minD2 = 1e9;
  for (int kz = -1; kz <= 1; ++kz) {
    for (int ky = -1; ky <= 1; ++ky) {
      for (int kx = -1; kx <= 1; ++kx) {
        vec3 cell = vec3(float(kx), float(ky), float(kz));
        vec3 jitter = cn_hash33(p + cell);
        vec3 d = cell + jitter - f;
        minD2 = min(minD2, dot(d, d));
      }
    }
  }
  return sqrt(minD2);
}
`;
const CLOUDS_UPSAMPLE_FRAG = `// Half-res cloud composite. Samples the cloud raymarch's half-resolution
// target and blends onto the main framebuffer using the same premultiplied
// -alpha contract the raymarch wrote with. The half-res texture's own
// LinearFilter sampling does the bilinear 4-tap, so a single \`texture()\`
// call gives us a soft upsample at zero extra cost.
//
// The cloud raymarch already produces alpha-soft silhouettes (hash-jittered
// integration, smoothstep'd vertical fade), so plain bilinear is enough
// here — no depth-aware bilateral filter needed for the FPS win this
// pass exists to deliver. If a future pass needs a crisp cloud/terrain
// edge, swap this for the textbook 4-tap depth-aware variant; the half-
// res target layout already supports it.

precision highp float;
precision highp sampler2D;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uCloudTex;

void main() {
  vec4 c = texture(uCloudTex, vUv);
  // Skip empty pixels so the depth-test-disabled blend stage doesn't
  // touch the framebuffer where the cloud was fully transparent.
  if (c.a <= 0.0) discard;
  fragColor = c;
}
`;
const CLOUDS_FRAG = `// Volumetric cloud raymarch (M5).
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
uniform vec3 uSunColor;             // direct sun lighting colour
uniform vec3 uAmbientColor;         // ambient sky tint applied to shaded cloud faces

// Nuclear-winter soot — default zero/white so the shader is a no-op
// when no scenario pushes soot. uSootGlobal weights the sun + ambient
// tint and the global overcast bump (applied scene-graph-side);
// uSootRegionalWeight gates the per-cell wasteland-driven cover bump
// inside biomeProfileAt.
uniform float uSootGlobal;
uniform float uSootRegionalWeight;
uniform vec3 uSootSunTint;
uniform vec3 uSootAmbientTint;
uniform sampler2D uWastelandTex;

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
  //
  // Skip the 27-cell Worley fetch on sparse-coverage cells — wispy edges
  // where baseSlab is small contribute almost nothing to the final colour
  // (final density is multiplied by baseSlab), so the difference between
  // a real Worley sample and the mean-Worley constant the light march
  // uses is invisible. Threshold picked so the saved work covers the
  // wispy fringe where Worley pays no visual rent.
  float density;
  if (baseSlab < 0.15) {
    density = baseSlab * (1.0 - 0.5 * WORLEY_MIX);
  } else {
    float wd = cn_worley(sampleP + vec3(3.7, 1.3, 5.1));
    float erosion = clamp(1.0 - wd, 0.0, 1.0);
    density = baseSlab * (1.0 - WORLEY_MIX + WORLEY_MIX * erosion);
  }

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
// Biome codes (TEOW — Terrestrial Ecoregions of the World, encoded into
// G channel × 255 by the data pipeline). No water class — ocean cells
// (and any no-data cells outside every TEOW polygon) are code 0.
//
//   0  ocean / no-data            8  temperate grassland
//   1  tropical moist forest      9  flooded grassland
//   2  tropical dry forest       10  montane grassland
//   3  tropical coniferous       11  tundra
//   4  temperate broadleaf       12  mediterranean
//   5  temperate conifer         13  desert / xeric
//   6  boreal / taiga            14  mangroves
//   7  tropical savanna
//
// Cover values feed the coverage threshold
// (effectiveCoverage = uCoverage * cover); > 1.0 means cloudier than
// the global Tweakpane slider alone would give:
//   1.20  trop moist forest, flooded grassland, mangroves
//   1.10  trop coniferous, temperate broadleaf
//   1.00  ocean, temperate conifer
//   0.90  boreal
//   0.80  trop dry forest, temperate grassland, montane grassland, tundra
//   0.70  tropical savanna
//   0.40  mediterranean
//   0.10  desert / xeric
//
// Weight profiles:
//   W_TROPICAL  trop moist/dry/coniferous, flooded grassland, mangroves
//   W_POLAR     boreal, tundra
//   W_ARID      mediterranean, desert
//   W_TEMPERATE everything else (ocean, temperate broadleaf/conifer,
//               savanna, temperate/montane grassland)
//
// Mountain boundary: cells above 2500 m elevation get their cover faded
// to zero (full suppression by 3000 m). The 19-tap blur softens the
// boundary further so the suppression doesn't read as a hard outline.
//
// Returns per-cell discrete values. Callers MUST blur (see
// \`sampleBiomeProfile\`) so biome boundaries don't stamp a hard step
// into either cover or weights.
CoverSample biomeProfileAt(vec3 dir) {
  int ipix = healpixZPhiToPix(uHealpixNside, uHealpixOrdering, dir.z, atan(dir.y, dir.x));
  ivec2 tx = healpixIpixToTexel(ipix, uAttrTexWidth);
  float biomeF = texelFetch(uAttrStatic, tx, 0).g * 255.0;
  float elevM = texelFetch(uElevationMeters, tx, 0).r;

  // Per-TEOW-code flag. Mutually exclusive — at most one is 1.0.
  float is1  = step(0.5,  biomeF) * step(biomeF, 1.5);
  float is2  = step(1.5,  biomeF) * step(biomeF, 2.5);
  float is3  = step(2.5,  biomeF) * step(biomeF, 3.5);
  float is4  = step(3.5,  biomeF) * step(biomeF, 4.5);
  float is5  = step(4.5,  biomeF) * step(biomeF, 5.5);
  float is6  = step(5.5,  biomeF) * step(biomeF, 6.5);
  float is7  = step(6.5,  biomeF) * step(biomeF, 7.5);
  float is8  = step(7.5,  biomeF) * step(biomeF, 8.5);
  float is9  = step(8.5,  biomeF) * step(biomeF, 9.5);
  float is10 = step(9.5,  biomeF) * step(biomeF, 10.5);
  float is11 = step(10.5, biomeF) * step(biomeF, 11.5);
  float is12 = step(11.5, biomeF) * step(biomeF, 12.5);
  float is13 = step(12.5, biomeF) * step(biomeF, 13.5);
  float is14 = step(13.5, biomeF) * step(biomeF, 14.5);

  // Default = ocean (code 0) OR shelf ids 16/17/18 (synthetic seafloor
  // biomes added by the bake): cover 1.00, W_TEMPERATE. Shelves are
  // deliberately NOT detected here — over the ocean their cover should
  // read identically to deep water, and they only ever become visible
  // when a dropping sea-level slider exposes them, at which point the
  // ocean-default profile is still the visually correct fallback.
  float cover = 1.00;
  cover = mix(cover, 1.20, is1);   // tropical moist forest
  cover = mix(cover, 0.80, is2);   // tropical dry forest
  cover = mix(cover, 1.10, is3);   // tropical coniferous
  cover = mix(cover, 1.10, is4);   // temperate broadleaf
  cover = mix(cover, 1.00, is5);   // temperate conifer
  cover = mix(cover, 0.90, is6);   // boreal / taiga
  cover = mix(cover, 0.70, is7);   // tropical savanna
  cover = mix(cover, 0.80, is8);   // temperate grassland
  cover = mix(cover, 1.20, is9);   // flooded grassland
  cover = mix(cover, 0.80, is10);  // montane grassland
  cover = mix(cover, 0.80, is11);  // tundra
  cover = mix(cover, 0.40, is12);  // mediterranean
  cover = mix(cover, 0.10, is13);  // desert / xeric
  cover = mix(cover, 1.20, is14);  // mangroves

  // Mountain boundary: peaks above 2500 m suppress cloud formation,
  // fully cloud-free above 3000 m. The 500-m soft band keeps the edge
  // from looking stamped; the 19-tap blur outside softens it further.
  float mountainMask = 1.0 - smoothstep(2500.0, 3000.0, elevM);
  cover *= mountainMask;

  // Regional soot — wasteland cells get extra cover so cloud cover
  // thickens above the strike footprint. Branch is uniform-conditional;
  // zero cost when no scenario pushes regional soot.
  if (uSootRegionalWeight > 0.0) {
    float waste = texelFetch(uWastelandTex, tx, 0).r;
    cover += waste * uSootRegionalWeight * 0.8;
  }

  // Per-biome octave-weight profile. Default = W_TEMPERATE (ocean
  // plus the temperate-leaning land classes).
  vec4 weights = W_TEMPERATE;
  weights = mix(weights, W_TROPICAL, is1);
  weights = mix(weights, W_TROPICAL, is2);
  weights = mix(weights, W_TROPICAL, is3);
  weights = mix(weights, W_POLAR,    is6);
  weights = mix(weights, W_TROPICAL, is9);
  weights = mix(weights, W_POLAR,    is11);
  weights = mix(weights, W_ARID,     is12);
  weights = mix(weights, W_ARID,     is13);
  weights = mix(weights, W_TROPICAL, is14);

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
  // cos(lat), so smoothstep(0.10, 0.40, eastLen) fades wind to zero
  // inside ~6° of the pole and fully on outside ~24°. The fade band
  // is intentionally wider than the unstable ring (the lat-tangent
  // basis spins fast per-longitude within ~12° of the pole) so the
  // partial-wind / spinning-basis combination — which reads as a
  // scattered halo of mis-stretched cloud puffs — sits inside the
  // calm zone instead of being visible at the band edge.
  vec2 wind = sampleWindLatLon(segDir);
  vec3 east = vec3(-segDir.y, segDir.x, 0.0);
  float eastLen = length(east);
  east = (eastLen > 1e-3) ? east / eastLen : vec3(1.0, 0.0, 0.0);
  vec3 north = cross(segDir, east);
  float polarFade = smoothstep(0.10, 0.40, eastLen);
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

      // In-scattering: directly-lit term + ambient sky tint. Both
      // colours mix toward the soot tints when a nuclear-winter
      // scenario is active.
      vec3 sunC = mix(uSunColor, uSootSunTint, uSootGlobal);
      vec3 ambC = mix(uAmbientColor, uSootAmbientTint, uSootGlobal);
      vec3 inscatter = sunC * lightTransmit * phase * 4.0 * PI * mix(0.05, 1.0, wrap);
      inscatter += ambC * mix(0.20, 0.80, wrap);

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
// `uTime` in the shader feeds into a physically-honest wind integration:
// `wind_m_per_s × uTime × 1.566e-7 rad/s/m/s` (one radian per planet
// radius). At Earth scale that's so slow the eye can't see it — even
// jet-stream winds shift the pattern by < 0.1° per minute. Speed up
// the clock by this factor before handing it to the shader so the
// `advection` slider's defaults produce visible drift in real time.
const CLOUD_TIME_SCALE = 400;
// Cloud raymarch resolution divisor — render target is `canvas / N` per
// axis (so 1/N² of total pixels). 2 = half-res (4× speedup vs full),
// 4 = quarter-res (16× speedup vs full). Bilinear upsample softens
// cloud silhouettes at higher divisors — works well for fluffy
// procedural clouds, breaks down past ~4 where edges turn visibly
// blurry. Cost on High-tier hardware is absorbed; weaker tiers turn
// clouds off entirely via the autotune cascade in `debug/autotune.ts`,
// and the user can dial the canvas down via the settings render-scale
// slider, which shrinks the cloud target proportionally.
const CLOUD_RES_DIVISOR = 3;
// Initial uTime offset — pre-rolls the simulation so the first rendered
// frame already shows wind-streaked, mid-morph clouds rather than a
// pristine static noise field. At uTime=30000 the noise-space wind
// shift is already ~0.5 noise units in high-wind regions and the
// morph offset is ~9 noise units — well past the boring initial slice.
const INITIAL_TIME = 30000;
export class VolumetricCloudPass {
    /** Composite mesh — lives in the main scene at `renderOrder = 0`. Samples
     *  the half-res cloud target via the upsample shader and blends with the
     *  same premultiplied-alpha contract the raymarch wrote with. */
    mesh;
    material;
    cloudMaterial;
    cloudMesh;
    cloudsScene;
    compositeGeometry;
    cloudGeometry;
    halfResTarget;
    tmpInvViewProj = new THREE.Matrix4();
    tmpCameraPos = new THREE.Vector3();
    tmpClearColor = new THREE.Color();
    hasWindField = false;
    constructor(world) {
        const windField = world.getWindFieldTexture();
        this.hasWindField = windField !== null;
        const { nside, ordering } = world.getHealpixSpec();
        this.cloudMaterial = new THREE.RawShaderMaterial({
            glslVersion: THREE.GLSL3,
            vertexShader: CLOUDS_VERT,
            fragmentShader: `${CLOUD_NOISE}\n${healpixGlsl}\n${CLOUDS_FRAG}`,
            uniforms: {
                uWindField: { value: windField },
                uCameraPos: { value: new THREE.Vector3() },
                uSunDirection: { value: new THREE.Vector3(1, 0, 0.3).normalize() },
                uInvViewProj: { value: new THREE.Matrix4() },
                uTime: { value: INITIAL_TIME },
                uDensity: { value: DEFAULTS.materials.clouds.density },
                uCoverage: { value: DEFAULTS.materials.clouds.coverage },
                uBeer: { value: DEFAULTS.materials.clouds.beer },
                uHenyey: { value: DEFAULTS.materials.clouds.henyey },
                uAdvection: { value: DEFAULTS.materials.clouds.advection },
                uSunColor: { value: new THREE.Color(DEFAULTS.materials.clouds.sunColor) },
                uAmbientColor: { value: new THREE.Color(DEFAULTS.materials.clouds.ambientColor) },
                // Geo data — biome / temperature / moisture / elevation. The cloud
                // shader samples these via a 19-tap hex blur in `sampleBiomeProfile`,
                // so per-cell discontinuities are smeared over ~300 km before they
                // reach the cloud field (both opacity AND per-biome octave weights).
                // Elevation suppresses cover over high mountains (2500–3000 m fade
                // band; zero above 3000 m).
                uAttrStatic: { value: world.getAttributeTexture('elevation') },
                uElevationMeters: { value: world.getElevationMetersTexture() },
                // Same R8 wasteland texture the land + cities + highways shaders
                // sample — read here for the nuclear-winter regional cover bump.
                uWastelandTex: { value: world.getWastelandTexture() },
                uHealpixNside: { value: nside },
                uHealpixOrdering: { value: ordering === 'ring' ? 0 : 1 },
                uAttrTexWidth: { value: 4 * nside },
                uSootGlobal: { value: 0 },
                uSootRegionalWeight: { value: 0 },
                uSootSunTint: { value: new THREE.Color(1, 1, 1) },
                uSootAmbientTint: { value: new THREE.Color(1, 1, 1) },
                // Same metres → unit-sphere scale Land/Water use. Drives the cloud
                // shell altitude so the cloud base sits at exactly CLOUD_BASE_M
                // (see clouds.frag.glsl.ts) above the rendered sea-level radius.
                // MUST stay in sync with LandMaterial / WaterMaterial.
                uElevationScale: { value: DEFAULT_ELEVATION_SCALE },
            },
            // Rendering into the half-res target — we want raw color writes, no
            // blending against whatever was there before. The target is cleared
            // each frame so the first fragment hit just stamps its premultiplied
            // (col, alpha) into the pixel.
            //
            // NoBlending is essential here: the fragment outputs premultiplied
            // alpha (col is already weighted by per-step visibility). With the
            // default NormalBlending, gl.BLEND would multiply col by alpha a
            // second time and overwrite the alpha channel with alpha² — the
            // composite then re-applies its own One/OneMinusSrcAlpha over that
            // corrupted texel, producing dim "wisp" clouds with dark holes
            // where the partial-alpha math collapses.
            transparent: false,
            depthTest: false,
            depthWrite: false,
            blending: THREE.NoBlending,
        });
        this.cloudGeometry = new THREE.BufferGeometry();
        this.cloudGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
        this.cloudGeometry.setDrawRange(0, 3);
        this.cloudMesh = new THREE.Mesh(this.cloudGeometry, this.cloudMaterial);
        this.cloudMesh.frustumCulled = false;
        this.cloudsScene = new THREE.Scene();
        this.cloudsScene.add(this.cloudMesh);
        // Half-res render target — quartered pixel count is the FPS win this
        // pass exists to deliver. LinearFilter on the upsample is what makes
        // cloud silhouettes read as soft instead of staircased; bilinear
        // sampling of premultiplied alpha is mathematically correct (a tap
        // halfway between (col, alpha) and (0,0,0,0) gives (col/2, alpha/2),
        // which the One/OneMinusSrcAlpha composite then renders as
        // col/2 + bg*(1 - alpha/2) — exactly the correct soft edge with no
        // darkening artefact). Requires the half-res clear to be (0,0,0,0)
        // — see `renderHalfRes` for why we explicitly set clear-alpha=0.
        this.halfResTarget = new THREE.WebGLRenderTarget(1, 1, {
            type: THREE.UnsignedByteType,
            format: THREE.RGBAFormat,
            samples: 0,
            depthBuffer: false,
            stencilBuffer: false,
        });
        this.halfResTarget.texture.minFilter = THREE.LinearFilter;
        this.halfResTarget.texture.magFilter = THREE.LinearFilter;
        this.halfResTarget.texture.wrapS = THREE.ClampToEdgeWrapping;
        this.halfResTarget.texture.wrapT = THREE.ClampToEdgeWrapping;
        // Composite material — fullscreen quad that samples the half-res
        // target and blends onto the canvas. Same custom blend the raymarch
        // mesh used previously, so the visual result is unchanged apart from
        // the (intentional) softer half-res sampling.
        this.material = new THREE.RawShaderMaterial({
            glslVersion: THREE.GLSL3,
            vertexShader: CLOUDS_VERT,
            fragmentShader: CLOUDS_UPSAMPLE_FRAG,
            uniforms: {
                uCloudTex: { value: this.halfResTarget.texture },
            },
            transparent: true,
            depthTest: false,
            depthWrite: false,
            blending: THREE.CustomBlending,
            blendSrc: THREE.OneFactor,
            blendDst: THREE.OneMinusSrcAlphaFactor,
            blendSrcAlpha: THREE.OneFactor,
            blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
        });
        this.compositeGeometry = new THREE.BufferGeometry();
        this.compositeGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
        this.compositeGeometry.setDrawRange(0, 3);
        this.mesh = new THREE.Mesh(this.compositeGeometry, this.material);
        this.mesh.frustumCulled = false;
        this.mesh.renderOrder = 0;
        // Hidden by default until the scene graph turns the layer on AND
        // confirms a wind field is bound — see `setActive`.
        this.mesh.visible = false;
    }
    setSunDirection(dir) {
        this.cloudMaterial.uniforms.uSunDirection.value
            .copy(dir)
            .normalize();
    }
    /**
     * Toggle cloud rendering. If the bake didn't ship a wind field
     * (`size_bytes <= 32` placeholder), forced off — the shader has no
     * advection source and would just show a static noise field.
     */
    setActive(active) {
        this.mesh.visible = active && this.hasWindField;
    }
    setDensity(v) {
        this.cloudMaterial.uniforms.uDensity.value = v;
    }
    setCoverage(v) {
        this.cloudMaterial.uniforms.uCoverage.value = v;
    }
    setBeer(v) {
        this.cloudMaterial.uniforms.uBeer.value = v;
    }
    setHenyey(v) {
        this.cloudMaterial.uniforms.uHenyey.value = v;
    }
    setAdvection(v) {
        this.cloudMaterial.uniforms.uAdvection.value = v;
    }
    setElevationScale(v) {
        this.cloudMaterial.uniforms.uElevationScale.value = v;
    }
    setSunColor(css) {
        this.cloudMaterial.uniforms.uSunColor.value.set(css);
    }
    setAmbientColor(css) {
        this.cloudMaterial.uniforms.uAmbientColor.value.set(css);
    }
    /** Push per-frame soot contribution. Default zero = shader no-op. */
    setSootFrame(sootGlobal, sootRegionalWeight, sunTint, ambientTint) {
        this.cloudMaterial.uniforms.uSootGlobal.value = sootGlobal;
        this.cloudMaterial.uniforms.uSootRegionalWeight.value = sootRegionalWeight;
        this.cloudMaterial.uniforms.uSootSunTint.value.setRGB(sunTint.r, sunTint.g, sunTint.b);
        this.cloudMaterial.uniforms.uSootAmbientTint.value.setRGB(ambientTint.r, ambientTint.g, ambientTint.b);
    }
    /**
     * Refresh the view-ray reconstruction matrix + camera position. Call
     * once per frame from the scene graph (after `OrbitControls.update`)
     * so the ray reconstruction lines up with what the globe pass sees.
     */
    syncFromCamera(camera) {
        camera.getWorldPosition(this.tmpCameraPos);
        this.cloudMaterial.uniforms.uCameraPos.value.copy(this.tmpCameraPos);
        this.tmpInvViewProj.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        this.tmpInvViewProj.invert();
        this.cloudMaterial.uniforms.uInvViewProj.value.copy(this.tmpInvViewProj);
    }
    update(deltaSec) {
        this.cloudMaterial.uniforms.uTime.value += deltaSec * CLOUD_TIME_SCALE;
    }
    /**
     * Resize the cloud raymarch target. Call from the scene-graph's
     * `resize` hook with the canvas dimensions; the target is sized to
     * a fraction of each axis (1/CLOUD_RES_DIVISOR per axis → 1/N² total
     * pixel count).
     */
    setSize(width, height) {
        const w = Math.max(1, Math.floor(width / CLOUD_RES_DIVISOR));
        const h = Math.max(1, Math.floor(height / CLOUD_RES_DIVISOR));
        this.halfResTarget.setSize(w, h);
    }
    /**
     * Render the cloud raymarch into the half-res target. MUST be called
     * once per frame BEFORE the main scene renders, so the composite mesh
     * (which lives in the main scene) has fresh half-res cloud data when
     * its draw call lands. No-op when the layer is hidden.
     *
     * Clear contract: the target is cleared to (0,0,0,0) so any pixel the
     * raymarch `discard`s reads as fully transparent in the composite. We
     * have to set this explicitly because `WebGLRenderer` constructed with
     * the default `alpha: false` initializes `_clearAlpha = 1`, and the
     * cloudsScene has no `background`, so without this override every
     * empty pixel would be stamped as `(0,0,0,1)` — the composite then
     * sees `c.a = 1` everywhere outside cloud puffs and the One/
     * OneMinusSrcAlpha blend writes solid black across the framebuffer
     * (`src*1 + bg*(1-1) = src`), darkening the world below.
     */
    renderHalfRes(renderer, camera) {
        if (!this.mesh.visible)
            return;
        const prevTarget = renderer.getRenderTarget();
        const prevAutoClear = renderer.autoClear;
        const prevClearAlpha = renderer.getClearAlpha();
        renderer.getClearColor(this.tmpClearColor);
        renderer.setRenderTarget(this.halfResTarget);
        renderer.setClearColor(0x000000, 0);
        renderer.autoClear = true;
        renderer.clear(true, false, false);
        renderer.render(this.cloudsScene, camera);
        renderer.setClearColor(this.tmpClearColor, prevClearAlpha);
        renderer.autoClear = prevAutoClear;
        renderer.setRenderTarget(prevTarget);
    }
    dispose() {
        this.cloudGeometry.dispose();
        this.cloudMaterial.dispose();
        this.compositeGeometry.dispose();
        this.material.dispose();
        this.halfResTarget.dispose();
    }
}

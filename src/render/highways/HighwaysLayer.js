/**
 * Highways layer — merged ribbon mesh wrapping every kept road
 * polyline along the globe surface. Width is fixed in *screen pixels*
 * (Mapbox / Apple Maps approach), so roads stay thin from any zoom and
 * don't blow up to fat strips when zoomed in.
 *
 * The fragment shader paints a bright sharp core surrounded by a soft
 * warm halo at night (neon-tube look) and a thin dark trace by day.
 * Coastline-clipped via the same HEALPix id raster Land uses.
 *
 * Spatial bucketing: roads are split into NUM_LAT × NUM_LON buckets by
 * the first vertex's lat/lon. Each non-empty bucket becomes its own
 * Mesh with a proper boundingSphere, so Three.js frustum-culls the
 * back-hemisphere / off-screen buckets automatically. A single shared
 * ShaderMaterial drives all buckets — uniform updates apply once.
 *
 * Geometry packing (per bucket): each polyline vertex emits two ribbon
 * vertices with a signed unit world-space perpendicular (`aPerp`). The
 * vertex shader projects the centerline to clip space, finds the
 * screen-space direction of `aPerp`, and offsets in clip space by the
 * desired pixel count. Per-vertex `aKind` (0=major, 1=arterial,
 * 2=local, 3=local2) drives the width and brightness boost.
 * Cross-ribbon coordinate is reconstructed in the vertex shader from
 * `gl_VertexID` parity (even=+side, odd=-side). gl_VertexID is per-draw
 * in WebGL2, so the parity trick keeps working bucket-by-bucket.
 */
import * as THREE from 'three';
import { source as healpixGlsl } from '../globe/shaders/healpix.glsl.js';
import { source as hazeGlsl } from '../atmosphere/shaders/haze.glsl.js';
import { DEFAULT_ELEVATION_SCALE } from '../globe/LandMaterial.js';
const HIGHWAYS_VERT = `// Highways vertex shader.
//
// Each vertex carries a centerline position on the unit sphere plus a
// signed unit perpendicular (\`aPerp\`), a kind flag (\`aKind\`,
// 0=major, 1=arterial, 2=local, 3=local2), and the pre-baked elevation
// lift in metres (\`aLiftMeters\`, from
// web/src/render/util/elevation-lift-bake.ts — mirrors the same 9-tap
// blur + distance-field coast fade the older shader did per frame).
// The shader multiplies by \`uElevationScale\` so the altitude slider
// still works without a rebake.
//
// After lifting the centerline, applies a *screen-space* offset of
// half the kind's pixel width along the projected ribbon direction.
// This is the standard Mapbox / Apple Maps trick: the line keeps a
// constant on-screen width at every zoom.
//
// Cross-ribbon coordinate \`vU\` runs from +1 on one side to -1 on the
// other, recovered from gl_VertexID parity (even = +side, odd = -side)
// matching the geometry build order in HighwaysLayer.

precision highp float;
precision highp int;
precision highp sampler2D;

uniform float uElevationScale;
uniform float uHighwayRadialBiasM;

uniform vec2 uViewportSize;
uniform float uMajorWidthPx;
uniform float uArterialWidthPx;
uniform float uLocalWidthPx;
uniform float uLocal2WidthPx;
uniform float uDayCasingPx;
uniform float uDayFillScale;

in vec3 aPerp;
in float aKind;
in float aLiftMeters;
in float aRoadSeed;

out vec3 vSurfaceNormal;
out vec3 vWorldPos;
out float vKind;
out float vU;
out float vFillFrac;
out float vRoadSeed;

void main() {
  vKind = aKind;
  vRoadSeed = aRoadSeed;

  // Centerline direction. position is on the unit sphere by construction.
  vec3 centerline = position;
  vec3 dir = normalize(centerline);
  vSurfaceNormal = dir;

  // Lift = baked metres × slider scale; the bias is in metres too so it
  // tracks the slider in lock-step, preserving the depth-fight safety
  // margin at every factor.
  float landDisplace = aLiftMeters * uElevationScale;
  float radial = 1.0 + landDisplace + uHighwayRadialBiasM * uElevationScale;

  vec3 liftedCenter = dir * radial;

  // ---- Screen-space ribbon offset --------------------------------------
  // Project the lifted centerline to clip space. We then nudge the world
  // position by a tiny multiple of \`aPerp\`, project again, and take the
  // difference in pixel space. That gives us a *screen-space* unit vector
  // pointing along the ribbon's perpendicular — signed by aPerp's side.
  // Scaling by the kind's pixel half-width gives a constant on-screen
  // width at every zoom.
  vec4 clipCenter = projectionMatrix * modelViewMatrix * vec4(liftedCenter, 1.0);
  vec4 clipNudged = projectionMatrix * modelViewMatrix * vec4(liftedCenter + aPerp * 1.0e-3, 1.0);

  vec2 ndcA = clipCenter.xy / clipCenter.w;
  vec2 ndcB = clipNudged.xy / clipNudged.w;
  vec2 pxDiff = (ndcB - ndcA) * uViewportSize * 0.5;
  float pxLen = length(pxDiff);
  vec2 pxPerp = pxLen > 1.0e-6 ? pxDiff / pxLen : vec2(0.0);

  // Pick the visible width in pixels for this road's kind.
  // aKind: 0=major, 1=arterial, 2=local, 3=local2.
  float widthPx =
    (aKind < 0.5) ? uMajorWidthPx :
    (aKind < 1.5) ? uArterialWidthPx :
    (aKind < 2.5) ? uLocalWidthPx :
                    uLocal2WidthPx;
  // Cartographic casing: widen the ribbon by uDayCasingPx pixels on each
  // side beyond the road's nominal width. The inner |vU| < vFillFrac
  // region is the bright fill; the outer rim is the dark casing.
  float casingPx = max(uDayCasingPx, 0.0);
  float halfWidthPx = max(widthPx * 0.5 + casingPx, 0.5);
  // Day fill width = the road's nominal width × uDayFillScale, clamped so
  // it never exceeds the ribbon. Night ignores vFillFrac entirely, so this
  // knob is day-only.
  float fillPx = max(widthPx * uDayFillScale, 0.0);
  vFillFrac = clamp(fillPx / max(widthPx + 2.0 * casingPx, 1.0e-3), 0.0, 1.0);

  vec2 pxOffset = pxPerp * halfWidthPx;
  vec2 ndcOffset = pxOffset * 2.0 / uViewportSize;
  clipCenter.xy += ndcOffset * clipCenter.w;

  vWorldPos = liftedCenter; // for the coastline lookup in the fragment

  // Cross-ribbon coordinate, +1 on one side and -1 on the other. The
  // geometry build emits even-indexed vertices on the +perp side and
  // odd-indexed on the -perp side — gl_VertexID parity recovers it.
  vU = ((gl_VertexID & 1) == 0) ? 1.0 : -1.0;

  gl_Position = clipCenter;
}
`;
const HIGHWAYS_FRAG = `// Highways fragment shader.
//
// Cross-ribbon coordinate \`vU\` runs -1 → 0 → +1 across the ribbon
// (centerline at 0). \`u01 = abs(vU)\` is the normalized distance from the
// center, 0 at the bright filament and 1 at the outer halo edge.
//
// Night look — bright sharp core + soft warm halo, the "neon tube"
// profile. Brightness scales by \`uMajorBoost\` for major roads.
// Day look — thin dark warm-grey trace that fades to nothing at the
// halo's edge so it reads as a delicate outline on the land instead of
// a flat painted bar.
// Coastline-clipped via the same HEALPix id raster Land + Cities use.

precision highp float;
precision highp int;
precision highp sampler2D;

in vec3 vSurfaceNormal;
in vec3 vWorldPos;
in float vKind;
in float vU;
in float vFillFrac;
in float vRoadSeed;

uniform vec3 uSunDirection;

uniform sampler2D uIdRaster;
uniform sampler2D uWastelandTex;
uniform sampler2D uInfraLossTex;
uniform int uHealpixNside;
uniform int uHealpixOrdering;
uniform int uAttrTexWidth;

uniform float uNightBrightness;
uniform float uMajorBoost;
uniform float uArterialBoost;
uniform float uLocalBoost;
uniform float uLocal2Boost;
uniform float uCoreWidth;
uniform float uCoreBoost;
uniform float uHaloStrength;
uniform float uHaloFalloff;
uniform float uDayStrength;
uniform float uDayCasingStrength;
uniform float uDayFillBrightness;
uniform float uOpacity;

uniform vec3 uNightColor;
uniform vec3 uDayCasingColor;
uniform vec3 uDayFillColor;

// uSkyView, uHazeExposure, uHazeAmount + sampleSkyViewHaze() are declared
// by the concatenated haze.glsl.ts chunk above this source.

out vec4 fragColor;

float seedToThreshold(float seed) {
  float h = fract(sin(seed * 12.9898 + 78.233) * 43758.5453);
  // Skewed toward the low end so most roads only reappear once wasteland
  // is mostly gone — stretches the recovery tail without slowing decay.
  return mix(0.0, 0.5, h);
}

void main() {
  // Coastline clip — sample the HEALPix id raster at the centerline
  // surface point. Same mask the land shader uses.
  vec3 sphereDir = normalize(vWorldPos);
  float phi = atan(sphereDir.y, sphereDir.x);
  int ipx = healpixZPhiToPix(uHealpixNside, uHealpixOrdering, sphereDir.z, phi);
  ivec2 tx = healpixIpixToTexel(ipx, uAttrTexWidth);
  if (isOceanIdTexel(texelFetch(uIdRaster, tx, 0))) discard;

  // Wasteland kill — per-polyline threshold sweeps as wasteland decays
  // (sampled per-fragment so road segments near the impact discard
  // while distant segments of the same polyline keep drawing).
  // Climate destruction (flooded coast, glaciated polygons) feeds the
  // parallel infrastructure_loss field; both gate the same threshold.
  float wasteland = texelFetch(uWastelandTex, tx, 0).r;
  float infra = texelFetch(uInfraLossTex, tx, 0).r;
  if (max(wasteland, infra) > seedToThreshold(vRoadSeed)) discard;

  // Cross-ribbon distance, 0 at center, 1 at edge.
  float u01 = clamp(abs(vU), 0.0, 1.0);

  // Sharp inner core (the bright filament) + soft outer halo (the glow).
  float core = 1.0 - smoothstep(0.0, max(uCoreWidth, 0.001), u01);
  float halo = pow(max(1.0 - u01, 0.0), max(uHaloFalloff, 0.001));

  // Per-kind brightness boost. vKind: 0=major, 1=arterial, 2=local, 3=local2.
  float kindFactor =
    (vKind < 0.5) ? uMajorBoost :
    (vKind < 1.5) ? uArterialBoost :
    (vKind < 2.5) ? uLocalBoost :
                    uLocal2Boost;

  // ---- Night --------------------------------------------------------
  float nightProfile = core * uCoreBoost + halo * uHaloStrength;
  vec3 nightCol = uNightColor * uNightBrightness * kindFactor * nightProfile;
  float nightAlpha = clamp(nightProfile, 0.0, 1.0);

  // ---- Day ---------------------------------------------------------
  // Cartographic casing: the ribbon was widened in the vertex shader by
  // uDayCasingPx pixels per side. The inner fraction (|vU| < vFillFrac)
  // is the bright fill — i.e. the road itself. The outer rim
  // (vFillFrac < |vU| < 1) is the dark casing painted in the extra
  // pixels. When uDayCasingPx = 0, vFillFrac = 1 and the casing region
  // vanishes (bright fill across the whole road, no outline).
  vec3 casingCol = uDayCasingColor;
  vec3 fillCol   = uDayFillColor * clamp(uDayFillBrightness, 0.0, 1.5);
  float fillEdge = clamp(vFillFrac, 0.0, 1.0);
  float fillMask = 1.0 - smoothstep(max(fillEdge - 0.05, 0.0), fillEdge, u01);
  float casingMask = (1.0 - fillMask) * (1.0 - smoothstep(0.92, 1.0, u01));
  vec3 dayCol = mix(casingCol, fillCol, fillMask);
  float dayAlpha = clamp((fillMask + casingMask * uDayCasingStrength) * uDayStrength, 0.0, 1.0);

  // Day/night wrap (same shape as the cities + land terminator).
  float wrap = smoothstep(-0.05, 0.15, dot(vSurfaceNormal, normalize(uSunDirection)));
  vec3 col = mix(nightCol, dayCol, wrap);
  float alpha = mix(nightAlpha, dayAlpha, wrap) * uOpacity;

  if (alpha < 0.005) discard;

  // ----- Aerial perspective (haze) -----
  // Same formula as land/water: tint toward the inscattered LUT colour
  // with the 1 - exp(-lum*6) curve so haze and rim halo agree at the
  // silhouette. Direction is camera→fragment.
  if (uHazeAmount > 0.0) {
    vec3 dirCS = normalize(vWorldPos - cameraPosition);
    vec3 hazeColor = sampleSkyViewHaze(dirCS, cameraPosition, normalize(uSunDirection)) * uHazeExposure;
    float lum = dot(hazeColor, vec3(0.2126, 0.7152, 0.0722));
    float hazeStrength = clamp((1.0 - exp(-lum * 6.0)) * uHazeAmount, 0.0, 0.95);
    col = mix(col, hazeColor, hazeStrength);
  }

  fragColor = vec4(col, alpha);
}
`;
import { bakeLiftMeters, } from '../util/elevation-lift-bake.js';
import { DEFAULTS } from '../../debug/defaults.js';
/**
 * Spatial bucket grid. 4 lat bands × 8 lon bands = 32 buckets, ~45°×45°
 * each. Coarse enough to keep draw-call overhead negligible, fine enough
 * that the back hemisphere (~half the buckets) frustum-culls cleanly.
 */
const NUM_LAT_BUCKETS = 4;
const NUM_LON_BUCKETS = 8;
/**
 * Radial nudge applied on top of the matched land-displacement lift, in
 * metres of equivalent elevation. The shader multiplies by
 * `uElevationScale` so the bias tracks the altitude-exaggeration slider:
 * land and road lift in lock-step at every slider setting, so the
 * safety margin never gets out-paced as the slider grows.
 *
 * Covers the worst-case linear-interpolation gap between the icosphere
 * land mesh (which interpolates elevation linearly across each ~3 km
 * triangle) and the road's point-sample of elevation. On steep slopes
 * that gap is a few hundred metres; 280 m wins the depth fight in
 * almost every case while keeping the road visually flush at orbital
 * zoom. Bump up to fight more residual patches at the cost of visible
 * float at close zoom; bump down to glue tighter at the cost of patches
 * returning. Same metres-based convention as the airplane shaders'
 * `uRadialBiasM`.
 */
const DEFAULT_HIGHWAY_RADIAL_BIAS_M = 280;
const DEG = Math.PI / 180;
function latLonToUnit(out, latDeg, lonDeg) {
    const lat = latDeg * DEG;
    const lon = lonDeg * DEG;
    const cosLat = Math.cos(lat);
    return out.set(cosLat * Math.cos(lon), cosLat * Math.sin(lon), Math.sin(lat));
}
/**
 * Stable [0, 1) hash of a lat/lon pair — used as a per-polyline seed so
 * wasteland recovery thresholds are reproducible across page reloads.
 * Two polylines starting at distinct first vertices land on distinct
 * seeds; the GLSL `seedToThreshold` then maps that into [0.05, 0.95].
 */
function hashLatLonToUnit(latDeg, lonDeg) {
    const v = Math.sin(latDeg * 12.9898 + lonDeg * 78.233) * 43758.5453;
    return v - Math.floor(v);
}
/**
 * Hemisphere-visibility threshold for bucket meshes: a bucket is shown
 * when `dot(bucketCentroidDir, cameraDir) > HEMISPHERE_THRESHOLD`. 0.0
 * is strict front-hemisphere — the bucket's centroid must lie on the
 * camera-facing half of the sphere. Three's frustum culling can't help
 * here: back-hemisphere buckets are inside the FOV cone but occluded
 * by the globe in front; this CPU-side test is what actually drops
 * their draw call + vertex stage.
 *
 * Why CPU per-bucket and not a per-vertex GPU cull: ribbon triangles
 * span the limb, and culling individual vertices yanks them to a clip-
 * volume corner while their triangle-mates stay at the limb. The
 * surviving triangle stretches from the horizon into the sky as a long
 * air line. Per-bucket toggles either all or none of a draw, so the
 * limb stays clean.
 */
const HEMISPHERE_THRESHOLD = 0.0;
export class HighwaysLayer {
    group;
    uniforms;
    material;
    geometries = [];
    buckets = [];
    drawableCount = 0;
    layerActive = true;
    constructor(world, roads) {
        const { nside, ordering } = world.getHealpixSpec();
        this.group = new THREE.Group();
        const h = DEFAULTS.materials.highways;
        this.uniforms = {
            uSunDirection: { value: new THREE.Vector3(1, 0, 0.3).normalize() },
            uIdRaster: { value: world.getIdRaster() },
            uWastelandTex: { value: world.getWastelandTexture() },
            uInfraLossTex: { value: world.getDynamicAttributeTexture('infrastructure_loss') },
            uHealpixNside: { value: nside },
            uHealpixOrdering: { value: ordering === 'ring' ? 0 : 1 },
            uAttrTexWidth: { value: 4 * nside },
            uElevationScale: { value: DEFAULT_ELEVATION_SCALE },
            uHighwayRadialBiasM: { value: DEFAULT_HIGHWAY_RADIAL_BIAS_M },
            // Viewport stays at 1×1 until scene-graph wires the canvas size in.
            // Until then the ribbon is degenerate (one-pixel-wide); the resize
            // path runs on first frame so the wrong-size window is never seen.
            uViewportSize: { value: new THREE.Vector2(1, 1) },
            uMajorWidthPx: { value: h.majorWidthPx },
            uArterialWidthPx: { value: h.arterialWidthPx },
            uLocalWidthPx: { value: h.localWidthPx },
            uLocal2WidthPx: { value: h.local2WidthPx },
            uNightBrightness: { value: h.nightBrightness },
            uMajorBoost: { value: h.majorBoost },
            uArterialBoost: { value: h.arterialBoost },
            uLocalBoost: { value: h.localBoost },
            uLocal2Boost: { value: h.local2Boost },
            uCoreWidth: { value: h.coreWidth },
            uCoreBoost: { value: h.coreBoost },
            uHaloStrength: { value: h.haloStrength },
            uHaloFalloff: { value: h.haloFalloff },
            uDayStrength: { value: h.dayStrength },
            uDayCasingPx: { value: h.dayCasingPx },
            uDayCasingStrength: { value: h.dayCasingStrength },
            uDayFillBrightness: { value: h.dayFillBrightness },
            uDayFillScale: { value: h.dayFillScale },
            uOpacity: { value: h.opacityNear },
            uNightColor: { value: new THREE.Color(h.nightColor) },
            uDayCasingColor: { value: new THREE.Color(h.dayCasingColor) },
            uDayFillColor: { value: new THREE.Color(h.dayFillColor) },
            uSkyView: { value: null },
            uHazeExposure: { value: 1.0 },
            uHazeAmount: { value: 0.0 },
        };
        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            glslVersion: THREE.GLSL3,
            // Both stages call into healpix.glsl: vertex for the elevation
            // lift, fragment for the coastline mask. Concatenate the helper
            // module ourselves — ShaderMaterial doesn't process #include.
            vertexShader: `${healpixGlsl}\n${HIGHWAYS_VERT}`,
            fragmentShader: `${healpixGlsl}\n${hazeGlsl}\n${HIGHWAYS_FRAG}`,
            transparent: true,
            depthWrite: false,
            depthTest: true,
        });
        // Bucket roads by the first vertex's lat/lon, then build one
        // BufferGeometry + Mesh per non-empty bucket.
        const distFieldTex = world.getDistanceFieldTexture();
        const coastFade = distFieldTex
            ? {
                kind: 'distance-field',
                // DataTexture's image.data is typed as a byte view in Three's
                // d.ts, but for HalfFloatType + RGFormat the underlying buffer
                // is actually a Uint16Array (one half-float per channel). The
                // DistanceFieldTexture loader constructs it as one.
                data: distFieldTex.image.data,
                width: distFieldTex.image.width,
                height: distFieldTex.image.height,
            }
            : // Degrade to "fully on land everywhere" — same fallback the
                // shader used to do when the distance-field artifact didn't ship.
                // Ocean-count-8 effectively pulls the same trick for cells with
                // no ocean neighbours, which is true for every interior land
                // vertex anyway.
                { kind: 'ocean-count-8' };
        const liftCtx = {
            world,
            nside,
            ordering,
            coastFade,
        };
        const roadBuckets = bucketRoads(roads);
        for (const bucket of roadBuckets) {
            if (bucket.length === 0)
                continue;
            const built = buildRibbonGeometry(bucket, liftCtx);
            if (built === null)
                continue;
            const mesh = new THREE.Mesh(built.geometry, this.material);
            mesh.renderOrder = -1;
            // frustumCulled stays true (default), but Three's frustum check
            // cannot drop back-of-globe buckets (they're occluded, not
            // outside the FOV cone) — `update(cameraDir)` does that work
            // per frame via the centroid-direction hemisphere test.
            this.geometries.push(built.geometry);
            this.buckets.push({ mesh, centroidDir: built.centroidDir });
            this.group.add(mesh);
            this.drawableCount++;
        }
        if (this.drawableCount === 0) {
            this.group.visible = false;
        }
    }
    setSunDirection(dir) {
        this.uniforms.uSunDirection.value.copy(dir);
    }
    setActive(active) {
        this.layerActive = active;
        this.group.visible = active && this.drawableCount > 0;
    }
    /**
     * Per-frame hemisphere visibility update. Toggles each bucket mesh's
     * `.visible` based on whether its centroid direction faces the camera.
     * Skips when the layer is off — `setActive(false)` already hid the
     * group, so the per-bucket flags don't matter.
     *
     * `cameraDir` is the unit vector from the globe centre to the camera.
     */
    update(cameraDir) {
        if (!this.layerActive)
            return;
        for (const b of this.buckets) {
            const d = b.centroidDir.x * cameraDir.x +
                b.centroidDir.y * cameraDir.y +
                b.centroidDir.z * cameraDir.z;
            b.mesh.visible = d > HEMISPHERE_THRESHOLD;
        }
    }
    setElevationScale(v) {
        this.uniforms.uElevationScale.value = v;
    }
    setViewportSize(width, height) {
        this.uniforms.uViewportSize.value.set(Math.max(1, width), Math.max(1, height));
    }
    dispose() {
        for (const g of this.geometries)
            g.dispose();
        this.geometries.length = 0;
        this.buckets.length = 0;
        this.material.dispose();
    }
}
function bucketRoads(roads) {
    const out = [];
    for (let i = 0; i < NUM_LAT_BUCKETS * NUM_LON_BUCKETS; i++)
        out.push([]);
    for (const r of roads) {
        if (r.vertices.length < 2)
            continue;
        const lat = r.vertices[0][0];
        const lon = r.vertices[0][1];
        const latBin = Math.min(NUM_LAT_BUCKETS - 1, Math.max(0, Math.floor((lat + 90) / (180 / NUM_LAT_BUCKETS))));
        const lonBin = Math.min(NUM_LON_BUCKETS - 1, Math.max(0, Math.floor((lon + 180) / (360 / NUM_LON_BUCKETS))));
        out[latBin * NUM_LON_BUCKETS + lonBin].push(r);
    }
    return out;
}
/**
 * Build one merged BufferGeometry covering every polyline in this
 * bucket. For each polyline of N vertices we emit 2N vertices (rungs)
 * and 2(N-1) triangles.
 *
 * Per-vertex attributes:
 *   position — centerline point on the unit sphere (vertex shader adds
 *              the elevation lift on top via a 9-tap blur, then offsets
 *              in clip space by the screen-space direction of `aPerp` ×
 *              pixel width)
 *   aPerp    — signed unit perpendicular to the local tangent on the
 *              sphere; +perp on one ribbon side, -perp on the other.
 *              Magnitude is irrelevant — only the direction matters; the
 *              vertex shader uses it as a tiny world-space nudge to find
 *              the screen-space ribbon direction.
 *   aKind    — 0.0=major, 1.0=arterial, 2.0=local, 3.0=local2. Picks the
 *              width uniform and feeds the per-kind brightness boost.
 *
 * Cross-ribbon coordinate (`vU` in the vertex shader) is reconstructed
 * from `gl_VertexID` parity: even-indexed vertex = +1 side, odd = -1 side.
 * The build order below is what makes that hold.
 *
 * Also returns the bucket's mean centroid direction (unit vector from
 * origin to the average centerline position) — used by the layer's
 * per-frame hemisphere-visibility test.
 *
 * Returns null if the bucket has no drawable triangles.
 */
function buildRibbonGeometry(roads, liftCtx) {
    // Two passes: one to size the buffers, one to fill them.
    let totalVerts = 0;
    let totalTris = 0;
    for (const r of roads) {
        const n = r.vertices.length;
        if (n < 2)
            continue;
        totalVerts += n * 2;
        totalTris += (n - 1) * 2;
    }
    if (totalTris === 0)
        return null;
    const positions = new Float32Array(totalVerts * 3);
    const perps = new Float32Array(totalVerts * 3);
    const kinds = new Float32Array(totalVerts);
    // Per-vertex baked elevation lift in metres (max(elev,0) × coastFade);
    // the shader multiplies by uElevationScale so the altitude slider
    // still works without rebake.
    const lifts = new Float32Array(totalVerts);
    // Per-polyline seed in [0, 1]; the fragment shader hashes it to a
    // wasteland-threshold so roads pop back at different decay points.
    // Same value for every vertex of a polyline so the threshold doesn't
    // alias along the ribbon's length.
    const roadSeeds = new Float32Array(totalVerts);
    // Use a 32-bit index buffer — 16-bit caps at 65k vertices and a real
    // bake easily exceeds that even after bucketing.
    const indices = new Uint32Array(totalTris * 3);
    // Reusable vectors so the build loop doesn't allocate per vertex.
    const pPrev = new THREE.Vector3();
    const pCur = new THREE.Vector3();
    const pNext = new THREE.Vector3();
    const tIn = new THREE.Vector3();
    const tOut = new THREE.Vector3();
    const tangent = new THREE.Vector3();
    const perp = new THREE.Vector3();
    const radialOut = new THREE.Vector3();
    let vi = 0; // vertex write head
    let ii = 0; // index buffer write head
    // Track bbox for the boundingSphere.
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    for (const r of roads) {
        const verts = r.vertices;
        const n = verts.length;
        if (n < 2)
            continue;
        const kindFloat = r.kind === 'major' ? 0.0
            : r.kind === 'arterial' ? 1.0
                : r.kind === 'local' ? 2.0
                    : /* local2 */ 3.0;
        // Stable per-polyline seed from the first vertex's lat/lon — same
        // value every page load (no Math.random), so wasteland recovery
        // patterns are reproducible run-to-run.
        const roadSeed = hashLatLonToUnit(verts[0][0], verts[0][1]);
        const baseV = vi;
        for (let i = 0; i < n; i++) {
            latLonToUnit(pCur, verts[i][0], verts[i][1]);
            // Tangent at vertex i: average of incoming + outgoing edge directions.
            // Endpoints use whichever single edge they have.
            tangent.set(0, 0, 0);
            if (i > 0) {
                latLonToUnit(pPrev, verts[i - 1][0], verts[i - 1][1]);
                tIn.subVectors(pCur, pPrev).normalize();
                tangent.add(tIn);
            }
            if (i < n - 1) {
                latLonToUnit(pNext, verts[i + 1][0], verts[i + 1][1]);
                tOut.subVectors(pNext, pCur).normalize();
                tangent.add(tOut);
            }
            if (tangent.lengthSq() < 1e-12) {
                // Degenerate (consecutive identical coords); pick anything orthogonal.
                tangent.set(1, 0, 0);
            }
            tangent.normalize();
            radialOut.copy(pCur).normalize();
            perp.crossVectors(tangent, radialOut).normalize();
            const px = pCur.x;
            const py = pCur.y;
            const pz = pCur.z;
            if (px < minX)
                minX = px;
            if (px > maxX)
                maxX = px;
            if (py < minY)
                minY = py;
            if (py > maxY)
                maxY = py;
            if (pz < minZ)
                minZ = pz;
            if (pz > maxZ)
                maxZ = pz;
            // One 9-tap lift bake per centerline point; copied into both
            // ribbon verts (the +perp and -perp twins share the same
            // centerline position, so they share the same lift).
            const liftM = bakeLiftMeters(px, py, pz, liftCtx);
            // +perp side (centerline + unit perp; vertex shader scales to pixels)
            positions[vi * 3] = px;
            positions[vi * 3 + 1] = py;
            positions[vi * 3 + 2] = pz;
            perps[vi * 3] = perp.x;
            perps[vi * 3 + 1] = perp.y;
            perps[vi * 3 + 2] = perp.z;
            kinds[vi] = kindFloat;
            lifts[vi] = liftM;
            roadSeeds[vi] = roadSeed;
            vi++;
            // -perp side (same centerline, opposite perp). Even index = +perp,
            // odd index = -perp — the vertex shader reads gl_VertexID parity to
            // recover the cross-ribbon coordinate without a separate attribute.
            positions[vi * 3] = px;
            positions[vi * 3 + 1] = py;
            positions[vi * 3 + 2] = pz;
            perps[vi * 3] = -perp.x;
            perps[vi * 3 + 1] = -perp.y;
            perps[vi * 3 + 2] = -perp.z;
            kinds[vi] = kindFloat;
            lifts[vi] = liftM;
            roadSeeds[vi] = roadSeed;
            vi++;
        }
        // Triangulate consecutive rungs into two-triangle quads.
        for (let i = 0; i < n - 1; i++) {
            const a = baseV + i * 2; // +perp at i
            const b = baseV + i * 2 + 1; // -perp at i
            const c = baseV + (i + 1) * 2; // +perp at i+1
            const d = baseV + (i + 1) * 2 + 1; // -perp at i+1
            indices[ii++] = a;
            indices[ii++] = c;
            indices[ii++] = b;
            indices[ii++] = b;
            indices[ii++] = c;
            indices[ii++] = d;
        }
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('aPerp', new THREE.BufferAttribute(perps, 3));
    geom.setAttribute('aKind', new THREE.BufferAttribute(kinds, 1));
    geom.setAttribute('aLiftMeters', new THREE.BufferAttribute(lifts, 1));
    geom.setAttribute('aRoadSeed', new THREE.BufferAttribute(roadSeeds, 1));
    geom.setIndex(new THREE.BufferAttribute(indices, 1));
    // Bounding sphere over this bucket's centerline positions, slightly
    // inflated to cover the elevation lift + radial bias and the
    // screen-space ribbon offset (which projects out beyond the centerline
    // by ≤ a few pixels in clip space — irrelevant at world-space radius
    // 1, so 1e-2 headroom is generous).
    const cx = (minX + maxX) * 0.5;
    const cy = (minY + maxY) * 0.5;
    const cz = (minZ + maxZ) * 0.5;
    let rSq = 0;
    for (let i = 0; i < totalVerts; i++) {
        const dx = positions[i * 3] - cx;
        const dy = positions[i * 3 + 1] - cy;
        const dz = positions[i * 3 + 2] - cz;
        const d = dx * dx + dy * dy + dz * dz;
        if (d > rSq)
            rSq = d;
    }
    const radius = Math.sqrt(rSq) + 1e-2;
    geom.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, cy, cz), radius);
    // Mean direction from origin → centerline cloud, normalised. Each
    // position pair (the +perp and -perp twin) shares the same centerline
    // so summing all `totalVerts` positions is equivalent to summing each
    // centerline twice — direction is unchanged after normalise.
    let sx = 0, sy = 0, sz = 0;
    for (let i = 0; i < totalVerts; i++) {
        sx += positions[i * 3];
        sy += positions[i * 3 + 1];
        sz += positions[i * 3 + 2];
    }
    const slen = Math.max(1e-9, Math.sqrt(sx * sx + sy * sy + sz * sz));
    const centroidDir = new THREE.Vector3(sx / slen, sy / slen, sz / slen);
    return { geometry: geom, centroidDir };
}

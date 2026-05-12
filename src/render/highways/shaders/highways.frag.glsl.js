// Inlined from highways.frag.glsl. Edit the GLSL inside the template literal —
// the source of truth lives here, no separate .glsl file on disk.
export const source = `// Highways fragment shader.
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

uniform vec3 uSunDirection;

uniform sampler2D uIdRaster;
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

out vec4 fragColor;

void main() {
  // Coastline clip — sample the HEALPix id raster at the centerline
  // surface point. Same mask the land shader uses.
  vec3 sphereDir = normalize(vWorldPos);
  float phi = atan(sphereDir.y, sphereDir.x);
  int ipx = healpixZPhiToPix(uHealpixNside, uHealpixOrdering, sphereDir.z, phi);
  ivec2 tx = healpixIpixToTexel(ipx, uAttrTexWidth);
  if (isOceanIdTexel(texelFetch(uIdRaster, tx, 0))) discard;

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
  vec3 warmTungsten = vec3(1.0, 0.85, 0.55);
  float nightProfile = core * uCoreBoost + halo * uHaloStrength;
  vec3 nightCol = warmTungsten * uNightBrightness * kindFactor * nightProfile;
  float nightAlpha = clamp(nightProfile, 0.0, 1.0);

  // ---- Day ---------------------------------------------------------
  // Cartographic casing: the ribbon was widened in the vertex shader by
  // uDayCasingPx pixels per side. The inner fraction (|vU| < vFillFrac)
  // is the bright fill — i.e. the road itself. The outer rim
  // (vFillFrac < |vU| < 1) is the dark casing painted in the extra
  // pixels. When uDayCasingPx = 0, vFillFrac = 1 and the casing region
  // vanishes (bright fill across the whole road, no outline).
  vec3 casingCol = vec3(0.18, 0.16, 0.14);
  vec3 fillCol   = vec3(0.96, 0.94, 0.88) * clamp(uDayFillBrightness, 0.0, 1.5);
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
  fragColor = vec4(col, alpha);
}
`;

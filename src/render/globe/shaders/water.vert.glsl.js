// Inlined from water.vert.glsl. Edit the GLSL inside the template literal —
// the source of truth lives here, no separate .glsl file on disk.
export const source = `// Water vertex shader — displaces every vertex to (water-surface +
// Gerstner-wave) elevation. The base water surface comes from
// \`uWaterLevelMeters\` (R16F, half-float metres; v1 init = 0 = sea level).
// The wave term is computed by \`waterWaves()\` (water_waves.glsl), summing
// 4 sinusoids on the un-displaced direction so phase is stable across
// frames at any zoom.
//
// Wave amplitude is attenuated by \`coastFade\` (a smoothstep over water
// depth = waterLevel - landElev) so coastlines stay calm and only deep
// open water swells.
//
// \`vSphereDir\` carries the un-displaced direction so the fragment shader
// can re-look-up its HEALPix cell + recompute the analytic wave normal
// without drift from the displaced position. \`vWaterSurface\` carries the
// metres value the fragment shader uses for depth tint and discard logic.
// \`vWorldPos\` carries the actual displaced world position for view-vector
// lookups (Fresnel + sun glint).

precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D uWaterLevelMeters;
uniform sampler2D uElevationMeters;
uniform int uHealpixNside;
uniform int uHealpixOrdering;
uniform int uAttrTexWidth;
uniform float uElevationScale;
uniform float uWaterRadialBias;

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

  int ipx = healpixZPhiToPix(uHealpixNside, uHealpixOrdering, dir.z, atan(dir.y, dir.x));
  ivec2 tx = healpixIpixToTexel(ipx, uAttrTexWidth);
  float waterLevel = texelFetch(uWaterLevelMeters, tx, 0).r;
  float landElev = texelFetch(uElevationMeters, tx, 0).r;
  vWaterSurface = waterLevel;

  float depth = max(waterLevel - landElev, 0.0);
  float coastFade = smoothstep(0.0, 400.0, depth);
  float ampAtt = uWaveAmplitude * coastFade;

  float waveRadialM;
  vec3 waveTangent;
  vec3 waveNormal_;
  waterWaves(
    dir,
    uTime * uWaveSpeed,
    ampAtt,
    uWaveSteepness,
    uElevationScale,
    waveRadialM,
    waveTangent,
    waveNormal_
  );

  float displace = (waterLevel + waveRadialM) * uElevationScale + uWaterRadialBias;
  vec3 surfaceObj = dir * (1.0 + displace) + waveTangent;
  vec4 wp = modelMatrix * vec4(surfaceObj, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

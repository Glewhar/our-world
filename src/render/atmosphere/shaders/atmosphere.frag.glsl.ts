// Inlined from atmosphere.frag.glsl. Edit the GLSL inside the template literal —
// the source of truth lives here, no separate .glsl file on disk.
export const source = `// Runtime atmosphere fragment shader (GLSL3). Hillaire 2020-style
// precomputed-LUT lookup + sun disk.
//
// The pass is a fullscreen triangle (see \`fullscreen.vert.glsl\`) drawn at
// \`renderOrder=1\` with \`depthTest=true\`. The vertex shader emits at the far
// plane so the depth test passes only where no opaque geometry was drawn —
// the rendered terrain silhouette punches through the halo. Alpha is 1
// where the line of sight passes only through atmosphere, fading to ~0 if
// the ray exits without hitting anything (deep space) — but we keep alpha
// slightly above 0 so the rim isn't crushed against the dark background.

precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uSkyView;
uniform sampler2D uTransmittance;
uniform vec3 uCameraPos;       // world-space, planet at origin
uniform vec3 uSunDirection;    // world-space, normalised
uniform mat4 uInvViewProj;     // inverse(projection * view)
uniform float uExposure;
uniform float uSunDiskAngle;   // radians (cos threshold derived in shader)
uniform vec3 uSolarIrradiance;

void cameraBasisRuntime(vec3 cam, vec3 sunDir, out vec3 cUp, out vec3 cAzRef, out vec3 cTangent) {
  cUp = normalize(cam);
  vec3 sunInPlane = sunDir - dot(sunDir, cUp) * cUp;
  float l = length(sunInPlane);
  cAzRef = (l > 1e-4)
    ? sunInPlane / l
    : normalize(cross(cUp, vec3(1.0, 0.0, 0.0)));
  cTangent = cross(cUp, cAzRef);
}

void main() {
  // Reconstruct world-space view ray from screen UV.
  vec4 ndcNear = vec4(vUv * 2.0 - 1.0, -1.0, 1.0);
  vec4 ndcFar  = vec4(vUv * 2.0 - 1.0,  1.0, 1.0);
  vec4 wn = uInvViewProj * ndcNear;
  vec4 wf = uInvViewProj * ndcFar;
  vec3 worldNear = wn.xyz / wn.w;
  vec3 worldFar = wf.xyz / wf.w;
  vec3 dir = normalize(worldFar - worldNear);

  // Project view dir into camera-local (up, az-ref-toward-sun, tangent) frame.
  vec3 cUp, cAzRef, cTangent;
  cameraBasisRuntime(uCameraPos, uSunDirection, cUp, cAzRef, cTangent);

  float zenith = acos(clamp(dot(dir, cUp), -1.0, 1.0));
  float az = atan(dot(dir, cTangent), dot(dir, cAzRef));
  if (az < 0.0) az += 2.0 * PI;

  // Match the sky-view LUT's non-linear zenith parameterization: samples
  // are clustered around the camera's horizon so a thin atmosphere shell
  // occupies enough LUT pixels to survive bilinear filtering. Both shaders
  // must compute horizonZ identically from uCameraPos.
  float r0 = length(uCameraPos);
  float s0 = clamp(PLANET_RADIUS / r0, 0.0, 1.0);
  float horizonZ = PI - asin(s0);
  float vCoord;
  if (zenith < horizonZ) {
    float t = sqrt(max(0.0, 1.0 - zenith / horizonZ));
    vCoord = 0.5 - 0.5 * t;
  } else {
    float t = sqrt(clamp((zenith - horizonZ) / (PI - horizonZ), 0.0, 1.0));
    vCoord = 0.5 + 0.5 * t;
  }
  vec2 lutUv = vec2(az / (2.0 * PI), vCoord);
  vec3 sky = texture(uSkyView, lutUv).rgb;

  // Sun disk: visible if cosTheta with sun > cos(uSunDiskAngle), modulated by
  // transmittance from camera through atmosphere along the view ray.
  float cosTheta = dot(dir, uSunDirection);
  float cosDisk = cos(uSunDiskAngle);
  if (cosTheta > cosDisk) {
    float edge = smoothstep(cosDisk, cosDisk + 0.0008, cosTheta);
    // Transmittance from camera to sun along view ray. Approximate by
    // sampling LUT at camera altitude × view-zenith (μ = dot(dir, cUp)).
    float r = length(uCameraPos);
    // Camera is outside atmosphere; clamp h to atmosphere radius for LUT.
    float h = min(r, uAtmosphereRadius);
    float mu = clamp(dot(dir, cUp), -1.0, 1.0);
    vec3 T = sampleTransmittance(uTransmittance, h, mu);
    sky += edge * T * uSolarIrradiance;
  }

  // Apply exposure, output linear (postfx grade does final tonemap in M8).
  vec3 col = sky * uExposure;

  // Alpha: exponential rolloff so faint outer pixels fade smoothly into
  // space rather than cutting off as a hard line.
  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
  float alpha = 1.0 - exp(-lum * 6.0);

  fragColor = vec4(col, alpha);
}
`;

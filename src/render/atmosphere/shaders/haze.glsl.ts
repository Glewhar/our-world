// Shared aerial-perspective helper for the surface overlay shaders
// (cities, highways, urban detail, clouds, airplane trails / heads).
// Mirrors the inline `sampleSkyViewHaze` block in LandMaterial + WaterMaterial
// so every visible planet object tints toward the same inscattered colour
// the atmosphere paints in the rim halo, instead of staying crisp against
// the hazed land/water surrounding them.
//
// Usage: concatenate this chunk into the fragment shader BEFORE main(),
// declare `uSkyView` / `uHazeExposure` / `uHazeAmount` as uniforms, then
// call `sampleSkyViewHaze(dir, camPos, sunDir)` and mix the resolved
// colour toward the returned radiance × `uHazeExposure`.
//
// `dir` should be `normalize(unitSphereSurfacePoint - camPos)` — i.e. the
// direction to the surface point projected onto the unit sphere, NOT
// the direction to the displaced fragment. The sky-view LUT has a sharp
// value step at vCoord = 0.5 (rays grazing the planet vs rays escaping
// into space); displaced peaks at the limb sit outside the unit-sphere
// silhouette, and using their displaced position pushes the lookup
// across that step, painting a circular dark/bright outline around
// peaks at the limb. Anchoring the direction to the undisplaced
// sphere point keeps every surface fragment on the same side of the
// LUT horizon regardless of its elevation.
//
// The helper is self-contained: it declares the three uniforms it needs
// itself, so the consumer just concatenates this chunk and uses
// `sampleSkyViewHaze` + the `uHazeExposure` / `uHazeAmount` uniforms by
// name. Don't redeclare these uniforms in the consumer's own source —
// GLSL will reject a second `uniform sampler2D uSkyView;`.
export const source = `
// Sampler precision qualified explicitly: GLSL ES 3.00 has no default
// precision for sampler types in the fragment shader, and this chunk is
// concatenated before the consumer's own precision declarations, so a
// bare \`uniform sampler2D\` here would fail to compile.
uniform highp sampler2D uSkyView;
uniform float uHazeExposure;
uniform float uHazeAmount;

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
`;

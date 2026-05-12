// Inlined from streets.vert.glsl. Edit the GLSL inside the template literal —
// the source of truth lives here, no separate .glsl file on disk.
export const source = `// Streets vertex shader — flat-on-tangent-plane ribbon.
//
// Each input vertex is an (x, y) in the city's tangent km frame. The
// per-city basis uniforms place the quad on the globe surface; a tiny
// radial bias lifts it just above the land mesh so the depth test
// prefers streets over the ground without z-fighting.

precision highp float;

uniform vec3 uCityCentre;
uniform vec3 uTangentX;
uniform vec3 uTangentY;
uniform float uRadialBase;
uniform float uMetresPerUnit;
uniform float uElevationScale; // unused — kept symmetric with buildings

in vec2 aLocalXY;     // km in tangent frame
in vec2 aStreetUV;    // 0..1 within the cell

out vec2 vUV;
out vec3 vSurfaceNormal;

void main() {
  vUV = aStreetUV;
  vSurfaceNormal = normalize(uCityCentre);
  float ox = (aLocalXY.x * 1000.0) / uMetresPerUnit;
  float oy = (aLocalXY.y * 1000.0) / uMetresPerUnit;
  vec3 surface = uCityCentre * uRadialBase
               + uTangentX * ox
               + uTangentY * oy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(surface, 1.0);
}
`;

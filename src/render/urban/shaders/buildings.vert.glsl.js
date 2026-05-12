// Inlined from buildings.vert.glsl. Edit the GLSL inside the template literal —
// the source of truth lives here, no separate .glsl file on disk.
export const source = `// Buildings vertex shader — urban detail layer.
//
// Each instance is a unit-box (1×1×1) with base at z=0. We scale it by
// the per-instance footprint (width × depth × height) in metres, rotate
// it slightly around the tangent-up axis, place it at aLocalXY in the
// city's tangent km frame, then map the whole thing to a position on
// the globe surface using the per-city tangent basis uniforms.
//
// The healpix.glsl helper is concatenated before this source by
// UrbanDetailLayer — even though we don't use HEALPix lookups here, the
// concat keeps the surrounding code parallel with CitiesLayer.

precision highp float;
precision highp int;

uniform vec3 uCityCentre;     // unit-sphere position
uniform vec3 uTangentX;       // world-space tangent axis (east-ish), unit
uniform vec3 uTangentY;       // world-space tangent axis (north-ish), unit
uniform float uRadialBase;    // 1 + (elevation-fade + bias) in unit-sphere units
uniform float uElevationScale;
uniform float uMetresPerUnit; // EARTH_RADIUS_M

// position (unit cube vertex, base at z=0) and normal are auto-declared
// by three.js for GLSL3 ShaderMaterial — do NOT redeclare them here, or
// the vertex shader fails to compile with "redeclaration of 'position'".
in vec2 aLocalXY;             // per-instance tangent-frame (x, y) in km
in vec3 aSize;                // per-instance (width_m, depth_m, height_m)
in float aRotation;           // per-instance rotation (radians, around tangent normal)

out vec3 vWorldPos;
out vec3 vWorldNormal;
out vec3 vSurfaceNormal;
out float vHeightNorm;        // normalised height for shading variation

void main() {
  vHeightNorm = position.z; // [0, 1] along the box height — base 0, top 1

  // 1) Scale unit cube to (w, d, h) metres.
  vec3 sized = vec3(position.x * aSize.x, position.y * aSize.y, position.z * aSize.z);
  // 2) Rotate around local tangent-up (z-axis in the tangent frame).
  float ca = cos(aRotation);
  float sa = sin(aRotation);
  vec3 rotated = vec3(sized.x * ca - sized.y * sa, sized.x * sa + sized.y * ca, sized.z);
  // 3) Translate within the tangent plane by aLocalXY (km → m).
  vec2 offsetM = aLocalXY * 1000.0 + rotated.xy;
  float heightM = rotated.z;

  // 4) Convert metres back to unit-sphere units. The tangent vectors are
  //    unit length in world-space, which is the same as unit-sphere.
  float offsetUnitX = offsetM.x / uMetresPerUnit;
  float offsetUnitY = offsetM.y / uMetresPerUnit;
  float heightUnit = (heightM * uElevationScale) / 1.0;
  // Note: uElevationScale is "unit per metre" (matches land mesh's
  // displacement convention). Multiplying once is correct.

  // 5) Place: city centre lifted to uRadialBase, then offset along
  //    the two tangent axes, then radially out by heightUnit.
  vec3 surface = uCityCentre * uRadialBase
               + uTangentX * offsetUnitX
               + uTangentY * offsetUnitY;
  // surface normal at this point ≈ uCityCentre (planar approximation
  // for a < 100 km patch — angular spread is < 1°).
  vSurfaceNormal = normalize(uCityCentre);
  vec3 worldPos = surface + vSurfaceNormal * heightUnit;
  vWorldPos = worldPos;

  // Transform the box's local-frame normal back into world space. The
  // local axes are (uTangentX, uTangentY, vSurfaceNormal); rotation only
  // happens in the (x, y) plane, so rotate the planar component.
  float nx = normal.x * ca - normal.y * sa;
  float ny = normal.x * sa + normal.y * ca;
  vec3 nWorld = uTangentX * nx + uTangentY * ny + vSurfaceNormal * normal.z;
  vWorldNormal = normalize(nWorld);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPos, 1.0);
}
`;

// Inlined from airports.vert.glsl. Edit the GLSL inside the template literal —
// the source of truth lives here, no separate .glsl file on disk.
export const source = `// Airports — tiny tangent rectangles ("airstrips") at each airport's lat/lon.
//
// Per-instance attributes:
//   aLatLon   — (lat°, lon°)
//   aTraffic  — sum of incident route weights (used to scale the strip)
//
// We build the local tangent basis directly from lat/lon so the strip stays
// aligned with the local east/north regardless of where it sits on the globe.
// The strip is oriented along the local east axis (no real-world runway
// orientations available).

precision highp float;

uniform float uMinLengthKm;
uniform float uMaxLengthKm;
uniform float uWidthKm;
uniform float uRadialBias;     // unit-sphere offset above globe surface

in float aTraffic;
in vec2 aLatLon;

out float vTraffic;
out vec2 vQuadUV;

const float DEG = 0.017453292519943295;
const float EARTH_KM = 6371.0;

void main() {
  vQuadUV = uv;
  vTraffic = aTraffic;

  float lat = aLatLon.x * DEG;
  float lon = aLatLon.y * DEG;
  float cosLat = cos(lat);
  vec3 centre = vec3(cosLat * cos(lon), cosLat * sin(lon), sin(lat));
  vec3 normal = normalize(centre);

  // Local east = ∂/∂lon = (-sin(lon), cos(lon), 0). Local north completes
  // the right-handed basis.
  vec3 east = normalize(vec3(-sin(lon), cos(lon), 0.0));
  vec3 north = cross(normal, east);

  // Strip length scales with traffic, log-ish so megahubs don't dominate.
  float lenKm = mix(uMinLengthKm, uMaxLengthKm, clamp(log(1.0 + aTraffic) / log(80.0), 0.0, 1.0));
  float halfLenU = (lenKm * 0.5) / EARTH_KM;
  float halfWidU = (uWidthKm * 0.5) / EARTH_KM;

  vec2 local = (uv - 0.5) * 2.0;  // [-1, +1]
  vec3 lifted = normal * (1.0 + uRadialBias);
  vec3 worldPos = lifted + east * (local.x * halfLenU) + north * (local.y * halfWidU);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPos, 1.0);
}
`;

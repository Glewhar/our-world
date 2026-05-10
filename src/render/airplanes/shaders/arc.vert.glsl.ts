// Inlined from arc.vert.glsl. Edit the GLSL inside the template literal —
// the source of truth lives here, no separate .glsl file on disk.
export const source = `// Great-circle ribbon vertex shader.
//
// For each instance we slerp between src and dst lat/lon, applying a
// parabolic altitude profile peaking at the midpoint of the *full* route
// (not the trail) — that way a plane halfway through its trip sits at
// peak altitude regardless of how long its trail is.
//
// \`aTMin\` and \`aTMax\` are the bounds of the slerp parameter:
//   - route scaffold: aTMin=0, aTMax=1 → full arc src→dst
//   - active trail:   aTMin = origin-side dissipation, aTMax = head progress
//
// \`aSide\` thickens the ribbon perpendicular to its tangent in world space.
// For a slim hairline the constant uThicknessUnit is small enough to look
// like a single line at orbit camera distances.
//
// Altitude convention matches the rest of the project: an altitude \`m\`
// metres above sea level becomes a radial offset \`m * uElevationScale\` in
// rendered units. Bow peak scales with the chord length so long-haul
// flights arc more dramatically than regional hops, with a floor that
// guarantees every flight clears the cloud shell (top at 2500 m).

precision highp float;

uniform float uElevationScale;   // render-units per metre (matches LandMaterial)
uniform float uMinPeakM;         // floor for the bow peak, real metres
uniform float uPeakScale;        // peak-to-chord ratio in real units (peak_m = scale * chord_m)
uniform float uRadialBiasM;      // small bias above the surface, real metres
uniform float uThicknessUnit;    // half-width of the ribbon, unit-sphere units

in float aV;
in float aSide;
in vec4 aSrcDst;                 // (latA, lonA, latB, lonB) degrees
in float aTMin;
in float aTMax;
in float aAlpha;

out float vV;
out float vAlpha;
out float vTMax;
out float vSide;                 // -1..+1 across ribbon width, for soft edges

const float DEG = 0.017453292519943295;
const float EARTH_RADIUS_M = 6371000.0;

vec3 latLonToXyz(float latDeg, float lonDeg) {
  float lat = latDeg * DEG;
  float lon = lonDeg * DEG;
  float cl = cos(lat);
  return vec3(cl * cos(lon), cl * sin(lon), sin(lat));
}

// Spherical linear interpolation between two unit vectors.
vec3 slerp(vec3 a, vec3 b, float t, float omega, float sinO) {
  if (sinO < 1.0e-5) return normalize(mix(a, b, t));
  float wa = sin((1.0 - t) * omega) / sinO;
  float wb = sin(t * omega) / sinO;
  return wa * a + wb * b;
}

void main() {
  vV = aV;
  vAlpha = aAlpha;
  vTMax = aTMax;
  vSide = aSide;

  vec3 src = latLonToXyz(aSrcDst.x, aSrcDst.y);
  vec3 dst = latLonToXyz(aSrcDst.z, aSrcDst.w);
  float dotAB = clamp(dot(src, dst), -1.0, 1.0);
  float omega = acos(dotAB);
  float sinO = sin(omega);

  float tRoute = mix(aTMin, aTMax, aV);
  vec3 pos = slerp(src, dst, tRoute, omega, sinO);

  // Bow peak scales with the route chord length (so long-haul flights arc
  // more dramatically than short hops) AND with the elevation scale (so
  // the altitude slider lifts every bow uniformly with the rest of the
  // project). Working in real metres throughout — chord in unit-sphere
  // units × Earth radius gives real chord m, peakM is real altitude m,
  // and the final unit-sphere radial offset is \`peakM × elevationScale\`.
  float chordUnit = 2.0 * sin(omega * 0.5);
  float chordM    = chordUnit * EARTH_RADIUS_M;
  float peakM     = max(uMinPeakM, uPeakScale * chordM);
  float altM      = peakM * sin(3.14159265 * tRoute);
  float radial    = (uRadialBiasM + altM) * uElevationScale;
  vec3 worldPos   = pos * (1.0 + radial);

  // Tangent along the arc (analytic derivative of slerp).
  vec3 tangent;
  if (sinO < 1.0e-5) {
    tangent = normalize(dst - src);
  } else {
    float wa = -cos((1.0 - tRoute) * omega) * omega / sinO;
    float wb =  cos(tRoute * omega) * omega / sinO;
    tangent = normalize(wa * src + wb * dst);
  }

  // Lay the ribbon flat against the sphere — perpendicular to the tangent
  // along the surface. DoubleSide on the material ensures both faces draw
  // regardless of which way the perp ends up pointing.
  vec3 normal = normalize(worldPos);
  vec3 perp = normalize(cross(tangent, normal));

  worldPos += perp * (aSide * uThicknessUnit);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPos, 1.0);
}
`;

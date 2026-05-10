// Inlined from plane.vert.glsl. Edit the GLSL inside the template literal —
// the source of truth lives here, no separate .glsl file on disk.
export const source = `// Plane head — a screen-space billboard quad at the plane's current great-
// circle position. Quad is expanded in clip space so the dot stays a constant
// pixel size regardless of distance (within reason).
//
// Altitude math matches \`arc.vert.glsl\` exactly so the head sits on the
// trail (bow peak proportional to chord, with a metres-based floor).

precision highp float;

uniform float uElevationScale;
uniform float uMinPeakM;
uniform float uPeakScale;
uniform float uRadialBiasM;
uniform float uPixelSize;
uniform vec2 uViewportPx;

in vec4 aSrcDst;
in float aT;

out vec2 vQuadUV;
out float vBlinkPhase;

const float DEG = 0.017453292519943295;
const float EARTH_RADIUS_M = 6371000.0;

vec3 latLonToXyz(float latDeg, float lonDeg) {
  float lat = latDeg * DEG;
  float lon = lonDeg * DEG;
  float cl = cos(lat);
  return vec3(cl * cos(lon), cl * sin(lon), sin(lat));
}

vec3 slerp(vec3 a, vec3 b, float t, float omega, float sinO) {
  if (sinO < 1.0e-5) return normalize(mix(a, b, t));
  float wa = sin((1.0 - t) * omega) / sinO;
  float wb = sin(t * omega) / sinO;
  return wa * a + wb * b;
}

void main() {
  vQuadUV = uv;
  // Use the route src lat to seed a stable per-plane blink phase so heads
  // don't all blink in unison.
  vBlinkPhase = fract(aSrcDst.x * 0.137 + aSrcDst.y * 0.273);

  vec3 src = latLonToXyz(aSrcDst.x, aSrcDst.y);
  vec3 dst = latLonToXyz(aSrcDst.z, aSrcDst.w);
  float dotAB = clamp(dot(src, dst), -1.0, 1.0);
  float omega = acos(dotAB);
  float sinO = sin(omega);

  vec3 pos = slerp(src, dst, aT, omega, sinO);

  // Bow altitude in real metres × elevationScale — see arc.vert.glsl for
  // the rationale. The head must sit on the trail, so the math is identical.
  float chordUnit = 2.0 * sin(omega * 0.5);
  float chordM    = chordUnit * EARTH_RADIUS_M;
  float peakM     = max(uMinPeakM, uPeakScale * chordM);
  float altM      = peakM * sin(3.14159265 * aT);
  float radial    = (uRadialBiasM + altM) * uElevationScale;
  vec3 worldPos   = pos * (1.0 + radial);

  // Project the centre, then offset in clip XY by the quad UV.
  vec4 clip = projectionMatrix * modelViewMatrix * vec4(worldPos, 1.0);
  vec2 offset = (uv - 0.5) * 2.0 * uPixelSize / uViewportPx * clip.w;
  clip.xy += offset;
  gl_Position = clip;
}
`;

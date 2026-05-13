// Inlined from cities.vert.glsl. Edit the GLSL inside the template literal —
// the source of truth lives here, no separate .glsl file on disk.
export const source = `// Cities vertex shader — triangulated polygon mesh.
//
// Each polygon vertex carries its own unit-sphere position plus the
// per-vertex tangent-frame (x_km, y_km) coordinate \`aLocalKm\` (computed
// at construction in CitiesLayer.ts). The fragment shader uses
// \`vLocalKm\` directly to drive the block-spray hashing — no shared
// quad envelope, no per-fragment point-in-polygon test.
//
// Radial lift: pre-baked CPU-side into the per-vertex
// \`aLiftMeters\` attribute (see web/src/render/util/elevation-lift-bake.ts),
// which mirrors the same 9-tap blur + 8-neighbour coast fade the older
// shader did per frame. The shader just multiplies by
// \`uElevationScale\` so the altitude slider still works — that's the
// only run-time elevation work left on this layer.

precision highp float;
precision highp int;
precision highp sampler2D;

uniform float uElevationScale;
uniform float uCityRadialBias;

in vec2 aLocalKm;
in vec2 aHalfExtentKm;
in float aPopulation;
in float aPatternSeed;
in float aLiftMeters;

out vec2 vLocalKm;
flat out vec2 vHalfExtentKm;
out vec3 vWorldPos;
out float vPopulation;
out float vPatternSeed;

void main() {
  vLocalKm = aLocalKm;
  vHalfExtentKm = aHalfExtentKm;
  vPopulation = aPopulation;
  vPatternSeed = aPatternSeed;

  vec3 dir = normalize(position);

  float landDisplace = aLiftMeters * uElevationScale;
  float radial = 1.0 + landDisplace + uCityRadialBias;
  vec3 worldPos = dir * radial;
  vWorldPos = worldPos;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPos, 1.0);
}
`;

/**
 * AirportsLayer — instanced tangent rectangles ("airstrips") at each airport.
 *
 * One PlaneGeometry instance per airport. Per-instance:
 *   - aLatLon   : (lat°, lon°)
 *   - aTraffic  : sum of incident route weights (drives strip length + brightness)
 *
 * The shader builds the local east/north basis from lat/lon directly — no
 * per-instance matrix beyond the identity required by Three.js's InstancedMesh.
 */
import * as THREE from 'three';
const AIRPORTS_VERT = `// Airports — tiny tangent rectangles ("airstrips") at each airport's lat/lon.
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
const AIRPORTS_FRAG = `// Airports — flat solid colour with a soft edge so the strip doesn't look
// like a crisp hard-edged rectangle from far away.

precision highp float;

uniform vec3 uColor;
uniform float uOpacity;

in vec2 vQuadUV;
in float vTraffic;

out vec4 fragColor;

void main() {
  vec2 local = (vQuadUV - 0.5) * 2.0;
  float dx = abs(local.x);
  float dy = abs(local.y);

  // Slight feather so the rectangle has a hint of soft edge.
  float edgeX = 1.0 - smoothstep(0.85, 1.0, dx);
  float edgeY = 1.0 - smoothstep(0.5, 1.0, dy);
  float mask = edgeX * edgeY;
  if (mask < 0.05) discard;

  // Brightness scales mildly with traffic so the eye notices the hubs.
  float bright = mix(0.7, 1.0, clamp(log(1.0 + vTraffic) / log(80.0), 0.0, 1.0));
  fragColor = vec4(uColor * bright, mask * uOpacity);
}
`;
const DEFAULTS = {
    minLengthKm: 6,
    maxLengthKm: 35,
    widthKm: 1.2,
    radialBias: 1.5e-3, // ~10 km off the surface — clears clouds + ocean waves
    color: new THREE.Color('#e8eef7'),
    opacity: 0.9,
};
export class AirportsLayer {
    mesh;
    material;
    geometry;
    constructor(data) {
        this.geometry = new THREE.PlaneGeometry(1, 1);
        this.material = new THREE.ShaderMaterial({
            glslVersion: THREE.GLSL3,
            vertexShader: AIRPORTS_VERT,
            fragmentShader: AIRPORTS_FRAG,
            transparent: true,
            depthWrite: false,
            depthTest: true,
            uniforms: {
                uMinLengthKm: { value: DEFAULTS.minLengthKm },
                uMaxLengthKm: { value: DEFAULTS.maxLengthKm },
                uWidthKm: { value: DEFAULTS.widthKm },
                uRadialBias: { value: DEFAULTS.radialBias },
                uColor: { value: DEFAULTS.color.clone() },
                uOpacity: { value: DEFAULTS.opacity },
            },
        });
        const count = data.airportTraffic.length;
        this.mesh = new THREE.InstancedMesh(this.geometry, this.material, Math.max(1, count));
        this.mesh.frustumCulled = false;
        this.mesh.renderOrder = 5;
        // Per-instance attributes. Three.js still requires per-instance matrices
        // even though we build positions in the shader; identity is fine.
        this.geometry.setAttribute('aLatLon', new THREE.InstancedBufferAttribute(data.airportLatLons.slice(), 2));
        this.geometry.setAttribute('aTraffic', new THREE.InstancedBufferAttribute(data.airportTraffic.slice(), 1));
        const dummy = new THREE.Object3D();
        for (let i = 0; i < count; i++) {
            dummy.updateMatrix();
            this.mesh.setMatrixAt(i, dummy.matrix);
        }
        this.mesh.count = count;
        this.mesh.instanceMatrix.needsUpdate = true;
    }
    setActive(active) {
        this.mesh.visible = active;
    }
    dispose() {
        this.geometry.dispose();
        this.material.dispose();
        this.mesh.dispose();
    }
}

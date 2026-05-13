/**
 * Plane heads — instanced billboarded dots, one per active plane.
 * Dot blinks white ↔ red at 1 Hz. Per-instance attributes are written by
 * AirplaneSystem each frame.
 *
 * The active head count may be less than the trail count: once a plane
 * lands the head dot is removed immediately, but its trail keeps existing
 * for a while as it dissipates from the origin end.
 */

import * as THREE from 'three';

import { DEFAULT_ELEVATION_SCALE } from '../globe/LandMaterial.js';

const PLANE_VERT = `// Plane head — a screen-space billboard quad at the plane's current great-
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

const PLANE_FRAG = `// Plane head — a tiny red dot that flashes once per second and is invisible
// the rest of the time. Trails are the always-visible thing; this dot is
// just a marker that briefly says "here I am" each second.
//
// \`uTime\` is in seconds. Each plane has its own \`vBlinkPhase\` so the blinks
// sweep through the fleet rather than pulsing in unison.

precision highp float;

uniform float uTime;
uniform vec3 uColorBlink;
uniform float uOpacity;

in vec2 vQuadUV;
in float vBlinkPhase;

out vec4 fragColor;

void main() {
  vec2 local = (vQuadUV - 0.5) * 2.0;
  float r2 = dot(local, local);
  if (r2 > 1.0) discard;

  // 1 Hz blink — abs(sin) raised to a high power so the dot is only visible
  // for a brief flash each second (FWHM ≈ 0.19 s) rather than half the cycle.
  float blink = abs(sin(3.14159265 * (uTime + vBlinkPhase)));
  blink = pow(blink, 16.0);

  // Soft circular core — bright centre, fuzzy edge.
  float core = (1.0 - r2);
  core *= core;

  float a = uOpacity * core * blink;
  if (a < 0.005) discard;
  fragColor = vec4(uColorBlink, a);
}
`;

const DEFAULTS = {
  elevationScale: DEFAULT_ELEVATION_SCALE,
  minPeakM: 4000,
  // MUST match TrailsLayer's peakScale so the head dot sits exactly on
  // the leading edge of the trail.
  peakScale: 0.0013,
  radialBiasM: 50,
  pixelSize: 4,
  colorBlink: new THREE.Color('#b32516'),
  opacity: 1.0,
};

export class PlaneHeadsLayer {
  readonly mesh: THREE.Mesh;
  readonly aSrcDstAttr: THREE.InstancedBufferAttribute;
  readonly aTAttr: THREE.InstancedBufferAttribute;
  private readonly material: THREE.ShaderMaterial;
  private readonly geometry: THREE.InstancedBufferGeometry;
  private readonly capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
    const plane = new THREE.PlaneGeometry(1, 1);
    this.geometry = new THREE.InstancedBufferGeometry();
    this.geometry.setAttribute('position', plane.getAttribute('position'));
    this.geometry.setAttribute('uv', plane.getAttribute('uv'));
    this.geometry.setIndex(plane.index);

    const aSrcDst = new Float32Array(capacity * 4);
    const aT = new Float32Array(capacity);
    this.aSrcDstAttr = new THREE.InstancedBufferAttribute(aSrcDst, 4);
    this.aTAttr = new THREE.InstancedBufferAttribute(aT, 1);
    this.aSrcDstAttr.setUsage(THREE.DynamicDrawUsage);
    this.aTAttr.setUsage(THREE.DynamicDrawUsage);
    this.geometry.setAttribute('aSrcDst', this.aSrcDstAttr);
    this.geometry.setAttribute('aT', this.aTAttr);
    this.geometry.instanceCount = 0;

    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: PLANE_VERT,
      fragmentShader: PLANE_FRAG,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uElevationScale: { value: DEFAULTS.elevationScale },
        uMinPeakM: { value: DEFAULTS.minPeakM },
        uPeakScale: { value: DEFAULTS.peakScale },
        uRadialBiasM: { value: DEFAULTS.radialBiasM },
        uPixelSize: { value: DEFAULTS.pixelSize },
        uViewportPx: { value: new THREE.Vector2(1920, 1080) },
        uColorBlink: { value: DEFAULTS.colorBlink.clone() },
        uOpacity: { value: DEFAULTS.opacity },
      },
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 9;
    plane.dispose();
  }

  setActiveCount(n: number): void {
    this.geometry.instanceCount = Math.min(n, this.capacity);
    this.aSrcDstAttr.needsUpdate = true;
    this.aTAttr.needsUpdate = true;
  }

  setTime(t: number): void {
    this.material.uniforms.uTime!.value = t;
  }

  setViewport(w: number, h: number): void {
    (this.material.uniforms.uViewportPx!.value as THREE.Vector2).set(w, h);
  }

  setActive(active: boolean): void {
    this.mesh.visible = active;
  }

  setElevationScale(v: number): void {
    this.material.uniforms.uElevationScale!.value = v;
  }

  setOpacity(v: number): void {
    this.material.uniforms.uOpacity!.value = v;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}

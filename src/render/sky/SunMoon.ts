/**
 * Sun + moon disks. Two camera-facing billboards positioned far down the
 * sun ray (sun) and along its antipode (moon). Sun is bright filmic-yellow
 * with a soft glow; moon is dim cool-grey. Rendering order keeps both
 * behind the atmosphere shell so the limb glow envelopes them naturally.
 *
 * The "size" uniforms are angular radii (radians on the unit sphere from
 * camera) — the disk billboard radius is `tan(size) * distance`.
 *
 * Time-of-day rotates `uSunDirection` upstream; this module just consumes
 * the current sun direction each frame via `setSunDirection`.
 */

import * as THREE from 'three';

import { DEFAULTS } from '../../debug/defaults.js';

const SUN_DISTANCE = 60;
const MOON_DISTANCE = 60;

export class SunMoon {
  readonly group = new THREE.Group();
  private readonly sunMesh: THREE.Mesh;
  private readonly moonMesh: THREE.Mesh;
  private readonly sunMat: THREE.ShaderMaterial;
  private readonly moonMat: THREE.ShaderMaterial;
  private readonly tmpDir = new THREE.Vector3();

  constructor() {
    const s = DEFAULTS.materials.sky;
    const sunUniforms = {
      uColor: { value: new THREE.Color(s.sunDiskColor) },
      uGlowColor: { value: new THREE.Color(s.sunGlowColor) },
      uIntensity: { value: 6.0 },
    };
    const moonUniforms = {
      uColor: { value: new THREE.Color(s.moonDiskColor) },
      uGlowColor: { value: new THREE.Color(s.moonGlowColor) },
      uIntensity: { value: 1.0 },
    };

    const sharedVert = /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    const sharedFrag = /* glsl */ `
      precision highp float;
      varying vec2 vUv;
      uniform vec3 uColor;
      uniform vec3 uGlowColor;
      uniform float uIntensity;
      void main() {
        // Distance from quad centre.
        vec2 d = vUv - vec2(0.5);
        float r = length(d) * 2.0;
        // Disk: solid core, soft edge. Halo is tight (0.55..0.85) and dim
        // so the additive contribution doesn't bloom into a wide haze.
        float disk = 1.0 - smoothstep(0.0, 0.55, r);
        float glow = 1.0 - smoothstep(0.55, 0.85, r);
        glow = glow * glow;
        if (r > 0.85) discard;
        vec3 col = mix(uGlowColor, uColor, disk);
        float a = max(disk, glow * 0.15) * uIntensity;
        gl_FragColor = vec4(col * a, a);
      }
    `;

    this.sunMat = new THREE.ShaderMaterial({
      uniforms: sunUniforms,
      vertexShader: sharedVert,
      fragmentShader: sharedFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.moonMat = new THREE.ShaderMaterial({
      uniforms: moonUniforms,
      vertexShader: sharedVert,
      fragmentShader: sharedFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const sunRadius = Math.tan(0.18) * SUN_DISTANCE;
    const moonRadius = Math.tan(0.12) * MOON_DISTANCE;

    this.sunMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(sunRadius * 2, sunRadius * 2),
      this.sunMat,
    );
    this.moonMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(moonRadius * 2, moonRadius * 2),
      this.moonMat,
    );
    this.sunMesh.renderOrder = 0;
    this.moonMesh.renderOrder = 0;
    this.group.add(this.sunMesh);
    this.group.add(this.moonMesh);
  }

  setSunDiskSize(size: number): void {
    const r = Math.tan(size) * SUN_DISTANCE;
    (this.sunMesh.geometry as THREE.BufferGeometry).dispose();
    this.sunMesh.geometry = new THREE.PlaneGeometry(r * 2, r * 2);
  }

  setSunColors(diskCss: string, glowCss: string): void {
    (this.sunMat.uniforms.uColor!.value as THREE.Color).set(diskCss);
    (this.sunMat.uniforms.uGlowColor!.value as THREE.Color).set(glowCss);
  }

  setMoonColors(diskCss: string, glowCss: string): void {
    (this.moonMat.uniforms.uColor!.value as THREE.Color).set(diskCss);
    (this.moonMat.uniforms.uGlowColor!.value as THREE.Color).set(glowCss);
  }

  /**
   * Position the sun + moon along the current sun direction. Call before
   * each render so the billboards face the camera.
   */
  syncFromCamera(camera: THREE.Camera, sunDir: THREE.Vector3): void {
    this.tmpDir.copy(sunDir).normalize();
    this.sunMesh.position.copy(this.tmpDir).multiplyScalar(SUN_DISTANCE);
    this.moonMesh.position.copy(this.tmpDir).multiplyScalar(-MOON_DISTANCE);
    this.sunMesh.lookAt(camera.position);
    this.moonMesh.lookAt(camera.position);
  }

  dispose(): void {
    (this.sunMesh.geometry as THREE.BufferGeometry).dispose();
    (this.moonMesh.geometry as THREE.BufferGeometry).dispose();
    this.sunMat.dispose();
    this.moonMat.dispose();
  }
}

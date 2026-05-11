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
import { source as vertGlsl } from './shaders/plane.vert.glsl.js';
import { source as fragGlsl } from './shaders/plane.frag.glsl.js';
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
    mesh;
    aSrcDstAttr;
    aTAttr;
    material;
    geometry;
    capacity;
    constructor(capacity) {
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
            vertexShader: vertGlsl,
            fragmentShader: fragGlsl,
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
    setActiveCount(n) {
        this.geometry.instanceCount = Math.min(n, this.capacity);
        this.aSrcDstAttr.needsUpdate = true;
        this.aTAttr.needsUpdate = true;
    }
    setTime(t) {
        this.material.uniforms.uTime.value = t;
    }
    setViewport(w, h) {
        this.material.uniforms.uViewportPx.value.set(w, h);
    }
    setActive(active) {
        this.mesh.visible = active;
    }
    setElevationScale(v) {
        this.material.uniforms.uElevationScale.value = v;
    }
    setOpacity(v) {
        this.material.uniforms.uOpacity.value = v;
    }
    dispose() {
        this.geometry.dispose();
        this.material.dispose();
    }
}

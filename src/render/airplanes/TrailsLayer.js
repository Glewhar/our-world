/**
 * Trails — a great-circle ribbon per active plane, extending from the plane's
 * origin airport to its current head position. The ribbon's `aTMin..aTMax`
 * carries the visible portion of the slerp parameter; `aSrcDst` carries the
 * route endpoints.
 *
 * Lingering trails: after the plane lands (`aTMax = 1`), the system advances
 * `aTMin` toward 1 at the same per-route speed the plane originally flew, so
 * the trail visibly retracts from the origin end like dispersing smoke.
 *
 * Additive blending so overlapping trails accumulate brightness — exactly
 * what makes busy hubs visually pop.
 *
 * Depth-tested against the globe: the bow arc is now lifted physically above
 * the cloud shell, so the depth comparison correctly culls back-of-globe
 * trails without hiding them under cloud cover (clouds don't write depth).
 *
 * The instance buffers are owned by AirplaneSystem and updated each frame;
 * this class just exposes them so the system can write into them directly.
 */
import * as THREE from 'three';
import { makeArcRibbonGeometry } from './arcGeometry.js';
import { DEFAULT_ELEVATION_SCALE } from '../globe/LandMaterial.js';
import { source as vertGlsl } from './shaders/arc.vert.glsl.js';
import { source as fragGlsl } from './shaders/arc.frag.glsl.js';
const DEFAULTS = {
    elevationScale: DEFAULT_ELEVATION_SCALE,
    minPeakM: 4000,
    // Peak altitude (real metres) per metre of chord. 0.0013 ≈ 0.13% of
    // chord length, so a 17,000-km long-haul peaks at ~22 km of stylised
    // altitude (× elevationScale → r ≈ 1.27 at the 5× baseline), and a
    // 4000-km cross-country flight peaks at ~5 km. Below ~3000 km chord
    // we hit the `minPeakM` floor (4 km), which is just clear of clouds.
    peakScale: 0.0013,
    radialBiasM: 50,
    thicknessUnit: 8.0e-3,
    color: new THREE.Color('#ffffff'),
    opacity: 0.05,
};
export class TrailsLayer {
    mesh;
    aSrcDstAttr;
    aTMinAttr;
    aTMaxAttr;
    aAlphaAttr;
    material;
    geometry;
    capacity;
    constructor(capacity) {
        this.capacity = capacity;
        this.geometry = makeArcRibbonGeometry();
        const aSrcDst = new Float32Array(capacity * 4);
        const aTMin = new Float32Array(capacity);
        const aTMax = new Float32Array(capacity);
        const aAlpha = new Float32Array(capacity);
        this.aSrcDstAttr = new THREE.InstancedBufferAttribute(aSrcDst, 4);
        this.aTMinAttr = new THREE.InstancedBufferAttribute(aTMin, 1);
        this.aTMaxAttr = new THREE.InstancedBufferAttribute(aTMax, 1);
        this.aAlphaAttr = new THREE.InstancedBufferAttribute(aAlpha, 1);
        this.aSrcDstAttr.setUsage(THREE.DynamicDrawUsage);
        this.aTMinAttr.setUsage(THREE.DynamicDrawUsage);
        this.aTMaxAttr.setUsage(THREE.DynamicDrawUsage);
        this.aAlphaAttr.setUsage(THREE.DynamicDrawUsage);
        this.geometry.setAttribute('aSrcDst', this.aSrcDstAttr);
        this.geometry.setAttribute('aTMin', this.aTMinAttr);
        this.geometry.setAttribute('aTMax', this.aTMaxAttr);
        this.geometry.setAttribute('aAlpha', this.aAlphaAttr);
        this.geometry.instanceCount = 0;
        this.material = new THREE.ShaderMaterial({
            glslVersion: THREE.GLSL3,
            vertexShader: vertGlsl,
            fragmentShader: fragGlsl,
            transparent: true,
            depthWrite: false,
            depthTest: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            uniforms: {
                uElevationScale: { value: DEFAULTS.elevationScale },
                uMinPeakM: { value: DEFAULTS.minPeakM },
                uPeakScale: { value: DEFAULTS.peakScale },
                uRadialBiasM: { value: DEFAULTS.radialBiasM },
                uThicknessUnit: { value: DEFAULTS.thicknessUnit },
                uColor: { value: DEFAULTS.color.clone() },
                uOpacity: { value: DEFAULTS.opacity },
                uTrailFade: { value: 1.0 },
            },
        });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.frustumCulled = false;
        this.mesh.renderOrder = 7;
    }
    /** Set the live instance count after AirplaneSystem updates the buffers. */
    setActiveCount(n) {
        this.geometry.instanceCount = Math.min(n, this.capacity);
        this.aSrcDstAttr.needsUpdate = true;
        this.aTMinAttr.needsUpdate = true;
        this.aTMaxAttr.needsUpdate = true;
        this.aAlphaAttr.needsUpdate = true;
    }
    setActive(active) {
        this.mesh.visible = active;
    }
    setOpacity(o) {
        this.material.uniforms.uOpacity.value = o;
    }
    setElevationScale(v) {
        this.material.uniforms.uElevationScale.value = v;
    }
    dispose() {
        this.geometry.dispose();
        this.material.dispose();
    }
}

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
import { source as vertGlsl } from './shaders/airports.vert.glsl.js';
import { source as fragGlsl } from './shaders/airports.frag.glsl.js';
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
            vertexShader: vertGlsl,
            fragmentShader: fragGlsl,
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

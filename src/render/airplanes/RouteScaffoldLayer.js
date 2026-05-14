/**
 * Route scaffold — barely-visible great-circle arc per route. Static; built
 * once and never updated. Sits behind the active plane trails so the user
 * can still sense the network when no plane is in flight on a given route.
 *
 * Uses the same chord-scaled bow as the trails so the scaffold and the
 * active trail traced over it occupy identical altitudes.
 */
import * as THREE from 'three';
import { ARC_SEGMENTS, makeArcRibbonGeometry } from './arcGeometry.js';
import { DEFAULT_ELEVATION_SCALE } from '../globe/LandMaterial.js';
import { source as vertGlsl } from './shaders/arc.vert.glsl.js';
import { source as fragGlsl } from './shaders/arc.frag.glsl.js';
import { DEFAULTS as APP_DEFAULTS } from '../../debug/defaults.js';
const DEFAULTS = {
    elevationScale: DEFAULT_ELEVATION_SCALE,
    minPeakM: 4000,
    // MUST match TrailsLayer's peakScale so the static scaffold and the live
    // trail traced over it occupy the exact same altitude.
    peakScale: 0.0013,
    radialBiasM: 50,
    thicknessUnit: 1.5e-4,
    color: new THREE.Color(APP_DEFAULTS.materials.airplanes.scaffoldColor),
    opacity: 0.04,
};
export class RouteScaffoldLayer {
    mesh;
    material;
    geometry;
    constructor(data) {
        this.geometry = makeArcRibbonGeometry();
        const N = data.routeWeight.length;
        const aSrcDst = new Float32Array(N * 4);
        const aTMin = new Float32Array(N);
        const aTMax = new Float32Array(N);
        const aAlpha = new Float32Array(N);
        for (let i = 0; i < N; i++) {
            const a = data.routeSrc[i];
            const b = data.routeDst[i];
            aSrcDst[i * 4 + 0] = data.airportLatLons[a * 2];
            aSrcDst[i * 4 + 1] = data.airportLatLons[a * 2 + 1];
            aSrcDst[i * 4 + 2] = data.airportLatLons[b * 2];
            aSrcDst[i * 4 + 3] = data.airportLatLons[b * 2 + 1];
            aTMin[i] = 0.0;
            aTMax[i] = 1.0;
            // Faintly modulate by route weight so trunk routes are slightly
            // more visible than tertiary spokes even with no plane in flight.
            aAlpha[i] = 0.4 + 0.6 * data.routeWeight[i];
        }
        this.geometry.setAttribute('aSrcDst', new THREE.InstancedBufferAttribute(aSrcDst, 4));
        this.geometry.setAttribute('aTMin', new THREE.InstancedBufferAttribute(aTMin, 1));
        this.geometry.setAttribute('aTMax', new THREE.InstancedBufferAttribute(aTMax, 1));
        this.geometry.setAttribute('aAlpha', new THREE.InstancedBufferAttribute(aAlpha, 1));
        this.geometry.instanceCount = N;
        this.material = new THREE.ShaderMaterial({
            glslVersion: THREE.GLSL3,
            vertexShader: vertGlsl,
            fragmentShader: fragGlsl,
            transparent: true,
            depthWrite: false,
            depthTest: true,
            side: THREE.DoubleSide,
            uniforms: {
                uElevationScale: { value: DEFAULTS.elevationScale },
                uMinPeakM: { value: DEFAULTS.minPeakM },
                uPeakScale: { value: DEFAULTS.peakScale },
                uRadialBiasM: { value: DEFAULTS.radialBiasM },
                uThicknessUnit: { value: DEFAULTS.thicknessUnit },
                uColor: { value: DEFAULTS.color.clone() },
                uOpacity: { value: DEFAULTS.opacity },
                uTrailFade: { value: 0.0 },
            },
        });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.frustumCulled = false;
        this.mesh.renderOrder = 6;
        void ARC_SEGMENTS; // silence unused import
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

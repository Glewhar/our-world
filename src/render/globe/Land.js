/**
 * Land — the dry-land icosphere mesh.
 *
 * Subdivision 64 (~84k tris, ~3 km edges on the unit sphere) sits about
 * 4× finer than the 12 km HEALPix cells, so every data cell still owns
 * multiple vertices and elevation detail is preserved. Higher
 * subdivisions just over-sample past the data's resolution.
 *
 * Vertex shader displaces by the per-cell `elevation_meters` value
 * (max(elev, 0) — sub-sea-level land stays at radius 1.0 and is hidden
 * by the water mesh anyway). Fragment shader discards ocean cells; the
 * separate `Water` mesh paints those.
 */
import * as THREE from 'three';
import { bakeBiomeColorTexture } from './BiomeColorPrebake.js';
import { bakeElevationEquirectTexture } from './ElevationEquirectPrebake.js';
import { createLandMaterial } from './LandMaterial.js';
const ICOSPHERE_SUBDIVISION = 64;
const UNIT_RADIUS = 1.0;
export class Land {
    group = new THREE.Group();
    mesh;
    geometry;
    material;
    constructor(world, renderer) {
        this.geometry = new THREE.IcosahedronGeometry(UNIT_RADIUS, ICOSPHERE_SUBDIVISION);
        this.material = createLandMaterial();
        const u = this.material._landUniforms;
        u.uIdRaster.value = world.getIdRaster();
        u.uAttrStatic.value = world.getAttributeTexture('elevation');
        u.uAttrClimate.value = world.getAttributeTexture('temperature');
        u.uAttrDynamic.value = world.getAttributeTexture('fire');
        u.uElevationMeters.value = world.getElevationMetersTexture();
        u.uElevationEquirect.value = bakeElevationEquirectTexture(renderer, world);
        u.uDistanceField.value = world.getDistanceFieldTexture();
        u.uBiomeColor.value = bakeBiomeColorTexture(renderer, world);
        const { nside, ordering } = world.getHealpixSpec();
        u.uHealpixNside.value = nside;
        u.uHealpixOrdering.value = ordering === 'ring' ? 0 : 1;
        u.uAttrTexWidth.value = 4 * nside;
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        // Frustum culling off — the icosphere is centred at origin, displacement
        // can push the bounding sphere out, and the cost of always drawing it
        // is negligible relative to the cost of recomputing bounds.
        this.mesh.frustumCulled = false;
        this.mesh.renderOrder = 0;
        this.group.add(this.mesh);
    }
    /** Direct uniform access for the scene graph's per-frame Tweakpane sync. */
    get uniforms() {
        return this.material._landUniforms;
    }
    setSunDirection(dir) {
        this.material._landUniforms.uSunDirection.value.copy(dir);
    }
    dispose() {
        this.geometry.dispose();
        this.material.dispose();
        while (this.group.children.length > 0) {
            this.group.remove(this.group.children[0]);
        }
    }
}

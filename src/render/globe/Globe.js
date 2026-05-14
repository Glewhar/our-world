/**
 * Globe — thin owner of the split land + water meshes.
 *
 * Two separate meshes — a land icosphere driven by per-cell
 * `elevation_meters` and a water icosphere displaced to a single
 * global sea-level value (`uSeaLevelOffsetM`) plus a Gerstner-wave
 * term. The split costs +1 draw call and gives the water its own
 * shader for swell, depth tint, glint, and Fresnel.
 *
 * Picking flow stays intact: the scene graph raycasts via
 * `world.pickFromRay(ray)`, never against either mesh.
 *
 * No `syncFromCamera` — both meshes are fixed-density icospheres.
 */
import * as THREE from 'three';
import { Land } from './Land.js';
import { Water } from './Water.js';
export class Globe {
    group = new THREE.Group();
    land;
    water;
    constructor(world, renderer) {
        this.land = new Land(world, renderer);
        this.water = new Water(world);
        this.group.add(this.land.group, this.water.group);
    }
    /**
     * Direct uniform access for the scene graph's per-frame Tweakpane sync.
     * Land and water expose distinct uniform sets — the scene graph routes
     * land-tinted bindings to `.land` and ocean-tinted bindings to `.water`.
     */
    get uniforms() {
        return { land: this.land.uniforms, water: this.water.uniforms };
    }
    setSunDirection(dir) {
        this.land.setSunDirection(dir);
        this.water.setSunDirection(dir);
    }
    dispose() {
        this.land.dispose();
        this.water.dispose();
        while (this.group.children.length > 0) {
            this.group.remove(this.group.children[0]);
        }
    }
}

/**
 * Globe — thin owner of the split land + water meshes.
 *
 * Step 2.x of the cell-grid migration: replaces the previously-unified
 * single-mesh globe (one icosphere, one shader, fragment-shader branch on
 * `bodyId`) with two separate meshes — a land icosphere driven by
 * `elevation_meters` and a water icosphere driven by `water_level_meters`.
 *
 * Why split: the unified shader had no geometric water surface, so there
 * was no per-cell water level signal — sea level couldn't rise, floods
 * couldn't spread, transparency / refraction were impossible. The split
 * costs +1 draw call and buys real geometric water.
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
    constructor(world) {
        this.land = new Land(world);
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

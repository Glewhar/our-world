/**
 * Land — the dry-land icosphere mesh.
 *
 * Subdivision 64 (~84k tris, ~3 km edges on the unit sphere) sits about
 * 4× finer than the 12 km HEALPix cells, so every data cell still owns
 * multiple vertices and elevation detail is preserved. Higher
 * subdivisions just over-sample past the data's resolution.
 *
 * Vertex shader displaces by the per-cell `elevation_meters` value
 * (raw signed — seafloor dips inward, mountains poke out). Fragment
 * shader discards cells whose elevation is below the sea-level slider;
 * the separate `Water` mesh paints over the submerged region.
 */

import * as THREE from 'three';

import { bakeBiomeColorTexture } from './BiomeColorPrebake.js';
import { bakeElevationEquirectTexture } from './ElevationEquirectPrebake.js';
import { createLandMaterial, type LandUniforms } from './LandMaterial.js';
import type { WorldRuntime } from '../../world/index.js';

const ICOSPHERE_SUBDIVISION = 64;
const UNIT_RADIUS = 1.0;

export class Land {
  readonly group = new THREE.Group();
  readonly mesh: THREE.Mesh;
  private readonly geometry: THREE.IcosahedronGeometry;
  private readonly material: THREE.ShaderMaterial & { _landUniforms: LandUniforms };

  constructor(world: WorldRuntime, renderer: THREE.WebGLRenderer) {
    this.geometry = new THREE.IcosahedronGeometry(UNIT_RADIUS, ICOSPHERE_SUBDIVISION);
    this.material = createLandMaterial();

    const u = this.material._landUniforms;
    u.uAttrStatic.value = world.getAttributeTexture('elevation');
    u.uAttrClimate.value = world.getAttributeTexture('temperature');
    u.uAttrDynamic.value = world.getAttributeTexture('fire');
    u.uElevationMeters.value = world.getElevationMetersTexture();
    u.uElevationEquirect.value = bakeElevationEquirectTexture(renderer, world);
    u.uDistanceField.value = world.getDistanceFieldTexture();
    u.uBiomeColor.value = bakeBiomeColorTexture(renderer, world);
    u.uWastelandTex.value = world.getWastelandTexture();

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
  get uniforms(): LandUniforms {
    return this.material._landUniforms;
  }

  setSunDirection(dir: THREE.Vector3): void {
    this.material._landUniforms.uSunDirection.value.copy(dir);
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]!);
    }
  }
}

/**
 * Water — the water icosphere mesh.
 *
 * Subdivision 7 (~330k tris) — half the resolution of `Land`'s subdiv-8
 * shell. Water doesn't carry the same micro-detail as terrain and the
 * extra triangles pull frame time without buying anything visible.
 *
 * Vertex displacement is driven by `uSeaLevelOffsetM` (a single global
 * metres value) plus the Gerstner-wave term. Fragment shader paints
 * ocean depth tint everywhere; no discard — the land mesh draws front-
 * most by depth test wherever land elevation exceeds water surface.
 */

import * as THREE from 'three';

import { createWaterMaterial, type WaterUniforms } from './WaterMaterial.js';
import type { WorldRuntime } from '../../world/index.js';

const ICOSPHERE_SUBDIVISION = 7;
const UNIT_RADIUS = 1.0;

export class Water {
  readonly group = new THREE.Group();
  readonly mesh: THREE.Mesh;
  private readonly geometry: THREE.IcosahedronGeometry;
  private readonly material: THREE.ShaderMaterial & { _waterUniforms: WaterUniforms };

  constructor(world: WorldRuntime) {
    this.geometry = new THREE.IcosahedronGeometry(UNIT_RADIUS, ICOSPHERE_SUBDIVISION);
    this.material = createWaterMaterial();

    const u = this.material._waterUniforms;
    u.uElevationMeters.value = world.getElevationMetersTexture();
    u.uOceanCurrents.value = world.getOceanCurrentsTexture();

    const { nside, ordering } = world.getHealpixSpec();
    u.uHealpixNside.value = nside;
    u.uHealpixOrdering.value = ordering === 'ring' ? 0 : 1;
    u.uAttrTexWidth.value = 4 * nside;

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 1;
    this.group.add(this.mesh);
  }

  get uniforms(): WaterUniforms {
    return this.material._waterUniforms;
  }

  setSunDirection(dir: THREE.Vector3): void {
    this.material._waterUniforms.uSunDirection.value.copy(dir);
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]!);
    }
  }
}

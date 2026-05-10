/**
 * Shared great-circle ribbon geometry.
 *
 * A flat ribbon of N+1 "rungs", each rung holding two vertices (left + right
 * side of the ribbon centre line). The vertex shader does the slerp from
 * src→dst per route instance, so this geometry is just a parameterisation
 * along the length (`aV` ∈ [0,1]) and across the width (`aSide` ∈ {-1, +1}).
 *
 * Used by both the static route scaffolds and the per-plane trails.
 */

import * as THREE from 'three';

export const ARC_SEGMENTS = 48;

export function makeArcRibbonGeometry(): THREE.InstancedBufferGeometry {
  const N = ARC_SEGMENTS;
  const vertCount = (N + 1) * 2;
  const positions = new Float32Array(vertCount * 3); // unused; slerp builds them
  const aV = new Float32Array(vertCount);
  const aSide = new Float32Array(vertCount);
  for (let i = 0; i <= N; i++) {
    const v = i / N;
    aV[i * 2 + 0] = v;
    aV[i * 2 + 1] = v;
    aSide[i * 2 + 0] = -1;
    aSide[i * 2 + 1] = +1;
  }
  // Triangle-list indices for a ribbon: 2 triangles per segment × N segments.
  // Triangle-strip would save indices but mixes badly with InstancedMesh
  // draw mode; explicit lists are simpler and 6 × 48 = 288 indices is nothing.
  const indices = new Uint16Array(N * 6);
  for (let i = 0; i < N; i++) {
    const a = i * 2 + 0;
    const b = i * 2 + 1;
    const c = (i + 1) * 2 + 0;
    const d = (i + 1) * 2 + 1;
    indices[i * 6 + 0] = a;
    indices[i * 6 + 1] = c;
    indices[i * 6 + 2] = b;
    indices[i * 6 + 3] = b;
    indices[i * 6 + 4] = c;
    indices[i * 6 + 5] = d;
  }

  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aV', new THREE.BufferAttribute(aV, 1));
  geo.setAttribute('aSide', new THREE.BufferAttribute(aSide, 1));
  geo.setIndex(new THREE.BufferAttribute(indices, 1));
  return geo;
}

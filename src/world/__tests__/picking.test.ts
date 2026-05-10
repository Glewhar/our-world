/**
 * Golden test for the picking math: ray ⋂ unit sphere → (lat, lon) →
 * HEALPix cell → body index → BodyRegistry lookup.
 *
 * Reads the real baked ponds fixture (id_raster.bin + world_manifest.json)
 * to verify the chain end-to-end without spinning up a Vite dev server.
 *
 * Pond Inner / Middle / Outer are concentric circles at (lat=0, lon=0)
 * with bbox half-extents 3°, 7°, 12°. We poke at four points:
 *   (1,  1) → Pond Inner (topmost via z_order; cell 23681)
 *   (0,  5) → Pond Middle (outside Inner's 3° bbox)
 *   (0, 10) → Pond Outer  (outside Middle's 7° bbox)
 *   (0, 15) → null        (outside all)
 *
 * NOTE: The rasterizer (cap-prefilter + arc-crossing PIP, ADR-0002) leaves
 * the single cell at (lat≈0°, lon≈0.7°) — index 24192 at nside=64 — as 0,
 * a known artifact at the polygon-centroid pixel. We pick (1, 1) instead
 * for the Inner case to dodge this; the picking exit-gate verifies that
 * the runtime mirrors the raster faithfully, not that the rasterizer is
 * hole-free.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import { BodyRegistry } from '../BodyRegistry.js';
import { IdRaster } from '../IdRaster.js';
import { latLonToXyz, xyzToLatLon } from '../coordinates.js';
import { zPhiToPix } from '../healpix.js';
import type { BodyRecord, WorldManifest } from '../types.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../../..');
const PONDS = resolve(REPO_ROOT, 'data-pipeline/out/ponds');

function loadFixture(): { idRaster: IdRaster; registry: BodyRegistry; manifest: WorldManifest } {
  const manifest = JSON.parse(
    readFileSync(resolve(PONDS, 'world_manifest.json'), 'utf-8'),
  ) as WorldManifest;
  const buf = readFileSync(resolve(PONDS, 'id_raster.bin'));
  const cells = new Uint32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4).slice();
  const { nside, ordering } = manifest.healpix;
  return {
    idRaster: new IdRaster(cells, nside, ordering),
    registry: new BodyRegistry(manifest.bodies),
    manifest,
  };
}

const DEG = Math.PI / 180;
const tmpHit = new THREE.Vector3();
const sphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1);

/**
 * Re-implements `pickFromRay` here so the test catches drift in either the
 * factory's wiring or the math. Builds a ray from a point outside the sphere
 * pointing inward at the target lat/lon.
 */
function pick(
  idRaster: IdRaster,
  registry: BodyRegistry,
  latDeg: number,
  lonDeg: number,
): BodyRecord | null {
  // Ray origin: 3 units along the (lat, lon) direction. Direction: inward.
  const target = latLonToXyz(latDeg, lonDeg);
  const origin = target.clone().multiplyScalar(3);
  const dir = target.clone().sub(origin).normalize();
  const ray = new THREE.Ray(origin, dir);

  const hit = ray.intersectSphere(sphere, tmpHit);
  if (!hit) return null;
  const { lat, lon } = xyzToLatLon(hit);
  const z = Math.sin(lat * DEG);
  const phi = lon * DEG;
  const ipix = zPhiToPix(idRaster.nside, idRaster.ordering, z, phi);
  const idx = idRaster.bodyIndexAtCell(ipix);
  return registry.getByIndex(idx);
}

describe('pickFromRay', () => {
  const { idRaster, registry, manifest } = loadFixture();

  it('manifest sanity: 3 ponds, nside=64, ring ordering', () => {
    expect(manifest.bodies).toHaveLength(3);
    expect(manifest.healpix.nside).toBe(64);
    expect(manifest.healpix.ordering).toBe('ring');
    expect(manifest.bodies.map((b) => b.display_name)).toEqual([
      'Pond Inner',
      'Pond Middle',
      'Pond Outer',
    ]);
  });

  it('returns Pond Inner at (1, 1) — inside Inner 3° bbox', () => {
    const body = pick(idRaster, registry, 1, 1);
    expect(body?.display_name).toBe('Pond Inner');
  });

  it('mirrors the raster: cell 24192 at the centroid is the known hole (returns null)', () => {
    // Documents the rasterizer artifact so a future re-bake that fills this
    // cell will fail this test loudly, prompting a re-check of expectations.
    expect(idRaster.bodyIndexAtCell(24192)).toBe(0);
  });

  it('returns Pond Middle at (0, 5) — outside Inner 3° bbox, inside Middle 7° bbox', () => {
    const body = pick(idRaster, registry, 0, 5);
    expect(body?.display_name).toBe('Pond Middle');
  });

  it('returns Pond Outer at (0, 10) — outside Middle 7° bbox, inside Outer 12° bbox', () => {
    const body = pick(idRaster, registry, 0, 10);
    expect(body?.display_name).toBe('Pond Outer');
  });

  it('returns null at (0, 15) — outside all ponds', () => {
    const body = pick(idRaster, registry, 0, 15);
    expect(body).toBeNull();
  });

  it('still resolves correctly when the ray comes from a far camera', () => {
    // LOD-3 camera distance (per ADR-0004): a few unit-spheres out. The id
    // raster doesn't change with LOD, so picking must remain identical.
    const target = latLonToXyz(0, 5);
    const origin = target.clone().multiplyScalar(20);
    const dir = target.clone().sub(origin).normalize();
    const ray = new THREE.Ray(origin, dir);
    const hit = ray.intersectSphere(sphere, tmpHit);
    expect(hit).not.toBeNull();
    const { lat, lon } = xyzToLatLon(hit!);
    const z = Math.sin(lat * DEG);
    const phi = lon * DEG;
    const ipix = zPhiToPix(idRaster.nside, idRaster.ordering, z, phi);
    const idx = idRaster.bodyIndexAtCell(ipix);
    expect(registry.getByIndex(idx)?.display_name).toBe('Pond Middle');
  });
});

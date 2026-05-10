/**
 * Parity test for the GLSL HEALPix port.
 *
 * The shim at `web/src/render/globe/healpix-glsl-shim.ts` mimics GLSL int
 * semantics. The canonical TS at `web/src/world/healpix.ts` is the source
 * of truth (asserted against `astropy_healpix` via fixtures). This test
 * cross-checks that the shim agrees with the canonical for a deterministic
 * grid of (lat, lon) inputs, including the equator, both poles, and the
 * boundaries of the 2/3 cap-belt cutoff where GLSL vs. JS truncating-divide
 * semantics could diverge.
 *
 * If the shim diverges, the *real* GLSL probably also diverges since both
 * are mechanically derived from the same algorithm. Visual divergence in
 * the M1 attribute-lerp checkpoint would be the second-line catch.
 */

import { describe, expect, it } from 'vitest';

import { zPhiToPixGlslShim } from '../../render/globe/healpix-glsl-shim.js';
import { zPhiToPix, type HealpixOrdering } from '../healpix.js';

const NSIDE_VALUES = [4, 16, 64, 256];
const ORDERINGS: HealpixOrdering[] = ['ring', 'nested'];

function gridSamples(): { z: number; phi: number }[] {
  const out: { z: number; phi: number }[] = [];
  // Latitude grid (z = sin(lat)); include equator + 2/3 boundary + poles.
  const zs = [
    -1, -0.999, -0.95, -0.7, -0.6666666666666667, -0.5, -0.2, 0, 0.2, 0.5, 0.6666666666666667, 0.7,
    0.95, 0.999, 1,
  ];
  // Longitude grid; include 0, ±π, base-pixel boundaries (multiples of π/2).
  const phis = [
    -Math.PI,
    -Math.PI * 0.75,
    -Math.PI * 0.5,
    -Math.PI * 0.25,
    -0.001,
    0,
    0.001,
    Math.PI * 0.25,
    Math.PI * 0.5,
    Math.PI * 0.75,
    Math.PI - 0.001,
    Math.PI,
    Math.PI + 0.001,
  ];
  for (const z of zs) for (const phi of phis) out.push({ z, phi });
  return out;
}

describe('healpix GLSL shim parity', () => {
  for (const ordering of ORDERINGS) {
    for (const nside of NSIDE_VALUES) {
      it(`agrees with canonical at nside=${nside}, ordering=${ordering}`, () => {
        for (const { z, phi } of gridSamples()) {
          const a = zPhiToPix(nside, ordering, z, phi);
          const b = zPhiToPixGlslShim(nside, ordering, z, phi);
          if (a !== b) {
            throw new Error(
              `mismatch at nside=${nside} ordering=${ordering} z=${z} phi=${phi}: canonical=${a} shim=${b}`,
            );
          }
        }
      });
    }
  }

  it('produces values within [0, 12*nside^2)', () => {
    const nside = 64;
    const npix = 12 * nside * nside;
    for (const { z, phi } of gridSamples()) {
      for (const ordering of ORDERINGS) {
        const v = zPhiToPixGlslShim(nside, ordering, z, phi);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(npix);
      }
    }
  });
});

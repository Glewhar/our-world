/**
 * Validate `angToPix` against pinned fixture vectors generated from
 * `astropy_healpix.HEALPix.lonlat_to_healpix` via
 * `data-pipeline/scripts/gen_healpix_test_vectors.py`.
 *
 * Both ring and nested orderings must agree byte-for-byte at nside=64.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { zPhiToPix } from '../healpix.js';

type Sample = { lat: number; lon: number; ring: number; nested: number };
type Fixture = { nside: number; samples: Sample[] };

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = resolve(
  HERE,
  '../../../../data-pipeline/tests/fixtures/healpix_pix_vectors.json',
);

const fixture = JSON.parse(readFileSync(FIXTURE_PATH, 'utf-8')) as Fixture;

function zPhi(latDeg: number, lonDeg: number): { z: number; phi: number } {
  return {
    z: Math.sin((Math.PI / 180) * latDeg),
    phi: (Math.PI / 180) * lonDeg,
  };
}

describe('zPhiToPix', () => {
  it(`matches astropy_healpix at nside=${fixture.nside} for ${fixture.samples.length} samples (ring)`, () => {
    const mismatches: Array<{ s: Sample; got: number }> = [];
    for (const s of fixture.samples) {
      const { z, phi } = zPhi(s.lat, s.lon);
      const got = zPhiToPix(fixture.nside, 'ring', z, phi);
      if (got !== s.ring) mismatches.push({ s, got });
    }
    if (mismatches.length > 0) {
      const preview = mismatches
        .slice(0, 5)
        .map(
          (m) =>
            `(lat=${m.s.lat.toFixed(3)}, lon=${m.s.lon.toFixed(3)}): expected ${m.s.ring}, got ${m.got}`,
        );
      throw new Error(
        `${mismatches.length}/${fixture.samples.length} ring mismatches; first: ${preview.join('; ')}`,
      );
    }
  });

  it(`matches astropy_healpix at nside=${fixture.nside} for ${fixture.samples.length} samples (nested)`, () => {
    const mismatches: Array<{ s: Sample; got: number }> = [];
    for (const s of fixture.samples) {
      const { z, phi } = zPhi(s.lat, s.lon);
      const got = zPhiToPix(fixture.nside, 'nested', z, phi);
      if (got !== s.nested) mismatches.push({ s, got });
    }
    if (mismatches.length > 0) {
      const preview = mismatches
        .slice(0, 5)
        .map(
          (m) =>
            `(lat=${m.s.lat.toFixed(3)}, lon=${m.s.lon.toFixed(3)}): expected ${m.s.nested}, got ${m.got}`,
        );
      throw new Error(
        `${mismatches.length}/${fixture.samples.length} nested mismatches; first: ${preview.join('; ')}`,
      );
    }
  });

  it('handles negative phi (longitudes < 0) consistently', () => {
    const s = fixture.samples.find((x) => x.lon < -90)!;
    const { z, phi } = zPhi(s.lat, s.lon);
    expect(zPhiToPix(64, 'ring', z, phi)).toBe(s.ring);
    expect(zPhiToPix(64, 'nested', z, phi)).toBe(s.nested);
  });
});

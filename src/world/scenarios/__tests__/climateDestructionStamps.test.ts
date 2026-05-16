import { describe, it, expect } from 'vitest';
import { BIOME } from '../../biomes/BiomeLookup.js';
import {
  cellsBelowSeaLevel,
  cellsInProjectedFlipPolygons,
} from '../climateDestructionStamps.js';
import type { PolygonLookup } from '../../PolygonTexture.js';

describe('cellsBelowSeaLevel', () => {
  it('returns empty when peak rise <= 0 (Ice Age, no flooding)', () => {
    const elev = [-10, 0, 5, 100];
    const out = cellsBelowSeaLevel(-50, (i) => elev[i]!, elev.length);
    expect(out).toHaveLength(0);
    const out2 = cellsBelowSeaLevel(0, (i) => elev[i]!, elev.length);
    expect(out2).toHaveLength(0);
  });

  it('returns cells with 0 < elevation < peak', () => {
    // peak = 20 m. Cells with elev (5, 15) flood; (0, 25, -10) do not.
    const elev = [-10, 0, 5, 15, 25, 100];
    const out = cellsBelowSeaLevel(20, (i) => elev[i]!, elev.length);
    expect(Array.from(out)).toEqual([2, 3]);
  });

  it('returns an empty Uint32Array when no cells are coastal', () => {
    const elev = [-10, 500, 1000, 2000];
    const out = cellsBelowSeaLevel(100, (i) => elev[i]!, elev.length);
    expect(out).toHaveLength(0);
  });
});

function buildLookup(biomes: number[]): PolygonLookup {
  const n = biomes.length + 1;
  const biome = new Int8Array(n);
  for (let i = 1; i < n; i++) biome[i] = biomes[i - 1]!;
  return {
    count: biomes.length,
    entries: [],
    rasterWidth: 0,
    rasterHeight: 0,
    biome,
    realm: new Int8Array(n),
    latC: new Float32Array(n),
    lonC: new Float32Array(n),
    latMin: new Float32Array(n),
    latMax: new Float32Array(n),
    lonMin: new Float32Array(n),
    lonMax: new Float32Array(n),
    elevMin: new Float32Array(n),
    elevP10: new Float32Array(n),
    elevP50: new Float32Array(n),
    elevP90: new Float32Array(n),
    elevMax: new Float32Array(n),
    realmNames: {},
  };
}

describe('cellsInProjectedFlipPolygons', () => {
  it('returns empty when no polygon flips to the target', () => {
    // TROPICAL_MOIST under mild cooling won't flip to ICE.
    const lookup = buildLookup([BIOME.TROPICAL_MOIST, BIOME.TROPICAL_MOIST]);
    const polyOfCell = (ipix: number) => (ipix % 2 === 0 ? 1 : 2);
    const out = cellsInProjectedFlipPolygons(
      { tempC: -2, precipMm: 0 },
      BIOME.ICE,
      lookup,
      polyOfCell,
      8,
    );
    expect(out).toHaveLength(0);
  });

  it('collects cells whose polygon flips to ICE under deep cooling', () => {
    // TUNDRA → ICE under strong cooling. Two polygons: poly1 TUNDRA,
    // poly2 TROPICAL_MOIST. Only poly1 should flip.
    const lookup = buildLookup([BIOME.TUNDRA, BIOME.TROPICAL_MOIST]);
    // Cells 0, 2, 4 belong to poly1; cells 1, 3, 5 to poly2; cell 6 = ocean.
    const cellPoly = [1, 2, 1, 2, 1, 2, 0];
    const out = cellsInProjectedFlipPolygons(
      { tempC: -30, precipMm: -100 },
      BIOME.ICE,
      lookup,
      (ipix) => cellPoly[ipix] ?? 0,
      cellPoly.length,
    );
    // Every cell in poly1 should appear; poly2 / ocean cells excluded.
    expect(Array.from(out)).toEqual([0, 2, 4]);
  });

  it('respects the minWeight gate', () => {
    // TUNDRA under a tiny cooling: projectBiome may flip toward ICE but
    // weight will be below 0.4 — so no cells should be returned at the
    // default gate. A much stronger cooling clears the gate.
    const lookup = buildLookup([BIOME.TUNDRA]);
    const cellPoly = [1, 1, 1, 1];
    const weakOut = cellsInProjectedFlipPolygons(
      { tempC: -3, precipMm: 0 },
      BIOME.ICE,
      lookup,
      (ipix) => cellPoly[ipix]!,
      cellPoly.length,
      0.9,
    );
    expect(weakOut).toHaveLength(0);

    const strongOut = cellsInProjectedFlipPolygons(
      { tempC: -30, precipMm: -100 },
      BIOME.ICE,
      lookup,
      (ipix) => cellPoly[ipix]!,
      cellPoly.length,
      0.0,
    );
    expect(strongOut.length).toBeGreaterThan(0);
  });
});

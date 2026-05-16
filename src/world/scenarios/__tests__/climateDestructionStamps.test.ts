import { describe, it, expect } from 'vitest';
import { BIOME } from '../../biomes/BiomeLookup.js';
import { allPopulatedPolygons, polygonsThatFlipTo } from '../climateDestructionStamps.js';
import type { PolygonLookup } from '../../PolygonTexture.js';

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

describe('polygonsThatFlipTo', () => {
  it('zeroes every byte when no polygon flips to the target', () => {
    const lookup = buildLookup([BIOME.TROPICAL_MOIST, BIOME.TROPICAL_MOIST]);
    const out = polygonsThatFlipTo(
      { tempC: -2, precipMm: 0 },
      BIOME.ICE,
      lookup,
    );
    expect(out.length).toBe(lookup.count + 1);
    for (let i = 0; i < out.length; i++) expect(out[i]).toBe(0);
  });

  it('marks ICE-flipping polygons at 255 and leaves the rest at 0', () => {
    // poly1 TUNDRA → ICE under deep cooling. poly2 TROPICAL_MOIST stays.
    const lookup = buildLookup([BIOME.TUNDRA, BIOME.TROPICAL_MOIST]);
    const out = polygonsThatFlipTo(
      { tempC: -30, precipMm: -100 },
      BIOME.ICE,
      lookup,
    );
    expect(out[0]).toBe(0); // slot-0 no-data sentinel
    expect(out[1]).toBe(255);
    expect(out[2]).toBe(0);
  });

  it('respects the minWeight gate', () => {
    const lookup = buildLookup([BIOME.TUNDRA]);
    const weakOut = polygonsThatFlipTo(
      { tempC: -3, precipMm: 0 },
      BIOME.ICE,
      lookup,
      0.9,
    );
    expect(weakOut[1]).toBe(0);
    const strongOut = polygonsThatFlipTo(
      { tempC: -30, precipMm: -100 },
      BIOME.ICE,
      lookup,
      0.0,
    );
    expect(strongOut[1]).toBe(255);
  });

  it('skips slot-0 sentinel and polygons with baseline biome 0', () => {
    const lookup = buildLookup([0, BIOME.TUNDRA]);
    const out = polygonsThatFlipTo(
      { tempC: -30, precipMm: -100 },
      BIOME.ICE,
      lookup,
    );
    expect(out[0]).toBe(0);
    expect(out[1]).toBe(0); // baseline 0 — skipped
    expect(out[2]).toBe(255);
  });
});

describe('allPopulatedPolygons', () => {
  it('marks every non-zero baseline polygon at 255', () => {
    const lookup = buildLookup([BIOME.TUNDRA, BIOME.TROPICAL_MOIST, BIOME.DESERT]);
    const out = allPopulatedPolygons(lookup);
    expect(out.length).toBe(lookup.count + 1);
    expect(out[0]).toBe(0); // slot-0 no-data sentinel
    expect(out[1]).toBe(255);
    expect(out[2]).toBe(255);
    expect(out[3]).toBe(255);
  });

  it('leaves ocean / no-data polygons at 0', () => {
    const lookup = buildLookup([0, BIOME.TUNDRA, 0]);
    const out = allPopulatedPolygons(lookup);
    expect(out[0]).toBe(0);
    expect(out[1]).toBe(0); // baseline 0 — ocean / no-data
    expect(out[2]).toBe(255);
    expect(out[3]).toBe(0);
  });
});

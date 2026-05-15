import { describe, it, expect } from 'vitest';
import { BIOME } from '../../biomes/BiomeLookup.js';
import {
  deltaMagnitude,
  projectBiome,
  buildProjectionPolygonTextures,
} from '../biomeProjection.js';
import { MIN_DELTA_TO_FLIP } from '../biomeProjection.config.js';

describe('projectBiome', () => {
  it('returns no flip for zero delta', () => {
    const out = projectBiome(BIOME.TUNDRA, { tempC: 0, precipMm: 0 });
    expect(out.weight).toBe(0);
    expect(out.toId).toBe(BIOME.TUNDRA);
  });

  it('returns no flip when magnitude is below threshold', () => {
    const tiny = { tempC: 1, precipMm: 0 };
    expect(deltaMagnitude(tiny)).toBeLessThan(MIN_DELTA_TO_FLIP);
    const out = projectBiome(BIOME.TUNDRA, tiny);
    expect(out.weight).toBe(0);
  });

  it('warms tundra toward boreal under a +7°C swing', () => {
    const out = projectBiome(BIOME.TUNDRA, { tempC: 7, precipMm: 0 });
    expect(out.fromId).toBe(BIOME.TUNDRA);
    expect(out.toId).toBe(BIOME.BOREAL);
    expect(out.weight).toBeGreaterThan(0);
  });

  it('pulls desert toward temperate grassland under cooling + wet swing', () => {
    const out = projectBiome(BIOME.DESERT, { tempC: -15, precipMm: 400 });
    expect(out.fromId).toBe(BIOME.DESERT);
    expect(out.toId).toBe(BIOME.TEMPERATE_GRASSLAND);
    expect(out.weight).toBeGreaterThan(0);
  });

  it('never picks wasteland as a climate target', () => {
    for (let id = 1; id < 16; id++) {
      const warm = projectBiome(id, { tempC: 12, precipMm: 0 });
      const cool = projectBiome(id, { tempC: -12, precipMm: 0 });
      expect(warm.toId).not.toBe(BIOME.WASTELAND);
      expect(cool.toId).not.toBe(BIOME.WASTELAND);
    }
  });

  it('returns no flip for sentinel id 0', () => {
    const out = projectBiome(0, { tempC: 10, precipMm: 100 });
    expect(out.weight).toBe(0);
    expect(out.toId).toBe(0);
  });

  it('cancellation: GW peak + IA peak combined yields tiny / zero flips on cold biomes', () => {
    // GW default: +8°C / +50 mm; IA default: -10°C / -30 mm → combined -2°C / +20 mm.
    const combined = { tempC: 8 + -10, precipMm: 50 + -30 };
    const tundra = projectBiome(BIOME.TUNDRA, combined);
    const temperate = projectBiome(BIOME.TEMPERATE_BROADLEAF, combined);
    // Cancellation should leave the dominant biomes near no-flip — either
    // sub-threshold no-flip, or a weak flip with weight < 0.2.
    for (const out of [tundra, temperate]) {
      expect(out.weight).toBeLessThan(0.2);
    }
  });

  it('GW alone produces a strong tundra flip that combined GW+IA does not', () => {
    const gwOnly = projectBiome(BIOME.TUNDRA, { tempC: 8, precipMm: 50 });
    const combined = projectBiome(BIOME.TUNDRA, { tempC: -2, precipMm: 20 });
    expect(gwOnly.toId).toBe(BIOME.BOREAL);
    expect(gwOnly.weight).toBeGreaterThan(combined.weight);
  });
});

describe('buildProjectionPolygonTextures', () => {
  it('writes per-polygon class + weight when the delta moves the niche', () => {
    const count = 4;
    const polygonBiome = new Int8Array(count + 1);
    polygonBiome[1] = BIOME.TUNDRA;
    polygonBiome[2] = BIOME.DESERT;
    polygonBiome[3] = BIOME.TROPICAL_MOIST;
    polygonBiome[4] = 0; // no-data
    const tex = buildProjectionPolygonTextures({
      polygonBiome,
      count,
      delta: { tempC: 8, precipMm: 0 },
      weightScale: 1,
    });
    expect(tex.classByPoly).toHaveLength(count + 1);
    expect(tex.weightByPoly).toHaveLength(count + 1);
    expect(tex.tStart01ByPoly).toHaveLength(count + 1);
    // Tundra should have flipped to boreal.
    expect(tex.classByPoly[1]).toBe(BIOME.BOREAL);
    expect(tex.weightByPoly[1]).toBeGreaterThan(0);
    // No-data row stays zero.
    expect(tex.classByPoly[4]).toBe(0);
    expect(tex.weightByPoly[4]).toBe(0);
    expect(tex.assignedCount).toBeGreaterThan(0);
  });

  it('weightScale=0 zeros every entry without walking', () => {
    const count = 2;
    const polygonBiome = new Int8Array(count + 1);
    polygonBiome[1] = BIOME.TUNDRA;
    polygonBiome[2] = BIOME.DESERT;
    const tex = buildProjectionPolygonTextures({
      polygonBiome,
      count,
      delta: { tempC: 12, precipMm: 0 },
      weightScale: 0,
    });
    expect(tex.assignedCount).toBe(0);
    for (let i = 0; i <= count; i++) {
      expect(tex.classByPoly[i]).toBe(0);
      expect(tex.weightByPoly[i]).toBe(0);
    }
  });

  it('weightScale=0.5 halves the per-polygon weight vs scale=1', () => {
    const count = 1;
    const polygonBiome = new Int8Array(count + 1);
    polygonBiome[1] = BIOME.TUNDRA;
    const full = buildProjectionPolygonTextures({
      polygonBiome,
      count,
      delta: { tempC: 8, precipMm: 0 },
      weightScale: 1,
    });
    const half = buildProjectionPolygonTextures({
      polygonBiome,
      count,
      delta: { tempC: 8, precipMm: 0 },
      weightScale: 0.5,
    });
    expect(half.weightByPoly[1]).toBeLessThan(full.weightByPoly[1]!);
    // Allow ±1 byte for rounding around the 0.5 multiply.
    expect(Math.abs((full.weightByPoly[1]! >> 1) - half.weightByPoly[1]!)).toBeLessThanOrEqual(1);
  });
});

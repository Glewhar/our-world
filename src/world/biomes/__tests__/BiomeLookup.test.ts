import { describe, it, expect } from 'vitest';
import { BIOME, BIOME_LOOKUP, biomeName, biomeQuality } from '../BiomeLookup.js';

describe('BiomeLookup', () => {
  it('ranks rainforest above desert', () => {
    expect(biomeQuality(BIOME.TROPICAL_MOIST)).toBeGreaterThan(biomeQuality(BIOME.DESERT));
  });

  it('ranks wetland and mangrove above grassland', () => {
    expect(biomeQuality(BIOME.FLOODED_GRASSLAND)).toBeGreaterThan(
      biomeQuality(BIOME.TEMPERATE_GRASSLAND),
    );
    expect(biomeQuality(BIOME.MANGROVE)).toBeGreaterThan(biomeQuality(BIOME.TEMPERATE_GRASSLAND));
  });

  it('ranks ice below all vegetated biomes and wasteland at the bottom', () => {
    const vegetated = [
      BIOME.TROPICAL_MOIST,
      BIOME.TROPICAL_DRY,
      BIOME.TROPICAL_CONIFER,
      BIOME.TEMPERATE_BROADLEAF,
      BIOME.TEMPERATE_CONIFER,
      BIOME.BOREAL,
      BIOME.TROPICAL_SAVANNA,
      BIOME.TEMPERATE_GRASSLAND,
      BIOME.FLOODED_GRASSLAND,
      BIOME.MONTANE_GRASSLAND,
      BIOME.TUNDRA,
      BIOME.MEDITERRANEAN,
      BIOME.DESERT,
      BIOME.MANGROVE,
    ];
    for (const id of vegetated) {
      expect(biomeQuality(id)).toBeGreaterThan(biomeQuality(BIOME.ICE));
      expect(biomeQuality(id)).toBeGreaterThan(biomeQuality(BIOME.WASTELAND));
    }
    expect(biomeQuality(BIOME.WASTELAND)).toBeLessThanOrEqual(biomeQuality(BIOME.ICE));
  });

  it('keeps radiation residency low for forests and water, high for open biomes', () => {
    const forestOrWater = [
      BIOME.TROPICAL_MOIST,
      BIOME.TROPICAL_CONIFER,
      BIOME.TEMPERATE_BROADLEAF,
      BIOME.TEMPERATE_CONIFER,
      BIOME.FLOODED_GRASSLAND,
      BIOME.MANGROVE,
    ];
    const openLand = [BIOME.DESERT, BIOME.TUNDRA, BIOME.TEMPERATE_GRASSLAND];
    for (const f of forestOrWater) {
      for (const o of openLand) {
        expect(BIOME_LOOKUP[f].radiationResidency).toBeLessThan(
          BIOME_LOOKUP[o].radiationResidency,
        );
      }
    }
  });

  it('places climate niches in expected ordering', () => {
    expect(BIOME_LOOKUP[BIOME.ICE].climateNiche.tempCenterC).toBeLessThan(
      BIOME_LOOKUP[BIOME.TUNDRA].climateNiche.tempCenterC,
    );
    expect(BIOME_LOOKUP[BIOME.TUNDRA].climateNiche.tempCenterC).toBeLessThan(
      BIOME_LOOKUP[BIOME.BOREAL].climateNiche.tempCenterC,
    );
    expect(BIOME_LOOKUP[BIOME.BOREAL].climateNiche.tempCenterC).toBeLessThan(
      BIOME_LOOKUP[BIOME.TEMPERATE_BROADLEAF].climateNiche.tempCenterC,
    );
    expect(BIOME_LOOKUP[BIOME.TEMPERATE_BROADLEAF].climateNiche.tempCenterC).toBeLessThan(
      BIOME_LOOKUP[BIOME.TROPICAL_MOIST].climateNiche.tempCenterC,
    );
    expect(BIOME_LOOKUP[BIOME.DESERT].climateNiche.precipCenterMm).toBeLessThan(
      BIOME_LOOKUP[BIOME.TROPICAL_MOIST].climateNiche.precipCenterMm,
    );
  });

  it('has a stable entry for every id 0..19', () => {
    expect(BIOME_LOOKUP).toHaveLength(20);
    for (let id = 0; id < BIOME_LOOKUP.length; id++) {
      expect(BIOME_LOOKUP[id].id).toBe(id);
    }
  });

  it('biomeName falls back to a string for unknown ids', () => {
    expect(biomeName(999)).toBe('unknown');
    expect(biomeName(BIOME.TROPICAL_MOIST)).toBe('tropical moist forest');
  });
});

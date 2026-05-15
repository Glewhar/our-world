/**
 * Shared contract — world-health snapshot.
 *
 * The HUD strip (Biome / Civilization / Radiation) reads one struct per
 * frame via `ScenarioRegistry.getWorldHealth()`. Three normalised levels
 * + a `stats` bag for the per-module visualisations.
 *
 *   biome         1 = pristine; can rise above 0 again as positive
 *                   transitions (e.g. desert → wetland) cancel losses.
 *   civilization  1 = pristine (no city / population at risk)
 *   radiation     0 = clean   (HUD strata bar fills with this directly)
 *
 * `biomeChanges` carry signed `deltaPct` (positive = quality gain).
 * `biomeQualityNet` is the signed roll-up across all active scenarios:
 * Σ areaFraction × (quality(to) − quality(from)). Negative = degradation,
 * positive = ecosystem upgrade.
 *
 * `biomeCategoryShares` rolls every biome id into one of six diorama
 * categories so the hex-row HUD module can render a representative
 * "planet sample" without knowing the full biome ontology. Sums to 1
 * across categories when the registry's world totals are loaded; sums
 * to 0 (all zero) on the very first frame before the registry's lazy
 * world-totals cache has been built.
 */

export type BiomeCategoryShares = {
  rainforest: number;
  temperateForest: number;
  grassland: number;
  desert: number;
  tundraIce: number;
  wasteland: number;
};

export type WorldHealthSnapshot = {
  biome: number;
  civilization: number;
  radiation: number;
  stats: {
    citiesLost: number;
    citiesTotal: number;
    populationLost: number;
    populationLostPct: number;
    biomeChanges: Array<{
      fromId: number;
      toId: number;
      name: string;
      deltaPct: number;
    }>;
    biomeQualityNet: number;
    biomeCategoryShares: BiomeCategoryShares;
    bombsActive: number;
    radiationUnits: number;
  };
};

export function zeroBiomeCategoryShares(): BiomeCategoryShares {
  return {
    rainforest: 0,
    temperateForest: 0,
    grassland: 0,
    desert: 0,
    tundraIce: 0,
    wasteland: 0,
  };
}

/** Default snapshot when no scenarios are active — pristine readings. */
export function pristineWorldHealth(
  baselineShares: BiomeCategoryShares = zeroBiomeCategoryShares(),
  citiesTotal = 0,
): WorldHealthSnapshot {
  return {
    biome: 1,
    civilization: 1,
    radiation: 0,
    stats: {
      citiesLost: 0,
      citiesTotal,
      populationLost: 0,
      populationLostPct: 0,
      biomeChanges: [],
      biomeQualityNet: 0,
      biomeCategoryShares: { ...baselineShares },
      bombsActive: 0,
      radiationUnits: 0,
    },
  };
}

/**
 * GlobalWarmingScenario.config — all tunables for the global-warming
 * climate scenario.
 *
 * Effect summary:
 *   - simulation: temperature rises by `+maxTempDeltaC` at plateau and
 *     sea level rises by `+maxSeaLevelM`. Each baseline biome
 *     crossfades toward its warmer/drier successor per
 *     `transitionRules` — vulnerable biomes (tundra, mediterranean,
 *     mangrove) start transforming first; rainforest core only browns
 *     at the edges late in the envelope.
 *   - visual: tundra (Greenland, Arctic) shifts to dark boreal green
 *     first; boreal southern edge yellows to grassland next; temperate
 *     interiors fade to grassland; finally rainforest edges brown
 *     while desert belts expand. Sahara stays Sahara.
 *
 * Lifetime envelope is `climateRisePlateauFall`. The land shader
 * remaps the global envelope per cell using each cell's `tStart01`
 * (G channel of the override-stamp texture), so the same envelope
 * drives staggered onset without any per-frame CPU cost.
 */

import type { BiomeTransitionRule } from '../types.js';
import { BIOME } from './IceAgeScenario.config.js';

export type GlobalWarmingScenarioConfig = {
  /** Peak temperature delta at plateau in °C (positive). */
  maxTempDeltaC: number;
  /** Peak sea-level rise at plateau in metres (positive). */
  maxSeaLevelM: number;
  /** Scenario lifetime in `totalDays` units (1 year = 12 days). */
  durationDays: number;
  /**
   * Per-biome transition LUT. Earlier rules win for the same `from`,
   * so put elev-gated specials before the fallback.
   */
  transitionRules: readonly BiomeTransitionRule[];
};

/**
 * Warming LUT — biome-by-biome ecological response to global warming.
 * Weights = how completely the biome converts at full envelope;
 * tStart01 = when the cell starts (vulnerable = small, resilient = large).
 */
export const GLOBAL_WARMING_TRANSITIONS: readonly BiomeTransitionRule[] = [
  // Tundra collapses FIRST and FULLY — first major loser of a warming world.
  { from: BIOME.TUNDRA, to: BIOME.BOREAL, weight: 1.0, tStart01: 0.0 },

  // Mediterranean burns/desertifies — very vulnerable, fast.
  { from: BIOME.MEDITERRANEAN, to: BIOME.DESERT, weight: 0.95, tStart01: 0.05 },

  // Mangroves drown/die-back — fast.
  { from: BIOME.MANGROVE, to: BIOME.DESERT, weight: 0.6, tStart01: 0.05 },

  // High montane stays cooler than its latitude (alpine zones move up,
  // but lower bands convert to grassland). Lower montane only.
  { from: BIOME.MONTANE_GRASSLAND, to: BIOME.TEMPERATE_GRASSLAND, weight: 0.55, tStart01: 0.2, elevGateMaxM: 2500 },

  // Boreal southern edge dies to grassland. Quick onset.
  { from: BIOME.BOREAL, to: BIOME.TEMPERATE_GRASSLAND, weight: 0.9, tStart01: 0.15 },

  // Flooded grassland dries out.
  { from: BIOME.FLOODED_GRASSLAND, to: BIOME.DESERT, weight: 0.65, tStart01: 0.25 },

  // Temperate forests in continental interiors convert to grassland
  // (|lat| > 40° OR elev > 200 m is a rough continental-interior proxy).
  { from: BIOME.TEMPERATE_BROADLEAF, to: BIOME.TEMPERATE_GRASSLAND, weight: 0.7, tStart01: 0.3 },
  { from: BIOME.TEMPERATE_CONIFER, to: BIOME.TEMPERATE_GRASSLAND, weight: 0.6, tStart01: 0.3 },

  // Temperate grassland interiors → desert.
  { from: BIOME.TEMPERATE_GRASSLAND, to: BIOME.DESERT, weight: 0.75, tStart01: 0.4 },

  // Tropical savanna belts → desert (subtropical desert expansion).
  { from: BIOME.TROPICAL_SAVANNA, to: BIOME.DESERT, weight: 0.7, tStart01: 0.45 },

  // Tropical dry forest → desert.
  { from: BIOME.TROPICAL_DRY, to: BIOME.DESERT, weight: 0.8, tStart01: 0.45 },

  // Tropical coniferous → savanna.
  { from: BIOME.TROPICAL_CONIFER, to: BIOME.TROPICAL_SAVANNA, weight: 0.7, tStart01: 0.5 },

  // Rainforest (tropical moist) → savanna — ONLY at the edges
  // (|lat| > 10°). Slowest, partial. Core stays green.
  {
    from: BIOME.TROPICAL_MOIST,
    to: BIOME.TROPICAL_SAVANNA,
    weight: 0.55,
    tStart01: 0.6,
    latGateAbsDegMin: 10,
  },
];

export const DEFAULT_GLOBAL_WARMING_CONFIG: GlobalWarmingScenarioConfig = {
  maxTempDeltaC: 8,
  maxSeaLevelM: 70,
  durationDays: 30,
  transitionRules: GLOBAL_WARMING_TRANSITIONS,
};

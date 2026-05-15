/**
 * biomeProjection.config — tuning knobs for `projectBiome`.
 *
 * Effect summary:
 *   - simulation: controls how aggressively a climate delta drags a
 *     baseline biome toward the closest matching niche. Higher
 *     `MIN_DELTA_TO_FLIP` = small deltas leave the planet alone; higher
 *     `WEIGHT_NORMALISER` = each polygon flips less completely at a
 *     given delta.
 *   - visual: tune these to widen / narrow the band of climate deltas
 *     over which the planet visibly transforms.
 *
 * `VULNERABILITY_ORDER` is the static onset timing per baseline biome.
 * Drives the `tStart01` field of every projected transition so tundra
 * still goes first and rainforest goes last under any delta, matching
 * the ecological reality that resilient cores hold out longer.
 */

import { BIOME } from '../biomes/BiomeLookup.js';

/**
 * Reference scale for `magnitude(delta) = |tempC|/MAG_TEMP_REF +
 * |precipMm|/MAG_PRECIP_REF`. A pure +3°C swing has magnitude ≈ 1; a
 * pure +300 mm/y swing has magnitude ≈ 1.
 */
export const MAG_TEMP_REF = 3;
export const MAG_PRECIP_REF = 300;

/**
 * Combined-delta magnitude below which no flip happens — used to mute
 * the projection when GW + IA cancellation leaves a ~zero combined frame.
 * A combined +2°C / +20 mm gives magnitude ≈ 0.73, just clearing this
 * gate; +1°C / +10 mm sits below it and produces zero-weight output.
 */
export const MIN_DELTA_TO_FLIP = 1.6;

/**
 * Divisor for the weight formula `weight = clamp(advantage × magnitude
 * / WEIGHT_NORMALISER, 0, 1)`. A pure +8°C swing with a fitter target
 * (advantage ≈ 0.5) produces weight ≈ 0.45 — strong but not max.
 */
export const WEIGHT_NORMALISER = 3;

/**
 * Per-baseline onset offset in [0, 1]. Small = quick to flip;
 * large = resilient core that holds out into the plateau. Matches the
 * ecological vulnerability ordering the old hardcoded LUTs encoded.
 */
export const VULNERABILITY_ORDER: Record<number, number> = {
  [BIOME.TUNDRA]: 0.0,
  [BIOME.MEDITERRANEAN]: 0.05,
  [BIOME.MANGROVE]: 0.05,
  [BIOME.MONTANE_GRASSLAND]: 0.1,
  [BIOME.BOREAL]: 0.15,
  [BIOME.FLOODED_GRASSLAND]: 0.2,
  [BIOME.TEMPERATE_BROADLEAF]: 0.3,
  [BIOME.TEMPERATE_CONIFER]: 0.3,
  [BIOME.ICE]: 0.3,
  [BIOME.TEMPERATE_GRASSLAND]: 0.4,
  [BIOME.TROPICAL_SAVANNA]: 0.45,
  [BIOME.TROPICAL_DRY]: 0.45,
  [BIOME.DESERT]: 0.5,
  [BIOME.TROPICAL_CONIFER]: 0.5,
  [BIOME.TROPICAL_MOIST]: 0.6,
};

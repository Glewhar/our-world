/**
 * Tunables for the bottom-center health-bar HUD.
 *
 * Kept in their own file so balance tweaks (how much quality damage
 * empties the bar, how much fixes it) don't churn `health-hud.ts`.
 */
/**
 * Quality-net divisor for the biome bar. The bar reads
 *   biome = clamp01(1 + biomeQualityNet / SCALE_BIOME_BAR)
 * with `biomeQualityNet` measured in `Σ (landFraction × Δqual)`,
 * where Δqual lives on the 0..10 BLT quality scale.
 *
 * 0.5 → a planet-wide drop of 0.5 quality-fraction (e.g. half the land
 * loses 1 quality rank) empties the bar; an equal-magnitude gain pins
 * the bar at 100 %.
 */
export const SCALE_BIOME_BAR = 0.5;
/** Toward-target lerp rate per `update()` call. */
export const LERP_RATE = 0.18;
/** Bar pulses when the target drops more than this in one update. */
export const DROP_PULSE_THRESHOLD = 0.05;

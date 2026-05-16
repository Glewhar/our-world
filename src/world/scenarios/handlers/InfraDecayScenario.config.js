/**
 * Infrastructure-Decay config.
 *
 * The scenario auto-fires once per game when the world's population
 * hits zero. It does not kill anyone — its only job is to erase every
 * city and every road over a fixed lifetime so a dead planet ends up
 * visibly stripped of civilisation.
 *
 * One `totalDays` unit = one in-game month (see `Tweakpane.ts`), so
 * four units = roughly four in-game months. That's enough headroom for
 * the cities + highways fragment shader's per-polygon
 * `seedToThreshold` randomisation to spread the visual decay across
 * the lifetime instead of flipping everything at once.
 */
export const INFRA_DECAY_DURATION_DAYS = 4;
export const INFRA_DECAY_LABEL = 'Infrastructure Decay';

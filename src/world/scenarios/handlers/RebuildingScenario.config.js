/**
 * Rebuilding config.
 *
 * Auto-fires once a killer scenario stops adding fresh damage and the
 * world still has survivors. Drains the registry's damage ledger over
 * `REBUILD_DURATION_DAYS` in-game time — cities and roads paint back,
 * population counters climb.
 *
 * One `totalDays` unit = one in-game month, so 240 units ≈ 20 years.
 * Deliberately slower than the killer's natural fade so regrowth reads
 * as a calm recovery, not an instant snap-back.
 */
export const REBUILD_DURATION_DAYS = 240;
export const REBUILD_LABEL = 'Rebuilding';

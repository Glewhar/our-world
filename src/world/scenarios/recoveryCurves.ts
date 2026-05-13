/**
 * Recovery curves — small pure functions that map a scenario's
 * `progress01` ∈ [0, 1] to an intensity multiplier ∈ [0, 1].
 *
 * Each scenario's "peak stamp" (captured once at start) gets multiplied
 * by this curve every frame, so the curve is solely responsible for the
 * decay feel.
 *
 * Exported as standalone functions so future scenario kinds can pick
 * different shapes without owning their own math.
 */

/**
 * Quick start, slow tail. `exponent` controls the bend:
 *   - 1.0 = linear
 *   - 2.0 = quadratic ease-out
 *   - 2.5 = the design default for nuclear (quick visible decay, long tail)
 *   - 4.0+ = mostly vanished in the first quarter, ghost for the rest
 */
export function decayQuickThenSlow(progress01: number, exponent = 2.5): number {
  const p = progress01 < 0 ? 0 : progress01 > 1 ? 1 : progress01;
  return Math.pow(1 - p, exponent);
}

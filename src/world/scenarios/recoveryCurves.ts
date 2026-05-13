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
 *
 * Brief 0.4 → 1.0 ramp at the start of the lifetime so the discard-based
 * cities/highways dissolve happens *while the explosion fireball is on
 * screen*. With the shader threshold range mix(0.0, 0.5, h), the ramp
 * vanishes ~80% of features at impact and the remaining ~20% during
 * the ramp — hidden under the fireball — before the existing decay
 * tail brings them back.
 */
export function decayQuickThenSlow(
  progress01: number,
  exponent = 2.5,
  rampEnd = 0.02,
): number {
  const p = progress01 < 0 ? 0 : progress01 > 1 ? 1 : progress01;
  if (p < rampEnd) {
    return 0.4 + (1.0 - 0.4) * (p / rampEnd);
  }
  // Rescale decay so it starts at 1.0 at p = rampEnd and reaches 0 at p = 1.
  const q = (p - rampEnd) / (1 - rampEnd);
  return Math.pow(1 - q, exponent);
}

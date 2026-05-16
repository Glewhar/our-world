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
export function decayQuickThenSlow(progress01, exponent = 2.5, rampEnd = 0.02) {
    const p = progress01 < 0 ? 0 : progress01 > 1 ? 1 : progress01;
    if (p < rampEnd) {
        return 0.4 + (1.0 - 0.4) * (p / rampEnd);
    }
    // Rescale decay so it starts at 1.0 at p = rampEnd and reaches 0 at p = 1.
    const q = (p - rampEnd) / (1 - rampEnd);
    return Math.pow(1 - q, exponent);
}
/**
 * Sustained-then-collapse decay. Hold near peak for `holdFrac` of the
 * lifetime, then fall to 0 by the end with an `exponent`-shaped tail.
 * Same `rampEnd` startup ramp as `decayQuickThenSlow` so cities and
 * highways still vanish under the fireball at strike time. Used by
 * Nuclear War's no-rebuild mode so wasted cells stay dead through the
 * winter plateau.
 */
export function decaySustained(progress01, holdFrac = 0.85, exponent = 2.5, rampEnd = 0.02) {
    const p = progress01 < 0 ? 0 : progress01 > 1 ? 1 : progress01;
    if (p < rampEnd)
        return 0.4 + 0.6 * (p / rampEnd);
    if (p < holdFrac)
        return 1.0;
    const q = (p - holdFrac) / (1 - holdFrac);
    return Math.pow(1 - q, exponent);
}
/**
 * Infrastructure-Decay envelope: gentle eased ramp from 0 to 1, no
 * falloff. The fragment shader's per-polygon `seedToThreshold`
 * randomisation spreads the visual decay across the lifetime, so a
 * mildly accelerating ramp (`p^1.5`) gives a subtle onset and a clear
 * "finishing the job" feel at the end. Never returns above 1 — infra
 * loss must not reverse.
 */
export function infraDecayEnvelope(progress01) {
    const p = progress01 < 0 ? 0 : progress01 > 1 ? 1 : progress01;
    return Math.pow(p, 1.5);
}
/**
 * Climate envelope: linear rise → plateau at 1 → linear fall.
 *
 *   - 0 → 1 over first `riseFrac` of lifetime (default 10%)
 *   - hold 1 through middle (default 60%)
 *   - 1 → 0 over last `fallFrac` (default 30%)
 *
 * No 0.4 startup pop (unlike decayQuickThenSlow). Used by climate scenarios
 * so peak temp/sea-level deviation builds smoothly and decays gracefully.
 */
export function climateRisePlateauFall(progress01, riseFrac = 0.30, fallFrac = 0.30) {
    const p = progress01 < 0 ? 0 : progress01 > 1 ? 1 : progress01;
    if (p < riseFrac)
        return p / riseFrac;
    if (p > 1 - fallFrac)
        return (1 - p) / fallFrac;
    return 1;
}

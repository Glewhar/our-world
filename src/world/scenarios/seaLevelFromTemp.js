/**
 * seaLevelFromTempDelta — paleoclimate-anchored sea-level response to a
 * temperature delta. The launcher exposes only ΔT now; sea level falls
 * out of this curve so the user can't dial in a physically incoherent
 * combination (huge sea rise with no warming, etc.).
 *
 * Asymmetric piecewise exponential — different time-constants for
 * warming vs cooling because the geological record is asymmetric: only
 * ~75 m of ice exists to melt (Antarctica + Greenland + glaciers), but
 * the continental shelves let sea drop ~130 m at the Last Glacial
 * Maximum.
 *
 *   S(ΔT) = mult × Smax(ΔT) × (1 − exp(−|ΔT| / τ(ΔT))) × sign(ΔT)
 *
 *     warming  (ΔT > 0):  Smax = +75 m, τ = 8 °C
 *     cooling  (ΔT < 0):  Smax = 130 m, τ = 4 °C
 *     ΔT = 0:             S = 0
 *
 * Anchor table (mult = 1):
 *   ΔT     S (m)   real-world anchor
 *   −30 °C −130    Snowball-Earth cap (no shelf left to drown)
 *   −12 °C −124    Deep glacial near asymptote
 *    −6 °C −101    Last Glacial Maximum (~−120 m at ΔT ~−5/−6 °C)
 *    −3 °C  −62    Mid-Pleistocene glaciation
 *     0 °C    0    Present day
 *    +3 °C  +23    Mid-Pliocene
 *    +6 °C  +40    Eocene optimum ballpark
 *   +12 °C  +58    Most continental ice gone
 *   +30 °C  +73    Asymptote — Greenland + Antarctica + glaciers
 */
export function seaLevelFromTempDelta(tempC, multiplier = 1) {
    if (tempC === 0)
        return 0;
    const tau = tempC > 0 ? 8 : 4;
    const smax = tempC > 0 ? 75 : 130;
    const s = smax * (1 - Math.exp(-Math.abs(tempC) / tau));
    return multiplier * s * Math.sign(tempC);
}

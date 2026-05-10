/**
 * Decay-only kernel for the slice — full CA / diffusion comes later.
 *
 * Each dynamic channel decays at its own per-tick rate (multiplicative).
 * "Half-life in ticks" is the ergonomic input; we precompute the per-tick
 * factor as `0.5 ** (1 / halfLifeTicks)`. At 20 Hz field clock, a
 * `halfLifeTicks = 30` decays fire from 1.0 to ~0.06 over 4.2 s — slow
 * enough for the user to see the patch fade, fast enough to land the
 * acceptance test in "a few seconds."
 *
 * Why no spread yet: the reactive sandbox demo per
 * `docs/plans/04-sim-engine.md` is "patch fades cleanly." Spread (fire
 * jumps to neighbour cells) needs a HEALPix neighbourhood query and the
 * field-grid abstraction it's bound to; that's a follow-up PR.
 *
 * Determinism (C6): pure data transform, no PRNG, no clocks. Inputs map
 * to outputs deterministically.
 */
/**
 * Default half-lives, hand-picked for the vertical-slice demo. These are
 * not balance numbers — the real values come from `config/balance/global.yaml`
 * once the YAML loader lands.
 */
export const DEFAULT_DECAY = Object.freeze({
    fire: { halfLifeTicks: 30 },
    ice: { halfLifeTicks: 600 }, // ~30 s @ 20 Hz — ice melts slowly
    infection: { halfLifeTicks: 1200 }, // ~60 s — infection lingers
    pollution: { halfLifeTicks: 2400 }, // ~120 s — pollution accumulates
});
export function decayStep(grid, config = DEFAULT_DECAY) {
    const factors = {
        fire: halfLifeToFactor(config.fire.halfLifeTicks),
        ice: halfLifeToFactor(config.ice.halfLifeTicks),
        infection: halfLifeToFactor(config.infection.halfLifeTicks),
        pollution: halfLifeToFactor(config.pollution.halfLifeTicks),
    };
    grid.decayAll(factors);
}
function halfLifeToFactor(halfLifeTicks) {
    if (!Number.isFinite(halfLifeTicks) || halfLifeTicks <= 0)
        return 1;
    return Math.pow(0.5, 1 / halfLifeTicks);
}

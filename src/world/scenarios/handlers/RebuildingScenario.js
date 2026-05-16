/**
 * RebuildingScenario — auto-fires when killer damage has stalled and
 * the world still has survivors. Drains the registry-owned damage
 * ledger over `REBUILD_DURATION_DAYS` so cities and roads paint back
 * and population counters climb.
 *
 * Behaviour:
 *   onStart: no-op. The registry reads this scenario's `intensity` each
 *     tick and writes the value into `damageLedger.rebuildProgress`.
 *   onTick:  no-op.
 *   onEnd:   bakes the current rebuild into the ledger — `ledger.X *=
 *     (1 - rebuildProgress)` on every channel — and clears
 *     `rebuildProgress` back to 0. The registry does the bake (it owns
 *     the ledger); the handler just provides the curve.
 *
 * Impact budget: zero on every axis. Rebuilding mutates the ledger
 * directly; it must not push the civilization bar, flip biomes, or add
 * radiation. The ledger drain produces the visible HUD reversal.
 *
 * Not climate-class — must coexist with any in-progress killer that's
 * still riding its own natural fade (sea level still recedes, soot
 * still lifts).
 */
import { zeroBudget } from '../impactBudget.js';
import { rebuildEnvelope } from '../recoveryCurves.js';
export const RebuildingScenario = {
    onStart(_scn, _ctx) {
        // No-op. The registry treats this scenario as a curve generator —
        // `intensity()` is sampled each frame into `damageLedger.rebuildProgress`.
    },
    onTick(_scn, _progress01, _ctx) {
        // No-op — the registry drives the ledger drain.
    },
    onEnd(_scn, _ctx) {
        // No-op — the registry's stop / end path bakes rebuildProgress
        // into the ledger and resets it. Doing the bake here would require
        // the handler to reach into private ledger state.
    },
    intensity(_scn, progress01) {
        return rebuildEnvelope(progress01);
    },
    computeImpactBudget(_scn, _deps) {
        return zeroBudget();
    },
};

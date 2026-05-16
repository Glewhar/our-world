/**
 * InfraDecayScenario — auto-fires once per game when world population
 * hits zero. Slowly erases every city and road across the planet over
 * `INFRA_DECAY_DURATION_DAYS` in-game time.
 *
 * Behaviour:
 *   onStart:
 *     Walk the polygon lookup once and build a Uint8Array marking every
 *     land polygon (baseline biome != 0) as 255. Cache it on a
 *     module-scoped WeakMap so the per-frame destruction frame can
 *     return the same array without reallocating.
 *   onTick:
 *     no-op — the eased ramp + the fragment shader's per-polygon
 *     `seedToThreshold` randomisation do all the work.
 *   onEnd:
 *     drop the cached mask.
 *
 * Destruction contribution:
 *   Returns `{ polyFlipMask, seaLevelM: 0, intensity }` every frame.
 *   The registry max-merges this against any concurrent climate
 *   scenario (e.g. a still-running Global Warming that hasn't yet
 *   finished its own clock) — the killer keeps its sea-level rise,
 *   Infra-Decay adds full-planet city/road erasure on top.
 *
 * Impact budget: zero on every axis — the scenario must not push the
 * civilization bar further, must not flip biomes, must not add
 * radiation. By the time it fires, the killer scenario already drove
 * the population to zero; Infra-Decay is purely cosmetic from a
 * world-health perspective.
 *
 * Not climate-class — must coexist with an in-progress Global Warming
 * or Ice Age so the killer keeps running its own clock.
 */
import { zeroBudget } from '../impactBudget.js';
import { infraDecayEnvelope } from '../recoveryCurves.js';
import { allPopulatedPolygons } from '../climateDestructionStamps.js';
const peakState = new WeakMap();
export const InfraDecayScenario = {
    onStart(scn, ctx) {
        const lookup = ctx.getPolygonLookup();
        const polyFlipMask = lookup ? allPopulatedPolygons(lookup) : null;
        peakState.set(scn, { polyFlipMask });
    },
    onTick(_scn, _progress01, _ctx) {
        // No per-frame work — destruction is owned by the cities + highways shaders.
    },
    onEnd(scn, _ctx) {
        peakState.delete(scn);
    },
    getDestructionContribution(scn, progress01, _ctx) {
        const s = peakState.get(scn);
        return {
            polyFlipMask: s?.polyFlipMask ?? null,
            seaLevelM: 0,
            intensity: infraDecayEnvelope(progress01),
        };
    },
    intensity(_scn, progress01) {
        return infraDecayEnvelope(progress01);
    },
    computeImpactBudget(_scn, _deps) {
        return zeroBudget();
    },
};

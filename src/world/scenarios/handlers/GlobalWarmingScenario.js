/**
 * GlobalWarmingScenario — climate-class scenario that warms the planet.
 *
 * Behaviour:
 *   onStart:
 *     Walk every HEALPix cell, look up its baseline biome + elevation,
 *     apply the warming transition LUT, and emit one biome-override
 *     stamp per target biome. Vulnerable biomes (tundra, mediterranean,
 *     mangrove) start transforming at progress ≈ 0; rainforest core
 *     kicks in late at progress ≈ 0.6. Per-cell `tStart01` is baked
 *     into the override-stamp texture's G channel; the land shader
 *     remaps the global envelope per fragment.
 *   onTick:
 *     no-op — the registry's frame composer scales the override
 *     stamps via `climateRisePlateauFall(progress01)` GPU-side.
 *   onEnd:
 *     no-op — the registry retires stamps and re-bakes the override
 *     textures to zero on the same frame.
 *
 * Climate contribution:
 *   `getClimateContribution(progress01)` returns
 *     `{ tempC: maxTempDeltaC × env, seaLevelM: maxSeaLevelM × env }`
 *   where `env = climateRisePlateauFall(progress01)`. Both fields are
 *   positive — the global warming pushes temperature and sea level up.
 *
 * Tuning lives in [GlobalWarmingScenario.config.ts] — transition
 * rules, weights, onset times, lifetime defaults all co-locate there
 * so changing "what global warming does" never requires editing the
 * handler.
 */
import { climateRisePlateauFall } from '../recoveryCurves.js';
import { DEFAULT_GLOBAL_WARMING_CONFIG } from './GlobalWarmingScenario.config.js';
export const GlobalWarmingScenario = {
    isClimateClass: true,
    onStart(_scn, ctx) {
        const cfg = DEFAULT_GLOBAL_WARMING_CONFIG;
        ctx.paintBiomeTransition(cfg.transitionRules);
    },
    onTick(_scn, _progress01, _ctx) {
        // No per-frame work — the registry's composer handles intensity scaling.
    },
    onEnd(_scn, _ctx) {
        // No teardown — the registry retires the stamps on the last frame.
    },
    getClimateContribution(scn, progress01) {
        const env = climateRisePlateauFall(progress01);
        return {
            tempC: scn.payload.maxTempDeltaC * env,
            seaLevelM: scn.payload.maxSeaLevelM * env,
        };
    },
};

/**
 * IceAgeScenario — climate-class scenario that cools the planet.
 *
 * Behaviour:
 *   onStart:
 *     Walk every HEALPix cell, look up its baseline biome + elevation,
 *     apply the cooling transition LUT, and emit one biome-override
 *     stamp per target biome. Vulnerable biomes (tundra, mangrove,
 *     high montane) start transforming at progress ≈ 0; rainforest
 *     core kicks in late at progress ≈ 0.6. Per-cell `tStart01` is
 *     baked into the override-stamp texture's G channel; the land
 *     shader remaps the global envelope per fragment.
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
 *   negative — ice age pulls temperature and sea level down.
 *
 * Tuning lives in [IceAgeScenario.config.ts] — transition rules,
 * weights, onset times, lifetime defaults all co-locate there so
 * changing "what the ice age does" never requires editing the handler.
 */

import { climateRisePlateauFall } from '../recoveryCurves.js';
import type {
  ClimateContribution,
  Scenario,
  ScenarioContext,
  ScenarioKindHandler,
} from '../types.js';
import { DEFAULT_ICE_AGE_CONFIG } from './IceAgeScenario.config.js';

export const IceAgeScenario: ScenarioKindHandler<'iceAge'> = {
  isClimateClass: true,

  onStart(_scn: Scenario<'iceAge'>, ctx: ScenarioContext): void {
    const cfg = DEFAULT_ICE_AGE_CONFIG;
    ctx.paintBiomeTransition(cfg.transitionRules);
  },

  onTick(_scn: Scenario<'iceAge'>, _progress01: number, _ctx: ScenarioContext): void {
    // No per-frame work — the registry's composer handles intensity scaling.
  },

  onEnd(_scn: Scenario<'iceAge'>, _ctx: ScenarioContext): void {
    // No teardown — the registry retires the stamps on the last frame.
  },

  getClimateContribution(
    scn: Scenario<'iceAge'>,
    progress01: number,
  ): ClimateContribution {
    const env = climateRisePlateauFall(progress01);
    return {
      tempC: scn.payload.maxTempDeltaC * env,
      seaLevelM: scn.payload.maxSeaLevelM * env,
    };
  },
};

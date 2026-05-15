/**
 * GlobalWarmingScenario — climate-class scenario that warms the planet.
 *
 * Behaviour:
 *   onStart:
 *     Capture peak ΔT / Δsea / Δprecip. The registry bake then folds
 *     this scenario into the combined-frame polygon projection — no
 *     hand-tuned transition LUT, no per-cell walk inside the handler.
 *     If an Ice Age is already running, the combined frame is near-zero
 *     and the projection produces near-empty stamps; otherwise the
 *     warming projection rolls across the planet's polygon baseline.
 *   onTick:
 *     no-op — envelope-scaled paint is owned by the LAND shader.
 *   onEnd:
 *     no-op — the registry retires stamps and re-bakes the override
 *     textures on the same frame.
 *
 * Climate contribution:
 *   `getClimateContribution(progress01)` returns the per-frame ΔT /
 *   ΔseaLevel / Δprecip scaled by `climateRisePlateauFall(progress01)`.
 *   `peakClimateContribution(scn)` returns the unsScaled peak — the
 *   registry sums these across active climate scenarios to build the
 *   combined frame the polygon projection consumes at bake time.
 *
 * Impact budget: polygon projection biome loss only. No cities, no
 * radiation. Intensity = `climateRisePlateauFall` so the HUD biome
 * roll-up matches the GPU biome paint envelope.
 *
 * Tuning lives in [GlobalWarmingScenario.config.ts] — peak deltas and
 * lifetime defaults co-locate there so changing "what global warming
 * does" never requires editing the handler.
 */

import {
  tallyProjectionBiome,
  zeroBudget,
  type ImpactBudgetDeps,
  type ScenarioImpactBudget,
} from '../impactBudget.js';
import { climateRisePlateauFall } from '../recoveryCurves.js';
import { seaLevelFromTempDelta } from '../seaLevelFromTemp.js';
import type {
  ClimateContribution,
  Scenario,
  ScenarioContext,
  ScenarioKindHandler,
} from '../types.js';
import { DEFAULT_GLOBAL_WARMING_CONFIG } from './GlobalWarmingScenario.config.js';

export const GlobalWarmingScenario: ScenarioKindHandler<'globalWarming'> = {
  isClimateClass: true,

  onStart(_scn: Scenario<'globalWarming'>, _ctx: ScenarioContext): void {
    // Nothing to paint — the registry's bake reads `peakClimateContribution`
    // and runs the polygon projection itself.
  },

  onTick(_scn: Scenario<'globalWarming'>, _progress01: number, _ctx: ScenarioContext): void {
    // No per-frame work — the LAND shader handles the envelope crossfade.
  },

  onEnd(_scn: Scenario<'globalWarming'>, _ctx: ScenarioContext): void {
    // No teardown — the registry retires stamps on the last frame.
  },

  getClimateContribution(
    scn: Scenario<'globalWarming'>,
    progress01: number,
    ctx: ScenarioContext,
  ): ClimateContribution {
    const env = climateRisePlateauFall(progress01);
    const liveTempC = scn.payload.maxTempDeltaC * env;
    const precipPeak =
      scn.payload.precipDeltaMm ?? DEFAULT_GLOBAL_WARMING_CONFIG.precipDeltaMm;
    return {
      tempC: liveTempC,
      seaLevelM: seaLevelFromTempDelta(liveTempC, ctx.getSeaLevelMultiplier()),
      precipMm: precipPeak * env,
    };
  },

  peakClimateContribution(
    scn: Scenario<'globalWarming'>,
    ctx: ScenarioContext,
  ): ClimateContribution {
    const peakTempC = scn.payload.maxTempDeltaC;
    return {
      tempC: peakTempC,
      seaLevelM: seaLevelFromTempDelta(peakTempC, ctx.getSeaLevelMultiplier()),
      precipMm: scn.payload.precipDeltaMm ?? DEFAULT_GLOBAL_WARMING_CONFIG.precipDeltaMm,
    };
  },

  intensity(_scn: Scenario<'globalWarming'>, progress01: number): number {
    return climateRisePlateauFall(progress01);
  },

  computeImpactBudget(
    _scn: Scenario<'globalWarming'>,
    deps: ImpactBudgetDeps,
  ): ScenarioImpactBudget {
    const budget = zeroBudget();
    const combined = deps.combinedClimate;
    tallyProjectionBiome(
      { tempC: combined.tempC, precipMm: combined.precipMm },
      deps,
      budget,
    );
    return budget;
  },
};

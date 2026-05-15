/**
 * IceAgeScenario — climate-class scenario that cools the planet.
 *
 * Behaviour: identical shape to GlobalWarming, opposite sign deltas.
 *   onStart: no paint — the registry bake reads `peakClimateContribution`
 *     and runs the polygon projection. When GW is already active, the
 *     combined frame (GW peak + IA peak) cancels and the projection
 *     produces near-empty stamps — the planet barely moves.
 *   onTick: no-op — LAND shader owns envelope crossfade.
 *   onEnd: no-op — the registry retires stamps + re-bakes the override
 *     textures on the same frame.
 *
 * Climate contribution: peak ΔT / Δsea / Δprecip all negative; scaled
 * per frame by `climateRisePlateauFall`. `peakClimateContribution`
 * exposes the unscaled peak so the registry's bake sees the right
 * cancellation against any concurrent climate scenario.
 *
 * Impact budget: polygon-projection biome loss only. No cities, no
 * radiation. Intensity tracks the same envelope so HUD bar matches
 * the GPU biome paint.
 *
 * Tuning lives in [IceAgeScenario.config.ts] — peak deltas + lifetime
 * defaults co-locate there.
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
  SeafloorContribution,
} from '../types.js';
import { DEFAULT_ICE_AGE_CONFIG } from './IceAgeScenario.config.js';

export const IceAgeScenario: ScenarioKindHandler<'iceAge'> = {
  isClimateClass: true,

  onStart(_scn: Scenario<'iceAge'>, _ctx: ScenarioContext): void {
    // No paint — registry bake handles polygon projection.
  },

  onTick(_scn: Scenario<'iceAge'>, _progress01: number, _ctx: ScenarioContext): void {
    // No per-frame work.
  },

  onEnd(_scn: Scenario<'iceAge'>, _ctx: ScenarioContext): void {
    // No teardown.
  },

  getClimateContribution(
    scn: Scenario<'iceAge'>,
    progress01: number,
    ctx: ScenarioContext,
  ): ClimateContribution {
    const env = climateRisePlateauFall(progress01);
    const liveTempC = scn.payload.maxTempDeltaC * env;
    const precipPeak =
      scn.payload.precipDeltaMm ?? DEFAULT_ICE_AGE_CONFIG.precipDeltaMm;
    return {
      tempC: liveTempC,
      seaLevelM: seaLevelFromTempDelta(liveTempC, ctx.getSeaLevelMultiplier()),
      precipMm: precipPeak * env,
    };
  },

  peakClimateContribution(
    scn: Scenario<'iceAge'>,
    ctx: ScenarioContext,
  ): ClimateContribution {
    const peakTempC = scn.payload.maxTempDeltaC;
    return {
      tempC: peakTempC,
      seaLevelM: seaLevelFromTempDelta(peakTempC, ctx.getSeaLevelMultiplier()),
      precipMm: scn.payload.precipDeltaMm ?? DEFAULT_ICE_AGE_CONFIG.precipDeltaMm,
    };
  },

  /**
   * Ice Age drops the sea slider and exposes the synthetic shelf
   * biomes the bake painted. Crossfade the LAND seafloor palette
   * toward the config's ice-age shelf colours (pale rim, mud,
   * exposed sand) on the same envelope that drives temperature /
   * sea-level deltas so the shelf colour ramp lines up with the
   * water surface dropping.
   */
  getSeafloorContribution(
    _scn: Scenario<'iceAge'>,
    progress01: number,
  ): SeafloorContribution {
    return {
      palette: [
        DEFAULT_ICE_AGE_CONFIG.seafloorPalette[0],
        DEFAULT_ICE_AGE_CONFIG.seafloorPalette[1],
        DEFAULT_ICE_AGE_CONFIG.seafloorPalette[2],
      ],
      weight: climateRisePlateauFall(progress01),
    };
  },

  intensity(_scn: Scenario<'iceAge'>, progress01: number): number {
    return climateRisePlateauFall(progress01);
  },

  computeImpactBudget(
    _scn: Scenario<'iceAge'>,
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

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
 *     A single ~14k polygon walk caches the desert flip mask + peak
 *     sea level on a module-scoped WeakMap so the per-frame
 *     destruction frame can hand them to the cities + highways shaders.
 *   onTick:
 *     no-op — envelope-scaled paint is owned by the LAND shader.
 *   onEnd:
 *     drop the cached destruction state.
 *
 * Climate contribution:
 *   `getClimateContribution(progress01)` returns the per-frame ΔT /
 *   ΔseaLevel / Δprecip scaled by `climateRisePlateauFall(progress01)`.
 *   `peakClimateContribution(scn)` returns the unscaled peak — the
 *   registry sums these across active climate scenarios to build the
 *   combined frame the polygon projection consumes at bake time.
 *
 * Destruction contribution:
 *   The registry pulls `{ polyFlipMask, seaLevelM, intensity }` every
 *   frame; the cities + highways shaders sample the mask by polyId
 *   and gate per-fragment destruction by `seaLevelM` and the envelope
 *   `intensity`. No per-frame CPU cell walks.
 *
 * Impact budget: polygon-projection biome loss + a magnitude-driven
 * extinction floor on populationAtRisk / citiesAtRisk. The floor is
 * the workaround for biome-projection score saturation at extreme
 * warming — see SCENARIO_TUNING_NOTES.md for the full breakdown.
 * Intensity = `climateRisePlateauFall` so the HUD biome roll-up
 * matches the GPU biome paint envelope.
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
import { polygonsThatFlipTo } from '../climateDestructionStamps.js';
import { BIOME } from '../../biomes/BiomeLookup.js';
import type {
  ClimateContribution,
  DestructionContribution,
  Scenario,
  ScenarioContext,
  ScenarioKindHandler,
} from '../types.js';
import { DEFAULT_GLOBAL_WARMING_CONFIG } from './GlobalWarmingScenario.config.js';

type PeakState = {
  polyFlipMask: Uint8Array | null;
  seaLevelM: number;
};

const peakState = new WeakMap<Scenario<'globalWarming'>, PeakState>();

export const GlobalWarmingScenario: ScenarioKindHandler<'globalWarming'> = {
  isClimateClass: true,

  onStart(scn: Scenario<'globalWarming'>, ctx: ScenarioContext): void {
    const lookup = ctx.getPolygonLookup();
    const peakDelta = {
      tempC: scn.payload.maxTempDeltaC,
      precipMm: scn.payload.precipDeltaMm ?? DEFAULT_GLOBAL_WARMING_CONFIG.precipDeltaMm,
    };
    const polyFlipMask = lookup
      ? polygonsThatFlipTo(peakDelta, BIOME.DESERT, lookup)
      : null;
    const peakSeaLevelM = Math.max(
      0,
      seaLevelFromTempDelta(scn.payload.maxTempDeltaC, ctx.getSeaLevelMultiplier()),
    );
    peakState.set(scn, { polyFlipMask, seaLevelM: peakSeaLevelM });
  },

  onTick(_scn: Scenario<'globalWarming'>, _progress01: number, _ctx: ScenarioContext): void {
    // No per-frame work — the LAND shader handles the envelope crossfade.
  },

  onEnd(scn: Scenario<'globalWarming'>, _ctx: ScenarioContext): void {
    peakState.delete(scn);
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
    const peakSeaLevelM = seaLevelFromTempDelta(
      scn.payload.maxTempDeltaC,
      ctx.getSeaLevelMultiplier(),
    );
    return {
      tempC: liveTempC,
      seaLevelM: peakSeaLevelM * env,
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

  getDestructionContribution(
    scn: Scenario<'globalWarming'>,
    progress01: number,
    _ctx: ScenarioContext,
  ): DestructionContribution {
    const s = peakState.get(scn);
    return {
      polyFlipMask: s?.polyFlipMask ?? null,
      seaLevelM: s?.seaLevelM ?? 0,
      intensity: climateRisePlateauFall(progress01),
    };
  },

  intensity(_scn: Scenario<'globalWarming'>, progress01: number): number {
    return climateRisePlateauFall(progress01);
  },

  computeImpactBudget(
    scn: Scenario<'globalWarming'>,
    deps: ImpactBudgetDeps,
  ): ScenarioImpactBudget {
    const budget = zeroBudget();
    const combined = deps.combinedClimate;
    tallyProjectionBiome(
      { tempC: combined.tempC, precipMm: combined.precipMm },
      deps,
      budget,
    );
    // Direct heat-extinction floor. The biome projection's score formula
    // picks TROPICAL_SAVANNA over DESERT under extreme warming (savanna's
    // wider tolerance scores higher when effective temperature blows past
    // every land biome's centre), so the flip-based pop tally would
    // collapse at exactly the slider notches that should kill the most
    // people. Keep the underlying tally for the low-end body-count and
    // take a magnitude-driven floor at the top — at +50°C every human
    // dies regardless of which biome the polygon nominally flipped to.
    const absT = Math.abs(scn.payload.maxTempDeltaC);
    const intensity = Math.pow(absT / 50, 2.5);
    const heatFloor = intensity * deps.totals.population;
    if (heatFloor > budget.populationAtRisk) {
      budget.populationAtRisk = heatFloor;
    }
    // Mirror the floor on the cities tally — same projection-saturation
    // bug eats the city counter at +50°C (no polygons flip to DESERT,
    // so the iceFlipPolyMask city loop never fires) even though the
    // visual stamp is destroying them on screen.
    const cityFloor = intensity * deps.cities.length;
    if (cityFloor > budget.citiesAtRisk) {
      budget.citiesAtRisk = cityFloor;
    }
    return budget;
  },
};

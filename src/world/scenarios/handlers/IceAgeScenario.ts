/**
 * IceAgeScenario — climate-class scenario that cools the planet.
 *
 * Behaviour: identical shape to GlobalWarming, opposite sign deltas.
 *   onStart: cache the ice flip mask (single ~14k polygon walk). No
 *     paint — the registry bake reads `peakClimateContribution` and
 *     runs the polygon projection. When GW is already active, the
 *     combined frame (GW peak + IA peak) cancels and the projection
 *     produces near-empty stamps — the planet barely moves.
 *   onTick: no-op — LAND shader owns envelope crossfade.
 *   onEnd: drop the cached destruction state.
 *
 * Climate contribution: peak ΔT / Δsea / Δprecip all negative; scaled
 * per frame by `climateRisePlateauFall`. `peakClimateContribution`
 * exposes the unscaled peak so the registry's bake sees the right
 * cancellation against any concurrent climate scenario.
 *
 * Destruction contribution: ice flip mask + `seaLevelM = 0` (cooling
 * lowers the sea, never floods). Envelope = `climateRisePlateauFall`.
 *
 * Impact budget: polygon-projection biome loss + magnitude-driven
 * extinction floor on populationAtRisk / citiesAtRisk. Mirrors the
 * heat-side fix — at deep cooling many tropical baselines project to
 * BOREAL rather than ICE, dropping the flip-based tally. See
 * SCENARIO_TUNING_NOTES.md. Intensity tracks the same envelope so HUD
 * bar matches the GPU biome paint.
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
import { polygonsThatFlipTo } from '../climateDestructionStamps.js';
import { BIOME } from '../../biomes/BiomeLookup.js';
import type {
  ClimateContribution,
  DestructionContribution,
  Scenario,
  ScenarioContext,
  ScenarioKindHandler,
  SeafloorContribution,
} from '../types.js';
import { DEFAULT_ICE_AGE_CONFIG } from './IceAgeScenario.config.js';

type PeakState = {
  polyFlipMask: Uint8Array | null;
};

const peakState = new WeakMap<Scenario<'iceAge'>, PeakState>();

export const IceAgeScenario: ScenarioKindHandler<'iceAge'> = {
  isClimateClass: true,

  onStart(scn: Scenario<'iceAge'>, ctx: ScenarioContext): void {
    const lookup = ctx.getPolygonLookup();
    const peakDelta = {
      tempC: scn.payload.maxTempDeltaC,
      precipMm: scn.payload.precipDeltaMm ?? DEFAULT_ICE_AGE_CONFIG.precipDeltaMm,
    };
    const polyFlipMask = lookup
      ? polygonsThatFlipTo(peakDelta, BIOME.ICE, lookup)
      : null;
    peakState.set(scn, { polyFlipMask });
  },

  onTick(_scn: Scenario<'iceAge'>, _progress01: number, _ctx: ScenarioContext): void {
    // No per-frame work.
  },

  onEnd(scn: Scenario<'iceAge'>, _ctx: ScenarioContext): void {
    peakState.delete(scn);
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

  getDestructionContribution(
    scn: Scenario<'iceAge'>,
    progress01: number,
    _ctx: ScenarioContext,
  ): DestructionContribution {
    const s = peakState.get(scn);
    return {
      polyFlipMask: s?.polyFlipMask ?? null,
      seaLevelM: 0,
      intensity: climateRisePlateauFall(progress01),
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
    scn: Scenario<'iceAge'>,
    deps: ImpactBudgetDeps,
  ): ScenarioImpactBudget {
    const budget = zeroBudget();
    const combined = deps.combinedClimate;
    tallyProjectionBiome(
      { tempC: combined.tempC, precipMm: combined.precipMm },
      deps,
      budget,
    );
    // Direct cold-extinction floor — mirror of the heat-side fix. At
    // extreme cooling many tropical baselines project to BOREAL rather
    // than ICE (their effective temperature lands closer to BOREAL's
    // niche centre than to ICE's), so the flip-based pop tally drops
    // off exactly when it should peak. Magnitude-driven floor takes
    // over so −50°C wipes humanity regardless of where each polygon's
    // projection nominally lands.
    const absT = Math.abs(scn.payload.maxTempDeltaC);
    const intensity = Math.pow(absT / 50, 2.5);
    const coldFloor = intensity * deps.totals.population;
    if (coldFloor > budget.populationAtRisk) {
      budget.populationAtRisk = coldFloor;
    }
    const cityFloor = intensity * deps.cities.length;
    if (cityFloor > budget.citiesAtRisk) {
      budget.citiesAtRisk = cityFloor;
    }
    return budget;
  },
};

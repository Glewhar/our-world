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
import { tallyProjectionBiome, zeroBudget, } from '../impactBudget.js';
import { climateRisePlateauFall } from '../recoveryCurves.js';
import { seaLevelFromTempDelta } from '../seaLevelFromTemp.js';
import { cellsInProjectedFlipPolygons } from '../climateDestructionStamps.js';
import { BIOME } from '../../biomes/BiomeLookup.js';
import { DEFAULT_ICE_AGE_CONFIG } from './IceAgeScenario.config.js';
export const IceAgeScenario = {
    isClimateClass: true,
    onStart(scn, ctx) {
        // Polygon biome paint is handled by the registry bake. The one
        // thing we paint here is infrastructure destruction inside every
        // polygon the projection flips to ICE — cities and highways under
        // the advancing ice sheet vanish. ICE biome paint stays visible
        // underneath via the LAND shader (no black wasteland scar).
        const lookup = ctx.getPolygonLookup();
        if (!lookup)
            return;
        const peakDelta = {
            tempC: scn.payload.maxTempDeltaC,
            precipMm: scn.payload.precipDeltaMm ?? DEFAULT_ICE_AGE_CONFIG.precipDeltaMm,
        };
        const cells = cellsInProjectedFlipPolygons(peakDelta, BIOME.ICE, lookup, (ipix) => ctx.getPolygonOfCell(ipix), ctx.getCellCount());
        if (cells.length === 0)
            return;
        ctx.paintAttributeCells({
            attribute: 'infrastructure_loss',
            value: 1.0,
            cells,
            decayMode: 'climateRiseFall',
        });
    },
    onTick(_scn, _progress01, _ctx) {
        // No per-frame work.
    },
    onEnd(_scn, _ctx) {
        // No teardown.
    },
    getClimateContribution(scn, progress01, ctx) {
        const env = climateRisePlateauFall(progress01);
        const liveTempC = scn.payload.maxTempDeltaC * env;
        const precipPeak = scn.payload.precipDeltaMm ?? DEFAULT_ICE_AGE_CONFIG.precipDeltaMm;
        return {
            tempC: liveTempC,
            seaLevelM: seaLevelFromTempDelta(liveTempC, ctx.getSeaLevelMultiplier()),
            precipMm: precipPeak * env,
        };
    },
    peakClimateContribution(scn, ctx) {
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
    getSeafloorContribution(_scn, progress01) {
        return {
            palette: [
                DEFAULT_ICE_AGE_CONFIG.seafloorPalette[0],
                DEFAULT_ICE_AGE_CONFIG.seafloorPalette[1],
                DEFAULT_ICE_AGE_CONFIG.seafloorPalette[2],
            ],
            weight: climateRisePlateauFall(progress01),
        };
    },
    intensity(_scn, progress01) {
        return climateRisePlateauFall(progress01);
    },
    computeImpactBudget(scn, deps) {
        const budget = zeroBudget();
        const combined = deps.combinedClimate;
        tallyProjectionBiome({ tempC: combined.tempC, precipMm: combined.precipMm }, deps, budget);
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

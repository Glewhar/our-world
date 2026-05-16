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
import { tallyProjectionBiome, zeroBudget, } from '../impactBudget.js';
import { climateRisePlateauFall } from '../recoveryCurves.js';
import { seaLevelFromTempDelta } from '../seaLevelFromTemp.js';
import { cellsBelowSeaLevel, cellsInProjectedFlipPolygons } from '../climateDestructionStamps.js';
import { BIOME } from '../../biomes/BiomeLookup.js';
import { DEFAULT_GLOBAL_WARMING_CONFIG } from './GlobalWarmingScenario.config.js';
export const GlobalWarmingScenario = {
    isClimateClass: true,
    onStart(scn, ctx) {
        // Polygon biome paint is handled by the registry bake. The one
        // thing we paint here is infrastructure destruction along the
        // flooded coastline — every HEALPix cell whose elevation falls
        // under the peak sea-level rise loses its cities + highways.
        // Cell set is computed once; the registry scales the stamp on
        // `climateRisePlateauFall` every frame.
        const peakSeaLevelM = seaLevelFromTempDelta(scn.payload.maxTempDeltaC, ctx.getSeaLevelMultiplier());
        if (peakSeaLevelM > 0) {
            const cells = cellsBelowSeaLevel(peakSeaLevelM, (ipix) => ctx.getElevationMetersAtCell(ipix), ctx.getCellCount());
            if (cells.length > 0) {
                ctx.paintAttributeCells({
                    attribute: 'infrastructure_loss',
                    value: 1.0,
                    cells,
                    decayMode: 'climateRiseFall',
                });
            }
        }
        const lookup = ctx.getPolygonLookup();
        if (lookup) {
            const peakDelta = {
                tempC: scn.payload.maxTempDeltaC,
                precipMm: scn.payload.precipDeltaMm ?? DEFAULT_GLOBAL_WARMING_CONFIG.precipDeltaMm,
            };
            const desertCells = cellsInProjectedFlipPolygons(peakDelta, BIOME.DESERT, lookup, (ipix) => ctx.getPolygonOfCell(ipix), ctx.getCellCount());
            if (desertCells.length > 0) {
                ctx.paintAttributeCells({
                    attribute: 'infrastructure_loss',
                    value: 1.0,
                    cells: desertCells,
                    decayMode: 'climateRiseFall',
                });
            }
        }
    },
    onTick(_scn, _progress01, _ctx) {
        // No per-frame work — the LAND shader handles the envelope crossfade.
    },
    onEnd(_scn, _ctx) {
        // No teardown — the registry retires stamps on the last frame.
    },
    getClimateContribution(scn, progress01, ctx) {
        const env = climateRisePlateauFall(progress01);
        const liveTempC = scn.payload.maxTempDeltaC * env;
        const precipPeak = scn.payload.precipDeltaMm ?? DEFAULT_GLOBAL_WARMING_CONFIG.precipDeltaMm;
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
            precipMm: scn.payload.precipDeltaMm ?? DEFAULT_GLOBAL_WARMING_CONFIG.precipDeltaMm,
        };
    },
    intensity(_scn, progress01) {
        return climateRisePlateauFall(progress01);
    },
    computeImpactBudget(scn, deps) {
        const budget = zeroBudget();
        const combined = deps.combinedClimate;
        tallyProjectionBiome({ tempC: combined.tempC, precipMm: combined.precipMm }, deps, budget);
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

/**
 * GlobalWarmingScenario.config — tunables for the global-warming
 * climate scenario.
 *
 * Effect summary:
 *   - simulation: temperature rises by `+maxTempDeltaC` at plateau,
 *     sea level rises per `seaLevelFromTempDelta(liveTempC, mult)` —
 *     no independent peak knob, the launcher exposes only ΔT and a
 *     global multiplier. Precipitation shifts by `+precipDeltaMm`
 *     (a warmer atmosphere holds more moisture). The registry sums
 *     every active climate scenario's contribution into a combined
 *     frame and runs the polygon biome projection — opposing scenarios
 *     cancel naturally.
 *   - visual: tundra (Greenland, Arctic) shifts to dark boreal green
 *     first; boreal southern edge yellows to grassland next; temperate
 *     interiors fade to grassland; finally rainforest edges brown
 *     while desert belts expand. Sahara stays Sahara.
 *
 * Lifetime envelope is `climateRisePlateauFall`. The LAND shader
 * remaps the global envelope per cell using each cell's `tStart01`
 * (G channel of the override-stamp texture), so the same envelope
 * drives staggered onset without any per-frame CPU cost.
 */
export const DEFAULT_GLOBAL_WARMING_CONFIG = {
    maxTempDeltaC: 30,
    precipDeltaMm: 50,
    durationDays: 15,
};

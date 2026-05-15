/**
 * IceAgeScenario.config — tunables for the ice-age climate scenario.
 *
 * Effect summary:
 *   - simulation: temperature falls by `maxTempDeltaC` (negative) at
 *     plateau; sea level falls per `seaLevelFromTempDelta(liveTempC, mult)`
 *     — no independent peak knob, the launcher exposes only ΔT and a
 *     global multiplier. Precipitation drops by `precipDeltaMm`
 *     (negative — colder air holds less moisture). The registry sums
 *     every active climate contribution into a combined frame; the
 *     polygon biome projection consumes that — opposing scenarios
 *     cancel naturally.
 *   - visual: globe tints cool, ocean recedes, the cold biome bands
 *     (boreal → tundra → ice) march toward the equator while the
 *     rainforest core stays mostly green and the Sahara only lightly
 *     cools toward cold-steppe.
 *
 * Lifetime envelope is `climateRisePlateauFall`. The LAND shader
 * remaps the global envelope per cell using each cell's `tStart01`
 * (G channel of the override-stamp texture), so the same envelope
 * drives staggered onset without any per-frame CPU cost.
 */

export type IceAgeScenarioConfig = {
  /** Peak temperature delta at plateau in °C (negative). */
  maxTempDeltaC: number;
  /** Peak precipitation delta at plateau in mm/year (negative). */
  precipDeltaMm: number;
  /** Scenario lifetime in `totalDays` units (1 year = 12 days). */
  durationDays: number;
  /**
   * Three-colour palette the LAND seafloor branch crossfades to when
   * Ice Age peaks. Polar shelf reads as ice-rim blue-grey, temperate
   * shelf as cold wet mud, equatorial shelf as exposed sand — the Sunda
   * Shelf and Bering land-bridge look at LGM.
   */
  seafloorPalette: [
    { r: number; g: number; b: number },
    { r: number; g: number; b: number },
    { r: number; g: number; b: number },
  ];
};

function hexToRgbUnit(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.replace('#', ''), 16);
  return {
    r: ((n >> 16) & 0xff) / 255,
    g: ((n >> 8) & 0xff) / 255,
    b: (n & 0xff) / 255,
  };
}

export const DEFAULT_ICE_AGE_CONFIG: IceAgeScenarioConfig = {
  maxTempDeltaC: -10,
  precipDeltaMm: -30,
  durationDays: 60,
  seafloorPalette: [
    hexToRgbUnit('#b8c8d4'), // 16 polar shelf — pale frozen blue-grey
    hexToRgbUnit('#5a544c'), // 17 temperate shelf — dark wet mud
    hexToRgbUnit('#c8b894'), // 18 equatorial shelf — exposed sand
  ],
};

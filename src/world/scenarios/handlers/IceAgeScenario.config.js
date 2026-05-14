/**
 * IceAgeScenario.config — all tunables for the ice-age climate scenario.
 *
 * Effect summary:
 *   - simulation: temperature falls by `maxTempDeltaC` (negative) at
 *     plateau; sea level falls by `maxSeaLevelM` (negative). Each
 *     baseline biome crossfades toward its cold-climate successor per
 *     `transitionRules` — vulnerable biomes (mangrove, mediterranean,
 *     high montane) start transforming first; rainforest core only
 *     dries to tropical-dry forest at the edges late in the envelope.
 *   - visual: globe tints cool, ocean recedes, the cold biome bands
 *     (boreal → tundra → ice) march toward the equator while the
 *     rainforest core stays mostly green and the Sahara only lightly
 *     cools toward cold-steppe.
 *
 * Lifetime envelope is `climateRisePlateauFall`. The land shader
 * remaps the global envelope per cell using each cell's `tStart01`
 * (G channel of the override-stamp texture), so the same envelope
 * drives staggered onset without any per-frame CPU cost.
 */
/**
 * WWF TEOW biome ids — see `data-pipeline/src/earth_pipeline/wwf_biomes.py`
 * and `web/src/debug/defaults.ts:biomePalette`. Id 15 is a synthetic
 * "ice / glacier" biome added in the override palette (never produced
 * by the baked attribute_static.G).
 */
export const BIOME = {
    TROPICAL_MOIST: 1,
    TROPICAL_DRY: 2,
    TROPICAL_CONIFER: 3,
    TEMPERATE_BROADLEAF: 4,
    TEMPERATE_CONIFER: 5,
    BOREAL: 6,
    TROPICAL_SAVANNA: 7,
    TEMPERATE_GRASSLAND: 8,
    FLOODED_GRASSLAND: 9,
    MONTANE_GRASSLAND: 10,
    TUNDRA: 11,
    MEDITERRANEAN: 12,
    DESERT: 13,
    MANGROVE: 14,
    ICE: 15,
};
/**
 * Cooling LUT — biome-by-biome ecological response to a global ice age.
 * Weights encode how fully a biome converts at full envelope; tStart01
 * encodes when it starts (vulnerable = small, resilient = large).
 */
export const ICE_AGE_TRANSITIONS = [
    // High mountain glaciers form FIRST and FULLY (above 1500 m).
    { from: BIOME.MONTANE_GRASSLAND, to: BIOME.ICE, weight: 0.95, tStart01: 0.0, elevGateMinM: 1500 },
    // Lower montane → tundra. Slightly later, partial.
    { from: BIOME.MONTANE_GRASSLAND, to: BIOME.TUNDRA, weight: 0.7, tStart01: 0.15 },
    // Tundra fully glaciates — first major change, full weight.
    { from: BIOME.TUNDRA, to: BIOME.ICE, weight: 1.0, tStart01: 0.0 },
    // Mangroves frost-kill back to flooded grassland — vulnerable, fast.
    { from: BIOME.MANGROVE, to: BIOME.FLOODED_GRASSLAND, weight: 0.85, tStart01: 0.05 },
    // Boreal → tundra (poleward expansion of tundra). Quick.
    { from: BIOME.BOREAL, to: BIOME.TUNDRA, weight: 0.9, tStart01: 0.1 },
    // Flooded grasslands freeze into tundra-like bog.
    { from: BIOME.FLOODED_GRASSLAND, to: BIOME.TUNDRA, weight: 0.8, tStart01: 0.15 },
    // Mediterranean → temperate broadleaf — vulnerable mid-onset.
    { from: BIOME.MEDITERRANEAN, to: BIOME.TEMPERATE_BROADLEAF, weight: 0.75, tStart01: 0.15 },
    // Temperate forests → boreal (forest belt migrates equatorward).
    { from: BIOME.TEMPERATE_BROADLEAF, to: BIOME.BOREAL, weight: 0.8, tStart01: 0.25 },
    { from: BIOME.TEMPERATE_CONIFER, to: BIOME.BOREAL, weight: 0.8, tStart01: 0.25 },
    // Temperate grassland → tundra (mammoth-steppe analogue).
    { from: BIOME.TEMPERATE_GRASSLAND, to: BIOME.TUNDRA, weight: 0.75, tStart01: 0.3 },
    // Tropical savanna → temperate grassland (cool/dry expansion).
    { from: BIOME.TROPICAL_SAVANNA, to: BIOME.TEMPERATE_GRASSLAND, weight: 0.65, tStart01: 0.35 },
    // Tropical coniferous → temperate broadleaf.
    { from: BIOME.TROPICAL_CONIFER, to: BIOME.TEMPERATE_BROADLEAF, weight: 0.7, tStart01: 0.4 },
    // Tropical dry → tropical savanna.
    { from: BIOME.TROPICAL_DRY, to: BIOME.TROPICAL_SAVANNA, weight: 0.6, tStart01: 0.4 },
    // Desert → temperate grassland (rain belts shift, mild cooling).
    { from: BIOME.DESERT, to: BIOME.TEMPERATE_GRASSLAND, weight: 0.45, tStart01: 0.5 },
    // Tropical moist (rainforest) → tropical dry — ONLY at the edges
    // (|lat| > 10°), core stays green. Slowest to react.
    {
        from: BIOME.TROPICAL_MOIST,
        to: BIOME.TROPICAL_DRY,
        weight: 0.55,
        tStart01: 0.6,
        latGateAbsDegMin: 10,
    },
];
export const DEFAULT_ICE_AGE_CONFIG = {
    maxTempDeltaC: -10,
    maxSeaLevelM: -120,
    durationDays: 60,
    transitionRules: ICE_AGE_TRANSITIONS,
};

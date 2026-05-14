/**
 * NuclearWarScenario.config — orchestrates Nuclear strikes over major
 * cities, then carries the planet into nuclear winter (cooling,
 * sea-level fall, sooty overcast sky, biome dieback). Tunables co-locate
 * here so editing "what the war looks like" never reaches the handler
 * logic or the render layer.
 *
 * Effect summary:
 *   - simulation: front-loaded burst of `strikeCount` Nuclear strikes
 *     over `strikeFireWindowDays`. Each child Nuclear scenario paints a
 *     downwind wasteland; the parent scenario carries the sustained
 *     climate envelope (cooling + sea-level fall + soot) after the
 *     strikes are over. Airplanes stop respawning after day 1.
 *   - visual: 70 mushroom clouds bloom front-loaded over the world's
 *     biggest cities; afterwards the sky thickens into a sooty
 *     brown-grey overcast; tundra glaciates, temperate forests fade
 *     toward yellow-green grassland, rainforest core stays mostly green.
 */
import { BIOME } from './IceAgeScenario.config.js';
/**
 * Nuclear winter biome LUT. Sits between ice-age (full freeze) and
 * "warming" (none of these): tundra glaciates, temperate forests fade
 * toward yellow-green grassland, tropical rainforest core stays mostly
 * green. Vulnerable biomes start transforming early; resilient cores
 * kick in late.
 */
export const NUCLEAR_WAR_TRANSITIONS = [
    // High mountain glaciers form FIRST and FULLY (above 1800 m).
    { from: BIOME.MONTANE_GRASSLAND, to: BIOME.ICE, weight: 0.9, tStart01: 0.0, elevGateMinM: 1800 },
    // Lower montane → tundra.
    { from: BIOME.MONTANE_GRASSLAND, to: BIOME.TUNDRA, weight: 0.6, tStart01: 0.2 },
    // Tundra fully glaciates.
    { from: BIOME.TUNDRA, to: BIOME.ICE, weight: 1.0, tStart01: 0.0 },
    // Mangroves frost-killed back.
    { from: BIOME.MANGROVE, to: BIOME.FLOODED_GRASSLAND, weight: 0.85, tStart01: 0.05 },
    // Boreal poleward edge → tundra; partial dieback further south.
    { from: BIOME.BOREAL, to: BIOME.TUNDRA, weight: 0.85, tStart01: 0.1 },
    // Flooded grasslands freeze into tundra-like bog.
    { from: BIOME.FLOODED_GRASSLAND, to: BIOME.TUNDRA, weight: 0.7, tStart01: 0.15 },
    // Mediterranean → temperate broadleaf — vulnerable.
    { from: BIOME.MEDITERRANEAN, to: BIOME.TEMPERATE_BROADLEAF, weight: 0.7, tStart01: 0.15 },
    // Temperate forests crash to grassland (yellow-green) — the headline
    // visual of nuclear winter dieback.
    { from: BIOME.TEMPERATE_BROADLEAF, to: BIOME.TEMPERATE_GRASSLAND, weight: 0.8, tStart01: 0.2 },
    { from: BIOME.TEMPERATE_CONIFER, to: BIOME.TEMPERATE_GRASSLAND, weight: 0.8, tStart01: 0.2 },
    // Temperate grassland → tundra (continental cooling).
    { from: BIOME.TEMPERATE_GRASSLAND, to: BIOME.TUNDRA, weight: 0.6, tStart01: 0.3 },
    // Tropical savanna → temperate grassland (cool, dry expansion).
    { from: BIOME.TROPICAL_SAVANNA, to: BIOME.TEMPERATE_GRASSLAND, weight: 0.55, tStart01: 0.35 },
    // Tropical coniferous → temperate broadleaf.
    { from: BIOME.TROPICAL_CONIFER, to: BIOME.TEMPERATE_BROADLEAF, weight: 0.6, tStart01: 0.4 },
    // Tropical dry forest → tropical savanna.
    { from: BIOME.TROPICAL_DRY, to: BIOME.TROPICAL_SAVANNA, weight: 0.55, tStart01: 0.4 },
    // Desert stays desert mostly — minimal cooling-driven greening.
    { from: BIOME.DESERT, to: BIOME.TEMPERATE_GRASSLAND, weight: 0.25, tStart01: 0.5 },
    // Tropical moist (rainforest) → tropical dry — only at the edges
    // (|lat| > 10°), core stays green. Last to react.
    {
        from: BIOME.TROPICAL_MOIST,
        to: BIOME.TROPICAL_DRY,
        weight: 0.5,
        tStart01: 0.6,
        latGateAbsDegMin: 10,
    },
];
export const DEFAULT_NUCLEAR_WAR_CONFIG = {
    strikeCount: 70,
    strikeFireWindowDays: 2,
    strikeFrontLoadPower: 2.2,
    childDurationDays: 36,
    airplaneStopAtDay: 1.0,
    maxTempDeltaC: -7,
    maxSeaLevelM: -8,
    peakSootGlobal: 0.9,
    strikeEndFrac: 0.03,
    winterRampEndFrac: 0.18,
    winterPlateauEndFrac: 0.75,
    durationDays: 120,
    sizeDistribution: [
        // City-buster — 55%.
        { radiusKm: 300, stretchKm: 700, weight: 0.55 },
        // Strategic — 35%.
        { radiusKm: 500, stretchKm: 1300, weight: 0.35 },
        // Mega-yield — 10%.
        { radiusKm: 900, stretchKm: 2400, weight: 0.10 },
    ],
    transitionRules: NUCLEAR_WAR_TRANSITIONS,
};
/**
 * Zero → ramp → plateau → fall. Envelope is gated to zero through the
 * brief strike phase so biomes don't start drifting toward grassland
 * while fireballs are still landing.
 */
export function nuclearWinterEnvelope(p01, cfg) {
    const p = p01 < 0 ? 0 : p01 > 1 ? 1 : p01;
    if (p <= cfg.strikeEndFrac)
        return 0;
    if (p < cfg.winterRampEndFrac) {
        return (p - cfg.strikeEndFrac) / (cfg.winterRampEndFrac - cfg.strikeEndFrac);
    }
    if (p < cfg.winterPlateauEndFrac)
        return 1;
    return Math.max(0, (1 - p) / (1 - cfg.winterPlateauEndFrac));
}
/**
 * Deterministic PRNG seed — `xmur3` mixer keyed by an integer. Used by
 * `buildStrikeSchedule` so re-runs from the same starting day produce
 * the same pattern, but the seed itself comes from `Math.random` so
 * fresh launches still vary.
 */
function mulberry32(seed) {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
/**
 * Build a front-loaded schedule from the top-N cities. The size of
 * each strike is sampled from the config's weighted size distribution.
 * Reset jitter ensures coincident-population cities don't all sit at
 * the same `fireAtRelDay`.
 */
export function buildStrikeSchedule(cfg, cities, count, windowDays, childDurationDays, seed = 0xC0FFEE) {
    const rand = mulberry32(seed);
    const sizes = cfg.sizeDistribution;
    let totalWeight = 0;
    for (let i = 0; i < sizes.length; i++)
        totalWeight += sizes[i].weight;
    const out = [];
    const n = Math.min(count, cities.length);
    for (let i = 0; i < n; i++) {
        const city = cities[i];
        const t = n === 1 ? 0 : 1 - Math.pow(1 - i / (n - 1), cfg.strikeFrontLoadPower);
        const jitter = (rand() - 0.5) * 0.02 * windowDays;
        const fireAtRelDay = Math.max(0, t * windowDays + jitter);
        let r = rand() * totalWeight;
        let pickedSize = sizes[0];
        for (let k = 0; k < sizes.length; k++) {
            r -= sizes[k].weight;
            if (r <= 0) {
                pickedSize = sizes[k];
                break;
            }
        }
        out.push({
            latDeg: city.latDeg,
            lonDeg: city.lonDeg,
            radiusKm: pickedSize.radiusKm,
            stretchKm: pickedSize.stretchKm,
            fireAtRelDay,
            childDurationDays,
            spawnedScenarioId: '',
        });
    }
    return out;
}

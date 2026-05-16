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
export const DEFAULT_NUCLEAR_WAR_CONFIG = {
    strikeCount: 50,
    strikeFireWindowDays: 3,
    strikeFrontLoadPower: 0.8,
    airplaneStopAtDay: 1.0,
    maxTempDeltaC: -10,
    precipDeltaMm: -40,
    peakSootGlobal: 0.9,
    strikeEndFrac: 0.03,
    winterRampEndFrac: 0.40,
    winterPlateauEndFrac: 0.75,
    durationDays: 15,
    sizeDistribution: [
        // City-buster — 55%.
        { radiusKm: 300, stretchKm: 700, weight: 0.55 },
        // Strategic — 35%.
        { radiusKm: 500, stretchKm: 1300, weight: 0.35 },
        // Mega-yield — 10%.
        { radiusKm: 900, stretchKm: 2400, weight: 0.10 },
    ],
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

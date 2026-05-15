/**
 * biomeProjection — pure function from (baseline biome, climate delta)
 * to the target biome the polygon is drifting toward.
 *
 * Effect summary:
 *   - simulation: replaces the hardcoded per-scenario transition LUTs.
 *     Each climate scenario hands the registry its peak ΔT / Δprecip;
 *     the registry sums every active climate contribution into a single
 *     combined delta and runs this projection over the planet's polygon
 *     baseline. Opposing scenarios cancel because the combined delta
 *     they produce is near zero, and `projectBiome` then returns a
 *     near-empty flip.
 *   - visual: drives the per-polygon class + weight + tStart01 textures
 *     the LAND shader crossfades. Result is the same shape of biome
 *     paint we had before, but driven by climate state rather than by
 *     hand-tuned per-scenario lookup tables.
 *
 * Pure / stateless. Reads `BIOME_LOOKUP` and the tunables in
 * `biomeProjection.config.ts`. Used by:
 *   - `ScenarioRegistry.bakeBiomeOverrideTextures` to drive the GPU
 *     biome paint (per-polygon override textures, slot-aware).
 *   - `tallyProjectionBiome` in `impactBudget.ts` so HUD biome impact
 *     matches the visible paint at any combined-delta state.
 */
import { BIOME, BIOME_LOOKUP } from '../biomes/BiomeLookup.js';
import { MAG_TEMP_REF, MAG_PRECIP_REF, MIN_DELTA_TO_FLIP, WEIGHT_NORMALISER, VULNERABILITY_ORDER, } from './biomeProjection.config.js';
/**
 * Magnitude of a delta in the same scale `MIN_DELTA_TO_FLIP` /
 * `WEIGHT_NORMALISER` are tuned in. A pure +3°C swing or +300 mm swing
 * each gives magnitude ≈ 1.
 */
export function deltaMagnitude(delta) {
    return Math.abs(delta.tempC) / MAG_TEMP_REF + Math.abs(delta.precipMm) / MAG_PRECIP_REF;
}
/**
 * Niche-fit score for `entry` against an effective (temp, precip). Higher
 * = better fit. The `+1` in the denominator keeps the score finite even
 * when the climate sits exactly on the niche centre.
 */
function scoreNiche(entry, effTempC, effPrecipMm) {
    const niche = entry.climateNiche;
    const tolT = Math.max(0.5, niche.tempToleranceC);
    const tolP = Math.max(50, niche.precipToleranceMm);
    const dT = Math.abs(effTempC - niche.tempCenterC) / tolT;
    const dP = Math.abs(effPrecipMm - niche.precipCenterMm) / tolP;
    return 1 / (dT + dP + 1);
}
/**
 * Project the baseline biome forward under `delta`. Returns the highest-
 * scoring target biome, the weight of the flip, and the onset offset.
 * Returns a `weight: 0` no-flip when:
 *   - baselineId is 0 (no-data) or out of range
 *   - the combined delta magnitude is below `MIN_DELTA_TO_FLIP`
 *   - the baseline's own niche still beats every alternative
 *
 * WASTELAND is excluded as a projection target — only nuclear strikes
 * write that class, never climate drift. The three shelf classes
 * (POLAR_SHELF, TEMPERATE_SHELF, EQUATORIAL_SHELF) are likewise excluded
 * — they're bake-time seafloor cover for sub-sea-level cells, with
 * intentionally wide niches that would otherwise win every projection
 * score by default.
 */
export function projectBiome(baselineId, delta) {
    const noFlip = {
        fromId: baselineId,
        toId: baselineId,
        weight: 0,
        tStart01: 0,
    };
    const baseline = BIOME_LOOKUP[baselineId];
    if (!baseline || baseline.id === 0)
        return noFlip;
    const mag = deltaMagnitude(delta);
    if (mag < MIN_DELTA_TO_FLIP)
        return noFlip;
    const effTempC = baseline.climateNiche.tempCenterC + delta.tempC;
    const effPrecipMm = baseline.climateNiche.precipCenterMm + delta.precipMm;
    const baseScore = scoreNiche(baseline, effTempC, effPrecipMm);
    // ICE baseline under warming is otherwise too flat a score landscape
    // to pick a clear winner — give the closest "retreat" biomes a small
    // boost so Greenland visibly thaws toward tundra/boreal under any
    // warming delta. Cold-side path stays unmodified.
    const iceWarming = baselineId === BIOME.ICE && delta.tempC > 1;
    let bestId = baselineId;
    let bestScore = baseScore;
    for (let id = 1; id < BIOME_LOOKUP.length; id++) {
        if (id === baselineId)
            continue;
        // WASTELAND is a destruction-only sink; shelf biomes are seafloor
        // cover with wide niches — neither is a valid climate target.
        if (id === BIOME.WASTELAND
            || id === BIOME.POLAR_SHELF
            || id === BIOME.TEMPERATE_SHELF
            || id === BIOME.EQUATORIAL_SHELF) {
            continue;
        }
        const target = BIOME_LOOKUP[id];
        let score = scoreNiche(target, effTempC, effPrecipMm);
        if (iceWarming && (id === BIOME.TUNDRA || id === BIOME.BOREAL)) {
            score *= 1.3;
        }
        if (score > bestScore) {
            bestScore = score;
            bestId = id;
        }
    }
    if (bestId === baselineId)
        return noFlip;
    const advantage = bestScore - baseScore;
    if (advantage <= 0)
        return noFlip;
    const rawWeight = (advantage * mag) / WEIGHT_NORMALISER;
    const weight = rawWeight >= 1 ? 1 : rawWeight <= 0 ? 0 : rawWeight;
    if (weight <= 0)
        return noFlip;
    const tStart01 = VULNERABILITY_ORDER[baselineId] ?? 0.3;
    return { fromId: baselineId, toId: bestId, weight, tStart01 };
}
/**
 * Walk every polygon and bake its projected transition into the three
 * R8 column textures the LAND shader samples. Sub-millisecond for ~14k
 * polygons; called only on climate-membership changes, never per frame.
 */
export function buildProjectionPolygonTextures(input) {
    const { polygonBiome, count, delta, weightScale } = input;
    const n = count + 1;
    const classByPoly = new Uint8Array(n);
    const weightByPoly = new Uint8Array(n);
    const tStart01ByPoly = new Uint8Array(n);
    const scale = weightScale <= 0 ? 0 : weightScale > 1 ? 1 : weightScale;
    let assigned = 0;
    if (scale <= 0)
        return { classByPoly, weightByPoly, tStart01ByPoly, assignedCount: 0 };
    for (let i = 1; i <= count; i++) {
        const baselineId = polygonBiome[i] & 0xff;
        if (baselineId === 0)
            continue;
        const proj = projectBiome(baselineId, delta);
        if (proj.weight <= 0 || proj.toId === proj.fromId)
            continue;
        classByPoly[i] = proj.toId & 0xff;
        const w = proj.weight * scale;
        weightByPoly[i] = w >= 1 ? 255 : w <= 0 ? 0 : Math.round(w * 255);
        const t = proj.tStart01;
        tStart01ByPoly[i] = t >= 1 ? 255 : t <= 0 ? 0 : Math.round(t * 255);
        assigned++;
    }
    return { classByPoly, weightByPoly, tStart01ByPoly, assignedCount: assigned };
}

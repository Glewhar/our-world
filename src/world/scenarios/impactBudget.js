/**
 * Per-scenario impact budget — scalar damage tallied once at `onStart`
 * and reused every frame.
 *
 * Buckets that feed `WorldHealthSnapshot`:
 *   populationAtRisk  Σ city.pop for every city inside the strike footprint.
 *   citiesAtRisk      count of those cities.
 *   biomeChanges      signed (from → to) area-fraction transitions.
 *   biomeQualityNet   Σ areaFraction × (qual(to) − qual(from)). Signed.
 *   radiationUnits    Σ ellipseArea (km²) across every strike.
 *
 * Multiplied per frame by `handler.intensity(progress01)` and summed
 * across active scenarios. No per-cell, per-city, or per-road work runs
 * after `onStart`.
 */
import { polygonBboxAreaKm2 } from '../worldTotals.js';
import { BIOME, BIOME_LOOKUP, biomeQuality } from '../biomes/BiomeLookup.js';
import { projectBiome } from './biomeProjection.js';
const DEG = Math.PI / 180;
const EARTH_RADIUS_KM = 6371;
const UPWIND_TAIL_FRACTION = 0.2;
/**
 * Merge or append a `(from → to)` transition into the budget. Same-pair
 * entries accumulate `areaFraction` so the array stays short (one per
 * unique transition). `biomeQualityNet` updates incrementally.
 */
function addBiomeChange(budget, fromId, toId, areaFraction) {
    if (areaFraction <= 0)
        return;
    const qualityDelta = biomeQuality(toId) - biomeQuality(fromId);
    budget.biomeQualityNet += areaFraction * qualityDelta;
    for (let i = 0; i < budget.biomeChanges.length; i++) {
        const c = budget.biomeChanges[i];
        if (c.fromId === fromId && c.toId === toId) {
            budget.biomeChanges[i] = {
                fromId,
                toId,
                areaFraction: c.areaFraction + areaFraction,
                qualityDelta,
            };
            return;
        }
    }
    budget.biomeChanges.push({ fromId, toId, areaFraction, qualityDelta });
}
export function zeroBudget() {
    return {
        populationAtRisk: 0,
        citiesAtRisk: 0,
        biomeChanges: [],
        biomeQualityNet: 0,
        radiationUnits: 0,
    };
}
/**
 * Geodesic point-in-ellipse — same math as `computeEllipseStamp`'s cell
 * test but for a single lat/lon. Used to bucket cities (and any other
 * point sample) into a strike's kill zone in one pass.
 */
export function pointInEllipse(latDeg, lonDeg, e) {
    const lat0 = e.centreLatDeg * DEG;
    const lon0 = e.centreLonDeg * DEG;
    const lat = latDeg * DEG;
    const lon = lonDeg * DEG;
    const sinLat0 = Math.sin(lat0);
    const cosLat0 = Math.cos(lat0);
    const sinLat = Math.sin(lat);
    const cosLat = Math.cos(lat);
    const cosD = sinLat0 * sinLat + cosLat0 * cosLat * Math.cos(lon - lon0);
    const cosDClamped = cosD > 1 ? 1 : cosD < -1 ? -1 : cosD;
    const dRad = Math.acos(cosDClamped);
    const dKm = dRad * EARTH_RADIUS_KM;
    if (dKm === 0)
        return true;
    const y = Math.sin(lon - lon0) * cosLat;
    const x = cosLat0 * sinLat - sinLat0 * cosLat * Math.cos(lon - lon0);
    const bearingToCell = Math.atan2(y, x);
    const towardN = Math.cos(e.bearingDeg * DEG);
    const towardE = Math.sin(e.bearingDeg * DEG);
    const bN = Math.cos(bearingToCell);
    const bE = Math.sin(bearingToCell);
    const dotAlong = bN * towardN + bE * towardE;
    const dotCross = bN * -towardE + bE * towardN;
    const dAlong = dKm * dotAlong;
    const dCross = dKm * dotCross;
    const sEff = dAlong >= 0 ? e.stretchKm : e.stretchKm * UPWIND_TAIL_FRACTION;
    const aTerm = dAlong / sEff;
    const bTerm = dCross / e.radiusKm;
    return aTerm * aTerm + bTerm * bTerm < 1;
}
/**
 * Lat/lon bbox of a strike ellipse, padded by the larger half-axis.
 * Cheap pre-filter for the city walk so we don't compute the full
 * geodesic distance for every city against every strike.
 */
function strikeBbox(e) {
    const halfBoxKm = Math.max(e.radiusKm, e.stretchKm);
    const halfBoxDeg = (halfBoxKm / EARTH_RADIUS_KM) * (180 / Math.PI);
    const cosLat = Math.cos(e.centreLatDeg * DEG);
    const lonHalfDeg = cosLat < 1e-3 ? 180 : halfBoxDeg / Math.max(0.1, cosLat);
    return {
        latMin: e.centreLatDeg - halfBoxDeg,
        latMax: e.centreLatDeg + halfBoxDeg,
        lonMin: e.centreLonDeg - lonHalfDeg,
        lonMax: e.centreLonDeg + lonHalfDeg,
    };
}
/**
 * Add a strike's city kills to the running tallies. The bbox prune
 * keeps the inner geodesic test off the hot path for cities far from
 * the strike — global wars sweep 7k cities × 70 strikes, the bbox cuts
 * 99% of the cross-product to a cheap rectangle test.
 */
export function tallyStrikeCities(e, cities, budget) {
    const bb = strikeBbox(e);
    const wrapLon = bb.lonMin < -180 || bb.lonMax > 180;
    for (let i = 0; i < cities.length; i++) {
        const c = cities[i];
        if (c.latDeg < bb.latMin || c.latDeg > bb.latMax)
            continue;
        if (!wrapLon && (c.lonDeg < bb.lonMin || c.lonDeg > bb.lonMax))
            continue;
        if (!pointInEllipse(c.latDeg, c.lonDeg, e))
            continue;
        budget.citiesAtRisk += 1;
        budget.populationAtRisk += c.pop;
    }
}
/**
 * Approximate per-class biome loss from a single strike. Walks
 * polygons whose bbox intersects the strike bbox; counts the polygon
 * as "inside" when its centroid passes the ellipse test. Polygon-bbox
 * area then writes a signed `(from → WASTELAND)` transition.
 *
 * Coarse, but the strike footprint is tiny (~10⁵ km²) compared to the
 * planet's ~10⁸ km² land — the HUD biome bar barely moves from any
 * single Nuclear strike, which is the correct vibe.
 */
export function tallyStrikeBiome(e, deps, budget) {
    const bb = strikeBbox(e);
    const lookup = deps.polygonLookup;
    const landAreaProxy = deps.totals.landAreaProxy;
    if (landAreaProxy <= 0)
        return;
    for (let i = 1; i <= lookup.count; i++) {
        if (lookup.latMax[i] < bb.latMin)
            continue;
        if (lookup.latMin[i] > bb.latMax)
            continue;
        if (lookup.lonMax[i] < bb.lonMin)
            continue;
        if (lookup.lonMin[i] > bb.lonMax)
            continue;
        if (!pointInEllipse(lookup.latC[i], lookup.lonC[i], e))
            continue;
        const cls = lookup.biome[i] & 0xff;
        if (cls === 0)
            continue;
        const area = polygonBboxAreaKm2(lookup, i);
        const frac = area / landAreaProxy;
        addBiomeChange(budget, cls, BIOME.WASTELAND, frac);
    }
}
/**
 * Climate-projection biome contribution. Walks every polygon, calls
 * `projectBiome(baselineId, delta)`, and accumulates the signed
 * `(from → to)` transition weighted by `projected.weight × polygonArea
 * / landAreaProxy`. Drives the HUD biome impact for climate-class
 * scenarios — identical projection runs on the GPU bake side, so the
 * HUD reading matches what the player sees on the planet.
 *
 * When the combined delta cancels (e.g. GW + IA), `projectBiome`
 * returns zero-weight flips and this tally adds nothing.
 */
export function tallyProjectionBiome(delta, deps, budget) {
    const lookup = deps.polygonLookup;
    const landAreaProxy = deps.totals.landAreaProxy;
    if (landAreaProxy <= 0)
        return;
    for (let i = 1; i <= lookup.count; i++) {
        const baselineId = lookup.biome[i] & 0xff;
        if (baselineId === 0)
            continue;
        const proj = projectBiome(baselineId, delta);
        if (proj.weight <= 0 || proj.toId === proj.fromId)
            continue;
        const area = polygonBboxAreaKm2(lookup, i);
        const frac = (area / landAreaProxy) * proj.weight;
        addBiomeChange(budget, baselineId, proj.toId, frac);
    }
}
/**
 * BLT-aware non-city casualty + radiation tally for one nuclear strike.
 * The city walk already accumulates dense-population kills; this pass
 * adds the rural / suburban tail using each polygon's `popDensityKm2`
 * times the strike's ground footprint. Radiation is scaled per polygon
 * by `radiationResidency` so canopy filters fallout while open desert
 * / tundra retain it.
 */
export function tallyStrikeBiomeBlt(e, deps, budget) {
    const bb = strikeBbox(e);
    const lookup = deps.polygonLookup;
    for (let i = 1; i <= lookup.count; i++) {
        if (lookup.latMax[i] < bb.latMin)
            continue;
        if (lookup.latMin[i] > bb.latMax)
            continue;
        if (lookup.lonMax[i] < bb.lonMin)
            continue;
        if (lookup.lonMin[i] > bb.lonMax)
            continue;
        if (!pointInEllipse(lookup.latC[i], lookup.lonC[i], e))
            continue;
        const cls = lookup.biome[i] & 0xff;
        if (cls === 0)
            continue;
        const blt = BIOME_LOOKUP[cls];
        if (!blt)
            continue;
        const area = polygonBboxAreaKm2(lookup, i);
        // Non-city pop: assume a constant slice of the polygon's bbox area
        // falls inside the strike footprint. Polygons are irregular and we
        // already over-count via bbox; cap the contribution at the strike's
        // own area so a continent-spanning polygon doesn't run away.
        const strikeAreaKm2 = Math.PI * e.radiusKm * e.stretchKm;
        const effectiveAreaKm2 = Math.min(area, strikeAreaKm2);
        budget.populationAtRisk += effectiveAreaKm2 * blt.popDensityKm2;
        budget.radiationUnits += effectiveAreaKm2 * blt.radiationResidency;
    }
}

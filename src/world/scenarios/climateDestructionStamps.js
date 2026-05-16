/**
 * climateDestructionStamps — pure cell-set builders for climate-driven
 * civilisation kill.
 *
 * Effect summary:
 *   - simulation: Global Warming floods coastlines (cells below the peak
 *     sea-level rise) and Ice Age glaciates polygons projected to flip
 *     to ICE. The cell sets these functions produce are handed to the
 *     scenario registry as `'infrastructure_loss'` stamps; the cities
 *     and highways shaders gate on `max(wasteland, infrastructure_loss)`
 *     and discard inside.
 *   - visual: drowned coastal cities + roads vanish under the rising
 *     ocean; cities + roads inside glaciated polygons vanish under the
 *     advancing ice sheet. LAND/biome paint stays intact underneath
 *     (no black wasteland scar) — climate destruction reads as
 *     "civilisation crushed by climate" rather than "land erased".
 *
 * Pure / stateless. Called once at `onStart`; the registry's existing
 * recompose loop scales the stamp by `climateRisePlateauFall(progress01)`
 * every frame for free.
 */
import { projectBiome } from './biomeProjection.js';
/**
 * HEALPix cells whose continuous elevation falls strictly below
 * `peakSeaLevelM`. Returned empty when `peakSeaLevelM <= 0` — Ice Age
 * lowers sea level, which never destroys infrastructure, so the
 * caller passes 0 there and gets a no-op.
 *
 * Single linear pass over the elevation array; called once at
 * `onStart`. Cells at elevation exactly 0 (sea-level baseline) are
 * NOT included — they're already coast, not flooded.
 */
export function cellsBelowSeaLevel(peakSeaLevelM, getElevationMetersAtCell, nPix) {
    if (peakSeaLevelM <= 0)
        return new Uint32Array(0);
    // Two-pass: count first so we can allocate exactly the right size,
    // then fill. Avoids a growable buffer for the common case where
    // most cells aren't coastal.
    let count = 0;
    for (let i = 0; i < nPix; i++) {
        const elev = getElevationMetersAtCell(i);
        if (elev > 0 && elev < peakSeaLevelM)
            count++;
    }
    const out = new Uint32Array(count);
    let w = 0;
    for (let i = 0; i < nPix; i++) {
        const elev = getElevationMetersAtCell(i);
        if (elev > 0 && elev < peakSeaLevelM)
            out[w++] = i;
    }
    return out;
}
/**
 * HEALPix cells whose owning polygon `projectBiome` flips to
 * `targetBiomeId` at `peakDelta` with weight `>= minWeight`. Walks
 * every polygon once (~14k) to find the set that qualifies, then
 * walks every HEALPix cell once mapping through `getPolygonOfCell`
 * to collect cells inside that set.
 *
 * Returns an empty Uint32Array when no polygons qualify.
 */
export function cellsInProjectedFlipPolygons(peakDelta, targetBiomeId, lookup, getPolygonOfCell, nPix, minWeight = 0.4) {
    const flipSet = new Uint8Array(lookup.count + 1);
    let flippedAny = false;
    for (let i = 1; i <= lookup.count; i++) {
        const baselineId = lookup.biome[i] & 0xff;
        if (baselineId === 0)
            continue;
        const proj = projectBiome(baselineId, peakDelta);
        if (proj.toId !== targetBiomeId)
            continue;
        if (proj.weight < minWeight)
            continue;
        flipSet[i] = 1;
        flippedAny = true;
    }
    if (!flippedAny)
        return new Uint32Array(0);
    let count = 0;
    for (let i = 0; i < nPix; i++) {
        const polyId = getPolygonOfCell(i);
        if (polyId !== 0 && polyId <= lookup.count && flipSet[polyId])
            count++;
    }
    const out = new Uint32Array(count);
    let w = 0;
    for (let i = 0; i < nPix; i++) {
        const polyId = getPolygonOfCell(i);
        if (polyId !== 0 && polyId <= lookup.count && flipSet[polyId])
            out[w++] = i;
    }
    return out;
}

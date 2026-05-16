/**
 * climateDestructionStamps — polygon-mask builder for climate-driven
 * civilisation kill.
 *
 * Effect summary:
 *   - simulation: Global Warming flips polygons to DESERT under heat
 *     and floods coastlines below a peak sea-level threshold; Ice Age
 *     flips polygons to ICE under cooling. Cities + highways inside
 *     those polygons (or below the flood line) are killed.
 *   - visual: cities + roads vanish inside flipped polygons and along
 *     drowned coastlines. LAND/biome paint stays intact underneath
 *     (no black wasteland scar) — climate destruction reads as
 *     "civilisation crushed by climate" rather than "land erased".
 *
 * Pure / stateless. Called once per scenario at `onStart`; the
 * registry references the same Uint8Array each frame and only
 * re-uploads to the GPU when bytes change.
 */
import { projectBiome } from './biomeProjection.js';
/**
 * R8 mask sized `lookup.count + 1`. Byte = 255 for polygons whose
 * `projectBiome` flips to `targetBiomeId` at `peakDelta` with weight
 * >= `minWeight`; 0 elsewhere. Slot 0 is the no-data sentinel.
 *
 * Single ~14k-iteration polygon walk. The shader indexes by polyId
 * per fragment to gate cities + roads.
 */
export function polygonsThatFlipTo(peakDelta, targetBiomeId, lookup, minWeight = 0.4) {
    const out = new Uint8Array(lookup.count + 1);
    for (let i = 1; i <= lookup.count; i++) {
        const baselineId = lookup.biome[i] & 0xff;
        if (baselineId === 0)
            continue;
        const proj = projectBiome(baselineId, peakDelta);
        if (proj.toId !== targetBiomeId)
            continue;
        if (proj.weight < minWeight)
            continue;
        out[i] = 255;
    }
    return out;
}
/**
 * R8 mask sized `lookup.count + 1`. Byte = 255 for every polygon with a
 * non-zero baseline biome (i.e. every populated land polygon); 0 for
 * ocean / no-data polygons and the slot-0 sentinel.
 *
 * Used by Infrastructure-Decay — the scenario that auto-fires when the
 * world's population hits zero and slowly erases every city and road
 * worldwide. Decoupled from `polygonsThatFlipTo` because that helper is
 * tied to a specific biome flip target; Infra-Decay needs "everywhere
 * civilisation could exist" without changing biome rendering.
 */
export function allPopulatedPolygons(lookup) {
    const out = new Uint8Array(lookup.count + 1);
    for (let i = 1; i <= lookup.count; i++) {
        const baselineId = lookup.biome[i] & 0xff;
        if (baselineId === 0)
            continue;
        out[i] = 255;
    }
    return out;
}

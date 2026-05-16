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

import { projectBiome, type ClimateDelta } from './biomeProjection.js';
import type { PolygonLookup } from '../PolygonTexture.js';

/**
 * R8 mask sized `lookup.count + 1`. Byte = 255 for polygons whose
 * `projectBiome` flips to `targetBiomeId` at `peakDelta` with weight
 * >= `minWeight`; 0 elsewhere. Slot 0 is the no-data sentinel.
 *
 * Single ~14k-iteration polygon walk. The shader indexes by polyId
 * per fragment to gate cities + roads.
 */
export function polygonsThatFlipTo(
  peakDelta: ClimateDelta,
  targetBiomeId: number,
  lookup: PolygonLookup,
  minWeight = 0.4,
): Uint8Array {
  const out = new Uint8Array(lookup.count + 1);
  for (let i = 1; i <= lookup.count; i++) {
    const baselineId = lookup.biome[i]! & 0xff;
    if (baselineId === 0) continue;
    const proj = projectBiome(baselineId, peakDelta);
    if (proj.toId !== targetBiomeId) continue;
    if (proj.weight < minWeight) continue;
    out[i] = 255;
  }
  return out;
}

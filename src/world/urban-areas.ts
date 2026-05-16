/**
 * Helpers around `UrbanAreaRecord`.
 *
 * - `outermostTier(rec)` — the largest-extent tier (suburban when present,
 *   otherwise the densest), used by near-LOD layers that want the full
 *   city footprint regardless of how many density tiers a city has.
 */

import type { UrbanAreaRecord, UrbanDensityTier } from './types.js';

/**
 * The largest-extent tier of a city — by SMOD definition the lowest-density
 * tier. Used by near-LOD layers that want the full city footprint.
 *
 * Tiers are densest-first per the bake contract, so the last entry is the
 * suburban tier when present, falling back to the densest if a city has
 * only a centre tier.
 */
export function outermostTier(rec: UrbanAreaRecord): UrbanDensityTier {
  return rec.tiers[rec.tiers.length - 1] ?? rec.tiers[0]!;
}

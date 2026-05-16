/**
 * Helpers around `UrbanAreaRecord`.
 *
 * - `outermostTier(rec)` — the largest-extent tier (suburban when present,
 *   otherwise the densest), used by near-LOD layers that want the full
 *   city footprint regardless of how many density tiers a city has.
 * - `mockTiersFromLegacyPolygon(legacy)` — TEMPORARY back-fill: scales a
 *   v1 single-polygon record toward its centroid at 3 fixed factors to
 *   exercise the per-tier shader path before the v2 SMOD bake lands.
 *   Remove the moment `urban_areas.json` ships `tiers` directly.
 */

import type {
  LegacyUrbanAreaRecord,
  UrbanAreaRecord,
  UrbanDensityTier,
} from './types.js';

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

/**
 * Scale a polygon toward a centroid by a uniform factor in lat/lon space.
 * Good enough for the temp back-fill — real SMOD shapes are not radially
 * symmetric but this only has to render plausibly until v2 ships.
 */
function shrinkPolygon(
  polygon: [number, number][],
  centroidLat: number,
  centroidLon: number,
  factor: number,
): [number, number][] {
  const out: [number, number][] = new Array(polygon.length);
  for (let i = 0; i < polygon.length; i++) {
    const [lat, lon] = polygon[i]!;
    out[i] = [
      centroidLat + (lat - centroidLat) * factor,
      centroidLon + (lon - centroidLon) * factor,
    ];
  }
  return out;
}

/**
 * TEMP: synthesise 3 density tiers from a legacy v1 single-polygon record.
 * The shrink factors below are eyeballed:
 *   1.0× → suburban tier (density 0.25) — matches the legacy footprint
 *   0.7× → semi-dense tier (density 0.5)
 *   0.4× → urban-centre tier (density 1.0)
 *
 * Densest-first ordering matches the v2 contract so the renderer can treat
 * v1 and v2 records identically.
 *
 * Delete this helper once `urban_areas.json` v2 ships real SMOD tiers.
 */
export function mockTiersFromLegacyPolygon(
  legacy: Pick<LegacyUrbanAreaRecord, 'lat' | 'lon' | 'polygon'>,
): UrbanDensityTier[] {
  const { lat, lon, polygon } = legacy;
  return [
    { density: 1.0, polygon: shrinkPolygon(polygon, lat, lon, 0.4) },
    { density: 0.5, polygon: shrinkPolygon(polygon, lat, lon, 0.7) },
    { density: 0.25, polygon },
  ];
}

/**
 * Promote a legacy v1 record to the v2 shape by back-filling tiers.
 * Drops the `polygon` field — render code reads only `tiers` now.
 *
 * Delete alongside `mockTiersFromLegacyPolygon` once v2 ships.
 */
export function legacyToTieredRecord(
  legacy: LegacyUrbanAreaRecord,
): UrbanAreaRecord {
  return {
    id: legacy.id,
    lat: legacy.lat,
    lon: legacy.lon,
    pop: legacy.pop,
    name: legacy.name,
    country: legacy.country,
    tiers: mockTiersFromLegacyPolygon(legacy),
  };
}

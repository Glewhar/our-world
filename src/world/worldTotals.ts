/**
 * World totals — boot-time scalars that anchor `WorldHealthSnapshot`.
 *
 * Cached once on first read; the underlying world data (cities, biome
 * baseline, polygon lookup) never changes after the manifest finishes
 * loading, so re-computing is wasted work.
 *
 *   TOTAL_POPULATION       Σ city.pop over `getCities()`.
 *   biomeCellsByClass      classId → HEALPix-cell count of baseline biome.
 *   landCells              Σ biomeCellsByClass[c] for c != 0.
 *   biomeAreaProxyByClass  classId → Σ polygon-bbox area (km²) of polygons
 *                          whose baseline biome equals the class. Used by
 *                          climate-rule biome impact so each rule's loss
 *                          normalises to total land polygon area.
 *   landAreaProxy          Σ biomeAreaProxyByClass[c] for c != 0.
 */

import type { PolygonLookup } from './PolygonTexture.js';

const DEG = Math.PI / 180;
const KM_PER_DEG = 111.32;

export type WorldTotals = {
  population: number;
  biomeCellsByClass: Record<number, number>;
  landCells: number;
  biomeAreaProxyByClass: Record<number, number>;
  landAreaProxy: number;
};

export type WorldTotalsDeps = {
  getCityPopulations(): Iterable<number>;
  countBiomesGlobal(): Record<number, number>;
  getPolygonLookup(): PolygonLookup;
};

export function computeWorldTotals(deps: WorldTotalsDeps): WorldTotals {
  let population = 0;
  for (const pop of deps.getCityPopulations()) population += pop;

  const biomeCellsByClass = deps.countBiomesGlobal();
  let landCells = 0;
  for (const k of Object.keys(biomeCellsByClass)) {
    const cls = Number(k);
    if (cls === 0) continue;
    landCells += biomeCellsByClass[cls] ?? 0;
  }

  const biomeAreaProxyByClass: Record<number, number> = {};
  let landAreaProxy = 0;
  const lookup = deps.getPolygonLookup();
  for (let i = 1; i <= lookup.count; i++) {
    const cls = lookup.biome[i]! & 0xff;
    if (cls === 0) continue;
    const area = polygonBboxAreaKm2(lookup, i);
    biomeAreaProxyByClass[cls] = (biomeAreaProxyByClass[cls] ?? 0) + area;
    landAreaProxy += area;
  }

  return {
    population,
    biomeCellsByClass,
    landCells,
    biomeAreaProxyByClass,
    landAreaProxy,
  };
}

/**
 * Polygon bounding-box area in km², cos-latitude corrected. Polygons are
 * irregular so the bbox over-counts uniformly per polygon — when we
 * normalise by Σ all polygon-bbox-areas the bias cancels and the
 * resulting source-class fractions still sum to 1 across the planet.
 */
export function polygonBboxAreaKm2(lookup: PolygonLookup, i: number): number {
  const latSpan = lookup.latMax[i]! - lookup.latMin[i]!;
  const lonSpan = lookup.lonMax[i]! - lookup.lonMin[i]!;
  const cosLat = Math.cos(lookup.latC[i]! * DEG);
  return latSpan * lonSpan * cosLat * KM_PER_DEG * KM_PER_DEG;
}

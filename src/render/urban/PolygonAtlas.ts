/**
 * PolygonAtlas — packs every city's outermost-tier footprint (the
 * suburban SMOD polygon when present, otherwise the densest tier) into
 * a single Float32 texture so a point-in-polygon test can run from
 * texture lookups using only a per-instance `(offset, count)` pair.
 *
 * For each city we project the `[lat, lon]` footprint vertices into the
 * tangent frame in kilometres (km along east, km along north), then
 * store them sequentially in a single 1D-style RG32F texture laid out
 * across `ATLAS_WIDTH` columns. A 256-wide × ceil(totalVerts/256)-tall
 * RG32F texture fits all ~26 k verts comfortably under 1 MB GPU memory.
 *
 * The atlas also produces per-instance metadata:
 *   - `polyOffset` (first texel index of this footprint's vertex run)
 *   - `polyCount`  (number of vertices in this footprint)
 *   - `halfExtentKm.xy` (bbox half-extent in the tangent frame — drives
 *                       the per-instance quad size and the centring of the
 *                       fragment shader's local UVs)
 *
 * Used by the near-LOD UrbanDetailLayer (CPU-side inside-mask scanline
 * rasterisation). The far-LOD CitiesLayer triangulates per-tier polygons
 * directly and does not consume this atlas.
 */

import * as THREE from 'three';

import { tangentBasisAt } from '../../world/coordinates.js';
import { outermostTier } from '../../world/urban-areas.js';
import type { UrbanAreaRecord } from '../../world/types.js';

const EARTH_RADIUS_KM = 6371;
export const ATLAS_WIDTH = 256;

export type AtlasInstanceMeta = {
  /** Texel offset (0..totalVerts-1) of this polygon's first vertex. */
  polyOffset: number;
  /** Number of vertices belonging to this polygon. */
  polyCount: number;
  /** Half-extent of the polygon's bounding box in the tangent frame, in km. */
  halfExtentKm: { x: number; y: number };
  /** Per-city tangent basis at the polygon centroid, in world units. */
  basis: ReturnType<typeof tangentBasisAt>;
  /** The original record, retained for downstream consumers. */
  record: UrbanAreaRecord;
};

export type PolygonAtlasResult = {
  texture: THREE.DataTexture;
  meta: AtlasInstanceMeta[];
  /** Cap on the largest half-extent across all cities, in km. Drives the
   *  shared quad envelope so any city's quad fits its own polygon. */
  maxHalfExtentKm: number;
};

/**
 * Project every record's polygon into its local km tangent frame and
 * pack into a single RG32F texture. The order of `records` is preserved:
 * `meta[i]` corresponds to `records[i]`.
 *
 * Cost: ~1 ms for 600 polygons × ~50 verts each on a typical laptop.
 */
export function buildPolygonAtlas(records: readonly UrbanAreaRecord[]): PolygonAtlasResult {
  // First pass: tangent-project every vertex and accumulate per-city
  // metadata. We need the total vertex count before sizing the texture.
  type ProjectedPoly = {
    xy: Float32Array; // length = 2 * polyCount
    halfExtentKm: { x: number; y: number };
    basis: ReturnType<typeof tangentBasisAt>;
  };
  const projected: ProjectedPoly[] = [];
  let totalVerts = 0;
  let maxHalfExtentKm = 0;

  for (const rec of records) {
    const basis = tangentBasisAt(rec.lat, rec.lon);
    const { centre, tangentX, tangentY } = basis;
    // Atlas packs the full city footprint for the urban detail layer's
    // inside-test; the outermost (suburban) tier is the correct footprint.
    const footprint = outermostTier(rec).polygon;
    const xy = new Float32Array(footprint.length * 2);
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < footprint.length; i++) {
      const lat = footprint[i]![0] * Math.PI / 180;
      const lon = footprint[i]![1] * Math.PI / 180;
      const cosLat = Math.cos(lat);
      // Unit-sphere world position of this polygon vertex.
      const px = cosLat * Math.cos(lon);
      const py = cosLat * Math.sin(lon);
      const pz = Math.sin(lat);
      // Offset from the city centroid in world units (chord distance).
      const dx = px - centre.x;
      const dy = py - centre.y;
      const dz = pz - centre.z;
      // Project onto the two tangent axes; multiply by EARTH_RADIUS_KM
      // to convert chord-length-on-unit-sphere into kilometres on Earth.
      // The chord ≈ arc length to within < 0.1% for the urban polygon
      // sizes we care about (< 100 km extent).
      const ex = (dx * tangentX.x + dy * tangentX.y + dz * tangentX.z) * EARTH_RADIUS_KM;
      const ey = (dx * tangentY.x + dy * tangentY.y + dz * tangentY.z) * EARTH_RADIUS_KM;
      xy[i * 2] = ex;
      xy[i * 2 + 1] = ey;
      if (ex < minX) minX = ex;
      if (ex > maxX) maxX = ex;
      if (ey < minY) minY = ey;
      if (ey > maxY) maxY = ey;
    }
    // Half-extent with ~5% headroom so the quad never kisses the polygon edge.
    const halfX = Math.max(1, (maxX - minX) * 0.55);
    const halfY = Math.max(1, (maxY - minY) * 0.55);
    projected.push({ xy, halfExtentKm: { x: halfX, y: halfY }, basis });
    totalVerts += footprint.length;
    const half = Math.max(halfX, halfY);
    if (half > maxHalfExtentKm) maxHalfExtentKm = half;
  }

  // Second pass: lay out into the RG32F texture.
  const height = Math.max(1, Math.ceil(totalVerts / ATLAS_WIDTH));
  const data = new Float32Array(ATLAS_WIDTH * height * 2);
  const meta: AtlasInstanceMeta[] = [];
  let cursor = 0;
  for (let i = 0; i < records.length; i++) {
    const p = projected[i]!;
    const rec = records[i]!;
    const polyCount = p.xy.length / 2;
    const offset = cursor;
    for (let v = 0; v < polyCount; v++) {
      data[(cursor + v) * 2] = p.xy[v * 2]!;
      data[(cursor + v) * 2 + 1] = p.xy[v * 2 + 1]!;
    }
    cursor += polyCount;
    meta.push({
      polyOffset: offset,
      polyCount,
      halfExtentKm: p.halfExtentKm,
      basis: p.basis,
      record: rec,
    });
  }

  const texture = new THREE.DataTexture(
    data,
    ATLAS_WIDTH,
    height,
    THREE.RGFormat,
    THREE.FloatType,
  );
  texture.needsUpdate = true;
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  return { texture, meta, maxHalfExtentKm };
}

/**
 * CPU-side even-odd-rule point-in-polygon test against one polygon's
 * vertex run inside the atlas data. Used by the urban-detail layer to
 * scanline-rasterise the inside mask before placing buildings.
 *
 * `polyXy` is the flat `[x0, y0, x1, y1, ...]` array (km, tangent frame).
 */
export function pointInPolygon(polyXy: Float32Array, x: number, y: number): boolean {
  let inside = false;
  const n = polyXy.length / 2;
  let j = n - 1;
  for (let i = 0; i < n; i++) {
    const xi = polyXy[i * 2]!;
    const yi = polyXy[i * 2 + 1]!;
    const xj = polyXy[j * 2]!;
    const yj = polyXy[j * 2 + 1]!;
    // Half-open intervals so vertices that coincide with the test
    // point's y don't double-count.
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
    j = i;
  }
  return inside;
}

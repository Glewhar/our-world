/**
 * Spherical-cap → HEALPix cells. Used by `set_attribute` (and other
 * point-located primitives later) to map an `EventLocation` of kind
 * `point` to the cells it touches.
 *
 * Algorithm: walk a regular lat/lon grid covering the cap's bounding
 * box, convert each sample to a HEALPix pixel via `zPhiToPix`, dedupe
 * via a `Uint8Array(npix)` mark, and emit the marked indices in
 * ascending order. Sample step is half a HEALPix cell edge — fine
 * enough to cover every cell in the cap with no gaps, coarse enough
 * to stay cheap (~10⁴ samples for radius_km ≤ 500 at nside ≤ 1024).
 *
 * Why brute-force-but-bounded: the principled hierarchical cap-search
 * (astropy_healpix's `cone_search_lonlat`) is ~120 LOC of HEALPix ring
 * arithmetic. We don't need it for the slice's single point primitive,
 * and bounded grid sampling is correct + boring + easy to verify.
 *
 * Determinism (C6): the lat/lon walk is in fixed nested-loop order;
 * the output is a `Uint32Array` sorted ascending. No PRNG, no clocks.
 */

import { zPhiToPix, type HealpixOrdering } from '../../world/healpix.js';

const DEG = Math.PI / 180;
const EARTH_RADIUS_KM = 6371;

/** Cell edge length in radians on the unit sphere, approximated as `sqrt(4π / npix)`. */
function cellEdgeRad(nside: number): number {
  const npix = 12 * nside * nside;
  return Math.sqrt((4 * Math.PI) / npix);
}

export type ConeQuery = {
  latDeg: number;
  lonDeg: number;
  radiusKm: number;
};

export type ConeContext = {
  nside: number;
  ordering: HealpixOrdering;
  /** Scratch mark bitmap, length `12*nside*nside`. Caller-owned so we don't allocate per call. */
  mark: Uint8Array;
};

export function makeConeContext(nside: number, ordering: HealpixOrdering): ConeContext {
  return {
    nside,
    ordering,
    mark: new Uint8Array(12 * nside * nside),
  };
}

/**
 * Fill `ctx.mark` and return a sorted `Uint32Array` of HEALPix cells the
 * cap covers. Resets the mark bitmap on entry; caller never sees stale
 * marks between calls.
 */
export function coneSearchPix(ctx: ConeContext, query: ConeQuery): Uint32Array {
  const { nside, ordering, mark } = ctx;
  mark.fill(0);

  const radiusRad = query.radiusKm / EARTH_RADIUS_KM;
  if (radiusRad <= 0) return new Uint32Array(0);

  const lat0 = query.latDeg * DEG;
  const lon0 = query.lonDeg * DEG;
  const cosLat0 = Math.cos(lat0);
  const sinLat0 = Math.sin(lat0);

  // Bounding box in radians. Latitude box is straightforward; longitude
  // box widens by 1/cos(lat) but we clamp to π near the poles to avoid
  // div-by-zero — the polar cap behaviour is handled implicitly by the
  // dedupe step (samples at multiple longitudes hit the same pixel).
  const latHalfBox = radiusRad;
  const lonHalfBox = cosLat0 < 1e-3 ? Math.PI : radiusRad / Math.max(0.1, cosLat0);

  const stepRad = cellEdgeRad(nside) * 0.5;
  const latSteps = Math.max(2, Math.ceil((2 * latHalfBox) / stepRad) + 1);
  const lonSteps = Math.max(2, Math.ceil((2 * lonHalfBox) / stepRad) + 1);

  const cosRadius = Math.cos(radiusRad);

  // Track unique cells to size the output exactly. Determinism is
  // preserved because the final emission walks `mark` in ascending
  // ipix order.
  let count = 0;

  for (let i = 0; i < latSteps; i++) {
    const t = latSteps === 1 ? 0.5 : i / (latSteps - 1);
    const lat = lat0 - latHalfBox + t * 2 * latHalfBox;
    if (lat < -Math.PI / 2 || lat > Math.PI / 2) continue;
    const cosLat = Math.cos(lat);
    const sinLat = Math.sin(lat);
    for (let j = 0; j < lonSteps; j++) {
      const u = lonSteps === 1 ? 0.5 : j / (lonSteps - 1);
      const lon = lon0 - lonHalfBox + u * 2 * lonHalfBox;
      // Great-circle distance test against the cap centre.
      const cosD = sinLat0 * sinLat + cosLat0 * cosLat * Math.cos(lon - lon0);
      if (cosD < cosRadius) continue;
      const z = sinLat;
      const phi = lon;
      const ipix = zPhiToPix(nside, ordering, z, phi);
      if (ipix < 0 || ipix >= mark.length) continue;
      if (mark[ipix] === 0) {
        mark[ipix] = 1;
        count++;
      }
    }
  }

  const out = new Uint32Array(count);
  let k = 0;
  for (let i = 0; i < mark.length; i++) {
    if (mark[i]) {
      out[k++] = i;
      if (k === count) break;
    }
  }
  return out;
}

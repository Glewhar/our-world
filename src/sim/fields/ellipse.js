/**
 * Ellipse → HEALPix cells. Used by the `set_attribute_ellipse` sim
 * primitive AND by the scenario registry's wasteland paint capture, so
 * the ellipse shape stays defined in exactly one place.
 *
 * Geometry: a downwind-elongated ellipse on the unit sphere.
 *   - `radiusKm`   — cross-wind half-axis (perpendicular to bearing)
 *   - `stretchKm`  — downwind half-axis (in the direction of `bearingDeg`)
 *   - upwind tail  — `0.2 * stretchKm` so the plume falls off faster
 *                    behind the blast than it spreads ahead
 *   - `bearingDeg` — azimuth from north (0 = north, 90 = east), the
 *                    wind "toward" direction. The wasteland plume
 *                    points along this bearing.
 *
 * Distance metric is geodesic (great-circle in km). Per cell we project
 * the cell-relative bearing onto a tangent frame at the centre, split
 * into along-bearing (d_along) and cross-bearing (d_cross), and apply
 *   r² = (d_along / s_eff)² + (d_cross / radiusKm)²
 * where `s_eff` is `stretchKm` on the downwind side and `0.2 × stretchKm`
 * upwind. Cells with `r² < 1` get a smoothstep-falloff value.
 *
 * Bbox prefilter: we only walk lat/lon cells inside the bounding box of
 * `max(radiusKm, stretchKm)` so we don't iterate all 12.6 M cells of
 * an nside=1024 grid.
 *
 * Determinism (C6): no PRNG, no clocks. The lat/lon walk is a fixed
 * nested loop, output is sorted by ipix ascending.
 */
import { zPhiToPix } from '../../world/healpix.js';
import { acquireStampScratch } from './stampScratch.js';
const DEG = Math.PI / 180;
const EARTH_RADIUS_KM = 6371;
const UPWIND_TAIL_FRACTION = 0.2;
/**
 * Estimated HEALPix cell edge length in radians on the unit sphere
 * (`sqrt(4π / npix)`). Used to size the lat/lon walk step so every cell
 * inside the ellipse gets sampled at least once.
 */
function cellEdgeRad(nside) {
    const npix = 12 * nside * nside;
    return Math.sqrt((4 * Math.PI) / npix);
}
/**
 * Compute the cells + values an ellipse covers, in ascending ipix order.
 *
 * Cells outside the ellipse are not emitted. Cells inside get a value =
 * `args.value × smoothstep(1, 0, sqrt(r²))` so the falloff is smooth.
 */
export function computeEllipseStamp(args, nside, ordering) {
    const npix = 12 * nside * nside;
    if (args.value <= 0 || args.radiusKm <= 0 || args.stretchKm <= 0) {
        return { cells: new Uint32Array(0), values: new Float32Array(0) };
    }
    const lat0 = args.centreLatDeg * DEG;
    const lon0 = args.centreLonDeg * DEG;
    const cosLat0 = Math.cos(lat0);
    const sinLat0 = Math.sin(lat0);
    // Bounding box uses the larger of the two half-axes — keeps the walk
    // simple at the cost of sampling a few extra cells inside the bbox
    // but outside the ellipse. Filter against r² inside the loop.
    const halfBoxKm = Math.max(args.radiusKm, args.stretchKm);
    const halfBoxRad = halfBoxKm / EARTH_RADIUS_KM;
    const latHalfBox = halfBoxRad;
    // Longitude box widens by 1/cos(lat). At the poles cosLat0 → 0, so
    // clamp to π to avoid div-by-zero / runaway bbox. Polar caps are rare
    // for nuclear strikes but the math has to stay finite.
    const lonHalfBox = cosLat0 < 1e-3 ? Math.PI : halfBoxRad / Math.max(0.1, cosLat0);
    const stepRad = cellEdgeRad(nside) * 0.5;
    const latSteps = Math.max(2, Math.ceil((2 * latHalfBox) / stepRad) + 1);
    const lonSteps = Math.max(2, Math.ceil((2 * lonHalfBox) / stepRad) + 1);
    // Direction "toward bearing" is the downwind direction. The bearing
    // is measured clockwise from north, so unit vector in the lat-tangent
    // frame is (eastward = sin(bearing), northward = cos(bearing)).
    const bearingRad = args.bearingDeg * DEG;
    const towardN = Math.cos(bearingRad);
    const towardE = Math.sin(bearingRad);
    // Mark bitmap for dedupe + ascending emission. Cells touched by
    // multiple lat/lon samples keep the maximum value — sample density is
    // fine enough that this is a no-op in practice, but the max keeps
    // the centre from getting under-stamped near grid boundaries. Buffers
    // come from the shared scratch arena so a 70-strike Nuclear War onStart
    // doesn't burst ~3.5 GB of ephemeral allocations at nside=1024.
    const scratch = acquireStampScratch(npix);
    const mark = scratch.mark;
    const valBuf = scratch.valBuf;
    let count = 0;
    for (let i = 0; i < latSteps; i++) {
        const t = latSteps === 1 ? 0.5 : i / (latSteps - 1);
        const lat = lat0 - latHalfBox + t * 2 * latHalfBox;
        if (lat < -Math.PI / 2 || lat > Math.PI / 2)
            continue;
        const cosLat = Math.cos(lat);
        const sinLat = Math.sin(lat);
        for (let j = 0; j < lonSteps; j++) {
            const u = lonSteps === 1 ? 0.5 : j / (lonSteps - 1);
            const lon = lon0 - lonHalfBox + u * 2 * lonHalfBox;
            // Great-circle distance (radians) from the centre to (lat, lon).
            const cosD = sinLat0 * sinLat + cosLat0 * cosLat * Math.cos(lon - lon0);
            const cosDClamped = cosD > 1 ? 1 : cosD < -1 ? -1 : cosD;
            const dRad = Math.acos(cosDClamped);
            if (dRad > halfBoxRad * 1.05)
                continue; // bbox prefilter
            const dKm = dRad * EARTH_RADIUS_KM;
            if (dKm === 0) {
                // Centre sample. Hits at most a couple of cells (depending on
                // step size); apply the peak value directly.
                const ipix0 = zPhiToPix(nside, ordering, sinLat, lon);
                if (mark[ipix0] === 0) {
                    mark[ipix0] = 1;
                    scratch.recordTouched(ipix0);
                    count++;
                }
                if (valBuf[ipix0] < args.value)
                    valBuf[ipix0] = args.value;
                continue;
            }
            // Initial bearing from the centre to (lat, lon), measured east of
            // north. Used to split into along/cross components.
            const y = Math.sin(lon - lon0) * cosLat;
            const x = cosLat0 * sinLat - sinLat0 * cosLat * Math.cos(lon - lon0);
            const bearingToCell = Math.atan2(y, x);
            const bN = Math.cos(bearingToCell);
            const bE = Math.sin(bearingToCell);
            // Projection along/cross the wind direction.
            const dotAlong = bN * towardN + bE * towardE; // ∈ [-1, 1]
            const dotCross = bN * -towardE + bE * towardN; // perpendicular CCW
            const dAlong = dKm * dotAlong;
            const dCross = dKm * dotCross;
            const sEff = dAlong >= 0 ? args.stretchKm : args.stretchKm * UPWIND_TAIL_FRACTION;
            const aTerm = dAlong / sEff;
            const bTerm = dCross / args.radiusKm;
            const r2 = aTerm * aTerm + bTerm * bTerm;
            if (r2 >= 1)
                continue;
            const r = Math.sqrt(r2);
            // smoothstep(1, 0, r) → falls from 1 at centre to 0 at the edge.
            const t1 = 1 - r; // in [0, 1]
            const falloff = t1 * t1 * (3 - 2 * t1);
            const v = args.value * falloff;
            const ipix = zPhiToPix(nside, ordering, sinLat, lon);
            if (ipix < 0 || ipix >= npix)
                continue;
            if (mark[ipix] === 0) {
                mark[ipix] = 1;
                scratch.recordTouched(ipix);
                count++;
            }
            if (valBuf[ipix] < v)
                valBuf[ipix] = v;
        }
    }
    // Touched-list emit: ascending-ipix contract preserved via a sort over
    // the few thousand cells we actually marked. Walking the full npix here
    // used to scan all 12.6 M cells at nside=1024 and dominated the strike
    // cost (~30–50 ms on a 1500 km stamp).
    const cells = new Uint32Array(count);
    const values = new Float32Array(count);
    const touchedView = scratch.getTouchedView();
    for (let i = 0; i < count; i++)
        cells[i] = touchedView[i];
    cells.sort();
    for (let i = 0; i < count; i++)
        values[i] = valBuf[cells[i]];
    scratch.release();
    return { cells, values };
}

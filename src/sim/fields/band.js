/**
 * Latitude-band → HEALPix cells. Used by climate-class scenarios that
 * flip whole zonal belts (e.g. mid-latitudes → desert, sub-polar →
 * tundra). Sibling to `./ellipse.ts`.
 *
 * Geometry: a smooth-edged zonal strip on the unit sphere.
 *   - `latDegMin / latDegMax` — band edges in degrees (inclusive)
 *   - `edgeSoftnessDeg` — width of the smoothstep falloff outside each
 *      edge. Inside the band, intensity is constant = `args.value`. In
 *      the soft margin (outside the band, within `edgeSoftnessDeg`),
 *      intensity ramps from 1 down to 0 via a smoothstep.
 *   - `lonDegMin / lonDegMax` — optional longitude window. Full ring
 *      when both are omitted. When set, the window is taken in the same
 *      lon convention as input (no implicit antimeridian wrap; pass two
 *      paints if you need the wrapped case).
 *
 * Sampling: we walk a lat/lon grid at half the HEALPix cell-edge spacing
 * (same density as the ellipse stamper) and dedupe by ipix. Max-merging
 * the smoothstep intensity per cell smooths boundary aliasing — the
 * sample density is fine enough that each cell receives at least one
 * sample with intensity close to its centre's true value.
 *
 * Determinism: no PRNG, no clocks. Output is sorted by ipix ascending.
 */
import { zPhiToPix } from '../../world/healpix.js';
import { acquireStampScratch } from './stampScratch.js';
const DEG = Math.PI / 180;
const TWO_PI = 2 * Math.PI;
/**
 * Estimated HEALPix cell edge length in radians on the unit sphere
 * (`sqrt(4π / npix)`). Used to size the lat/lon walk step so every cell
 * inside the band gets sampled at least once.
 */
function cellEdgeRad(nside) {
    const npix = 12 * nside * nside;
    return Math.sqrt((4 * Math.PI) / npix);
}
/** Standard smoothstep, `t` clamped to [0, 1]. */
function smoothstep01(t) {
    const x = t < 0 ? 0 : t > 1 ? 1 : t;
    return x * x * (3 - 2 * x);
}
/**
 * Intensity at the given latitude (in degrees) inside the band. Returns
 *   - 1 inside `[latDegMin, latDegMax]`
 *   - smoothstep ramp in the soft margins on either side
 *   - 0 outside the soft margins
 */
function bandIntensityAtLat(latDeg, args) {
    const lo = args.latDegMin;
    const hi = args.latDegMax;
    const soft = args.edgeSoftnessDeg;
    if (latDeg >= lo && latDeg <= hi)
        return 1;
    if (soft <= 0)
        return 0;
    if (latDeg < lo) {
        const d = lo - latDeg;
        if (d >= soft)
            return 0;
        // u: 0 at outer soft edge, 1 at band edge
        const u = 1 - d / soft;
        return smoothstep01(u);
    }
    // latDeg > hi
    const d = latDeg - hi;
    if (d >= soft)
        return 0;
    const u = 1 - d / soft;
    return smoothstep01(u);
}
/**
 * Compute the cells + values covered by a band paint, in ascending ipix order.
 *
 * Cells outside the band + soft margin are not emitted.
 */
export function computeBandStamp(args, nside, ordering) {
    if (args.value <= 0 || args.edgeSoftnessDeg < 0 || args.latDegMin > args.latDegMax) {
        return { cells: new Uint32Array(0), values: new Float32Array(0) };
    }
    const latMinDeg = args.latDegMin - args.edgeSoftnessDeg;
    const latMaxDeg = args.latDegMax + args.edgeSoftnessDeg;
    const latMinClamp = latMinDeg < -90 ? -90 : latMinDeg;
    const latMaxClamp = latMaxDeg > 90 ? 90 : latMaxDeg;
    // Longitude window. Full ring when both bounds are omitted; otherwise
    // an explicit closed interval [lonDegMin, lonDegMax] (degrees).
    const hasLonWindow = args.lonDegMin !== undefined && args.lonDegMax !== undefined;
    const lonMinDeg = hasLonWindow ? args.lonDegMin : -180;
    const lonMaxDeg = hasLonWindow ? args.lonDegMax : 180;
    if (lonMaxDeg < lonMinDeg) {
        // Caller should pass two paints for a wrapped window; bail rather
        // than silently emitting the wrong cells.
        return { cells: new Uint32Array(0), values: new Float32Array(0) };
    }
    const stepRad = cellEdgeRad(nside) * 0.5;
    const stepDeg = stepRad / DEG;
    const latSpanDeg = latMaxClamp - latMinClamp;
    const latSteps = Math.max(2, Math.ceil(latSpanDeg / stepDeg) + 1);
    const npix = 12 * nside * nside;
    // Shared scratch arena — climate scenarios paint a north + south band
    // pair per onStart, and at nside=1024 each fresh allocation is ~50 MB.
    const scratch = acquireStampScratch(npix);
    const mark = scratch.mark;
    const valBuf = scratch.valBuf;
    let count = 0;
    for (let i = 0; i < latSteps; i++) {
        const tLat = latSteps === 1 ? 0.5 : i / (latSteps - 1);
        const latDeg = latMinClamp + tLat * latSpanDeg;
        const intensity = bandIntensityAtLat(latDeg, args);
        if (intensity <= 0)
            continue;
        const v = args.value * intensity;
        const lat = latDeg * DEG;
        const sinLat = Math.sin(lat);
        const cosLat = Math.cos(lat);
        // Longitude step widens toward the poles so we don't oversample
        // small rings; clamp the divisor to keep the step finite there.
        const lonStepDeg = stepDeg / Math.max(0.05, cosLat);
        const lonSpanDeg = lonMaxDeg - lonMinDeg;
        const lonSteps = Math.max(2, Math.ceil(lonSpanDeg / lonStepDeg) + 1);
        for (let j = 0; j < lonSteps; j++) {
            const tLon = lonSteps === 1 ? 0.5 : j / (lonSteps - 1);
            const lonDeg = lonMinDeg + tLon * lonSpanDeg;
            const lon = lonDeg * DEG;
            // Normalise into [0, 2π) for zPhiToPix; it does its own modulo
            // but a stable input avoids floor edge cases.
            const lonNorm = lon < 0 ? lon + TWO_PI : lon >= TWO_PI ? lon - TWO_PI : lon;
            const ipix = zPhiToPix(nside, ordering, sinLat, lonNorm);
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
    // Polar caps: at lat ≈ ±90°, the lonStepDeg divisor collapses; ensure
    // we hit the pole pixels at least once by emitting the polar samples
    // explicitly when the band reaches them.
    if (latMaxClamp >= 89.999 && bandIntensityAtLat(90, args) > 0) {
        const v = args.value * bandIntensityAtLat(90, args);
        const ipix = zPhiToPix(nside, ordering, 1, 0);
        if (ipix >= 0 && ipix < npix) {
            if (mark[ipix] === 0) {
                mark[ipix] = 1;
                scratch.recordTouched(ipix);
                count++;
            }
            if (valBuf[ipix] < v)
                valBuf[ipix] = v;
        }
    }
    if (latMinClamp <= -89.999 && bandIntensityAtLat(-90, args) > 0) {
        const v = args.value * bandIntensityAtLat(-90, args);
        const ipix = zPhiToPix(nside, ordering, -1, 0);
        if (ipix >= 0 && ipix < npix) {
            if (mark[ipix] === 0) {
                mark[ipix] = 1;
                scratch.recordTouched(ipix);
                count++;
            }
            if (valBuf[ipix] < v)
                valBuf[ipix] = v;
        }
    }
    const cells = new Uint32Array(count);
    const values = new Float32Array(count);
    let k = 0;
    for (let i = 0; i < npix; i++) {
        if (mark[i]) {
            cells[k] = i;
            values[k] = valBuf[i];
            k++;
            if (k === count)
                break;
        }
    }
    scratch.release();
    return { cells, values };
}

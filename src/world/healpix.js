/**
 * HEALPix `zphiToPix` for both ring and nested orderings.
 *
 * Ports the formulas in Górski et al. 2005 §4 (https://arxiv.org/abs/astro-ph/0409513),
 * cross-validated against `astropy_healpix.HEALPix.lonlat_to_healpix` via the
 * fixture vectors at `data-pipeline/tests/fixtures/healpix_pix_vectors.json`.
 *
 * Why hand-rolled: the npm `healpix` package is unmaintained (last publish 2017)
 * and pulling in `healpix-js` adds ~80 KB of ES5 prelude for one function. The
 * algorithms are short enough to inline (~120 LOC total).
 *
 * Coordinate convention matches the pipeline:
 *   z   = sin(lat) = cos(colatitude), in [-1, +1]
 *   phi = longitude in radians, callers normalise via the modular add inside.
 *
 * The API takes `z` directly (not `theta`) on purpose: cos(π/2) returns
 * `6.12e-17`, not exactly 0, which silently bumps equatorial samples onto
 * the wrong HEALPix ring at certain longitudes. Passing `z = sin(lat)` (or
 * the hit-point's z component) gives an exact 0 at the equator and matches
 * what astropy_healpix's C kernel does internally.
 */
const TWO_PI = 2 * Math.PI;
const HALF_PI = Math.PI / 2;
/** Map a unit-sphere point (z, phi) to a HEALPix pixel index. */
export function zPhiToPix(nside, ordering, z, phi) {
    const phiNorm = ((phi % TWO_PI) + TWO_PI) % TWO_PI;
    const tt = (phiNorm / HALF_PI) % 4; // ∈ [0, 4)
    if (ordering === 'ring')
        return _angToPixRing(nside, z, tt);
    return _angToPixNested(nside, z, tt);
}
/* ─── internals ─────────────────────────────────────────────────────────── */
function _angToPixRing(nside, z, tt) {
    const za = Math.abs(z);
    const nl4 = 4 * nside;
    if (za <= 2 / 3) {
        // Equatorial belt
        const temp1 = nside * (0.5 + tt);
        const temp2 = nside * 0.75 * z;
        let jp = Math.floor(temp1 - temp2); // ascending diagonal index
        const jm = Math.floor(temp1 + temp2); // descending diagonal index
        // At exact z=0 with even nside, the formula yields ir = nside+1 but
        // astropy_healpix canonically maps z=0 to the northern adjacent ring
        // (ir = nside). Compensate by nudging jp down so jp - jm = -1 instead
        // of 0 at the equator.
        if (z === 0 && jp === jm)
            jp -= 1;
        const ir = nside + 1 + jp - jm; // ring number ∈ [1, 2·nside+1]
        const kshift = 1 - (ir & 1); // 1 if ir even, else 0
        let ip = Math.floor((jp + jm - nside + kshift + 1) / 2);
        ip = ((ip % nl4) + nl4) % nl4;
        const ncap = 2 * nside * (nside - 1);
        return ncap + (ir - 1) * nl4 + ip;
    }
    // Polar caps
    const tp = tt - Math.floor(tt);
    const tmp = nside * Math.sqrt(3 * (1 - za));
    const jp = Math.floor(tp * tmp);
    const jm = Math.floor((1 - tp) * tmp);
    const ir = jp + jm + 1; // ring number from the nearer pole, ∈ [1, nside]
    let ip = Math.floor((tt * ir) % (4 * ir));
    if (ip < 0)
        ip += 4 * ir;
    if (z > 0) {
        return 2 * ir * (ir - 1) + ip; // north cap
    }
    // South cap (mirror): pixel index counted from the south pole, then offset.
    return 12 * nside * nside - 2 * ir * (ir + 1) + ip;
}
function _angToPixNested(nside, z, tt) {
    const za = Math.abs(z);
    let face;
    let ix;
    let iy;
    if (za <= 2 / 3) {
        // Equatorial belt: pick face from the (jp, jm) diagonal indices.
        const temp1 = nside * (0.5 + tt);
        const temp2 = nside * 0.75 * z;
        let jp = Math.floor(temp1 - temp2);
        const jm = Math.floor(temp1 + temp2);
        // Equator boundary: see _angToPixRing for the same correction.
        if (z === 0 && jp === jm)
            jp -= 1;
        const ifp = Math.floor(jp / nside); // ∈ [0, 3]
        const ifm = Math.floor(jm / nside); // ∈ [0, 3]
        if (ifp === ifm)
            face = (ifp & 3) | 4; // equatorial face 4..7
        else if (ifp < ifm)
            face = ifp & 3; // north face 0..3
        else
            face = (ifm & 3) + 8; // south face 8..11
        ix = ((jm % nside) + nside) % nside;
        iy = nside - 1 - (((jp % nside) + nside) % nside);
    }
    else {
        // Polar caps
        const ntt = Math.min(3, Math.floor(tt));
        const tp = tt - ntt;
        const tmp = nside * Math.sqrt(3 * (1 - za));
        const jp = Math.floor(tp * tmp);
        const jm = Math.floor((1 - tp) * tmp);
        const jpC = Math.min(nside - 1, jp);
        const jmC = Math.min(nside - 1, jm);
        if (z >= 0) {
            face = ntt;
            ix = nside - jmC - 1;
            iy = nside - jpC - 1;
        }
        else {
            face = ntt + 8;
            ix = jpC;
            iy = jmC;
        }
    }
    return face * nside * nside + _xyToMorton(ix, iy);
}
/**
 * Interleave the bits of `ix` and `iy` (Morton / Z-order) so the result has
 * iy's bits in odd positions and ix's bits in even positions. Used as the
 * within-face pixel index for nested ordering.
 *
 * Inputs are non-negative integers up to ~2^16 (nside ≤ 2^15 covers any HEALPix
 * resolution we'll ever bake — the pipeline default is 1024).
 */
function _xyToMorton(ix, iy) {
    return _spreadBits(ix) | (_spreadBits(iy) << 1);
}
/** Spread an integer's low bits into even bit positions: 0bABCD → 0b0A0B0C0D. */
function _spreadBits(n) {
    let x = n & 0xffff;
    x = (x | (x << 8)) & 0x00ff00ff;
    x = (x | (x << 4)) & 0x0f0f0f0f;
    x = (x | (x << 2)) & 0x33333333;
    x = (x | (x << 1)) & 0x55555555;
    return x;
}

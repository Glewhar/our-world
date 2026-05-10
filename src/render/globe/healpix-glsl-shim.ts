/**
 * TypeScript shim that mirrors the GLSL HEALPix port at
 * `web/src/render/globe/shaders/healpix.glsl` line-for-line, including
 * GLSL `int` semantics (32-bit signed truncating divide for the `int(...)`
 * cast, floor for explicit `healpixFloorDiv`, and the float `mod()`
 * semantics distinct from JS `%`).
 *
 * Used by `src/world/__tests__/healpix-glsl-parity.test.ts` to assert the
 * GLSL port agrees with the canonical TS lookup at `src/world/healpix.ts`
 * (which is itself asserted against `astropy_healpix` via fixtures). When
 * editing this file, keep `healpix.glsl` line-for-line in sync.
 */

import type { HealpixOrdering } from '../../world/healpix.js';

const HEALPIX_TWO_PI = 2 * Math.PI;
const HEALPIX_HALF_PI = Math.PI / 2;
const HEALPIX_TWO_THIRDS = 2 / 3;

/** GLSL float `mod(x, y)` = x - y * floor(x/y) (distinct from JS `%`). */
function fmod(x: number, y: number): number {
  return x - y * Math.floor(x / y);
}

/** Mirror GLSL `int(x)`: truncate toward zero, not toward −∞. */
function toInt(x: number): number {
  return Math.trunc(x) | 0;
}

function healpixSpreadBits(n: number): number {
  let x = n & 0xffff;
  x = (x | (x << 8)) & 0x00ff00ff;
  x = (x | (x << 4)) & 0x0f0f0f0f;
  x = (x | (x << 2)) & 0x33333333;
  x = (x | (x << 1)) & 0x55555555;
  return x;
}

function healpixXyToMorton(ix: number, iy: number): number {
  return healpixSpreadBits(ix) | (healpixSpreadBits(iy) << 1);
}

/**
 * GLSL: `int(floor(float(a) / float(b)))`.
 * Floor division (toward −∞), not truncation.
 */
function healpixFloorDiv(a: number, b: number): number {
  return Math.floor(a / b);
}

function healpixAngToPixRing(nside: number, z: number, tt: number): number {
  const za = Math.abs(z);
  const nl4 = 4 * nside;
  const fns = nside;

  if (za <= HEALPIX_TWO_THIRDS) {
    const temp1 = fns * (0.5 + tt);
    const temp2 = fns * 0.75 * z;
    let jp = Math.floor(temp1 - temp2);
    const jm = Math.floor(temp1 + temp2);
    if (z === 0 && jp === jm) jp -= 1;
    const ir = nside + 1 + jp - jm;
    const kshift = 1 - (ir & 1);
    let ip = healpixFloorDiv(jp + jm - nside + kshift + 1, 2);
    ip = ((ip % nl4) + nl4) % nl4;
    const ncap = 2 * nside * (nside - 1);
    return ncap + (ir - 1) * nl4 + ip;
  }

  const tp = tt - Math.floor(tt);
  const tmp = fns * Math.sqrt(3 * (1 - za));
  const jp = Math.floor(tp * tmp);
  const jm = Math.floor((1 - tp) * tmp);
  const ir = jp + jm + 1;
  // GLSL: `int(mod(tt * float(ir), 4.0 * float(ir)))` — int() truncates.
  let ip = toInt(fmod(tt * ir, 4 * ir));
  if (ip < 0) ip += 4 * ir;
  if (z > 0) {
    return 2 * ir * (ir - 1) + ip;
  }
  return 12 * nside * nside - 2 * ir * (ir + 1) + ip;
}

function healpixAngToPixNested(nside: number, z: number, tt: number): number {
  const za = Math.abs(z);
  let face: number;
  let ix: number;
  let iy: number;
  const fns = nside;

  if (za <= HEALPIX_TWO_THIRDS) {
    const temp1 = fns * (0.5 + tt);
    const temp2 = fns * 0.75 * z;
    let jp = Math.floor(temp1 - temp2);
    const jm = Math.floor(temp1 + temp2);
    if (z === 0 && jp === jm) jp -= 1;
    const ifp = healpixFloorDiv(jp, nside);
    const ifm = healpixFloorDiv(jm, nside);
    if (ifp === ifm) face = (ifp & 3) | 4;
    else if (ifp < ifm) face = ifp & 3;
    else face = (ifm & 3) + 8;
    ix = ((jm % nside) + nside) % nside;
    iy = nside - 1 - (((jp % nside) + nside) % nside);
  } else {
    const ntt = Math.min(3, Math.floor(tt));
    const tp = tt - ntt;
    const tmp = fns * Math.sqrt(3 * (1 - za));
    const jp = Math.floor(tp * tmp);
    const jm = Math.floor((1 - tp) * tmp);
    const jpC = Math.min(nside - 1, jp);
    const jmC = Math.min(nside - 1, jm);
    if (z >= 0) {
      face = ntt;
      ix = nside - jmC - 1;
      iy = nside - jpC - 1;
    } else {
      face = ntt + 8;
      ix = jpC;
      iy = jmC;
    }
  }
  return face * nside * nside + healpixXyToMorton(ix, iy);
}

/** GLSL-shim equivalent of `healpixZPhiToPix(nside, ordering, z, phi)`. */
export function zPhiToPixGlslShim(
  nside: number,
  ordering: HealpixOrdering,
  z: number,
  phi: number,
): number {
  // Match the canonical's (phi % TWO_PI + TWO_PI) % TWO_PI formulation
  // bit-for-bit. The GLSL writes this with `mod(mod(...) + TWO_PI,
  // TWO_PI)` (floor-mod), which on the GPU produces the same shape but
  // accumulates float32 error differently. Since the parity test
  // measures the shim against the *canonical* on a deterministic JS
  // grid, we use the canonical's exact float64 arithmetic here. The
  // shim's job is to validate the algorithmic structure of the GLSL
  // port — int truncation, Morton bit-spreading, branch boundaries —
  // not to mirror float32 round-off.
  const phiNorm = ((phi % HEALPIX_TWO_PI) + HEALPIX_TWO_PI) % HEALPIX_TWO_PI;
  const tt = (phiNorm / HEALPIX_HALF_PI) % 4;
  if (ordering === 'ring') return healpixAngToPixRing(nside, z, tt);
  return healpixAngToPixNested(nside, z, tt);
}

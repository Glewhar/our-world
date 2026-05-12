/**
 * PCG32 — small, fast, seedable 32-bit PRNG for the procedural urban
 * detail layer.
 *
 * The render layer doesn't sit under the `custom/no-nondeterminism`
 * lint rule (that's scoped to `web/src/sim/**`), so `Math.random` is
 * legal here. But the urban-detail layer's CITY-LEVEL state (block
 * sizes, building footprints, heights) must stay stable across re-runs
 * for a given city so the visual doesn't shimmer between renders or
 * camera approaches. This module gives us that determinism without
 * pulling the sim PRNG into the render tree.
 *
 * Reference: https://www.pcg-random.org/. The 32-bit variant. JS bit
 * ops are 32-bit signed; `>>> 0` re-floats them to unsigned.
 */
const MUL_HI = 0x5851f42d; // 6364136223846793005 hi 32
const MUL_LO = 0x4c957f2d; // 6364136223846793005 lo 32
/** PCG32 state (seedable, mutable). */
export class Pcg32 {
    // Internal 64-bit state held as two 32-bit halves for V8 SMI-friendliness.
    stateHi;
    stateLo;
    incHi;
    incLo;
    constructor(seed, stream = 0xa3c59ac3) {
        // initial state = 0, advance once with seed mixed into the increment.
        this.stateHi = 0;
        this.stateLo = 0;
        // PCG requires the increment to be odd.
        this.incHi = (stream >>> 1) | 0;
        this.incLo = ((stream << 1) | 1) >>> 0;
        this.next();
        this.stateLo = (this.stateLo + (seed >>> 0)) >>> 0;
        // Carry into stateHi if seed addition overflowed.
        if ((this.stateLo >>> 0) < (seed >>> 0))
            this.stateHi = (this.stateHi + 1) >>> 0;
        this.next();
    }
    /** Returns a 32-bit unsigned int. */
    next() {
        // oldstate = state
        const oldHi = this.stateHi;
        const oldLo = this.stateLo;
        // Advance state: state = state * MUL + inc (all 64-bit).
        // Multiply (oldHi:oldLo) * (MUL_HI:MUL_LO), low-32 of result + carry chain.
        // We only need low 64 bits; do it as 4 partial products.
        const lo_lo_a = (oldLo & 0xffff) * (MUL_LO & 0xffff);
        const lo_lo_b = (oldLo >>> 16) * (MUL_LO & 0xffff);
        const lo_lo_c = (oldLo & 0xffff) * (MUL_LO >>> 16);
        const lo_lo_d = (oldLo >>> 16) * (MUL_LO >>> 16);
        const carryFromLow = (lo_lo_a + ((lo_lo_b & 0xffff) << 16)) >>> 0;
        const newLo = (carryFromLow + ((lo_lo_c & 0xffff) << 16)) >>> 0;
        // High 32 collects: top halves of the cross products + low×hi + hi×lo.
        let newHi = lo_lo_d + (lo_lo_b >>> 16) + (lo_lo_c >>> 16) +
            Math.imul(oldLo, MUL_HI) + Math.imul(oldHi, MUL_LO);
        // Carry from low overflow detection: if lo_lo_a + (lo_lo_b<<16) < lo_lo_a, +1.
        if ((carryFromLow >>> 0) < (lo_lo_a >>> 0))
            newHi = (newHi + 1) >>> 0;
        if ((newLo >>> 0) < (carryFromLow >>> 0))
            newHi = (newHi + 1) >>> 0;
        newHi = newHi >>> 0;
        // Add increment.
        const sumLo = (newLo + this.incLo) >>> 0;
        let sumHi = (newHi + this.incHi) >>> 0;
        if ((sumLo >>> 0) < (newLo >>> 0))
            sumHi = (sumHi + 1) >>> 0;
        this.stateHi = sumHi;
        this.stateLo = sumLo;
        // Output function: XSH-RR. Take xorshift of high 32, then rotate.
        const xorshifted = (((oldLo >>> 18) ^ oldLo) >>> 27 ^ ((oldHi << (32 - 18)) >>> 0)) >>> 0;
        const rot = oldHi >>> 27;
        const result = ((xorshifted >>> rot) | ((xorshifted << ((-rot) & 31)) >>> 0)) >>> 0;
        return result;
    }
    /** Returns a float in [0, 1). */
    float() {
        return this.next() / 0x100000000;
    }
    /** Returns a float in [lo, hi). */
    range(lo, hi) {
        return lo + (hi - lo) * this.float();
    }
    /** Returns an int in [lo, hi). */
    int(lo, hi) {
        return (lo + Math.floor(this.float() * (hi - lo))) | 0;
    }
}

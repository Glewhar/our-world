/**
 * Seeded PCG32 — the only sanctioned source of randomness in the sim layer.
 *
 * Per C6 (determinism contract), `Math.random` is banned in web/src/sim/** by
 * the `custom/no-nondeterminism` ESLint rule. Use this PRNG instead.
 *
 * PCG is a well-tested, fast, statistically strong family of RNGs by Melissa
 * O'Neill. Reference: https://www.pcg-random.org/
 *
 * We use 32-bit output with a 64-bit state. State is held as two unsigned-ish
 * 32-bit halves (JS numbers) and advanced via BigInt arithmetic to keep the
 * algorithm bit-exact across platforms — JS's 53-bit float precision would
 * otherwise lose bits during the 64-bit multiply.
 */
const MULTIPLIER = 6364136223846793005n;
const INCREMENT_BASE = 1442695040888963407n;
const MASK_64 = 0xffffffffffffffffn;
const MASK_32 = 0xffffffffn;
export class Pcg32 {
    state;
    inc;
    constructor(seed, stream = 0n) {
        // The increment must be odd; bit 0 is forced to 1 per PCG spec.
        this.inc = ((stream << 1n) | 1n) & MASK_64;
        this.state = 0n;
        this.next32(); // advance once to mix in the seed
        this.state = (this.state + ((seed ^ INCREMENT_BASE) & MASK_64)) & MASK_64;
        this.next32();
    }
    /** Advance state by one step and return a 32-bit unsigned integer. */
    next32() {
        const oldState = this.state;
        this.state = (oldState * MULTIPLIER + this.inc) & MASK_64;
        // XSH-RR: xor-shift then random rotation
        const xorshifted = Number(((oldState >> 18n) ^ oldState) >> 27n) & 0xffffffff;
        const rot = Number(oldState >> 59n) & 31;
        const result = ((xorshifted >>> rot) | (xorshifted << (-rot & 31))) >>> 0;
        return result;
    }
    /** Float in [0, 1) with 32 bits of randomness. */
    nextFloat() {
        return this.next32() / 0x1_0000_0000;
    }
    /** Integer in [0, max). max must be in [1, 2^32]. */
    nextInt(max) {
        if (max <= 0 || max > 0x1_0000_0000) {
            throw new RangeError(`Pcg32.nextInt: max out of range: ${max}`);
        }
        // Rejection sampling to avoid modulo bias for small max values.
        const threshold = (0x1_0000_0000 - max) % max;
        for (;;) {
            const r = this.next32();
            if (r >= threshold)
                return r % max;
        }
    }
    /** Snapshot current state for save/load. */
    serialize() {
        return { state: this.state.toString(16), inc: this.inc.toString(16) };
    }
    /** Restore state from a serialized form. */
    static deserialize(snapshot) {
        const r = Object.create(Pcg32.prototype);
        Object.defineProperty(r, 'inc', {
            value: BigInt('0x' + snapshot.inc) & MASK_64,
            writable: false,
            enumerable: true,
        });
        r.state = BigInt('0x' + snapshot.state) & MASK_64;
        return r;
    }
}
const STREAM_INDEX = Object.freeze({
    field: 0n,
    entity_ai: 1n,
    event_spawner: 2n,
    role_mutation: 3n,
});
/** Construct the four streams from a single root seed. */
export function buildPrngStreams(rootSeed) {
    return {
        field: new Pcg32(rootSeed, STREAM_INDEX.field),
        entity_ai: new Pcg32(rootSeed, STREAM_INDEX.entity_ai),
        event_spawner: new Pcg32(rootSeed, STREAM_INDEX.event_spawner),
        role_mutation: new Pcg32(rootSeed, STREAM_INDEX.role_mutation),
    };
}
// Suppress unused-export hint for MASK_32 helper if it gets removed in tree-shake.
void MASK_32;

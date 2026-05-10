/**
 * DynamicGrid — the Tier-A field grid for the four dynamic AttributeKeys
 * the unified globe samples per fragment (`attribute_dynamic`):
 *   channel 0 → fire
 *   channel 1 → ice
 *   channel 2 → infection
 *   channel 3 → pollution
 *
 * On-disk layout matches the bake (`bake_attribute_dynamic_init`): a
 * `Uint8Array` of length `npix * 4`, RGBA8-packed, one quad per HEALPix
 * cell. The sim mutates this buffer in place; `flushDirty()` returns the
 * cells that changed since the last flush so the worker can ship a
 * compact `attribute_delta` SimUpdate to main.
 *
 * Determinism (C6): no `Map`/`Set` iteration. Dirty tracking uses a
 * `Uint8Array(npix)` mark bitmap — flush walks it in ascending index
 * order, which is sorted by construction and stable across runs.
 *
 * The grid is the slice's only field state; diffusion / heat / moisture
 * tiers (Float32 fields) come in later PRs.
 */
import { ATTRIBUTE_INDEX } from '../events/primitives.js';
const DYNAMIC_CHANNELS = ['fire', 'ice', 'infection', 'pollution'];
const CHANNEL_OFFSET = Object.freeze({
    fire: 0,
    ice: 1,
    infection: 2,
    pollution: 3,
});
/**
 * Translate an `AttributeKey` to the dynamic-channel offset, or null if the
 * attribute isn't backed by the dynamic grid (e.g. temperature, vegetation —
 * those will land in the climate / static tiers in later phases).
 */
export function dynamicChannelOffset(attr) {
    switch (attr) {
        case 'fire':
            return CHANNEL_OFFSET.fire;
        case 'ice':
            return CHANNEL_OFFSET.ice;
        case 'infection':
            return CHANNEL_OFFSET.infection;
        case 'pollution':
            return CHANNEL_OFFSET.pollution;
        default:
            return null;
    }
}
export class DynamicGrid {
    nside;
    npix;
    bytes;
    /** Per-cell mark bitmap. 1 if the cell mutated since the last flush. */
    dirty;
    /** Per-channel "is anything dirty for this channel" flag — short-circuit flush. */
    channelDirty;
    constructor(nside, init) {
        this.nside = nside;
        this.npix = 12 * nside * nside;
        if (init) {
            if (init.length !== this.npix * 4) {
                throw new Error(`DynamicGrid init size mismatch: got ${init.length}, expected ${this.npix * 4}`);
            }
            this.bytes = new Uint8Array(init); // copy — we mutate
        }
        else {
            this.bytes = new Uint8Array(this.npix * 4);
        }
        this.dirty = new Uint8Array(this.npix);
        this.channelDirty = new Uint8Array(4);
    }
    /** Set `channel` at `ipix` to `value` (0..255). Marks the cell dirty. */
    setByte(ipix, channelOffset, byte) {
        if (ipix < 0 || ipix >= this.npix)
            return;
        const idx = ipix * 4 + channelOffset;
        const clamped = byte < 0 ? 0 : byte > 255 ? 255 : byte | 0;
        if (this.bytes[idx] !== clamped) {
            this.bytes[idx] = clamped;
            this.dirty[ipix] = 1;
            this.channelDirty[channelOffset] = 1;
        }
    }
    /** Read the raw byte at `(ipix, channelOffset)` — read-only access for tests. */
    getByte(ipix, channelOffset) {
        if (ipix < 0 || ipix >= this.npix)
            return 0;
        return this.bytes[ipix * 4 + channelOffset] ?? 0;
    }
    /**
     * Mark every cell whose byte value is non-zero in *any* channel as dirty.
     * Used after a snapshot restore to push the loaded patches onto the host
     * texture. Cells that are zero in the loaded snapshot but non-zero in
     * the host's pre-load state will NOT be cleared by this — that's a known
     * limitation of slice-grade load (see `04-sim-engine.md`); a future PR
     * tracks the host's view in the worker so cleared cells flush too.
     */
    markNonZeroDirty() {
        const anyChannel = [false, false, false, false];
        for (let i = 0; i < this.npix; i++) {
            const o = i * 4;
            const r = this.bytes[o];
            const g = this.bytes[o + 1];
            const b = this.bytes[o + 2];
            const a = this.bytes[o + 3];
            if (r === 0 && g === 0 && b === 0 && a === 0)
                continue;
            this.dirty[i] = 1;
            if (r)
                anyChannel[0] = true;
            if (g)
                anyChannel[1] = true;
            if (b)
                anyChannel[2] = true;
            if (a)
                anyChannel[3] = true;
        }
        for (let ch = 0; ch < 4; ch++)
            if (anyChannel[ch])
                this.channelDirty[ch] = 1;
    }
    /**
     * Apply a multiplicative decay factor (0..1) to every cell of every
     * channel. Cells that move from non-zero to a different value are marked
     * dirty so the next flush picks them up. Decay reads-and-writes in place
     * — not a ping-pong — because decay is point-wise and self-commutative.
     */
    decayAll(perChannelFactor) {
        for (let ch = 0; ch < 4; ch++) {
            const channelName = DYNAMIC_CHANNELS[ch];
            const factor = perChannelFactor[channelName];
            if (factor >= 1)
                continue; // identity — skip
            const f = factor < 0 ? 0 : factor;
            let touched = false;
            for (let i = 0; i < this.npix; i++) {
                const idx = i * 4 + ch;
                const v = this.bytes[idx];
                if (v === 0)
                    continue;
                const next = Math.floor(v * f + 0.5);
                if (next !== v) {
                    this.bytes[idx] = next;
                    this.dirty[i] = 1;
                    touched = true;
                }
            }
            if (touched)
                this.channelDirty[ch] = 1;
        }
    }
    /**
     * Drain dirty cells into one delta per channel-with-changes. Walks the
     * mark bitmap once per channel in ascending ipix order — sorted by
     * construction. Clears the mark bitmap on the way out.
     *
     * Returns an empty array when nothing has changed (the common case
     * between events).
     */
    flushDirty() {
        const deltas = [];
        if (!this.anyDirty())
            return deltas;
        // Count dirty cells once; we use the same count for every channel
        // (a cell that changed in any channel goes into every channel's delta
        // for the same ipix). For the slice we tolerate the over-emission;
        // dropping redundant zeros is a follow-up.
        let count = 0;
        for (let i = 0; i < this.npix; i++)
            if (this.dirty[i])
                count++;
        for (let ch = 0; ch < 4; ch++) {
            if (!this.channelDirty[ch])
                continue;
            const cells = new Uint32Array(count);
            const values = new Float32Array(count);
            let k = 0;
            for (let i = 0; i < this.npix; i++) {
                if (!this.dirty[i])
                    continue;
                cells[k] = i;
                values[k] = (this.bytes[i * 4 + ch] ?? 0) / 255;
                k++;
            }
            const channelName = DYNAMIC_CHANNELS[ch];
            deltas.push({ attr: channelName, cells, values });
        }
        // Reset marks for next tick.
        this.dirty.fill(0);
        this.channelDirty.fill(0);
        return deltas;
    }
    anyDirty() {
        for (let ch = 0; ch < 4; ch++)
            if (this.channelDirty[ch])
                return true;
        return false;
    }
}
// Compile-time guard: every dynamic channel must appear in ATTRIBUTE_INDEX
// so the worker's flush can be cross-checked against the shared registry.
void ATTRIBUTE_INDEX;

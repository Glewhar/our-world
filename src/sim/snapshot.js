/**
 * Deterministic snapshot — `Scheduler` ↔ JSON-encoded blob.
 *
 * Round-trip target (per C6): `serialize → deserialize → serialize` is
 * byte-identical. The acceptance test in `04-sim-engine.md` is a 1000+
 * tick replay match, which only holds if the snapshot reconstructs every
 * bit of mutable state — tick counter, four PRNG states, the dynamic
 * field bytes, and the pending event queue. Anything else (constants,
 * config, decay rates) lives in the `SchedulerInit` and is re-supplied
 * by the host at restore time.
 *
 * Why JSON-with-base64 over MessagePack: we have one ArrayBuffer and a
 * handful of scalars. MessagePack would buy us nothing and add a
 * dependency. The plan-doc note about MessagePack is aspirational and
 * applies to multi-MB entity arrays; for the slice this stays plain.
 */
import { Pcg32 } from './prng.js';
import { Scheduler } from './worker/scheduler.js';
import { DynamicGrid } from './fields/grid.js';
import { makeConeContext } from './fields/cone.js';
import { DEFAULT_DECAY } from './fields/diffusion.js';
const SNAPSHOT_VERSION = 1;
export function serializeScheduler(s) {
    const prng = {
        field: s.prng.field.serialize(),
        entity_ai: s.prng.entity_ai.serialize(),
        event_spawner: s.prng.event_spawner.serialize(),
        role_mutation: s.prng.role_mutation.serialize(),
    };
    return {
        version: SNAPSHOT_VERSION,
        nside: s.nside,
        ordering: s.ordering,
        rootSeed: s.rootSeed.toString(16),
        tick: s.tick,
        worldTick: s.worldTick,
        fieldAccumMs: s.fieldAccumMs,
        worldAccumMs: s.worldAccumMs,
        speed: s.speed,
        prng,
        fieldBytesB64: bytesToBase64(s.grid.bytes),
        pendingEvents: s.pendingEvents.map(serializeEvent),
    };
}
/** Build a fresh `Scheduler` from a snapshot. `decay` is host-supplied (it's config, not state). */
export function deserializeScheduler(snap, decay = DEFAULT_DECAY) {
    if (snap.version !== SNAPSHOT_VERSION) {
        throw new Error(`snapshot version mismatch: got ${snap.version}, expected ${SNAPSHOT_VERSION}`);
    }
    const grid = new DynamicGrid(snap.nside, base64ToBytes(snap.fieldBytesB64));
    const s = Object.create(Scheduler.prototype);
    // Hand-reconstruct readonly fields without re-running the constructor —
    // we want to plug the deserialised PRNGs and grid in verbatim.
    Object.defineProperty(s, 'nside', { value: snap.nside, enumerable: true });
    Object.defineProperty(s, 'ordering', { value: snap.ordering, enumerable: true });
    Object.defineProperty(s, 'rootSeed', {
        value: BigInt('0x' + snap.rootSeed),
        enumerable: true,
    });
    Object.defineProperty(s, 'grid', { value: grid, enumerable: true });
    Object.defineProperty(s, 'cone', {
        value: makeConeContext(snap.nside, snap.ordering),
        enumerable: true,
    });
    Object.defineProperty(s, 'prng', {
        value: {
            field: Pcg32.deserialize(snap.prng.field),
            entity_ai: Pcg32.deserialize(snap.prng.entity_ai),
            event_spawner: Pcg32.deserialize(snap.prng.event_spawner),
            role_mutation: Pcg32.deserialize(snap.prng.role_mutation),
        },
        enumerable: true,
    });
    Object.defineProperty(s, 'decay', {
        value: decay,
        enumerable: false,
    });
    s.tick = snap.tick;
    s.worldTick = snap.worldTick;
    s.fieldAccumMs = snap.fieldAccumMs;
    s.worldAccumMs = snap.worldAccumMs;
    s.speed = snap.speed;
    s.pendingEvents = snap.pendingEvents.map(deserializeEvent);
    return s;
}
function serializeEvent(e) {
    if (e.location.kind === 'cells') {
        return {
            kind: 'cells',
            primitive: e.primitive,
            params: e.params,
            cells: Array.from(e.location.cells),
        };
    }
    return { kind: 'plain', event: e };
}
function deserializeEvent(s) {
    if (s.kind === 'cells') {
        return {
            primitive: s.primitive,
            location: { kind: 'cells', cells: Uint32Array.from(s.cells) },
            params: s.params,
        };
    }
    return s.event;
}
function bytesToBase64(bytes) {
    // Worker context exposes `btoa` — but it runs on a binary string, which
    // is unsafe for arbitrary bytes (each byte must be < 256, fine here).
    let bin = '';
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
        const slice = bytes.subarray(i, Math.min(i + CHUNK, bytes.length));
        bin += String.fromCharCode(...slice);
    }
    return btoa(bin);
}
function base64ToBytes(b64) {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++)
        out[i] = bin.charCodeAt(i);
    return out;
}

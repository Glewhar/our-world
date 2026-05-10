/**
 * Snapshot bit-identity (C6).
 *
 * After running a sequence of ticks + events, serializing and
 * deserializing the scheduler must reconstruct every byte of state.
 * Tested by re-serializing the restored scheduler and comparing the
 * second snapshot to the first — they must be deep-equal.
 */

import { describe, it, expect } from 'vitest';

import { Scheduler } from '../worker/scheduler.js';
import { serializeScheduler, deserializeScheduler } from '../snapshot.js';
import { ATTRIBUTE_INDEX } from '../events/primitives.js';
import type { WorldEvent } from '../events/primitives.js';

const NSIDE = 32;

function fireAt(lat: number, lon: number, radius_km: number, value: number): WorldEvent {
  return {
    primitive: 'set_attribute',
    location: { kind: 'point', lat, lon, radius_km },
    params: { value, attribute_index: ATTRIBUTE_INDEX.fire },
  };
}

describe('snapshot round-trip', () => {
  it('serialize → deserialize → serialize is byte-identical', () => {
    const a = new Scheduler({ nside: NSIDE, ordering: 'ring', rootSeed: 42n });
    a.injectEvent(fireAt(0, 0, 1200, 1));
    a.injectEvent(fireAt(20, 50, 800, 0.5));
    for (let i = 0; i < 73; i++) a.advance(50);

    const snap1 = serializeScheduler(a);
    const b = deserializeScheduler(snap1);
    const snap2 = serializeScheduler(b);

    expect(snap2).toEqual(snap1);
  });

  it('restored scheduler advances identically to the original', () => {
    const a = new Scheduler({ nside: NSIDE, ordering: 'ring', rootSeed: 7n });
    a.injectEvent(fireAt(0, 0, 1500, 1));
    for (let i = 0; i < 50; i++) a.advance(50);

    const snap = serializeScheduler(a);
    const b = deserializeScheduler(snap);

    // Run both forward another 100 ticks; final state must match.
    for (let i = 0; i < 100; i++) {
      a.advance(50);
      b.advance(50);
    }

    expect(b.tick).toBe(a.tick);
    expect(b.grid.bytes.length).toBe(a.grid.bytes.length);
    for (let i = 0; i < a.grid.bytes.length; i++) {
      expect(b.grid.bytes[i]).toBe(a.grid.bytes[i]);
    }
  });
});

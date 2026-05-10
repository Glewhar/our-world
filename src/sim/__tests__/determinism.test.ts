/**
 * Determinism (C6) — two `Scheduler`s built from the same seed and fed
 * the same commands in the same order must produce bit-identical state
 * tick-for-tick.
 *
 * Mirrors the acceptance test in `04-sim-engine.md` at slice scale
 * (smaller `nside` and fewer ticks because vitest budgets are tight,
 * but the contract is identical: determinism over 2× tick budget,
 * with a snapshot/restore cut in the middle).
 */

import { describe, it, expect } from 'vitest';

import { Scheduler } from '../worker/scheduler.js';
import { serializeScheduler, deserializeScheduler } from '../snapshot.js';
import { ATTRIBUTE_INDEX } from '../events/primitives.js';
import type { WorldEvent } from '../events/primitives.js';

const NSIDE = 16; // npix=3072 keeps the 2000-tick run under ~500 ms

function fireAt(lat: number, lon: number, radius_km: number, value: number): WorldEvent {
  return {
    primitive: 'set_attribute',
    location: { kind: 'point', lat, lon, radius_km },
    params: { value, attribute_index: ATTRIBUTE_INDEX.fire },
  };
}

const EVENTS: ReadonlyArray<{ atTick: number; event: WorldEvent }> = [
  { atTick: 0, event: fireAt(0, 0, 1500, 1.0) },
  { atTick: 50, event: fireAt(30, 60, 1200, 0.8) },
  { atTick: 200, event: fireAt(-15, -120, 2000, 0.6) },
  { atTick: 400, event: fireAt(45, 90, 800, 1.0) },
];

function runForTicks(s: Scheduler, totalTicks: number): void {
  for (let n = 0; n < totalTicks; n++) {
    for (const { atTick, event } of EVENTS) {
      if (atTick === n) s.injectEvent(event);
    }
    s.advance(50);
  }
}

describe('Scheduler determinism', () => {
  it('two fresh schedulers from the same seed match tick-for-tick over 2000 ticks', () => {
    const a = new Scheduler({ nside: NSIDE, ordering: 'ring', rootSeed: 1234n });
    const b = new Scheduler({ nside: NSIDE, ordering: 'ring', rootSeed: 1234n });
    runForTicks(a, 2000);
    runForTicks(b, 2000);
    expect(a.tick).toBe(b.tick);
    for (let i = 0; i < a.grid.bytes.length; i++) {
      expect(a.grid.bytes[i]).toBe(b.grid.bytes[i]);
    }
  });

  it('snapshot at tick 1000 → restore → run 1000 more matches a fresh 2000-tick run', () => {
    const baseline = new Scheduler({ nside: NSIDE, ordering: 'ring', rootSeed: 9n });
    runForTicks(baseline, 2000);

    const split = new Scheduler({ nside: NSIDE, ordering: 'ring', rootSeed: 9n });
    runForTicks(split, 1000);
    const snap = serializeScheduler(split);
    const restored = deserializeScheduler(snap);

    // The split-scheduler at tick 1000 should match the baseline at tick 1000.
    // Verify by serialising baseline at the equivalent point.
    const baselineMidway = new Scheduler({ nside: NSIDE, ordering: 'ring', rootSeed: 9n });
    runForTicks(baselineMidway, 1000);
    const snapMidway = serializeScheduler(baselineMidway);
    expect(snap).toEqual(snapMidway);

    // Continue the restored scheduler forward; it must catch up to baseline.
    // Note: the EVENTS list above is keyed off "tick number" *of the receiver*,
    // so for the restored scheduler the post-restore window starts at tick 1001
    // — but every event in EVENTS has atTick ≤ 400, so it gets nothing. That
    // matches the baseline's tick-1001..2000 window which also gets nothing.
    for (let n = 1000; n < 2000; n++) {
      restored.advance(50);
    }
    expect(restored.tick).toBe(baseline.tick);
    for (let i = 0; i < baseline.grid.bytes.length; i++) {
      expect(restored.grid.bytes[i]).toBe(baseline.grid.bytes[i]);
    }
  });
});

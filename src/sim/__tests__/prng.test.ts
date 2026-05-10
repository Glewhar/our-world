import { describe, it, expect } from 'vitest';
import { Pcg32, buildPrngStreams } from '../prng.js';

describe('Pcg32', () => {
  it('produces a deterministic sequence from a fixed seed', () => {
    const a = new Pcg32(42n);
    const b = new Pcg32(42n);
    for (let i = 0; i < 1000; i++) {
      expect(a.next32()).toBe(b.next32());
    }
  });

  it('produces different sequences for different seeds', () => {
    const a = new Pcg32(42n);
    const b = new Pcg32(43n);
    let mismatchCount = 0;
    for (let i = 0; i < 100; i++) {
      if (a.next32() !== b.next32()) mismatchCount++;
    }
    // Should be near-100% mismatch — anything < 80 is statistically suspicious.
    expect(mismatchCount).toBeGreaterThan(80);
  });

  it('produces independent streams from the same root seed', () => {
    const streams = buildPrngStreams(42n);
    const fieldOut: number[] = [];
    const entityOut: number[] = [];
    for (let i = 0; i < 100; i++) {
      fieldOut.push(streams.field.next32());
      entityOut.push(streams.entity_ai.next32());
    }
    let mismatchCount = 0;
    for (let i = 0; i < 100; i++) {
      if (fieldOut[i] !== entityOut[i]) mismatchCount++;
    }
    expect(mismatchCount).toBeGreaterThan(80);
  });

  it('serializes and deserializes to bit-identical state (C6)', () => {
    const a = new Pcg32(42n);
    for (let i = 0; i < 137; i++) a.next32();
    const snapshot = a.serialize();
    const b = Pcg32.deserialize(snapshot);
    for (let i = 0; i < 1000; i++) {
      expect(b.next32()).toBe(a.next32());
    }
  });

  it('nextFloat stays in [0, 1)', () => {
    const r = new Pcg32(1n);
    for (let i = 0; i < 10000; i++) {
      const f = r.nextFloat();
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
    }
  });

  it('nextInt(n) stays in [0, n)', () => {
    const r = new Pcg32(7n);
    const counts = new Array(10).fill(0);
    for (let i = 0; i < 10000; i++) {
      const v = r.nextInt(10);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(10);
      counts[v]++;
    }
    // Each bucket should be roughly 1000±200. Loose bound — this is a smoke test.
    for (const c of counts) {
      expect(c).toBeGreaterThan(700);
      expect(c).toBeLessThan(1300);
    }
  });
});

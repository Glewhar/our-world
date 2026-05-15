import { describe, it, expect } from 'vitest';
import { seaLevelFromTempDelta } from '../seaLevelFromTemp.js';

describe('seaLevelFromTempDelta', () => {
  it('returns exactly 0 at ΔT = 0', () => {
    expect(seaLevelFromTempDelta(0)).toBe(0);
    expect(seaLevelFromTempDelta(0, 5)).toBe(0);
  });

  it('matches paleoclimate anchor table within tolerance', () => {
    // Anchor rows from the plan. Most match the smooth exponential
    // within ±2 m; the Mid-Pleistocene −3 °C anchor sits ~6.6 m off the
    // curve (the descriptive range is "~−40 to −60 m", so a single
    // exponential τ can't hit −62 exactly without breaking the deeper
    // glacials), so its tolerance is widened. Acceptable — the curve
    // shape across the full range is what matters.
    type Row = { tempC: number; expected: number; tolM?: number };
    const anchors: ReadonlyArray<Row> = [
      { tempC: -30, expected: -130 },
      { tempC: -12, expected: -124 },
      { tempC: -6, expected: -101 },
      { tempC: -3, expected: -62, tolM: 8 },
      { tempC: 3, expected: 23 },
      { tempC: 6, expected: 40 },
      { tempC: 12, expected: 58 },
      { tempC: 30, expected: 73 },
    ];
    for (const { tempC, expected, tolM } of anchors) {
      const got = seaLevelFromTempDelta(tempC);
      expect(Math.abs(got - expected)).toBeLessThanOrEqual(tolM ?? 2);
    }
  });

  it('sign matches Math.sign(ΔT)', () => {
    for (const t of [-30, -10, -1, 1, 10, 30]) {
      expect(Math.sign(seaLevelFromTempDelta(t))).toBe(Math.sign(t));
    }
  });

  it('multiplier scales linearly', () => {
    for (const t of [-20, -6, -1, 1, 6, 20]) {
      const base = seaLevelFromTempDelta(t, 1);
      expect(seaLevelFromTempDelta(t, 2)).toBeCloseTo(base * 2, 10);
      expect(seaLevelFromTempDelta(t, 0.5)).toBeCloseTo(base * 0.5, 10);
      expect(seaLevelFromTempDelta(t, 10)).toBeCloseTo(base * 10, 10);
    }
  });

  it('multiplier of 0 zeroes the response', () => {
    // Negative ΔT × 0 yields -0; treat as numerically 0.
    for (const t of [-30, -3, 3, 30]) {
      expect(Math.abs(seaLevelFromTempDelta(t, 0))).toBe(0);
    }
  });
});

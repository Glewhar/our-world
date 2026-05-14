/**
 * Composes the per-ecoregion colour palette from three knobs the user
 * can tune in Tweakpane:
 *
 *   - `biomePalette[16]`  — 14 hand-picked biome colours (+ slot 0
 *                           fallback + slot 15 synthetic ice for the
 *                           climate-scenario override path; the eco
 *                           palette ignores slot 15). Already exists in
 *                           defaults.ts.
 *   - `realmTint[8]`      — 8 HSV deltas, one per realm. Defaults are
 *                           neutral (no tint) so existing visuals match
 *                           the legacy 14-biome look out of the box.
 *   - `ecoregionJitter`   — 0..1 strength of a deterministic per-
 *                           ecoregion HSV wobble seeded from the dense
 *                           index. Drives the within-realm-and-biome
 *                           variety that splits Amazon from Atlantic
 *                           Forest, Sahara from Arabian, etc.
 *
 * The composer runs CPU-side every time any of those knobs change. The
 * cost is N entries × ~1 µs ≈ 1 ms for N = 825 — cheap enough to redo
 * on every Tweakpane callback. Output bytes get uploaded to a 1D
 * RGBA8 `DataTexture` of width N+1 the BiomeColorEquirect blur stage
 * indexes via `texelFetch`.
 *
 * Why HSV: hue captures the biome family (greens, yellows, blues),
 * saturation captures realm bias, value (brightness) captures realm
 * altitude/exposure. Working in HSV keeps the warm low-poly character
 * intact when realms slide; mixing in RGB would muddy the colours.
 */

export type RealmTint = {
  /** Hue offset in degrees; clamped to ±60 in practice via the slider range. */
  dHue: number;
  /** Saturation multiplier; 1.0 = neutral. Slider range typically 0.7..1.3. */
  satMult: number;
  /** Value (brightness) multiplier; 1.0 = neutral. Slider range typically 0.7..1.3. */
  valMult: number;
};

export type EcoregionPaletteInputs = {
  /** Length 16. Slot 0 = no-data fallback, 1..14 = biome colours, 15 = override-only ice (sRGB hex). */
  biomePalette: readonly string[];
  /** Length 9. Slot 0 = sentinel (unused), 1..8 = per-realm tint. */
  realmTint: readonly RealmTint[];
  /** Strength of the per-ecoregion deterministic HSV wobble. 0 = none, 1 = full. */
  ecoregionJitter: number;
  /** Per-ecoregion biome lookup (`lookup.biome[idx]`, length N+1). */
  biomeOf: Uint8Array;
  /** Per-ecoregion realm lookup (`lookup.realm[idx]`, length N+1). */
  realmOf: Uint8Array;
};

/** Bounds on the per-ecoregion HSV wobble at jitter = 1. Keeps neighbours readable. */
const JITTER_MAX_DHUE = 8.0; // degrees
const JITTER_MAX_DSAT = 0.10;
const JITTER_MAX_DVAL = 0.10;

/**
 * Build the (count + 1) × 4-byte RGBA8 palette indexed by dense
 * ecoregion index. Slot 0 is the sentinel (the biome-palette fallback);
 * slots 1..count are derived from the biome × realm × jitter formula.
 */
export function buildEcoregionPalette(inp: EcoregionPaletteInputs): Uint8Array {
  const count = inp.biomeOf.length - 1;
  const out = new Uint8Array((count + 1) * 4);

  // Slot 0 — pure no-data fallback. The land mesh discards these cells
  // anyway (sea-level discard), but we paint slot 0 so the shader can't
  // read garbage if it ever does sample them.
  const fallback = parseHexRgb(inp.biomePalette[0] ?? '#000000');
  out[0] = fallback.r;
  out[1] = fallback.g;
  out[2] = fallback.b;
  out[3] = 255;

  for (let i = 1; i <= count; i++) {
    const biome = inp.biomeOf[i] ?? 0;
    const realm = inp.realmOf[i] ?? 0;
    const baseHex = inp.biomePalette[biome] ?? inp.biomePalette[0] ?? '#000000';
    const base = parseHexRgb(baseHex);
    const hsv = rgbToHsv(base.r, base.g, base.b);

    const tint = inp.realmTint[realm];
    if (tint) {
      hsv.h = wrap360(hsv.h + tint.dHue);
      hsv.s = clamp01(hsv.s * tint.satMult);
      hsv.v = clamp01(hsv.v * tint.valMult);
    }

    if (inp.ecoregionJitter > 0) {
      const j = inp.ecoregionJitter;
      const seed = hash32(i);
      // Three independent uniform-ish offsets in [-1, 1] from the same hash.
      const dh = (((seed & 0xff) / 127.5) - 1) * JITTER_MAX_DHUE * j;
      const ds = ((((seed >> 8) & 0xff) / 127.5) - 1) * JITTER_MAX_DSAT * j;
      const dv = ((((seed >> 16) & 0xff) / 127.5) - 1) * JITTER_MAX_DVAL * j;
      hsv.h = wrap360(hsv.h + dh);
      hsv.s = clamp01(hsv.s + ds);
      hsv.v = clamp01(hsv.v + dv);
    }

    const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
    const off = i * 4;
    out[off + 0] = rgb.r;
    out[off + 1] = rgb.g;
    out[off + 2] = rgb.b;
    out[off + 3] = 255;
  }
  return out;
}

/** Default per-realm tint table. Length 9 (slot 0 unused, 1..8 = realms). */
export function defaultRealmTints(): RealmTint[] {
  const neutral: RealmTint = { dHue: 0, satMult: 1.0, valMult: 1.0 };
  return [neutral, neutral, neutral, neutral, neutral, neutral, neutral, neutral, neutral];
}

// ─── colour math ────────────────────────────────────────────────────────────

function parseHexRgb(hex: string): { r: number; g: number; b: number } {
  let s = hex.trim();
  if (s.startsWith('#')) s = s.slice(1);
  if (s.length === 3) {
    s = s
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const v = parseInt(s, 16);
  if (!Number.isFinite(v)) return { r: 0, g: 0, b: 0 };
  return {
    r: (v >> 16) & 0xff,
    g: (v >> 8) & 0xff,
    b: v & 0xff,
  };
}

function rgbToHsv(r8: number, g8: number, b8: number): { h: number; s: number; v: number } {
  const r = r8 / 255;
  const g = g8 / 255;
  const b = b8 / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const v = max;
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, v };
}

function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const c = v * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp < 1) {
    r = c; g = x;
  } else if (hp < 2) {
    r = x; g = c;
  } else if (hp < 3) {
    g = c; b = x;
  } else if (hp < 4) {
    g = x; b = c;
  } else if (hp < 5) {
    r = x; b = c;
  } else {
    r = c; b = x;
  }
  const m = v - c;
  return {
    r: Math.round(clamp01(r + m) * 255),
    g: Math.round(clamp01(g + m) * 255),
    b: Math.round(clamp01(b + m) * 255),
  };
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function wrap360(v: number): number {
  return ((v % 360) + 360) % 360;
}

// 32-bit integer hash (xorshift mix). Deterministic, no allocations.
function hash32(x: number): number {
  let h = (x ^ 0x9e3779b9) | 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) | 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) | 0;
  return (h ^ (h >>> 16)) >>> 0;
}

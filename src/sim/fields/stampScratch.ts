/**
 * Per-process scratch arena shared by every stamp primitive (ellipse, band,
 * future shapes). Each call to `acquireStampScratch(npix)` returns the same
 * pre-allocated `mark: Uint8Array` and `valBuf: Float32Array`, zeroed for
 * the caller. Stamps run on the main thread one-at-a-time, so a singleton
 * is safe — there is no contention.
 *
 * Why this exists: a 70-strike Nuclear War's `onStart` synchronously runs
 * `computeEllipseStamp` 70 times. Each call used to allocate two full-npix
 * scratch buffers (~50 MB at nside=1024), bursting ~3.5 GB of ephemeral
 * memory and stalling the GC. The arena collapses that to a single 50 MB
 * pair held for the process lifetime.
 *
 * Reset cost: the previous caller wrote into a sparse subset of cells
 * (those inside its bbox); we record those cells in a third scratch
 * buffer (`touched`) and zero only those, keeping reset O(touched) rather
 * than O(npix). A fresh-scratch path is provided for the rare case the
 * caller can't track touched cells (just falls back to `fill(0)`).
 */

let scratchNpix = 0;
let scratchMark: Uint8Array | null = null;
let scratchValBuf: Float32Array | null = null;
let scratchTouched: Uint32Array | null = null;
let scratchTouchedCount = 0;
let scratchInUse = false;

export type StampScratch = {
  mark: Uint8Array;
  valBuf: Float32Array;
  /**
   * Caller appends `ipix` here whenever it sets `mark[ipix] = 1`, so the
   * release step can zero only the touched entries instead of walking the
   * full buffer.
   */
  recordTouched(ipix: number): void;
  /**
   * Hand the buffers back. Zeros mark + valBuf for every recorded touched
   * cell; subsequent acquires see clean buffers.
   */
  release(): void;
};

export function acquireStampScratch(npix: number): StampScratch {
  if (scratchInUse) {
    // Re-entrant call (a stamp primitive nested inside another) — fall
    // back to fresh allocations rather than corrupt the outer caller's
    // scratch. Should never happen in practice (stamps are leaf calls).
    const mark = new Uint8Array(npix);
    const valBuf = new Float32Array(npix);
    return {
      mark,
      valBuf,
      recordTouched: () => {},
      release: () => {},
    };
  }
  if (!scratchMark || !scratchValBuf || !scratchTouched || npix > scratchNpix) {
    scratchMark = new Uint8Array(npix);
    scratchValBuf = new Float32Array(npix);
    // touched grows on demand inside recordTouched; start at a reasonable
    // floor (≈ a small ellipse stamp size) to amortise resize.
    scratchTouched = new Uint32Array(Math.max(4096, scratchTouched?.length ?? 0));
    scratchNpix = npix;
  }
  scratchInUse = true;
  scratchTouchedCount = 0;
  const mark = scratchMark;
  const valBuf = scratchValBuf;
  return {
    mark,
    valBuf,
    recordTouched(ipix: number): void {
      if (scratchTouchedCount >= scratchTouched!.length) {
        const grown = new Uint32Array(scratchTouched!.length * 2);
        grown.set(scratchTouched!);
        scratchTouched = grown;
      }
      scratchTouched![scratchTouchedCount++] = ipix;
    },
    release(): void {
      const touched = scratchTouched!;
      const count = scratchTouchedCount;
      for (let i = 0; i < count; i++) {
        const ipix = touched[i]!;
        mark[ipix] = 0;
        valBuf[ipix] = 0;
      }
      scratchTouchedCount = 0;
      scratchInUse = false;
    },
  };
}

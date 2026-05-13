/**
 * ScenarioRegistry — singleton owner of the active scenario list.
 *
 * Lifecycle:
 *   - `start(kind, payload, totalDays, durationDays, opts)` snapshots
 *     `totalDays`, builds a Scenario, runs the kind's handler `onStart`
 *     with paint capture active, and pushes it onto the active list.
 *   - `tick(totalDays)` advances every active scenario. On `progress01 >= 1`
 *     it calls `onEnd`; if `autoRepeat`, the scenario re-fires with the
 *     same payload (re-snapshotting startedAtDay), otherwise it's removed.
 *     Otherwise `onTick(progress01)` runs.
 *   - `stop(id)` immediately ends the scenario; the next recompose drops
 *     its contribution from the wasteland texture.
 *
 * Wasteland texture accounting (load-bearing):
 *   The wasteland texture is the sum, capped at 1, of every active
 *   scenario's contribution. Each scenario carries a "peak stamp"
 *   (sparse `cells[] / peakValues[]` arrays) captured once at `onStart`
 *   from the ellipse paint. Every tick the registry composes:
 *
 *     wastelandTex[cell] = min(1, Σ_active stamp[cell] × intensity(progress01))
 *
 *   The intensity function is `decayQuickThenSlow`; the exponent is
 *   tunable through Tweakpane via `tuning.decayExponent`.
 *
 *   Dirty-cell tracking: the union of cells of every active stamp plus
 *   the union of cells from any stamp that was just removed (so the
 *   texture re-zeroes those cells on the same frame).
 */

import { computeEllipseStamp } from '../../sim/fields/ellipse.js';
import type {
  EllipsePaintArgs,
  Scenario,
  ScenarioContext,
  ScenarioKind,
  ScenarioKindHandler,
  ScenarioPayload,
  ScenarioStamp,
  StartScenarioOpts,
} from './types.js';
import { decayQuickThenSlow } from './recoveryCurves.js';

let nextScenarioCounter = 1;

/**
 * Texture-side hook the registry uses to push the composed wasteland
 * field each frame. The world layer (AttributeTextures) implements this;
 * the registry knows nothing about Three.js or GPU upload.
 *
 * `dirtyCells` is the set of cells whose texture byte may have changed
 * this frame; `values` line up index-for-index, in [0, 1].
 *
 * Cells that just became zero are still included so the sink can clear
 * them — otherwise stale paint would linger after a scenario ended.
 */
export type WastelandSink = {
  applyFrame(dirtyCells: Uint32Array, values: Float32Array): void;
};

export type ScenarioRegistryDeps = {
  sink: WastelandSink;
  context: ScenarioContext;
  nside: number;
  ordering: 'ring' | 'nested';
};

type ActiveEntry = {
  scn: Scenario;
  stamp: ScenarioStamp;
};

export class ScenarioRegistry {
  private readonly handlers = new Map<ScenarioKind, ScenarioKindHandler<ScenarioKind>>();
  private readonly active: ActiveEntry[] = [];
  private readonly sink: WastelandSink;
  private readonly context: ScenarioContext;
  private readonly nside: number;
  private readonly ordering: 'ring' | 'nested';

  /** Last `totalDays` value seen by `tick` — used by recompose at start/stop. */
  private lastTotalDays = 0;

  /**
   * Cells that were part of stamps removed since the previous frame.
   * Those cells must be re-emitted (with their new sum, which may be 0)
   * so the texture clears them — otherwise the sink would never see the
   * "fully gone" value.
   */
  private retiredCells: number[] = [];

  /**
   * Tweakpane-tunable knobs. Exposed as a plain object so the debug panel
   * can bind to fields directly (no setters needed).
   */
  readonly tuning = {
    decayExponent: 2.5,
  };

  // Sized to all 12·nside² cells so reset cost stays O(touched), not O(npix).
  private readonly accBuf: Float32Array;
  private readonly markBuf: Uint8Array;
  private dirtyList: Uint32Array;
  private dirtyCount = 0;

  // Composed picture is a pure function of (active, totalDays, decayExponent).
  // `dirty` flips on active-list change; the other two are checked in recompose.
  private dirty = false;
  private lastComposedTotalDays = Number.NaN;
  private lastComposedDecayExponent = Number.NaN;

  /**
   * `paintAttributeEllipse` capture buffer — active only during `onStart`
   * so the handler's ellipse paint lands in the new scenario's stamp.
   * Outside of `onStart` paint calls fall through to the user context.
   */
  private capturingStamp: ScenarioStamp | null = null;

  constructor(deps: ScenarioRegistryDeps) {
    this.sink = deps.sink;
    this.nside = deps.nside;
    this.ordering = deps.ordering;
    const npix = 12 * deps.nside * deps.nside;
    this.accBuf = new Float32Array(npix);
    this.markBuf = new Uint8Array(npix);
    this.dirtyList = new Uint32Array(4096);
    const userCtx = deps.context;
    this.context = {
      sampleWindAt: (lat, lon) => userCtx.sampleWindAt(lat, lon),
      sampleTerrainAt: (lat, lon) => userCtx.sampleTerrainAt(lat, lon),
      detonateAt: (lat, lon, terrain) => userCtx.detonateAt(lat, lon, terrain),
      paintAttributeEllipse: (args) => this.capturePaint(args, userCtx),
    };
  }

  registerHandler<K extends ScenarioKind>(kind: K, handler: ScenarioKindHandler<K>): void {
    this.handlers.set(kind, handler as ScenarioKindHandler<ScenarioKind>);
  }

  start<K extends ScenarioKind>(
    kind: K,
    payload: ScenarioPayload[K],
    totalDays: number,
    durationDays: number,
    opts: StartScenarioOpts = {},
  ): string {
    const handler = this.handlers.get(kind);
    if (!handler) {
      throw new Error(`ScenarioRegistry: no handler registered for kind '${kind}'`);
    }
    const id = `scn_${nextScenarioCounter++}`;
    const scn: Scenario<K> = {
      id,
      kind,
      label: opts.label ?? defaultLabel(kind),
      startedAtDay: totalDays,
      durationDays,
      autoRepeat: opts.autoRepeat ?? false,
      payload,
    };

    const stamp: ScenarioStamp = { cells: new Uint32Array(0), values: new Float32Array(0) };
    this.capturingStamp = stamp;
    try {
      handler.onStart(scn, this.context);
    } finally {
      this.capturingStamp = null;
    }

    this.active.push({ scn, stamp });
    this.lastTotalDays = totalDays;
    this.dirty = true;
    this.recomposeFrame(totalDays);
    return id;
  }

  stop(id: string): void {
    const idx = this.active.findIndex((e) => e.scn.id === id);
    if (idx < 0) return;
    const entry = this.active[idx]!;
    const handler = this.handlers.get(entry.scn.kind);
    if (handler) handler.onEnd(entry.scn, this.context);
    this.retireStamp(entry.stamp);
    this.active.splice(idx, 1);
    this.dirty = true;
    this.recomposeFrame(this.lastTotalDays);
  }

  tick(totalDays: number): void {
    this.lastTotalDays = totalDays;
    if (totalDays !== this.lastComposedTotalDays) this.dirty = true;
    if (this.active.length === 0 && this.retiredCells.length === 0) {
      if (this.dirty) this.recomposeFrame(totalDays);
      return;
    }
    for (let i = this.active.length - 1; i >= 0; i--) {
      const entry = this.active[i]!;
      const elapsed = totalDays - entry.scn.startedAtDay;
      const raw = elapsed / Math.max(1e-6, entry.scn.durationDays);
      const handler = this.handlers.get(entry.scn.kind);
      if (raw >= 1) {
        if (handler) handler.onEnd(entry.scn, this.context);
        if (entry.scn.autoRepeat) {
          // Re-fire with the same payload; new stamp captured from a fresh
          // onStart so wind / position can re-sample.
          entry.scn.startedAtDay = totalDays;
          this.retireStamp(entry.stamp);
          const stamp: ScenarioStamp = {
            cells: new Uint32Array(0),
            values: new Float32Array(0),
          };
          this.capturingStamp = stamp;
          try {
            if (handler) handler.onStart(entry.scn, this.context);
          } finally {
            this.capturingStamp = null;
          }
          entry.stamp = stamp;
        } else {
          this.retireStamp(entry.stamp);
          this.active.splice(i, 1);
        }
        this.dirty = true;
      } else if (handler) {
        const progress01 = raw < 0 ? 0 : raw;
        handler.onTick(entry.scn, progress01, this.context);
      }
    }
    this.recomposeFrame(totalDays);
  }

  list(): readonly Scenario[] {
    return this.active.map((e) => e.scn);
  }

  size(): number {
    return this.active.length;
  }

  private retireStamp(stamp: ScenarioStamp): void {
    const cells = stamp.cells;
    for (let i = 0; i < cells.length; i++) this.retiredCells.push(cells[i]!);
  }

  /**
   * Compose every active stamp by `value × decay(progress01)`, cap at 1,
   * and push dirty cells + values to the sink.
   */
  private recomposeFrame(totalDays: number): void {
    if (this.tuning.decayExponent !== this.lastComposedDecayExponent) this.dirty = true;
    if (!this.dirty) return;
    for (let s = 0; s < this.active.length; s++) {
      const entry = this.active[s]!;
      const elapsed = totalDays - entry.scn.startedAtDay;
      const raw = elapsed / Math.max(1e-6, entry.scn.durationDays);
      const progress01 = raw < 0 ? 0 : raw > 1 ? 1 : raw;
      const intensity = decayQuickThenSlow(progress01, this.tuning.decayExponent);
      if (intensity <= 0) continue;
      const cells = entry.stamp.cells;
      const values = entry.stamp.values;
      for (let i = 0; i < cells.length; i++) {
        const ipix = cells[i]!;
        if (this.markBuf[ipix] === 0) {
          this.markBuf[ipix] = 1;
          this.appendDirty(ipix);
        }
        this.accBuf[ipix]! += values[i]! * intensity;
      }
    }

    // Ensure retired cells are emitted (with value 0 if no active scenario
    // covers them now) so the sink clears them.
    for (let i = 0; i < this.retiredCells.length; i++) {
      const ipix = this.retiredCells[i]!;
      if (this.markBuf[ipix] === 0) {
        this.markBuf[ipix] = 1;
        this.appendDirty(ipix);
      }
    }
    this.retiredCells.length = 0;

    if (this.dirtyCount > 0) {
      const cells = new Uint32Array(this.dirtyCount);
      const values = new Float32Array(this.dirtyCount);
      for (let i = 0; i < this.dirtyCount; i++) {
        const ipix = this.dirtyList[i]!;
        cells[i] = ipix;
        const v = this.accBuf[ipix]!;
        values[i] = v > 1 ? 1 : v;
      }
      this.sink.applyFrame(cells, values);

      for (let i = 0; i < this.dirtyCount; i++) {
        const ipix = this.dirtyList[i]!;
        this.accBuf[ipix] = 0;
        this.markBuf[ipix] = 0;
      }
      this.dirtyCount = 0;
    }

    this.dirty = false;
    this.lastComposedTotalDays = totalDays;
    this.lastComposedDecayExponent = this.tuning.decayExponent;
  }

  private appendDirty(ipix: number): void {
    if (this.dirtyCount >= this.dirtyList.length) {
      const grown = new Uint32Array(Math.max(this.dirtyList.length * 2, this.dirtyCount + 1));
      grown.set(this.dirtyList);
      this.dirtyList = grown;
    }
    this.dirtyList[this.dirtyCount++] = ipix;
  }

  private capturePaint(args: EllipsePaintArgs, userCtx: ScenarioContext): void {
    if (!this.capturingStamp) {
      userCtx.paintAttributeEllipse(args);
      return;
    }
    const result = computeEllipseStamp(args, this.nside, this.ordering);
    this.capturingStamp.cells = result.cells;
    this.capturingStamp.values = result.values;
  }
}

function defaultLabel(kind: ScenarioKind): string {
  switch (kind) {
    case 'nuclear':
      return 'Nuclear strike';
  }
}

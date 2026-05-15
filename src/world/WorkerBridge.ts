/**
 * WorkerBridge — main-thread end of the C3 message channel.
 *
 * The worker entry is `web/src/sim/worker/index.ts`; tsc compiles it
 * to `index.js` next to the source, and the browser loads that .js
 * via `new Worker(new URL('./index.js', import.meta.url), { type: 'module' })`.
 * No bundler step.
 *
 * The bridge is a thin transport: it forwards `SimCommand`s to the
 * worker via `postMessage`, and dispatches incoming `SimUpdate`s to
 * everyone who called `onUpdate(...)`. Subscribers handle the actual
 * effects (writing into `AttributeTextures`, refreshing aggregates HUD,
 * etc.) — the bridge stays effects-free so unit tests can swap in a
 * fake worker without touching texture state.
 */

import type { SimCommand, SimUpdate } from '../sim/types.js';
import type { HealpixOrdering } from './healpix.js';
import type { BandPaintArgs, EllipsePaintArgs } from './scenarios/types.js';
import type { Unsubscribe } from './types.js';
import { computeEllipseStamp } from '../sim/fields/ellipse.js';
import { computeBandStamp } from '../sim/fields/band.js';

export type StampResult = { cells: Uint32Array; values: Float32Array };

export class WorkerBridge {
  private readonly listeners = new Set<(u: SimUpdate) => void>();
  private worker: Worker | null = null;
  private readonly pendingStamps = new Map<number, (r: StampResult) => void>();
  private nextStampId = 1;

  constructor() {
    // Allow tests to construct a no-worker bridge by setting
    // `globalThis.__ED_DISABLE_SIM_WORKER = true` before construction.
    // The slice's vitest tests don't need a real worker; they exercise
    // `Scheduler` directly.
    const disable = (globalThis as { __ED_DISABLE_SIM_WORKER?: boolean }).__ED_DISABLE_SIM_WORKER;
    if (disable) return;
    if (typeof Worker === 'undefined') return;

    // Native ESM worker: the runtime URL points at the compiled .js, which
    // sits next to the .ts source thanks to `tsc`'s `outDir: src`.
    this.worker = new Worker(new URL('../sim/worker/index.js', import.meta.url), {
      type: 'module',
      name: 'earth-destroyer-sim',
    });
    this.worker.onmessage = (e: MessageEvent<SimUpdate>) => {
      this.dispatch(e.data);
    };
    this.worker.onerror = (e: ErrorEvent) => {
      console.error('[sim worker]', e.message, e.error);
    };
  }

  postCommand(cmd: SimCommand): void {
    if (!this.worker) return;
    this.worker.postMessage(cmd);
  }

  onUpdate(cb: (u: SimUpdate) => void): Unsubscribe {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  /** Internal helper. Public so tests can simulate inbound updates. */
  dispatch(update: SimUpdate): void {
    if (update.type === 'stamp_ready') {
      // Stamp replies are correlated by id and resolved into the
      // matching pending promise. Listeners don't see them — the
      // contract is one resolver per id, fire once, delete.
      const resolver = this.pendingStamps.get(update.id);
      if (resolver) {
        this.pendingStamps.delete(update.id);
        resolver({ cells: update.cells, values: update.values });
      }
      return;
    }
    for (const cb of this.listeners) cb(update);
  }

  /**
   * Request a stamp compute off the main thread. The worker runs
   * `computeEllipseStamp` / `computeBandStamp` and transfers the result
   * back; the returned Promise resolves with the cells + values pair.
   *
   * No-worker fallback (tests, browsers without Worker): runs the same
   * pure compute on the main thread synchronously and resolves on a
   * microtask. The registry's async path stays uniform either way.
   */
  requestStamp(
    kind: 'ellipse',
    args: EllipsePaintArgs,
    nside: number,
    ordering: HealpixOrdering,
  ): Promise<StampResult>;
  requestStamp(
    kind: 'band',
    args: BandPaintArgs,
    nside: number,
    ordering: HealpixOrdering,
  ): Promise<StampResult>;
  requestStamp(
    kind: 'ellipse' | 'band',
    args: EllipsePaintArgs | BandPaintArgs,
    nside: number,
    ordering: HealpixOrdering,
  ): Promise<StampResult> {
    if (!this.worker) {
      const result =
        kind === 'ellipse'
          ? computeEllipseStamp(args as EllipsePaintArgs, nside, ordering)
          : computeBandStamp(args as BandPaintArgs, nside, ordering);
      return Promise.resolve({ cells: result.cells, values: result.values });
    }
    const id = this.nextStampId++;
    return new Promise<StampResult>((resolve) => {
      this.pendingStamps.set(id, resolve);
      const cmd =
        kind === 'ellipse'
          ? ({
              type: 'compute_stamp',
              id,
              kind: 'ellipse',
              args: args as EllipsePaintArgs,
              nside,
              ordering,
            } as const)
          : ({
              type: 'compute_stamp',
              id,
              kind: 'band',
              args: args as BandPaintArgs,
              nside,
              ordering,
            } as const);
      this.worker!.postMessage(cmd);
    });
  }

  dispose(): void {
    this.listeners.clear();
    this.pendingStamps.clear();
    this.worker?.terminate();
    this.worker = null;
  }
}

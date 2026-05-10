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
import type { Unsubscribe } from './types.js';

export class WorkerBridge {
  private readonly listeners = new Set<(u: SimUpdate) => void>();
  private worker: Worker | null = null;

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
    for (const cb of this.listeners) cb(update);
  }

  dispose(): void {
    this.listeners.clear();
    this.worker?.terminate();
    this.worker = null;
  }
}

/**
 * Dual-clock scheduler — pure logic, lifted out of the worker entry so
 * tests can drive it without spinning up a real Worker.
 *
 * Field tick fires at 20 Hz (50 ms). World tick fires at 1 Hz (1000 ms);
 * the slice has nothing to do at world rate, but the accumulator is here
 * so the dispatch is wired and ready for entity AI / faction strategy.
 *
 * The scheduler doesn't read `performance.now()` (banned by C6). Instead
 * the host (worker entry, or test harness) advances the scheduler by an
 * explicit `deltaMs` each call. The worker maps RAF deltas onto this;
 * tests pass synthetic deltas.
 *
 * Speed multiplier is applied to `deltaMs` *before* the accumulator —
 * `set_speed: 4` on a 16 ms RAF tick advances the accumulator by 64 ms.
 * `set_speed: 0` pauses both clocks (events queued during pause stay
 * queued for the next non-zero tick).
 */

import { buildPrngStreams, type Pcg32, type PrngStream } from '../prng.js';
import { DynamicGrid } from '../fields/grid.js';
import { decayStep, DEFAULT_DECAY, type DecayConfig } from '../fields/diffusion.js';
import { dispatchEvent, type DispatchResult } from '../events/dispatch.js';
import { makeConeContext, type ConeContext } from '../fields/cone.js';
import type { WorldEvent } from '../events/primitives.js';
import type { HealpixOrdering } from '../../world/healpix.js';
import type { SimSpeed } from '../types.js';

export const FIELD_TICK_MS = 50; // 20 Hz
export const WORLD_TICK_MS = 1000; // 1 Hz

export type SchedulerInit = {
  nside: number;
  ordering: HealpixOrdering;
  rootSeed: bigint;
  /** Optional seed bytes for the dynamic grid. Default: zero-init. */
  dynamicInit?: Uint8Array;
  decay?: DecayConfig;
};

export type TickStats = {
  fieldTicksAdvanced: number;
  worldTicksAdvanced: number;
  eventsApplied: DispatchResult[];
};

export class Scheduler {
  readonly nside: number;
  readonly ordering: HealpixOrdering;
  readonly rootSeed: bigint;

  readonly grid: DynamicGrid;
  readonly cone: ConeContext;
  readonly prng: Record<PrngStream, Pcg32>;

  private readonly decay: DecayConfig;

  /** Field-clock accumulator in milliseconds. */
  fieldAccumMs = 0;
  /** World-clock accumulator in milliseconds. */
  worldAccumMs = 0;
  /** Discrete tick number, incremented per *field* tick. */
  tick = 0;
  /** Discrete world-tick number; increments at 1 Hz. */
  worldTick = 0;
  speed: SimSpeed = 1;

  /** Events injected by the host since the last tick boundary. */
  pendingEvents: WorldEvent[] = [];

  constructor(init: SchedulerInit) {
    this.nside = init.nside;
    this.ordering = init.ordering;
    this.rootSeed = init.rootSeed;
    this.decay = init.decay ?? DEFAULT_DECAY;
    this.grid = init.dynamicInit
      ? new DynamicGrid(init.nside, init.dynamicInit)
      : new DynamicGrid(init.nside);
    this.cone = makeConeContext(init.nside, init.ordering);
    this.prng = buildPrngStreams(init.rootSeed);
  }

  setSpeed(s: SimSpeed): void {
    this.speed = s;
  }

  injectEvent(e: WorldEvent): void {
    this.pendingEvents.push(e);
  }

  /**
   * Advance the simulation by `deltaMs` of wall-clock time scaled by
   * `speed`. Runs as many discrete field ticks as fit in the accumulator;
   * each field tick: drains the event queue into the dispatch, then runs
   * the decay kernel. World ticks fire at 1 Hz on the same boundary.
   */
  advance(deltaMs: number): TickStats {
    const stats: TickStats = {
      fieldTicksAdvanced: 0,
      worldTicksAdvanced: 0,
      eventsApplied: [],
    };

    if (this.speed === 0) {
      return stats;
    }

    const scaled = deltaMs * this.speed;
    if (!(scaled > 0)) return stats;

    this.fieldAccumMs += scaled;
    this.worldAccumMs += scaled;

    // Cap to avoid unbounded catch-up after a tab hides for a long time.
    // 1 second of catch-up = 20 field ticks; beyond that we drop ticks.
    const MAX_CATCHUP_MS = 1000;
    if (this.fieldAccumMs > MAX_CATCHUP_MS) this.fieldAccumMs = MAX_CATCHUP_MS;
    if (this.worldAccumMs > MAX_CATCHUP_MS) this.worldAccumMs = MAX_CATCHUP_MS;

    while (this.fieldAccumMs >= FIELD_TICK_MS) {
      this.fieldAccumMs -= FIELD_TICK_MS;
      this.tick++;
      stats.fieldTicksAdvanced++;

      // 1) Drain pending events FIRST so user paint shows up *before* its
      //    first decay step (otherwise a freshly-stamped 1.0 cell gets
      //    decayed once before the next render).
      if (this.pendingEvents.length > 0) {
        const queue = this.pendingEvents;
        this.pendingEvents = [];
        for (let i = 0; i < queue.length; i++) {
          const result = dispatchEvent(
            {
              grid: this.grid,
              cone: this.cone,
              nside: this.nside,
              ordering: this.ordering,
            },
            queue[i]!,
          );
          stats.eventsApplied.push(result);
        }
      }

      // 2) Decay step.
      decayStep(this.grid, this.decay);

      // 3) World tick boundary check. World ticks are conceptually
      //    independent but in the slice they land on the field boundary.
      while (this.worldAccumMs >= WORLD_TICK_MS) {
        this.worldAccumMs -= WORLD_TICK_MS;
        this.worldTick++;
        stats.worldTicksAdvanced++;
        // Slice has no world-tick body. Entity AI / faction strategy land here.
      }
    }

    return stats;
  }
}

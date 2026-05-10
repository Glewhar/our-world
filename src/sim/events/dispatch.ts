/**
 * Event dispatch — single entry point that routes a `WorldEvent` to its
 * primitive handler. The slice ships only `set_attribute`; every other
 * primitive is a recognized no-op so that injecting one logs an
 * "unimplemented primitive" warning instead of crashing.
 *
 * Handlers are pure functions over a small, typed context — no global
 * state, no side channels, no clocks. Determinism falls out of that
 * constraint: same inputs → same mutations.
 */

import type { WorldEvent, WorldEventPrimitive } from './primitives.js';
import { applySetAttribute, type SetAttributeContext } from './handlers/set_attribute.js';

/**
 * Dispatch context — the minimum every handler needs. As more handlers
 * land, they take a superset of this (e.g. `entityStore`, `rng`).
 */
export type DispatchContext = SetAttributeContext;

export type DispatchResult = {
  primitive: WorldEventPrimitive;
  /** Number of cells / entities touched. Useful for HUD + tests. */
  cellsTouched: number;
  /** True if a handler ran; false if the primitive is recognized but unimplemented. */
  handled: boolean;
};

export function dispatchEvent(ctx: DispatchContext, event: WorldEvent): DispatchResult {
  switch (event.primitive) {
    case 'set_attribute': {
      const cellsTouched = applySetAttribute(ctx, event);
      return { primitive: event.primitive, cellsTouched, handled: true };
    }
    // Recognized but unimplemented in the slice. Each lands in a future PR
    // following the same shape as `applySetAttribute`.
    case 'ignite':
    case 'douse':
    case 'freeze':
    case 'thaw':
    case 'infect':
    case 'cure':
    case 'pollute':
    case 'decay_pollutant':
    case 'raise_sea_level':
    case 'lower_sea_level':
    case 'shift_climate':
    case 'shift_albedo':
    case 'introduce_species':
    case 'extinct_species':
    case 'asteroid_strike':
    case 'spawn_sandstorm':
    case 'spawn_cyclone':
    case 'set_population':
      return { primitive: event.primitive, cellsTouched: 0, handled: false };
  }
}

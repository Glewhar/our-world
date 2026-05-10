/**
 * Contract C4 — the WorldEvent primitive vocabulary.
 *
 * This is the FIXED list of things the world can do. Roles (Stage B) compose
 * these primitives to express their abilities — they NEVER introduce new ones.
 * Adding a primitive here requires an ADR and updates to:
 *   - web/src/sim/events/handlers/<primitive>.ts (impl)
 *   - web/src/debug/sandbox/EventInjectorPanel.ts (UI)
 *   - docs/roles/_primitive_coverage.md (research)
 *
 * Per-primitive `params` schemas live as JSDoc on each handler in `handlers/`.
 */

import type { AttributeKey } from '../../world/types.js';

export type WorldEventPrimitive =
  // Combustion / freezing
  | 'ignite'
  | 'douse'
  | 'freeze'
  | 'thaw'
  // Biological
  | 'infect'
  | 'cure'
  | 'introduce_species'
  | 'extinct_species'
  // Pollution
  | 'pollute'
  | 'decay_pollutant'
  // Hydrology
  | 'raise_sea_level'
  | 'lower_sea_level'
  // Climate
  | 'shift_climate'
  | 'shift_albedo'
  // Discrete events
  | 'asteroid_strike'
  | 'spawn_sandstorm'
  | 'spawn_cyclone'
  // Generic
  | 'set_attribute'
  | 'set_population';

export type EventLocation =
  | { kind: 'point'; lat: number; lon: number; radius_km: number }
  | { kind: 'body'; bodyId: string }
  | { kind: 'cells'; cells: Uint32Array }
  | {
      kind: 'graph';
      graph: 'travel_routes' | 'ocean_currents' | 'river_network';
      seed: string;
      depth: number;
    };

export type WorldEvent = {
  primitive: WorldEventPrimitive;
  location: EventLocation;
  params: Record<string, number>;
};

/**
 * Compile-time exhaustiveness check: every primitive must have a handler.
 * Each entry's value is `true` once a handler exists; this list is grown
 * as Phase 4 fills in handlers, and the type below ensures we don't forget any.
 */
export type AllPrimitives = {
  [P in WorldEventPrimitive]: true;
};

/**
 * Helper for constructing a `set_attribute` event without param-typo bugs.
 * Call sites that pass arbitrary records get no type help — this gives them some.
 */
export function setAttributeEvent(
  attr: AttributeKey,
  value: number,
  location: EventLocation,
): WorldEvent {
  return {
    primitive: 'set_attribute',
    location,
    params: { value, attribute_index: ATTRIBUTE_INDEX[attr] },
  };
}

/**
 * Stable index for AttributeKey — pinned here so handlers + shaders + snapshots
 * agree on the integer encoding regardless of declaration order in types.ts.
 */
export const ATTRIBUTE_INDEX: Readonly<Record<AttributeKey, number>> = Object.freeze({
  temperature: 0,
  moisture: 1,
  vegetation: 2,
  fire: 3,
  ice: 4,
  infection: 5,
  pollution: 6,
  albedo: 7,
  population_density: 8,
  ocean_health: 9,
  elevation: 10,
});

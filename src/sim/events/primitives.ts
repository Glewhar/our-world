/**
 * Contract C4 — the WorldEvent primitive vocabulary.
 *
 * This is the FIXED list of things the world can do. Roles (Stage B) compose
 * these primitives to express their abilities — they NEVER introduce new ones.
 * Adding a primitive here requires an ADR and updates to:
 *   - web/src/sim/events/handlers/<primitive>.ts (impl)
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
  | 'set_attribute_ellipse'
  | 'set_population';

export type EventLocation =
  | { kind: 'point'; lat: number; lon: number; radius_km: number }
  | {
      /**
       * Downwind-elongated ellipse. `radius_km` is the cross-wind
       * half-axis, `stretch_km` the downwind half-axis (upwind tail =
       * 0.2 × stretch_km). `bearing_deg` is the wind "toward" direction
       * (0 = north, 90 = east). Distance metric is geodesic.
       */
      kind: 'ellipse';
      lat: number;
      lon: number;
      radius_km: number;
      stretch_km: number;
      bearing_deg: number;
    }
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
 * Helper for constructing a `set_attribute_ellipse` event. Wraps the
 * downwind-elongated ellipse into the shared WorldEvent shape; the
 * primitive's params are identical to `set_attribute`, only the location
 * geometry differs.
 */
export function setAttributeEllipseEvent(
  attr: AttributeKey,
  value: number,
  centreLat: number,
  centreLon: number,
  radiusKm: number,
  stretchKm: number,
  bearingDeg: number,
): WorldEvent {
  return {
    primitive: 'set_attribute_ellipse',
    location: {
      kind: 'ellipse',
      lat: centreLat,
      lon: centreLon,
      radius_km: radiusKm,
      stretch_km: stretchKm,
      bearing_deg: bearingDeg,
    },
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
  // Scenario-driven dynamic attribute. NOT backed by the dynamic grid —
  // wasteland lives in a dedicated R8 texture owned by AttributeTextures
  // and recomposed each frame by the ScenarioRegistry. Indexed here so the
  // attribute-key registry stays a single source of truth for shaders +
  // sim, even though the wasteland write path bypasses the dynamic grid.
  wasteland: 11,
});

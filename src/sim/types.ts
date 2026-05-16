/**
 * Contract C3 — Runtime ↔ Sim Engine messages.
 *
 * See also:
 *   - sim/events/primitives.ts (C4 — WorldEvent vocabulary)
 *   - world/types.ts (C2 — WorldRuntime + AttributeKey + WorldAggregates)
 */

import type { AttributeKey, TileId, TopologyChange, WorldAggregates } from '../world/types.js';
import type { HealpixOrdering } from '../world/healpix.js';
import type { BandPaintArgs, EllipsePaintArgs } from '../world/scenarios/types.js';
import type { WorldEvent } from './events/primitives.js';

// ─── Main thread → Worker ─────────────────────────────────────────────────

export type SimSpeed = 0 | 0.5 | 1 | 4 | 16;

export type SimCommand =
  | { type: 'init'; manifestUrl: string }
  | { type: 'tick'; deltaMs: number }
  | { type: 'set_speed'; multiplier: SimSpeed }
  | { type: 'snapshot_save'; tag: string }
  | { type: 'snapshot_load'; tag: string }
  | { type: 'inject_event'; event: WorldEvent }
  | { type: 'reload_balance'; yaml: string }
  | {
      type: 'compute_stamp';
      id: number;
      kind: 'ellipse' | 'band';
      args: EllipsePaintArgs | BandPaintArgs;
      nside: number;
      ordering: HealpixOrdering;
    };

// ─── Worker → Main thread ─────────────────────────────────────────────────

export type EntityEvent = {
  // Placeholder — concrete shape lives in sim/entities/store.ts and is filled in Phase 4.
  kind: string;
  entityId: number;
  payload: Record<string, unknown>;
};

export type SimUpdate =
  | {
      type: 'tick_complete';
      tick: number;
      aggregates: WorldAggregates;
      dirtyAttrs: AttributeKey[];
      dirtyTiles: TileId[];
    }
  | { type: 'attribute_delta'; attr: AttributeKey; cells: Uint32Array; values: Float32Array }
  | { type: 'topology_change'; changes: TopologyChange[] }
  | { type: 'entity_event'; event: EntityEvent }
  | { type: 'snapshot_saved'; tag: string; bytes: number }
  | { type: 'snapshot_loaded'; tag: string; tick: number }
  | { type: 'stamp_ready'; id: number; cells: Uint32Array; values: Float32Array };

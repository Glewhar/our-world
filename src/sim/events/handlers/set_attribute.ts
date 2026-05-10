/**
 * `set_attribute` — generic brush primitive (C4).
 *
 * Stamps a normalized [0, 1] value into one dynamic-grid channel for
 * every cell the location covers. The slice supports `kind: 'point'` and
 * `kind: 'cells'`; `body` and `graph` locations land later (`body` needs
 * the id raster handed to the worker, `graph` needs the graph artifacts).
 *
 * Params (per `setAttributeEvent` in `events/primitives.ts`):
 *   - `value`           — float, 0..1, written to the channel byte as `round(value*255)`.
 *   - `attribute_index` — integer in `ATTRIBUTE_INDEX`, identifies the channel.
 *
 * Validation is shallow on purpose: malformed events get logged + dropped
 * by `dispatch.ts`. JSDoc here documents the schema for the future
 * runtime validator.
 */

import type { WorldEvent } from '../primitives.js';
import { ATTRIBUTE_INDEX } from '../primitives.js';
import type { AttributeKey } from '../../../world/types.js';
import type { DynamicGrid } from '../../fields/grid.js';
import { dynamicChannelOffset } from '../../fields/grid.js';
import { coneSearchPix, type ConeContext } from '../../fields/cone.js';

export type SetAttributeContext = {
  grid: DynamicGrid;
  cone: ConeContext;
};

/**
 * Apply a `set_attribute` event to the dynamic grid. Returns the number of
 * cells touched so the caller can log / surface a count.
 */
export function applySetAttribute(ctx: SetAttributeContext, event: WorldEvent): number {
  if (event.primitive !== 'set_attribute') return 0;

  const value = event.params['value'];
  const attrIndex = event.params['attribute_index'];
  if (typeof value !== 'number' || typeof attrIndex !== 'number') return 0;

  const attr = attributeKeyFromIndex(attrIndex);
  if (!attr) return 0;
  const channel = dynamicChannelOffset(attr);
  if (channel === null) {
    // Static / climate channel — slice doesn't touch them. Drop quietly.
    return 0;
  }

  const byte = clampByte(Math.round(value * 255));

  switch (event.location.kind) {
    case 'point': {
      const cells = coneSearchPix(ctx.cone, {
        latDeg: event.location.lat,
        lonDeg: event.location.lon,
        radiusKm: event.location.radius_km,
      });
      for (let i = 0; i < cells.length; i++) {
        const ipix = cells[i]!;
        ctx.grid.setByte(ipix, channel, byte);
      }
      return cells.length;
    }
    case 'cells': {
      const cells = event.location.cells;
      for (let i = 0; i < cells.length; i++) {
        const ipix = cells[i]!;
        ctx.grid.setByte(ipix, channel, byte);
      }
      return cells.length;
    }
    case 'body':
    case 'graph':
      // Slice deferral. Wire the id raster + graph tables into the worker
      // in the next PR before flipping these on.
      return 0;
  }
}

const ATTR_BY_INDEX: ReadonlyArray<AttributeKey> = (() => {
  const out: AttributeKey[] = [];
  for (const key of Object.keys(ATTRIBUTE_INDEX) as AttributeKey[]) {
    const i = ATTRIBUTE_INDEX[key];
    out[i] = key;
  }
  return out;
})();

function attributeKeyFromIndex(idx: number): AttributeKey | null {
  if (idx < 0 || idx >= ATTR_BY_INDEX.length) return null;
  return ATTR_BY_INDEX[idx] ?? null;
}

function clampByte(v: number): number {
  if (!Number.isFinite(v)) return 0;
  if (v <= 0) return 0;
  if (v >= 255) return 255;
  return v | 0;
}

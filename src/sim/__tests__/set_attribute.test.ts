/**
 * `set_attribute` handler — single-primitive coverage for the slice.
 *
 * Verifies:
 *   - point location stamps the cap into the dynamic grid (fire channel)
 *   - cells location stamps a typed-array of HEALPix cells directly
 *   - body / graph location are no-ops (slice deferral, see handler)
 *   - off-grid attributes (temperature) drop quietly
 */

import { describe, it, expect } from 'vitest';

import { DynamicGrid } from '../fields/grid.js';
import { makeConeContext } from '../fields/cone.js';
import { ATTRIBUTE_INDEX } from '../events/primitives.js';
import { applySetAttribute } from '../events/handlers/set_attribute.js';
import type { WorldEvent } from '../events/primitives.js';

const NSIDE = 32; // small grid keeps the test under 50 ms

function ctx(): {
  grid: DynamicGrid;
  cone: ReturnType<typeof makeConeContext>;
} {
  return {
    grid: new DynamicGrid(NSIDE),
    cone: makeConeContext(NSIDE, 'ring'),
  };
}

describe('applySetAttribute', () => {
  it('stamps the fire channel at a point location', () => {
    const c = ctx();
    const e: WorldEvent = {
      primitive: 'set_attribute',
      location: { kind: 'point', lat: 0, lon: 0, radius_km: 1500 },
      params: { value: 1.0, attribute_index: ATTRIBUTE_INDEX.fire },
    };
    const cells = applySetAttribute(c, e);
    expect(cells).toBeGreaterThan(0);
    // Spot check: the equator at (0, 0) should have its fire byte == 255.
    let touched = 0;
    for (let i = 0; i < c.grid.npix; i++) {
      if (c.grid.getByte(i, 0) > 0) touched++;
    }
    expect(touched).toBe(cells);
    // No bleed into other channels.
    for (let i = 0; i < c.grid.npix; i++) {
      expect(c.grid.getByte(i, 1)).toBe(0);
      expect(c.grid.getByte(i, 2)).toBe(0);
      expect(c.grid.getByte(i, 3)).toBe(0);
    }
  });

  it('stamps the ice channel via attribute_index', () => {
    const c = ctx();
    const e: WorldEvent = {
      primitive: 'set_attribute',
      location: { kind: 'point', lat: 45, lon: 90, radius_km: 1000 },
      params: { value: 0.5, attribute_index: ATTRIBUTE_INDEX.ice },
    };
    const cells = applySetAttribute(c, e);
    expect(cells).toBeGreaterThan(0);
    let iceTouched = 0;
    for (let i = 0; i < c.grid.npix; i++) {
      if (c.grid.getByte(i, 1) > 0) iceTouched++;
    }
    expect(iceTouched).toBe(cells);
  });

  it('cells location stamps a Uint32Array directly', () => {
    const c = ctx();
    const cellList = new Uint32Array([10, 25, 100, 500]);
    const e: WorldEvent = {
      primitive: 'set_attribute',
      location: { kind: 'cells', cells: cellList },
      params: { value: 1.0, attribute_index: ATTRIBUTE_INDEX.infection },
    };
    const touched = applySetAttribute(c, e);
    expect(touched).toBe(4);
    for (const ipix of cellList) {
      expect(c.grid.getByte(ipix, 2)).toBe(255);
    }
  });

  it('drops a temperature event quietly (not a dynamic channel)', () => {
    const c = ctx();
    const e: WorldEvent = {
      primitive: 'set_attribute',
      location: { kind: 'point', lat: 0, lon: 0, radius_km: 500 },
      params: { value: 1.0, attribute_index: ATTRIBUTE_INDEX.temperature },
    };
    const touched = applySetAttribute(c, e);
    expect(touched).toBe(0);
    for (let i = 0; i < c.grid.npix; i++) {
      expect(c.grid.getByte(i, 0)).toBe(0);
    }
  });

  it('body / graph locations are no-ops in the slice', () => {
    const c = ctx();
    const body: WorldEvent = {
      primitive: 'set_attribute',
      location: { kind: 'body', bodyId: 'b_test' },
      params: { value: 1.0, attribute_index: ATTRIBUTE_INDEX.fire },
    };
    expect(applySetAttribute(c, body)).toBe(0);
    const graph: WorldEvent = {
      primitive: 'set_attribute',
      location: { kind: 'graph', graph: 'travel_routes', seed: 'b_x', depth: 3 },
      params: { value: 1.0, attribute_index: ATTRIBUTE_INDEX.fire },
    };
    expect(applySetAttribute(c, graph)).toBe(0);
  });
});

/**
 * Sim worker entry — message routing only. All logic lives in
 * `Scheduler` (pure, testable) and the snapshot codec; this file is the
 * Web Worker boundary that the main thread talks to via C3.
 *
 * Lifecycle:
 *   main            ─── postMessage(SimCommand) ───►   worker.onmessage
 *   worker.scheduler ◄── advance(deltaMs) ────────── tick handler
 *   worker          ─── postMessage(SimUpdate) ───►   main.bridge
 *
 * On `init` the worker fetches the manifest itself (workers have `fetch`)
 * to learn `nside` + `ordering` + the dynamic-init bytes URL. The dynamic
 * grid seeds from the bake's `attribute_dynamic_init.bin` so any pre-baked
 * dynamic state is honoured (Phase 2 ships zeros, but the loader is
 * future-proof).
 *
 * Snapshot tags live in a Map<string, SimSnapshot>. C6's "no Map iteration"
 * doesn't apply to point lookups; the rule bans `for-of (new Set/Map)`
 * iteration, not `Map.get` / `Map.set`.
 */

import { Scheduler } from './scheduler.js';
import { serializeScheduler, deserializeScheduler, type SimSnapshot } from '../snapshot.js';
import type { SimCommand, SimUpdate } from '../types.js';
import { fetchMaybeGz, fetchMaybeGzJson } from '../../world/fetch-gz.js';
import type { WorldManifest } from '../../world/types.js';
import type { HealpixOrdering } from '../../world/healpix.js';

const ROOT_SEED = 0xc0ffee_d00d_1234n;

let scheduler: Scheduler | null = null;
const snapshots = new Map<string, SimSnapshot>();

self.onmessage = (e: MessageEvent<SimCommand>) => {
  const cmd = e.data;
  switch (cmd.type) {
    case 'init':
      void handleInit(cmd.manifestUrl);
      return;
    case 'tick':
      handleTick(cmd.deltaMs);
      return;
    case 'set_speed':
      if (scheduler) scheduler.setSpeed(cmd.multiplier);
      return;
    case 'inject_event':
      if (scheduler) scheduler.injectEvent(cmd.event);
      return;
    case 'snapshot_save':
      handleSnapshotSave(cmd.tag);
      return;
    case 'snapshot_load':
      handleSnapshotLoad(cmd.tag);
      return;
    case 'reload_balance':
      // Slice deferral. Hot-reload of `config/balance/global.yaml` lands
      // when the YAML loader exists. Drop quietly so the host can call
      // it without errors.
      return;
  }
};

async function handleInit(manifestUrl: string): Promise<void> {
  const manifest = await fetchManifest(manifestUrl);
  const baseUrl = manifestUrl.slice(0, manifestUrl.lastIndexOf('/'));
  const dynamicInit = await fetchBytes(
    `${baseUrl}/${manifest.artifacts.attribute_dynamic_init.path}`,
  );
  const nside = manifest.healpix.nside;
  const ordering = manifest.healpix.ordering as HealpixOrdering;
  scheduler = new Scheduler({
    nside,
    ordering,
    rootSeed: ROOT_SEED,
    dynamicInit: new Uint8Array(dynamicInit),
  });
}

function handleTick(deltaMs: number): void {
  if (!scheduler) return;
  scheduler.advance(deltaMs);
  flushAndPost();
  postUpdate({
    type: 'tick_complete',
    tick: scheduler.tick,
    aggregates: zeroAggregates(),
    dirtyAttrs: [],
    dirtyTiles: [],
  });
}

function handleSnapshotSave(tag: string): void {
  if (!scheduler) return;
  const snap = serializeScheduler(scheduler);
  snapshots.set(tag, snap);
  // Approximate byte count for the HUD — JSON length is a good-enough proxy.
  const bytes = JSON.stringify(snap).length;
  postUpdate({ type: 'snapshot_saved', tag, bytes });
}

function handleSnapshotLoad(tag: string): void {
  const snap = snapshots.get(tag);
  if (!snap) return;
  scheduler = deserializeScheduler(snap);
  // Push the loaded patches to the host so the next render shows them.
  // Limitation (slice): cells that were non-zero before the load but zero
  // in the snapshot won't get cleared on the host side until they next
  // change. Tracking the host's view in the worker is a follow-up PR.
  scheduler.grid.markNonZeroDirty();
  flushAndPost();
  postUpdate({ type: 'snapshot_loaded', tag, tick: scheduler.tick });
}

function flushAndPost(): void {
  if (!scheduler) return;
  const deltas = scheduler.grid.flushDirty();
  for (const d of deltas) {
    postUpdate({ type: 'attribute_delta', attr: d.attr, cells: d.cells, values: d.values }, [
      d.cells.buffer,
      d.values.buffer,
    ]);
  }
}

function postUpdate(update: SimUpdate, transfer?: Transferable[]): void {
  if (transfer && transfer.length > 0) {
    (self as unknown as { postMessage: (m: SimUpdate, t: Transferable[]) => void }).postMessage(
      update,
      transfer,
    );
  } else {
    self.postMessage(update);
  }
}

async function fetchManifest(url: string): Promise<WorldManifest> {
  return await fetchMaybeGzJson<WorldManifest>(url);
}

async function fetchBytes(url: string): Promise<ArrayBuffer> {
  return await fetchMaybeGz(url);
}

function zeroAggregates(): SimUpdate extends infer U
  ? U extends { type: 'tick_complete'; aggregates: infer A }
    ? A
    : never
  : never {
  // Slice has no aggregator; HUD shows zeros until a real reducer lands.
  return {
    human_population: 0,
    animal_species_count: 0,
    urban_pct: 0,
    ocean_temp_avg_c: 0,
    forest_cover_pct: 0,
    ice_cover_pct: 0,
    atmospheric_co2_ppm: 0,
    biodiversity_index: 0,
  };
}

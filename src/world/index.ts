/**
 * WorldRuntime facade — the only thing the render layer imports from `world/`.
 *
 * Re-exports the C2 types (canonical in `types.ts`) and the
 * `createWorldRuntime` constructor. Concrete modules — BodyRegistry,
 * IdRaster, AttributeTextures, WorkerBridge, manifest-loader, healpix,
 * coordinates — are deliberately NOT exported from this barrel: render
 * code reaches WorldRuntime via this entry only, keeping the C2 boundary
 * tight (per docs/plans/02-world-runtime.md:39).
 */

export type {
  WorldRuntime,
  WorldManifest,
  ArtifactRef,
  GraphRef,
  BodyRecord,
  BodyType,
  AttributeKey,
  CitiesFile,
  CityRecord,
  RoadsFile,
  RoadRecord,
  PickResult,
  TopologyChange,
  WorldAggregates,
  TileId,
  Unsubscribe,
} from './types.js';

export { createWorldRuntime } from './WorldRuntime.js';
export type { CreateWorldRuntimeOptions, SimControl, WorldRuntimeBundle } from './WorldRuntime.js';

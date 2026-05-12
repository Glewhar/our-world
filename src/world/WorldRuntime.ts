/**
 * `createWorldRuntime` — the C2 facade Phase 2 hands to the render layer.
 *
 * Loads the manifest, the id raster, the four attribute textures, and the
 * wind field in parallel, then composes them into an object that implements
 * the `WorldRuntime` interface from `types.ts`. Render imports only this and
 * the re-exported types — never reaches a concrete module.
 *
 * `pickFromRay` is the load-bearing one. The flow:
 *   ray ⋂ unit sphere ⇒ hit XYZ on globe (Z-up frame, see coordinates.ts)
 *   ⇒ (lat, lon)
 *   ⇒ (z = sin(lat), phi = lon·π/180)
 *   ⇒ HEALPix cell ipix
 *   ⇒ id raster lookup ⇒ body index ⇒ BodyRegistry lookup
 *
 * DO NOT replace this with `raycaster.intersectObjects(globeMesh.children)`.
 * The unified `Globe` icosphere displaces vertices by elevation, so a mesh
 * raycast would land on a deformed surface that no longer agrees with
 * the id-raster's cell boundaries. The id raster is the source of truth.
 */

import * as THREE from 'three';

import { AttributeTextures } from './AttributeTextures.js';
import { BodyRegistry } from './BodyRegistry.js';
import { DistanceFieldTexture } from './DistanceFieldTexture.js';
import { IdRaster } from './IdRaster.js';
import { WorkerBridge } from './WorkerBridge.js';
import { xyzToLatLon } from './coordinates.js';
import { fetchMaybeGzJson } from './fetch-gz.js';
import { zPhiToPix } from './healpix.js';
import { loadManifest } from './manifest-loader.js';
import { OceanCurrentsTexture } from './OceanCurrentsTexture.js';
import { WindFieldTexture } from './WindFieldTexture.js';
import type { SimSpeed, SimUpdate } from '../sim/types.js';
import type { WorldEvent } from '../sim/events/primitives.js';
import type {
  AttributeKey,
  CitiesFile,
  CityRecord,
  PickResult,
  RoadRecord,
  RoadsFile,
  TileId,
  TopologyChange,
  UrbanAreaRecord,
  UrbanAreasFile,
  WorldAggregates,
  WorldRuntime,
} from './types.js';

const DEG = Math.PI / 180;

const ZERO_AGGREGATES: WorldAggregates = {
  human_population: 0,
  animal_species_count: 0,
  urban_pct: 0,
  ocean_temp_avg_c: 0,
  forest_cover_pct: 0,
  ice_cover_pct: 0,
  atmospheric_co2_ppm: 0,
  biodiversity_index: 0,
};

export type CreateWorldRuntimeOptions = {
  /** URL of `world_manifest.json`. Defaults to the dev fixture mount. */
  manifestUrl?: string;
  /**
   * Called each time a loading step completes.
   * `loaded` is the number of steps done (1-based); `total` is the fixed
   * total number of steps. Callers can use `loaded / total` as a fraction.
   */
  onProgress?: (loaded: number, total: number, label: string) => void;
};

/**
 * Companion control surface for the sim worker. Returned alongside the
 * read-only `WorldRuntime` (C2) so render code stays read-only while the
 * main entry can drive ticks and inject events. The dev console binds
 * these onto `window.__ED.sim` for the manual acceptance test in
 * `04-sim-engine.md`.
 */
export type SimControl = {
  tick(deltaMs: number): void;
  injectEvent(event: WorldEvent): void;
  setSpeed(multiplier: SimSpeed): void;
  snapshotSave(tag: string): void;
  snapshotLoad(tag: string): void;
};

export type WorldRuntimeBundle = {
  world: WorldRuntime;
  sim: SimControl;
};

export async function createWorldRuntime(
  opts: CreateWorldRuntimeOptions = {},
): Promise<WorldRuntimeBundle> {
  // Page-relative default so the build runs at any deploy path; the
  // derived `baseUrl` below stays relative too, so sibling fetches work.
  const manifestUrl = opts.manifestUrl ?? 'world/earth_v1/world_manifest.json';

  // 9 steps: 1 manifest + 8 parallel assets.
  const TOTAL_STEPS = 9;
  let loadedCount = 0;
  const step = <T>(label: string) => (result: T): T => {
    opts.onProgress?.(++loadedCount, TOTAL_STEPS, label);
    return result;
  };

  const manifest = await loadManifest(manifestUrl).then(step('manifest'));

  const baseUrl = manifestUrl.slice(0, manifestUrl.lastIndexOf('/'));
  const { nside, ordering } = manifest.healpix;

  const [idRaster, attributes, windField, oceanCurrents, cities, roads, urbanAreas, distanceField] =
    await Promise.all([
      IdRaster.load(`${baseUrl}/${manifest.artifacts.id_raster.path}`, nside, ordering)
        .then(step('id raster')),
      AttributeTextures.load(
        {
          attribute_static: manifest.artifacts.attribute_static,
          attribute_climate_init: manifest.artifacts.attribute_climate_init,
          attribute_dynamic_init: manifest.artifacts.attribute_dynamic_init,
          elevation_meters: manifest.artifacts.elevation_meters,
          water_level_meters: manifest.artifacts.water_level_meters,
        },
        baseUrl,
        nside,
      ).then(step('terrain textures')),
      // wind_field is allowed to be a zero-byte placeholder on older bakes,
      // in which case the loader returns null and consumers degrade.
      (manifest.graphs.wind_field.size_bytes > 32
        ? WindFieldTexture.load(`${baseUrl}/${manifest.graphs.wind_field.path}`)
        : Promise.resolve<WindFieldTexture | null>(null)).then(step('wind field')),
      // ocean_currents has the same placeholder semantic. Same threshold.
      (manifest.graphs.ocean_currents.size_bytes > 32
        ? OceanCurrentsTexture.load(`${baseUrl}/${manifest.graphs.ocean_currents.path}`)
        : Promise.resolve<OceanCurrentsTexture | null>(null)).then(step('ocean currents')),
      // cities.json — empty array on fixture bakes; ~7,300 entries on real
      // natural-earth bakes. Failure to fetch (e.g., legacy bake without the
      // file) degrades to an empty list so the runtime still boots.
      loadCitiesArtifact(`${baseUrl}/${manifest.artifacts.cities.path}`)
        .then(step('cities')),
      // roads.json — same shape as cities. Empty on fixture / legacy bakes.
      // Manifests written before the highways layer existed don't have a
      // `roads` artifact ref at all; degrade to an empty list so the runtime
      // still boots. Once the user re-bakes (or runs the manifest stage)
      // the new ref appears and the layer populates.
      (manifest.artifacts.roads
        ? loadRoadsArtifact(`${baseUrl}/${manifest.artifacts.roads.path}`)
        : Promise.resolve([] as readonly RoadRecord[])).then(step('roads')),
      // urban_areas.json — top-N city polygon outlines fetched by URL
      // convention (NOT referenced from `manifest.artifacts`). Bakes from
      // before the urban-areas stage existed don't ship the file at all;
      // the loader catches the 404 and returns an empty list so the
      // procedural detail layer simply renders nothing.
      loadUrbanAreasArtifact(`${baseUrl}/urban_areas.json`)
        .then(step('urban areas')),
      // distance_field — older bakes predate the artifact; the cli's
      // back-fill writes a zero-byte placeholder. Same threshold as
      // wind_field. When null, the land shader treats every pixel as
      // "deep land, far from any boundary" and the visuals revert to
      // the pre-feature look.
      (manifest.artifacts.distance_field.size_bytes > 32
        ? DistanceFieldTexture.load(`${baseUrl}/${manifest.artifacts.distance_field.path}`)
        : Promise.resolve<DistanceFieldTexture | null>(null)).then(step('terrain detail')),
    ]);

  const registry = new BodyRegistry(manifest.bodies);
  const bridge = new WorkerBridge();

  const tmpHit = new THREE.Vector3();
  const unitSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1);

  // C2 callback bookkeeping — these never fire in Phase 2 (no sim).
  const attrListeners = new Set<(a: AttributeKey, dirty: TileId[]) => void>();
  const topoListeners = new Set<(c: TopologyChange[]) => void>();
  const aggListeners = new Set<(a: WorldAggregates) => void>();

  const runtime: WorldRuntime = {
    getBody: (id) => registry.getBody(id),

    getBodyAt: (lat, lon) => {
      const idx = idRaster.bodyIndexAt(lat, lon);
      return registry.getByIndex(idx);
    },

    pickFromRay: (ray) => {
      const hit = ray.intersectSphere(unitSphere, tmpHit);
      if (!hit) return null;
      const { lat, lon } = xyzToLatLon(hit);
      const z = Math.sin(lat * DEG);
      const phi = lon * DEG;
      const cellIndex = zPhiToPix(nside, ordering, z, phi);
      const bodyIdx = idRaster.bodyIndexAtCell(cellIndex);
      if (bodyIdx === 0) return null;
      const body = registry.getByIndex(bodyIdx);
      if (!body) return null;
      const result: PickResult = {
        bodyId: body.id,
        cellIndex,
        lat,
        lon,
        worldPos: hit.clone(),
      };
      return result;
    },

    getAttribute: (attr, lat, lon) => {
      const z = Math.sin(lat * DEG);
      const phi = lon * DEG;
      const cellIndex = zPhiToPix(nside, ordering, z, phi);
      return attributes.getValue(attr, lat, lon, cellIndex);
    },

    getIdRaster: () => idRaster.toDataTexture(),
    getAttributeTexture: (a) => attributes.getTexture(a),
    getElevationMetersTexture: () => attributes.getElevationMetersTexture(),
    getWaterLevelMetersTexture: () => attributes.getWaterLevelMetersTexture(),

    getHealpixSpec: () => ({ nside, ordering }),

    getWindFieldTexture: () => (windField ? windField.texture : null),
    getOceanCurrentsTexture: () => (oceanCurrents ? oceanCurrents.texture : null),
    getDistanceFieldTexture: () => (distanceField ? distanceField.texture : null),

    getCities: () => cities,
    getRoads: () => roads,
    getUrbanAreas: () => urbanAreas,

    getAggregates: () => ZERO_AGGREGATES,

    onAttributeChanged: (cb) => {
      attrListeners.add(cb);
      return () => {
        attrListeners.delete(cb);
      };
    },
    onBodyTopologyChanged: (cb) => {
      topoListeners.add(cb);
      return () => {
        topoListeners.delete(cb);
      };
    },
    onAggregatesUpdated: (cb) => {
      aggListeners.add(cb);
      return () => {
        aggListeners.delete(cb);
      };
    },
  };

  // Wire the bridge so Phase 4 can flip a switch without retrofitting the facade.
  bridge.onUpdate((u: SimUpdate) => {
    if (u.type === 'attribute_delta') {
      attributes.applyAttributeDelta(u.attr, u.cells, u.values);
      attrListeners.forEach((cb) => cb(u.attr, []));
    } else if (u.type === 'topology_change') {
      topoListeners.forEach((cb) => cb(u.changes));
    } else if (u.type === 'tick_complete') {
      aggListeners.forEach((cb) => cb(u.aggregates));
    }
  });

  // Boot the worker. After `init` completes inside the worker the host can
  // start sending `tick` commands; the worker drops ticks before init
  // anyway, so a stray RAF tick during the init race is harmless.
  // Resolve to an absolute URL: relative URLs in a worker resolve against
  // the worker's own script location, not the page, so `world/...` would
  // 404 inside the worker.
  bridge.postCommand({
    type: 'init',
    manifestUrl: new URL(manifestUrl, document.baseURI).href,
  });

  const sim: SimControl = {
    tick: (deltaMs) => bridge.postCommand({ type: 'tick', deltaMs }),
    injectEvent: (event) => bridge.postCommand({ type: 'inject_event', event }),
    setSpeed: (multiplier) => bridge.postCommand({ type: 'set_speed', multiplier }),
    snapshotSave: (tag) => bridge.postCommand({ type: 'snapshot_save', tag }),
    snapshotLoad: (tag) => bridge.postCommand({ type: 'snapshot_load', tag }),
  };

  return { world: runtime, sim };
}

/**
 * Fetch + parse `cities.json`. Returns an empty array on any failure
 * (404, parse error, schema mismatch) so a stale or partial bake doesn't
 * keep the runtime from booting — `getCities()` will simply return an
 * empty list. No render layer consumes this today; the data is retained
 * for potential downstream consumers (labels, sim hooks).
 */
async function loadCitiesArtifact(url: string): Promise<readonly CityRecord[]> {
  try {
    const file = await fetchMaybeGzJson<Partial<CitiesFile>>(url);
    if (!Array.isArray(file?.cities)) {
      console.warn(`[cities] missing 'cities' array in ${url}`);
      return [];
    }
    return file.cities as CityRecord[];
  } catch (err) {
    console.warn(`[cities] load error from ${url}:`, err);
    return [];
  }
}

/**
 * Fetch + parse `roads.json`. Returns an empty array on any failure so a
 * stale or partial bake doesn't keep the runtime from booting — the
 * highways layer simply renders nothing in that case.
 */
async function loadRoadsArtifact(url: string): Promise<readonly RoadRecord[]> {
  try {
    const file = await fetchMaybeGzJson<Partial<RoadsFile>>(url);
    if (!Array.isArray(file?.roads)) {
      console.warn(`[roads] missing 'roads' array in ${url}`);
      return [];
    }
    return file.roads as RoadRecord[];
  } catch (err) {
    console.warn(`[roads] load error from ${url}:`, err);
    return [];
  }
}

/**
 * Fetch + parse `urban_areas.json`. Same shape as cities/roads: returns
 * an empty array on any failure (404, parse error, missing field) so a
 * legacy bake without the artifact still boots — the procedural urban
 * detail layer just renders nothing in that case.
 */
async function loadUrbanAreasArtifact(url: string): Promise<readonly UrbanAreaRecord[]> {
  try {
    const file = await fetchMaybeGzJson<Partial<UrbanAreasFile>>(url);
    if (!Array.isArray(file?.urban_areas)) {
      console.warn(`[urban_areas] missing 'urban_areas' array in ${url}`);
      return [];
    }
    return file.urban_areas as UrbanAreaRecord[];
  } catch (err) {
    console.warn(`[urban_areas] load error from ${url}:`, err);
    return [];
  }
}

/**
 * Contract C1 + C2 — World types as defined in docs/plans/00-overview.md.
 *
 * IMPORTANT: this file is the canonical TypeScript representation of C1/C2.
 * The Python pipeline emits JSON conforming to these types; the runtime API
 * implements the WorldRuntime interface below. Do not edit without an ADR.
 */
import type * as THREE from 'three';

import type { EcoregionLookup } from './EcoregionTexture.js';

// ─── C1: Pipeline → Runtime ───────────────────────────────────────────────

export type WorldManifest = {
  version: string;
  generated_at: string;
  source_versions: Record<string, string>;
  healpix: { nside: number; ordering: 'ring' | 'nested' };
  artifacts: {
    id_raster: ArtifactRef;
    attribute_static: ArtifactRef;
    attribute_climate_init: ArtifactRef;
    attribute_dynamic_init: ArtifactRef;
    /**
     * Continuous elevation in metres, half-float per HEALPix cell.
     * Consumed by the unified globe shader's vertex displacement path
     * (the `attribute_static.R` bucketed copy stays for stylized colour
     * use). Format: `bin`, R16F, npix * 2 bytes.
     */
    elevation_meters: ArtifactRef;
    /**
     * Cities + populated places, JSON list (see `CitiesFile`). Cities are
     * points (lat, lon, population), not polygons, so they live outside
     * the HEALPix rasterizer pipeline; the artifact is a standalone JSON
     * exposed via `WorldRuntime.getCities()`. No render layer consumes
     * this today (the per-point render was removed in favour of denser
     * street geometry). Format: `json`. Empty list ([]) on fixture bakes.
     */
    cities: ArtifactRef;
    /**
     * Road polylines (Natural Earth ne_10m_roads, all paved types kept,
     * tiered into major / arterial / local / local2). JSON list (see `RoadsFile`).
     * Lines are not polygons, so they live outside the HEALPix rasterizer
     * pipeline; the artifact is a standalone JSON consumed by the render
     * layer's HighwaysLayer. Format: `json`. Empty list ([]) on fixture bakes.
     */
    roads: ArtifactRef;
    /**
     * Equirectangular RG16F + 32-byte header. R = signed kilometres to
     * nearest coastline (positive on land, negative in water). G =
     * kilometres to nearest biome-class boundary. Sampled bilinearly by
     * the land shader to produce smooth sub-cell coast and biome-edge
     * transitions. Byte layout documented in
     * `data-pipeline/src/earth_pipeline/distance_field.py`.
     */
    distance_field: ArtifactRef;
    /**
     * Per-HEALPix dense ecoregion index (uint16, little-endian; two
     * uint8 channels R = low byte, G = high byte). 0 = no data; 1..N =
     * TEOW ecoregion (current bake: N = 825). The companion
     * `ecoregion_lookup` JSON maps each index → parent biome (1..14)
     * and realm (1..8) so the shader can derive a per-ecoregion colour
     * from the existing 14-biome palette × 8-realm tint without
     * shipping 825 hand-picked colours. Optional: legacy bakes that
     * predate Phase 2.B still validate.
     */
    attribute_eco?: ArtifactRef;
    /**
     * Gzipped JSON lookup keyed by the dense ecoregion index from
     * `attribute_eco`. Carries the parent biome / realm / human-readable
     * name for every ecoregion. Loaded once at boot. Format: `json`,
     * gzipped on disk (`.json.gz`).
     */
    ecoregion_lookup?: ArtifactRef;
  };
  bodies: BodyRecord[];
  graphs: {
    travel_routes: GraphRef;
    /**
     * Ocean currents — a regular RG16F equirectangular grid (same byte
     * layout as `wind_field`), NOT the original node/edge graph design.
     * Encoded as `ArtifactRef`. Synthesised from real wind + Earth-shaped
     * gyres + zonal jets and land-masked via `id_raster`.
     */
    ocean_currents: ArtifactRef;
    river_network: GraphRef;
    species: GraphRef;
    wind_field: ArtifactRef;
  };
};

export type ArtifactRef = {
  path: string;
  format: 'ktx2' | 'glb' | 'bin' | 'pbf' | 'json';
  hash: string;
  size_bytes: number;
};

/**
 * Cities artifact (`cities.json`). Sorted by `pop` descending so a
 * slice-by-prefix gives top-N. Empty list on fixture bakes.
 */
export type CitiesFile = {
  version: 1;
  source: string; // e.g. "natural_earth_10m_populated_places_v5.1.1"
  generated_at: string; // ISO8601
  count: number;
  cities: CityRecord[];
};

export type CityRecord = {
  lat: number; // degrees, [-90, 90]
  lon: number; // degrees, [-180, 180]
  pop: number; // POP_MAX from Natural Earth
  name: string;
  country: string;
};

/**
 * Roads artifact (`roads.json`). Sorted: major before arterial before
 * local before local2, longer lines first within each kind so the
 * densest network draws earliest. Empty list on fixture bakes.
 */
export type RoadsFile = {
  version: 3;
  source: string; // e.g. "natural_earth_10m_roads_v5.1.1"
  generated_at: string; // ISO8601
  count: number;
  roads: RoadRecord[];
};

export type RoadRecord = {
  /**
   * Tier label, from densest/most-important to thinnest:
   *   major   — NE "Major Highway"
   *   arterial — NE "Secondary Highway" / "Beltway" / "Bypass"
   *   local   — NE "Road" (regional connectors)
   *   local2  — NE "Unknown" (untyped — bulk of Asia's secondary net)
   */
  kind: 'major' | 'arterial' | 'local' | 'local2';
  /** Polyline vertices as [lat, lon] pairs (degrees), already simplified. */
  vertices: [number, number][];
};

/**
 * Urban-areas artifact (`urban_areas.json`). All ~11,400 urban-centre
 * outlines from GHS-UCDB R2024A (per-polygon 2025 population) that
 * drive the procedural in-browser streets-and-buildings layer. Sorted
 * by `pop` descending; `id` is the sequential rank (0-based). Empty
 * list on fixture bakes.
 *
 * This artifact sits OUTSIDE `WorldManifest.artifacts` — the runtime
 * fetches it by URL convention as a sibling of `world_manifest.json` so
 * older bakes that predate the artifact still validate against C1.
 */
export type UrbanAreasFile = {
  version: 1;
  source: string; // e.g. "ghs_ucdb_R2024A_V1.1"
  generated_at: string; // ISO8601
  count: number;
  urban_areas: UrbanAreaRecord[];
};

export type UrbanAreaRecord = {
  /** Sequential rank in the sorted list (0-based). Stable across re-bakes. */
  id: number;
  /** Centroid latitude in degrees. */
  lat: number;
  /** Centroid longitude in degrees. */
  lon: number;
  /** Population from the nearest populated_places match. */
  pop: number;
  /** City display name (best-effort from the nearest match). */
  name: string;
  country: string;
  /**
   * Simplified outer-ring vertices as `[lat, lon]` pairs (degrees). First
   * vertex is NOT repeated at the end — the consumer closes the ring.
   * Typical length ≈ 40 verts after the ~200 m Douglas–Peucker simplify.
   */
  polygon: [number, number][];
};

export type GraphRef = {
  path: string;
  format: 'json' | 'bin';
  hash: string;
  node_count: number;
  edge_count: number;
};

export type BodyRecord = {
  id: string;
  type: BodyType;
  display_name: string;
  parent_id?: string;
  bbox: [minLat: number, minLon: number, maxLat: number, maxLon: number];
  centroid: [lat: number, lon: number];
  area_km2: number;
  metadata: Record<string, unknown>;
};

export type BodyType =
  | 'ocean_basin'
  | 'shallow_water'
  | 'lake'
  | 'river'
  | 'country'
  | 'admin_subdivision'
  | 'city'
  | 'biome'
  | 'mountain'
  | 'mountain_range'
  | 'glacier'
  | 'desert'
  | 'forest'
  | 'wetland'
  | 'tundra'
  | 'current'
  | 'wind_belt'
  | 'travel_route';

// ─── C2: Runtime → Render ─────────────────────────────────────────────────

export type AttributeKey =
  | 'temperature'
  | 'moisture'
  | 'vegetation'
  | 'fire'
  | 'ice'
  | 'infection'
  | 'pollution'
  | 'albedo'
  | 'population_density'
  | 'ocean_health'
  | 'elevation'
  | 'wasteland';

export type PickResult = {
  bodyId: string;
  cellIndex: number;
  lat: number;
  lon: number;
  worldPos: THREE.Vector3;
};

export type TopologyChange = {
  kind: 'merge' | 'split' | 'reclassify';
  before: string[];
  after: string[];
  cells: Uint32Array;
};

export type WorldAggregates = {
  human_population: number;
  animal_species_count: number;
  urban_pct: number;
  ocean_temp_avg_c: number;
  forest_cover_pct: number;
  ice_cover_pct: number;
  atmospheric_co2_ppm: number;
  biodiversity_index: number;
};

export type TileId = number;
export type Unsubscribe = () => void;

export interface WorldRuntime {
  // Identity & spatial queries
  getBody(id: string): BodyRecord | null;
  getBodyAt(lat: number, lon: number): BodyRecord | null;
  pickFromRay(ray: THREE.Ray): PickResult | null;

  // Attribute queries (CPU side, sparse)
  getAttribute(attr: AttributeKey, lat: number, lon: number): number;

  /**
   * Continuous elevation in metres at the given lat/lon (positive above
   * sea level). Resolves the HEALPix cell and decodes the half-float from
   * the same buffer the elevation texture is built from — cheap, no GPU
   * readback. Used by surface-anchored effects (e.g. nuclear blasts) so
   * they sit on the displaced land mesh instead of at the unit sphere.
   */
  getElevationMetersAt(lat: number, lon: number): number;

  /**
   * Continuous elevation in metres at a specific HEALPix cell. Cheaper
   * than the lat/lon variant when the caller has already resolved the
   * cell index (e.g. when iterating a vertex buffer through
   * `zPhiToPix`). Same buffer, same decode.
   */
  getElevationMetersAtCell(ipix: number): number;

  /**
   * Body index at a HEALPix cell. 0 means ocean / no body — used by
   * surface-anchored bakes to mirror the GLSL `isOceanIdTexel` check
   * (which compares the id raster's alpha sentinel) when computing
   * coastline-aware lifts CPU-side.
   */
  getBodyIndexAtCell(ipix: number): number;

  /**
   * Surface wind vector at the given lat/lon in m/s. `u` is eastward,
   * `v` is northward, both in the lat-tangent frame at the queried
   * point. Returns null on bakes that didn't ship the wind field.
   */
  getWindAt(lat: number, lon: number): { u: number; v: number } | null;

  // Shader bindings (GPU side, hot path)
  getIdRaster(): THREE.DataTexture;
  getAttributeTexture(a: AttributeKey): THREE.DataTexture;
  /**
   * Continuous-elevation R16F texture (half-float metres) keyed by
   * HEALPix cell. Consumed by the unified globe shader's vertex
   * displacement path. The bucketed `attribute_static.R` channel stays
   * for fragment-shader colour use.
   */
  getElevationMetersTexture(): THREE.DataTexture;

  /**
   * Equirectangular RG16F distance-field texture. R = signed km to
   * nearest coastline (positive on land); G = km to nearest biome-class
   * boundary. Bilinear-sampled by the land shader for sub-cell smooth
   * coast + biome-edge transitions. Returns null on bakes that didn't
   * ship the artifact (loader degrades — shader treats null as
   * "everywhere far from any boundary").
   */
  getDistanceFieldTexture(): THREE.DataTexture | null;

  /**
   * RG8 dense ecoregion index per HEALPix cell. R = low byte, G = high
   * byte; the shader reconstructs `idx = r + g * 256` as the index into
   * `getEcoregionLookup()`. Returns null when the bake didn't ship the
   * `attribute_eco` / `ecoregion_lookup` artifacts (legacy bakes); the
   * land shader degrades to the 14-biome palette path.
   */
  getEcoregionTexture(): THREE.DataTexture | null;

  /**
   * Lookup table for the dense ecoregion indices stored in
   * `getEcoregionTexture()`. `lookup.biome[idx]` is the parent biome
   * (1..14); `lookup.realm[idx]` is the realm (1..8); slot 0 is the
   * no-data sentinel. Returns null when the bake didn't ship the
   * artifacts.
   */
  getEcoregionLookup(): EcoregionLookup | null;

  /**
   * Wasteland R8 attribute texture (one byte per HEALPix cell, value
   * normalized as `byte / 255` ∈ [0, 1]). Driven by the scenario registry
   * on the main thread; zero everywhere on a fresh bake.
   */
  getWastelandTexture(): THREE.DataTexture;

  /**
   * Push a wasteland-attribute frame produced by the scenario registry.
   * `cells` and `values` line up index-for-index; cells not in the list
   * keep their prior value. The render layer doesn't call this — the
   * scenario registry does, via a sink it gets from createWorldRuntime.
   */
  applyWastelandFrame(cells: Uint32Array, values: Float32Array): void;

  // HEALPix spec exposed to render-side shaders that sample the id raster
  // (Phase 3+). `nside` lets the GLSL port know the grid resolution; `ordering`
  // selects the cell-numbering scheme. Not C1 — additive on the runtime API.
  getHealpixSpec(): { nside: number; ordering: 'ring' | 'nested' };

  // Wind field texture (RG16F, equirectangular) — null until the M2 bake
  // ships real bytes. Consumers (clouds, ocean ribbons, particles) defend
  // against null and degrade gracefully.
  getWindFieldTexture(): THREE.DataTexture | null;

  // Ocean currents texture (RG16F, equirectangular, m/s u/v in lat-tangent
  // frame). Same byte layout as the wind field; magic bytes differ. Land
  // cells are zeroed. Null when the bake didn't ship currents.
  getOceanCurrentsTexture(): THREE.DataTexture | null;

  // Cities + populated places, loaded from `artifacts.cities` at boot.
  // Sorted by population descending. Empty array when the bake didn't
  // produce real city data (fixture bakes).
  getCities(): readonly CityRecord[];

  // Road polylines (Natural Earth ne_10m_roads, all paved types kept,
  // tiered into major / arterial / local). Loaded from `artifacts.roads`
  // at boot. Sorted major-first then by length descending within each
  // kind. Empty array on fixture bakes.
  getRoads(): readonly RoadRecord[];

  /**
   * Urban-centre outlines from GHS-UCDB R2024A (per-polygon 2025
   * population). Fetched as a sibling of the manifest at
   * `urban_areas.json.gz` and degrades to an empty array when the bake
   * didn't produce the file (legacy bakes). Consumed by the procedural
   * in-browser streets-and-buildings layer.
   */
  getUrbanAreas(): readonly UrbanAreaRecord[];

  // Aggregates (refreshed by Sim @ 10 Hz)
  getAggregates(): WorldAggregates;

  // Subscriptions
  onAttributeChanged(cb: (a: AttributeKey, dirtyTiles: TileId[]) => void): Unsubscribe;
  onBodyTopologyChanged(cb: (changes: TopologyChange[]) => void): Unsubscribe;
  onAggregatesUpdated(cb: (agg: WorldAggregates) => void): Unsubscribe;
}

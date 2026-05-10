/**
 * Contract C1 + C2 — World types as defined in docs/plans/00-overview.md.
 *
 * IMPORTANT: this file is the canonical TypeScript representation of C1/C2.
 * The Python pipeline emits JSON conforming to these types; the runtime API
 * implements the WorldRuntime interface below. Do not edit without an ADR.
 */
import type * as THREE from 'three';

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
     * Continuous water-surface elevation in metres, half-float per
     * HEALPix cell. Consumed by the Water mesh's vertex displacement
     * path once the unified globe is split into Land + Water meshes.
     * v1: zero everywhere (sea level); floods later bump cells up.
     * Format: `bin`, R16F, npix * 2 bytes.
     */
    water_level_meters: ArtifactRef;
    /**
     * Cities + populated places, JSON list (see `CitiesFile`). Cities are
     * points (lat, lon, population), not polygons, so they live outside
     * the HEALPix rasterizer pipeline; the artifact is a standalone JSON
     * consumed by the render layer's CitiesLayer. Format: `json`. Empty
     * list ([]) on fixture bakes.
     */
    cities: ArtifactRef;
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
  | 'elevation';

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
   * Continuous water-surface elevation R16F texture (half-float metres)
   * keyed by HEALPix cell. Consumed by the new water mesh's vertex
   * displacement path once the unified globe is split into Land + Water
   * meshes. v1: zero everywhere (sea level); floods later bump cells up.
   */
  getWaterLevelMetersTexture(): THREE.DataTexture;

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

  // Aggregates (refreshed by Sim @ 10 Hz)
  getAggregates(): WorldAggregates;

  // Subscriptions
  onAttributeChanged(cb: (a: AttributeKey, dirtyTiles: TileId[]) => void): Unsubscribe;
  onBodyTopologyChanged(cb: (changes: TopologyChange[]) => void): Unsubscribe;
  onAggregatesUpdated(cb: (agg: WorldAggregates) => void): Unsubscribe;
}

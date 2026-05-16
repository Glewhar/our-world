/**
 * Contract C1 + C2 — World types.
 *
 * IMPORTANT: this file is the canonical TypeScript representation of C1/C2.
 * The Python pipeline emits JSON conforming to these types; the runtime API
 * implements the WorldRuntime interface below. Do not edit without an ADR.
 */
import type * as THREE from 'three';

import type { PolygonLookup } from './PolygonTexture.js';

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
     * HEALPix cell. Parallel to `elevation_meters`; zero everywhere on
     * v1 (sea level). Floods bump cells up at runtime. Format: `bin`,
     * R16F, npix * 2 bytes.
     */
    water_level_meters: ArtifactRef;
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
     * Equirect uint16 polygon-ID raster (NOT HEALPix-shaped). One pixel
     * per (lat, lon) sample; pixel value is the polygon ID into the
     * companion `polygon_lookup` (0 = no-data, 1..N = TEOW polygon).
     * The raster dimensions are NOT in the manifest; the
     * `polygon_lookup` JSON carries `raster_width` / `raster_height`
     * so the loader sizes the texture without extra manifest fields.
     * Format: `bin`, little-endian uint16, width * height * 2 bytes.
     *
     * Required by the runtime — `createWorldRuntime` throws at boot
     * when the artifact is missing. Feeds the polygon-keyed colour
     * map that `BiomeColorEquirect` bakes and blurs into the LAND
     * base texture. Marked optional in the schema so fixture bakes
     * (which have no TEOW source) still produce a syntactically valid
     * manifest for the pipeline tests.
     */
    attribute_polygon?: ArtifactRef;
    /**
     * Gzipped JSON lookup keyed by the polygon ID in `attribute_polygon`.
     * Carries per-polygon biome (1..14), realm (1..8), centroid + bbox
     * (degrees), and elevation percentiles (metres). Also carries the
     * raster dimensions for the companion ID texture. Climate scenarios
     * iterate this list and write per-polygon override classes.
     *
     * Same fixture caveat as `attribute_polygon` above.
     */
    polygon_lookup?: ArtifactRef;
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
 *
 * Version 1 ships a single outer-ring `polygon` per record; the runtime
 * synthesises tiers at load time. Version 2 ships per-tier polygons
 * (GHS-SMOD urban centre / dense / semi-dense / suburban) directly.
 */
export type UrbanAreasFile = {
  version: 1 | 2;
  source: string; // e.g. "ghs_ucdb_R2024A_V1.1"
  generated_at: string; // ISO8601
  count: number;
  urban_areas: UrbanAreaRecord[] | LegacyUrbanAreaRecord[];
};

/**
 * One density tier of an urban area. SMOD-derived: 1.0 = urban centre,
 * 0.75 = dense cluster, 0.5 = semi-dense, 0.25 = suburban. Each tier is
 * a single closed polygon (multi-component tiers are split into separate
 * `UrbanAreaRecord` entries so a single record always has connected
 * tier polygons).
 */
export type UrbanDensityTier = {
  /** Density weight in [0, 1] — drives the cities shader's block-spray + outline + alpha. */
  density: number;
  /** Simplified outer-ring vertices as `[lat, lon]` pairs (degrees), no closing dup. */
  polygon: [number, number][];
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
   * Density tiers, densest first. v2 bakes ship the real GHS-SMOD slices;
   * the v1 loader synthesises them from the legacy outer-ring polygon.
   */
  tiers: UrbanDensityTier[];
};

/**
 * Legacy v1 raw record (single outer-ring polygon). Only used by the
 * loader to back-fill `tiers` until the v2 bake lands; never reaches the
 * render layer.
 */
export type LegacyUrbanAreaRecord = {
  id: number;
  lat: number;
  lon: number;
  pop: number;
  name: string;
  country: string;
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
   * Fraction of the planet's surface above the given sea level, in [0, 1].
   * Land = `elev >= seaLevelM` (matches the land shader's discard rule).
   * Cheap: a sorted elevation array is built once and binary-searched on
   * every call, so callers may invoke this per frame.
   */
  getLandFraction(seaLevelM: number): number;

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
   * Equirect RG8 polygon-ID texture (NOT HEALPix-shaped). Two uint8
   * channels per pixel encode the polygon ID; the shader reconstructs
   * `polyId = r + g * 256` as an index into `getPolygonLookup()`.
   */
  getPolygonTexture(): THREE.DataTexture;

  /**
   * Lookup table for the polygon IDs stored in `getPolygonTexture()`.
   * `lookup.biome[i]`, `lookup.realm[i]` plus centroid / bbox /
   * elevation percentiles per polygon. Climate scenarios iterate this
   * to paint biome transitions polygon-by-polygon in one frame.
   */
  getPolygonLookup(): PolygonLookup;

  /**
   * Polygon id covering the given HEALPix cell, or 0 if no polygon
   * owns it (ocean / no-data). Lazy-built on first call by walking the
   * equirect polygon raster once — ~33M pixels at 8192×4096, single
   * pass. Cached for the runtime's life.
   */
  getPolygonOfCell(ipix: number): number;

  /**
   * Polygon id at the given lat/lon, sampled from the equirect polygon
   * raster. 0 = ocean / no-data. Cheap — single pixel lookup, no
   * caching needed.
   */
  getPolygonIdAt(latDeg: number, lonDeg: number): number;

  /**
   * Per-polygon override-class texture for a climate slot (0 = first
   * active climate scenario, 1 = second). R8, length = polygon count
   * + 1, slot 0 is no-data. Throws if the bake didn't ship the
   * polygon artifacts — render layers should check `getPolygonLookup()`
   * is non-null before binding these.
   */
  getPolygonOverrideClassTexture(slot: 0 | 1): THREE.DataTexture;

  /** Per-polygon override-weight texture. Same shape / contract as the class texture. */
  getPolygonOverrideWeightTexture(slot: 0 | 1): THREE.DataTexture;

  /** Per-polygon onset-time texture. Same shape / contract as the class texture. */
  getPolygonOverrideTStart01Texture(slot: 0 | 1): THREE.DataTexture;

  /**
   * Write per-polygon override state for one climate slot in one
   * call. All three arrays must be length `polygonLookup.count + 1`.
   * Replaces the per-cell `bakeBiomeOverrideStamps` path when the
   * polygon artifacts are available — climate scenarios stop writing
   * millions of cells per frame and start writing tens of kilobytes
   * once at scenario start.
   */
  bakePolygonOverride(
    slot: 0 | 1,
    classByPoly: Uint8Array,
    weightByPoly: Uint8Array,
    tStart01ByPoly: Uint8Array,
  ): void;

  /** Zero a climate slot's per-polygon override state in one call. */
  clearPolygonOverrideSlot(slot: 0 | 1): void;

  /**
   * Register a new dynamic R8 attribute by key. Allocates one byte
   * per HEALPix cell + a companion R8 `DataTexture`; idempotent so
   * callers can register at boot in any order. Pre-called for
   * `'wasteland'`. Scenario kinds that need their own dynamic field
   * plug in here before wiring a sink into the registry.
   */
  registerDynamicR8Attribute(key: string): void;

  /**
   * R8 attribute texture for a registered key, one byte per HEALPix
   * cell normalized as `byte / 255` ∈ [0, 1]. Driven by the scenario
   * registry's per-sink frame composer; zero everywhere on a fresh
   * bake. Throws when `key` was never registered.
   */
  getDynamicAttributeTexture(key: string): THREE.DataTexture;

  /**
   * Push a frame for a registered dynamic R8 attribute. `cells` and
   * `values` line up index-for-index; cells not in the list keep
   * their prior value. The render layer doesn't call this — the
   * scenario registry does, via a sink it gets from createWorldRuntime.
   */
  applyDynamicAttributeFrame(key: string, cells: Uint32Array, values: Float32Array): void;

  /**
   * Wasteland R8 attribute texture — back-compat alias for
   * `getDynamicAttributeTexture('wasteland')`.
   */
  getWastelandTexture(): THREE.DataTexture;

  /**
   * Back-compat alias for
   * `applyDynamicAttributeFrame('wasteland', cells, values)`.
   */
  applyWastelandFrame(cells: Uint32Array, values: Float32Array): void;

  /**
   * Biome-override class texture (RG8, two bytes per HEALPix cell).
   * R = slot 0 class id, G = slot 1 class id (0 = no override; 1..14 =
   * TEOW biome). Two slots so two concurrent climate scenarios can
   * co-paint the planet. Baked atomically by `bakeBiomeOverrideStamps`;
   * zero everywhere before any climate-class scenario fires.
   */
  getBiomeOverrideTexture(): THREE.DataTexture;

  /**
   * Companion stamp-weight texture (RGBA8). R/G = slot 0 (weight, tStart01),
   * B/A = slot 1 (weight, tStart01). Multiplied per slot by
   * `uClimateEnvelope` / `uClimateEnvelopeB` in the land shader to
   * derive each slot's crossfade strength.
   */
  getBiomeOverrideStampTexture(): THREE.DataTexture;

  /**
   * Bake the union of every active climate scenario's biome-override
   * stamps into the two-slot class + stamp textures. Called by the
   * scenario registry at scenario start / end / auto-repeat. The two
   * slots are independent; pass empty arrays for both to clear.
   */
  bakeBiomeOverrideStamps(input: {
    slotA: readonly {
      cells: Uint32Array;
      values: Float32Array;
      biomeId: number;
      tStart01s?: Float32Array;
    }[];
    slotB: readonly {
      cells: Uint32Array;
      values: Float32Array;
      biomeId: number;
      tStart01s?: Float32Array;
    }[];
  }): void;

  /** Walk the static attribute buffer once and bin every cell by biome class. */
  countBiomesGlobal(): Record<number, number>;

  /** Baseline biome class at the given HEALPix cell (R channel of static attr). */
  getBaselineClass(ipix: number): number;

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

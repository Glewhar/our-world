/**
 * Load the four attribute textures the pipeline emits and expose them as
 * Three.js `DataTexture`s plus a CPU sampler.
 *
 * On-disk format (matching `data-pipeline/src/earth_pipeline/bake_attrs.py`):
 *   - attribute_static:        RGBA8  → [elevation_class, biome_class, soil_class, urbanization]
 *   - attribute_climate_init:  RG16F  → [temperature_c, moisture_frac]
 *   - attribute_dynamic_init:  RGBA8  → [fire, ice, infection, pollution]
 *   - elevation_meters:        R16F   → continuous metres for vertex displacement
 *
 * The four textures are independently exposed:
 *   - `getTexture(AttributeKey)` returns the shared source texture for the
 *     RGBA8/RG16F packed channels (used by the fragment shader for
 *     stylized colouring).
 *   - `getElevationMetersTexture()` returns the R16F continuous-elevation
 *     texture (used by the vertex shader for displacement).
 *
 * C2 attributes not present in the bake (vegetation, albedo,
 * population_density, ocean_health) return 0 from `getValue` and a shared
 * zero texture from `getTexture` — the sim layer populates them at runtime.
 */

import * as THREE from 'three';

import { fetchMaybeGz } from './fetch-gz.js';
import type { AttributeKey, ArtifactRef } from './types.js';

/**
 * Translate a C2 `AttributeKey` into the dynamic-grid channel offset.
 * Mirrored from `web/src/sim/fields/grid.ts` so the world runtime
 * doesn't have to import a sim module (keeps the boundary clean).
 */
function dynamicChannelOffset(attr: AttributeKey): 0 | 1 | 2 | 3 | null {
  switch (attr) {
    case 'fire':
      return 0;
    case 'ice':
      return 1;
    case 'infection':
      return 2;
    case 'pollution':
      return 3;
    default:
      return null;
  }
}

function clampByte(v: number): number {
  if (!Number.isFinite(v)) return 0;
  if (v <= 0) return 0;
  if (v >= 255) return 255;
  return v | 0;
}

type ChannelSource =
  | 'static'
  | 'climate'
  | 'dynamic'
  | 'biomeOverride'
  | 'biomeOverrideStamp';

type ChannelSpec = {
  source: ChannelSource;
  /** Byte offset within the per-pixel stride of the source texture. */
  byteOffset: number;
  /** 1 for uint8 channels, 2 for float16. */
  byteWidth: 1 | 2;
};

const CHANNEL_MAP: Partial<Record<AttributeKey, ChannelSpec>> = {
  elevation: { source: 'static', byteOffset: 0, byteWidth: 1 },
  temperature: { source: 'climate', byteOffset: 0, byteWidth: 2 },
  moisture: { source: 'climate', byteOffset: 2, byteWidth: 2 },
  fire: { source: 'dynamic', byteOffset: 0, byteWidth: 1 },
  ice: { source: 'dynamic', byteOffset: 1, byteWidth: 1 },
  infection: { source: 'dynamic', byteOffset: 2, byteWidth: 1 },
  pollution: { source: 'dynamic', byteOffset: 3, byteWidth: 1 },
};

export type AttributeArtifactRefs = {
  attribute_static: ArtifactRef;
  attribute_climate_init: ArtifactRef;
  attribute_dynamic_init: ArtifactRef;
  elevation_meters: ArtifactRef;
};

export class AttributeTextures {
  static async load(
    refs: AttributeArtifactRefs,
    baseUrl: string,
    nside: number,
  ): Promise<AttributeTextures> {
    const npix = 12 * nside * nside;
    const [staticBuf, climateBuf, dynamicBuf, elevMetersBuf] =
      await Promise.all([
        fetchAndCheck(`${baseUrl}/${refs.attribute_static.path}`, npix * 4),
        fetchAndCheck(`${baseUrl}/${refs.attribute_climate_init.path}`, npix * 4),
        fetchAndCheck(`${baseUrl}/${refs.attribute_dynamic_init.path}`, npix * 4),
        // R16F = 2 bytes per cell.
        fetchAndCheck(`${baseUrl}/${refs.elevation_meters.path}`, npix * 2),
      ]);
    return new AttributeTextures(
      nside,
      staticBuf,
      climateBuf,
      dynamicBuf,
      elevMetersBuf,
    );
  }

  readonly nside: number;
  private readonly staticBytes: Uint8Array;
  private readonly climateBytes: Uint8Array;
  private readonly dynamicBytes: Uint8Array;
  private readonly elevMetersBytes: Uint8Array;
  /**
   * One R8 byte-buffer per registered dynamic attribute key (one byte
   * per HEALPix cell). Writes come from the main-thread
   * `ScenarioRegistry` — scenarios compose stamps on the fly and the
   * registry calls `applyDynamicAttributeFrame(key, …)`. The companion
   * `DataTexture`s live in `dynamicAttrTextures`. Zero on a fresh
   * bake; never persisted. `'wasteland'` is pre-registered in the
   * constructor; further keys plug in via `registerDynamicR8Attribute`.
   */
  private readonly dynamicAttrBytes: Map<string, Uint8Array> = new Map();
  private readonly dynamicAttrTextures: Map<string, THREE.DataTexture> = new Map();
  /**
   * Biome-override class buffer (RG8, 2 bytes per cell). Two slots so
   * two concurrent climate scenarios can co-paint the planet:
   *   R = class id for slot 0 (first active climate scenario)
   *   G = class id for slot 1 (second active climate scenario)
   * Byte value 0 = no override in that slot; 1..14 = TEOW biome.
   * Baked ONCE at climate-scenario start/end by
   * `bakeBiomeOverrideStamps`; never written per frame.
   */
  private readonly biomeOverrideClassBytes: Uint8Array;
  /**
   * Biome-override stamp buffer (RGBA8, 4 bytes per cell):
   *   R = slot 0 weight (multiplied by `uClimateEnvelope` per fragment)
   *   G = slot 0 per-cell onset `tStart01 × 255`
   *   B = slot 1 weight (multiplied by `uClimateEnvelopeB` per fragment)
   *   A = slot 1 per-cell onset `tStart01 × 255`
   * The land shader's two slots crossfade independently; each cell can
   * carry an override in 0, 1, or 2 slots simultaneously. Baked once
   * alongside the class buffer; never written per frame.
   */
  private readonly biomeOverrideStampBytes: Uint8Array;
  private readonly textures = new Map<
    ChannelSource | 'zero' | 'elevMeters',
    THREE.DataTexture
  >();
  // Sorted copy of every cell's elevation (metres). Built lazily on first
  // call to `getLandFraction`; reused for binary-search lookups thereafter.
  // HEALPix cells are equal-area, so cell counts double as area fractions.
  private sortedElevationsMetersCache: Float32Array | null = null;

  constructor(
    nside: number,
    staticBuf: ArrayBuffer,
    climateBuf: ArrayBuffer,
    dynamicBuf: ArrayBuffer,
    elevMetersBuf: ArrayBuffer,
  ) {
    this.nside = nside;
    this.staticBytes = new Uint8Array(staticBuf);
    this.climateBytes = new Uint8Array(climateBuf);
    this.dynamicBytes = new Uint8Array(dynamicBuf);
    this.elevMetersBytes = new Uint8Array(elevMetersBuf);
    // 'wasteland' is the historical first dynamic R8 attribute. Pre-
    // registered here so existing render layers (Land / Cities /
    // Highways / VolumetricCloudPass) can resolve it via the same
    // generic path used by future kinds.
    this.registerDynamicR8Attribute('wasteland');
    // 'infrastructure_loss' runs in parallel to wasteland: climate
    // scenarios stamp into it to kill cities + highways without
    // painting a black wasteland scar on the LAND shader. Cities and
    // highways shaders gate on `max(wasteland, infrastructure_loss)`.
    this.registerDynamicR8Attribute('infrastructure_loss');
    // RG8 class buffer — 2 bytes per cell (R = slot 0 class, G = slot 1 class).
    this.biomeOverrideClassBytes = new Uint8Array(12 * nside * nside * 2);
    // RGBA8 stamp buffer — 4 bytes per cell
    // (R = slot 0 weight, G = slot 0 tStart, B = slot 1 weight, A = slot 1 tStart).
    this.biomeOverrideStampBytes = new Uint8Array(12 * nside * nside * 4);
  }

  /**
   * Register a new dynamic R8 attribute by key. Allocates one byte per
   * HEALPix cell + a companion R8 `DataTexture`. Idempotent —
   * re-registering an existing key is a no-op so callers can register
   * at boot without coordinating order. Pre-called for `'wasteland'`
   * in the constructor; scenario kinds that need their own dynamic
   * field (e.g. `'infectionLevel'`, `'ashDeposit'`) call this at boot
   * and wire a sink in the registry.
   *
   * Lives on a dedicated texture per key because the static `dynamic`
   * slot (fire/ice/infection/pollution) is fully packed; new kinds
   * would require a new texture either way, and a single-channel R8
   * is the smallest the GPU side needs.
   */
  registerDynamicR8Attribute(key: string): void {
    if (this.dynamicAttrBytes.has(key)) return;
    const bytes = new Uint8Array(12 * this.nside * this.nside);
    this.dynamicAttrBytes.set(key, bytes);
    const w = 4 * this.nside;
    const h = 3 * this.nside;
    const data = bytes as Uint8Array<ArrayBuffer>;
    const tex = new THREE.DataTexture(data, w, h, THREE.RedFormat, THREE.UnsignedByteType);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    this.dynamicAttrTextures.set(key, tex);
  }

  /**
   * R8 texture for a registered dynamic attribute, one byte per
   * HEALPix cell scaled `byte / 255` ∈ [0, 1]. Driven by the
   * ScenarioRegistry's per-sink frame composer — every active
   * scenario's stamp targeting this key is summed and clamped each
   * frame; cells outside any active stamp stay at 0. Throws when
   * `key` was never registered.
   */
  getDynamicAttributeTexture(key: string): THREE.DataTexture {
    const tex = this.dynamicAttrTextures.get(key);
    if (!tex) {
      throw new Error(`AttributeTextures: dynamic R8 attribute '${key}' not registered`);
    }
    return tex;
  }

  /**
   * Push a frame of values for a registered dynamic R8 attribute.
   * `cells` and `values` line up index-for-index; `values` are floats
   * in [0, 1]. Cells not in the list keep whatever they already had —
   * the registry includes cells transitioning back to zero so the
   * texture clears them.
   *
   * Full-buffer upload via `needsUpdate = true` (no `texSubImage2D`
   * in Three.js's DataTexture API). `tex.needsUpdate` flips strictly
   * when at least one byte's value actually changed; smooth-decay
   * frames where no byte crosses the round() step skip the upload.
   */
  applyDynamicAttributeFrame(key: string, cells: Uint32Array, values: Float32Array): void {
    if (cells.length !== values.length) return;
    if (cells.length === 0) return;
    const bytes = this.dynamicAttrBytes.get(key);
    if (!bytes) return;
    let changed = false;
    for (let i = 0; i < cells.length; i++) {
      const ipix = cells[i]!;
      if (ipix >= bytes.length) continue;
      const next = clampByte(Math.round(values[i]! * 255));
      if (bytes[ipix] !== next) {
        bytes[ipix] = next;
        changed = true;
      }
    }
    if (changed) {
      const tex = this.dynamicAttrTextures.get(key);
      if (tex) tex.needsUpdate = true;
    }
  }

  /** Read a dynamic R8 attribute byte at a cell (0..255). Debug helper. */
  getDynamicAttributeByte(key: string, ipix: number): number {
    const bytes = this.dynamicAttrBytes.get(key);
    if (!bytes) return 0;
    return bytes[ipix] ?? 0;
  }

  /**
   * Return the R16F continuous-elevation texture in metres. One value per
   * HEALPix cell, half-float; consumed by the unified globe shader's
   * vertex displacement path. NearestFilter.
   */
  getElevationMetersTexture(): THREE.DataTexture {
    const cached = this.textures.get('elevMeters');
    if (cached) return cached;
    const w = 4 * this.nside;
    const h = 3 * this.nside;
    const u16 = new Uint16Array(
      this.elevMetersBytes.buffer,
      this.elevMetersBytes.byteOffset,
      this.elevMetersBytes.byteLength / 2,
    ) as Uint16Array<ArrayBuffer>;
    const tex = new THREE.DataTexture(u16, w, h, THREE.RedFormat, THREE.HalfFloatType);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    this.textures.set('elevMeters', tex);
    return tex;
  }

  getTexture(attr: AttributeKey): THREE.DataTexture {
    if (attr === 'wasteland') return this.getDynamicAttributeTexture('wasteland');
    const spec = CHANNEL_MAP[attr];
    if (!spec) return this._zeroTexture();
    return this._sourceTexture(spec.source);
  }

  /**
   * Back-compat alias for `getDynamicAttributeTexture('wasteland')`.
   * Render layers (Land / Cities / Highways / VolumetricCloudPass)
   * bind by the typed name.
   */
  getWastelandTexture(): THREE.DataTexture {
    return this.getDynamicAttributeTexture('wasteland');
  }

  /** Back-compat alias for `applyDynamicAttributeFrame('wasteland', …)`. */
  applyWastelandFrame(cells: Uint32Array, values: Float32Array): void {
    this.applyDynamicAttributeFrame('wasteland', cells, values);
  }

  /** Back-compat alias for `getDynamicAttributeByte('wasteland', …)`. */
  getWastelandByte(ipix: number): number {
    return this.getDynamicAttributeByte('wasteland', ipix);
  }

  /**
   * RG8 texture, two bytes per HEALPix cell:
   *   R = slot 0 override class id (0 = no override; 1..14 = TEOW biome)
   *   G = slot 1 override class id (same encoding)
   * Each slot tracks one active climate scenario. Baked atomically by
   * `bakeBiomeOverrideStamps`; companion to `getBiomeOverrideStampTexture`.
   */
  getBiomeOverrideTexture(): THREE.DataTexture {
    const cached = this.textures.get('biomeOverride');
    if (cached) return cached;
    const w = 4 * this.nside;
    const h = 3 * this.nside;
    const data = this.biomeOverrideClassBytes as Uint8Array<ArrayBuffer>;
    const tex = new THREE.DataTexture(data, w, h, THREE.RGFormat, THREE.UnsignedByteType);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    this.textures.set('biomeOverride', tex);
    return tex;
  }

  /**
   * RGBA8 texture, four bytes per HEALPix cell:
   *   R = slot 0 stamp weight `round(weight × 255)`. Multiplied by
   *       `uClimateEnvelope` to derive the slot 0 crossfade strength.
   *   G = slot 0 onset time `round(tStart01 × 255)`. Per-cell remap so
   *       vulnerable biomes start transforming early.
   *   B = slot 1 stamp weight; multiplied by `uClimateEnvelopeB`.
   *   A = slot 1 onset time.
   * Static for each scenario's lifetime — no per-frame writes.
   */
  getBiomeOverrideStampTexture(): THREE.DataTexture {
    const cached = this.textures.get('biomeOverrideStamp');
    if (cached) return cached;
    const w = 4 * this.nside;
    const h = 3 * this.nside;
    const data = this.biomeOverrideStampBytes as Uint8Array<ArrayBuffer>;
    const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.UnsignedByteType);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    this.textures.set('biomeOverrideStamp', tex);
    return tex;
  }

  /**
   * Bake the union of every active climate scenario's biome-override
   * stamps into the two-slot class + stamp textures. Called by the
   * registry at scenario start, end, and auto-repeat — NEVER per frame.
   *
   * The two slots are independent: slot 0 stamps write into class.R
   * (channel byte 0) and stamp.R/G (weight + tStart bytes 0/1); slot 1
   * stamps write into class.G (byte 1) and stamp.B/A (bytes 2/3). For
   * each slot, the highest-weight stamp per cell wins its class id.
   *
   * Both slots are zeroed before either is written, so passing
   * `{ slotA: [], slotB: [] }` clears the textures. One GPU upload per
   * call regardless of stamp size.
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
  }): void {
    this.biomeOverrideClassBytes.fill(0);
    this.biomeOverrideStampBytes.fill(0);
    this.bakeOverrideSlot(input.slotA, 0);
    this.bakeOverrideSlot(input.slotB, 1);
    const clsTex = this.textures.get('biomeOverride');
    if (clsTex) clsTex.needsUpdate = true;
    const stampTex = this.textures.get('biomeOverrideStamp');
    if (stampTex) stampTex.needsUpdate = true;
  }

  private bakeOverrideSlot(
    stamps: readonly {
      cells: Uint32Array;
      values: Float32Array;
      biomeId: number;
      tStart01s?: Float32Array;
    }[],
    slot: 0 | 1,
  ): void {
    const classStride = 2;
    const stampStride = 4;
    const classChannel = slot;                       // 0 = R, 1 = G
    const weightChannel = slot === 0 ? 0 : 2;        // R or B
    const tStartChannel = slot === 0 ? 1 : 3;        // G or A
    const nCells = this.biomeOverrideClassBytes.length / classStride;
    for (let s = 0; s < stamps.length; s++) {
      const stamp = stamps[s]!;
      const cells = stamp.cells;
      const values = stamp.values;
      const tStart01s = stamp.tStart01s ?? null;
      const biomeId = stamp.biomeId & 0xff;
      if (biomeId === 0) continue;
      for (let i = 0; i < cells.length; i++) {
        const ipix = cells[i]!;
        if (ipix >= nCells) continue;
        const v = values[i]!;
        const byte = clampByte(Math.round(v * 255));
        const stampIdx = ipix * stampStride;
        if (byte > this.biomeOverrideStampBytes[stampIdx + weightChannel]!) {
          this.biomeOverrideStampBytes[stampIdx + weightChannel] = byte;
          this.biomeOverrideClassBytes[ipix * classStride + classChannel] = biomeId;
          const tStart = tStart01s ? tStart01s[i]! : 0;
          this.biomeOverrideStampBytes[stampIdx + tStartChannel] = clampByte(Math.round(tStart * 255));
        }
      }
    }
  }

  /**
   * Walk the static attribute buffer once and bin cells by their biome
   * class (G channel, offset 1, stride 4). Returns a class-id → cell-count
   * map. Used by the scenario registry to snapshot the baseline biome
   * census at every climate-class scenario start so per-cell hysteresis
   * flips can drive a live "Forest -3.2M km² / Desert +3.2M km²" readout.
   */
  countBiomesGlobal(): Record<number, number> {
    const counts: Record<number, number> = {};
    const buf = this.staticBytes;
    const npix = buf.length >>> 2;
    for (let i = 0; i < npix; i++) {
      const cls = buf[i * 4 + 1]!;
      counts[cls] = (counts[cls] ?? 0) + 1;
    }
    return counts;
  }

  /**
   * Baseline biome class for a single cell (R-channel-style read of the
   * G byte from the static attribute buffer). The scenario registry uses
   * this per dirty cell during the override hysteresis to decide which
   * class to restore a cell to when its intensity falls below 0.3.
   */
  getBaselineClass(ipix: number): number {
    const idx = ipix * 4 + 1;
    return this.staticBytes[idx] ?? 0;
  }

  /**
   * Apply a sim-emitted `attribute_delta`: for each `(cell, value)` pair,
   * write `round(value * 255)` into the channel byte that matches `attr`,
   * then trigger a GPU upload by flipping the source texture's
   * `needsUpdate` flag. Falls back to a no-op for attributes that aren't
   * backed by the dynamic grid (temperature / vegetation / etc).
   *
   * The texture upload is full-buffer in Phase 4 (Three.js's `DataTexture`
   * has no partial-update affordance without `texSubImage2D`); the dirty
   * cells are still emitted so a future texSub path can land without
   * reshaping this API.
   */
  applyAttributeDelta(attr: AttributeKey, cells: Uint32Array, values: Float32Array): void {
    const offset = dynamicChannelOffset(attr);
    if (offset === null) return;
    if (cells.length !== values.length) return;
    const stride = 4;
    for (let i = 0; i < cells.length; i++) {
      const ipix = cells[i]!;
      const v = values[i]!;
      const byte = clampByte(Math.round(v * 255));
      this.dynamicBytes[ipix * stride + offset] = byte;
    }
    const tex = this.textures.get('dynamic');
    if (tex) tex.needsUpdate = true;
  }

  /**
   * Decode the continuous elevation half-float at a given HEALPix cell.
   * Returns metres above sea level (positive) or below (negative — wells
   * and sub-sea-level basins). The elevation buffer is R16F little-endian;
   * 2 bytes per cell.
   */
  getElevationMetersAtCell(ipix: number): number {
    const byteIdx = ipix * 2;
    const lo = this.elevMetersBytes[byteIdx] ?? 0;
    const hi = this.elevMetersBytes[byteIdx + 1] ?? 0;
    return halfToFloat((hi << 8) | lo);
  }

  /**
   * Fraction of the planet's surface above the given sea level, in [0, 1].
   * HEALPix cells are equal-area, so the answer is just
   * `(cells with elev >= seaLevelM) / total cells`. On the first call we
   * decode and sort every cell's elevation; subsequent calls binary-search
   * the cached array, so per-frame cost is O(log n).
   */
  getLandFraction(seaLevelM: number): number {
    if (!this.sortedElevationsMetersCache) {
      const npix = 12 * this.nside * this.nside;
      const out = new Float32Array(npix);
      const bytes = this.elevMetersBytes;
      for (let ipix = 0; ipix < npix; ipix++) {
        const byteIdx = ipix * 2;
        const lo = bytes[byteIdx] ?? 0;
        const hi = bytes[byteIdx + 1] ?? 0;
        out[ipix] = halfToFloat((hi << 8) | lo);
      }
      out.sort();
      this.sortedElevationsMetersCache = out;
    }
    const sorted = this.sortedElevationsMetersCache;
    const n = sorted.length;
    if (n === 0) return 0;
    // Count of cells strictly below the sea-level cutoff = water count.
    // Land shader uses `elevHere < uSeaLevelOffsetM ? discard`, so `>=` is land.
    let lo = 0;
    let hi = n;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (sorted[mid]! < seaLevelM) lo = mid + 1;
      else hi = mid;
    }
    const waterCount = lo;
    return (n - waterCount) / n;
  }

  getValue(attr: AttributeKey, latDeg: number, lonDeg: number, ipix: number): number {
    const spec = CHANNEL_MAP[attr];
    if (!spec) return 0;
    void latDeg;
    void lonDeg;
    const stride = 4;
    const byteIdx = ipix * stride + spec.byteOffset;
    const buf =
      spec.source === 'static'
        ? this.staticBytes
        : spec.source === 'climate'
          ? this.climateBytes
          : this.dynamicBytes;
    if (spec.byteWidth === 1) return buf[byteIdx] ?? 0;
    // float16 little-endian → number
    const lo = buf[byteIdx] ?? 0;
    const hi = buf[byteIdx + 1] ?? 0;
    return halfToFloat((hi << 8) | lo);
  }

  private _sourceTexture(source: ChannelSource): THREE.DataTexture {
    const cached = this.textures.get(source);
    if (cached) return cached;
    const w = 4 * this.nside;
    const h = 3 * this.nside;
    let tex: THREE.DataTexture;
    // Same TS strict-buffer-type issue as IdRaster.toDataTexture — runtime
    // arrays always sit on plain ArrayBuffer here; cast to satisfy the
    // narrower Uint*Array<ArrayBuffer> generic that DataTexture wants.
    if (source === 'climate') {
      const u16 = new Uint16Array(
        this.climateBytes.buffer,
        this.climateBytes.byteOffset,
        this.climateBytes.byteLength / 2,
      ) as Uint16Array<ArrayBuffer>;
      tex = new THREE.DataTexture(u16, w, h, THREE.RGFormat, THREE.HalfFloatType);
    } else {
      const src = source === 'static' ? this.staticBytes : this.dynamicBytes;
      const data = src as Uint8Array<ArrayBuffer>;
      tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.UnsignedByteType);
    }
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    this.textures.set(source, tex);
    return tex;
  }

  private _zeroTexture(): THREE.DataTexture {
    const cached = this.textures.get('zero');
    if (cached) return cached;
    const tex = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1);
    tex.needsUpdate = true;
    this.textures.set('zero', tex);
    return tex;
  }
}

async function fetchAndCheck(url: string, expectedBytes: number): Promise<ArrayBuffer> {
  const buf = await fetchMaybeGz(url);
  if (buf.byteLength !== expectedBytes) {
    throw new Error(
      `attribute size mismatch at ${url}: got ${buf.byteLength}, expected ${expectedBytes}`,
    );
  }
  return buf;
}

/** IEEE-754 binary16 → number. Used for the climate texture's float16 channels. */
function halfToFloat(h: number): number {
  const sign = (h & 0x8000) >> 15;
  const exp = (h & 0x7c00) >> 10;
  const frac = h & 0x03ff;
  if (exp === 0) return (sign ? -1 : 1) * Math.pow(2, -14) * (frac / 1024);
  if (exp === 0x1f) return frac ? NaN : sign ? -Infinity : Infinity;
  return (sign ? -1 : 1) * Math.pow(2, exp - 15) * (1 + frac / 1024);
}

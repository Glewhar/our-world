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
 * Phase 2's globe shader does NOT sample these (palette + flat shading is the
 * exit-gate look). They're loaded to lock the file format end-to-end so Phase
 * 3 can plug in attribute lerps without re-touching loaders. C2 attributes
 * not present in the bake (vegetation, albedo, population_density,
 * ocean_health) return 0 from `getValue` and a shared zero texture from
 * `getTexture` — Phase 4's sim will populate them.
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

type ChannelSource = 'static' | 'climate' | 'dynamic' | 'wasteland';

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
  water_level_meters: ArtifactRef;
};

export class AttributeTextures {
  static async load(
    refs: AttributeArtifactRefs,
    baseUrl: string,
    nside: number,
  ): Promise<AttributeTextures> {
    const npix = 12 * nside * nside;
    const [staticBuf, climateBuf, dynamicBuf, elevMetersBuf, waterLevelMetersBuf] =
      await Promise.all([
        fetchAndCheck(`${baseUrl}/${refs.attribute_static.path}`, npix * 4),
        fetchAndCheck(`${baseUrl}/${refs.attribute_climate_init.path}`, npix * 4),
        fetchAndCheck(`${baseUrl}/${refs.attribute_dynamic_init.path}`, npix * 4),
        // R16F = 2 bytes per cell.
        fetchAndCheck(`${baseUrl}/${refs.elevation_meters.path}`, npix * 2),
        // R16F = 2 bytes per cell.
        fetchAndCheck(`${baseUrl}/${refs.water_level_meters.path}`, npix * 2),
      ]);
    return new AttributeTextures(
      nside,
      staticBuf,
      climateBuf,
      dynamicBuf,
      elevMetersBuf,
      waterLevelMetersBuf,
    );
  }

  readonly nside: number;
  private readonly staticBytes: Uint8Array;
  private readonly climateBytes: Uint8Array;
  private readonly dynamicBytes: Uint8Array;
  private readonly elevMetersBytes: Uint8Array;
  private readonly waterLevelMetersBytes: Uint8Array;
  /**
   * Wasteland attribute byte-buffer (one R8 per HEALPix cell). Owned by
   * this class for symmetry with the other attribute storage, but writes
   * come from the main-thread `ScenarioRegistry` (NOT the sim worker) —
   * scenarios compose stamps on the fly and call `applyWastelandFrame`.
   * Zero on a fresh bake; never persisted.
   */
  private readonly wastelandBytes: Uint8Array;
  private readonly textures = new Map<
    ChannelSource | 'zero' | 'elevMeters' | 'waterLevelMeters',
    THREE.DataTexture
  >();

  constructor(
    nside: number,
    staticBuf: ArrayBuffer,
    climateBuf: ArrayBuffer,
    dynamicBuf: ArrayBuffer,
    elevMetersBuf: ArrayBuffer,
    waterLevelMetersBuf: ArrayBuffer,
  ) {
    this.nside = nside;
    this.staticBytes = new Uint8Array(staticBuf);
    this.climateBytes = new Uint8Array(climateBuf);
    this.dynamicBytes = new Uint8Array(dynamicBuf);
    this.elevMetersBytes = new Uint8Array(elevMetersBuf);
    this.waterLevelMetersBytes = new Uint8Array(waterLevelMetersBuf);
    this.wastelandBytes = new Uint8Array(12 * nside * nside);
  }

  /**
   * Return the R16F continuous-elevation texture in metres. One value per
   * HEALPix cell, half-float; consumed by the unified globe shader's
   * vertex displacement path. NearestFilter — bilinear smoothing is a
   * v1.1 follow-up.
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

  /**
   * Return the R16F continuous water-surface elevation texture in metres.
   * One value per HEALPix cell, half-float; consumed by the water mesh's
   * vertex displacement path. NearestFilter — bilinear smoothing is a
   * v1.1 follow-up.
   */
  getWaterLevelMetersTexture(): THREE.DataTexture {
    const cached = this.textures.get('waterLevelMeters');
    if (cached) return cached;
    const w = 4 * this.nside;
    const h = 3 * this.nside;
    const u16 = new Uint16Array(
      this.waterLevelMetersBytes.buffer,
      this.waterLevelMetersBytes.byteOffset,
      this.waterLevelMetersBytes.byteLength / 2,
    ) as Uint16Array<ArrayBuffer>;
    const tex = new THREE.DataTexture(u16, w, h, THREE.RedFormat, THREE.HalfFloatType);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    this.textures.set('waterLevelMeters', tex);
    return tex;
  }

  getTexture(attr: AttributeKey): THREE.DataTexture {
    if (attr === 'wasteland') return this.getWastelandTexture();
    const spec = CHANNEL_MAP[attr];
    if (!spec) return this._zeroTexture();
    return this._sourceTexture(spec.source);
  }

  /**
   * R8 texture, one byte per HEALPix cell, value scaled `byte / 255` ∈
   * [0, 1]. Driven by the ScenarioRegistry's frame composer — every active
   * scenario's stamp is summed and clamped each frame; cells outside any
   * active stamp stay at 0.
   *
   * Lives on a dedicated texture because the existing `dynamic` slot
   * (fire/ice/infection/pollution) is fully packed; adding a fifth channel
   * would require a new texture either way, and a single-channel R8 is
   * the smallest the GPU side needs.
   */
  getWastelandTexture(): THREE.DataTexture {
    const cached = this.textures.get('wasteland');
    if (cached) return cached;
    const w = 4 * this.nside;
    const h = 3 * this.nside;
    const data = this.wastelandBytes as Uint8Array<ArrayBuffer>;
    const tex = new THREE.DataTexture(data, w, h, THREE.RedFormat, THREE.UnsignedByteType);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    this.textures.set('wasteland', tex);
    return tex;
  }

  /**
   * Push a frame of wasteland values from the ScenarioRegistry. `cells`
   * and `values` line up index-for-index; `values` are floats in [0, 1].
   * Cells not in the list keep whatever they already had — the registry
   * is expected to include cells transitioning back to zero in the list
   * so the texture clears them.
   *
   * Full-buffer upload via `needsUpdate = true` (no `texSubImage2D` in
   * Three.js's DataTexture API). Cost: O(touched cells) for the byte
   * write + one full buffer GPU push.
   */
  applyWastelandFrame(cells: Uint32Array, values: Float32Array): void {
    if (cells.length !== values.length) return;
    let changed = false;
    for (let i = 0; i < cells.length; i++) {
      const ipix = cells[i]!;
      if (ipix >= this.wastelandBytes.length) continue;
      const next = clampByte(Math.round(values[i]! * 255));
      if (this.wastelandBytes[ipix] !== next) {
        this.wastelandBytes[ipix] = next;
        changed = true;
      }
    }
    if (changed) {
      const tex = this.textures.get('wasteland');
      if (tex) tex.needsUpdate = true;
    }
  }

  /** Read the wasteland byte at a cell (0..255). Debug helper. */
  getWastelandByte(ipix: number): number {
    return this.wastelandBytes[ipix] ?? 0;
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

/**
 * Loader for the optional polygon-keyed biome artifacts
 * (`attribute_polygon.bin.gz` + `polygon_lookup.json.gz`).
 *
 * On disk:
 *   - `attribute_polygon.bin`: 2 bytes per equirect pixel, little-endian
 *     uint16 polygon ID (R = low byte, G = high byte). 0 = no-data;
 *     1..N = TEOW polygon (current bake: N ≈ 14k).
 *   - `polygon_lookup.json`: `raster_width`, `raster_height`, and 1..N
 *     polygon entries with biome / realm / centroid / bbox / elev
 *     percentiles.
 *
 * Why a separate path from the ecoregion loader: the polygon raster is
 * an equirect texture sized by the lookup (8192×4096 default), NOT a
 * HEALPix-shaped texture sized as `4*nside × 3*nside`. The land shader
 * `texelFetch`s by equirect UV — one tap per fragment, no HEALPix math
 * on the hot path.
 *
 * Climate scenarios use the column-store typed-array view exposed by
 * `loadPolygonLookup()` to rule-match every polygon in a single pass:
 * sub-millisecond for ~14k polygons.
 */

import * as THREE from 'three';

import { fetchMaybeGz } from './fetch-gz.js';
import type { ArtifactRef } from './types.js';

/**
 * Single polygon row as it sits in `polygon_lookup.json`. Mirrors
 * `PolygonEntry` on the pipeline side. `id` is the 1..N array offset;
 * 0 is reserved for no-data.
 */
export type PolygonEntry = {
  id: number;
  biome: number;
  realm: number;
  eco_id: number;
  name: string;
  lat_c: number;
  lon_c: number;
  lat_min: number;
  lat_max: number;
  lon_min: number;
  lon_max: number;
  elev_min: number;
  elev_p10: number;
  elev_p50: number;
  elev_p90: number;
  elev_max: number;
};

/**
 * Column-store view of `polygon_lookup.json`. Built once at boot from
 * the JSON entries. Each array is length `count + 1`; slot 0 is the
 * no-data sentinel. Climate scenarios sweep `biome[i]`, `latC[i]`,
 * `elevP50[i]` etc. for every polygon i in 1..count and decide whether
 * a rule matches — sub-millisecond for 14k polygons.
 *
 * `entries` keeps the per-row dicts around for debug labels and any
 * future per-polygon UI; the hot path should read the typed arrays.
 */
export type PolygonLookup = {
  count: number;
  entries: readonly PolygonEntry[];
  /** Equirect raster dimensions from the JSON header — the polygon-ID texture is sized to these. */
  rasterWidth: number;
  rasterHeight: number;
  /** `biome[i]` = TEOW biome code (1..14); 0 at slot 0. */
  biome: Int8Array;
  /** `realm[i]` = realm code (1..8); 0 at slot 0. */
  realm: Int8Array;
  latC: Float32Array;
  lonC: Float32Array;
  latMin: Float32Array;
  latMax: Float32Array;
  lonMin: Float32Array;
  lonMax: Float32Array;
  elevMin: Float32Array;
  elevP10: Float32Array;
  elevP50: Float32Array;
  elevP90: Float32Array;
  elevMax: Float32Array;
  realmNames: Record<number, string>;
};

export class PolygonTexture {
  static async load(
    attrRef: ArtifactRef,
    lookupRef: ArtifactRef,
    baseUrl: string,
  ): Promise<PolygonTexture> {
    // Lookup comes first — it tells us the raster dimensions, which
    // we use to size-check the bin payload.
    const lookupRaw = await fetchMaybeGz(`${baseUrl}/${lookupRef.path}`);
    const lookup = decodeLookup(lookupRaw);
    const expectedBytes = lookup.rasterWidth * lookup.rasterHeight * 2;
    const polyBuf = await fetchAndCheck(`${baseUrl}/${attrRef.path}`, expectedBytes);
    return new PolygonTexture(polyBuf, lookup);
  }

  readonly bytes: Uint8Array;
  readonly lookup: PolygonLookup;
  /**
   * Per-polygon override state shipped as three 1D R8 textures. One
   * trio per climate slot (slot 0 and slot 1). Allocated lazily on
   * first `bakeOverrideByPolygon` so a fresh bake doesn't pay the
   * allocation cost when no climate scenario has fired yet.
   */
  private classByPolyBytes: (Uint8Array | null)[] = [null, null];
  private weightByPolyBytes: (Uint8Array | null)[] = [null, null];
  private tStart01ByPolyBytes: (Uint8Array | null)[] = [null, null];
  private classByPolyTex: (THREE.DataTexture | null)[] = [null, null];
  private weightByPolyTex: (THREE.DataTexture | null)[] = [null, null];
  private tStart01ByPolyTex: (THREE.DataTexture | null)[] = [null, null];
  private polyTexCache: THREE.DataTexture | null = null;

  constructor(polyBuf: ArrayBuffer, lookup: PolygonLookup) {
    this.bytes = new Uint8Array(polyBuf);
    this.lookup = lookup;
  }

  /**
   * Equirect RG8 (two uint8 channels) texture. Shader reconstructs
   * `polyId = int(r * 255 + 0.5) | (int(g * 255 + 0.5) << 8)`.
   * Dimensions come from the lookup's `raster_width` / `raster_height`.
   */
  getPolygonTexture(): THREE.DataTexture {
    if (this.polyTexCache) return this.polyTexCache;
    const w = this.lookup.rasterWidth;
    const h = this.lookup.rasterHeight;
    const data = this.bytes as Uint8Array<ArrayBuffer>;
    const tex = new THREE.DataTexture(data, w, h, THREE.RGFormat, THREE.UnsignedByteType);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    this.polyTexCache = tex;
    return tex;
  }

  /** Read the polygon ID at a (lat, lon) by sampling the equirect raster directly. */
  getPolygonIdAt(latDeg: number, lonDeg: number): number {
    const w = this.lookup.rasterWidth;
    const h = this.lookup.rasterHeight;
    const u = ((lonDeg + 180) % 360 + 360) % 360 / 360;
    const v = (90 - latDeg) / 180;
    const px = Math.max(0, Math.min(w - 1, Math.floor(u * w)));
    const py = Math.max(0, Math.min(h - 1, Math.floor(v * h)));
    const byteIdx = (py * w + px) * 2;
    const lo = this.bytes[byteIdx] ?? 0;
    const hi = this.bytes[byteIdx + 1] ?? 0;
    return lo | (hi << 8);
  }

  /**
   * One-byte-per-polygon override-class texture for slot 0/1. Shader
   * `texelFetch`s at `ivec2(polyId, 0)` to read the override target
   * biome. Slot 0 = first active climate scenario; slot 1 = second.
   * Zero everywhere before any climate-class scenario fires.
   */
  getClassByPolygonTexture(slot: 0 | 1): THREE.DataTexture {
    this.ensureSlotAllocated(slot);
    return this.classByPolyTex[slot]!;
  }

  /**
   * One-byte-per-polygon override-weight texture for slot 0/1. Shader
   * multiplies this by `uClimateEnvelope` per fragment to derive the
   * crossfade strength.
   */
  getWeightByPolygonTexture(slot: 0 | 1): THREE.DataTexture {
    this.ensureSlotAllocated(slot);
    return this.weightByPolyTex[slot]!;
  }

  /**
   * One-byte-per-polygon onset-time texture for slot 0/1. Per-polygon
   * `tStart01` so resilient biomes can transform later in the envelope
   * than vulnerable ones.
   */
  getTStart01ByPolygonTexture(slot: 0 | 1): THREE.DataTexture {
    this.ensureSlotAllocated(slot);
    return this.tStart01ByPolyTex[slot]!;
  }

  /**
   * Bake per-polygon override state for one climate slot in one shot.
   * Each array must be length `count + 1` (slot 0 = no-data, 1..count
   * = polygon entries). `weightByPoly` and `tStart01ByPoly` are
   * 0..255 byte values. Trips `needsUpdate` on all three textures so
   * the GPU re-reads on the next render.
   *
   * Passing all-zero arrays clears the slot — equivalent to "no climate
   * scenario active in this slot".
   */
  bakeOverrideByPolygon(
    slot: 0 | 1,
    classByPoly: Uint8Array,
    weightByPoly: Uint8Array,
    tStart01ByPoly: Uint8Array,
  ): void {
    const n = this.lookup.count + 1;
    if (
      classByPoly.length !== n ||
      weightByPoly.length !== n ||
      tStart01ByPoly.length !== n
    ) {
      throw new Error(
        `bakeOverrideByPolygon: arrays must be length ${n}; got ` +
          `[${classByPoly.length}, ${weightByPoly.length}, ${tStart01ByPoly.length}]`,
      );
    }
    this.ensureSlotAllocated(slot);
    this.classByPolyBytes[slot]!.set(classByPoly);
    this.weightByPolyBytes[slot]!.set(weightByPoly);
    this.tStart01ByPolyBytes[slot]!.set(tStart01ByPoly);
    this.classByPolyTex[slot]!.needsUpdate = true;
    this.weightByPolyTex[slot]!.needsUpdate = true;
    this.tStart01ByPolyTex[slot]!.needsUpdate = true;
  }

  /** Zero a slot's three textures in one call. Cheap — single upload trio. */
  clearOverrideSlot(slot: 0 | 1): void {
    if (!this.classByPolyBytes[slot]) return;
    this.classByPolyBytes[slot]!.fill(0);
    this.weightByPolyBytes[slot]!.fill(0);
    this.tStart01ByPolyBytes[slot]!.fill(0);
    this.classByPolyTex[slot]!.needsUpdate = true;
    this.weightByPolyTex[slot]!.needsUpdate = true;
    this.tStart01ByPolyTex[slot]!.needsUpdate = true;
  }

  private ensureSlotAllocated(slot: 0 | 1): void {
    if (this.classByPolyBytes[slot]) return;
    const n = this.lookup.count + 1;
    const classBytes = new Uint8Array(n);
    const weightBytes = new Uint8Array(n);
    const tStartBytes = new Uint8Array(n);
    this.classByPolyBytes[slot] = classBytes;
    this.weightByPolyBytes[slot] = weightBytes;
    this.tStart01ByPolyBytes[slot] = tStartBytes;
    this.classByPolyTex[slot] = makeR8Texture(classBytes, n);
    this.weightByPolyTex[slot] = makeR8Texture(weightBytes, n);
    this.tStart01ByPolyTex[slot] = makeR8Texture(tStartBytes, n);
  }

  dispose(): void {
    if (this.polyTexCache) {
      this.polyTexCache.dispose();
      this.polyTexCache = null;
    }
    for (let s = 0; s < 2; s++) {
      this.classByPolyTex[s]?.dispose();
      this.weightByPolyTex[s]?.dispose();
      this.tStart01ByPolyTex[s]?.dispose();
      this.classByPolyTex[s] = null;
      this.weightByPolyTex[s] = null;
      this.tStart01ByPolyTex[s] = null;
    }
  }
}

function makeR8Texture(bytes: Uint8Array, length: number): THREE.DataTexture {
  const data = bytes as Uint8Array<ArrayBuffer>;
  const tex = new THREE.DataTexture(data, length, 1, THREE.RedFormat, THREE.UnsignedByteType);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

async function fetchAndCheck(url: string, expectedBytes: number): Promise<ArrayBuffer> {
  const buf = await fetchMaybeGz(url);
  if (buf.byteLength !== expectedBytes) {
    throw new Error(
      `attribute_polygon size mismatch at ${url}: got ${buf.byteLength}, expected ${expectedBytes}`,
    );
  }
  return buf;
}

function decodeLookup(raw: ArrayBuffer): PolygonLookup {
  const text = new TextDecoder('utf-8').decode(new Uint8Array(raw));
  const obj = JSON.parse(text) as {
    version: number;
    count: number;
    raster_width: number;
    raster_height: number;
    realm_names: Record<string, string>;
    entries: PolygonEntry[];
  };
  const count = obj.count | 0;
  const entries = obj.entries;
  // The JSON entries are 1..count; we prepend a no-data sentinel at
  // slot 0 so downstream `[i]` indexing matches the on-disk polygon ID.
  const padded: PolygonEntry[] = new Array(count + 1);
  padded[0] = {
    id: 0,
    biome: 0,
    realm: 0,
    eco_id: 0,
    name: '',
    lat_c: 0,
    lon_c: 0,
    lat_min: 0,
    lat_max: 0,
    lon_min: 0,
    lon_max: 0,
    elev_min: 0,
    elev_p10: 0,
    elev_p50: 0,
    elev_p90: 0,
    elev_max: 0,
  };
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]!;
    const id = e.id | 0;
    if (id < 1 || id > count) {
      throw new Error(`polygon_lookup: id ${id} out of range 1..${count}`);
    }
    padded[id] = e;
  }
  const biome = new Int8Array(count + 1);
  const realm = new Int8Array(count + 1);
  const latC = new Float32Array(count + 1);
  const lonC = new Float32Array(count + 1);
  const latMin = new Float32Array(count + 1);
  const latMax = new Float32Array(count + 1);
  const lonMin = new Float32Array(count + 1);
  const lonMax = new Float32Array(count + 1);
  const elevMin = new Float32Array(count + 1);
  const elevP10 = new Float32Array(count + 1);
  const elevP50 = new Float32Array(count + 1);
  const elevP90 = new Float32Array(count + 1);
  const elevMax = new Float32Array(count + 1);
  for (let i = 0; i <= count; i++) {
    const e = padded[i]!;
    biome[i] = e.biome | 0;
    realm[i] = e.realm | 0;
    latC[i] = e.lat_c;
    lonC[i] = e.lon_c;
    latMin[i] = e.lat_min;
    latMax[i] = e.lat_max;
    lonMin[i] = e.lon_min;
    lonMax[i] = e.lon_max;
    elevMin[i] = e.elev_min;
    elevP10[i] = e.elev_p10;
    elevP50[i] = e.elev_p50;
    elevP90[i] = e.elev_p90;
    elevMax[i] = e.elev_max;
  }
  const realmNames: Record<number, string> = {};
  for (const k of Object.keys(obj.realm_names)) {
    realmNames[Number(k)] = obj.realm_names[k]!;
  }
  return {
    count,
    entries: padded,
    rasterWidth: obj.raster_width | 0,
    rasterHeight: obj.raster_height | 0,
    biome,
    realm,
    latC,
    lonC,
    latMin,
    latMax,
    lonMin,
    lonMax,
    elevMin,
    elevP10,
    elevP50,
    elevP90,
    elevMax,
    realmNames,
  };
}

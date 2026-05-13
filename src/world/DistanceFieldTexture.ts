/**
 * Distance field texture loader. Fetches `distance_field.bin`, parses
 * the 32-byte header, and uploads the body as a Three `DataTexture` of
 * format `RGFormat` + `HalfFloatType`. Sampled by the land shader for
 * smooth coastline + biome-edge transitions.
 *
 * Byte layout (mirrors `wind_field`'s pattern):
 *   - 32-byte header: magic 'DSTF' + version + width + height + 16
 *     reserved
 *   - body: width × height × (signed_coast_km_f16, biome_edge_km_f16)
 *     interleaved
 *
 * R = signed kilometres to nearest coastline (positive on land,
 * negative in water). G = kilometres to nearest biome-class boundary.
 *
 * Both channels are clipped to ±255 km at bake time, well within
 * float16 range. Bilinear filtering is the whole point of this texture
 * — sub-cell precision is what gives the shader continuous coast
 * alpha.
 *
 * Lives in `world/` because manifest artifact loading is the world
 * layer's responsibility — render is a read-only consumer. Render code
 * calls `world.getDistanceFieldTexture()` to bind it.
 *
 * Byte-layout spec lives in
 * [`data-pipeline/src/earth_pipeline/distance_field.py`](../../../data-pipeline/src/earth_pipeline/distance_field.py).
 */

import * as THREE from 'three';

import { fetchMaybeGz } from './fetch-gz.js';

const DSTF_MAGIC = 0x46545344; // little-endian u32 of b"DSTF"
const DSTF_VERSION = 1;
const HEADER_BYTES = 32;

export type DistanceFieldHeader = {
  width: number;
  height: number;
};

export class DistanceFieldTexture {
  private constructor(
    readonly texture: THREE.DataTexture,
    readonly header: DistanceFieldHeader,
  ) {}

  static async load(url: string): Promise<DistanceFieldTexture> {
    const buf = await fetchMaybeGz(url);
    if (buf.byteLength < HEADER_BYTES) {
      throw new Error(`distance_field too small: ${buf.byteLength} bytes < header ${HEADER_BYTES}`);
    }
    const header = new DataView(buf, 0, HEADER_BYTES);
    const magic = header.getUint32(0, true);
    const version = header.getUint32(4, true);
    const width = header.getUint32(8, true);
    const height = header.getUint32(12, true);
    if (magic !== DSTF_MAGIC) {
      throw new Error(
        `distance_field bad magic: 0x${magic.toString(16)} (expected 0x${DSTF_MAGIC.toString(16)})`,
      );
    }
    if (version !== DSTF_VERSION) {
      throw new Error(`distance_field unsupported version: ${version}`);
    }
    const expectedBytes = HEADER_BYTES + width * height * 4;
    if (buf.byteLength !== expectedBytes) {
      throw new Error(
        `distance_field size mismatch: got ${buf.byteLength}, expected ${expectedBytes} (${width}×${height})`,
      );
    }

    // Body is interleaved (coast_km, biome_km) per pixel as float16. Three's
    // DataTexture with HalfFloatType + RGFormat reads exactly this layout.
    const body = new Uint16Array(buf, HEADER_BYTES, width * height * 2);
    const data = body as Uint16Array<ArrayBuffer>;

    const tex = new THREE.DataTexture(data, width, height, THREE.RGFormat, THREE.HalfFloatType);
    // Bilinear is the whole reason this texture exists — sub-pixel
    // smoothing on the coastline alpha + biome edge fade.
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    // Wrap-x: longitude is cyclic (lon = -180° wraps to +180°).
    // Wrap-y: latitude is clamped (poles).
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;

    return new DistanceFieldTexture(tex, { width, height });
  }

  dispose(): void {
    this.texture.dispose();
  }
}

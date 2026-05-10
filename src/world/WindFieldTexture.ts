/**
 * Wind field texture loader. Fetches `wind_field.bin`, parses the 32-byte
 * header, and uploads the body as a Three `DataTexture` of format `RGFormat`
 * + `HalfFloatType`. Consumed by `VolumetricCloudPass` for cloud advection.
 *
 * File format spec lives in
 * [`docs/adr/0009-wind-field-byte-format.md`](../../../docs/adr/0009-wind-field-byte-format.md).
 *
 * Byte layout: 32-byte header (magic 'WIND' + version + width + height +
 * 16 reserved) + width × height × (u_f16, v_f16) interleaved.
 *
 * Lives in `world/` because manifest artifact loading is the world layer's
 * responsibility — render is a read-only consumer. Render code calls
 * `world.getWindFieldTexture()` to bind it.
 */

import * as THREE from 'three';

import { fetchMaybeGz } from './fetch-gz.js';

const WIND_MAGIC = 0x444e4957; // little-endian u32 of b"WIND"
const WIND_VERSION = 1;
const HEADER_BYTES = 32;

export type WindFieldHeader = {
  width: number;
  height: number;
};

export class WindFieldTexture {
  private constructor(
    readonly texture: THREE.DataTexture,
    readonly header: WindFieldHeader,
  ) {}

  static async load(url: string): Promise<WindFieldTexture> {
    const buf = await fetchMaybeGz(url);
    if (buf.byteLength < HEADER_BYTES) {
      throw new Error(`wind_field too small: ${buf.byteLength} bytes < header ${HEADER_BYTES}`);
    }
    const header = new DataView(buf, 0, HEADER_BYTES);
    const magic = header.getUint32(0, true);
    const version = header.getUint32(4, true);
    const width = header.getUint32(8, true);
    const height = header.getUint32(12, true);
    if (magic !== WIND_MAGIC) {
      throw new Error(
        `wind_field bad magic: 0x${magic.toString(16)} (expected 0x${WIND_MAGIC.toString(16)})`,
      );
    }
    if (version !== WIND_VERSION) {
      throw new Error(`wind_field unsupported version: ${version}`);
    }
    const expectedBytes = HEADER_BYTES + width * height * 4;
    if (buf.byteLength !== expectedBytes) {
      throw new Error(
        `wind_field size mismatch: got ${buf.byteLength}, expected ${expectedBytes} (${width}×${height})`,
      );
    }

    // Body is interleaved (u, v) per pixel as Uint16-encoded float16. Three's
    // DataTexture with HalfFloatType + RGFormat reads exactly this layout.
    const body = new Uint16Array(buf, HEADER_BYTES, width * height * 2);
    const data = body as Uint16Array<ArrayBuffer>;

    const tex = new THREE.DataTexture(data, width, height, THREE.RGFormat, THREE.HalfFloatType);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    // Wrap-x: longitude is cyclic (lon = -180° wraps to +180°).
    // Wrap-y: latitude is clamped (poles).
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;

    return new WindFieldTexture(tex, { width, height });
  }

  dispose(): void {
    this.texture.dispose();
  }
}

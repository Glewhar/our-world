/**
 * Ocean currents texture loader. Fetches `ocean_currents.bin`, parses
 * the 32-byte header, and uploads the body as a Three `DataTexture` of
 * format `RGFormat` + `HalfFloatType`. Consumed by the water shader to
 * drive two surface effects: a speed-based colour tint (`currentSpeedTint`)
 * and a static warp of the ripple-noise sample point (`uShimmerCurrentDrift`).
 *
 * Byte layout is identical to `wind_field.bin` (see
 * [`WindFieldTexture.ts`](./WindFieldTexture.ts)) — only the 4-byte
 * magic differs (`OCUR` here, `WIND` there). Land cells store (0, 0)
 * so the renderer can mask them out via `length(current) > 0`.
 *
 * Lives in `world/` because manifest artifact loading is the world
 * layer's responsibility — render is a read-only consumer. Render code
 * calls `world.getOceanCurrentsTexture()` to bind it.
 */

import * as THREE from 'three';

import { fetchMaybeGz } from './fetch-gz.js';

const OCUR_MAGIC = 0x5255434f; // little-endian u32 of b"OCUR"
const OCUR_VERSION = 1;
const HEADER_BYTES = 32;

export type OceanCurrentsHeader = {
  width: number;
  height: number;
};

export class OceanCurrentsTexture {
  private constructor(
    readonly texture: THREE.DataTexture,
    readonly header: OceanCurrentsHeader,
  ) {}

  static async load(url: string): Promise<OceanCurrentsTexture> {
    const buf = await fetchMaybeGz(url);
    if (buf.byteLength < HEADER_BYTES) {
      throw new Error(
        `ocean_currents too small: ${buf.byteLength} bytes < header ${HEADER_BYTES}`,
      );
    }
    const header = new DataView(buf, 0, HEADER_BYTES);
    const magic = header.getUint32(0, true);
    const version = header.getUint32(4, true);
    const width = header.getUint32(8, true);
    const height = header.getUint32(12, true);
    if (magic !== OCUR_MAGIC) {
      throw new Error(
        `ocean_currents bad magic: 0x${magic.toString(16)} (expected 0x${OCUR_MAGIC.toString(16)})`,
      );
    }
    if (version !== OCUR_VERSION) {
      throw new Error(`ocean_currents unsupported version: ${version}`);
    }
    const expectedBytes = HEADER_BYTES + width * height * 4;
    if (buf.byteLength !== expectedBytes) {
      throw new Error(
        `ocean_currents size mismatch: got ${buf.byteLength}, expected ${expectedBytes} (${width}×${height})`,
      );
    }

    const body = new Uint16Array(buf, HEADER_BYTES, width * height * 2);
    const data = body as Uint16Array<ArrayBuffer>;

    const tex = new THREE.DataTexture(data, width, height, THREE.RGFormat, THREE.HalfFloatType);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;

    return new OceanCurrentsTexture(tex, { width, height });
  }

  dispose(): void {
    this.texture.dispose();
  }
}

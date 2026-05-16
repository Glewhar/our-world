/**
 * Wind field texture loader. Fetches `wind_field.bin`, parses the 32-byte
 * header, and uploads the body as a Three `DataTexture` of format `RGFormat`
 * + `HalfFloatType`. Consumed by `VolumetricCloudPass` for cloud advection.
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
export class WindFieldTexture {
    texture;
    header;
    body;
    constructor(texture, header, body) {
        this.texture = texture;
        this.header = header;
        this.body = body;
    }
    /**
     * Nearest-neighbour CPU sample. Returns the (u, v) wind vector in m/s:
     * `u` is eastward, `v` is northward, both in the lat-tangent frame at
     * the queried point. Image space: x = lon (cyclic), y = lat (clamped).
     */
    sample(latDeg, lonDeg) {
        const { width, height } = this.header;
        // Wrap lon into [-180, 180), then map to [0, width). Clamp lat to [-90, 90].
        let lon = lonDeg;
        while (lon < -180)
            lon += 360;
        while (lon >= 180)
            lon -= 360;
        const xN = (lon + 180) / 360;
        const yN = (90 - Math.max(-90, Math.min(90, latDeg))) / 180;
        let xi = Math.floor(xN * width);
        let yi = Math.floor(yN * height);
        if (xi < 0)
            xi = 0;
        if (xi >= width)
            xi = width - 1;
        if (yi < 0)
            yi = 0;
        if (yi >= height)
            yi = height - 1;
        const idx = (yi * width + xi) * 2;
        return {
            u: halfToFloat(this.body[idx] ?? 0),
            v: halfToFloat(this.body[idx + 1] ?? 0),
        };
    }
    static async load(url) {
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
            throw new Error(`wind_field bad magic: 0x${magic.toString(16)} (expected 0x${WIND_MAGIC.toString(16)})`);
        }
        if (version !== WIND_VERSION) {
            throw new Error(`wind_field unsupported version: ${version}`);
        }
        const expectedBytes = HEADER_BYTES + width * height * 4;
        if (buf.byteLength !== expectedBytes) {
            throw new Error(`wind_field size mismatch: got ${buf.byteLength}, expected ${expectedBytes} (${width}×${height})`);
        }
        // Body is interleaved (u, v) per pixel as Uint16-encoded float16. Three's
        // DataTexture with HalfFloatType + RGFormat reads exactly this layout.
        const body = new Uint16Array(buf, HEADER_BYTES, width * height * 2);
        const data = body;
        const tex = new THREE.DataTexture(data, width, height, THREE.RGFormat, THREE.HalfFloatType);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        // Wrap-x: longitude is cyclic (lon = -180° wraps to +180°).
        // Wrap-y: latitude is clamped (poles).
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.needsUpdate = true;
        return new WindFieldTexture(tex, { width, height }, body);
    }
    dispose() {
        this.texture.dispose();
    }
}
function halfToFloat(h) {
    const sign = (h & 0x8000) >> 15;
    const exp = (h & 0x7c00) >> 10;
    const frac = h & 0x03ff;
    if (exp === 0)
        return (sign ? -1 : 1) * Math.pow(2, -14) * (frac / 1024);
    if (exp === 0x1f)
        return frac ? NaN : sign ? -Infinity : Infinity;
    return (sign ? -1 : 1) * Math.pow(2, exp - 15) * (1 + frac / 1024);
}

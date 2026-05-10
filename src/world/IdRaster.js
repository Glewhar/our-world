/**
 * HEALPix ID raster — the picking source-of-truth.
 *
 * On disk: bare little-endian uint32 array, length `12·nside²` (e.g. 49,152
 * at nside=64; 12.6 M at nside=1024). Each pixel value is `body_index + 1`,
 * with 0 reserved for "no body" (open ocean fallback).
 *
 * Picking flow used by `WorldRuntime.pickFromRay`:
 *   ray ⋂ unit sphere → world XYZ → (lat, lon) → (z, phi) → HEALPix cell → bodyIndex.
 *
 * The C2 interface also exposes the raster as a GPU `DataTexture`. Phase 2's
 * stylized shader doesn't actually sample it (vertex `_BODY_ID` already drives
 * per-body shading), but the interface must return one. We build it lazily.
 */
import * as THREE from 'three';
import { fetchMaybeGz } from './fetch-gz.js';
import { zPhiToPix } from './healpix.js';
const DEG = Math.PI / 180;
export class IdRaster {
    cells;
    nside;
    ordering;
    static async load(url, nside, ordering) {
        const buffer = await fetchMaybeGz(url);
        const expected = 12 * nside * nside * 4;
        if (buffer.byteLength !== expected) {
            throw new Error(`id_raster size mismatch: got ${buffer.byteLength} bytes, expected ${expected} for nside=${nside}`);
        }
        return new IdRaster(new Uint32Array(buffer), nside, ordering);
    }
    texture = null;
    constructor(cells, nside, ordering) {
        this.cells = cells;
        this.nside = nside;
        this.ordering = ordering;
    }
    bodyIndexAtCell(ipix) {
        if (ipix < 0 || ipix >= this.cells.length)
            return 0;
        return this.cells[ipix] ?? 0;
    }
    bodyIndexAt(latDeg, lonDeg) {
        const z = Math.sin(latDeg * DEG);
        const phi = lonDeg * DEG;
        const ipix = zPhiToPix(this.nside, this.ordering, z, phi);
        return this.bodyIndexAtCell(ipix);
    }
    /**
     * Lazy-build the GPU texture. Layout: `width = 4·nside`, `height = 3·nside`,
     * so total = 12·nside² = npix. Both dimensions stay under WebGL2's typical
     * 16,384 max even at nside=1024 (4096 × 3072).
     *
     * Format is RGBA8 — the body index packs across R/G/B (24 bits = 16 M
     * possible bodies, far more than any real Earth bake will produce), and
     * A is a sentinel: 0 = ocean (id == 0), 255 = land. Mali drivers fast-
     * path RGBA8 sampling but slow-path the integer R32_UINT format we used
     * before; the shader-side unpack helper (`unpackBodyId` in healpix.glsl)
     * keeps the body-id math identical, and the alpha sentinel lets the hot
     * `is-ocean` checks branch on a single byte compare instead of a
     * 24-bit unpack.
     */
    toDataTexture() {
        if (this.texture)
            return this.texture;
        const width = 4 * this.nside;
        const height = 3 * this.nside;
        const packed = new Uint8Array(this.cells.length * 4);
        for (let i = 0; i < this.cells.length; i++) {
            const id = this.cells[i] ?? 0;
            packed[i * 4 + 0] = id & 0xff;
            packed[i * 4 + 1] = (id >> 8) & 0xff;
            packed[i * 4 + 2] = (id >> 16) & 0xff;
            packed[i * 4 + 3] = id === 0 ? 0 : 255;
        }
        const tex = new THREE.DataTexture(packed, width, height, THREE.RGBAFormat, THREE.UnsignedByteType);
        tex.minFilter = THREE.NearestFilter;
        tex.magFilter = THREE.NearestFilter;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.needsUpdate = true;
        this.texture = tex;
        return tex;
    }
}

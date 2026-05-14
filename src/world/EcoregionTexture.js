/**
 * Loader for the optional ecoregion artifacts (`attribute_eco.bin.gz` +
 * `ecoregion_lookup.json.gz`).
 *
 * On disk:
 *   - `attribute_eco.bin`: 2 bytes per HEALPix cell, little-endian uint16
 *     dense ecoregion index (R = low byte, G = high byte). 0 = no data;
 *     1..N = WWF TEOW ecoregion (current bake: N = 825).
 *   - `ecoregion_lookup.json`: 1 + N entries, slot 0 = sentinel, each
 *     entry `{biome: 1..14, realm: 1..8, eco_id: native, name: string}`.
 *
 * The land shader's BiomeColorEquirect bake reads the RG8 texture via
 * `texelFetch`, reconstructs `idx = r + g * 256`, and looks the colour
 * up in a CPU-built 1D palette texture (composed from
 * `biomePalette[14] × realmTint[8] × jitter`). Old bakes that predate
 * Phase 2.B don't ship these artifacts; the loader returns null and the
 * shader falls back to the legacy 14-biome path.
 */
import * as THREE from 'three';
import { fetchMaybeGz } from './fetch-gz.js';
export class EcoregionTexture {
    static async load(attrRef, lookupRef, baseUrl, nside) {
        const npix = 12 * nside * nside;
        const [ecoBuf, lookupRaw] = await Promise.all([
            fetchAndCheck(`${baseUrl}/${attrRef.path}`, npix * 2),
            fetchMaybeGz(`${baseUrl}/${lookupRef.path}`),
        ]);
        const lookup = decodeLookup(lookupRaw);
        return new EcoregionTexture(nside, ecoBuf, lookup);
    }
    nside;
    bytes;
    lookup;
    texCache = null;
    constructor(nside, ecoBuf, lookup) {
        this.nside = nside;
        this.bytes = new Uint8Array(ecoBuf);
        this.lookup = lookup;
    }
    /**
     * RG8 DataTexture, one (R = low byte, G = high byte) pair per HEALPix
     * cell. Shader reconstructs the dense ecoregion index as
     * `int(r * 255 + 0.5) | (int(g * 255 + 0.5) << 8)`. NearestFilter so
     * each tap reads the discrete index without bilinear bleed across
     * cells.
     */
    getTexture() {
        if (this.texCache)
            return this.texCache;
        const w = 4 * this.nside;
        const h = 3 * this.nside;
        const data = this.bytes;
        const tex = new THREE.DataTexture(data, w, h, THREE.RGFormat, THREE.UnsignedByteType);
        tex.minFilter = THREE.NearestFilter;
        tex.magFilter = THREE.NearestFilter;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.needsUpdate = true;
        this.texCache = tex;
        return tex;
    }
    /** Read the dense ecoregion index at a HEALPix cell (0..count). */
    getDenseIndexAtCell(ipix) {
        const byteIdx = ipix * 2;
        const lo = this.bytes[byteIdx] ?? 0;
        const hi = this.bytes[byteIdx + 1] ?? 0;
        return lo | (hi << 8);
    }
    dispose() {
        if (this.texCache) {
            this.texCache.dispose();
            this.texCache = null;
        }
    }
}
async function fetchAndCheck(url, expectedBytes) {
    const buf = await fetchMaybeGz(url);
    if (buf.byteLength !== expectedBytes) {
        throw new Error(`attribute_eco size mismatch at ${url}: got ${buf.byteLength}, expected ${expectedBytes}`);
    }
    return buf;
}
function decodeLookup(raw) {
    const text = new TextDecoder('utf-8').decode(new Uint8Array(raw));
    const obj = JSON.parse(text);
    const count = obj.count | 0;
    const entries = obj.entries;
    if (entries.length !== count + 1) {
        throw new Error(`ecoregion_lookup: entries length ${entries.length} != count+1 (${count + 1})`);
    }
    const biome = new Uint8Array(count + 1);
    const realm = new Uint8Array(count + 1);
    for (let i = 0; i <= count; i++) {
        const e = entries[i];
        biome[i] = e.biome | 0;
        realm[i] = e.realm | 0;
    }
    const realmNames = {};
    for (const k of Object.keys(obj.realm_names)) {
        realmNames[Number(k)] = obj.realm_names[k];
    }
    return { count, entries, biome, realm, realmNames };
}

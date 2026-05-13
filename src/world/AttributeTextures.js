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
/**
 * Translate a C2 `AttributeKey` into the dynamic-grid channel offset.
 * Mirrored from `web/src/sim/fields/grid.ts` so the world runtime
 * doesn't have to import a sim module (keeps the boundary clean).
 */
function dynamicChannelOffset(attr) {
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
function clampByte(v) {
    if (!Number.isFinite(v))
        return 0;
    if (v <= 0)
        return 0;
    if (v >= 255)
        return 255;
    return v | 0;
}
const CHANNEL_MAP = {
    elevation: { source: 'static', byteOffset: 0, byteWidth: 1 },
    temperature: { source: 'climate', byteOffset: 0, byteWidth: 2 },
    moisture: { source: 'climate', byteOffset: 2, byteWidth: 2 },
    fire: { source: 'dynamic', byteOffset: 0, byteWidth: 1 },
    ice: { source: 'dynamic', byteOffset: 1, byteWidth: 1 },
    infection: { source: 'dynamic', byteOffset: 2, byteWidth: 1 },
    pollution: { source: 'dynamic', byteOffset: 3, byteWidth: 1 },
};
export class AttributeTextures {
    static async load(refs, baseUrl, nside) {
        const npix = 12 * nside * nside;
        const [staticBuf, climateBuf, dynamicBuf, elevMetersBuf, waterLevelMetersBuf] = await Promise.all([
            fetchAndCheck(`${baseUrl}/${refs.attribute_static.path}`, npix * 4),
            fetchAndCheck(`${baseUrl}/${refs.attribute_climate_init.path}`, npix * 4),
            fetchAndCheck(`${baseUrl}/${refs.attribute_dynamic_init.path}`, npix * 4),
            // R16F = 2 bytes per cell.
            fetchAndCheck(`${baseUrl}/${refs.elevation_meters.path}`, npix * 2),
            // R16F = 2 bytes per cell.
            fetchAndCheck(`${baseUrl}/${refs.water_level_meters.path}`, npix * 2),
        ]);
        return new AttributeTextures(nside, staticBuf, climateBuf, dynamicBuf, elevMetersBuf, waterLevelMetersBuf);
    }
    nside;
    staticBytes;
    climateBytes;
    dynamicBytes;
    elevMetersBytes;
    waterLevelMetersBytes;
    textures = new Map();
    constructor(nside, staticBuf, climateBuf, dynamicBuf, elevMetersBuf, waterLevelMetersBuf) {
        this.nside = nside;
        this.staticBytes = new Uint8Array(staticBuf);
        this.climateBytes = new Uint8Array(climateBuf);
        this.dynamicBytes = new Uint8Array(dynamicBuf);
        this.elevMetersBytes = new Uint8Array(elevMetersBuf);
        this.waterLevelMetersBytes = new Uint8Array(waterLevelMetersBuf);
    }
    /**
     * Return the R16F continuous-elevation texture in metres. One value per
     * HEALPix cell, half-float; consumed by the unified globe shader's
     * vertex displacement path. NearestFilter — bilinear smoothing is a
     * v1.1 follow-up.
     */
    getElevationMetersTexture() {
        const cached = this.textures.get('elevMeters');
        if (cached)
            return cached;
        const w = 4 * this.nside;
        const h = 3 * this.nside;
        const u16 = new Uint16Array(this.elevMetersBytes.buffer, this.elevMetersBytes.byteOffset, this.elevMetersBytes.byteLength / 2);
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
    getWaterLevelMetersTexture() {
        const cached = this.textures.get('waterLevelMeters');
        if (cached)
            return cached;
        const w = 4 * this.nside;
        const h = 3 * this.nside;
        const u16 = new Uint16Array(this.waterLevelMetersBytes.buffer, this.waterLevelMetersBytes.byteOffset, this.waterLevelMetersBytes.byteLength / 2);
        const tex = new THREE.DataTexture(u16, w, h, THREE.RedFormat, THREE.HalfFloatType);
        tex.minFilter = THREE.NearestFilter;
        tex.magFilter = THREE.NearestFilter;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.needsUpdate = true;
        this.textures.set('waterLevelMeters', tex);
        return tex;
    }
    getTexture(attr) {
        const spec = CHANNEL_MAP[attr];
        if (!spec)
            return this._zeroTexture();
        return this._sourceTexture(spec.source);
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
    applyAttributeDelta(attr, cells, values) {
        const offset = dynamicChannelOffset(attr);
        if (offset === null)
            return;
        if (cells.length !== values.length)
            return;
        const stride = 4;
        for (let i = 0; i < cells.length; i++) {
            const ipix = cells[i];
            const v = values[i];
            const byte = clampByte(Math.round(v * 255));
            this.dynamicBytes[ipix * stride + offset] = byte;
        }
        const tex = this.textures.get('dynamic');
        if (tex)
            tex.needsUpdate = true;
    }
    /**
     * Decode the continuous elevation half-float at a given HEALPix cell.
     * Returns metres above sea level (positive) or below (negative — wells
     * and sub-sea-level basins). The elevation buffer is R16F little-endian;
     * 2 bytes per cell.
     */
    getElevationMetersAtCell(ipix) {
        const byteIdx = ipix * 2;
        const lo = this.elevMetersBytes[byteIdx] ?? 0;
        const hi = this.elevMetersBytes[byteIdx + 1] ?? 0;
        return halfToFloat((hi << 8) | lo);
    }
    getValue(attr, latDeg, lonDeg, ipix) {
        const spec = CHANNEL_MAP[attr];
        if (!spec)
            return 0;
        void latDeg;
        void lonDeg;
        const stride = 4;
        const byteIdx = ipix * stride + spec.byteOffset;
        const buf = spec.source === 'static'
            ? this.staticBytes
            : spec.source === 'climate'
                ? this.climateBytes
                : this.dynamicBytes;
        if (spec.byteWidth === 1)
            return buf[byteIdx] ?? 0;
        // float16 little-endian → number
        const lo = buf[byteIdx] ?? 0;
        const hi = buf[byteIdx + 1] ?? 0;
        return halfToFloat((hi << 8) | lo);
    }
    _sourceTexture(source) {
        const cached = this.textures.get(source);
        if (cached)
            return cached;
        const w = 4 * this.nside;
        const h = 3 * this.nside;
        let tex;
        // Same TS strict-buffer-type issue as IdRaster.toDataTexture — runtime
        // arrays always sit on plain ArrayBuffer here; cast to satisfy the
        // narrower Uint*Array<ArrayBuffer> generic that DataTexture wants.
        if (source === 'climate') {
            const u16 = new Uint16Array(this.climateBytes.buffer, this.climateBytes.byteOffset, this.climateBytes.byteLength / 2);
            tex = new THREE.DataTexture(u16, w, h, THREE.RGFormat, THREE.HalfFloatType);
        }
        else {
            const src = source === 'static' ? this.staticBytes : this.dynamicBytes;
            const data = src;
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
    _zeroTexture() {
        const cached = this.textures.get('zero');
        if (cached)
            return cached;
        const tex = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1);
        tex.needsUpdate = true;
        this.textures.set('zero', tex);
        return tex;
    }
}
async function fetchAndCheck(url, expectedBytes) {
    const buf = await fetchMaybeGz(url);
    if (buf.byteLength !== expectedBytes) {
        throw new Error(`attribute size mismatch at ${url}: got ${buf.byteLength}, expected ${expectedBytes}`);
    }
    return buf;
}
/** IEEE-754 binary16 → number. Used for the climate texture's float16 channels. */
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

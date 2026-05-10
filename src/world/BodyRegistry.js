/**
 * In-memory body lookup keyed off the C1 manifest's `bodies[]` array.
 *
 * The id_raster encodes pixels as `manifest_index + 1`, so `getByIndex` is
 * 1-based to match — passing 0 returns null (the "no body" sentinel).
 *
 * Spatial queries (`getBodyAt(lat, lon)`) live on `WorldRuntime`, not here:
 * they require the IdRaster, and the C2 facade is the right place to compose
 * the two.
 */
export class BodyRegistry {
    idIndex = new Map();
    bodies;
    constructor(bodies) {
        this.bodies = bodies;
        bodies.forEach((b, i) => this.idIndex.set(b.id, i));
    }
    get count() {
        return this.bodies.length;
    }
    getBody(id) {
        const i = this.idIndex.get(id);
        return i === undefined ? null : (this.bodies[i] ?? null);
    }
    /** 1-based: `index === 0` returns null (matches id_raster's "no body" encoding). */
    getByIndex(index) {
        if (index <= 0 || index > this.bodies.length)
            return null;
        return this.bodies[index - 1] ?? null;
    }
    getByType(type) {
        return this.bodies.filter((b) => b.type === type);
    }
}

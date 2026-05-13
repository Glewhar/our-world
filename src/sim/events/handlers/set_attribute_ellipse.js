/**
 * `set_attribute_ellipse` — downwind-elongated brush primitive.
 *
 * Stamps a normalized [0, 1] value into one dynamic-grid channel for every
 * cell inside an ellipse whose long axis points along `bearing_deg`.
 *
 * Params (per `setAttributeEllipseEvent` in `events/primitives.ts`):
 *   - `value`           — float, 0..1, written as `round(value × falloff × 255)`.
 *   - `attribute_index` — integer in `ATTRIBUTE_INDEX`, identifies the channel.
 *
 * Location must be `kind: 'ellipse'`; other shapes are no-ops here (the
 * `set_attribute` handler covers points / cells).
 *
 * Geometry lives in `sim/fields/ellipse.ts` — the scenario registry uses
 * the same helper so the shape stays defined once.
 */
import { computeEllipseStamp } from '../../fields/ellipse.js';
import { dynamicChannelOffset } from '../../fields/grid.js';
import { ATTRIBUTE_INDEX } from '../primitives.js';
export function applySetAttributeEllipse(ctx, event) {
    if (event.primitive !== 'set_attribute_ellipse')
        return 0;
    if (event.location.kind !== 'ellipse')
        return 0;
    const value = event.params['value'];
    const attrIndex = event.params['attribute_index'];
    if (typeof value !== 'number' || typeof attrIndex !== 'number')
        return 0;
    const attr = attributeKeyFromIndex(attrIndex);
    if (!attr)
        return 0;
    const channel = dynamicChannelOffset(attr);
    if (channel === null) {
        // Static / climate / wasteland — not backed by the dynamic grid.
        // Drop quietly; the scenario registry handles wasteland through a
        // separate texture sink.
        return 0;
    }
    const loc = event.location;
    const stamp = computeEllipseStamp({
        value,
        centreLatDeg: loc.lat,
        centreLonDeg: loc.lon,
        radiusKm: loc.radius_km,
        stretchKm: loc.stretch_km,
        bearingDeg: loc.bearing_deg,
    }, ctx.nside, ctx.ordering);
    for (let i = 0; i < stamp.cells.length; i++) {
        const ipix = stamp.cells[i];
        const v = stamp.values[i];
        ctx.grid.setByte(ipix, channel, clampByte(Math.round(v * 255)));
    }
    return stamp.cells.length;
}
const ATTR_BY_INDEX = (() => {
    const out = [];
    for (const key of Object.keys(ATTRIBUTE_INDEX)) {
        const i = ATTRIBUTE_INDEX[key];
        out[i] = key;
    }
    return out;
})();
function attributeKeyFromIndex(idx) {
    if (idx < 0 || idx >= ATTR_BY_INDEX.length)
        return null;
    return ATTR_BY_INDEX[idx] ?? null;
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

/**
 * Contract C4 — the WorldEvent primitive vocabulary.
 *
 * This is the FIXED list of things the world can do. Roles (Stage B) compose
 * these primitives to express their abilities — they NEVER introduce new ones.
 * Adding a primitive here requires an ADR and updates to:
 *   - web/src/sim/events/handlers/<primitive>.ts (impl)
 *
 * Per-primitive `params` schemas live as JSDoc on each handler in `handlers/`.
 */
/**
 * Helper for constructing a `set_attribute` event without param-typo bugs.
 * Call sites that pass arbitrary records get no type help — this gives them some.
 */
export function setAttributeEvent(attr, value, location) {
    return {
        primitive: 'set_attribute',
        location,
        params: { value, attribute_index: ATTRIBUTE_INDEX[attr] },
    };
}
/**
 * Helper for constructing a `set_attribute_ellipse` event. Wraps the
 * downwind-elongated ellipse into the shared WorldEvent shape; the
 * primitive's params are identical to `set_attribute`, only the location
 * geometry differs.
 */
export function setAttributeEllipseEvent(attr, value, centreLat, centreLon, radiusKm, stretchKm, bearingDeg) {
    return {
        primitive: 'set_attribute_ellipse',
        location: {
            kind: 'ellipse',
            lat: centreLat,
            lon: centreLon,
            radius_km: radiusKm,
            stretch_km: stretchKm,
            bearing_deg: bearingDeg,
        },
        params: { value, attribute_index: ATTRIBUTE_INDEX[attr] },
    };
}
/**
 * Stable index for AttributeKey — pinned here so handlers + shaders + snapshots
 * agree on the integer encoding regardless of declaration order in types.ts.
 */
export const ATTRIBUTE_INDEX = Object.freeze({
    temperature: 0,
    moisture: 1,
    vegetation: 2,
    fire: 3,
    ice: 4,
    infection: 5,
    pollution: 6,
    albedo: 7,
    population_density: 8,
    ocean_health: 9,
    elevation: 10,
    // Scenario-driven dynamic attribute. NOT backed by the dynamic grid —
    // wasteland lives in a dedicated R8 texture owned by AttributeTextures
    // and recomposed each frame by the ScenarioRegistry. Indexed here so the
    // attribute-key registry stays a single source of truth for shaders +
    // sim, even though the wasteland write path bypasses the dynamic grid.
    wasteland: 11,
});

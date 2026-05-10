/**
 * Contract C4 — the WorldEvent primitive vocabulary.
 *
 * This is the FIXED list of things the world can do. Roles (Stage B) compose
 * these primitives to express their abilities — they NEVER introduce new ones.
 * Adding a primitive here requires an ADR and updates to:
 *   - web/src/sim/events/handlers/<primitive>.ts (impl)
 *   - web/src/debug/sandbox/EventInjectorPanel.ts (UI)
 *   - docs/roles/_primitive_coverage.md (research)
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
});

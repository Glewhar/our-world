/**
 * Glyph factory for the bottom-center vitals HUD.
 *
 * Two free icon packs:
 *   - **Google Material Symbols** (Apache 2.0, Outlined 24 px) — every
 *     monochrome glyph in the HUD. Rendered through a CSS mask layer
 *     painted with `currentColor`, so the surrounding text colour
 *     drives the tint (intact-civ pips amber, ruined pips orange,
 *     biome stencils a darker shade of the hex bg, etc.).
 *   - **Microsoft Fluent UI Emoji** (MIT, Flat variant) — full-colour
 *     emoji for the two states that need intrinsic colour: the
 *     collapsed-city skull pip (cartoon white-on-black skull = "dead")
 *     and the active-bomb radiation pip (cartoon bomb = "live nuke").
 *
 * SVG files live under `web/assets/icons/{color,mono}/` and are served
 * statically by the dev / prod static server.
 *
 * Two HTML wrappers handle each pack's tint behaviour:
 *   - `<img class="hud-icon hud-icon-color" src=…>` for Fluent Emoji.
 *     `<img>` renders the SVG with its baked-in palette; CSS `color`
 *     does NOT apply.
 *   - `<span class="hud-icon hud-icon-mono" style="--icon-url:…">` for
 *     Material Symbols. The span's `background-color` is `currentColor`,
 *     clipped through a `mask-image` of the SVG — so CSS `color`
 *     anywhere up the tree paints the glyph.
 */
const COLOR_BASE = '/assets/icons/color';
const MONO_BASE = '/assets/icons/mono';
function colorIcon(file, label) {
    return `<img class="hud-icon hud-icon-color" src="${COLOR_BASE}/${file}.svg" alt="${label}" draggable="false"/>`;
}
function monoIcon(file, label) {
    return `<span class="hud-icon hud-icon-mono" role="img" aria-label="${label}" style="--icon-url:url('${MONO_BASE}/${file}.svg')"></span>`;
}
/* --- Column icons (left of each module) — Material Symbols, amber tint --- */
/** Material Symbols `eco`. */
export const ICON_BIOSPHERE = monoIcon('eco', 'biosphere');
/** Material Symbols `location_city`. */
export const ICON_CIV = monoIcon('location_city', 'civilization');
/** Material Symbols `dangerous` — radiation column (octagonal hazard mark). */
export const ICON_RAD = monoIcon('dangerous', 'radiation');
/* --- Biome diorama glyphs — Material Symbols, stencilled into the hex.
   Mono lets the hex bg colour read first; the glyph rides on top as a
   shaded relief. */
/** Material Symbols `forest` — lush canopy. */
export const ICON_CAT_RAINFOREST = monoIcon('forest', 'rainforest');
/** Material Symbols `park` — single conifer. */
export const ICON_CAT_TEMPERATE_FOREST = monoIcon('park', 'temperate forest');
/** Material Symbols `grass`. */
export const ICON_CAT_GRASSLAND = monoIcon('grass', 'grassland');
/** Material Symbols `sunny` — arid heat. */
export const ICON_CAT_DESERT = monoIcon('sunny', 'desert');
/** Material Symbols `ac_unit` — snowflake. */
export const ICON_CAT_TUNDRA_ICE = monoIcon('ac_unit', 'tundra / ice');
/** Material Symbols `skull` — wasteland (in-hex; mono so the dark tile
 *  colour still dominates). */
export const ICON_CAT_WASTELAND = monoIcon('skull', 'wasteland');
/* --- Civilization pips — Material Symbols people glyphs, not buildings.
   The column already uses `location_city`; the pip row reads the
   population state, so people glyphs carry the meaning better than a
   second skyline icon. */
/** Material Symbols `groups` — thriving population. */
export const ICON_CITY_PIP = monoIcon('groups', 'population intact');
/** Material Symbols `person` — single survivor after collapse. */
export const ICON_CITY_RUIN = monoIcon('person', 'survivor');
/** Fluent Emoji `skull` — population collapse (colour kept for drama). */
export const ICON_SKULL = colorIcon('skull', 'population collapsed');
/* --- Radiation pip-row — bomb glyphs (NOT trefoils — the column already
   carries the hazard mark). Each active strike lights one bomb pip; >12
   collapses the 12th into a pulsing warning triangle. */
/** Fluent Emoji `bomb` — active strike pip. */
export const ICON_TREFOIL_PIP = colorIcon('bomb', 'bomb active');
/** Material Symbols `warning` — pip-row overflow indicator. */
export const ICON_OVERFLOW_TRI = monoIcon('warning', 'overflow');

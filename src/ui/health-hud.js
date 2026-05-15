/**
 * Bottom-center vitals HUD — three gamified modules, no text, no numbers:
 *
 *   ◯ BIOME          [hex hex hex hex hex hex hex hex hex hex hex hex]
 *   ⌂ CIVILIZATION   [pip pip pip ruin ruin ruin skull skull skull skull skull skull]
 *                    [ alive band ─────────┃─────── dead band ]
 *   ☢ RADIATION      [▓▓▓▓▓▓▓▓░░░░░░░░░░] scan-line shimmer when fill > 0
 *                    [trefoil trefoil trefoil … (one per active bomb)]
 *
 * Each module is its own visualisation primitive matched to the data
 * shape it represents:
 *   - BIOME — 12 hexes assigned via largest-remainder over six diorama
 *     categories. Hex flashes white and crossfades to its new category
 *     colour whenever the share allocation changes its assignment.
 *   - CIVILIZATION — 12 city-tower pips that convert intact → ruin →
 *     skull (left-to-right) as `citiesLost / citiesTotal` rises, plus a
 *     slim alive / dead population band underneath.
 *   - RADIATION — strata bar that **fills** with `s.radiation` (inverted
 *     from the old "remaining health" semantics), shows one tick per
 *     active bomb inside the fill, sweeps a diagonal scan-line over the
 *     bar when fill > 0, and lights up a row of trefoil pips below
 *     (12 max; overflow becomes a pulsing triangle).
 */
import { ICON_BIOSPHERE, ICON_CAT_DESERT, ICON_CAT_GRASSLAND, ICON_CAT_RAINFOREST, ICON_CAT_TEMPERATE_FOREST, ICON_CAT_TUNDRA_ICE, ICON_CAT_WASTELAND, ICON_CITY_PIP, ICON_CITY_RUIN, ICON_CIV, ICON_OVERFLOW_TRI, ICON_RAD, ICON_SKULL, ICON_TREFOIL_PIP, } from './icons.js';
const HEX_COUNT = 12;
const CIV_PIPS = 12;
const RAD_PIPS = 12;
const RAD_FILL_LERP = 0.18;
const CAT_ORDER = [
    'rainforest',
    'temperateForest',
    'grassland',
    'desert',
    'tundraIce',
    'wasteland',
];
const CAT_GLYPH = {
    rainforest: ICON_CAT_RAINFOREST,
    temperateForest: ICON_CAT_TEMPERATE_FOREST,
    grassland: ICON_CAT_GRASSLAND,
    desert: ICON_CAT_DESERT,
    tundraIce: ICON_CAT_TUNDRA_ICE,
    wasteland: ICON_CAT_WASTELAND,
};
export function mountHealthHud(host, registry) {
    host.classList.add('health-hud');
    const biome = mountBiomeHexes(host);
    const civ = mountCivPips(host);
    const rad = mountRadStrata(host);
    function update() {
        const s = registry.getWorldHealth();
        biome.update(s.stats.biomeCategoryShares);
        civ.update(s.stats.citiesLost, s.stats.citiesTotal, s.stats.populationLostPct);
        rad.update(s.radiation, s.stats.bombsActive);
    }
    function dispose() {
        biome.dispose();
        civ.dispose();
        rad.dispose();
    }
    return { update, dispose };
}
function mountBiomeHexes(host) {
    const root = makeModuleShell(host, 'biome', 'Biome', ICON_BIOSPHERE);
    const row = document.createElement('div');
    row.className = 'biome-hex-row';
    const hexes = [];
    const current = [];
    for (let i = 0; i < HEX_COUNT; i++) {
        const hex = document.createElement('div');
        hex.className = 'biome-hex';
        hex.innerHTML = '';
        row.appendChild(hex);
        hexes.push(hex);
        current.push(null);
    }
    root.viz.appendChild(row);
    function update(shares) {
        const allocation = allocateHexes(shares);
        for (let i = 0; i < HEX_COUNT; i++) {
            const next = allocation[i] ?? null;
            if (next === current[i])
                continue;
            const hex = hexes[i];
            if (next) {
                hex.dataset['cat'] = next;
                hex.innerHTML = CAT_GLYPH[next];
            }
            else {
                delete hex.dataset['cat'];
                hex.innerHTML = '';
            }
            // Restart the flash keyframe: drop the class, force reflow, re-add.
            hex.classList.remove('flash');
            void hex.offsetWidth;
            hex.classList.add('flash');
            current[i] = next;
        }
    }
    function dispose() {
        root.root.remove();
    }
    return { update, dispose };
}
/**
 * Largest-remainder allocation of 12 hexes across six category shares.
 * Pure function of `shares` — equal inputs always yield equal outputs,
 * so the diorama never reshuffles unless the underlying composition
 * actually moved. Hexes are emitted in `CAT_ORDER` so the strip reads
 * left-to-right: rainforest → temperate → grassland → desert → ice →
 * wasteland, which keeps degradation visible as a wave from the right
 * end of the row (wasteland) overtaking the green left end.
 */
function allocateHexes(shares) {
    let total = 0;
    for (const cat of CAT_ORDER)
        total += shares[cat];
    if (total <= 0)
        return [];
    const exact = [];
    let assigned = 0;
    for (const cat of CAT_ORDER) {
        const expected = (shares[cat] / total) * HEX_COUNT;
        const floor = Math.floor(expected);
        exact.push({ cat, floor, rem: expected - floor });
        assigned += floor;
    }
    // Distribute the remainder by descending fractional remainder; ties
    // break in CAT_ORDER (the array is already in that order).
    const order = [...exact].sort((a, b) => b.rem - a.rem);
    let idx = 0;
    while (assigned < HEX_COUNT) {
        const target = order[idx % order.length];
        target.floor += 1;
        assigned += 1;
        idx += 1;
    }
    const out = [];
    for (const e of exact) {
        for (let k = 0; k < e.floor; k++)
            out.push(e.cat);
    }
    return out;
}
function mountCivPips(host) {
    const root = makeModuleShell(host, 'civ', 'Civilization', ICON_CIV);
    const pipRow = document.createElement('div');
    pipRow.className = 'civ-pip-row';
    const pips = [];
    const pipState = [];
    for (let i = 0; i < CIV_PIPS; i++) {
        const pip = document.createElement('div');
        pip.className = 'civ-pip';
        pip.innerHTML = ICON_CITY_PIP;
        pipRow.appendChild(pip);
        pips.push(pip);
        pipState.push('intact');
    }
    const band = document.createElement('div');
    band.className = 'civ-band';
    const alive = document.createElement('div');
    alive.className = 'civ-band-alive';
    alive.style.width = '100%';
    const divider = document.createElement('div');
    divider.className = 'civ-band-divider';
    const dead = document.createElement('div');
    dead.className = 'civ-band-dead';
    dead.style.width = '0%';
    band.appendChild(alive);
    band.appendChild(divider);
    band.appendChild(dead);
    root.viz.appendChild(pipRow);
    root.viz.appendChild(band);
    function update(citiesLost, citiesTotal, popLostPct) {
        const ratio = citiesTotal > 0 ? Math.min(1, citiesLost / citiesTotal) : Math.min(1, popLostPct);
        const ruinCount = Math.round(ratio * CIV_PIPS);
        const allRuined = ratio >= 0.999;
        for (let i = 0; i < CIV_PIPS; i++) {
            let next;
            if (allRuined)
                next = 'skull';
            else if (i < ruinCount)
                next = 'ruin';
            else
                next = 'intact';
            if (next === pipState[i])
                continue;
            const pip = pips[i];
            pip.classList.remove('intact', 'ruined', 'skull');
            switch (next) {
                case 'intact':
                    pip.innerHTML = ICON_CITY_PIP;
                    pip.classList.add('intact');
                    break;
                case 'ruin':
                    pip.innerHTML = ICON_CITY_RUIN;
                    pip.classList.add('ruined');
                    break;
                case 'skull':
                    pip.innerHTML = ICON_SKULL;
                    pip.classList.add('skull');
                    break;
            }
            pipState[i] = next;
        }
        const deadPct = Math.max(0, Math.min(1, popLostPct));
        alive.style.width = `${((1 - deadPct) * 100).toFixed(1)}%`;
        dead.style.width = `${(deadPct * 100).toFixed(1)}%`;
    }
    function dispose() {
        root.root.remove();
    }
    return { update, dispose };
}
function mountRadStrata(host) {
    const root = makeModuleShell(host, 'rad', 'Radiation', ICON_RAD);
    const strata = document.createElement('div');
    strata.className = 'rad-strata';
    const fill = document.createElement('div');
    fill.className = 'rad-strata-fill';
    fill.style.width = '0%';
    const ticks = document.createElement('div');
    ticks.className = 'rad-strata-ticks';
    const scan = document.createElement('div');
    scan.className = 'rad-strata-scanline';
    strata.appendChild(fill);
    strata.appendChild(ticks);
    strata.appendChild(scan);
    const pipRow = document.createElement('div');
    pipRow.className = 'rad-pip-row';
    const pips = [];
    for (let i = 0; i < RAD_PIPS; i++) {
        const pip = document.createElement('div');
        pip.className = 'rad-pip';
        pip.innerHTML = ICON_TREFOIL_PIP;
        pipRow.appendChild(pip);
        pips.push(pip);
    }
    root.viz.appendChild(strata);
    root.viz.appendChild(pipRow);
    let displayedFill = 0;
    let lastTickCount = -1;
    function update(radiation01, bombsActive) {
        const target = Math.max(0, Math.min(1, radiation01));
        displayedFill += (target - displayedFill) * RAD_FILL_LERP;
        const widthPct = displayedFill * 100;
        fill.style.width = `${widthPct.toFixed(1)}%`;
        fill.classList.toggle('active', displayedFill > 0.005);
        fill.classList.toggle('hot', displayedFill > 0.6);
        strata.classList.toggle('active', displayedFill > 0.005);
        // Detonation ticks — one per active bomb, evenly spaced inside the
        // fill so the bar reads as N geiger blips frozen in time. Rebuild
        // only when bomb count changes; per-frame width follows fill via
        // the parent's width transform.
        const tickCount = Math.min(bombsActive, 64);
        if (tickCount !== lastTickCount) {
            ticks.innerHTML = '';
            for (let i = 0; i < tickCount; i++) {
                const t = document.createElement('div');
                t.className = 'rad-tick';
                const pos = ((i + 0.5) / tickCount) * 100;
                t.style.left = `${pos.toFixed(2)}%`;
                ticks.appendChild(t);
            }
            lastTickCount = tickCount;
        }
        // Pin the tick layer's width to the fill so ticks ride inside the
        // active region — when fill is 20% wide, the 12 ticks live in that
        // 20% slice rather than the whole bar.
        ticks.style.width = `${widthPct.toFixed(1)}%`;
        // Trefoil pips: light up as many as bombs (capped at RAD_PIPS).
        // Over RAD_PIPS bombs, the last slot turns into a pulsing overflow
        // triangle so the user reads "too many to count" without numerics.
        const overflow = bombsActive > RAD_PIPS;
        const litCount = overflow ? RAD_PIPS - 1 : Math.min(bombsActive, RAD_PIPS);
        for (let i = 0; i < RAD_PIPS; i++) {
            const pip = pips[i];
            const isOverflowSlot = overflow && i === RAD_PIPS - 1;
            const wantOverflow = isOverflowSlot;
            const wantLit = !isOverflowSlot && i < litCount;
            const hasOverflow = pip.classList.contains('overflow');
            if (wantOverflow !== hasOverflow) {
                pip.innerHTML = wantOverflow ? ICON_OVERFLOW_TRI : ICON_TREFOIL_PIP;
                pip.classList.toggle('overflow', wantOverflow);
            }
            pip.classList.toggle('lit', wantLit || wantOverflow);
        }
    }
    function dispose() {
        root.root.remove();
    }
    return { update, dispose };
}
function makeModuleShell(host, cls, label, iconSvg) {
    const root = document.createElement('div');
    root.className = `vital-module ${cls}`;
    root.setAttribute('data-kind', cls);
    const icon = document.createElement('div');
    icon.className = 'icon';
    icon.innerHTML = iconSvg;
    const labelEl = document.createElement('div');
    labelEl.className = 'label';
    labelEl.textContent = label;
    const viz = document.createElement('div');
    viz.className = 'viz';
    root.appendChild(icon);
    root.appendChild(labelEl);
    root.appendChild(viz);
    host.appendChild(root);
    return { root, viz };
}

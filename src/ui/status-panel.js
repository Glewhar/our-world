/**
 * Status panel — bottom card stack.
 *
 * Left card: Biome
 *   - State icon (balanced / unbalanced) + label
 *   - Trend chips (top-3 by |deltaPct|, up=gain, down=loss)
 *   - 12-hex diorama row, allocated by largest-remainder over 8 buckets
 *
 * Right column: Civilization card + Radiation card
 *   - Civ: composite % + horizontal bar + 3 stat tiles (pop / cities / streets)
 *   - Rad: bar fill % + readout (rad + LOW/MOD/HI/CRIT) + 10 dots row
 *
 * Reads `registry.getWorldHealth()` + `registry.getWorldTotals()` per frame.
 */
import { ChevronDownIcon, ChevronUpIcon, CityBurningIcon, CityCollapsedIcon, CityNormalIcon, DesertIcon, GrassIcon, LandWaterIcon, LeafBalancedIcon, LeafUnbalancedIcon, MutantIcon, OceanIcon, PalmIcon, PeopleDeadIcon, PeopleDyingIcon, PeopleNormalIcon, RadIcon, RoadCrackingIcon, RoadDestroyedIcon, RoadIcon, SkullIcon, SnowIcon, ThermoIcon, TreeIcon, WaveIcon, } from './icons.js';
// Visual scale applied to the displayed population + city counts. The
// underlying tally only covers populated places in our data set (top
// ~7k cities, BLT-density grids), which is a subset of the real world.
// Multiplying the displayed totals + losses makes the HUD numbers feel
// closer to real-world figures without touching the simulation budget.
const DISPLAY_HEADCOUNT_SCALE = 4;
const HEX_COUNT = 12;
const DESIGN_ORDER = [
    'forest', 'jungle', 'grass', 'desert', 'tundra', 'wasteland', 'mutated', 'ocean',
];
const DESIGN_GLYPH = {
    forest: TreeIcon,
    jungle: PalmIcon,
    grass: GrassIcon,
    desert: DesertIcon,
    tundra: SnowIcon,
    wasteland: SkullIcon,
    ocean: OceanIcon,
    mutated: MutantIcon,
};
const SIM_TO_DESIGN = {
    temperateForest: 'forest',
    rainforest: 'jungle',
    grassland: 'grass',
    desert: 'desert',
    tundraIce: 'tundra',
    wasteland: 'wasteland',
};
export function mountStatusPanel(host, registry, getLandFraction01 = () => 0.29) {
    host.replaceChildren();
    host.classList.remove('collapsed');
    const collapseBtn = document.createElement('button');
    collapseBtn.type = 'button';
    collapseBtn.id = 'sp-collapse';
    collapseBtn.className = 'sp-collapse-btn';
    collapseBtn.setAttribute('aria-label', 'Collapse status panel');
    collapseBtn.innerHTML = ChevronDownIcon;
    collapseBtn.addEventListener('click', () => {
        const collapsed = host.classList.toggle('collapsed');
        collapseBtn.innerHTML = collapsed ? ChevronUpIcon : ChevronDownIcon;
        collapseBtn.setAttribute('aria-label', collapsed ? 'Expand status panel' : 'Collapse status panel');
    });
    host.appendChild(collapseBtn);
    const cardsWrap = document.createElement('div');
    cardsWrap.className = 'sp-cards-wrap';
    host.appendChild(cardsWrap);
    const biomeCard = buildBiomeCard(cardsWrap);
    const rightCol = document.createElement('div');
    rightCol.id = 'civ-rad-stack';
    cardsWrap.appendChild(rightCol);
    const civCard = buildCivCard(rightCol);
    const radCard = buildRadCard(rightCol);
    function update() {
        const h = registry.getWorldHealth();
        const totals = registry.getWorldTotals();
        const climate = registry.getClimateFrame();
        biomeCard.update(h, climate.seaLevelM, climate.tempC, getLandFraction01());
        civCard.update(h, totals ? totals.population : null, totals ? totals.roads : null);
        radCard.update(h);
    }
    function dispose() {
        host.replaceChildren();
    }
    return { update, dispose };
}
function buildBiomeCard(host) {
    const card = document.createElement('div');
    card.className = 'sp-card';
    card.id = 'biome-card';
    const head = document.createElement('div');
    head.className = 'sp-card-head';
    const icon = document.createElement('div');
    icon.className = 'sp-icon';
    icon.style.color = 'var(--biome-forest)';
    icon.innerHTML = LeafBalancedIcon;
    const title = document.createElement('div');
    title.className = 'sp-card-title';
    title.textContent = 'Earth Vitals';
    const stateLabel = document.createElement('div');
    stateLabel.className = 'sp-card-sub';
    stateLabel.textContent = 'Balanced';
    head.appendChild(icon);
    head.appendChild(title);
    head.appendChild(stateLabel);
    card.appendChild(head);
    // Nested vitals: SEA + TEMP (like civ-stat tiles inside civ-card).
    const vitals = document.createElement('div');
    vitals.className = 'biome-vitals';
    const seaTile = buildVitalsTile(vitals, WaveIcon, 'Sea Level', 'cool');
    const tempTile = buildVitalsTile(vitals, ThermoIcon, 'Avg. Temp', 'warm');
    const waterTile = buildVitalsTile(vitals, LandWaterIcon, 'Water / Land', 'land');
    card.appendChild(vitals);
    const chips = document.createElement('div');
    chips.className = 'biome-trend-chips';
    card.appendChild(chips);
    const hexRow = document.createElement('div');
    hexRow.className = 'biome-hex-row';
    const hexes = [];
    const current = [];
    for (let i = 0; i < HEX_COUNT; i++) {
        const hex = document.createElement('div');
        hex.className = 'bc-hex';
        hexes.push(hex);
        current.push(null);
        hexRow.appendChild(hex);
    }
    card.appendChild(hexRow);
    host.appendChild(card);
    function update(h, seaLevelM, tempC, landFraction01) {
        seaTile.value.textContent = formatSigned(seaLevelM, 'm', 1);
        tempTile.value.textContent = formatSigned(tempC, '°C', 1);
        const waterPct = Math.round((1 - landFraction01) * 100);
        const landPct = 100 - waterPct;
        waterTile.value.textContent = `${waterPct} / ${landPct}%`;
        // Balanced / unbalanced derived from max abs deltaPct > 5%
        const maxDelta = h.stats.biomeChanges.reduce((m, c) => Math.max(m, Math.abs(c.deltaPct)), 0);
        const unbalanced = maxDelta > 5;
        icon.innerHTML = unbalanced ? LeafUnbalancedIcon : LeafBalancedIcon;
        icon.style.color = unbalanced ? 'var(--accent-warm)' : 'var(--biome-forest)';
        stateLabel.textContent = unbalanced ? 'Unbalanced' : 'Balanced';
        // Trend chips — top-3 by abs delta.
        chips.replaceChildren();
        const top = h.stats.biomeChanges.slice(0, 3);
        for (const c of top) {
            const chip = document.createElement('span');
            const up = c.deltaPct >= 0;
            chip.className = `biome-trend-chip ${up ? 'up' : 'down'}`;
            chip.innerHTML = `<span class="arrow">${up ? '↑' : '↓'}</span>${escapeHtml(c.name)} ${Math.abs(c.deltaPct).toFixed(1)}%`;
            chips.appendChild(chip);
        }
        // Hex diorama.
        const design = simSharesToDesign(h.stats.biomeCategoryShares);
        const allocation = allocateHexes(design);
        for (let i = 0; i < HEX_COUNT; i++) {
            const next = allocation[i] ?? null;
            if (next === current[i])
                continue;
            const hex = hexes[i];
            if (next) {
                hex.dataset['cat'] = next;
                hex.innerHTML = DESIGN_GLYPH[next];
            }
            else {
                delete hex.dataset['cat'];
                hex.innerHTML = '';
            }
            hex.classList.remove('flash');
            void hex.offsetWidth;
            hex.classList.add('flash');
            current[i] = next;
        }
    }
    return { update };
}
function buildVitalsTile(host, icon, label, tone) {
    const root = document.createElement('div');
    root.className = 'vitals-tile';
    root.dataset['tone'] = tone;
    const head = document.createElement('div');
    head.className = 'vitals-head';
    const iconWrap = document.createElement('span');
    iconWrap.className = 'vitals-icon';
    iconWrap.innerHTML = icon;
    const labelEl = document.createElement('span');
    labelEl.textContent = label;
    head.appendChild(iconWrap);
    head.appendChild(labelEl);
    const value = document.createElement('div');
    value.className = 'vitals-value';
    value.textContent = '—';
    root.appendChild(head);
    root.appendChild(value);
    host.appendChild(root);
    return { root, value };
}
function formatSigned(v, unit, digits) {
    if (Math.abs(v) < Math.pow(10, -digits - 1))
        return `0${unit}`;
    const sign = v >= 0 ? '+' : '';
    return `${sign}${v.toFixed(digits)}${unit}`;
}
function simSharesToDesign(s) {
    const out = {
        forest: 0, jungle: 0, grass: 0, desert: 0,
        tundra: 0, wasteland: 0, ocean: 0, mutated: 0,
    };
    let landSum = 0;
    for (const k of Object.keys(s)) {
        const v = s[k];
        landSum += v;
        const designKey = SIM_TO_DESIGN[k];
        if (designKey)
            out[designKey] += v;
    }
    // Ocean = 1 - land. Mutated stays 0 placeholder.
    out.ocean = Math.max(0, 1 - landSum);
    return out;
}
/** Largest-remainder allocation over HEX_COUNT buckets. */
function allocateHexes(shares) {
    let total = 0;
    for (const k of DESIGN_ORDER)
        total += shares[k];
    if (total <= 0)
        return [];
    const rows = [];
    let assigned = 0;
    for (const k of DESIGN_ORDER) {
        const expected = (shares[k] / total) * HEX_COUNT;
        const floor = Math.floor(expected);
        rows.push({ key: k, floor, rem: expected - floor });
        assigned += floor;
    }
    const order = [...rows].sort((a, b) => b.rem - a.rem);
    let idx = 0;
    while (assigned < HEX_COUNT) {
        const t = order[idx % order.length];
        t.floor += 1;
        assigned += 1;
        idx += 1;
    }
    const out = [];
    for (const r of rows)
        for (let k = 0; k < r.floor; k++)
            out.push(r.key);
    return out;
}
function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function buildCivCard(host) {
    const card = document.createElement('div');
    card.className = 'sp-card';
    card.id = 'civ-card';
    const head = document.createElement('div');
    head.className = 'sp-card-head';
    const icon = document.createElement('div');
    icon.className = 'sp-icon';
    icon.style.color = 'var(--accent-warm)';
    icon.innerHTML = CityNormalIcon;
    const title = document.createElement('div');
    title.className = 'sp-card-title';
    title.textContent = 'Civilization';
    const value = document.createElement('div');
    value.className = 'sp-card-value';
    value.textContent = '100%';
    head.appendChild(icon);
    head.appendChild(title);
    head.appendChild(value);
    card.appendChild(head);
    const bar = document.createElement('div');
    bar.className = 'civ-bar';
    const fill = document.createElement('div');
    fill.className = 'civ-bar-fill';
    bar.appendChild(fill);
    card.appendChild(bar);
    const stats = document.createElement('div');
    stats.className = 'civ-stats';
    card.appendChild(stats);
    const popStat = buildStat(stats, PeopleNormalIcon, 'Population', 'pop');
    const cityStat = buildStat(stats, CityNormalIcon, 'Cities', 'city');
    const streetStat = buildStat(stats, RoadIcon, 'Streets', 'street');
    host.appendChild(card);
    function update(h, totalPopulation, totalRoads) {
        const civ01 = Math.max(0, Math.min(1, h.civilization));
        const pct = Math.round(civ01 * 100);
        value.textContent = `${pct}%`;
        fill.style.width = `${civ01 * 100}%`;
        const tier = tierFor(civ01);
        // Population: total - lost; trend shows lost. Both scaled visually
        // (see `DISPLAY_HEADCOUNT_SCALE`) so the numbers track real-world
        // magnitudes while the simulation budget stays unchanged.
        if (totalPopulation !== null && totalPopulation > 0) {
            const scaledTotal = totalPopulation * DISPLAY_HEADCOUNT_SCALE;
            const scaledLost = h.stats.populationLost * DISPLAY_HEADCOUNT_SCALE;
            const alive = Math.max(0, scaledTotal - scaledLost);
            popStat.value.textContent = formatBig(alive);
            if (scaledLost > 0) {
                popStat.trend.textContent = `↓${formatBig(scaledLost)}`;
                popStat.trend.classList.remove('muted');
            }
            else {
                popStat.trend.textContent = '↓0';
                popStat.trend.classList.add('muted');
            }
        }
        else {
            popStat.value.textContent = '—';
            popStat.trend.textContent = '';
        }
        popStat.iconWrap.innerHTML = peopleIconFor(tier);
        setStatTier(popStat, tier);
        // Cities — same visual scale as population.
        const scaledCitiesTotal = h.stats.citiesTotal * DISPLAY_HEADCOUNT_SCALE;
        const scaledCitiesLost = h.stats.citiesLost * DISPLAY_HEADCOUNT_SCALE;
        const cityAlive = Math.max(0, scaledCitiesTotal - scaledCitiesLost);
        cityStat.value.textContent = formatBig(cityAlive);
        if (scaledCitiesLost > 0) {
            cityStat.trend.textContent = `↓${formatBig(scaledCitiesLost)}`;
            cityStat.trend.classList.remove('muted');
        }
        else {
            cityStat.trend.textContent = '↓0';
            cityStat.trend.classList.add('muted');
        }
        cityStat.iconWrap.innerHTML = cityIconFor(tier);
        setStatTier(cityStat, tier);
        // Streets — derived from civ01. No per-scenario lost-roads tally
        // exists (the highways shader discards segments by wasteland
        // threshold per fragment), so the alive count tracks the civ tier as
        // a proxy: civ01=1 → all streets, civ01=0 → none.
        if (totalRoads !== null && totalRoads > 0) {
            const alive = Math.max(0, Math.round(totalRoads * civ01));
            const lost = totalRoads - alive;
            streetStat.value.textContent = formatBig(alive);
            if (lost > 0) {
                streetStat.trend.textContent = `↓${formatBig(lost)}`;
                streetStat.trend.classList.remove('muted');
            }
            else {
                streetStat.trend.textContent = '↓0';
                streetStat.trend.classList.add('muted');
            }
        }
        else {
            streetStat.value.textContent = '—';
            streetStat.trend.textContent = '';
        }
        streetStat.iconWrap.innerHTML = roadIconFor(tier);
        setStatTier(streetStat, tier);
        // Composite icon mirrors city state
        icon.innerHTML = cityIconFor(tier);
        icon.style.color = tier === 'healthy' ? 'var(--biome-forest)' : tier === 'middle' ? 'var(--accent-warm)' : 'var(--accent-hot)';
    }
    return { update };
}
function tierFor(civ01) {
    if (civ01 > 0.5)
        return 'healthy';
    if (civ01 > 0.1)
        return 'middle';
    return 'end';
}
function buildStat(host, icon, label, kind) {
    const root = document.createElement('div');
    root.className = 'civ-stat';
    root.dataset['kind'] = kind;
    root.dataset['tier'] = 'healthy';
    const head = document.createElement('div');
    head.className = 'civ-stat-head';
    const iconWrap = document.createElement('span');
    iconWrap.className = 'civ-stat-icon';
    iconWrap.innerHTML = icon;
    const labelEl = document.createElement('span');
    labelEl.textContent = label;
    head.appendChild(iconWrap);
    head.appendChild(labelEl);
    const value = document.createElement('div');
    value.className = 'civ-stat-value';
    value.textContent = '—';
    const trend = document.createElement('div');
    trend.className = 'civ-stat-trend muted';
    trend.textContent = '↓0';
    root.appendChild(head);
    root.appendChild(value);
    root.appendChild(trend);
    host.appendChild(root);
    return { root, value, trend, iconWrap };
}
function setStatTier(stat, tier) {
    if (stat.root.dataset['tier'] !== tier)
        stat.root.dataset['tier'] = tier;
}
function peopleIconFor(tier) {
    if (tier === 'healthy')
        return PeopleNormalIcon;
    if (tier === 'middle')
        return PeopleDyingIcon;
    return PeopleDeadIcon;
}
function cityIconFor(tier) {
    if (tier === 'healthy')
        return CityNormalIcon;
    if (tier === 'middle')
        return CityBurningIcon;
    return CityCollapsedIcon;
}
function roadIconFor(tier) {
    if (tier === 'healthy')
        return RoadIcon;
    if (tier === 'middle')
        return RoadCrackingIcon;
    return RoadDestroyedIcon;
}
function formatBig(n) {
    if (n >= 1e9)
        return `${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6)
        return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3)
        return `${(n / 1e3).toFixed(1)}K`;
    return `${Math.round(n)}`;
}
function buildRadCard(host) {
    const card = document.createElement('div');
    card.className = 'sp-card';
    card.id = 'rad-card';
    const head = document.createElement('div');
    head.className = 'sp-card-head';
    const icon = document.createElement('div');
    icon.className = 'sp-icon';
    icon.style.color = 'var(--accent-rad)';
    icon.innerHTML = RadIcon;
    const title = document.createElement('div');
    title.className = 'sp-card-title';
    title.textContent = 'Radiation';
    const readout = document.createElement('div');
    readout.className = 'rad-readout';
    const value = document.createElement('span');
    value.className = 'rad-readout-value';
    value.textContent = '0 rad';
    const label = document.createElement('span');
    label.className = 'rad-readout-label low';
    label.textContent = 'LOW';
    readout.appendChild(value);
    readout.appendChild(label);
    head.appendChild(icon);
    head.appendChild(title);
    head.appendChild(readout);
    card.appendChild(head);
    const bar = document.createElement('div');
    bar.className = 'rad-bar';
    const fill = document.createElement('div');
    fill.className = 'rad-bar-fill';
    const scan = document.createElement('div');
    scan.className = 'rad-bar-scan';
    bar.appendChild(fill);
    bar.appendChild(scan);
    card.appendChild(bar);
    const dots = document.createElement('div');
    dots.className = 'rad-dots';
    const dotEls = [];
    for (let i = 0; i < 10; i++) {
        const d = document.createElement('div');
        d.className = 'rad-dot';
        dotEls.push(d);
        dots.appendChild(d);
    }
    card.appendChild(dots);
    host.appendChild(card);
    let displayed = 0;
    function update(h) {
        const target = Math.max(0, Math.min(1, h.radiation));
        displayed += (target - displayed) * 0.18;
        const pct = displayed * 100;
        fill.style.width = `${pct.toFixed(1)}%`;
        bar.classList.toggle('active', displayed > 0.005);
        value.textContent = `${Math.round(pct)} rad`;
        let tier;
        let labelText;
        if (pct < 15) {
            tier = 'low';
            labelText = 'LOW';
        }
        else if (pct < 50) {
            tier = 'mod';
            labelText = 'MOD';
        }
        else if (pct < 80) {
            tier = 'hi';
            labelText = 'HI';
        }
        else {
            tier = 'crit';
            labelText = 'CRIT';
        }
        label.className = `rad-readout-label ${tier}`;
        label.textContent = labelText;
        const filled = Math.min(10, Math.floor(pct / 10));
        for (let i = 0; i < 10; i++) {
            const d = dotEls[i];
            d.classList.remove('on', 'hi', 'crit');
            if (i >= filled)
                continue;
            if (pct >= 80)
                d.classList.add('crit');
            else if (pct >= 50)
                d.classList.add('hi');
            else
                d.classList.add('on');
        }
    }
    return { update };
}

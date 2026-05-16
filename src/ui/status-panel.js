/**
 * Status panel — bottom card stack.
 *
 * Left card: Biome
 *   - State icon (balanced / unbalanced) + label
 *   - 12-hex diorama row. Each tile is statically rendered every frame:
 *     either fully one biome color, or split between two biomes at the
 *     fractional boundary along DESIGN_ORDER. No animation, no transitions.
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
        civCard.update(h, totals ? totals.population : null, totals ? totals.roads : null, streetsAliveFraction(registry));
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
    const hexRow = document.createElement('div');
    hexRow.className = 'biome-hex-row';
    const stripeTop = document.createElement('div');
    stripeTop.className = 'bc-hex-stripe';
    const stripeBot = document.createElement('div');
    stripeBot.className = 'bc-hex-stripe is-offset';
    hexRow.appendChild(stripeTop);
    hexRow.appendChild(stripeBot);
    const hexes = [];
    const half = HEX_COUNT / 2;
    for (let i = 0; i < HEX_COUNT; i++) {
        const wrap = document.createElement('div');
        wrap.className = 'bc-hex';
        const base = document.createElement('div');
        base.className = 'bc-hex-base';
        const overlay = document.createElement('div');
        overlay.className = 'bc-hex-overlay';
        const iconWrap = document.createElement('div');
        iconWrap.className = 'bc-hex-icon';
        wrap.appendChild(base);
        wrap.appendChild(overlay);
        wrap.appendChild(iconWrap);
        (i < half ? stripeTop : stripeBot).appendChild(wrap);
        hexes.push({ wrap, base, overlay, iconWrap, cat: null, secondCat: null, iconCat: null });
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
        // Static rendering: each slot is either a full tile of one biome,
        // or a left/right split at the fractional boundary along DESIGN_ORDER.
        // The browser shows whatever values we write this frame — share drift
        // from the simulation provides continuity, not any interpolation here.
        const design = simSharesToDesign(h.stats.biomeCategoryShares);
        const slots = allocateHexes(design);
        for (let i = 0; i < HEX_COUNT; i++) {
            applyHex(hexes[i], slots[i]);
        }
    }
    return { update };
}
function applyHex(h, slot) {
    const cat = slot.cat;
    const secondCat = slot.secondCat ?? null;
    const leftFrac = slot.leftFraction ?? 1;
    const rightPct = secondCat ? Math.max(0, Math.min(100, (1 - leftFrac) * 100)) : 0;
    const dominant = secondCat && leftFrac < 0.5 ? secondCat : cat;
    if (h.cat !== cat) {
        h.base.dataset['cat'] = cat;
        h.cat = cat;
    }
    if (h.secondCat !== secondCat) {
        if (secondCat)
            h.overlay.dataset['cat'] = secondCat;
        else
            delete h.overlay.dataset['cat'];
        h.secondCat = secondCat;
    }
    h.overlay.style.width = `${rightPct.toFixed(2)}%`;
    if (h.iconCat !== dominant) {
        h.iconWrap.innerHTML = DESIGN_GLYPH[dominant];
        h.iconCat = dominant;
    }
}
/**
 * Lay biomes along a continuous strip of length HEX_COUNT in DESIGN_ORDER,
 * each spanning `(share / total) * HEX_COUNT` units. A slot covering
 * integer position [i, i+1) is either fully one biome or split between
 * two — the boundary's fractional offset becomes `leftFraction`.
 */
function allocateHexes(shares) {
    const out = [];
    let total = 0;
    for (const k of DESIGN_ORDER)
        total += shares[k];
    if (total <= 0) {
        for (let i = 0; i < HEX_COUNT; i++)
            out.push({ cat: 'ocean' });
        return out;
    }
    const runs = [];
    let pos = 0;
    for (const k of DESIGN_ORDER) {
        const len = (shares[k] / total) * HEX_COUNT;
        if (len <= 0)
            continue;
        runs.push({ key: k, start: pos, end: pos + len });
        pos += len;
    }
    const EPS = 1e-4;
    for (let i = 0; i < HEX_COUNT; i++) {
        const slotStart = i;
        const slotEnd = i + 1;
        let leftRun = null;
        let rightRun = null;
        let boundary = slotEnd;
        for (const r of runs) {
            const lo = Math.max(r.start, slotStart);
            const hi = Math.min(r.end, slotEnd);
            if (hi - lo <= EPS)
                continue;
            if (leftRun === null) {
                leftRun = r;
                boundary = hi;
            }
            else {
                rightRun = r;
                break;
            }
        }
        if (leftRun === null) {
            out.push({ cat: 'ocean' });
        }
        else if (rightRun === null) {
            out.push({ cat: leftRun.key });
        }
        else {
            out.push({ cat: leftRun.key, secondCat: rightRun.key, leftFraction: boundary - slotStart });
        }
    }
    return out;
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
/**
 * Surviving-streets fraction inferred from the destruction frame the
 * highways shader is actually using. Each road segment discards when
 * `polyFlipMask * intensity > seedToThreshold(seed)`; with uniform seeds
 * the expected surviving fraction is `1 - coverage * intensity`, where
 * `coverage` is the share of populated polygons carrying a nonzero mask
 * byte. Falls back to 1 (all alive) when no scenario contributes a mask.
 */
function streetsAliveFraction(registry) {
    const frame = registry.getDestructionFrame();
    const mask = frame.polyFlipMask;
    if (!mask || frame.intensity <= 0)
        return 1;
    let on = 0;
    let total = 0;
    for (let i = 1; i < mask.length; i++) {
        total++;
        if (mask[i] > 0)
            on++;
    }
    if (total === 0)
        return 1;
    const coverage = on / total;
    const killed = coverage * frame.intensity;
    return killed >= 1 ? 0 : killed <= 0 ? 1 : 1 - killed;
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
    function update(h, totalPopulation, totalRoads, streetsAlive01) {
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
        // Streets — derived from the destruction frame the renderer is
        // actually using. The previous proxy multiplied by civ01, which
        // collapsed to 0 the instant population hit 0 — well before the
        // Infrastructure-Decay scenario had finished erasing road segments
        // from the globe. Using `streetsAlive01` keeps the counter in lock
        // step with what the shader is drawing.
        if (totalRoads !== null && totalRoads > 0) {
            const aliveF = streetsAlive01 < 0 ? 0 : streetsAlive01 > 1 ? 1 : streetsAlive01;
            const alive = Math.max(0, Math.round(totalRoads * aliveF));
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
        const streetTier = streetsAlive01 > 0.5 ? 'healthy' : streetsAlive01 > 0.1 ? 'middle' : 'end';
        streetStat.iconWrap.innerHTML = roadIconFor(streetTier);
        setStatTier(streetStat, streetTier);
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

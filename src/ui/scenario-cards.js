/**
 * Scenario card stack UI — vanilla DOM, no framework.
 *
 * Lives outside `debug/` because this is gameplay UI, not Tweakpane.
 * Renders one card per active Scenario in `registry.list()`; cards reconcile
 * by id (no full re-render) so collapse state survives ticks.
 *
 * Collapsed card (default, ~32px):
 *   ☢  Nuclear strike — Nevada              ████████░░░░░░░░  16 d
 *
 * Expanded card (~120px, click to expand):
 *   ☢  Nuclear strike — Nevada              ████████░░░░░░░░  16 d
 *      38.4° N, 116.9° W
 *      radius 450 km · stretch 1200 km · wind from W
 *      started year 2067, recovers year 2069
 *      [stop]
 *
 * Auto-repeat: replaces day-counter with ∞, no progress bar.
 *
 * Layout: vertical stack inside `#scenario-stack` (a flex column declared
 * in index.html). The host owns `max-height` + scroll; this module owns
 * card construction + per-frame value updates.
 */
const START_YEAR = 2067;
// 15-entry biome name table for the WWF TEOW codes (0 = no-data, 1..14 =
// TEOW biomes). The palette in defaults.ts has 16 entries — slot 15 is the
// synthetic ice/glacier used only by climate-scenario overrides, which the
// scenario card doesn't list. Kept inline so this file stays decoupled
// from debug/defaults.
const BIOME_NAMES = [
    'no data',
    'tropical moist forest',
    'tropical dry forest',
    'tropical conifer',
    'temperate broadleaf',
    'temperate conifer',
    'boreal / taiga',
    'tropical savanna',
    'temperate grassland',
    'flooded grassland',
    'montane grassland',
    'tundra',
    'mediterranean',
    'desert / xeric',
    'mangroves',
];
export function mountScenarioCards(host, registry) {
    const cardsById = new Map();
    function update() {
        const active = registry.list();
        const seen = new Set();
        for (let i = 0; i < active.length; i++) {
            const scn = active[i];
            seen.add(scn.id);
            let card = cardsById.get(scn.id);
            if (!card) {
                card = createCard(scn, () => registry.stop(scn.id));
                cardsById.set(scn.id, card);
                host.appendChild(card.root);
            }
            const progress01 = progressOf(scn);
            refreshCard(card, scn, progress01, registry);
        }
        // Drop cards whose scenarios ended.
        cardsById.forEach((card, id) => {
            if (!seen.has(id)) {
                card.root.remove();
                cardsById.delete(id);
            }
        });
        // Hide the host when empty so it stops eating clicks on the canvas.
        host.style.display = active.length === 0 ? 'none' : 'flex';
    }
    function dispose() {
        cardsById.forEach((card) => card.root.remove());
        cardsById.clear();
        host.style.display = 'none';
    }
    // Start hidden — no scenarios on boot.
    host.style.display = 'none';
    return { update, dispose };
}
function progressOf(scn) {
    // The registry's tick is what actually advances progress on the scenario
    // side; here we read totalDays via the same elapsed math so the card's
    // bar updates between registry ticks (the registry only re-emits the
    // wasteland texture, it doesn't mutate the scenario's startedAtDay).
    // We don't have totalDays handed to us, so derive from a global: the
    // debug state lives behind window.__ED.debug.state.timeOfDay.totalDays
    // — fine for v1 since the card UI is gameplay-side, not testable.
    const totalDays = window
        .__ED?.debug?.state?.timeOfDay?.totalDays ?? scn.startedAtDay;
    const raw = (totalDays - scn.startedAtDay) / Math.max(1e-6, scn.durationDays);
    return raw < 0 ? 0 : raw > 1 ? 1 : raw;
}
function createCard(scn, onStop) {
    const root = document.createElement('div');
    root.className = 'scenario-card collapsed';
    const header = document.createElement('div');
    header.className = 'scenario-card-header';
    const iconSpan = document.createElement('span');
    iconSpan.className = 'scenario-card-icon';
    iconSpan.textContent = iconFor(scn);
    const titleSpan = document.createElement('span');
    titleSpan.className = 'scenario-card-title';
    titleSpan.textContent = scn.label;
    const progress = document.createElement('div');
    progress.className = 'scenario-card-progress';
    const progressFill = document.createElement('div');
    progressFill.className = 'scenario-card-progress-fill';
    progress.appendChild(progressFill);
    const daysLabel = document.createElement('span');
    daysLabel.className = 'scenario-card-days';
    header.appendChild(iconSpan);
    header.appendChild(titleSpan);
    header.appendChild(progress);
    header.appendChild(daysLabel);
    const body = document.createElement('div');
    body.className = 'scenario-card-body';
    const coords = document.createElement('div');
    coords.className = 'scenario-card-row';
    const shape = document.createElement('div');
    shape.className = 'scenario-card-row';
    const timing = document.createElement('div');
    timing.className = 'scenario-card-row';
    const stop = document.createElement('button');
    stop.className = 'scenario-card-stop';
    stop.type = 'button';
    stop.textContent = 'stop';
    stop.addEventListener('click', (e) => {
        e.stopPropagation();
        onStop();
    });
    body.appendChild(coords);
    body.appendChild(shape);
    body.appendChild(timing);
    // Destruction stats — three lines, only mounted for handlers with
    // `hasDestructionCensus` (Nuclear + NuclearWar). The text is rewritten
    // by `refreshCard` from `registry.getDestructionCensus(scn.id)`.
    let destruction = null;
    if (scn.kind === 'nuclear' || scn.kind === 'nuclearWar') {
        destruction = document.createElement('div');
        destruction.className = 'scenario-card-row scenario-card-destruction';
        body.appendChild(destruction);
    }
    // Climate scenarios get a biome census table inside the card body.
    // Rows populate lazily in refreshCard() as census entries appear.
    let censusTable = null;
    const censusRows = new Map();
    if (scn.kind === 'globalWarming' || scn.kind === 'iceAge' || scn.kind === 'nuclearWar') {
        censusTable = document.createElement('table');
        censusTable.className = 'scenario-card-census';
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const thBiome = document.createElement('th');
        thBiome.textContent = 'biome';
        const thCount = document.createElement('th');
        thCount.textContent = 'cells (Δ)';
        headerRow.appendChild(thBiome);
        headerRow.appendChild(thCount);
        thead.appendChild(headerRow);
        censusTable.appendChild(thead);
        const tbody = document.createElement('tbody');
        censusTable.appendChild(tbody);
        body.appendChild(censusTable);
    }
    body.appendChild(stop);
    root.appendChild(header);
    root.appendChild(body);
    // Toggle expand/collapse on header click. Body click is opt-out so the
    // stop button keeps working from the expanded state.
    header.addEventListener('click', () => {
        root.classList.toggle('collapsed');
        root.classList.toggle('expanded');
    });
    return {
        root,
        header,
        iconSpan,
        titleSpan,
        progress,
        progressFill,
        daysLabel,
        body,
        coords,
        shape,
        timing,
        destruction,
        stop,
        censusTable,
        censusRows,
    };
}
function refreshCard(card, scn, progress01, registry) {
    // Bar / day counter. Auto-repeat shows ∞ + no fill.
    if (scn.autoRepeat) {
        card.progressFill.style.width = '100%';
        card.daysLabel.textContent = '∞';
    }
    else {
        const filled01 = Math.min(1, Math.max(0, progress01));
        card.progressFill.style.width = `${(filled01 * 100).toFixed(1)}%`;
        const remainingDays = Math.max(0, scn.durationDays - (progress01 * scn.durationDays));
        card.daysLabel.textContent = formatRemaining(Math.ceil(remainingDays));
    }
    // Body content — only update text when expanded, but cheap to refresh
    // every frame either way.
    if (scn.kind === 'nuclear') {
        const p = scn.payload;
        card.coords.textContent = formatCoords(p.latDeg, p.lonDeg);
        card.shape.textContent =
            `blast radius ${Math.round(p.radiusKm)} km · fallout stretch ${Math.round(p.stretchKm)} km · wind ${bearingToCompass(p.windBearingDeg)}`;
        const startedYear = START_YEAR + Math.floor(scn.startedAtDay / 12);
        const endsYear = START_YEAR + Math.floor((scn.startedAtDay + scn.durationDays) / 12);
        card.timing.textContent = `started year ${startedYear}, recovers year ${endsYear}`;
    }
    else if (scn.kind === 'globalWarming' || scn.kind === 'iceAge' || scn.kind === 'nuclearWar') {
        refreshClimateCard(card, scn, registry);
    }
    refreshDestructionStats(card, scn, registry);
}
function refreshDestructionStats(card, scn, registry) {
    if (!card.destruction)
        return;
    const d = registry.getDestructionCensus(scn.id);
    if (!d) {
        card.destruction.textContent = '';
        return;
    }
    const fmt = new Intl.NumberFormat('en-US');
    const lines = [];
    if (d.strikesScheduled > 1) {
        lines.push(`${fmt.format(d.strikes)} / ${fmt.format(d.strikesScheduled)} strikes`);
    }
    lines.push(`${fmt.format(d.cities)} cities destroyed · ${formatPopulation(d.population)}`);
    lines.push(`${formatStreetKm(d.streetKm)} streets destroyed`);
    card.destruction.innerHTML = lines.map((l) => `<div>${l}</div>`).join('');
}
function formatPopulation(pop) {
    if (pop >= 1e9)
        return `${(pop / 1e9).toFixed(1)} B population`;
    if (pop >= 1e6)
        return `${(pop / 1e6).toFixed(1)} M population`;
    if (pop >= 1e3)
        return `${(pop / 1e3).toFixed(0)} K population`;
    return `${pop} population`;
}
function formatStreetKm(km) {
    return km >= 1000
        ? `${new Intl.NumberFormat('en-US').format(Math.round(km))} km`
        : `${km.toFixed(0)} km`;
}
function refreshClimateCard(card, scn, registry) {
    const p = scn.payload;
    const dT = p?.maxTempDeltaC ?? 0;
    const dSL = p?.maxSeaLevelM ?? 0;
    card.coords.textContent =
        `target ΔT ${dT >= 0 ? '+' : ''}${dT.toFixed(1)} °C · sea level ${dSL >= 0 ? '+' : ''}${dSL.toFixed(0)} m`;
    const startedYear = START_YEAR + Math.floor(scn.startedAtDay / 12);
    const endsYear = START_YEAR + Math.floor((scn.startedAtDay + scn.durationDays) / 12);
    card.shape.textContent =
        scn.kind === 'nuclearWar'
            ? `started year ${startedYear}, winter ends year ${endsYear}`
            : `started year ${startedYear}, settles year ${endsYear}`;
    card.timing.textContent = '';
    if (!card.censusTable)
        return;
    const census = registry.getBiomeCensus(scn.id);
    if (!census)
        return;
    const tbody = card.censusTable.tBodies[0];
    if (!tbody)
        return;
    const fmt = new Intl.NumberFormat('en-US');
    for (const classStr of Object.keys(census.current)) {
        const cls = parseInt(classStr, 10);
        if (!Number.isFinite(cls))
            continue;
        const current = census.current[cls] ?? 0;
        const delta = census.delta[cls] ?? 0;
        let row = card.censusRows.get(cls);
        if (!row) {
            row = document.createElement('tr');
            const tdName = document.createElement('td');
            tdName.textContent = BIOME_NAMES[cls] ?? `biome ${cls}`;
            const tdVal = document.createElement('td');
            row.appendChild(tdName);
            row.appendChild(tdVal);
            tbody.appendChild(row);
            card.censusRows.set(cls, row);
        }
        const tdVal = row.children[1];
        const sign = delta > 0 ? '+' : delta < 0 ? '−' : '';
        const colour = delta > 0 ? '#7fd58a' : delta < 0 ? '#ff7a7a' : 'inherit';
        tdVal.innerHTML = `${fmt.format(current)} <span style="color:${colour}">(${sign}${fmt.format(Math.abs(delta))})</span>`;
    }
}
function formatRemaining(months) {
    const years = Math.floor(months / 12);
    const rem = months % 12;
    if (years === 0)
        return `${months}m`;
    if (rem === 0)
        return `${years}y`;
    return `${years}y ${rem}m`;
}
function iconFor(scn) {
    switch (scn.kind) {
        case 'nuclear':
            return '☢';
        case 'globalWarming':
            return '🔥';
        case 'iceAge':
            return '❄';
        case 'nuclearWar':
            return '☢☣';
    }
}
function formatCoords(latDeg, lonDeg) {
    const latLabel = latDeg >= 0 ? 'N' : 'S';
    const lonLabel = lonDeg >= 0 ? 'E' : 'W';
    return `${Math.abs(latDeg).toFixed(1)}° ${latLabel}, ${Math.abs(lonDeg).toFixed(1)}° ${lonLabel}`;
}
/**
 * 8-point compass for "wind FROM X". The wind plume blows TOWARD bearing,
 * so wind ORIGIN is bearing + 180.
 */
function bearingToCompass(bearingDeg) {
    const origin = (bearingDeg + 180) % 360;
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const idx = Math.round(origin / 45) % 8;
    return `from ${dirs[idx]}`;
}

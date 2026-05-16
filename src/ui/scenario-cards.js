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
 * Expanded card (~80px, click to expand):
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
 *
 * Statistics (cities destroyed, biome census, etc.) live on the bottom-center
 * health-bar HUD now — the card only carries scenario metadata.
 */
import { seaLevelFromTempDelta } from '../world/scenarios/seaLevelFromTemp.js';
const START_YEAR = 2067;
export function mountScenarioCards(host, registry, getSeaLevelMultiplier) {
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
            refreshCard(card, scn, progress01, getSeaLevelMultiplier());
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
        stop,
    };
}
function refreshCard(card, scn, progress01, seaLevelMultiplier) {
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
        refreshClimateCard(card, scn, seaLevelMultiplier);
    }
    else if (scn.kind === 'infraDecay') {
        const startedYear = START_YEAR + Math.floor(scn.startedAtDay / 12);
        const endsYear = START_YEAR + Math.floor((scn.startedAtDay + scn.durationDays) / 12);
        card.coords.textContent = 'no survivors — cities and roads collapsing worldwide';
        card.shape.textContent = `started year ${startedYear}, vanished year ${endsYear}`;
        card.timing.textContent = '';
    }
}
function refreshClimateCard(card, scn, seaLevelMultiplier) {
    // Peak forecast — sea level falls out of the temperature curve at the
    // current multiplier. Live sea level (which lags via the envelope)
    // sits in the registry's combined climate frame; the card carries the
    // launch-time peak intent.
    const p = scn.payload;
    const dT = p?.maxTempDeltaC ?? 0;
    const dSL = seaLevelFromTempDelta(dT, seaLevelMultiplier);
    card.coords.textContent =
        `target ΔT ${dT >= 0 ? '+' : ''}${dT.toFixed(1)} °C · sea level ${dSL >= 0 ? '+' : ''}${dSL.toFixed(0)} m`;
    const startedYear = START_YEAR + Math.floor(scn.startedAtDay / 12);
    const endsYear = START_YEAR + Math.floor((scn.startedAtDay + scn.durationDays) / 12);
    card.shape.textContent =
        scn.kind === 'nuclearWar'
            ? `started year ${startedYear}, winter ends year ${endsYear}`
            : `started year ${startedYear}, settles year ${endsYear}`;
    card.timing.textContent = '';
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
        case 'infraDecay':
            return '🏚';
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

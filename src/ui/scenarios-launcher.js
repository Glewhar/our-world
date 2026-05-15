/**
 * Scenarios launcher — vanilla DOM popover anchored under the top-right
 * chip rail. Replaces the old `#explode-controls` (region select +
 * Explode button) and the per-scenario Tweakpane shape/duration knobs.
 *
 * Rows:
 *   - Nuclear (region select, radius / stretch / duration sliders)
 *   - Global Warming (max ΔT, duration)
 *   - Ice Age      (max ΔT, duration)
 *   - Nuclear War  (strike count, window, peak ΔT, soot, duration)
 *
 * Each row has a Launch button. Climate scenarios share a two-slot
 * mutex (up to two concurrent climate kinds) — the disabled state is
 * polled from `registry.climateSlotsFull()` per call.
 *
 * One global "Sea-level multiplier" slider sits above the climate rows.
 * Climate handlers read it through `ctx.getSeaLevelMultiplier()` and
 * scale `seaLevelFromTempDelta(liveTempC, mult)` — sea level is no
 * longer an independent payload knob.
 *
 * Cos-lat-weighted random sampling (asin(sin(lat0) + r·(sin(lat1)-sin(lat0))))
 * matches the old explode-button behaviour so a tall region box doesn't
 * over-sample mid-latitudes.
 */
import { DEFAULT_NUCLEAR_WAR_CONFIG } from '../world/scenarios/handlers/NuclearWarScenario.config.js';
const REGION_BOXES = {
    USA: { latMin: 25, latMax: 49, lonMin: -125, lonMax: -67 },
    Europe: { latMin: 36, latMax: 71, lonMin: -10, lonMax: 40 },
    China: { latMin: 18, latMax: 53, lonMin: 73, lonMax: 135 },
};
export function mountScenariosLauncher(_toggleEl, panelEl, registry, totalDaysProvider, debugState) {
    // Climate Launch buttons need their disabled state polled — keep refs
    // so the rAF poll below doesn't have to walk the DOM each frame.
    const climateLaunchButtons = [];
    // --- Row 1: Nuclear ---
    const nuke = buildRow(panelEl, '☢', 'Nuclear');
    const regionSelect = document.createElement('select');
    for (const r of Object.keys(REGION_BOXES)) {
        const opt = document.createElement('option');
        opt.value = r;
        opt.textContent = r;
        regionSelect.appendChild(opt);
    }
    const regionField = buildField('Region');
    regionField.label.removeChild(regionField.value);
    regionField.field.appendChild(regionSelect);
    nuke.body.appendChild(regionField.field);
    const nukeSliders = buildSliders(nuke.body, [
        {
            key: 'radiusKm',
            label: 'Blast radius (km)',
            min: 50, max: 2000, step: 10, default: 450,
            formatValue: (v) => `${v.toFixed(0)} km`,
        },
        {
            key: 'stretchKm',
            label: 'Fallout stretch (km)',
            min: 0, max: 3000, step: 10, default: 1200,
            formatValue: (v) => `${v.toFixed(0)} km`,
        },
        {
            key: 'durationDays',
            label: 'Fallout duration (days)',
            min: 2, max: 120, step: 1, default: 24,
            formatValue: (v) => `${v.toFixed(0)} d`,
        },
    ]);
    const nukeLaunch = buildLaunchButton('Launch nuclear strike');
    nuke.body.appendChild(nukeLaunch);
    nukeLaunch.addEventListener('click', () => {
        const region = regionSelect.value;
        const box = REGION_BOXES[region] ?? REGION_BOXES.USA;
        const sinMin = Math.sin((box.latMin * Math.PI) / 180);
        const sinMax = Math.sin((box.latMax * Math.PI) / 180);
        const latRad = Math.asin(sinMin + Math.random() * (sinMax - sinMin));
        const lonRad = ((box.lonMin + Math.random() * (box.lonMax - box.lonMin)) * Math.PI) / 180;
        const latDeg = (latRad * 180) / Math.PI;
        const lonDeg = (lonRad * 180) / Math.PI;
        const payload = {
            latDeg,
            lonDeg,
            radiusKm: nukeSliders.radiusKm.get(),
            stretchKm: nukeSliders.stretchKm.get(),
            windBearingDeg: 0, // overwritten by NuclearScenario.onStart
        };
        const r = registry.start('nuclear', payload, totalDaysProvider(), nukeSliders.durationDays.get(), { label: `Nuclear strike — ${region}` });
        handleStartResult(r);
    });
    // --- Global "Sea-level multiplier" — one knob above the climate rows ---
    // Sea level on every climate handler is derived from
    // `seaLevelFromTempDelta(liveTempC, multiplier)`; this slider drives
    // the multiplier. 1.0 = paleoclimate-anchored response. Range 0..10
    // for stress-testing the LAND shader / atmosphere shell at extreme
    // sea heights without per-scenario tuning.
    const multRow = buildRow(panelEl, '🌊', 'Sea-level multiplier');
    multRow.root.classList.add('expanded');
    const multField = buildField('Multiplier (×)');
    const multInput = document.createElement('input');
    multInput.type = 'range';
    multInput.min = '0';
    multInput.max = '10';
    multInput.step = '0.1';
    multInput.value = String(debugState.scenarios.seaLevelMultiplier);
    multField.value.textContent = `${debugState.scenarios.seaLevelMultiplier.toFixed(1)} ×`;
    multInput.addEventListener('input', () => {
        const v = parseFloat(multInput.value);
        debugState.scenarios.seaLevelMultiplier = v;
        multField.value.textContent = `${v.toFixed(1)} ×`;
    });
    multField.field.appendChild(multInput);
    multRow.body.appendChild(multField.field);
    // --- Row 2: Global Warming ---
    const warming = buildRow(panelEl, '🔥', 'Global Warming');
    const warmingSliders = buildSliders(warming.body, [
        {
            key: 'maxTempDeltaC',
            label: 'Max ΔT (°C)',
            min: 0, max: 30, step: 0.5, default: 8,
            formatValue: (v) => `+${v.toFixed(1)} °C`,
        },
        {
            key: 'durationDays',
            label: 'Duration (days)',
            min: 5, max: 120, step: 1, default: 30,
            formatValue: (v) => `${v.toFixed(0)} d`,
        },
    ]);
    const warmingLaunch = buildLaunchButton('Launch warming');
    warming.body.appendChild(warmingLaunch);
    climateLaunchButtons.push(warmingLaunch);
    warmingLaunch.addEventListener('click', () => {
        // Mutex enforced by the registry — a second concurrent climate
        // scenario returns `{ ok: false, reason: 'climate-busy' }`. The
        // Launch button is also greyed out by the per-frame poll below.
        const payload = {
            maxTempDeltaC: warmingSliders.maxTempDeltaC.get(),
        };
        const r = registry.start('globalWarming', payload, totalDaysProvider(), warmingSliders.durationDays.get(), { label: 'Global Warming' });
        handleStartResult(r);
    });
    // --- Row 3: Ice Age ---
    const ice = buildRow(panelEl, '❄', 'Ice Age');
    const iceSliders = buildSliders(ice.body, [
        {
            key: 'maxTempDeltaC',
            label: 'Max ΔT (°C)',
            min: -30, max: 0, step: 0.5, default: -10,
            formatValue: (v) => `${v.toFixed(1)} °C`,
        },
        {
            key: 'durationDays',
            label: 'Duration (days)',
            min: 5, max: 240, step: 1, default: 60,
            formatValue: (v) => `${v.toFixed(0)} d`,
        },
    ]);
    const iceLaunch = buildLaunchButton('Launch ice age');
    ice.body.appendChild(iceLaunch);
    climateLaunchButtons.push(iceLaunch);
    iceLaunch.addEventListener('click', () => {
        const payload = {
            maxTempDeltaC: iceSliders.maxTempDeltaC.get(),
        };
        const r = registry.start('iceAge', payload, totalDaysProvider(), iceSliders.durationDays.get(), { label: 'Ice Age' });
        handleStartResult(r);
    });
    // --- Row 4: Nuclear War ---
    const war = buildRow(panelEl, '☢☣', 'Nuclear War');
    const warCfg = DEFAULT_NUCLEAR_WAR_CONFIG;
    const warSliders = buildSliders(war.body, [
        {
            key: 'strikeCount',
            label: 'Strike count',
            min: 10, max: 150, step: 1, default: warCfg.strikeCount,
            formatValue: (v) => `${v.toFixed(0)}`,
        },
        {
            key: 'strikeWindowDays',
            label: 'Strike window (days)',
            min: 0.5, max: 5, step: 0.1, default: warCfg.strikeFireWindowDays,
            formatValue: (v) => `${v.toFixed(1)} d`,
        },
        {
            key: 'maxTempDeltaC',
            label: 'Peak ΔT (°C)',
            min: -15, max: 0, step: 0.5, default: warCfg.maxTempDeltaC,
            formatValue: (v) => `${v.toFixed(1)} °C`,
        },
        {
            key: 'peakSootGlobal',
            label: 'Peak soot',
            min: 0, max: 1, step: 0.05, default: warCfg.peakSootGlobal,
            formatValue: (v) => `${v.toFixed(2)}`,
        },
        {
            key: 'durationDays',
            label: 'Duration (days)',
            min: 60, max: 360, step: 1, default: warCfg.durationDays,
            formatValue: (v) => `${v.toFixed(0)} d`,
        },
    ]);
    // Rebuild-after-war checkbox.
    const rebuildField = buildField('Rebuild after war');
    rebuildField.label.removeChild(rebuildField.value);
    const rebuildInput = document.createElement('input');
    rebuildInput.type = 'checkbox';
    rebuildInput.checked = false;
    rebuildField.field.appendChild(rebuildInput);
    war.body.appendChild(rebuildField.field);
    const warLaunch = buildLaunchButton('Launch nuclear war');
    war.body.appendChild(warLaunch);
    climateLaunchButtons.push(warLaunch);
    warLaunch.addEventListener('click', () => {
        // Truncate the schedule before passing to the registry — the
        // scenario fills it from top-N cities in onStart when empty.
        const payload = {
            schedule: [],
            strikeCount: Math.round(warSliders.strikeCount.get()),
            strikeWindowDays: warSliders.strikeWindowDays.get(),
            airplaneStopAtDay: warCfg.airplaneStopAtDay,
            maxTempDeltaC: warSliders.maxTempDeltaC.get(),
            peakSootGlobal: warSliders.peakSootGlobal.get(),
            strikeEndFrac: warCfg.strikeEndFrac,
            winterRampEndFrac: warCfg.winterRampEndFrac,
            winterPlateauEndFrac: warCfg.winterPlateauEndFrac,
            rebuildAfterWar: rebuildInput.checked,
        };
        const r = registry.start('nuclearWar', payload, totalDaysProvider(), warSliders.durationDays.get(), { label: 'Nuclear War' });
        handleStartResult(r);
    });
    // Climate slot polling — cheap, drives the per-frame disabled state
    // of the Global Warming / Ice Age Launch buttons. Disabled only when
    // both climate slots are taken (two concurrent climate scenarios).
    const pollDisabled = () => {
        const busy = registry.climateSlotsFull();
        for (const btn of climateLaunchButtons) {
            if (btn.disabled !== busy)
                btn.disabled = busy;
            btn.title = busy ? 'Both climate slots in use — stop one first' : '';
        }
    };
    pollDisabled();
    const pollRaf = () => {
        pollDisabled();
        rafHandle = requestAnimationFrame(pollRaf);
    };
    let rafHandle = requestAnimationFrame(pollRaf);
    function dispose() {
        cancelAnimationFrame(rafHandle);
        // Remove all injected rows; keep the <h3> header.
        panelEl.querySelectorAll('.scenario-launcher-row').forEach((el) => el.remove());
    }
    return { dispose };
}
function handleStartResult(r) {
    if (r.ok)
        return;
    if (r.reason === 'climate-busy') {
        console.warn(`[scenarios-launcher] climate scenario already active: ${r.activeId}`);
    }
}
function buildRow(host, icon, title) {
    const root = document.createElement('div');
    root.className = 'scenario-launcher-row';
    const header = document.createElement('div');
    header.className = 'scenario-launcher-row-header';
    const iconSpan = document.createElement('span');
    iconSpan.className = 'scenario-launcher-row-icon';
    iconSpan.textContent = icon;
    const titleSpan = document.createElement('span');
    titleSpan.className = 'scenario-launcher-row-title';
    titleSpan.textContent = title;
    const caret = document.createElement('span');
    caret.className = 'scenario-launcher-row-caret';
    caret.textContent = '▸';
    header.appendChild(iconSpan);
    header.appendChild(titleSpan);
    header.appendChild(caret);
    const body = document.createElement('div');
    body.className = 'scenario-launcher-row-body';
    root.appendChild(header);
    root.appendChild(body);
    header.addEventListener('click', () => {
        root.classList.toggle('expanded');
    });
    host.appendChild(root);
    return { root, body };
}
function buildField(labelText) {
    const field = document.createElement('div');
    field.className = 'scenario-launcher-field';
    const label = document.createElement('div');
    label.className = 'scenario-launcher-field-label';
    const labelSpan = document.createElement('span');
    labelSpan.textContent = labelText;
    const value = document.createElement('span');
    value.className = 'scenario-launcher-field-value';
    label.appendChild(labelSpan);
    label.appendChild(value);
    field.appendChild(label);
    return { field, label, value };
}
function buildSliders(host, specs) {
    const out = {};
    for (const spec of specs) {
        const { field, value } = buildField(spec.label);
        const input = document.createElement('input');
        input.type = 'range';
        input.min = String(spec.min);
        input.max = String(spec.max);
        input.step = String(spec.step);
        input.value = String(spec.default);
        value.textContent = spec.formatValue(spec.default);
        input.addEventListener('input', () => {
            value.textContent = spec.formatValue(parseFloat(input.value));
        });
        field.appendChild(input);
        host.appendChild(field);
        out[spec.key] = {
            get: () => parseFloat(input.value),
            set: (v) => {
                input.value = String(v);
                value.textContent = spec.formatValue(v);
            },
        };
    }
    return out;
}
function buildLaunchButton(label) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'scenario-launcher-launch';
    btn.textContent = label;
    return btn;
}

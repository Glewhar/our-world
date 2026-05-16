/**
 * Right-side disaster rail. Tap to arm (reveals a thematic settings
 * panel for that disaster). Tap again to fire with the picked
 * magnitude. Tap the × to disarm.
 *
 * Active (arm-then-fire):
 *   - nuke    (full Nuclear War — barrage over top cities)
 *   - warming (config-driven temperature/duration)
 *   - ice     (config-driven temperature/duration)
 *
 * Locked (rendered desaturated with lock badge; flip on later by
 * setting `active: true` in the config):
 *   - asteroid, virus, volcano, tsunami, ai
 *
 * Climate slot fullness: when `registry.climateSlotsFull()` is true,
 * Warming + Ice get `is-disabled` styling (in-palette but blocked).
 */
import { DEFAULT_GLOBAL_WARMING_CONFIG } from '../world/scenarios/handlers/GlobalWarmingScenario.config.js';
import { DEFAULT_ICE_AGE_CONFIG } from '../world/scenarios/handlers/IceAgeScenario.config.js';
import { DEFAULT_NUCLEAR_WAR_CONFIG } from '../world/scenarios/handlers/NuclearWarScenario.config.js';
import { AiIcon, AsteroidIcon, BonfireIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon, IceIcon, LockIcon, RadIcon, TsunamiIcon, VirusIcon, VolcanoIcon, } from './icons.js';
const NUKE_MIN = 1;
const NUKE_MAX = 120;
const HEAT_MIN = 1;
const HEAT_MAX = 50;
const ICE_MIN = -50;
const ICE_MAX = -1;
export function mountDisasterRail(host, registry, totalDaysProvider) {
    host.replaceChildren();
    host.classList.remove('collapsed');
    let armed = null;
    const onDocPointerDown = (ev) => {
        if (!armed)
            return;
        const t = ev.target;
        if (!t)
            return;
        if (armed.wrap.contains(t))
            return;
        if (armed.btn.contains(t))
            return; // btn click handler will run
        disarm();
    };
    const collapseBtn = document.createElement('button');
    collapseBtn.type = 'button';
    collapseBtn.className = 'rail-collapse-btn';
    collapseBtn.setAttribute('aria-label', 'Collapse disaster rail');
    collapseBtn.innerHTML = ChevronRightIcon;
    collapseBtn.addEventListener('click', () => {
        disarm();
        const collapsed = host.classList.toggle('collapsed');
        collapseBtn.innerHTML = collapsed ? ChevronLeftIcon : ChevronRightIcon;
        collapseBtn.setAttribute('aria-label', collapsed ? 'Expand disaster rail' : 'Collapse disaster rail');
    });
    host.appendChild(collapseBtn);
    const body = document.createElement('div');
    body.className = 'rail-body';
    host.appendChild(body);
    function disarm() {
        if (!armed)
            return;
        document.removeEventListener('pointerdown', onDocPointerDown, true);
        armed.btn.classList.remove('is-armed');
        armed.wrap.replaceChildren();
        armed = null;
    }
    function arm(kind, btn, wrap) {
        if (armed?.kind === kind)
            return;
        disarm();
        let panel;
        if (kind === 'nuke')
            panel = buildNukePanel();
        else if (kind === 'warming')
            panel = buildHeatPanel();
        else
            panel = buildIcePanel();
        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'rail-settings-close';
        close.setAttribute('aria-label', 'Cancel');
        close.innerHTML = CloseIcon;
        close.addEventListener('click', (ev) => {
            ev.stopPropagation();
            disarm();
        });
        panel.root.appendChild(close);
        const initiate = document.createElement('button');
        initiate.type = 'button';
        initiate.className = `rs-initiate is-${kind}`;
        initiate.textContent = 'INITIATE';
        initiate.addEventListener('click', (ev) => {
            ev.stopPropagation();
            const v = panel.readValue();
            disarm();
            fire(kind, v);
        });
        panel.root.appendChild(initiate);
        wrap.replaceChildren(panel.root);
        btn.classList.add('is-armed');
        armed = { kind, btn, wrap, readValue: panel.readValue };
        // Defer attaching the doc handler so the current click that armed
        // us doesn't immediately disarm.
        setTimeout(() => {
            if (armed?.kind === kind) {
                document.addEventListener('pointerdown', onDocPointerDown, true);
            }
        }, 0);
    }
    function fire(kind, value) {
        if (kind === 'nuke') {
            const cfg = DEFAULT_NUCLEAR_WAR_CONFIG;
            const payload = {
                schedule: [],
                strikeCount: value,
                strikeWindowDays: cfg.strikeFireWindowDays,
                airplaneStopAtDay: cfg.airplaneStopAtDay,
                maxTempDeltaC: cfg.maxTempDeltaC,
                peakSootGlobal: cfg.peakSootGlobal,
                strikeEndFrac: cfg.strikeEndFrac,
                winterRampEndFrac: cfg.winterRampEndFrac,
                winterPlateauEndFrac: cfg.winterPlateauEndFrac,
            };
            registry.start('nuclearWar', payload, totalDaysProvider(), cfg.durationDays, { label: 'Nuclear War' });
            return;
        }
        if (kind === 'warming') {
            if (registry.climateSlotsFull())
                return;
            const payload = { maxTempDeltaC: value };
            registry.start('globalWarming', payload, totalDaysProvider(), DEFAULT_GLOBAL_WARMING_CONFIG.durationDays, { label: 'Heatwave' });
            return;
        }
        if (kind === 'ice') {
            if (registry.climateSlotsFull())
                return;
            const payload = { maxTempDeltaC: value };
            registry.start('iceAge', payload, totalDaysProvider(), DEFAULT_ICE_AGE_CONFIG.durationDays, { label: 'Ice Age' });
            return;
        }
    }
    const buttons = [
        { kind: 'nuke', icon: RadIcon, label: 'Nuke', active: true },
        { kind: 'warming', icon: BonfireIcon, label: 'Heatwave', active: true, isClimate: true },
        { kind: 'ice', icon: IceIcon, label: 'Ice Age', active: true, isClimate: true },
        { kind: 'asteroid', icon: AsteroidIcon, label: 'Asteroid', active: false },
        { kind: 'virus', icon: VirusIcon, label: 'Pandemic', active: false },
        { kind: 'volcano', icon: VolcanoIcon, label: 'Volcano', active: false },
        { kind: 'tsunami', icon: TsunamiIcon, label: 'Tsunami', active: false },
        { kind: 'ai', icon: AiIcon, label: 'AI', active: false },
    ];
    const climateButtons = [];
    const elsByKind = new Map();
    for (let i = 0; i < buttons.length; i++) {
        const b = buttons[i];
        if (i === 3) {
            const div = document.createElement('div');
            div.className = 'rail-divider';
            if (!buttons.slice(3).some(x => x.active))
                div.style.display = 'none';
            body.appendChild(div);
        }
        const slot = document.createElement('div');
        slot.className = 'rail-slot';
        slot.dataset['kind'] = b.kind;
        const settingsWrap = document.createElement('div');
        settingsWrap.className = 'rail-settings-wrap';
        slot.appendChild(settingsWrap);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'rail-btn';
        btn.dataset['kind'] = b.kind;
        btn.setAttribute('aria-label', b.label);
        btn.title = b.label;
        btn.innerHTML = b.icon;
        if (!b.active) {
            btn.classList.add('is-locked');
            btn.setAttribute('aria-disabled', 'true');
            slot.style.display = 'none';
            const lock = document.createElement('span');
            lock.className = 'rail-lock';
            lock.innerHTML = LockIcon;
            btn.appendChild(lock);
        }
        else {
            btn.addEventListener('click', () => {
                if (b.isClimate && registry.climateSlotsFull())
                    return;
                if (armed?.kind === b.kind) {
                    disarm();
                }
                else {
                    arm(b.kind, btn, settingsWrap);
                }
            });
            if (b.isClimate)
                climateButtons.push(btn);
        }
        slot.appendChild(btn);
        body.appendChild(slot);
        elsByKind.set(b.kind, btn);
    }
    function update() {
        const busy = registry.climateSlotsFull();
        for (const btn of climateButtons) {
            const want = busy;
            const has = btn.classList.contains('is-disabled');
            if (want !== has) {
                btn.classList.toggle('is-disabled', want);
                btn.title = want ? 'Both climate slots busy — stop one first' : (btn.dataset['kind'] === 'warming' ? 'Heatwave' : 'Ice Age');
                if (want && armed?.kind === btn.dataset['kind'])
                    disarm();
            }
        }
    }
    function dispose() {
        disarm();
        host.replaceChildren();
    }
    return { update, dispose };
}
/* ------------------------------------------------------------------------- */
/* Per-scenario settings panels                                              */
/* ------------------------------------------------------------------------- */
function buildNukePanel() {
    const root = document.createElement('div');
    root.className = 'rail-settings is-nuke';
    const label = document.createElement('div');
    label.className = 'rs-label';
    label.textContent = 'WARHEADS';
    root.appendChild(label);
    const head = document.createElement('div');
    head.className = 'rs-nuke-head';
    const trefoil = document.createElement('span');
    trefoil.className = 'rs-nuke-trefoil';
    trefoil.innerHTML = RadIcon;
    head.appendChild(trefoil);
    const readout = document.createElement('span');
    readout.className = 'rs-nuke-readout';
    head.appendChild(readout);
    root.appendChild(head);
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = String(NUKE_MIN);
    slider.max = String(NUKE_MAX);
    slider.step = '1';
    slider.value = String(DEFAULT_NUCLEAR_WAR_CONFIG.strikeCount);
    slider.className = 'rs-nuke-slider';
    root.appendChild(slider);
    const sync = () => {
        const v = parseInt(slider.value, 10);
        const t = (v - NUKE_MIN) / (NUKE_MAX - NUKE_MIN);
        readout.textContent = String(v);
        root.style.setProperty('--intensity', t.toFixed(3));
        root.classList.toggle('is-hot', t > 0.66);
        root.classList.toggle('is-shaking', t > 0.85);
    };
    slider.addEventListener('input', sync);
    sync();
    return { root, readValue: () => parseInt(slider.value, 10) };
}
function buildHeatPanel() {
    return buildThermometerPanel({
        kind: 'heat',
        min: HEAT_MIN,
        max: HEAT_MAX,
        def: DEFAULT_GLOBAL_WARMING_CONFIG.maxTempDeltaC,
        label: (v) => `+${v} °C`,
        ticks: [5, 15, 30, 45],
    });
}
function buildIcePanel() {
    return buildThermometerPanel({
        kind: 'ice',
        min: ICE_MIN,
        max: ICE_MAX,
        def: DEFAULT_ICE_AGE_CONFIG.maxTempDeltaC,
        label: (v) => `${v} °C`,
        ticks: [-5, -15, -30, -45],
    });
}
function buildThermometerPanel(opts) {
    const root = document.createElement('div');
    root.className = `rail-settings is-thermo is-${opts.kind}`;
    const label = document.createElement('div');
    label.className = 'rs-label';
    label.textContent = opts.kind === 'heat' ? 'WARMING' : 'COOLING';
    root.appendChild(label);
    const readout = document.createElement('div');
    readout.className = 'rs-thermo-readout';
    root.appendChild(readout);
    const stage = document.createElement('div');
    stage.className = 'rs-thermo-stage';
    // For heat: fill grows as value rises (warmer). For ice: fill grows as it gets colder (more negative).
    // Both read 0 at the "mild" end (heat min / ice max=-1) and 1 at the "extreme" end (heat max / ice min=-50).
    const fillFor = (v) => {
        if (opts.kind === 'heat')
            return (v - opts.min) / (opts.max - opts.min);
        return (opts.max - v) / (opts.max - opts.min);
    };
    // SVG thermometer.
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 60 180');
    svg.setAttribute('class', 'rs-thermo-svg');
    // Outer aura.
    const aura = document.createElementNS(svgNS, 'circle');
    aura.setAttribute('cx', '30');
    aura.setAttribute('cy', '155');
    aura.setAttribute('r', '22');
    aura.setAttribute('class', 'rs-thermo-aura');
    svg.appendChild(aura);
    // Frost crystals (ice only) — drawn behind the bulb, fade in with cold.
    if (opts.kind === 'ice') {
        const frostGroup = document.createElementNS(svgNS, 'g');
        frostGroup.setAttribute('class', 'rs-thermo-frost');
        const frostPaths = [
            'M30 132 L30 178 M14 155 L46 155 M19 144 L41 166 M19 166 L41 144',
            'M8 150 L18 150 M13 145 L13 155',
            'M52 150 L42 150 M47 145 L47 155',
            'M30 178 L25 184 M30 178 L35 184',
        ];
        for (const d of frostPaths) {
            const p = document.createElementNS(svgNS, 'path');
            p.setAttribute('d', d);
            p.setAttribute('stroke', '#dff4ff');
            p.setAttribute('stroke-width', '1.2');
            p.setAttribute('stroke-linecap', 'round');
            p.setAttribute('fill', 'none');
            frostGroup.appendChild(p);
        }
        svg.appendChild(frostGroup);
    }
    // Glass tube outline.
    const tube = document.createElementNS(svgNS, 'path');
    // Tube body: top arc + sides + flares into the bulb.
    tube.setAttribute('d', 'M24 18 a6 6 0 0 1 12 0 L36 138 a18 18 0 1 1 -12 0 Z');
    tube.setAttribute('class', 'rs-thermo-tube');
    svg.appendChild(tube);
    // Inner mercury column (clip to tube via clipPath).
    const defs = document.createElementNS(svgNS, 'defs');
    const clip = document.createElementNS(svgNS, 'clipPath');
    clip.setAttribute('id', `rs-thermo-clip-${opts.kind}`);
    const clipPath = document.createElementNS(svgNS, 'path');
    clipPath.setAttribute('d', 'M26 20 a4 4 0 0 1 8 0 L34 140 a16 16 0 1 1 -8 0 Z');
    clip.appendChild(clipPath);
    defs.appendChild(clip);
    // Linear gradient for the mercury.
    const gradient = document.createElementNS(svgNS, 'linearGradient');
    gradient.setAttribute('id', `rs-thermo-grad-${opts.kind}`);
    gradient.setAttribute('x1', '0');
    gradient.setAttribute('x2', '0');
    gradient.setAttribute('y1', '1');
    gradient.setAttribute('y2', '0');
    if (opts.kind === 'heat') {
        const stops = [
            ['0', '#ff3010'],
            ['0.5', '#ff8030'],
            ['1', '#ffd070'],
        ];
        for (const [o, c] of stops) {
            const s = document.createElementNS(svgNS, 'stop');
            s.setAttribute('offset', o);
            s.setAttribute('stop-color', c);
            gradient.appendChild(s);
        }
    }
    else {
        const stops = [
            ['0', '#dff8ff'],
            ['0.5', '#5ec8ff'],
            ['1', '#1a4ed0'],
        ];
        for (const [o, c] of stops) {
            const s = document.createElementNS(svgNS, 'stop');
            s.setAttribute('offset', o);
            s.setAttribute('stop-color', c);
            gradient.appendChild(s);
        }
    }
    defs.appendChild(gradient);
    svg.appendChild(defs);
    const mercuryGroup = document.createElementNS(svgNS, 'g');
    mercuryGroup.setAttribute('clip-path', `url(#rs-thermo-clip-${opts.kind})`);
    // Bulb (always full).
    const bulb = document.createElementNS(svgNS, 'circle');
    bulb.setAttribute('cx', '30');
    bulb.setAttribute('cy', '155');
    bulb.setAttribute('r', '16');
    bulb.setAttribute('fill', `url(#rs-thermo-grad-${opts.kind})`);
    mercuryGroup.appendChild(bulb);
    // Column rect — height controlled at runtime via attribute.
    const column = document.createElementNS(svgNS, 'rect');
    column.setAttribute('x', '26');
    column.setAttribute('width', '8');
    column.setAttribute('fill', `url(#rs-thermo-grad-${opts.kind})`);
    column.setAttribute('class', 'rs-thermo-column');
    mercuryGroup.appendChild(column);
    svg.appendChild(mercuryGroup);
    // Tick marks on the side.
    const tickGroup = document.createElementNS(svgNS, 'g');
    tickGroup.setAttribute('class', 'rs-thermo-ticks');
    for (const t of opts.ticks) {
        const f = fillFor(t);
        const y = 138 - f * 118; // 138 = column bottom, 118 = column travel.
        const tick = document.createElementNS(svgNS, 'line');
        tick.setAttribute('x1', '40');
        tick.setAttribute('x2', '46');
        tick.setAttribute('y1', String(y));
        tick.setAttribute('y2', String(y));
        tickGroup.appendChild(tick);
    }
    svg.appendChild(tickGroup);
    stage.appendChild(svg);
    // Visible custom handle (.rs-thermo-puck). The native input below is
    // invisible — it only catches drag events.
    const puck = document.createElement('div');
    puck.className = 'rs-thermo-puck';
    stage.appendChild(puck);
    // Vertical slider overlay (interactive but visually invisible).
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = String(opts.min);
    slider.max = String(opts.max);
    slider.step = '1';
    slider.value = String(opts.def);
    slider.className = 'rs-thermo-slider';
    // Vertical orientation hints for browsers.
    slider.setAttribute('orient', 'vertical');
    stage.appendChild(slider);
    root.appendChild(stage);
    const sync = () => {
        const v = parseInt(slider.value, 10);
        const f = Math.max(0, Math.min(1, fillFor(v)));
        const colTop = 138 - f * 118;
        column.setAttribute('y', String(colTop));
        column.setAttribute('height', String(138 - colTop));
        readout.textContent = opts.label(v);
        root.style.setProperty('--fill', f.toFixed(3));
    };
    slider.addEventListener('input', sync);
    sync();
    return { root, readValue: () => parseInt(slider.value, 10) };
}

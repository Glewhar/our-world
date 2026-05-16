/**
 * Left-side subtle stack — SEA / TEMP / L-W cards (desktop only).
 *
 * SEA: live `registry.getClimateFrame().seaLevelM` — displayed with sign.
 * TEMP: live `registry.getClimateFrame().tempC` — displayed with sign.
 * L/W: placeholder `--/--` until `WorldTotals.landFraction` exposed.
 */
import { LandWaterIcon } from './icons.js';
export function mountSubtleStack(host, _registry) {
    host.replaceChildren();
    const lw = buildCard(host, 'land', LandWaterIcon, 'L/W');
    lw.value.textContent = '--/--';
    function update() { }
    function dispose() {
        host.replaceChildren();
    }
    return { update, dispose };
}
function buildCard(host, tone, icon, label) {
    const root = document.createElement('div');
    root.className = 'ss-card';
    root.dataset['tone'] = tone;
    const iconEl = document.createElement('div');
    iconEl.className = 'ss-icon';
    iconEl.innerHTML = icon;
    const labelEl = document.createElement('div');
    labelEl.className = 'ss-label';
    labelEl.textContent = label;
    const value = document.createElement('div');
    value.className = 'ss-value';
    value.textContent = '—';
    root.appendChild(iconEl);
    root.appendChild(labelEl);
    root.appendChild(value);
    host.appendChild(root);
    return { root, value };
}

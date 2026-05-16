/**
 * Settings sheet — toggleable bottom-right panel hosting:
 *   - Render-scale slider + AUTO chip
 *   - Auto-orbit toggle
 *   - Clouds toggle
 *   - FPS-counter toggle
 *   - (dev only) Tweakpane mount point
 *
 * Built procedurally so styling lives in one place. The cog button in the
 * topbar drives `.toggle()` / `.hide()` via main.ts.
 */

import type { DebugState } from '../debug/Tweakpane.js';

export type SettingsSheetMount = {
  toggle(): void;
  hide(): void;
  /** Read-only ref so main.ts can mount tweakpane inside this sheet. */
  readonly tweakpaneHost: HTMLDivElement;
  dispose(): void;
};

export function mountSettingsSheet(
  host: HTMLElement,
  state: DebugState,
  applyRenderScale: (s: number) => void,
  autoRenderScale: number,
  autoTierLabel: string,
  onPaneRefresh: () => void,
): SettingsSheetMount {
  // Preserve the pre-existing #tweakpane-host (Tweakpane already mounted
  // into it before this fn ran). We rebuild the sheet's chrome around it.
  const existingTweakpane = host.querySelector<HTMLDivElement>('#tweakpane-host');
  if (existingTweakpane) existingTweakpane.remove();
  host.replaceChildren();
  host.hidden = true;

  // --- Render scale ---
  const hScale = document.createElement('div');
  hScale.className = 'ss-h';
  hScale.textContent = 'Quality';
  host.appendChild(hScale);

  const scaleRow = document.createElement('div');
  scaleRow.className = 'ss-row';
  const scaleLabel = document.createElement('label');
  scaleLabel.textContent = 'Render scale';
  const scaleReadout = document.createElement('span');
  scaleReadout.className = 'ss-readout';
  scaleReadout.textContent = pct(state.renderScale);
  scaleRow.appendChild(scaleLabel);
  scaleRow.appendChild(scaleReadout);
  host.appendChild(scaleRow);

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '0.5';
  slider.max = '1.0';
  slider.step = '0.05';
  slider.value = String(state.renderScale);
  slider.className = 'ss-slider';
  slider.addEventListener('input', () => {
    const v = parseFloat(slider.value);
    applyRenderScale(v);
    scaleReadout.textContent = pct(v);
  });
  host.appendChild(slider);

  const actions = document.createElement('div');
  actions.className = 'ss-actions';
  const hint = document.createElement('span');
  hint.className = 'ss-hint';
  hint.textContent = `Auto: ${autoTierLabel} @ ${pct(autoRenderScale)}`;
  const auto = document.createElement('button');
  auto.type = 'button';
  auto.className = 'ss-auto';
  auto.textContent = 'AUTO';
  auto.addEventListener('click', () => {
    slider.value = String(autoRenderScale);
    applyRenderScale(autoRenderScale);
    scaleReadout.textContent = pct(autoRenderScale);
  });
  actions.appendChild(hint);
  actions.appendChild(auto);
  host.appendChild(actions);

  // --- Layer toggles ---
  const hLayers = document.createElement('div');
  hLayers.className = 'ss-h';
  hLayers.textContent = 'Layers';
  host.appendChild(hLayers);

  buildToggle(host, 'Auto orbit', state.camera.autoOrbit, (on) => {
    state.camera.autoOrbit = on;
    onPaneRefresh();
  });

  buildToggle(host, 'Clouds', state.layers.clouds, (on) => {
    state.layers.clouds = on;
    onPaneRefresh();
  });

  buildToggle(host, 'FPS counter', state.debug.fpsCounter, (on) => {
    state.debug.fpsCounter = on;
  });

  // --- Tweakpane host (dev) ---
  // Re-attach the pre-existing host (with its already-mounted Tweakpane DOM)
  // or create a fresh empty div if none was present (test setups).
  const tweakpaneHost = existingTweakpane ?? document.createElement('div');
  tweakpaneHost.id = 'tweakpane-host';
  host.appendChild(tweakpaneHost);

  function toggle(): void { host.hidden = !host.hidden; }
  function hide(): void { host.hidden = true; }
  function dispose(): void { host.replaceChildren(); }

  return { toggle, hide, tweakpaneHost, dispose };
}

function pct(s: number): string { return `${Math.round(s * 100)}%`; }

function buildToggle(
  host: HTMLElement,
  label: string,
  initial: boolean,
  onChange: (on: boolean) => void,
): void {
  const wrap = document.createElement('label');
  wrap.className = 'ss-toggle';
  const name = document.createElement('span');
  name.className = 'layer-name';
  name.textContent = label;
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = initial;
  const track = document.createElement('span');
  track.className = 'toggle-track';
  const thumb = document.createElement('span');
  thumb.className = 'toggle-thumb';
  track.appendChild(thumb);
  wrap.appendChild(name);
  wrap.appendChild(input);
  wrap.appendChild(track);
  input.addEventListener('change', () => onChange(input.checked));
  host.appendChild(wrap);
}

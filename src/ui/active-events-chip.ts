/**
 * Active-events popover — list of running scenarios anchored under the
 * topbar chip. Tap the chip to toggle. Each row shows icon, name, mini
 * progress bar, days-remaining (∞ when autoRepeat), and a × stop button.
 *
 * The chip itself lives in the topbar and only carries a count; this
 * module reconciles the popover list against `registry.list()` each frame.
 */

import type { Scenario, ScenarioRegistry } from '../world/scenarios/index.js';
import { ChevronDownIcon, ChevronUpIcon, IceIcon, NukeIcon, WarmingIcon } from './icons.js';

export type ActiveEventsMount = {
  /** Reconcile rows + count. Safe each RAF. Returns current count. */
  update(): number;
  toggle(): void;
  hide(): void;
  dispose(): void;
};

export function mountActiveEvents(
  popoverHost: HTMLElement,
  registry: ScenarioRegistry,
  totalDaysProvider: () => number,
): ActiveEventsMount {
  popoverHost.replaceChildren();
  popoverHost.hidden = true;
  popoverHost.classList.remove('collapsed');

  const header = document.createElement('div');
  header.className = 'ae-header';
  const title = document.createElement('div');
  title.className = 'ae-title';
  title.textContent = 'Active Events';
  header.appendChild(title);
  const collapseBtn = document.createElement('button');
  collapseBtn.type = 'button';
  collapseBtn.className = 'ae-collapse-btn';
  collapseBtn.setAttribute('aria-label', 'Collapse events');
  collapseBtn.innerHTML = ChevronUpIcon;
  collapseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const collapsed = popoverHost.classList.toggle('collapsed');
    collapseBtn.innerHTML = collapsed ? ChevronDownIcon : ChevronUpIcon;
    collapseBtn.setAttribute('aria-label', collapsed ? 'Expand events' : 'Collapse events');
  });
  header.appendChild(collapseBtn);
  popoverHost.appendChild(header);

  const body = document.createElement('div');
  body.className = 'ae-body';
  popoverHost.appendChild(body);

  const list = document.createElement('div');
  list.className = 'ae-list';
  body.appendChild(list);

  const empty = document.createElement('div');
  empty.className = 'ae-empty';
  empty.textContent = 'Nothing burning. For now.';
  body.appendChild(empty);

  type Row = {
    root: HTMLDivElement;
    fill: HTMLDivElement;
    daysEl: HTMLSpanElement;
    nameEl: HTMLSpanElement;
    iconEl: HTMLDivElement;
    toneEl: HTMLDivElement;
  };
  const rowsById = new Map<string, Row>();

  function update(): number {
    const active = registry.list();
    const td = totalDaysProvider();
    const seen = new Set<string>();
    for (const scn of active) {
      seen.add(scn.id);
      let row = rowsById.get(scn.id);
      if (!row) {
        row = buildRow(scn, () => registry.stop(scn.id));
        rowsById.set(scn.id, row);
        list.appendChild(row.root);
      }
      const raw = (td - scn.startedAtDay) / Math.max(1e-6, scn.durationDays);
      const p01 = raw < 0 ? 0 : raw > 1 ? 1 : raw;
      if (scn.autoRepeat) {
        row.fill.style.width = '100%';
        row.daysEl.textContent = '∞';
      } else {
        row.fill.style.width = `${(p01 * 100).toFixed(1)}%`;
        const remaining = Math.max(0, Math.ceil(scn.durationDays - p01 * scn.durationDays));
        row.daysEl.textContent = `${remaining}d`;
      }
    }
    rowsById.forEach((r, id) => {
      if (!seen.has(id)) {
        r.root.remove();
        rowsById.delete(id);
      }
    });
    empty.style.display = active.length === 0 ? 'block' : 'none';
    return active.length;
  }

  function toggle(): void { popoverHost.hidden = !popoverHost.hidden; }
  function hide(): void { popoverHost.hidden = true; }

  function dispose(): void {
    popoverHost.replaceChildren();
    rowsById.clear();
  }

  return { update, toggle, hide, dispose };
}

function buildRow(scn: Scenario, onStop: () => void): {
  root: HTMLDivElement;
  fill: HTMLDivElement;
  daysEl: HTMLSpanElement;
  nameEl: HTMLSpanElement;
  iconEl: HTMLDivElement;
  toneEl: HTMLDivElement;
} {
  const root = document.createElement('div');
  root.className = 'ae-row';
  root.dataset['tone'] = toneFor(scn);

  const iconEl = document.createElement('div');
  iconEl.className = 'ae-row-icon';
  iconEl.innerHTML = iconFor(scn);

  const text = document.createElement('div');
  text.style.minWidth = '0';
  const nameEl = document.createElement('span');
  nameEl.className = 'ae-row-name';
  nameEl.textContent = scn.label;
  const progress = document.createElement('div');
  progress.className = 'ae-row-progress';
  const fill = document.createElement('div');
  fill.className = 'ae-row-progress-fill';
  progress.appendChild(fill);
  text.appendChild(nameEl);
  text.appendChild(progress);

  const meta = document.createElement('div');
  meta.className = 'ae-row-meta';
  const daysEl = document.createElement('span');
  daysEl.className = 'ae-row-days';
  daysEl.textContent = '—';
  meta.appendChild(daysEl);

  const stop = document.createElement('button');
  stop.type = 'button';
  stop.className = 'ae-row-stop';
  stop.setAttribute('aria-label', 'Stop scenario');
  stop.innerHTML = '×';
  stop.addEventListener('click', (e) => {
    e.stopPropagation();
    onStop();
  });

  root.appendChild(iconEl);
  root.appendChild(text);
  root.appendChild(meta);
  root.appendChild(stop);
  return { root, fill, daysEl, nameEl, iconEl, toneEl: root };
}

function iconFor(scn: Scenario): string {
  switch (scn.kind) {
    case 'nuclear':       return NukeIcon;
    case 'globalWarming': return WarmingIcon;
    case 'iceAge':        return IceIcon;
    case 'nuclearWar':    return NukeIcon;
  }
}

function toneFor(scn: Scenario): string {
  switch (scn.kind) {
    case 'nuclear':       return 'nuke';
    case 'globalWarming': return 'warming';
    case 'iceAge':        return 'ice';
    case 'nuclearWar':    return 'war';
  }
}

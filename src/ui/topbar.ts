/**
 * Topbar — clock pill + FPS + active-events chip + cog button.
 *
 * Owns the DOM nodes declared in `index.html`:
 *   #clock-pill (#time-pause / #time-readout / #date-readout / #season-sun)
 *   #fps-counter
 *   #active-events-chip + #active-events-count (chip visibility only;
 *   the popover module reconciles the list and listens for chip clicks)
 *   #settings-toggle
 *
 * Reads `debug.state.timeOfDay.{t01,timeOfYear01,yearsElapsed,paused,totalDays}`
 * each RAF tick. The pause button toggles `paused` and refreshes Tweakpane.
 */

import type { DebugState } from '../debug/Tweakpane.js';
import { PauseIcon, PlayIcon } from './icons.js';

export type TopbarMount = {
  /** Refresh clock / date / sun position. Safe to call each RAF. */
  update(deltaMs: number): void;
  /** Toggle visibility of FPS counter (read from debug.state.debug.fpsCounter). */
  setFpsVisible(visible: boolean): void;
  /** Update the active-events chip count (hides when 0). */
  setActiveEventsCount(n: number): void;
  /** Bind the settings cog button. */
  onSettings(cb: () => void): void;
  /** Bind the active-events chip click. */
  onActiveEvents(cb: () => void): void;
  dispose(): void;
};

const START_YEAR = 2067;
const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                     'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const SEASON_PHASE_OFFSET = 0.221;

export function mountTopbar(
  state: DebugState,
  onPaneRefresh: () => void,
): TopbarMount {
  const timeReadout = document.getElementById('time-readout')!;
  const dateReadout = document.getElementById('date-readout')!;
  const timePause = document.getElementById('time-pause') as HTMLButtonElement;
  const seasonSun = document.getElementById('season-sun') as unknown as SVGCircleElement;
  const fpsCounter = document.getElementById('fps-counter')!;
  const chip = document.getElementById('active-events-chip') as HTMLButtonElement;
  const chipCount = document.getElementById('active-events-count')!;
  const settingsBtn = document.getElementById('settings-toggle') as HTMLButtonElement;

  let lastPaused = !state.timeOfDay.paused; // force first refresh
  const refreshPauseIcon = (): void => {
    if (state.timeOfDay.paused === lastPaused) return;
    timePause.innerHTML = state.timeOfDay.paused ? PlayIcon : PauseIcon;
    timePause.setAttribute(
      'aria-label',
      state.timeOfDay.paused ? 'Resume time' : 'Pause time',
    );
    lastPaused = state.timeOfDay.paused;
  };
  refreshPauseIcon();

  const onPauseClick = (): void => {
    state.timeOfDay.paused = !state.timeOfDay.paused;
    refreshPauseIcon();
    onPaneRefresh();
  };
  timePause.addEventListener('click', onPauseClick);

  // FPS rolling counter — 500ms window averaging.
  let fpsAccumMs = 0;
  let fpsFrames = 0;
  let fpsVisible = false;

  const formatTimeOfDay = (t01: number): string => {
    const total = t01 * 24;
    const hh = Math.floor(total) % 24;
    const mm = Math.floor((total - Math.floor(total)) * 6) * 10;
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  };
  const formatDate = (timeOfYear01: number, yearsElapsed: number): string => {
    const m = Math.min(11, Math.max(0, Math.floor(timeOfYear01 * 12)));
    return `${MONTH_NAMES[m]} ${START_YEAR + yearsElapsed}`;
  };

  let chipCb: (() => void) | null = null;
  let settingsCb: (() => void) | null = null;
  chip.addEventListener('click', () => chipCb?.());
  settingsBtn.addEventListener('click', () => settingsCb?.());

  function update(deltaMs: number): void {
    timeReadout.textContent = formatTimeOfDay(state.timeOfDay.t01);
    dateReadout.textContent = formatDate(state.timeOfDay.timeOfYear01, state.timeOfDay.yearsElapsed);
    // Sun-track: +1 declination (June solstice) sits at top (cy=8),
    // -1 (Dec solstice) at bottom (cy=28). Equator at cy=18.
    const n = Math.sin((state.timeOfDay.timeOfYear01 - SEASON_PHASE_OFFSET) * Math.PI * 2);
    seasonSun.setAttribute('cy', String(18 - n * 10));
    refreshPauseIcon();

    if (fpsVisible) {
      fpsAccumMs += deltaMs;
      fpsFrames += 1;
      if (fpsAccumMs >= 500) {
        const fps = (fpsFrames * 1000) / fpsAccumMs;
        fpsCounter.textContent = `${fps.toFixed(0)} FPS`;
        fpsAccumMs = 0;
        fpsFrames = 0;
      }
    }
  }

  function setFpsVisible(visible: boolean): void {
    if (visible === fpsVisible) return;
    fpsVisible = visible;
    fpsCounter.classList.toggle('visible', visible);
    if (!visible) {
      fpsAccumMs = 0;
      fpsFrames = 0;
    }
  }

  function setActiveEventsCount(n: number): void {
    if (n <= 0) {
      chip.hidden = true;
      return;
    }
    chip.hidden = false;
    chipCount.textContent = String(n);
  }

  function onSettings(cb: () => void): void { settingsCb = cb; }
  function onActiveEvents(cb: () => void): void { chipCb = cb; }

  function dispose(): void {
    timePause.removeEventListener('click', onPauseClick);
  }

  return { update, setFpsVisible, setActiveEventsCount, onSettings, onActiveEvents, dispose };
}

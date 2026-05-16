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
import { PauseIcon, PlayIcon } from './icons.js';
const START_YEAR = 2067;
const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const SEASON_PHASE_OFFSET = 0.221;
export function mountTopbar(state, onPaneRefresh) {
    const timeReadout = document.getElementById('time-readout');
    const dateReadout = document.getElementById('date-readout');
    const timePause = document.getElementById('time-pause');
    const seasonSun = document.getElementById('season-sun');
    const fpsCounter = document.getElementById('fps-counter');
    const chip = document.getElementById('active-events-chip');
    const chipCount = document.getElementById('active-events-count');
    const settingsBtn = document.getElementById('settings-toggle');
    let lastPaused = !state.timeOfDay.paused; // force first refresh
    const refreshPauseIcon = () => {
        if (state.timeOfDay.paused === lastPaused)
            return;
        timePause.innerHTML = state.timeOfDay.paused ? PlayIcon : PauseIcon;
        timePause.setAttribute('aria-label', state.timeOfDay.paused ? 'Resume time' : 'Pause time');
        lastPaused = state.timeOfDay.paused;
    };
    refreshPauseIcon();
    const onPauseClick = () => {
        state.timeOfDay.paused = !state.timeOfDay.paused;
        refreshPauseIcon();
        onPaneRefresh();
    };
    timePause.addEventListener('click', onPauseClick);
    // FPS rolling counter — 500ms window averaging.
    let fpsAccumMs = 0;
    let fpsFrames = 0;
    let fpsVisible = false;
    const formatTimeOfDay = (t01) => {
        const total = t01 * 24;
        const hh = Math.floor(total) % 24;
        const mm = Math.floor((total - Math.floor(total)) * 6) * 10;
        return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    };
    const formatDate = (timeOfYear01, yearsElapsed) => {
        const m = Math.min(11, Math.max(0, Math.floor(timeOfYear01 * 12)));
        return `${MONTH_NAMES[m]} ${START_YEAR + yearsElapsed}`;
    };
    let chipCb = null;
    let settingsCb = null;
    chip.addEventListener('click', () => chipCb?.());
    settingsBtn.addEventListener('click', () => settingsCb?.());
    function update(deltaMs) {
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
    function setFpsVisible(visible) {
        if (visible === fpsVisible)
            return;
        fpsVisible = visible;
        fpsCounter.classList.toggle('visible', visible);
        if (!visible) {
            fpsAccumMs = 0;
            fpsFrames = 0;
        }
    }
    function setActiveEventsCount(n) {
        if (n <= 0) {
            chip.hidden = true;
            return;
        }
        chip.hidden = false;
        chipCount.textContent = String(n);
    }
    function onSettings(cb) { settingsCb = cb; }
    function onActiveEvents(cb) { chipCb = cb; }
    function dispose() {
        timePause.removeEventListener('click', onPauseClick);
    }
    return { update, setFpsVisible, setActiveEventsCount, onSettings, onActiveEvents, dispose };
}

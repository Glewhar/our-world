/**
 * Entry point.
 *
 * Boot order:
 *   1. show loading overlay
 *   2. createWorldRuntime — parallel-loads manifest + id raster + LOD glTFs
 *      + attribute textures
 *   3. createSceneGraph (no canvas yet — picking binds in attachWorld)
 *   4. new Renderer(host, sceneGraph) — creates the canvas
 *   5. sceneGraph.attachWorld(world, renderer.canvas) — wires picking
 *   6. hide overlay; start RAF loop
 *
 * On boot failure (manifest missing, schema invalid, asset 404): the overlay
 * stays up and shows the error text instead of the spinner.
 */

import * as THREE from 'three';

import { Renderer } from './render/Renderer.js';
import { createSceneGraph } from './render/scene-graph.js';
import { createWorldRuntime } from './world/index.js';
import { createDebugPanel, initialDebugState } from './debug/Tweakpane.js';
import { setAttributeEvent } from './sim/events/primitives.js';
import type { AttributeKey } from './world/index.js';

const host = document.getElementById('app');
const loading = document.getElementById('loading');
if (!host) throw new Error('#app host element not found in index.html');

async function boot(): Promise<void> {
  const loadingBar = document.getElementById('loading-progress-bar');
  const loadingLabel = document.getElementById('loading-step-label');
  const setProgress = (loaded: number, total: number, label: string): void => {
    if (loadingBar) loadingBar.style.width = `${Math.round((loaded / total) * 100)}%`;
    if (loadingLabel) loadingLabel.textContent = label;
  };

  const { world, sim } = await createWorldRuntime({ onProgress: setProgress });
  const sceneGraph = createSceneGraph();
  const renderer = new Renderer(host!, sceneGraph);
  sceneGraph.attachWorld(world, renderer.canvas);

  const debug = createDebugPanel(initialDebugState);

  // Floating top-left time card (pause button + 24-hour clock dial +
  // HH:MM readout + date label) and the top-right Tweakpane toggle. All
  // are static elements declared in index.html; here we bind them to
  // debug state. The clock dial drags `totalDays`' fractional part —
  // see the clock-scrub pointer handler below.
  const timeClock = document.getElementById('time-clock');
  const timeClockSvg = document.getElementById('time-clock-svg');
  const timeClockHand = document.getElementById('time-clock-hand');
  const timeClockTicks = document.getElementById('time-clock-ticks');
  const timeReadout = document.getElementById('time-readout');
  const timePause = document.getElementById('time-pause') as HTMLButtonElement | null;
  const paneToggle = document.getElementById('tweakpane-toggle') as HTMLButtonElement | null;
  const paneHost = document.getElementById('tweakpane-host');
  const explodeButton = document.getElementById('explode-button') as HTMLButtonElement | null;
  const regionSelect = document.getElementById('region-select') as HTMLSelectElement | null;
  const seasonSlider = document.getElementById('season-slider') as HTMLInputElement | null;
  const seasonReadout = document.getElementById('season-readout');
  const seasonControl = document.getElementById('season-control');
  const dateReadout = document.getElementById('date-readout');

  const toggleClouds = document.getElementById('toggle-clouds') as HTMLInputElement | null;
  const toggleOcean = document.getElementById('toggle-ocean') as HTMLInputElement | null;
  const toggleAtmosphere = document.getElementById('toggle-atmosphere') as HTMLInputElement | null;
  const toggleHighways = document.getElementById('toggle-highways') as HTMLInputElement | null;
  const togglePlanes = document.getElementById('toggle-planes') as HTMLInputElement | null;

  const wireLayerToggle = (
    el: HTMLInputElement | null,
    key: 'clouds' | 'ocean' | 'atmosphere' | 'highways',
  ): void => {
    if (!el) return;
    el.checked = debug.state.layers[key];
    el.addEventListener('change', () => {
      debug.state.layers[key] = el.checked;
    });
  };
  wireLayerToggle(toggleClouds, 'clouds');
  wireLayerToggle(toggleOcean, 'ocean');
  wireLayerToggle(toggleAtmosphere, 'atmosphere');
  wireLayerToggle(toggleHighways, 'highways');

  // Planes toggle is a combined master for two state keys: heads (planes)
  // and trails. Both flip together so the user has one obvious "show air
  // traffic" switch — fine-grained airports/routes still live in Tweakpane.
  if (togglePlanes) {
    togglePlanes.checked = debug.state.layers.planes && debug.state.layers.trails;
    togglePlanes.addEventListener('change', () => {
      debug.state.layers.planes = togglePlanes.checked;
      debug.state.layers.trails = togglePlanes.checked;
    });
  }

  // Map -30..0..+30 °C onto a blue → neutral → red tint for the thumb glow
  // and the numeric readout. The track gradient itself is static CSS.
  const setSeasonTint = (v: number): void => {
    const t = Math.max(-1, Math.min(1, v / 30));
    let r: number, g: number, b: number;
    if (t >= 0) {
      r = Math.round(230 + (255 - 230) * t);
      g = Math.round(236 + (77 - 236) * t);
      b = Math.round(246 + (61 - 246) * t);
    } else {
      const a = -t;
      r = Math.round(230 + (78 - 230) * a);
      g = Math.round(236 + (168 - 236) * a);
      b = Math.round(246 + (255 - 246) * a);
    }
    if (seasonControl) seasonControl.style.setProperty('--season-color', `rgb(${r}, ${g}, ${b})`);
  };
  const refreshSeasonReadout = (v: number): void => {
    if (seasonReadout) {
      const sign = v > 0 ? '+' : '';
      seasonReadout.textContent = `${sign}${v.toFixed(1)}°`;
    }
    setSeasonTint(v);
  };

  // Build the 24-hour clock face (24 ticks, longer at 0/6/12/18) and wire
  // pointer drag → t01. The hand rotates 0..360° as t01 goes 0..1, with
  // 0° at top = midnight.
  if (timeClockTicks) {
    const NS = 'http://www.w3.org/2000/svg';
    for (let h = 0; h < 24; h++) {
      const line = document.createElementNS(NS, 'line');
      const major = h % 6 === 0;
      line.setAttribute('x1', '0');
      line.setAttribute('y1', '-44');
      line.setAttribute('x2', '0');
      line.setAttribute('y2', major ? '-37' : '-40');
      if (major) line.setAttribute('class', 'major');
      line.setAttribute('transform', `rotate(${h * 15})`);
      timeClockTicks.appendChild(line);
    }
  }
  const formatTimeOfDay = (t01: number): string => {
    const total = t01 * 24;
    const hh = Math.floor(total) % 24;
    // Floor minutes to a 10-minute step so the readout ticks 00:10, 00:20…
    // rather than flickering every second.
    const mm = Math.floor((total - Math.floor(total)) * 6) * 10;
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  };
  const refreshClock = (t01: number): void => {
    if (timeClockHand) timeClockHand.setAttribute('transform', `rotate(${t01 * 360})`);
    if (timeReadout) timeReadout.textContent = formatTimeOfDay(t01);
    if (timeClock) timeClock.setAttribute('aria-valuenow', (t01 * 24).toFixed(1));
  };
  refreshClock(debug.state.timeOfDay.t01);

  let timeClockDragging = false;
  if (timeClock && timeClockSvg) {
    const setFromEvent = (e: PointerEvent): void => {
      const rect = timeClockSvg.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      // atan2(dx, -dy): 0 = up (midnight), increases clockwise.
      let theta = Math.atan2(e.clientX - cx, -(e.clientY - cy));
      if (theta < 0) theta += Math.PI * 2;
      const t01 = theta / (Math.PI * 2);
      // Rewrite the fractional part of `totalDays` so the derived t01
      // matches the new dial position next frame — but keep the integer
      // day count intact so dragging the clock doesn't bump month/year.
      debug.state.timeOfDay.totalDays =
        Math.floor(debug.state.timeOfDay.totalDays) + t01;
      debug.state.timeOfDay.t01 = t01;
      refreshClock(t01);
    };
    timeClock.addEventListener('pointerdown', (e) => {
      timeClockDragging = true;
      timeClock.setPointerCapture(e.pointerId);
      setFromEvent(e);
    });
    timeClock.addEventListener('pointermove', (e) => {
      if (timeClockDragging) setFromEvent(e);
    });
    const release = (e: PointerEvent): void => {
      timeClockDragging = false;
      if (timeClock.hasPointerCapture(e.pointerId)) timeClock.releasePointerCapture(e.pointerId);
    };
    timeClock.addEventListener('pointerup', release);
    timeClock.addEventListener('pointercancel', release);
  }

  const refreshPauseIcon = (): void => {
    if (timePause) timePause.textContent = debug.state.timeOfDay.paused ? '▶' : '⏸';
  };
  refreshPauseIcon();
  if (timePause) {
    timePause.addEventListener('click', () => {
      debug.state.timeOfDay.paused = !debug.state.timeOfDay.paused;
      refreshPauseIcon();
      // Tweakpane caches the checkbox value; force a redraw so the panel
      // reflects the new state if the user opens it.
      debug.pane.refresh();
    });
  }
  if (paneToggle && paneHost) {
    paneToggle.addEventListener('click', () => {
      paneHost.classList.toggle('open');
    });
  }
  // Smoke-test "Explode" button — detonate at a random point inside the
  // selected region's lat/lon bounding box. Sin(lat) sampling so a tall
  // box doesn't oversample mid-latitudes vs. the edges (cos(lat) area
  // weighting on the sphere).
  const REGION_BOXES: Record<string, { latMin: number; latMax: number; lonMin: number; lonMax: number }> = {
    USA:    { latMin: 25, latMax: 49, lonMin: -125, lonMax: -67 },
    Europe: { latMin: 36, latMax: 71, lonMin: -10,  lonMax: 40  },
    China:  { latMin: 18, latMax: 53, lonMin: 73,   lonMax: 135 },
  };
  if (explodeButton) {
    explodeButton.addEventListener('click', () => {
      const region = regionSelect?.value ?? 'USA';
      const box = REGION_BOXES[region] ?? REGION_BOXES.USA;
      const sinMin = Math.sin((box.latMin * Math.PI) / 180);
      const sinMax = Math.sin((box.latMax * Math.PI) / 180);
      const latRad = Math.asin(sinMin + Math.random() * (sinMax - sinMin));
      const lonRad = ((box.lonMin + Math.random() * (box.lonMax - box.lonMin)) * Math.PI) / 180;
      const cosLat = Math.cos(latRad);
      const dir = new THREE.Vector3(
        cosLat * Math.cos(lonRad),
        cosLat * Math.sin(lonRad),
        Math.sin(latRad),
      );
      sceneGraph.detonateAt(dir);
    });
  }
  // Make Tweakpane checkbox rows fully clickable, like the floating layer-toggle
  // rows. Tweakpane's native label only wraps the small toggle visual on the
  // right; this forwards row-level clicks to the underlying input.
  if (paneHost) {
    paneHost.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((input) => {
      const row =
        input.closest<HTMLElement>('.tp-lblv') ?? input.closest<HTMLElement>('.tp-bldv');
      if (!row) return;
      row.style.cursor = 'pointer';
      row.addEventListener('click', (e) => {
        if (input.disabled) return;
        const target = e.target as HTMLElement | null;
        // Native click already handled when it lands on the input or its
        // label/wrapper — don't double-toggle.
        if (!target || target === input) return;
        if (target.closest('.tp-ckbv_l, .tp-ckbv_w')) return;
        input.click();
      });
    });
  }
  if (seasonSlider) {
    seasonSlider.value = String(debug.state.materials.globe.seasonOffsetC);
    refreshSeasonReadout(debug.state.materials.globe.seasonOffsetC);
    seasonSlider.addEventListener('input', () => {
      const v = parseFloat(seasonSlider.value);
      debug.state.materials.globe.seasonOffsetC = v;
      refreshSeasonReadout(v);
    });
  }

  // Calendar readout under the clock dial. Reads the derived `timeOfYear01`
  // (→ month index 0..11) and `yearsElapsed` (→ display year offset from
  // START_YEAR) — both produced from `totalDays` each frame by scene-graph.ts.
  // See DebugState.timeOfDay in debug/Tweakpane.ts for the data contract.
  const START_YEAR = 2067;
  const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                       'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const formatDate = (timeOfYear01: number, yearsElapsed: number): string => {
    const m = Math.min(11, Math.max(0, Math.floor(timeOfYear01 * 12)));
    return `${MONTH_NAMES[m]} ${START_YEAR + yearsElapsed}`;
  };
  const refreshDateReadout = (timeOfYear01: number, yearsElapsed: number): void => {
    if (dateReadout) dateReadout.textContent = formatDate(timeOfYear01, yearsElapsed);
  };
  refreshDateReadout(debug.state.timeOfDay.timeOfYear01, debug.state.timeOfDay.yearsElapsed);


  let prev = performance.now();
  let raf = requestAnimationFrame(function frame(now: number): void {
    const deltaMs = Math.min(100, now - prev);
    const deltaSec = deltaMs / 1000;
    prev = now;
    sim.tick(deltaMs);
    renderer.tick(deltaSec, debug.state);
    // Refresh the top-left time card from the derived state that
    // scene-graph.ts just wrote: clock hand + HH:MM (unless the user is
    // mid-drag), the JAN 2067 / FEB 2067 / … date label, and the pause
    // icon if Tweakpane's checkbox flipped `paused` from the side panel.
    if (!timeClockDragging) {
      refreshClock(debug.state.timeOfDay.t01);
    }
    refreshDateReadout(debug.state.timeOfDay.timeOfYear01, debug.state.timeOfDay.yearsElapsed);
    if (timePause) {
      const want = debug.state.timeOfDay.paused ? '▶' : '⏸';
      if (timePause.textContent !== want) timePause.textContent = want;
    }
    if (seasonSlider && document.activeElement !== seasonSlider) {
      const v = debug.state.materials.globe.seasonOffsetC;
      if (parseFloat(seasonSlider.value) !== v) {
        seasonSlider.value = String(v);
        refreshSeasonReadout(v);
      }
    }
    if (togglePlanes) {
      const want = debug.state.layers.planes && debug.state.layers.trails;
      if (togglePlanes.checked !== want) togglePlanes.checked = want;
    }
    raf = requestAnimationFrame(frame);
  });

  if (loading) loading.classList.add('hidden');

  // Browser-console handle. Open DevTools and run e.g. `__ED.fireAt(0, 0, 500)`.
  (window as unknown as { __ED: unknown }).__ED = {
    world,
    sim,
    sceneGraph,
    renderer,
    debug,
    fireAt(latDeg: number, lonDeg: number, radiusKm = 500, value = 1.0): void {
      sim.injectEvent(
        setAttributeEvent('fire', value, {
          kind: 'point',
          lat: latDeg,
          lon: lonDeg,
          radius_km: radiusKm,
        }),
      );
    },
    paintAt(
      attr: AttributeKey,
      latDeg: number,
      lonDeg: number,
      radiusKm = 500,
      value = 1.0,
    ): void {
      sim.injectEvent(
        setAttributeEvent(attr, value, {
          kind: 'point',
          lat: latDeg,
          lon: lonDeg,
          radius_km: radiusKm,
        }),
      );
    },
    detonateAt(latDeg: number, lonDeg: number): void {
      // Z-up convention: +Z = north pole, equator in the XY plane.
      const latRad = (latDeg * Math.PI) / 180;
      const lonRad = (lonDeg * Math.PI) / 180;
      const cosLat = Math.cos(latRad);
      const dir = new THREE.Vector3(
        cosLat * Math.cos(lonRad),
        cosLat * Math.sin(lonRad),
        Math.sin(latRad),
      );
      sceneGraph.detonateAt(dir);
    },
  };

}

void boot().catch((err) => {
  if (loading) {
    loading.classList.remove('hidden');
    loading.classList.add('error');
    loading.textContent = `boot failed:\n${err instanceof Error ? (err.stack ?? err.message) : String(err)}`;
  }
  console.error(err);
});

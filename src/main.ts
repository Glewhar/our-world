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
import { runGpuProbe, applyTier, tierName } from './debug/autotune.js';
import { setAttributeEvent } from './sim/events/primitives.js';
import type { AttributeKey } from './world/index.js';
import {
  GlobalWarmingScenario,
  IceAgeScenario,
  NuclearScenario,
  NuclearWarScenario,
  ScenarioRegistry,
  type ScenarioContext,
  type StartResult,
} from './world/scenarios/index.js';
import { DEFAULT_NUCLEAR_WAR_CONFIG } from './world/scenarios/handlers/NuclearWarScenario.config.js';
import { DEFAULT_NUCLEAR_CONFIG } from './world/scenarios/handlers/NuclearScenario.config.js';
import { mountScenarioCards } from './ui/scenario-cards.js';
import { mountScenariosLauncher } from './ui/scenarios-launcher.js';
import { mountHealthHud } from './ui/health-hud.js';

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

  // Auto-tune: measure real GPU cost behind the loading overlay (canvas is
  // live but the overlay still covers it), then disable expensive layers on
  // weaker systems before Tweakpane and the floating toggle bar bind to
  // state. No persistence — every launch re-probes from scratch.
  const probe = await runGpuProbe(renderer, sceneGraph, initialDebugState);
  applyTier(initialDebugState, probe.tier);
  // Apply the auto-picked render scale BEFORE the first real render-loop
  // frame. The settings panel can override this live afterward.
  renderer.setRenderScale(initialDebugState.renderScale);
  const autoRenderScale = initialDebugState.renderScale;
  const autoTierName = tierName(probe.tier);
  console.info(
    `[autotune] tier=${autoTierName} avgFrameMs=${probe.avgFrameMs.toFixed(2)} ` +
      `samples=${probe.samples}${probe.partial ? ' (partial — wall-time cap hit)' : ''} ` +
      `renderScale=${initialDebugState.renderScale.toFixed(2)} ` +
      `layers=${JSON.stringify({
        clouds: initialDebugState.layers.clouds,
        ocean: initialDebugState.layers.ocean,
        atmosphere: initialDebugState.layers.atmosphere,
        highways: initialDebugState.layers.highways,
        planes: initialDebugState.layers.planes,
      })}`,
  );

  const debug = createDebugPanel(initialDebugState);

  // Scenario registry — owns the active scenario list and composes the
  // wasteland attribute texture each frame from per-scenario stamps.
  // Decoupled from Tweakpane state so the registry has no dependency on
  // the debug layer; `scenarioRegistry.tuning.decayExponent` is pushed
  // each frame from `debug.state.scenarios.decayExponent`.
  const { nside: hpNside, ordering: hpOrdering } = world.getHealpixSpec();
  const scenarioContext: ScenarioContext = {
    sampleWindAt: (lat, lon) => world.getWindAt(lat, lon),
    sampleTerrainAt: (lat, lon) => ({
      // World runtime clamps negative elevation to 0 internally for cells
      // marked ocean — but match the historical scene-graph behaviour and
      // clamp here as belt-and-braces. The wasteland blast's altitude lift
      // never wants a negative value (below-sea-level points should fire
      // at radius 1.0, not at radius 0.99).
      elevationM: Math.max(0, world.getElevationMetersAt(lat, lon)),
      wind: world.getWindAt(lat, lon),
    }),
    detonateAt: (latDeg, lonDeg, terrain, sizeKm) => {
      // Z-up convention matches the bake's lonlat_to_xyz.
      const latRad = (latDeg * Math.PI) / 180;
      const lonRad = (lonDeg * Math.PI) / 180;
      const cosLat = Math.cos(latRad);
      const dir = new THREE.Vector3(
        cosLat * Math.cos(lonRad),
        cosLat * Math.sin(lonRad),
        Math.sin(latRad),
      );
      sceneGraph.detonateAt(dir, terrain.elevationM, terrain.wind, sizeKm);
    },
    paintAttributeEllipse: () => {
      // The registry intercepts paint calls during onStart so the stamp
      // is captured locally. Outside that window, fall through to a
      // no-op — handlers shouldn't paint anywhere else for v1.
    },
    paintAttributeBand: () => {
      // Same story as paintAttributeEllipse — the registry intercepts
      // band paints during onStart; outside that window, no-op. Climate
      // scenarios call this from onStart to stamp zonal biome-override
      // belts (tundra creep, mid-latitude desert expansion, etc.).
    },
    // The registry intercepts this internally — the user-level fallback
    // is just a no-op so the context interface stays satisfied.
    spawnChildScenario: () => '',
    stopChildScenario: () => {},
    setWorldEffect: (name, scale) => {
      switch (name) {
        case 'airplaneSpawn':
          sceneGraph.setAirplaneSpawnScale(scale);
          break;
      }
    },
    getMajorCities: (maxCount) => {
      const sorted = [...world.getCities()].sort((a, b) => b.pop - a.pop);
      const n = Math.min(maxCount, sorted.length);
      const out: { latDeg: number; lonDeg: number; pop: number; name: string }[] = [];
      for (let i = 0; i < n; i++) {
        const c = sorted[i]!;
        out.push({ latDeg: c.lat, lonDeg: c.lon, pop: c.pop, name: c.name });
      }
      return out;
    },
    getSeaLevelMultiplier: () => debug.state.scenarios.seaLevelMultiplier,
  };
  const scenarioRegistry = new ScenarioRegistry({
    attributeSinks: [
      {
        key: 'wasteland',
        applyFrame: (cells, values) =>
          world.applyDynamicAttributeFrame('wasteland', cells, values),
      },
    ],
    biomeOverrideSink: {
      bakeBiomeOverrideStamps: (input) => world.bakeBiomeOverrideStamps(input),
      countBiomesGlobal: () => world.countBiomesGlobal(),
      getElevationMetersAtCell: (ipix) => world.getElevationMetersAtCell(ipix),
      getPolygonLookup: () => world.getPolygonLookup(),
      bakePolygonOverride: (slot, c, w, t) => world.bakePolygonOverride(slot, c, w, t),
      clearPolygonOverrideSlot: (slot) => world.clearPolygonOverrideSlot(slot),
    },
    context: scenarioContext,
    nside: hpNside,
    ordering: hpOrdering,
  });
  scenarioRegistry.registerHandler('nuclear', NuclearScenario);
  scenarioRegistry.registerHandler('globalWarming', GlobalWarmingScenario);
  scenarioRegistry.registerHandler('iceAge', IceAgeScenario);
  scenarioRegistry.registerHandler('nuclearWar', NuclearWarScenario);

  // Mount the floating scenario card stack (top-right, below the date readout).
  // The host div is declared in index.html; mountScenarioCards reconciles
  // against scenarioRegistry.list() every frame in the RAF loop below.
  const scenarioCards = mountScenarioCards(
    document.getElementById('scenario-stack')!,
    scenarioRegistry,
    () => debug.state.scenarios.seaLevelMultiplier,
  );

  // Bottom-center health-bar HUD — three bars (Biome / Civilization /
  // Radiation) reading `scenarioRegistry.getWorldHealth()` per frame.
  const healthHud = mountHealthHud(
    document.getElementById('health-hud')!,
    scenarioRegistry,
  );

  // Floating top-left time card (pause button + HH:MM readout + date
  // label) and the top-right Tweakpane toggle. All are static elements
  // declared in index.html; here we bind them to debug state. The
  // 24-hour clock dial was removed — the digital readout already covers
  // it and the dragging UX wasn't worth the visual real estate.
  const timeReadout = document.getElementById('time-readout');
  const timePause = document.getElementById('time-pause') as HTMLButtonElement | null;
  const paneToggle = document.getElementById('tweakpane-toggle') as HTMLButtonElement | null;
  const paneHost = document.getElementById('tweakpane-host');
  const sealevelSlider = document.getElementById('sealevel-slider') as HTMLInputElement | null;
  const sealevelReadout = document.getElementById('sealevel-readout');
  const dateReadout = document.getElementById('date-readout');
  const seasonSun = document.getElementById('season-sun') as SVGCircleElement | null;

  // Only Clouds remains on the floating bottom bar — the rest (ocean,
  // atmosphere, highways, planes) moved into their Tweakpane sub-folders
  // as header toggles with reset chips.
  const toggleClouds = document.getElementById('toggle-clouds') as HTMLInputElement | null;
  if (toggleClouds) {
    toggleClouds.checked = debug.state.layers.clouds;
    toggleClouds.addEventListener('change', () => {
      debug.state.layers.clouds = toggleClouds.checked;
      debug.pane.refresh();
    });
  }

  // FPS counter toggle — drives `#fps-counter` visibility (see frame loop
  // below). Settings-panel mirror of the same state the Tweakpane used to
  // expose; FPS is a user-facing stat, not a debug knob.
  const toggleFps = document.getElementById('toggle-fps') as HTMLInputElement | null;
  if (toggleFps) {
    toggleFps.checked = debug.state.debug.fpsCounter;
    toggleFps.addEventListener('change', () => {
      debug.state.debug.fpsCounter = toggleFps.checked;
    });
  }

  const refreshSealevelReadout = (v: number): void => {
    if (sealevelReadout) {
      const sign = v > 0 ? '+' : '';
      sealevelReadout.textContent = `${sign}${Math.round(v)} m`;
    }
  };

  const formatTimeOfDay = (t01: number): string => {
    const total = t01 * 24;
    const hh = Math.floor(total) % 24;
    // Floor minutes to a 10-minute step so the readout ticks 00:10, 00:20…
    // rather than flickering every second.
    const mm = Math.floor((total - Math.floor(total)) * 6) * 10;
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  };
  const refreshClock = (t01: number): void => {
    if (timeReadout) timeReadout.textContent = formatTimeOfDay(t01);
  };
  refreshClock(debug.state.timeOfDay.t01);

  // Pause icon: two vertical bars; Play icon: right-pointing triangle
  // offset rightward so the visual centroid sits at the circle's centre
  // (a flat-back triangle's centroid is 1/3 from the base, not 1/2).
  const PAUSE_SVG =
    '<svg viewBox="0 0 20 20" aria-hidden="true">' +
    '<rect x="5" y="3.5" width="3.5" height="13" rx="1"/>' +
    '<rect x="11.5" y="3.5" width="3.5" height="13" rx="1"/>' +
    '</svg>';
  const PLAY_SVG =
    '<svg viewBox="0 0 20 20" aria-hidden="true">' +
    '<path d="M6 3.5 L16 10 L6 16.5 Z"/>' +
    '</svg>';
  const refreshPauseIcon = (): void => {
    if (!timePause) return;
    timePause.innerHTML = debug.state.timeOfDay.paused ? PLAY_SVG : PAUSE_SVG;
    timePause.setAttribute(
      'aria-label',
      debug.state.timeOfDay.paused ? 'Resume time' : 'Pause time',
    );
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

  // Settings panel — user-facing quality knobs. Same toggle pattern as
  // the tweakpane host, with a render-scale slider + AUTO chip wired to
  // the renderer.
  const settingsToggle = document.getElementById('settings-toggle') as HTMLButtonElement | null;
  const settingsPanel = document.getElementById('settings-panel');
  const settingsSlider = document.getElementById(
    'settings-renderscale-slider',
  ) as HTMLInputElement | null;
  const settingsReadout = document.getElementById('settings-renderscale-readout');
  const settingsHint = document.getElementById('settings-renderscale-hint');
  const settingsAuto = document.getElementById(
    'settings-renderscale-auto',
  ) as HTMLButtonElement | null;
  const formatPct = (s: number): string => `${Math.round(s * 100)}%`;
  const applyRenderScale = (s: number): void => {
    debug.state.renderScale = s;
    renderer.setRenderScale(s);
    if (settingsReadout) settingsReadout.textContent = formatPct(s);
  };
  if (settingsSlider) {
    settingsSlider.value = String(initialDebugState.renderScale);
  }
  if (settingsReadout) settingsReadout.textContent = formatPct(initialDebugState.renderScale);
  if (settingsHint) {
    settingsHint.textContent = `Auto-detected: ${autoTierName} @ ${formatPct(autoRenderScale)}`;
  }
  if (settingsToggle && settingsPanel) {
    settingsToggle.addEventListener('click', () => {
      settingsPanel.classList.toggle('open');
    });
  }
  if (settingsSlider) {
    settingsSlider.addEventListener('input', () => {
      applyRenderScale(parseFloat(settingsSlider.value));
    });
  }
  if (settingsAuto) {
    settingsAuto.addEventListener('click', () => {
      if (settingsSlider) settingsSlider.value = String(autoRenderScale);
      applyRenderScale(autoRenderScale);
    });
  }
  // Mount the floating Scenarios launcher. The toggle chip lives next to
  // the Quality cog in the top-right rail; the popover is a sibling that
  // owns three collapsible rows (Nuclear / Global Warming / Ice Age).
  const scenariosToggle = document.getElementById('scenarios-toggle') as HTMLButtonElement | null;
  const scenariosPanel = document.getElementById('scenarios-launcher');
  if (scenariosToggle && scenariosPanel) {
    scenariosToggle.addEventListener('click', () => {
      scenariosPanel.classList.toggle('open');
    });
    mountScenariosLauncher(
      scenariosToggle,
      scenariosPanel,
      scenarioRegistry,
      () => debug.state.timeOfDay.totalDays,
      debug.state,
    );
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
  if (sealevelSlider) {
    sealevelSlider.value = String(debug.state.materials.ocean.seaLevelOffsetM);
    refreshSealevelReadout(debug.state.materials.ocean.seaLevelOffsetM);
    sealevelSlider.addEventListener('input', () => {
      const v = parseFloat(sealevelSlider.value);
      debug.state.materials.ocean.seaLevelOffsetM = v;
      refreshSealevelReadout(v);
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
  // Sub-solar latitude icon — mirrors the same sinusoid that scene-graph.ts
  // uses to set sun declination (see MAX_SUN_TILT_RAD / YEAR_PHASE_OFFSET).
  // Output is the normalized declination in [-1, +1]; +1 = sun over north
  // (June solstice), -1 = sun over south (December solstice), 0 = equinox.
  // viewBox y range [10, 30] → equator at y=20, tropics at y=10/30.
  const SEASON_YEAR_PHASE_OFFSET = 0.221;
  const refreshSeasonIcon = (timeOfYear01: number): void => {
    if (!seasonSun) return;
    const n = Math.sin((timeOfYear01 - SEASON_YEAR_PHASE_OFFSET) * Math.PI * 2);
    seasonSun.setAttribute('cy', String(20 - n * 10));
  };
  refreshDateReadout(debug.state.timeOfDay.timeOfYear01, debug.state.timeOfDay.yearsElapsed);
  refreshSeasonIcon(debug.state.timeOfDay.timeOfYear01);


  const fpsCounter = document.getElementById('fps-counter');
  let fpsAccumMs = 0;
  let fpsFrames = 0;

  // Background-window throttle. When the OS reports the window has lost
  // focus, browser rAF is no longer vsync-aligned by the compositor —
  // the render loop can fire faster than the display refresh and the GPU
  // never gets its idle gaps between frames (seen as a 30–40% wattage
  // spike when alt-tabbed). We cap to 30 FPS in that state by skipping
  // rAF callbacks that arrive too soon. Skipped frames don't update
  // \`prev\`, so the next rendered frame sees the correct accumulated
  // delta and the simulation continues smoothly.
  const BLURRED_MIN_FRAME_MS = 1000 / 30;
  let windowFocused = document.hasFocus();
  window.addEventListener('blur', () => { windowFocused = false; });
  window.addEventListener('focus', () => { windowFocused = true; });

  // Rolling perf probe for the scenario-registry tick. Idle should be
  // sub-microsecond; the old per-cell census walks pushed multi-ms
  // spikes once per second. `__ED.scenarioTickPerf()` reads it out.
  const TICK_PERF_RING = 240; // ~4 s at 60 FPS
  const tickPerfRingMs = new Float64Array(TICK_PERF_RING);
  let tickPerfRingHead = 0;
  let tickPerfRingFilled = false;

  let prev = performance.now();
  let raf = requestAnimationFrame(function frame(now: number): void {
    if (!windowFocused && (now - prev) < BLURRED_MIN_FRAME_MS) {
      raf = requestAnimationFrame(frame);
      return;
    }
    const deltaMs = Math.min(100, now - prev);
    const deltaSec = deltaMs / 1000;
    prev = now;
    sim.tick(deltaMs);
    renderer.tick(deltaSec, debug.state);
    // Scenario registry runs AFTER renderer.tick so it reads the freshly
    // advanced `totalDays`. Tweakpane's decay-exponent slider is pushed
    // before the tick so the next composition uses the live value.
    scenarioRegistry.tuning.decayExponent = debug.state.scenarios.decayExponent;
    const tickT0 = performance.now();
    scenarioRegistry.tick(debug.state.timeOfDay.totalDays);
    const tickDtMs = performance.now() - tickT0;
    tickPerfRingMs[tickPerfRingHead] = tickDtMs;
    tickPerfRingHead = (tickPerfRingHead + 1) % TICK_PERF_RING;
    if (tickPerfRingHead === 0) tickPerfRingFilled = true;
    sceneGraph.setClimateFrame(scenarioRegistry.getClimateFrame());
    sceneGraph.setBiomeOverrideTextures(
      world.getBiomeOverrideTexture(),
      world.getBiomeOverrideStampTexture(),
    );
    sceneGraph.setClimateEnvelopes(scenarioRegistry.getClimateEnvelopes());
    sceneGraph.setSeafloorFrame(scenarioRegistry.getSeafloorFrame());
    sceneGraph.setCloudFrame(scenarioRegistry.getCloudFrame());
    scenarioCards.update();
    healthHud.update();
    if (fpsCounter) {
      const wantVisible = debug.state.debug.fpsCounter;
      if (fpsCounter.classList.contains('visible') !== wantVisible) {
        fpsCounter.classList.toggle('visible', wantVisible);
      }
      if (wantVisible) {
        fpsAccumMs += deltaMs;
        fpsFrames += 1;
        if (fpsAccumMs >= 500) {
          const fps = (fpsFrames * 1000) / fpsAccumMs;
          fpsCounter.textContent = `${fps.toFixed(0)} FPS`;
          fpsAccumMs = 0;
          fpsFrames = 0;
        }
      } else if (fpsFrames !== 0) {
        fpsAccumMs = 0;
        fpsFrames = 0;
      }
    }
    // Refresh the top-left time card from the derived state that
    // scene-graph.ts just wrote: HH:MM digital readout, the JAN 2067 /
    // FEB 2067 / … date label, and the pause-icon swap if Tweakpane's
    // checkbox flipped `paused` from the side panel.
    refreshClock(debug.state.timeOfDay.t01);
    refreshDateReadout(debug.state.timeOfDay.timeOfYear01, debug.state.timeOfDay.yearsElapsed);
    refreshSeasonIcon(debug.state.timeOfDay.timeOfYear01);
    if (timePause) {
      const wantPaused = debug.state.timeOfDay.paused;
      const hasPlayIcon = timePause.firstElementChild?.querySelector('path') !== null;
      if (wantPaused !== hasPlayIcon) refreshPauseIcon();
    }
    if (sealevelSlider && document.activeElement !== sealevelSlider) {
      const v = debug.state.materials.ocean.seaLevelOffsetM;
      if (parseFloat(sealevelSlider.value) !== v) {
        sealevelSlider.value = String(v);
        refreshSealevelReadout(v);
      }
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
    scenarios: scenarioRegistry,
    /**
     * Read out the rolling scenario-tick cost ring. Returns avg / p95 /
     * max in microseconds over the last ~4 seconds of frames. Idle should
     * be near 0; even a 70-strike Nuclear War should stay sub-microsecond
     * (no per-cell census walks left after the impact-budget refactor).
     */
    scenarioTickPerf(): { avgUs: number; p95Us: number; maxUs: number; samples: number } {
      const n = tickPerfRingFilled ? TICK_PERF_RING : tickPerfRingHead;
      if (n === 0) return { avgUs: 0, p95Us: 0, maxUs: 0, samples: 0 };
      const slice = Array.from(tickPerfRingMs.subarray(0, n)).sort((a, b) => a - b);
      let sum = 0;
      for (let i = 0; i < n; i++) sum += slice[i]!;
      const avgMs = sum / n;
      const p95Ms = slice[Math.min(n - 1, Math.floor(n * 0.95))]!;
      const maxMs = slice[n - 1]!;
      return {
        avgUs: avgMs * 1000,
        p95Us: p95Ms * 1000,
        maxUs: maxMs * 1000,
        samples: n,
      };
    },
    /**
     * Manual wasteland paint — drops a single peak-value stamp directly
     * onto the wasteland texture (no scenario, no decay). Useful for
     * eyeballing the shader tint without firing a full scenario.
     */
    paintWastelandAt(
      latDeg: number,
      lonDeg: number,
      radiusKm = 500,
      stretchKm = 500,
      bearingDeg = 0,
      value = 1.0,
    ): void {
      // Import lazily to keep the boot path free of the dep cycle.
      void import('./sim/fields/ellipse.js').then(({ computeEllipseStamp }) => {
        const stamp = computeEllipseStamp(
          {
            value,
            centreLatDeg: latDeg,
            centreLonDeg: lonDeg,
            radiusKm,
            stretchKm,
            bearingDeg,
          },
          hpNside,
          hpOrdering,
        );
        world.applyWastelandFrame(stamp.cells, stamp.values);
      });
    },
    nukeAt(latDeg: number, lonDeg: number): string {
      const s = debug.state.scenarios.nuclear;
      const r = scenarioRegistry.start(
        'nuclear',
        {
          latDeg,
          lonDeg,
          radiusKm: s.radiusKm,
          stretchKm: s.stretchKm,
          windBearingDeg: 0,
        },
        debug.state.timeOfDay.totalDays,
        s.durationDays,
        { label: `Nuclear strike — (${latDeg.toFixed(1)}, ${lonDeg.toFixed(1)})` },
      );
      return r.ok ? r.id : '';
    },
    /**
     * Console helper — fires a Global Warming scenario with the given
     * params. Sea level is derived from `seaLevelFromTempDelta` —
     * tweak `__ED.setSeaLevelMultiplier(x)` to scale.
     */
    startGlobalWarming(
      opts: { maxTempDeltaC?: number; durationDays?: number } = {},
    ): StartResult {
      const p = { maxTempDeltaC: opts.maxTempDeltaC ?? 8 };
      const dur = opts.durationDays ?? 30;
      return scenarioRegistry.start(
        'globalWarming',
        p,
        debug.state.timeOfDay.totalDays,
        dur,
        { label: 'Global Warming' },
      );
    },
    /**
     * Console helper — fires an Ice Age scenario. Sea-level fall
     * derives from the temperature curve.
     */
    startIceAge(
      opts: { maxTempDeltaC?: number; durationDays?: number } = {},
    ): StartResult {
      const p = { maxTempDeltaC: opts.maxTempDeltaC ?? -10 };
      const dur = opts.durationDays ?? 60;
      return scenarioRegistry.start(
        'iceAge',
        p,
        debug.state.timeOfDay.totalDays,
        dur,
        { label: 'Ice Age' },
      );
    },
    /**
     * Console helper — fires Nuclear War. Strikes are generated from the
     * top-N populated cities; defaults match the in-UI launcher row.
     */
    startNuclearWar(
      opts: {
        strikeCount?: number;
        strikeWindowDays?: number;
        maxTempDeltaC?: number;
        peakSootGlobal?: number;
        durationDays?: number;
        rebuildAfterWar?: boolean;
      } = {},
    ): StartResult {
      const cfg = DEFAULT_NUCLEAR_WAR_CONFIG;
      return scenarioRegistry.start(
        'nuclearWar',
        {
          schedule: [],
          strikeCount: opts.strikeCount ?? cfg.strikeCount,
          strikeWindowDays: opts.strikeWindowDays ?? cfg.strikeFireWindowDays,
          airplaneStopAtDay: cfg.airplaneStopAtDay,
          maxTempDeltaC: opts.maxTempDeltaC ?? cfg.maxTempDeltaC,
          peakSootGlobal: opts.peakSootGlobal ?? cfg.peakSootGlobal,
          strikeEndFrac: cfg.strikeEndFrac,
          winterRampEndFrac: cfg.winterRampEndFrac,
          winterPlateauEndFrac: cfg.winterPlateauEndFrac,
          rebuildAfterWar: opts.rebuildAfterWar ?? false,
        },
        debug.state.timeOfDay.totalDays,
        opts.durationDays ?? cfg.durationDays,
        { label: 'Nuclear War' },
      );
    },
    /**
     * Console helper — set the global sea-level multiplier. 1.0 =
     * paleoclimate-anchored; range [0, 10]. Read by climate handlers
     * each tick via `ctx.getSeaLevelMultiplier()`.
     */
    setSeaLevelMultiplier(x: number): void {
      debug.state.scenarios.seaLevelMultiplier = x;
    },
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
    detonateAt(latDeg: number, lonDeg: number, sizeKm?: number): void {
      // Z-up convention: +Z = north pole, equator in the XY plane.
      const latRad = (latDeg * Math.PI) / 180;
      const lonRad = (lonDeg * Math.PI) / 180;
      const cosLat = Math.cos(latRad);
      const dir = new THREE.Vector3(
        cosLat * Math.cos(lonRad),
        cosLat * Math.sin(lonRad),
        Math.sin(latRad),
      );
      // Same sampling the scenario context does, inlined for the debug
      // console helper so DevTools `__ED.detonateAt(lat, lon)` still
      // produces an elevation-lifted, wind-driven blast.
      const elevationM = Math.max(0, world.getElevationMetersAt(latDeg, lonDeg));
      const wind = world.getWindAt(latDeg, lonDeg);
      // Default to the calibrated reference radius so legacy
      // `__ED.detonateAt(lat, lon)` calls produce the legacy fixed-size
      // blast (visual scale = 1.0).
      const size = sizeKm ?? DEFAULT_NUCLEAR_CONFIG.visuals.referenceRadiusKm;
      sceneGraph.detonateAt(dir, elevationM, wind, size);
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

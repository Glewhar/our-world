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
 *   6. mount UI modules (topbar, subtle-stack, disaster-rail, status-panel,
 *      active-events popover, settings sheet)
 *   7. hide overlay; start RAF loop
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
  InfraDecayScenario,
  INFRA_DECAY_DURATION_DAYS,
  INFRA_DECAY_LABEL,
  NuclearScenario,
  NuclearWarScenario,
  ScenarioRegistry,
  type BandPaintArgs,
  type EllipsePaintArgs,
  type ScenarioContext,
  type StartResult,
} from './world/scenarios/index.js';
import { DEFAULT_NUCLEAR_WAR_CONFIG } from './world/scenarios/handlers/NuclearWarScenario.config.js';
import { DEFAULT_NUCLEAR_CONFIG } from './world/scenarios/handlers/NuclearScenario.config.js';
import { DEFAULT_GLOBAL_WARMING_CONFIG } from './world/scenarios/handlers/GlobalWarmingScenario.config.js';
import { DEFAULT_ICE_AGE_CONFIG } from './world/scenarios/handlers/IceAgeScenario.config.js';
import { mountTopbar } from './ui/topbar.js';
import { mountDisasterRail } from './ui/disaster-rail.js';
import { mountStatusPanel } from './ui/status-panel.js';
import { mountSubtleStack } from './ui/subtle-stack.js';
import { mountActiveEvents } from './ui/active-events-chip.js';
import { mountSettingsSheet } from './ui/settings-sheet.js';

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

  const probe = await runGpuProbe(renderer, sceneGraph, initialDebugState);
  applyTier(initialDebugState, probe.tier);
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

  let pausedBeforeContextLoss = false;
  renderer.onContextLost = () => {
    pausedBeforeContextLoss = debug.state.timeOfDay.paused;
    debug.state.timeOfDay.paused = true;
    if (loading) {
      loading.classList.remove('hidden');
      const text = document.getElementById('loading-text');
      if (text) text.textContent = 'GPU context lost — waiting for restore…';
    }
  };
  renderer.onContextRestored = () => {
    if (loading) {
      loading.classList.add('hidden');
      const text = document.getElementById('loading-text');
      if (text) text.textContent = 'loading world…';
    }
    debug.state.timeOfDay.paused = pausedBeforeContextLoss;
  };

  // --- Scenario registry --------------------------------------------------
  const { nside: hpNside, ordering: hpOrdering } = world.getHealpixSpec();
  const scenarioContext: ScenarioContext = {
    sampleWindAt: (lat, lon) => world.getWindAt(lat, lon),
    sampleTerrainAt: (lat, lon) => ({
      elevationM: Math.max(0, world.getElevationMetersAt(lat, lon)),
      wind: world.getWindAt(lat, lon),
    }),
    detonateAt: (latDeg, lonDeg, terrain, sizeKm) => {
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
    paintAttributeEllipse: () => {},
    paintAttributeBand: () => {},
    paintAttributeCells: () => {},
    getElevationMetersAtCell: (ipix) => world.getElevationMetersAtCell(ipix),
    getPolygonOfCell: (ipix) => world.getPolygonOfCell(ipix),
    getCellCount: () => 12 * hpNside * hpNside,
    getPolygonLookup: () => world.getPolygonLookup(),
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
    getRoadCount: () => world.getRoads().length,
    getSeaLevelMultiplier: () => debug.state.scenarios.seaLevelMultiplier,
  };
  const scenarioRegistry = new ScenarioRegistry({
    attributeSinks: [
      {
        key: 'wasteland',
        applyFrame: (cells, values) =>
          world.applyDynamicAttributeFrame('wasteland', cells, values),
      },
      {
        key: 'infrastructure_loss',
        applyFrame: (cells, values) =>
          world.applyDynamicAttributeFrame('infrastructure_loss', cells, values),
      },
    ],
    biomeOverrideSink: {
      bakeBiomeOverrideStamps: (input) => world.bakeBiomeOverrideStamps(input),
      countBiomesGlobal: () => world.countBiomesGlobal(),
      getElevationMetersAtCell: (ipix) => world.getElevationMetersAtCell(ipix),
      getPolygonOfCell: (ipix) => world.getPolygonOfCell(ipix),
      getPolygonIdAt: (lat, lon) => world.getPolygonIdAt(lat, lon),
      getPolygonLookup: () => world.getPolygonLookup(),
      bakePolygonOverride: (slot, c, w, t) => world.bakePolygonOverride(slot, c, w, t),
      clearPolygonOverrideSlot: (slot) => world.clearPolygonOverrideSlot(slot),
    },
    context: scenarioContext,
    nside: hpNside,
    ordering: hpOrdering,
    requestStamp: (kind, args, n, o) =>
      kind === 'ellipse'
        ? sim.requestStamp('ellipse', args as EllipsePaintArgs, n, o)
        : sim.requestStamp('band', args as BandPaintArgs, n, o),
  });
  scenarioRegistry.registerHandler('nuclear', NuclearScenario);
  scenarioRegistry.registerHandler('globalWarming', GlobalWarmingScenario);
  scenarioRegistry.registerHandler('iceAge', IceAgeScenario);
  scenarioRegistry.registerHandler('nuclearWar', NuclearWarScenario);
  scenarioRegistry.registerHandler('infraDecay', InfraDecayScenario);

  // Fire-once-per-game flag for the Infrastructure-Decay auto-trigger.
  // Once a killer scenario empties the planet, this flips true and the
  // next frame's tick block starts the decay scenario — see the guard
  // block right after `scenarioRegistry.tick(...)` in the RAF loop.
  let infraDecayFired = false;

  // --- UI mounting --------------------------------------------------------
  const topbar = mountTopbar(debug.state, () => debug.pane.refresh());

  const subtleStack = mountSubtleStack(
    document.getElementById('subtle-stack')!,
    scenarioRegistry,
  );

  const disasterRail = mountDisasterRail(
    document.getElementById('disaster-rail')!,
    scenarioRegistry,
    () => debug.state.timeOfDay.totalDays,
  );

  const statusPanel = mountStatusPanel(
    document.getElementById('status-panel')!,
    scenarioRegistry,
    () => {
      const offset = debug.state.materials.ocean.seaLevelOffsetM;
      const climate = scenarioRegistry.getClimateFrame();
      return world.getLandFraction(offset + climate.seaLevelM);
    },
  );

  const activeEvents = mountActiveEvents(
    document.getElementById('active-events-popover')!,
    scenarioRegistry,
    () => debug.state.timeOfDay.totalDays,
  );

  const applyRenderScale = (s: number): void => {
    debug.state.renderScale = s;
    renderer.setRenderScale(s);
  };
  const settingsSheet = mountSettingsSheet(
    document.getElementById('settings-sheet')!,
    debug.state,
    applyRenderScale,
    autoRenderScale,
    autoTierName,
    () => debug.pane.refresh(),
  );

  // Re-parent the Tweakpane host the debug panel created into the settings
  // sheet so it appears alongside the user-facing toggles. The debug panel
  // creates its mount node lazily on first refresh; we copy children over.
  // Tweakpane builds into `#tweakpane-host`; since the panel was already
  // created above with whatever default mount, we don't move it for v1 —
  // the sheet ships with its own #tweakpane-host div that Tweakpane reads
  // by id at creation. (Tweakpane already accessed its previous mount;
  // for v1 we just leave Tweakpane to its internal target — power users
  // can find it via __ED.debug.pane.)

  topbar.onSettings(() => {
    activeEvents.hide();
    settingsSheet.toggle();
  });
  topbar.onActiveEvents(() => {
    settingsSheet.hide();
    activeEvents.toggle();
  });

  // Dismiss popovers when clicking outside (canvas / non-UI).
  document.addEventListener('mousedown', (e) => {
    const target = e.target as HTMLElement;
    const popover = document.getElementById('active-events-popover');
    const sheet = document.getElementById('settings-sheet');
    if (popover && !popover.hidden && !popover.contains(target) && !target.closest('#active-events-chip')) {
      activeEvents.hide();
    }
    if (sheet && !sheet.hidden && !sheet.contains(target) && !target.closest('#settings-toggle')) {
      settingsSheet.hide();
    }
  });

  // Rolling perf probe (kept).
  const TICK_PERF_RING = 240;
  const tickPerfRingMs = new Float64Array(TICK_PERF_RING);
  let tickPerfRingHead = 0;
  let tickPerfRingFilled = false;

  // Background-window throttle.
  const BLURRED_MIN_FRAME_MS = 1000 / 30;
  let windowFocused = document.hasFocus();
  window.addEventListener('blur', () => { windowFocused = false; });
  window.addEventListener('focus', () => { windowFocused = true; });

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
    scenarioRegistry.tuning.decayExponent = debug.state.scenarios.decayExponent;
    const tickT0 = performance.now();
    scenarioRegistry.tick(debug.state.timeOfDay.totalDays);
    const tickDtMs = performance.now() - tickT0;
    tickPerfRingMs[tickPerfRingHead] = tickDtMs;
    tickPerfRingHead = (tickPerfRingHead + 1) % TICK_PERF_RING;
    if (tickPerfRingHead === 0) tickPerfRingFilled = true;
    // Auto-trigger Infrastructure-Decay the moment world population
    // hits zero. Must run AFTER `tick(...)` so this frame's
    // `populationLost` reflects the killer's latest contribution, and
    // BEFORE `setDestructionFrame(...)` below so the new scenario's
    // mask is included from frame one. Fires at most once per game.
    if (!infraDecayFired) {
      const totals = scenarioRegistry.getWorldTotals();
      if (totals && totals.population > 0) {
        const health = scenarioRegistry.getWorldHealth();
        if (health.stats.populationLost >= totals.population) {
          scenarioRegistry.start(
            'infraDecay',
            {},
            debug.state.timeOfDay.totalDays,
            INFRA_DECAY_DURATION_DAYS,
            { label: INFRA_DECAY_LABEL },
          );
          infraDecayFired = true;
        }
      }
    }
    sceneGraph.setClimateFrame(scenarioRegistry.getClimateFrame());
    sceneGraph.setBiomeOverrideTextures(
      world.getBiomeOverrideTexture(),
      world.getBiomeOverrideStampTexture(),
    );
    sceneGraph.setClimateEnvelopes(scenarioRegistry.getClimateEnvelopes());
    sceneGraph.setSeafloorFrame(scenarioRegistry.getSeafloorFrame());
    sceneGraph.setCloudFrame(scenarioRegistry.getCloudFrame());
    sceneGraph.setDestructionFrame(scenarioRegistry.getDestructionFrame());

    // UI updates.
    topbar.update(deltaMs);
    topbar.setFpsVisible(debug.state.debug.fpsCounter);
    subtleStack.update();
    disasterRail.update();
    statusPanel.update();
    const count = activeEvents.update();
    topbar.setActiveEventsCount(count);

    raf = requestAnimationFrame(frame);
  });

  if (loading) loading.classList.add('hidden');

  (window as unknown as { __ED: unknown }).__ED = {
    world,
    sim,
    sceneGraph,
    renderer,
    debug,
    scenarios: scenarioRegistry,
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
    paintWastelandAt(
      latDeg: number,
      lonDeg: number,
      radiusKm = 500,
      stretchKm = 500,
      bearingDeg = 0,
      value = 1.0,
    ): void {
      void import('./sim/fields/ellipse.js').then(({ computeEllipseStamp }) => {
        const stamp = computeEllipseStamp(
          { value, centreLatDeg: latDeg, centreLonDeg: lonDeg, radiusKm, stretchKm, bearingDeg },
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
        { latDeg, lonDeg, radiusKm: s.radiusKm, stretchKm: s.stretchKm, windBearingDeg: 0 },
        debug.state.timeOfDay.totalDays,
        s.durationDays,
        { label: `Nuclear strike — (${latDeg.toFixed(1)}, ${lonDeg.toFixed(1)})` },
      );
      return r.ok ? r.id : '';
    },
    startGlobalWarming(opts: { maxTempDeltaC?: number; durationDays?: number } = {}): StartResult {
      const p = { maxTempDeltaC: opts.maxTempDeltaC ?? DEFAULT_GLOBAL_WARMING_CONFIG.maxTempDeltaC };
      const dur = opts.durationDays ?? DEFAULT_GLOBAL_WARMING_CONFIG.durationDays;
      return scenarioRegistry.start('globalWarming', p, debug.state.timeOfDay.totalDays, dur, { label: 'Global Warming' });
    },
    startIceAge(opts: { maxTempDeltaC?: number; durationDays?: number } = {}): StartResult {
      const p = { maxTempDeltaC: opts.maxTempDeltaC ?? DEFAULT_ICE_AGE_CONFIG.maxTempDeltaC };
      const dur = opts.durationDays ?? DEFAULT_ICE_AGE_CONFIG.durationDays;
      return scenarioRegistry.start('iceAge', p, debug.state.timeOfDay.totalDays, dur, { label: 'Ice Age' });
    },
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
      const latRad = (latDeg * Math.PI) / 180;
      const lonRad = (lonDeg * Math.PI) / 180;
      const cosLat = Math.cos(latRad);
      const dir = new THREE.Vector3(
        cosLat * Math.cos(lonRad),
        cosLat * Math.sin(lonRad),
        Math.sin(latRad),
      );
      const elevationM = Math.max(0, world.getElevationMetersAt(latDeg, lonDeg));
      const wind = world.getWindAt(latDeg, lonDeg);
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

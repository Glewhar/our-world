/**
 * Tweakpane orchestrator.
 *
 * Layout:
 *   Camera | Scene | Time of day | Layers | Materials/{Globe, Atmosphere,
 *   Ocean, Clouds, PostFX} | Pick
 *
 * The debug state is a plain mutable object that the scene graph reads
 * each frame to push uniforms. Tweakpane mutates it in-place via its
 * binding API.
 */

import { Pane, type FolderApi } from 'tweakpane';

export type DebugState = {
  camera: { autoOrbit: boolean; orbitSpeed: number };
  scene: { background: string; showGrid: boolean };
  /**
   * Time-of-day and calendar state.
   *
   *   The game runs on a single canonical counter, `totalDays`. Every
   *   other temporal field here is *derived* from it once per frame by
   *   scene-graph.ts. Game-mechanic code should READ the derived fields
   *   but only WRITE `totalDays` (or, for a clock scrub, the fractional
   *   part of it — see main.ts).
   *
   *   One unit of `totalDays` = one in-game day = one full clock rotation
   *                           = one in-game month.
   *   Twelve units            = one in-game year.
   *
   *   At T01_PER_SECOND = 0.04 (in scene-graph.ts), one in-game day takes
   *   25 real seconds and one in-game year takes 5 real minutes.
   *
   *   "How long has it been since event X?" — snapshot `totalDays` at X
   *   and diff against the current value; the result is in in-game days.
   */
  timeOfDay: {
    /** Fractional day, 0..1. DERIVED. Drives sun longitude: 0.5 = noon at +X, 0 = midnight. */
    t01: number;
    /** Pauses auto-advance of `totalDays`. Camera + UI keep working; sim-driven systems freeze. */
    paused: boolean;
    /** Fractional year, 0..1. DERIVED. Drives sun declination via applyTimeOfDay (axial tilt). */
    timeOfYear01: number;
    /** Integer years since boot. DERIVED. Display year = START_YEAR (2067, in main.ts) + this. */
    yearsElapsed: number;
    /**
     * Canonical continuous counter — the SOURCE OF TRUTH for all temporal
     * state. Auto-advance writes this every unpaused frame; clock scrub
     * rewrites only its fractional part so the integer day count
     * (and therefore month/year) doesn't jump when the user drags the dial.
     */
    totalDays: number;
  };
  /**
   * Single uniform multiplier applied to every metres-based altitude in
   * the project (terrain, water, clouds, plane bow arcs, atmosphere
   * shell). 5 is the project baseline; 1 compresses toward physical scale,
   * 10 is double the baseline exaggeration.
   */
  altitude: { scaleFactor: number };
  layers: {
    globe: boolean;
    atmosphere: boolean;
    ocean: boolean;
    clouds: boolean;
    highways: boolean;
    airports: boolean;
    routeScaffold: boolean;
    trails: boolean;
    planes: boolean;
    postFx: boolean;
  };
  airplanes: {
    speed: number; // sim hours per real second
    targetInFlight: number; // approx number of planes airborne at speed=1
    scaffoldOpacity: number;
    trailOpacity: number;
  };
  materials: {
    globe: {
      ambient: number;
      nightTint: string;
      lerpColorFire: string;
      lerpColorIce: string;
      lerpColorInfection: string;
      lerpColorPollution: string;
      lerpStrengthFire: number;
      lerpStrengthIce: number;
      lerpStrengthInfection: number;
      lerpStrengthPollution: number;
      biomeStrength: number;
      snowLineStrength: number;
      seasonOffsetC: number;
      alpineStrength: number;
      // Coast smoothstep half-width in km (smaller = razor edge).
      coastSharpness: number;
      // Distance in km over which biome colour fades to neutral at borders.
      biomeEdgeSharpness: number;
      // Per-biome surface variation. Master = 0 → identical to pre-feature look.
      biomeSurfaceStrength: number;
      biomeColorVar: number;
      biomeBumpStrength: number;
      biomeNoiseFreq: number;
      // 12-entry per-biome amplitude (0..2). Index = biome class.
      biomeSurfaceAmps: number[];
      specularStrength: number;
      biomeSpecAmps: number[];
    };
    atmosphere: {
      rayleighScale: number;
      mieScale: number;
      sunDiskSize: number;
      exposure: number;
      /**
       * Aerial-perspective tint on the planet surface. Mixes each
       * land/water fragment toward the sky-view LUT colour by a
       * slant-column "air thickness" factor, so distant terrain bluess
       * out toward the limb. 0 disables; ~0.25 is the design default.
       */
      hazeAmount: number;
      /**
       * Haze-layer height in metres. Terrain above this exponentially
       * loses haze, so mountain peaks at the limb keep their shading
       * detail instead of washing flat into the sphere outline. Land
       * shader only — water is at sea level. Default 3000 m.
       */
      hazeFalloffM: number;
    };
    ocean: {
      waveAmplitude: number;
      waveSpeed: number;
      waveSteepness: number;
      fresnelStrength: number;
      depthFalloff: number;
      abyssalColor: string;
      deepColor: string;
      shelfColor: string;
      shallowColor: string;
      trenchStart: number;
      trenchEnd: number;
      coastalTintColor: string;
      coastalTintStrength: number;
      coastalTintFalloff: number;
      currentStrength: number;
      currentTintEnabled: boolean;
      showMediumCurrents: boolean;
      shimmerCurrentDrift: number;
    };
    clouds: {
      density: number;
      coverage: number;
      beer: number;
      henyey: number;
      advection: number;
    };
    highways: {
      majorWidthPx: number;
      arterialWidthPx: number;
      localWidthPx: number;
      local2WidthPx: number;
      nightBrightness: number;
      majorBoost: number;
      arterialBoost: number;
      localBoost: number;
      local2Boost: number;
      coreWidth: number;
      coreBoost: number;
      haloStrength: number;
      haloFalloff: number;
      dayStrength: number;
      dayCasingPx: number;
      dayCasingStrength: number;
      dayFillBrightness: number;
      dayFillScale: number;
      opacityNear: number;
      opacityFar: number;
    };
    cities: {
      gridDensity: number;
      aspectJitter: number;
      rowOffset: number;
      blockThreshold: number;
      outlineMin: number;
      outlineMax: number;
      nightBrightness: number;
      tileSparkle: number;
      dayContrast: number;
      opacity: number;
      nightOpacity: number;
      minPopulation: number;
    };
    postFx: { bloomThreshold: number; bloomStrength: number; vignette: number; gradeTint: string };
  };
  nuclear: {
    // Size & timing (live).
    worldScale: number;
    timeScale: number;
    spriteScale: number;
    windStrength: number;
    windDelay: number;
    windRamp: number;
    windJitter: number;
    // Sub-effect toggles (re-detonate).
    enableFire: boolean;
    enableSmoke: boolean;
    enableMushroom: boolean;
    enableMushroomFire: boolean;
    enableColumnFire: boolean;
    enableColumnSmoke: boolean;
    enableDebris: boolean;
    // Shape (re-detonate).
    mushroomHeightScale: number;
    columnHeightScale: number;
    // Colours (re-detonate).
    fireColorStart: string;
    fireColorEnd: string;
    smokeColorStart: string;
    smokeColorEnd: string;
  };
  pick: { lastPick: string };
};

export const initialDebugState: DebugState = {
  camera: { autoOrbit: false, orbitSpeed: 0.05 },
  scene: { background: '#06080c', showGrid: false },
  timeOfDay: { t01: 0, paused: false, timeOfYear01: 0, yearsElapsed: 0, totalDays: 0 },
  altitude: { scaleFactor: 3 },
  layers: {
    globe: true,
    atmosphere: true,
    ocean: true,
    clouds: true,
    highways: true,
    airports: false,
    routeScaffold: false,
    trails: true,
    planes: true,
    postFx: true,
  },
  airplanes: {
    speed: 0.15,
    targetInFlight: 500,
    scaffoldOpacity: 0.04,
    trailOpacity: 0.05,
  },
  materials: {
    globe: {
      ambient: 0.22,
      nightTint: '#152d5a',
      lerpColorFire: '#1a1014',
      lerpColorIce: '#d4ecff',
      lerpColorInfection: '#bb33cc',
      lerpColorPollution: '#7a6a3a',
      lerpStrengthFire: 1.0,
      lerpStrengthIce: 1.0,
      lerpStrengthInfection: 1.0,
      lerpStrengthPollution: 1.0,
      biomeStrength: 1.0,
      snowLineStrength: 0.55,
      seasonOffsetC: 0.0,
      alpineStrength: 0.7,
      coastSharpness: 50.0,
      biomeEdgeSharpness: 80.0,
      biomeSurfaceStrength: 1.0,
      biomeColorVar: 0.6,
      biomeBumpStrength: 0.6,
      biomeNoiseFreq: 12.0,
      biomeSurfaceAmps: [0.8, 0.7, 0.6, 0.5, 0.6, 0.4, 0.9, 0.3, 0.7, 0.4, 0.6, 1.0],
      specularStrength: 1.4,
      biomeSpecAmps: [0.05, 0.1, 0.04, 0.06, 0.06, 0.05, 0.0, 0.4, 0.2, 0.15, 0.12, 0.2],
    },
    atmosphere: {
      rayleighScale: 1.2,
      mieScale: 0.4,
      sunDiskSize: 0.18,
      exposure: 3.5,
      hazeAmount: 0.7,
      hazeFalloffM: 3000,
    },
    ocean: {
      waveAmplitude: 150,
      waveSpeed: 1.0,
      waveSteepness: 0.5,
      fresnelStrength: 1.0,
      depthFalloff: 50,
      abyssalColor: '#192551',
      deepColor: '#5b7cb7',
      shelfColor: '#296aa7',
      shallowColor: '#7bdbfa',
      trenchStart: 2200,
      trenchEnd: 7700,
      coastalTintColor: '#ffffff',
      coastalTintStrength: 0.08,
      coastalTintFalloff: 400,
      currentStrength: 1.0,
      currentTintEnabled: true,
      showMediumCurrents: false,
      shimmerCurrentDrift: 17,
    },
    clouds: {
      density: 0.1,
      coverage: 0.5,
      beer: 1.4,
      henyey: 0.4,
      advection: 24,
    },
    highways: {
      majorWidthPx: 4.0,
      arterialWidthPx: 3.0,
      localWidthPx: 1.0,
      local2WidthPx: 1.0,
      nightBrightness: 0.6,
      majorBoost: 0.8,
      arterialBoost: 0.45,
      localBoost: 0.6,
      local2Boost: 0.2,
      coreWidth: 0.6,
      coreBoost: 1.2,
      haloStrength: 0.5,
      haloFalloff: 1.8,
      dayStrength: 0.55,
      dayCasingPx: 1.0,
      dayCasingStrength: 0.3,
      dayFillBrightness: 0.4,
      dayFillScale: 0.3,
      opacityNear: 1.0,
      opacityFar: 0.05,
    },
    cities: {
      gridDensity: 35,
      aspectJitter: 0.1,
      rowOffset: 0.5,
      blockThreshold: 0.1,
      outlineMin: 0.01,
      outlineMax: 0.06,
      nightBrightness: 0.8,
      tileSparkle: 1.4,
      dayContrast: 0.6,
      opacity: 0.65,
      nightOpacity: 5.0,
      minPopulation: 0,
    },
    postFx: { bloomThreshold: 0.85, bloomStrength: 0.6, vignette: 0.35, gradeTint: '#f3eee0' },
  },
  nuclear: {
    worldScale: 0.003,
    timeScale: 1.3,
    spriteScale: 4.0,
    windStrength: 2.0,
    windDelay: 4.0,
    windRamp: 8.0,
    windJitter: 1.0,
    enableFire: true,
    enableSmoke: true,
    enableMushroom: true,
    enableMushroomFire: true,
    enableColumnFire: true,
    enableColumnSmoke: true,
    enableDebris: true,
    mushroomHeightScale: 1.0,
    columnHeightScale: 1.0,
    fireColorStart: '#a73a1e',
    fireColorEnd: '#932601',
    smokeColorStart: '#646464',
    smokeColorEnd: '#808080',
  },
  pick: { lastPick: '(click on the globe)' },
};

export type DebugPanel = {
  pane: Pane;
  state: DebugState;
  dispose: () => void;
};

export function createDebugPanel(state: DebugState = initialDebugState): DebugPanel {
  // The pane lives inside #tweakpane-host so the page can collapse/expand it
  // off-screen without unmounting Tweakpane. Falls back to body when the host
  // is missing (tests, alternate hosts).
  const host = document.getElementById('tweakpane-host');
  const pane = host
    ? new Pane({ title: 'earth-destroyer', expanded: true, container: host })
    : new Pane({ title: 'earth-destroyer', expanded: true });

  const cameraFolder: FolderApi = pane.addFolder({ title: 'Camera' });
  cameraFolder.addBinding(state.camera, 'autoOrbit');
  cameraFolder.addBinding(state.camera, 'orbitSpeed', { min: 0, max: 0.5, step: 0.001 });

  const sceneFolder = pane.addFolder({ title: 'Scene' });
  sceneFolder.addBinding(state.scene, 'background');
  sceneFolder.addBinding(state.scene, 'showGrid', { disabled: true, label: 'showGrid (n/a)' });

  const altitudeFolder = pane.addFolder({ title: 'Altitude', expanded: false });
  altitudeFolder.addBinding(state.altitude, 'scaleFactor', {
    min: 1, max: 10, step: 0.1, label: 'scale (×)',
  });

  // Time of day: the floating bottom-center slider drives `t01` and the
  // pause button toggles `paused`. Tweakpane mirrors the pause toggle so
  // it can also be flipped from here.
  const todFolder = pane.addFolder({ title: 'Time of day' });
  todFolder.addBinding(state.timeOfDay, 'paused', { label: 'pause' });

  // Clouds / ocean / atmosphere / cities / planes (combined planes+trails)
  // live on the floating bottom toggle bar (#layer-toggles in index.html).
  // Airports + routes remain here as the fine-grained airline-overlay knobs;
  // globe stays here; postFx is n/a.
  const layersFolder = pane.addFolder({ title: 'Layers' });
  layersFolder.addBinding(state.layers, 'globe');
  layersFolder.addBinding(state.layers, 'postFx', { disabled: true, label: 'postFx (n/a)' });

  const planesFolder = pane.addFolder({ title: 'Airplanes' });
  planesFolder.addBinding(state.airplanes, 'speed', {
    min: 0,
    max: 10,
    step: 0.05,
    label: 'speed (h/sec)',
  });
  planesFolder.addBinding(state.airplanes, 'targetInFlight', {
    min: 0,
    max: 4000,
    step: 50,
    label: 'in-flight target',
  });
  planesFolder.addBinding(state.airplanes, 'scaffoldOpacity', {
    min: 0,
    max: 0.5,
    step: 0.005,
    label: 'route alpha',
  });
  planesFolder.addBinding(state.airplanes, 'trailOpacity', {
    min: 0,
    max: 0.3,
    step: 0.001,
    label: 'trail alpha',
  });

  const mat = pane.addFolder({ title: 'Materials' });

  // Globe live bindings live outside the panel: `seasonOffsetC` is driven by
  // the floating left-center thermostat (#season-control in index.html). The
  // older globe knobs (ambient, night tint, dynamic recolour, biomeStrength,
  // snowLineStrength, alpineStrength) are tuned via DebugState defaults and
  // pushed to uniforms each frame via `applyMaterials`. The Globe folder
  // below exposes the new coast / biome-edge / biome-surface knobs that
  // arrived with the distance-field bake — these need live tuning.
  const globeMat = mat.addFolder({ title: 'Globe', expanded: false });

  const gEdges = globeMat.addFolder({ title: 'Edges & coastline', expanded: false });
  gEdges.addBinding(state.materials.globe, 'coastSharpness', {
    min: 0, max: 100, step: 0.1, label: 'coast sharpness (km)',
  });
  gEdges.addBinding(state.materials.globe, 'biomeEdgeSharpness', {
    min: 0, max: 100, step: 0.5, label: 'biome edge fade (km)',
  });

  const gBiome = globeMat.addFolder({ title: 'Biome surface', expanded: false });
  gBiome.addBinding(state.materials.globe, 'biomeSurfaceStrength', {
    min: 0, max: 1, step: 0.01, label: 'master strength',
  });
  gBiome.addBinding(state.materials.globe, 'biomeColorVar', {
    min: 0, max: 1, step: 0.01, label: 'color variation',
  });
  gBiome.addBinding(state.materials.globe, 'biomeBumpStrength', {
    min: 0, max: 1, step: 0.01, label: 'bump',
  });
  gBiome.addBinding(state.materials.globe, 'biomeNoiseFreq', {
    min: 1, max: 40, step: 0.5, label: 'noise frequency',
  });
  // Per-biome amplitudes — 12 sliders. Tweakpane needs each entry as a
  // distinct binding key, so wrap each index in a small per-entry proxy
  // object whose mutation writes back into the array.
  const BIOME_LABELS = [
    '0 fallback',
    '1 forest',
    '2 shrubland',
    '3 grassland',
    '4 cropland',
    '5 built-up',
    '6 desert',
    '7 snow/ice',
    '8 water',
    '9 wetland',
    '10 mangroves',
    '11 tundra/alpine',
  ];
  const ampsFolder = gBiome.addFolder({ title: 'Per-biome amplitude', expanded: false });
  for (let i = 0; i < 12; i++) {
    const proxy = { v: state.materials.globe.biomeSurfaceAmps[i]! };
    ampsFolder
      .addBinding(proxy, 'v', { min: 0, max: 2, step: 0.01, label: BIOME_LABELS[i]! })
      .on('change', (ev) => {
        state.materials.globe.biomeSurfaceAmps[i] = ev.value;
      });
  }

  // Land specular — wide-cone Blinn-Phong highlight that tracks the camera.
  // Master strength multiplies the per-biome amps below; 0 = pure Lambert.
  const gLighting = globeMat.addFolder({ title: 'Lighting', expanded: false });
  gLighting.addBinding(state.materials.globe, 'specularStrength', {
    min: 0, max: 3, step: 0.01, label: 'specular',
  });
  const specAmpsFolder = gLighting.addFolder({ title: 'Per-biome specular', expanded: false });
  for (let i = 0; i < 12; i++) {
    const proxy = { v: state.materials.globe.biomeSpecAmps[i]! };
    specAmpsFolder
      .addBinding(proxy, 'v', { min: 0, max: 1, step: 0.01, label: BIOME_LABELS[i]! })
      .on('change', (ev) => {
        state.materials.globe.biomeSpecAmps[i] = ev.value;
      });
  }

  // Atmosphere — Hillaire 2020 LUTs. `rayleighScale`/`mieScale` are
  // multipliers on the physical β coefficients; 1.0 = real Earth.
  const atmMat = mat.addFolder({ title: 'Atmosphere', expanded: false });
  atmMat.addBinding(state.materials.atmosphere, 'rayleighScale', { min: 0, max: 2, step: 0.05 });
  atmMat.addBinding(state.materials.atmosphere, 'mieScale', { min: 0, max: 3, step: 0.05 });
  atmMat.addBinding(state.materials.atmosphere, 'sunDiskSize', {
    min: 0.001,
    max: 0.25,
    step: 0.005,
  });
  atmMat.addBinding(state.materials.atmosphere, 'exposure', { min: 0.1, max: 14, step: 0.05 });
  // Aerial perspective — tints land/water toward the sky-view LUT colour
  // by a slant-column air-thickness factor. 0 = no haze; 1 = strong blue
  // rim with disc-centre still readable.
  atmMat.addBinding(state.materials.atmosphere, 'hazeAmount', {
    min: 0,
    max: 1.5,
    step: 0.01,
    label: 'haze',
  });
  // Haze layer height in metres. Terrain above this exponentially loses
  // haze so mountain peaks at the limb keep their shading detail. Low =
  // even hills punch through; high = behaviour reverts toward uniform haze.
  atmMat.addBinding(state.materials.atmosphere, 'hazeFalloffM', {
    min: 500,
    max: 10000,
    step: 100,
    label: 'haze layer (m)',
  });

  // Ocean — Gerstner waves + layered depth gradient + coastal tint +
  // current-speed tint + shimmer-noise warp by current direction.
  const oceanMat = mat.addFolder({ title: 'Ocean', expanded: false });

  const oWaves = oceanMat.addFolder({ title: 'Waves', expanded: false });
  oWaves.addBinding(state.materials.ocean, 'waveAmplitude', {
    min: 0, max: 600, step: 5, label: 'amplitude (m)',
  });
  oWaves.addBinding(state.materials.ocean, 'waveSpeed', {
    min: 0, max: 5, step: 0.05, label: 'speed',
  });
  oWaves.addBinding(state.materials.ocean, 'waveSteepness', {
    min: 0, max: 1, step: 0.01, label: 'steepness',
  });
  oWaves.addBinding(state.materials.ocean, 'fresnelStrength', {
    min: 0, max: 3, step: 0.05, label: 'fresnel',
  });

  const oDepth = oceanMat.addFolder({ title: 'Depth & color', expanded: false });
  oDepth.addBinding(state.materials.ocean, 'depthFalloff', {
    min: 0, max: 100, step: 1, label: 'depth falloff',
  });
  oDepth.addBinding(state.materials.ocean, 'shallowColor', { label: 'shallow' });
  oDepth.addBinding(state.materials.ocean, 'shelfColor', { label: 'shelf' });
  oDepth.addBinding(state.materials.ocean, 'deepColor', { label: 'deep' });
  oDepth.addBinding(state.materials.ocean, 'abyssalColor', { label: 'abyssal' });
  oDepth.addBinding(state.materials.ocean, 'trenchStart', {
    min: 0, max: 11000, step: 100, label: 'trench start (m)',
  });
  oDepth.addBinding(state.materials.ocean, 'trenchEnd', {
    min: 0, max: 12000, step: 100, label: 'trench end (m)',
  });

  const oCoast = oceanMat.addFolder({ title: 'Coastal tint', expanded: false });
  oCoast.addBinding(state.materials.ocean, 'coastalTintColor', { label: 'color' });
  oCoast.addBinding(state.materials.ocean, 'coastalTintStrength', {
    min: 0, max: 1, step: 0.01, label: 'strength',
  });
  oCoast.addBinding(state.materials.ocean, 'coastalTintFalloff', {
    min: 0, max: 1500, step: 10, label: 'falloff (m)',
  });

  const oCurrents = oceanMat.addFolder({ title: 'Currents', expanded: false });
  oCurrents.addBinding(state.materials.ocean, 'currentStrength', {
    min: 0, max: 3, step: 0.05, label: 'strength',
  });
  oCurrents.addBinding(state.materials.ocean, 'currentTintEnabled', {
    label: 'tint',
  });
  oCurrents.addBinding(state.materials.ocean, 'showMediumCurrents', {
    label: 'show medium',
  });
  oCurrents.addBinding(state.materials.ocean, 'shimmerCurrentDrift', {
    min: 0, max: 40, step: 0.05, label: 'shimmer drift',
  });

  // Clouds — volumetric raymarch in the [1.012, 1.025] shell.
  const cloudsMat = mat.addFolder({ title: 'Clouds', expanded: false });
  cloudsMat.addBinding(state.materials.clouds, 'density', { min: 0, max: 2, step: 0.01 });
  cloudsMat.addBinding(state.materials.clouds, 'coverage', { min: 0, max: 1, step: 0.01 });
  cloudsMat.addBinding(state.materials.clouds, 'beer', { min: 0, max: 4, step: 0.05 });
  cloudsMat.addBinding(state.materials.clouds, 'henyey', { min: -0.95, max: 0.95, step: 0.01 });
  cloudsMat.addBinding(state.materials.clouds, 'advection', { min: 0, max: 100, step: 0.5 });

  // Highways — merged ribbon mesh tracing every kept road polyline. Width
  // is in *screen pixels* (per kind), so the network stays delicate at
  // every zoom. Grouped sub-folders: Road widths (shared day+night),
  // Day look (white fill + dark casing), Night look (glowing core + halo),
  // Zoom fade (opacity by camera distance).
  const highwaysMat = mat.addFolder({ title: 'Highways', expanded: false });
  const hwWidths = highwaysMat.addFolder({ title: 'Road widths (px)', expanded: false });
  hwWidths.addBinding(state.materials.highways, 'majorWidthPx', {
    min: 1, max: 8, step: 0.25, label: 'major',
  });
  hwWidths.addBinding(state.materials.highways, 'arterialWidthPx', {
    min: 0.5, max: 6, step: 0.25, label: 'arterial',
  });
  hwWidths.addBinding(state.materials.highways, 'localWidthPx', {
    min: 0.2, max: 4, step: 0.1, label: 'local',
  });
  hwWidths.addBinding(state.materials.highways, 'local2WidthPx', {
    min: 0.2, max: 4, step: 0.1, label: 'local2',
  });

  const hwDay = highwaysMat.addFolder({ title: 'Day look', expanded: false });
  hwDay.addBinding(state.materials.highways, 'dayStrength', {
    min: 0, max: 2, step: 0.05, label: 'overall strength',
  });
  hwDay.addBinding(state.materials.highways, 'dayFillScale', {
    min: 0.2, max: 3, step: 0.05, label: 'fill width',
  });
  hwDay.addBinding(state.materials.highways, 'dayFillBrightness', {
    min: 0, max: 1.5, step: 0.05, label: 'fill brightness',
  });
  hwDay.addBinding(state.materials.highways, 'dayCasingPx', {
    min: 0, max: 4, step: 0.1, label: 'casing width (px)',
  });
  hwDay.addBinding(state.materials.highways, 'dayCasingStrength', {
    min: 0, max: 1.5, step: 0.05, label: 'casing strength',
  });

  const hwNight = highwaysMat.addFolder({ title: 'Night look', expanded: false });
  hwNight.addBinding(state.materials.highways, 'nightBrightness', {
    min: 0, max: 2, step: 0.05, label: 'overall brightness',
  });
  hwNight.addBinding(state.materials.highways, 'majorBoost', {
    min: 1, max: 15, step: 0.05, label: 'major boost',
  });
  hwNight.addBinding(state.materials.highways, 'arterialBoost', {
    min: 0.2, max: 2, step: 0.05, label: 'arterial boost',
  });
  hwNight.addBinding(state.materials.highways, 'localBoost', {
    min: 0.2, max: 1.5, step: 0.05, label: 'local boost',
  });
  hwNight.addBinding(state.materials.highways, 'local2Boost', {
    min: 0.2, max: 1.5, step: 0.05, label: 'local2 boost',
  });
  hwNight.addBinding(state.materials.highways, 'coreWidth', {
    min: 0.05, max: 0.6, step: 0.01, label: 'core width',
  });
  hwNight.addBinding(state.materials.highways, 'coreBoost', {
    min: 0.5, max: 4, step: 0.05, label: 'core boost',
  });
  hwNight.addBinding(state.materials.highways, 'haloStrength', {
    min: 0, max: 2, step: 0.05, label: 'halo strength',
  });
  hwNight.addBinding(state.materials.highways, 'haloFalloff', {
    min: 0.5, max: 5, step: 0.05, label: 'halo falloff',
  });

  const hwFade = highwaysMat.addFolder({ title: 'Zoom fade', expanded: false });
  hwFade.addBinding(state.materials.highways, 'opacityNear', {
    min: 0, max: 1, step: 0.01, label: 'alpha zoomed in',
  });
  hwFade.addBinding(state.materials.highways, 'opacityFar', {
    min: 0, max: 1, step: 0.01, label: 'alpha zoomed out',
  });

  // Cities — far-LOD polygon glow. The PIP test stamps each city's
  // outline; the block-spray inside is a per-row brick grid with random
  // x-stretch (aspect jitter) and a running-bond x-offset.
  const citiesMat = mat.addFolder({ title: 'Cities', expanded: true });
  const cBricks = citiesMat.addFolder({ title: 'Brick pattern', expanded: true });
  cBricks.addBinding(state.materials.cities, 'gridDensity', {
    min: 4, max: 64, step: 1, label: 'cells per half',
  });
  cBricks.addBinding(state.materials.cities, 'aspectJitter', {
    min: 0, max: 3, step: 0.05, label: 'row x-stretch',
  });
  cBricks.addBinding(state.materials.cities, 'rowOffset', {
    min: 0, max: 1, step: 0.01, label: 'running bond',
  });
  cBricks.addBinding(state.materials.cities, 'blockThreshold', {
    min: 0, max: 1, step: 0.01, label: 'block fill thresh',
  });
  cBricks.addBinding(state.materials.cities, 'outlineMin', {
    min: 0, max: 0.2, step: 0.005, label: 'outline min',
  });
  cBricks.addBinding(state.materials.cities, 'outlineMax', {
    min: 0, max: 0.3, step: 0.005, label: 'outline max',
  });
  const cLook = citiesMat.addFolder({ title: 'Look', expanded: false });
  cLook.addBinding(state.materials.cities, 'nightBrightness', {
    min: 0, max: 4, step: 0.05, label: 'night brightness',
  });
  cLook.addBinding(state.materials.cities, 'tileSparkle', {
    min: 0, max: 3, step: 0.05, label: 'tile sparkle',
  });
  cLook.addBinding(state.materials.cities, 'nightOpacity', {
    min: 0, max: 6, step: 0.05, label: 'night opacity',
  });
  cLook.addBinding(state.materials.cities, 'dayContrast', {
    min: 0, max: 1, step: 0.01, label: 'day contrast',
  });
  cLook.addBinding(state.materials.cities, 'opacity', {
    min: 0, max: 1, step: 0.01, label: 'opacity',
  });
  cLook.addBinding(state.materials.cities, 'minPopulation', {
    min: 0, max: 5_000_000, step: 1000, label: 'min population',
  });

  // PostFX — bloom + vignette + grade tint. Not wired: PostFXChain currently
  // ships a passthrough RenderPass, so these bindings are greyed out until
  // the bloom / vignette / grade passes are attached.
  const postMat = mat.addFolder({ title: 'PostFX (n/a)', expanded: false });
  postMat.disabled = true;
  postMat.addBinding(state.materials.postFx, 'bloomThreshold', { min: 0, max: 2, step: 0.01 });
  postMat.addBinding(state.materials.postFx, 'bloomStrength', { min: 0, max: 3, step: 0.01 });
  postMat.addBinding(state.materials.postFx, 'vignette', { min: 0, max: 1.5, step: 0.01 });
  postMat.addBinding(state.materials.postFx, 'gradeTint');

  // Nuclear explosion knobs. "Size & timing" live-applies every frame;
  // the other groups only take effect on the next detonation because they
  // alter the configs the particle list is built from.
  const nukeFolder = pane.addFolder({ title: 'Nuclear', expanded: false });

  const nSize = nukeFolder.addFolder({ title: 'Size & timing', expanded: true });
  nSize.addBinding(state.nuclear, 'worldScale', {
    min: 0.001, max: 0.010, step: 0.0001, label: 'size',
  });
  nSize.addBinding(state.nuclear, 'timeScale', {
    min: 0.1, max: 3, step: 0.05, label: 'time speed',
  });
  nSize.addBinding(state.nuclear, 'spriteScale', {
    min: 0.25, max: 12, step: 0.05, label: 'sprite size',
  });
  nSize.addBinding(state.nuclear, 'windStrength', {
    min: 0, max: 4, step: 0.01, label: 'wind strength',
  });
  nSize.addBinding(state.nuclear, 'windDelay', {
    min: 0, max: 10, step: 0.1, label: 'wind delay (s)',
  });
  nSize.addBinding(state.nuclear, 'windRamp', {
    min: 0, max: 10, step: 0.1, label: 'wind ramp (s)',
  });
  nSize.addBinding(state.nuclear, 'windJitter', {
    min: 0, max: 1, step: 0.01, label: 'wind jitter',
  });

  const nSubs = nukeFolder.addFolder({ title: 'Sub-effects (redetonate)', expanded: false });
  nSubs.addBinding(state.nuclear, 'enableFire', { label: 'fire' });
  nSubs.addBinding(state.nuclear, 'enableSmoke', { label: 'smoke' });
  nSubs.addBinding(state.nuclear, 'enableMushroom', { label: 'mushroom cap' });
  nSubs.addBinding(state.nuclear, 'enableMushroomFire', { label: 'cap fire' });
  nSubs.addBinding(state.nuclear, 'enableColumnFire', { label: 'column fire' });
  nSubs.addBinding(state.nuclear, 'enableColumnSmoke', { label: 'column smoke' });
  nSubs.addBinding(state.nuclear, 'enableDebris', { label: 'debris' });

  const nShape = nukeFolder.addFolder({ title: 'Shape (redetonate)', expanded: false });
  nShape.addBinding(state.nuclear, 'mushroomHeightScale', {
    min: 0.25, max: 3, step: 0.05, label: 'mushroom height',
  });
  nShape.addBinding(state.nuclear, 'columnHeightScale', {
    min: 0.25, max: 3, step: 0.05, label: 'column height',
  });

  const nCols = nukeFolder.addFolder({ title: 'Colours (redetonate)', expanded: false });
  nCols.addBinding(state.nuclear, 'fireColorStart', { label: 'fire start' });
  nCols.addBinding(state.nuclear, 'fireColorEnd', { label: 'fire end' });
  nCols.addBinding(state.nuclear, 'smokeColorStart', { label: 'smoke start' });
  nCols.addBinding(state.nuclear, 'smokeColorEnd', { label: 'smoke end' });

  const pickFolder = pane.addFolder({ title: 'Pick', expanded: true });
  pickFolder.addBinding(state.pick, 'lastPick', { readonly: true, multiline: true, rows: 8 });

  return {
    pane,
    state,
    dispose: () => pane.dispose(),
  };
}

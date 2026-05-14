/**
 * Central defaults table — the single source of truth for every
 * user-facing tunable that appears in Tweakpane.
 *
 * Direction is one-way: this table authors values; both `Tweakpane.ts`
 * (constructing `initialDebugState`) and the render-side materials /
 * passes consume from it. Render code MUST NOT declare its own
 * `DEFAULT_*` numeric constants for anything tunable from this UI —
 * the resulting drift was the bug this module was created to solve.
 *
 * Shape mirrors `DebugState` so Tweakpane builds its state by reference.
 * Non-Tweakpane internals (e.g. coastline z-fight biases, scene-graph
 * pure math constants) stay where they are; this table is exclusively
 * for the UI-tunable knobs.
 *
 * Nuclear scenario defaults still come from
 * `world/scenarios/handlers/NuclearScenario.config.ts` — that file is
 * the per-scenario tuning surface (the scenario handler also consumes
 * it directly), and Tweakpane already routes through it.
 */

export const DEFAULTS = {
  camera: {
    autoOrbit: true,
    orbitSpeed: 0.005,
  },
  scene: {
    background: '#06080c',
    showGrid: false,
  },
  timeOfDay: {
    t01: 0,
    paused: false,
    timeOfYear01: 0,
    yearsElapsed: 0,
    totalDays: 0,
  },
  altitude: {
    scaleFactor: 3,
  },
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
      // Antipodal-moon lighting on the night side. The scene's moon is
      // antipodal to the sun (SunMoon.ts), so `moonDir = -sunDir` lights
      // the entire night hemisphere; brightest at the anti-solar point,
      // zero at the terminator (where day shading takes over). Land gets
      // a soft cool-blue lambert glow; water also gets a Blinn-Phong
      // "path of moonlight" specular highlight.
      moonColor: '#7fb0ff',
      moonIntensity: 0.15,
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
      // 12 entries — indexed by biome class.
      biomeSurfaceAmps: [0.8, 0.7, 0.6, 0.5, 0.6, 0.4, 0.9, 0.3, 0.7, 0.4, 0.6, 1.0] as readonly number[],
      specularStrength: 1.4,
      biomeSpecAmps: [0.05, 0.1, 0.04, 0.06, 0.06, 0.05, 0.0, 0.4, 0.2, 0.15, 0.12, 0.2] as readonly number[],
    },
    atmosphere: {
      // Sky-physics preset id (see ATMOSPHERE_PRESETS in Tweakpane.ts).
      // Selecting a preset batch-writes rayleighScale/mieScale/solarIrradiance
      // into state and refreshes the UI; subsequent slider drags then move
      // each value independently.
      preset: 'earth',
      rayleighScale: 1.2,
      mieScale: 0.4,
      // Tweakpane "sun disk size" — scene-graph multiplies by 3 to get
      // angular degrees handed to the atmosphere shader. Keep this as
      // the Tweakpane-facing value; conversion happens at the call site.
      sunDiskSize: 0.18,
      exposure: 3.5,
      hazeAmount: 0.7,
      hazeFalloffM: 50000,
      // Top-of-atmosphere solar spectrum (per-channel radiance). Feeds the
      // multi-scatter + sky-view LUTs and the rim-halo edge term, so this
      // tints the haze, the rim halo, and ground shading together. White
      // canonical = (1.474, 1.8504, 1.91198) per Hillaire 2020.
      solarIrradiance: { r: 1.474, g: 1.8504, b: 1.91198 },
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
      seaLevelOffsetM: 0,
    },
    clouds: {
      density: 0.1,
      coverage: 0.5,
      beer: 1.4,
      henyey: 0.4,
      advection: 40,
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
    postFx: {
      bloomThreshold: 0.85,
      bloomStrength: 0.6,
      vignette: 0.35,
      gradeTint: '#f3eee0',
    },
  },
  scenarios: {
    wastelandColor: '#5a4d40',
    wastelandDesaturate: 0.6,
    wastelandStrength: 1.0,
  },
  pick: {
    lastPick: '(click on the globe)',
  },
  debug: {
    fpsCounter: false,
  },
  renderScale: 1.0,
} as const;

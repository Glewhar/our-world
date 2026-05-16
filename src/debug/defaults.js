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
        // Warm directional light (kept ≤ 1.0 per channel so snow doesn't overdrive).
        sunLightColor: 0xfff5e6,
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
        clouds: false,
        highways: true,
        cities: true,
        urban: true,
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
            snowLineStrength: 0.85,
            alpineStrength: 0.7,
            // 20-entry palette indexed by WWF TEOW biome code (0 = no-data
            // fallback, 1..14 = TEOW biomes, 15 = synthetic ice/glacier used
            // only by climate-scenario biome overrides, 16..18 = synthetic
            // latitude-banded shelf biomes assigned at bake time to every
            // TEOW-uncovered cell, 19 = synthetic wasteland used only by
            // the uniform-driven nuclear path — the baked attribute_static.G
            // never produces 15 or 19). Shelf slots are placeholders here:
            // the LAND seafloor branch reads `materials.globe.seafloorPalette`
            // (default + scenario palettes mixed by climate envelope) rather
            // than these entries. Tweakpane exposes each slot for live tuning.
            biomePalette: [
                '#c4bcaa', //  0  no data / fallback (old land-base)
                '#2f6a3c', //  1  tropical moist forest
                '#7a8a4a', //  2  tropical dry forest
                '#5b7a52', //  3  tropical coniferous forest
                '#6e8c54', //  4  temperate broadleaf
                '#4d6c52', //  5  temperate conifer
                '#3e5a4a', //  6  boreal / taiga
                '#bea870', //  7  tropical savanna
                '#b3a578', //  8  temperate grassland
                '#90a48c', //  9  flooded grassland
                '#94a08a', // 10  montane grassland
                '#bdb7a8', // 11  tundra
                '#9a8e5a', // 12  mediterranean
                '#c8b486', // 13  desert / xeric
                '#264c40', // 14  mangroves
                '#e8eef0', // 15  ice / glacier (override-only)
                '#8aa3b3', // 16  polar shelf (placeholder; live colour from seafloorPalette)
                '#6a6660', // 17  temperate shelf (placeholder)
                '#c8b894', // 18  equatorial shelf (placeholder)
                '#5b5550', // 19  wasteland (placeholder; live colour from scenarios.wastelandColor)
            ],
            // Per-realm HSV tint applied on top of the parent biome colour.
            // Length 9 (slot 0 unused; 1..8 = realms in the order
            // 1 Australasia, 2 Antarctic, 3 Afrotropic, 4 Indomalay,
            // 5 Nearctic, 6 Neotropic, 7 Oceania, 8 Palearctic — matching
            // the REALM codes carried by the polygon lookup). All defaults
            // are neutral (no tint) so a fresh bake matches the legacy
            // 14-biome look until the user starts tuning.
            realmTint: [
                { dHue: 0, satMult: 1.0, valMult: 1.0 }, // 0 sentinel
                { dHue: -13.0, satMult: 1.35, valMult: 0.99 }, // 1 Australasia
                { dHue: 0, satMult: 1.0, valMult: 1.0 }, // 2 Antarctic
                { dHue: 0.5, satMult: 1.10, valMult: 0.90 }, // 3 Afrotropic
                { dHue: 0, satMult: 1.0, valMult: 1.0 }, // 4 Indomalay
                { dHue: 17.0, satMult: 1.0, valMult: 1.0 }, // 5 Nearctic
                { dHue: -11.5, satMult: 1.0, valMult: 1.0 }, // 6 Neotropic
                { dHue: 0, satMult: 1.0, valMult: 1.0 }, // 7 Oceania
                { dHue: -2.5, satMult: 0.84, valMult: 1.08 }, // 8 Palearctic
            ],
            // Strength of the per-ecoregion deterministic HSV wobble. 0 = none
            // (every ecoregion paints exactly its biome×realm colour); 1 =
            // ±8° hue / ±10% sat / ±10% value variance per ecoregion. The
            // default is mild so the variety reads without breaking the
            // hand-picked palette.
            ecoregionJitter: 1.3,
            landSpecularSmoothness: 0.08,
            specularStrength: 1.4,
            // Elevation / climate-driven tints applied on top of the land base colour.
            alpineBareColor: '#c4bcb3', // bare rock at high altitude
            coldToneColor: '#7a92b8', // cold-climate desaturation
            hotDryColor: '#e5dabc', // hot/dry sun-baked tint
            // Two-tone specular highlight: warm tint for non-snow, cool tint for
            // snow. The shader lerps between them by the snow-line mix.
            specularTintWarm: '#fffcf6',
            specularTintCool: '#f9fcff',
            // Moonlight reflectance — land base color desaturates toward this
            // neutral grey under antipodal moonlight.
            moonReflectanceBase: '#cbcbcb',
            // Seafloor (shelf) — default palette for the three latitude-banded
            // shelf biomes the bake emits at every TEOW-uncovered cell. The
            // LAND fragment shader's seafloor branch reads these as the
            // "no scenario" colour and crossfades against per-slot scenario
            // palettes (e.g. Ice Age) by the climate envelope.
            seafloorPalette: {
                polar: '#8aa3b3',
                temperate: '#6a6660',
                equatorial: '#c8b894',
            },
            // Latitude cutoffs handed to `assign_shelf_biomes` at bake time.
            // Tweakpane exposes these as "(rebake required)" sliders — moving
            // them in the running game does not reclassify cells until the
            // pipeline re-runs.
            seafloorLatPolarDeg: 60.0,
            seafloorLatTropicDeg: 23.5,
            // Blur radii for the four pre-blurred LAND equirects. Each value
            // is a unit fraction mapped to `sigmaPx = value × 375` against the
            // 4096-wide equirect (the polygon-colour bake uses 8192-wide, so
            // its sigma is scaled accordingly inside the baker). 0.08 keeps the
            // biome blur at its historical σ = 30 px; mountain/snow stay tight
            // for crisp peaks and snow lines; seafloor goes wide so the shelf
            // colours bleed across the 23.5°/60° latitude bands.
            biomeBlur: 0.08,
            mountainBlur: 0.04,
            snowBlur: 0.04,
            seafloorBlur: 0.4,
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
            depthFalloff: 250,
            abyssalColor: '#192551',
            deepColor: '#5b7cb7',
            shelfColor: '#296aa7',
            shallowColor: '#7bdbfa',
            trenchStart: 3700,
            trenchEnd: 6900,
            coastalTintColor: '#ffffff',
            coastalTintStrength: 0.20,
            coastalTintFalloff: 400,
            currentStrength: 1.0,
            currentTintEnabled: true,
            showMediumCurrents: false,
            shimmerCurrentDrift: 17,
            seaLevelOffsetM: -10,
            // Additive cool cast painted onto ocean cells where surface-current
            // speed exceeds the visibility gate (Gulf Stream, Kuroshio, ACC).
            currentTintColor: '#273f45',
            // Sun-glint specular highlight colour on water (tight, warm-white
            // sparkles on day-side wave crests).
            sunGlintColor: '#fffced',
            // Schlick Fresnel sky-reflection tint at grazing angles on the
            // day side — "ocean reflects the sky" proxy.
            skyTintColor: '#c4daf9',
        },
        clouds: {
            density: 0.1,
            coverage: 0.5,
            beer: 1.4,
            henyey: 0.4,
            advection: 40,
            // Direct sun lighting colour used inside the cloud raymarch (warm
            // white). Drives the in-scatter term that reads as lit cloud faces.
            sunColor: '#fffaf1',
            // Ambient sky colour applied to shaded cloud faces — cool blue tint
            // so clouds in shadow read as sky-lit rather than black.
            ambientColor: '#c4d3e7',
        },
        sky: {
            // Sun disk billboard.
            sunDiskColor: '#ffd9a0',
            sunGlowColor: '#ffaa55',
            // Moon disk billboard.
            moonDiskColor: '#cfd6e0',
            moonGlowColor: '#7d869a',
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
            // Night tungsten glow — same warm tone used for city lights so a lit
            // road blends into the surrounding city colour.
            nightColor: '#ffedc4',
            // Day casing (dark outline) + fill (light asphalt tint).
            dayCasingColor: '#766f69',
            dayFillColor: '#faf8f1',
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
            // Night window glow (warm tungsten) and outline (near-black).
            nightFillColor: '#ffedc4',
            nightOutlineColor: '#383027',
            // Day neutral concrete grey applied before per-fragment lerp.
            dayNeutralColor: '#dadada',
        },
        urban: {
            // Building base palette — low storey to top storey mix.
            buildingBaseLow: '#adaca6',
            buildingBaseHigh: '#cecbc4',
            // Night palette — dark unlit roofs blended toward warm window glow.
            buildingNightDark: '#4b4b55',
            buildingNightLitWarm: '#ffedc4', // multiplied by 0.55 in shader
            // Streets — day asphalt dark→light by core proximity.
            streetDayDark: '#767679',
            streetDayLight: '#99999b',
            // Streets — night unlit and lit (warm trace).
            streetNightDark: '#38383f',
            streetNightLit: '#c4b395',
        },
        airplanes: {
            // Plane head blink dot.
            headBlinkColor: '#b32516',
            // Trail ribbon.
            trailColor: '#ffffff',
            // Route scaffold (static great-circle hint).
            scaffoldColor: '#7fb3ff',
            // Airport marker.
            airportColor: '#e8eef7',
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
        // Global multiplier for the climate-class sea-level response. 1.0 =
        // paleoclimate-anchored (LGM ~−120 m at ΔT ~−6 °C, etc.). Range 0..10
        // supported by the launcher's slider; the climate handlers read it
        // each tick via `ctx.getSeaLevelMultiplier()` to scale
        // `seaLevelFromTempDelta`. Per `feedback_tweakpane_state_overrides_uniforms`,
        // if a future binding ever mirrors this value into a uniform, this
        // default must match the formula's neutral value (1.0) to avoid
        // Tweakpane clobbering the design intent on load.
        seaLevelMultiplier: 1.0,
    },
    pick: {
        lastPick: '(click on the globe)',
    },
    debug: {
        fpsCounter: false,
    },
    renderScale: 1.0,
};

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
import { Pane } from 'tweakpane';
import { DEFAULT_NUCLEAR_CONFIG, hexNumberToCss, } from '../world/scenarios/handlers/NuclearScenario.config.js';
import { DEFAULTS } from './defaults.js';
// Build initialDebugState from the centralized defaults table — see
// [./defaults.ts]. The arrays are copied so per-frame writes don't mutate
// the frozen-at-source defaults. Nuclear scenario values still come from
// `DEFAULT_NUCLEAR_CONFIG` (per-scenario tuning surface), and
// `scenarios.{wasteland*, decayExponent}` are sourced from the central
// table or scenario config respectively.
export const initialDebugState = {
    camera: { ...DEFAULTS.camera },
    scene: { ...DEFAULTS.scene },
    timeOfDay: { ...DEFAULTS.timeOfDay },
    altitude: { ...DEFAULTS.altitude },
    layers: { ...DEFAULTS.layers },
    airplanes: { ...DEFAULTS.airplanes },
    materials: {
        globe: {
            ...DEFAULTS.materials.globe,
            biomeSurfaceAmps: [...DEFAULTS.materials.globe.biomeSurfaceAmps],
            biomeSpecAmps: [...DEFAULTS.materials.globe.biomeSpecAmps],
        },
        atmosphere: { ...DEFAULTS.materials.atmosphere },
        ocean: { ...DEFAULTS.materials.ocean },
        clouds: { ...DEFAULTS.materials.clouds },
        highways: { ...DEFAULTS.materials.highways },
        cities: { ...DEFAULTS.materials.cities },
        postFx: { ...DEFAULTS.materials.postFx },
    },
    // Source nuclear defaults from the scenario config so editing
    // [../world/scenarios/handlers/NuclearScenario.config.ts] flips the live
    // initial values too — Tweakpane state otherwise silently clobbers
    // them on load (see feedback_tweakpane_state_overrides_uniforms).
    scenarios: {
        nuclear: {
            radiusKm: DEFAULT_NUCLEAR_CONFIG.wasteland.radiusKm,
            stretchKm: DEFAULT_NUCLEAR_CONFIG.wasteland.stretchKm,
            durationDays: DEFAULT_NUCLEAR_CONFIG.wasteland.durationDays,
        },
        decayExponent: DEFAULT_NUCLEAR_CONFIG.decayExponent,
        wastelandColor: DEFAULTS.scenarios.wastelandColor,
        wastelandDesaturate: DEFAULTS.scenarios.wastelandDesaturate,
        wastelandStrength: DEFAULTS.scenarios.wastelandStrength,
    },
    nuclear: {
        worldScale: DEFAULT_NUCLEAR_CONFIG.live.worldScale,
        timeScale: DEFAULT_NUCLEAR_CONFIG.live.timeScale,
        spriteScale: DEFAULT_NUCLEAR_CONFIG.live.spriteScale,
        windStrength: DEFAULT_NUCLEAR_CONFIG.live.windStrength,
        windDelay: DEFAULT_NUCLEAR_CONFIG.live.windDelay,
        windRamp: DEFAULT_NUCLEAR_CONFIG.live.windRamp,
        windJitter: DEFAULT_NUCLEAR_CONFIG.live.windJitter,
        windDrag: DEFAULT_NUCLEAR_CONFIG.live.windDrag,
        enableFire: DEFAULT_NUCLEAR_CONFIG.detonate.enables.fire ?? true,
        enableSmoke: DEFAULT_NUCLEAR_CONFIG.detonate.enables.smoke ?? true,
        enableMushroom: DEFAULT_NUCLEAR_CONFIG.detonate.enables.mushroom ?? true,
        enableMushroomFire: DEFAULT_NUCLEAR_CONFIG.detonate.enables.mushroomFire ?? true,
        enableColumnFire: DEFAULT_NUCLEAR_CONFIG.detonate.enables.columnFire ?? true,
        enableColumnSmoke: DEFAULT_NUCLEAR_CONFIG.detonate.enables.columnSmoke ?? true,
        enableDebris: DEFAULT_NUCLEAR_CONFIG.detonate.enables.debris ?? true,
        mushroomHeightScale: DEFAULT_NUCLEAR_CONFIG.detonate.mushroomHeightScale,
        columnHeightScale: DEFAULT_NUCLEAR_CONFIG.detonate.columnHeightScale,
        fireColorStart: hexNumberToCss(DEFAULT_NUCLEAR_CONFIG.detonate.fireColorStart),
        fireColorEnd: hexNumberToCss(DEFAULT_NUCLEAR_CONFIG.detonate.fireColorEnd),
        smokeColorStart: hexNumberToCss(DEFAULT_NUCLEAR_CONFIG.detonate.smokeColorStart),
        smokeColorEnd: hexNumberToCss(DEFAULT_NUCLEAR_CONFIG.detonate.smokeColorEnd),
    },
    pick: { ...DEFAULTS.pick },
    debug: { ...DEFAULTS.debug },
    renderScale: DEFAULTS.renderScale,
};
export function createDebugPanel(state = initialDebugState) {
    // The pane lives inside #tweakpane-host so the page can collapse/expand it
    // off-screen without unmounting Tweakpane. Falls back to body when the host
    // is missing (tests, alternate hosts).
    const host = document.getElementById('tweakpane-host');
    const pane = host
        ? new Pane({ title: 'earth-destroyer', expanded: true, container: host })
        : new Pane({ title: 'earth-destroyer', expanded: true });
    const cameraFolder = pane.addFolder({ title: 'Camera' });
    cameraFolder.addBinding(state.camera, 'autoOrbit');
    cameraFolder.addBinding(state.camera, 'orbitSpeed', { min: 0, max: 0.5, step: 0.001 });
    const sceneFolder = pane.addFolder({ title: 'Scene' });
    sceneFolder.addBinding(state.scene, 'background');
    sceneFolder.addBinding(state.scene, 'showGrid', { disabled: true, label: 'showGrid (n/a)' });
    sceneFolder.addBinding(state.debug, 'fpsCounter', { label: 'FPS counter' });
    const altitudeFolder = pane.addFolder({ title: 'Altitude', expanded: false });
    altitudeFolder.addBinding(state.altitude, 'scaleFactor', {
        min: 1, max: 10, step: 0.1, label: 'scale (×)',
    });
    // Time of day: the floating bottom-center slider drives `t01` and the
    // pause button toggles `paused`. Tweakpane mirrors the pause toggle so
    // it can also be flipped from here.
    const todFolder = pane.addFolder({ title: 'Time of day' });
    todFolder.addBinding(state.timeOfDay, 'paused', { label: 'pause' });
    // Clouds toggle still lives on the floating bottom toggle bar
    // (#layer-toggles in index.html). Ocean / atmosphere / highways /
    // planes have been merged into their respective Materials sub-folders
    // (header toggle + reset button + disabled-on-off settings). Airports
    // + routes remain here as the fine-grained airline-overlay knobs;
    // globe stays here; postFx is n/a.
    const layersFolder = pane.addFolder({ title: 'Layers' });
    layersFolder.addBinding(state.layers, 'globe');
    layersFolder.addBinding(state.layers, 'postFx', { disabled: true, label: 'postFx (n/a)' });
    // Airplanes folder: layer toggle (combined master for planes + trails)
    // and a reset chip stay at the top — the speed/density/opacity bindings
    // below are greyed out when the toggle is off.
    const planesFolder = pane.addFolder({ title: 'Airplanes' });
    const planesControls = [];
    const updatePlanesDisabled = () => {
        const off = !state.layers.planes;
        for (const c of planesControls)
            c.disabled = off;
    };
    planesFolder.addBinding(state.layers, 'planes', { label: 'enabled' }).on('change', (ev) => {
        state.layers.trails = ev.value;
        updatePlanesDisabled();
    });
    planesFolder.addButton({ title: 'Reset' }).on('click', () => {
        state.layers.planes = DEFAULTS.layers.planes;
        state.layers.trails = DEFAULTS.layers.trails;
        Object.assign(state.airplanes, DEFAULTS.airplanes);
        pane.refresh();
        updatePlanesDisabled();
    });
    planesControls.push(planesFolder.addBinding(state.airplanes, 'speed', {
        min: 0,
        max: 10,
        step: 0.05,
        label: 'speed (h/sec)',
    }), planesFolder.addBinding(state.airplanes, 'targetInFlight', {
        min: 0,
        max: 4000,
        step: 50,
        label: 'in-flight target',
    }), planesFolder.addBinding(state.airplanes, 'scaffoldOpacity', {
        min: 0,
        max: 0.5,
        step: 0.005,
        label: 'route alpha',
    }), planesFolder.addBinding(state.airplanes, 'trailOpacity', {
        min: 0,
        max: 0.3,
        step: 0.001,
        label: 'trail alpha',
    }));
    updatePlanesDisabled();
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
        const proxy = { v: state.materials.globe.biomeSurfaceAmps[i] };
        ampsFolder
            .addBinding(proxy, 'v', { min: 0, max: 2, step: 0.01, label: BIOME_LABELS[i] })
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
        const proxy = { v: state.materials.globe.biomeSpecAmps[i] };
        specAmpsFolder
            .addBinding(proxy, 'v', { min: 0, max: 1, step: 0.01, label: BIOME_LABELS[i] })
            .on('change', (ev) => {
            state.materials.globe.biomeSpecAmps[i] = ev.value;
        });
    }
    // Moonlight on the night side. `moonIntensity` 0 disables; 0.15 is the
    // design default. Drives both the land lambert glow and the water
    // "path of moonlight" specular at the antipodal-moon point.
    gLighting.addBinding(state.materials.globe, 'moonColor', { label: 'moon color' });
    gLighting.addBinding(state.materials.globe, 'moonIntensity', {
        min: 0,
        max: 1,
        step: 0.01,
        label: 'moon intensity',
    });
    // Atmosphere — Hillaire 2020 LUTs. `rayleighScale`/`mieScale` are
    // multipliers on the physical β coefficients; 1.0 = real Earth.
    // Header row = layer toggle + reset chip; the rest of the folder is
    // greyed out when the toggle is off.
    const atmMat = mat.addFolder({ title: 'Atmosphere', expanded: false });
    const atmControls = [];
    const updateAtmDisabled = () => {
        const off = !state.layers.atmosphere;
        for (const c of atmControls)
            c.disabled = off;
    };
    atmMat.addBinding(state.layers, 'atmosphere', { label: 'enabled' }).on('change', () => {
        updateAtmDisabled();
    });
    atmMat.addButton({ title: 'Reset' }).on('click', () => {
        state.layers.atmosphere = DEFAULTS.layers.atmosphere;
        const d = DEFAULTS.materials.atmosphere;
        Object.assign(state.materials.atmosphere, d, {
            solarIrradiance: { ...d.solarIrradiance },
        });
        pane.refresh();
        updateAtmDisabled();
    });
    // Sky-physics presets. Selecting one batch-writes rayleigh/mie scales +
    // top-of-atmosphere solar irradiance, then refreshes the UI so the
    // dependent sliders show the new values. Subsequent slider drags move
    // each value independently (the dropdown label does not auto-revert to
    // "Custom" — by design, so the user can keep nudging from a named base).
    const ATMOSPHERE_PRESET_VALUES = {
        earth: { rayleighScale: 1.2, mieScale: 0.4, solarIrradiance: { r: 1.474, g: 1.8504, b: 1.91198 } },
        mars: { rayleighScale: 0.6, mieScale: 1.5, solarIrradiance: { r: 2.1, g: 1.7, b: 1.4 } },
        alien: { rayleighScale: 1.4, mieScale: 0.4, solarIrradiance: { r: 1.2, g: 2.1, b: 1.3 } },
        vapor: { rayleighScale: 1.6, mieScale: 1.0, solarIrradiance: { r: 1.9, g: 1.4, b: 2.1 } },
        punchy: { rayleighScale: 1.7, mieScale: 0.2, solarIrradiance: { r: 1.474, g: 1.8504, b: 1.91198 } },
        dust: { rayleighScale: 1.2, mieScale: 2.5, solarIrradiance: { r: 1.474, g: 1.8504, b: 1.91198 } },
        pearl: { rayleighScale: 0.7, mieScale: 0.4, solarIrradiance: { r: 1.6, g: 1.7, b: 1.9 } },
    };
    const atmPresetBinding = atmMat
        .addBinding(state.materials.atmosphere, 'preset', {
        label: 'preset',
        options: {
            'Earth (default)': 'earth',
            'Mars-tan': 'mars',
            'Alien green': 'alien',
            'Vaporwave': 'vapor',
            'Punchy Earth': 'punchy',
            'Dust-storm': 'dust',
            'Pearl-moon': 'pearl',
        },
    })
        .on('change', (ev) => {
        const p = ATMOSPHERE_PRESET_VALUES[ev.value];
        if (!p)
            return;
        const a = state.materials.atmosphere;
        a.rayleighScale = p.rayleighScale;
        a.mieScale = p.mieScale;
        a.solarIrradiance.r = p.solarIrradiance.r;
        a.solarIrradiance.g = p.solarIrradiance.g;
        a.solarIrradiance.b = p.solarIrradiance.b;
        pane.refresh();
    });
    atmControls.push(atmPresetBinding);
    atmControls.push(atmMat.addBinding(state.materials.atmosphere, 'rayleighScale', { min: 0, max: 2, step: 0.05 }));
    atmControls.push(atmMat.addBinding(state.materials.atmosphere, 'mieScale', { min: 0, max: 3, step: 0.05 }));
    atmControls.push(atmMat.addBinding(state.materials.atmosphere, 'sunDiskSize', {
        min: 0.001,
        max: 0.25,
        step: 0.005,
    }));
    atmControls.push(atmMat.addBinding(state.materials.atmosphere, 'exposure', { min: 0.1, max: 14, step: 0.05 }));
    // Aerial perspective — tints land/water toward the sky-view LUT colour
    // by a slant-column air-thickness factor. 0 = no haze; 1 = strong blue
    // rim with disc-centre still readable.
    atmControls.push(atmMat.addBinding(state.materials.atmosphere, 'hazeAmount', {
        min: 0,
        max: 1.5,
        step: 0.01,
        label: 'haze',
    }));
    // Haze layer height in metres. Terrain above this exponentially loses
    // haze so mountain peaks at the limb keep their shading detail. Low =
    // even hills punch through; high = behaviour reverts toward uniform haze.
    atmControls.push(atmMat.addBinding(state.materials.atmosphere, 'hazeFalloffM', {
        min: 500,
        max: 100000,
        step: 100,
        label: 'haze layer (m)',
    }));
    updateAtmDisabled();
    // Ocean — Gerstner waves + layered depth gradient + coastal tint +
    // current-speed tint + shimmer-noise warp by current direction.
    // Header row = layer toggle + reset chip; sub-folders below are
    // greyed out when the toggle is off.
    const oceanMat = mat.addFolder({ title: 'Ocean', expanded: false });
    const oceanSubFolders = [];
    const updateOceanDisabled = () => {
        const off = !state.layers.ocean;
        for (const f of oceanSubFolders)
            f.disabled = off;
    };
    oceanMat.addBinding(state.layers, 'ocean', { label: 'enabled' }).on('change', () => {
        updateOceanDisabled();
    });
    oceanMat.addButton({ title: 'Reset' }).on('click', () => {
        state.layers.ocean = DEFAULTS.layers.ocean;
        Object.assign(state.materials.ocean, DEFAULTS.materials.ocean);
        pane.refresh();
        updateOceanDisabled();
    });
    const oWaves = oceanMat.addFolder({ title: 'Waves', expanded: false });
    oceanSubFolders.push(oWaves);
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
    oceanSubFolders.push(oDepth);
    oDepth.addBinding(state.materials.ocean, 'depthFalloff', {
        // Range widened to 500 so the user can dial up the shallow-tint
        // falloff when raising sea level — freshly-flooded interior reads
        // as a real shallow→deep gradient instead of pure abyssal.
        min: 0, max: 500, step: 1, label: 'depth falloff',
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
    // Sea-level offset has its own floating vertical slider next to
    // #season-control (see index.html #sealevel-control). Tweakpane binding
    // removed so the two surfaces can't race against each other.
    const oCoast = oceanMat.addFolder({ title: 'Coastal tint', expanded: false });
    oceanSubFolders.push(oCoast);
    oCoast.addBinding(state.materials.ocean, 'coastalTintColor', { label: 'color' });
    oCoast.addBinding(state.materials.ocean, 'coastalTintStrength', {
        min: 0, max: 1, step: 0.01, label: 'strength',
    });
    oCoast.addBinding(state.materials.ocean, 'coastalTintFalloff', {
        min: 0, max: 1500, step: 10, label: 'falloff (m)',
    });
    const oCurrents = oceanMat.addFolder({ title: 'Currents', expanded: false });
    oceanSubFolders.push(oCurrents);
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
    updateOceanDisabled();
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
    // Header row = layer toggle + reset chip; sub-folders below are
    // greyed out when the toggle is off.
    const highwaysMat = mat.addFolder({ title: 'Highways', expanded: false });
    const highwaysSubFolders = [];
    const updateHighwaysDisabled = () => {
        const off = !state.layers.highways;
        for (const f of highwaysSubFolders)
            f.disabled = off;
    };
    highwaysMat.addBinding(state.layers, 'highways', { label: 'enabled' }).on('change', () => {
        updateHighwaysDisabled();
    });
    highwaysMat.addButton({ title: 'Reset' }).on('click', () => {
        state.layers.highways = DEFAULTS.layers.highways;
        Object.assign(state.materials.highways, DEFAULTS.materials.highways);
        pane.refresh();
        updateHighwaysDisabled();
    });
    const hwWidths = highwaysMat.addFolder({ title: 'Road widths (px)', expanded: false });
    highwaysSubFolders.push(hwWidths);
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
    highwaysSubFolders.push(hwDay);
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
    highwaysSubFolders.push(hwNight);
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
    highwaysSubFolders.push(hwFade);
    hwFade.addBinding(state.materials.highways, 'opacityNear', {
        min: 0, max: 1, step: 0.01, label: 'alpha zoomed in',
    });
    hwFade.addBinding(state.materials.highways, 'opacityFar', {
        min: 0, max: 1, step: 0.01, label: 'alpha zoomed out',
    });
    updateHighwaysDisabled();
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
    nSize.addBinding(state.nuclear, 'windDrag', {
        min: 0, max: 5, step: 0.05, label: 'wind drag',
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
    // Scenario-system bindings. The Nuclear sub-folder drives the wasteland
    // ellipse shape + duration for new strikes (live changes only affect the
    // NEXT detonation; in-flight scenarios keep their captured payload).
    // Wasteland uniforms are pushed every frame from scene-graph.applyMaterials.
    const scnFolder = pane.addFolder({ title: 'Scenarios', expanded: false });
    const scnNuke = scnFolder.addFolder({ title: 'Nuclear', expanded: true });
    scnNuke.addBinding(state.scenarios.nuclear, 'radiusKm', {
        min: 50, max: 2000, step: 10, label: 'radius (km)',
    });
    scnNuke.addBinding(state.scenarios.nuclear, 'stretchKm', {
        min: 0, max: 3000, step: 10, label: 'stretch (km)',
    });
    scnNuke.addBinding(state.scenarios.nuclear, 'durationDays', {
        min: 2, max: 120, step: 1, label: 'duration (days)',
    });
    scnFolder.addBinding(state.scenarios, 'decayExponent', {
        min: 0.5, max: 6, step: 0.05, label: 'decay exponent',
    });
    const scnLook = scnFolder.addFolder({ title: 'Wasteland look', expanded: false });
    scnLook.addBinding(state.scenarios, 'wastelandColor', { label: 'color' });
    scnLook.addBinding(state.scenarios, 'wastelandDesaturate', {
        min: 0, max: 1, step: 0.01, label: 'desaturate',
    });
    scnLook.addBinding(state.scenarios, 'wastelandStrength', {
        min: 0, max: 1, step: 0.01, label: 'strength',
    });
    const pickFolder = pane.addFolder({ title: 'Pick', expanded: true });
    pickFolder.addBinding(state.pick, 'lastPick', { readonly: true, multiline: true, rows: 8 });
    return {
        pane,
        state,
        dispose: () => pane.dispose(),
    };
}

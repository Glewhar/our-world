/**
 * Tweakpane orchestrator.
 *
 * Layout:
 *   Camera | Airplanes | Materials/{Globe, Atmosphere, Ocean, Clouds,
 *   Highways, Cities} | Nuclear | Scenarios | Pick
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
// the defaults table. Per-scenario tuning (e.g. `DEFAULT_NUCLEAR_CONFIG`)
// owns its own surface — handlers read from those configs directly, and
// `scenarios.{wasteland*, decayExponent}` are sourced from the central
// table or the relevant scenario config.
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
            // Clone the palette array — Tweakpane mutates entries in place via
            // the per-slot color picker, and DEFAULTS is frozen-at-source.
            biomePalette: [...DEFAULTS.materials.globe.biomePalette],
            // Same story for realm tints — clone each entry so per-slider
            // writes don't bleed into the frozen defaults table.
            realmTint: DEFAULTS.materials.globe.realmTint.map((t) => ({ ...t })),
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
        ? new Pane({ title: 'earth-destroyer', expanded: false, container: host })
        : new Pane({ title: 'earth-destroyer', expanded: false });
    const cameraFolder = pane.addFolder({ title: 'Camera' });
    cameraFolder.addBinding(state.camera, 'autoOrbit');
    cameraFolder.addBinding(state.camera, 'orbitSpeed', { min: 0, max: 0.5, step: 0.001 });
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
    // Header row = layer toggle + reset chip; sub-folders below are
    // greyed out when the toggle is off.
    const globeMat = mat.addFolder({ title: 'Globe', expanded: false });
    const globeSubFolders = [];
    const updateGlobeDisabled = () => {
        const off = !state.layers.globe;
        for (const f of globeSubFolders)
            f.disabled = off;
    };
    globeMat.addBinding(state.layers, 'globe', { label: 'enabled' }).on('change', () => {
        updateGlobeDisabled();
    });
    globeMat.addButton({ title: 'Reset' }).on('click', () => {
        state.layers.globe = DEFAULTS.layers.globe;
        const d = DEFAULTS.materials.globe;
        Object.assign(state.materials.globe, d, {
            biomePalette: [...d.biomePalette],
        });
        pane.refresh();
        updateGlobeDisabled();
    });
    // Biome palette — one color picker per WWF TEOW slot. Index 0 is the
    // no-data fallback (cells outside every polygon); 1..14 are TEOW
    // biome codes. Labels mirror `wwf_biomes.py` so the UI maps onto the
    // pipeline taxonomy.
    const biomeLabels = [
        '0 fallback',
        '1 trop moist',
        '2 trop dry',
        '3 trop conifer',
        '4 temp broadleaf',
        '5 temp conifer',
        '6 boreal/taiga',
        '7 trop savanna',
        '8 temp grass',
        '9 flooded grass',
        '10 montane grass',
        '11 tundra',
        '12 mediterranean',
        '13 desert/xeric',
        '14 mangroves',
        '15 ice/glacier',
    ];
    const biomeFolder = globeMat.addFolder({ title: 'Biome palette', expanded: false });
    globeSubFolders.push(biomeFolder);
    // Edge softening — drives the separable gaussian blur baked into the
    // biome-colour equirect. 0 reproduces the old hard palette boundaries.
    biomeFolder.addBinding(state.materials.globe, 'biomeBlurDeg', {
        min: 0,
        max: 5,
        step: 0.05,
        label: 'edge blur (°)',
    });
    // Tweakpane wants object-keyed bindings; arrays can't be bound by
    // numeric index in strict TS. Wrap each slot in a getter/setter proxy
    // so the color picker reads/writes the underlying palette array.
    for (let i = 0; i < state.materials.globe.biomePalette.length; i++) {
        const idx = i;
        const proxy = {
            get color() {
                return state.materials.globe.biomePalette[idx] ?? '#000000';
            },
            set color(v) {
                state.materials.globe.biomePalette[idx] = v;
            },
        };
        biomeFolder.addBinding(proxy, 'color', {
            label: biomeLabels[idx] ?? `${idx}`,
            view: 'color',
        });
    }
    // Realm tint — 8 entries, one per WWF realm. Each entry shifts hue,
    // saturation, and value of every ecoregion in that realm. Defaults
    // are neutral so the legacy 14-biome look ships out of the box.
    // Indices match `ecoregion_lookup.py:REALM_CODE`.
    const realmLabels = [
        '0 (sentinel)',
        '1 Australasia',
        '2 Antarctic',
        '3 Afrotropic',
        '4 Indomalay',
        '5 Nearctic',
        '6 Neotropic',
        '7 Oceania',
        '8 Palearctic',
    ];
    const realmFolder = globeMat.addFolder({ title: 'Realm tint', expanded: false });
    globeSubFolders.push(realmFolder);
    // Per-ecoregion variety knob lives at the top of the folder so the
    // user can dial overall jitter independently of the per-realm sliders.
    realmFolder.addBinding(state.materials.globe, 'ecoregionJitter', {
        min: 0,
        max: 2,
        step: 0.01,
        label: 'ecoregion variety',
    });
    for (let r = 1; r < state.materials.globe.realmTint.length; r++) {
        const idx = r;
        const sub = realmFolder.addFolder({
            title: realmLabels[r] ?? `realm ${r}`,
            expanded: false,
        });
        sub.addBinding(state.materials.globe.realmTint[idx], 'dHue', {
            min: -30, max: 30, step: 0.5, label: 'hue Δ°',
        });
        sub.addBinding(state.materials.globe.realmTint[idx], 'satMult', {
            min: 0.6, max: 1.4, step: 0.01, label: 'sat ×',
        });
        sub.addBinding(state.materials.globe.realmTint[idx], 'valMult', {
            min: 0.6, max: 1.4, step: 0.01, label: 'val ×',
        });
    }
    // Land specular — wide-cone Blinn-Phong highlight that tracks the camera.
    const gLighting = globeMat.addFolder({ title: 'Lighting', expanded: false });
    globeSubFolders.push(gLighting);
    gLighting.addBinding(state.materials.globe, 'specularStrength', {
        min: 0, max: 3, step: 0.01, label: 'specular',
    });
    gLighting.addBinding(state.materials.globe, 'landSpecularSmoothness', {
        min: 0, max: 1, step: 0.01, label: 'land smoothness',
    });
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
    updateGlobeDisabled();
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
    // Sea-level offset has its own floating vertical slider (#sealevel-control
    // in index.html). Tweakpane binding removed so the two surfaces can't
    // race against each other.
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
    // Header row = layer toggle + reset chip; settings below are
    // greyed out when the toggle is off.
    const cloudsMat = mat.addFolder({ title: 'Clouds', expanded: false });
    const cloudsControls = [];
    const updateCloudsDisabled = () => {
        const off = !state.layers.clouds;
        for (const c of cloudsControls)
            c.disabled = off;
    };
    cloudsMat.addBinding(state.layers, 'clouds', { label: 'enabled' }).on('change', () => {
        updateCloudsDisabled();
    });
    cloudsMat.addButton({ title: 'Reset' }).on('click', () => {
        state.layers.clouds = DEFAULTS.layers.clouds;
        Object.assign(state.materials.clouds, DEFAULTS.materials.clouds);
        pane.refresh();
        updateCloudsDisabled();
    });
    cloudsControls.push(cloudsMat.addBinding(state.materials.clouds, 'density', { min: 0, max: 2, step: 0.01 }), cloudsMat.addBinding(state.materials.clouds, 'coverage', { min: 0, max: 1, step: 0.01 }), cloudsMat.addBinding(state.materials.clouds, 'beer', { min: 0, max: 4, step: 0.05 }), cloudsMat.addBinding(state.materials.clouds, 'henyey', { min: -0.95, max: 0.95, step: 0.01 }), cloudsMat.addBinding(state.materials.clouds, 'advection', { min: 0, max: 100, step: 0.5 }));
    updateCloudsDisabled();
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
    const citiesMat = mat.addFolder({ title: 'Cities', expanded: false });
    const cBricks = citiesMat.addFolder({ title: 'Brick pattern', expanded: false });
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
    // Nuclear explosion knobs. "Calibration (baseline)" + "Wind dynamics"
    // live-apply every frame; the other groups only take effect on the next
    // detonation because they alter the configs the particle list is built
    // from. The launcher's Blast radius slider scales the visual relative
    // to `visuals.referenceRadiusKm` (config-only constant), so the
    // baseline-size slider here is what an artist tunes the calibrated
    // 450 km strike against — the per-strike multiplier composes with it.
    const nukeFolder = pane.addFolder({ title: 'Nuclear', expanded: false });
    const nCalib = nukeFolder.addFolder({ title: 'Calibration (baseline)', expanded: false });
    nCalib.addBinding(state.nuclear, 'worldScale', {
        min: 0.001, max: 0.010, step: 0.0001, label: 'baseline size',
    });
    nCalib.addBinding(state.nuclear, 'timeScale', {
        min: 0.1, max: 3, step: 0.05, label: 'time speed',
    });
    nCalib.addBinding(state.nuclear, 'spriteScale', {
        min: 0.25, max: 12, step: 0.05, label: 'sprite size',
    });
    const nWind = nukeFolder.addFolder({ title: 'Wind dynamics', expanded: false });
    nWind.addBinding(state.nuclear, 'windStrength', {
        min: 0, max: 4, step: 0.01, label: 'wind strength',
    });
    nWind.addBinding(state.nuclear, 'windDelay', {
        min: 0, max: 10, step: 0.1, label: 'wind delay (s)',
    });
    nWind.addBinding(state.nuclear, 'windRamp', {
        min: 0, max: 10, step: 0.1, label: 'wind ramp (s)',
    });
    nWind.addBinding(state.nuclear, 'windJitter', {
        min: 0, max: 1, step: 0.01, label: 'wind jitter',
    });
    nWind.addBinding(state.nuclear, 'windDrag', {
        min: 0, max: 5, step: 0.05, label: 'wind drag',
    });
    const nSubs = nukeFolder.addFolder({ title: 'Sub-effects (redetonate)', expanded: false });
    nSubs.addBinding(state.nuclear, 'enableFire', { label: 'fire' });
    nSubs.addBinding(state.nuclear, 'enableSmoke', { label: 'smoke' });
    nSubs.addBinding(state.nuclear, 'enableMushroom', { label: 'mushroom cap' });
    nSubs.addBinding(state.nuclear, 'enableMushroomFire', { label: 'cap fire' });
    nSubs.addBinding(state.nuclear, 'enableColumnFire', { label: 'column fire' });
    nSubs.addBinding(state.nuclear, 'enableColumnSmoke', { label: 'column smoke' });
    // Debris particle template was removed for perf — no toggle here.
    const nShape = nukeFolder.addFolder({ title: 'Shape proportions (redetonate)', expanded: false });
    nShape.addBinding(state.nuclear, 'mushroomHeightScale', {
        min: 0.25, max: 3, step: 0.05, label: 'mushroom height ×',
    });
    nShape.addBinding(state.nuclear, 'columnHeightScale', {
        min: 0.25, max: 3, step: 0.05, label: 'column height ×',
    });
    const nCols = nukeFolder.addFolder({ title: 'Colours (redetonate)', expanded: false });
    nCols.addBinding(state.nuclear, 'fireColorStart', { label: 'fire start' });
    nCols.addBinding(state.nuclear, 'fireColorEnd', { label: 'fire end' });
    nCols.addBinding(state.nuclear, 'smokeColorStart', { label: 'smoke start' });
    nCols.addBinding(state.nuclear, 'smokeColorEnd', { label: 'smoke end' });
    // Reset — restores baseline + wind + sub-effects + shape + colours from
    // DEFAULT_NUCLEAR_CONFIG. Does NOT touch the launcher's per-strike
    // sliders (Blast radius / Fallout stretch / Fallout duration) — those
    // are user-facing scenario inputs, not artist calibration knobs.
    nukeFolder.addButton({ title: 'Reset' }).on('click', () => {
        const live = DEFAULT_NUCLEAR_CONFIG.live;
        const det = DEFAULT_NUCLEAR_CONFIG.detonate;
        state.nuclear.worldScale = live.worldScale;
        state.nuclear.timeScale = live.timeScale;
        state.nuclear.spriteScale = live.spriteScale;
        state.nuclear.windStrength = live.windStrength;
        state.nuclear.windDelay = live.windDelay;
        state.nuclear.windRamp = live.windRamp;
        state.nuclear.windJitter = live.windJitter;
        state.nuclear.windDrag = live.windDrag;
        state.nuclear.enableFire = det.enables.fire ?? true;
        state.nuclear.enableSmoke = det.enables.smoke ?? true;
        state.nuclear.enableMushroom = det.enables.mushroom ?? true;
        state.nuclear.enableMushroomFire = det.enables.mushroomFire ?? true;
        state.nuclear.enableColumnFire = det.enables.columnFire ?? true;
        state.nuclear.enableColumnSmoke = det.enables.columnSmoke ?? true;
        state.nuclear.mushroomHeightScale = det.mushroomHeightScale;
        state.nuclear.columnHeightScale = det.columnHeightScale;
        state.nuclear.fireColorStart = hexNumberToCss(det.fireColorStart);
        state.nuclear.fireColorEnd = hexNumberToCss(det.fireColorEnd);
        state.nuclear.smokeColorStart = hexNumberToCss(det.smokeColorStart);
        state.nuclear.smokeColorEnd = hexNumberToCss(det.smokeColorEnd);
        pane.refresh();
    });
    // Scenario-system bindings. Per-scenario shape/duration knobs moved to
    // the floating Scenarios launcher (#scenarios-launcher); the folder here
    // keeps the global decay-exponent slider + wasteland look palette.
    // Wasteland uniforms are pushed every frame from scene-graph.applyMaterials.
    const scnFolder = pane.addFolder({ title: 'Scenarios', expanded: false });
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
    const pickFolder = pane.addFolder({ title: 'Pick', expanded: false });
    pickFolder.addBinding(state.pick, 'lastPick', { readonly: true, multiline: true, rows: 8 });
    return {
        pane,
        state,
        dispose: () => pane.dispose(),
    };
}

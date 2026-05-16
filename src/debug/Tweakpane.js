/**
 * Tweakpane orchestrator.
 *
 * Layout (top-level, every visual layer is its own folder — no parent
 * "Materials" grouping):
 *   World | Globe | Atmosphere | Sky | Ocean | Clouds | Highways |
 *   Cities | Urban | Airplanes | Scenarios (→ Nuclear) | Pick
 *
 * Every layer-folder follows the same skeleton: enable-toggle + Reset
 * button at the top, then sub-folders for grouped knobs.
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
    // `scene.sunLightColor` is a hex number in DEFAULTS (THREE.DirectionalLight
    // accepts numeric); the UI binding expects a CSS hex string, so convert.
    scene: {
        background: DEFAULTS.scene.background,
        showGrid: DEFAULTS.scene.showGrid,
        sunLightColor: `#${DEFAULTS.scene.sunLightColor.toString(16).padStart(6, '0')}`,
    },
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
            // Seafloor palette object: shallow-clone so the three colour
            // pickers in the Seafloor (shelf) folder write to a per-state
            // copy instead of mutating DEFAULTS.
            seafloorPalette: { ...DEFAULTS.materials.globe.seafloorPalette },
        },
        atmosphere: { ...DEFAULTS.materials.atmosphere },
        ocean: { ...DEFAULTS.materials.ocean },
        clouds: { ...DEFAULTS.materials.clouds },
        sky: { ...DEFAULTS.materials.sky },
        highways: { ...DEFAULTS.materials.highways },
        cities: { ...DEFAULTS.materials.cities },
        urban: { ...DEFAULTS.materials.urban },
        airplanes: { ...DEFAULTS.materials.airplanes },
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
        seaLevelMultiplier: DEFAULTS.scenarios.seaLevelMultiplier,
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
        ? new Pane({ title: 'Advanced', expanded: false, container: host })
        : new Pane({ title: 'Advanced', expanded: false });
    // World — global camera + scene-wide lighting + sky background. Lives at
    // the top so the most-used knobs (orbit + sun colour) are one tab open.
    const worldFolder = pane.addFolder({ title: 'World', expanded: false });
    worldFolder.addBinding(state.camera, 'orbitSpeed', {
        min: 0, max: 0.5, step: 0.001, label: 'orbit speed',
    });
    // Directional sun light tint. Drives every shader's day term. Keep the
    // product `colour × intensity ≤ 1.0` per channel — anything brighter
    // overdrives snow past the white point and warms it.
    worldFolder.addBinding(state.scene, 'sunLightColor', { label: 'sun light' });
    // Airplanes folder: layer toggle (combined master for planes + trails)
    // and a reset chip stay at the top — the speed/density/opacity bindings
    // below are greyed out when the toggle is off.
    const planesFolder = pane.addFolder({ title: 'Airplanes', expanded: false });
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
        Object.assign(state.materials.airplanes, DEFAULTS.materials.airplanes);
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
    // Colours — push live into each airplane layer's `uColor` (or
    // `uColorBlink`) uniform via `setColor` in scene-graph.applyMaterials.
    const planesColors = planesFolder.addFolder({ title: 'Colours', expanded: false });
    planesControls.push(planesColors);
    planesColors.addBinding(state.materials.airplanes, 'headBlinkColor', { label: 'head dot' });
    planesColors.addBinding(state.materials.airplanes, 'trailColor', { label: 'trail' });
    planesColors.addBinding(state.materials.airplanes, 'scaffoldColor', { label: 'route line' });
    planesColors.addBinding(state.materials.airplanes, 'airportColor', { label: 'airport marker' });
    updatePlanesDisabled();
    // Header row = layer toggle + reset chip; sub-folders below are
    // greyed out when the toggle is off.
    const globeMat = pane.addFolder({ title: 'Globe', expanded: false });
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
        // Clone arrays + nested objects so subsequent Tweakpane writes
        // don't bleed into the frozen DEFAULTS table.
        Object.assign(state.materials.globe, d, {
            biomePalette: [...d.biomePalette],
            seafloorPalette: { ...d.seafloorPalette },
        });
        pane.refresh();
        updateGlobeDisabled();
    });
    // Biome palette — one color picker per WWF TEOW slot. Index 0 is the
    // no-data fallback (cells outside every polygon); 1..14 are TEOW
    // biome codes; 15 is the synthetic ice/glacier (override-only);
    // 16..18 are the synthetic latitude-banded shelf biomes (placeholder
    // colours — the live shelf tint comes from the seafloor folder
    // below); 19 is wasteland (placeholder — uniform-driven). Labels
    // mirror `wwf_biomes.py` so the UI maps onto the pipeline taxonomy.
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
        '16 polar shelf',
        '17 temperate shelf',
        '18 equatorial shelf',
        '19 wasteland',
    ];
    const biomeFolder = globeMat.addFolder({ title: 'Biome palette', expanded: false });
    globeSubFolders.push(biomeFolder);
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
    // saturation, and value of every polygon in that realm. Defaults are
    // neutral so the unmodified palette ships out of the box.
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
    // Seafloor (shelf) — palette + latitude cutoffs for the three
    // synthetic shelf biomes (16 polar / 17 temperate / 18 equatorial)
    // baked into every TEOW-uncovered cell. The colour pickers drive the
    // LAND fragment's seafloor branch live; the lat sliders only affect
    // the next bake (tagged "(rebake required)" below).
    const seafloorFolder = globeMat.addFolder({ title: 'Seafloor (shelf)', expanded: false });
    globeSubFolders.push(seafloorFolder);
    seafloorFolder.addBinding(state.materials.globe.seafloorPalette, 'polar', {
        label: '16 polar',
        view: 'color',
    });
    seafloorFolder.addBinding(state.materials.globe.seafloorPalette, 'temperate', {
        label: '17 temperate',
        view: 'color',
    });
    seafloorFolder.addBinding(state.materials.globe.seafloorPalette, 'equatorial', {
        label: '18 equatorial',
        view: 'color',
    });
    seafloorFolder.addBinding(state.materials.globe, 'seafloorLatPolarDeg', {
        min: 30, max: 85, step: 0.5, label: 'polar |lat| ≥ (rebake)',
    });
    seafloorFolder.addBinding(state.materials.globe, 'seafloorLatTropicDeg', {
        min: 0, max: 45, step: 0.5, label: 'tropic |lat| ≥ (rebake)',
    });
    // Edge softening — per-input Gaussian σ for the four pre-blurred LAND
    // equirects. 0 turns the blur off (crisp HEALPix cells reappear);
    // cranking high softens the corresponding tint band so far it dissolves
    // continent-wide. Opened by default so it's reachable at a glance — the
    // single knob the user hunts for most often when the world reads "too
    // pixelated" or "too smudged".
    const gBlur = globeMat.addFolder({ title: 'Edge softening', expanded: false });
    globeSubFolders.push(gBlur);
    // biomeBlur drives the polygon-colour bake — softens every edge between
    // adjacent biome regions and coastlines (coastlines = biome ↔ sea floor).
    gBlur.addBinding(state.materials.globe, 'biomeBlur', {
        min: 0, max: 0.3, step: 0.005, label: 'biome + coastlines',
    });
    gBlur.addBinding(state.materials.globe, 'mountainBlur', {
        min: 0, max: 0.3, step: 0.005, label: 'mountain edges',
    });
    // snowBlur drives the snow-line / sea-ice mask. The "ice" knob in
    // everyday language is this one.
    gBlur.addBinding(state.materials.globe, 'snowBlur', {
        min: 0, max: 0.3, step: 0.005, label: 'snow / ice line',
    });
    gBlur.addBinding(state.materials.globe, 'seafloorBlur', {
        min: 0, max: 1, step: 0.005, label: 'seafloor bands',
    });
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
    gLighting.addBinding(state.materials.globe, 'moonReflectanceBase', {
        label: 'moon reflectance',
    });
    gLighting.addBinding(state.materials.globe, 'specularTintWarm', {
        label: 'specular (warm)',
    });
    gLighting.addBinding(state.materials.globe, 'specularTintCool', {
        label: 'specular (cool)',
    });
    // Land tint colour casts — applied on top of the biome base before
    // shading. Alpine reveals bare rock at altitude; cold/hot are the
    // climate-driven desaturation + sun-bake. Live-tunable.
    const gLandTints = globeMat.addFolder({ title: 'Land tints', expanded: false });
    globeSubFolders.push(gLandTints);
    gLandTints.addBinding(state.materials.globe, 'alpineBareColor', { label: 'alpine bare' });
    gLandTints.addBinding(state.materials.globe, 'coldToneColor', { label: 'cold cast' });
    gLandTints.addBinding(state.materials.globe, 'hotDryColor', { label: 'hot/dry cast' });
    gLandTints.addBinding(state.materials.globe, 'snowLineStrength', {
        min: 0, max: 1.5, step: 0.01, label: 'snow line',
    });
    gLandTints.addBinding(state.materials.globe, 'alpineStrength', {
        min: 0, max: 1.5, step: 0.01, label: 'alpine strength',
    });
    gLandTints.addBinding(state.materials.globe, 'ambient', {
        min: 0, max: 1, step: 0.01, label: 'ambient',
    });
    gLandTints.addBinding(state.materials.globe, 'nightTint', { label: 'night tint' });
    updateGlobeDisabled();
    // Atmosphere — Hillaire 2020 LUTs. `rayleighScale`/`mieScale` are
    // multipliers on the physical β coefficients; 1.0 = real Earth.
    // Header row = layer toggle + reset chip; the rest of the folder is
    // greyed out when the toggle is off.
    const atmMat = pane.addFolder({ title: 'Atmosphere', expanded: false });
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
    // Scattering — Rayleigh/Mie multipliers + per-channel solar irradiance.
    // The Hillaire LUTs rebake whenever any of these change.
    const atmScatter = atmMat.addFolder({ title: 'Scattering', expanded: false });
    atmControls.push(atmScatter);
    atmScatter.addBinding(state.materials.atmosphere, 'rayleighScale', {
        min: 0, max: 2, step: 0.05, label: 'rayleigh',
    });
    atmScatter.addBinding(state.materials.atmosphere, 'mieScale', {
        min: 0, max: 3, step: 0.05, label: 'mie',
    });
    atmScatter.addBinding(state.materials.atmosphere, 'exposure', {
        min: 0.1, max: 14, step: 0.05, label: 'exposure',
    });
    // Sun disk — angular radius (degrees, scaled ×3 inside scene-graph) of
    // the bright disc the atmosphere LUT samples.
    const atmSun = atmMat.addFolder({ title: 'Sun disk', expanded: false });
    atmControls.push(atmSun);
    atmSun.addBinding(state.materials.atmosphere, 'sunDiskSize', {
        min: 0.001, max: 0.25, step: 0.005, label: 'disk size',
    });
    // Haze — aerial-perspective tint applied to land/water surfaces.
    // hazeAmount: 0 = none, 1 = strong blue rim. hazeFalloffM: terrain
    // above this loses haze exponentially so peaks at the limb keep
    // their shading.
    const atmHaze = atmMat.addFolder({ title: 'Haze', expanded: false });
    atmControls.push(atmHaze);
    atmHaze.addBinding(state.materials.atmosphere, 'hazeAmount', {
        min: 0, max: 1.5, step: 0.01, label: 'amount',
    });
    atmHaze.addBinding(state.materials.atmosphere, 'hazeFalloffM', {
        min: 500, max: 100000, step: 100, label: 'layer height (m)',
    });
    updateAtmDisabled();
    // Sky — sun + moon disk billboards behind the atmosphere shell. No
    // layer toggle: the disks are always visible (their position is driven
    // by the time-of-day clock). The colour pickers push live into the
    // SunMoon shader materials.
    const skyFolder = pane.addFolder({ title: 'Sky', expanded: false });
    const skySun = skyFolder.addFolder({ title: 'Sun disk', expanded: false });
    skySun.addBinding(state.materials.sky, 'sunDiskColor', { label: 'disk' });
    skySun.addBinding(state.materials.sky, 'sunGlowColor', { label: 'glow' });
    const skyMoon = skyFolder.addFolder({ title: 'Moon disk', expanded: false });
    skyMoon.addBinding(state.materials.sky, 'moonDiskColor', { label: 'disk' });
    skyMoon.addBinding(state.materials.sky, 'moonGlowColor', { label: 'glow' });
    skyFolder.addButton({ title: 'Reset' }).on('click', () => {
        Object.assign(state.materials.sky, DEFAULTS.materials.sky);
        pane.refresh();
    });
    // Ocean — Gerstner waves + layered depth gradient + coastal tint +
    // current-speed tint + shimmer-noise warp by current direction.
    // Header row = layer toggle + reset chip; sub-folders below are
    // greyed out when the toggle is off.
    const oceanMat = pane.addFolder({ title: 'Ocean', expanded: false });
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
    // Depth gate for fresnel + ripple shimmer (NOT colour stops).
    oWaves.addBinding(state.materials.ocean, 'depthFadeStart', {
        min: 0, max: 2000, step: 10, label: 'shallow→deep start (m)',
    });
    oWaves.addBinding(state.materials.ocean, 'depthFadeEnd', {
        min: 50, max: 4000, step: 10, label: 'shallow→deep end (m)',
    });
    // Depth bands. Each colour stop has (start, end, falloff). See
    // `bandWeight` in WaterMaterial.ts for the math.
    const oDepth = oceanMat.addFolder({ title: 'Depth colours', expanded: false });
    oceanSubFolders.push(oDepth);
    oDepth.addBinding(state.materials.ocean, 'seaLevelOffsetM', {
        min: -10000, max: 10000, step: 10, label: 'sea level (m)',
    });
    const oCoast = oDepth.addFolder({ title: 'Coast tint', expanded: false });
    oCoast.addBinding(state.materials.ocean, 'coastalTintColor', { label: 'color' });
    oCoast.addBinding(state.materials.ocean, 'coastalTintStrength', {
        min: 0, max: 1, step: 0.01, label: 'strength',
    });
    oCoast.addBinding(state.materials.ocean, 'coastalTintFalloff', {
        min: 0, max: 1500, step: 10, label: 'falloff (m)',
    });
    const oShallow = oDepth.addFolder({ title: 'Shallow', expanded: false });
    oShallow.addBinding(state.materials.ocean, 'shallowColor', { label: 'color' });
    oShallow.addBinding(state.materials.ocean, 'shallowStart', {
        min: -100, max: 2000, step: 1, label: 'start (m)',
    });
    oShallow.addBinding(state.materials.ocean, 'shallowEnd', {
        min: 0, max: 3000, step: 1, label: 'end (m)',
    });
    oShallow.addBinding(state.materials.ocean, 'shallowFalloff', {
        min: 1, max: 4000, step: 1, label: 'falloff (m)',
    });
    const oShelf = oDepth.addFolder({ title: 'Shelf', expanded: false });
    oShelf.addBinding(state.materials.ocean, 'shelfColor', { label: 'color' });
    oShelf.addBinding(state.materials.ocean, 'shelfStart', {
        min: -100, max: 3000, step: 1, label: 'start (m)',
    });
    oShelf.addBinding(state.materials.ocean, 'shelfEnd', {
        min: 0, max: 4000, step: 1, label: 'end (m)',
    });
    oShelf.addBinding(state.materials.ocean, 'shelfFalloff', {
        min: 1, max: 6000, step: 10, label: 'falloff (m)',
    });
    const oDeep = oDepth.addFolder({ title: 'Deep', expanded: false });
    oDeep.addBinding(state.materials.ocean, 'deepColor', { label: 'color' });
    oDeep.addBinding(state.materials.ocean, 'deepStart', {
        min: 0, max: 5000, step: 10, label: 'start (m)',
    });
    oDeep.addBinding(state.materials.ocean, 'deepEnd', {
        min: 0, max: 8000, step: 10, label: 'end (m)',
    });
    oDeep.addBinding(state.materials.ocean, 'deepFalloff', {
        min: 100, max: 30000, step: 100, label: 'falloff (m)',
    });
    const oAbyssal = oDepth.addFolder({ title: 'Abyssal', expanded: false });
    oAbyssal.addBinding(state.materials.ocean, 'abyssalColor', { label: 'color' });
    oAbyssal.addBinding(state.materials.ocean, 'abyssalStart', {
        min: 0, max: 11000, step: 50, label: 'start (m)',
    });
    oAbyssal.addBinding(state.materials.ocean, 'abyssalEnd', {
        min: 0, max: 12000, step: 50, label: 'end (m)',
    });
    oAbyssal.addBinding(state.materials.ocean, 'abyssalFalloff', {
        min: 100, max: 30000, step: 100, label: 'falloff (m)',
    });
    const oCurrents = oceanMat.addFolder({ title: 'Currents', expanded: false });
    oceanSubFolders.push(oCurrents);
    oCurrents.addBinding(state.materials.ocean, 'currentStrength', {
        min: 0, max: 3, step: 0.05, label: 'strength',
    });
    oCurrents.addBinding(state.materials.ocean, 'currentTintEnabled', {
        label: 'tint',
    });
    oCurrents.addBinding(state.materials.ocean, 'currentTintColor', {
        label: 'tint color',
    });
    oCurrents.addBinding(state.materials.ocean, 'showMediumCurrents', {
        label: 'show medium',
    });
    oCurrents.addBinding(state.materials.ocean, 'shimmerCurrentDrift', {
        min: 0, max: 40, step: 0.05, label: 'shimmer drift',
    });
    // Sun glint + sky reflection — the two specular paths that key off the
    // sun direction. Live colour pickers; the strength is driven by the
    // fresnel slider above.
    const oReflect = oceanMat.addFolder({ title: 'Sun glint & sky reflection', expanded: false });
    oceanSubFolders.push(oReflect);
    oReflect.addBinding(state.materials.ocean, 'sunGlintColor', { label: 'sun glint' });
    oReflect.addBinding(state.materials.ocean, 'skyTintColor', { label: 'sky reflection' });
    updateOceanDisabled();
    // Clouds — volumetric raymarch in the [1.012, 1.025] shell.
    // Header row = layer toggle + reset chip; settings below are
    // greyed out when the toggle is off.
    const cloudsMat = pane.addFolder({ title: 'Clouds', expanded: false });
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
    // Sun-lit + shadowed cloud face colours. Both push into VolumetricCloudPass
    // each frame; warm sun, cool ambient keeps clouds reading as sky-lit
    // rather than black on the shaded side.
    const cloudsLight = cloudsMat.addFolder({ title: 'Lighting', expanded: false });
    cloudsControls.push(cloudsLight);
    cloudsLight.addBinding(state.materials.clouds, 'sunColor', { label: 'sun colour' });
    cloudsLight.addBinding(state.materials.clouds, 'ambientColor', { label: 'ambient' });
    updateCloudsDisabled();
    // Highways — merged ribbon mesh tracing every kept road polyline. Width
    // is in *screen pixels* (per kind), so the network stays delicate at
    // every zoom. Grouped sub-folders: Road widths (shared day+night),
    // Day look (white fill + dark casing), Night look (glowing core + halo),
    // Zoom fade (opacity by camera distance).
    // Header row = layer toggle + reset chip; sub-folders below are
    // greyed out when the toggle is off.
    const highwaysMat = pane.addFolder({ title: 'Highways', expanded: false });
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
    hwDay.addBinding(state.materials.highways, 'dayCasingColor', { label: 'casing color' });
    hwDay.addBinding(state.materials.highways, 'dayFillColor', { label: 'fill color' });
    const hwNight = highwaysMat.addFolder({ title: 'Night look', expanded: false });
    highwaysSubFolders.push(hwNight);
    hwNight.addBinding(state.materials.highways, 'nightBrightness', {
        min: 0, max: 2, step: 0.05, label: 'overall brightness',
    });
    hwNight.addBinding(state.materials.highways, 'nightColor', { label: 'glow color' });
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
    // Header row = layer toggle + reset chip; sub-folders below are
    // greyed out when the toggle is off. Cities used to piggyback on the
    // `highways` toggle — separate field now so the three layers (roads,
    // city outlines, procedural urban) can be flipped independently.
    const citiesMat = pane.addFolder({ title: 'Cities', expanded: false });
    const citiesSubFolders = [];
    const updateCitiesDisabled = () => {
        const off = !state.layers.cities;
        for (const f of citiesSubFolders)
            f.disabled = off;
    };
    citiesMat.addBinding(state.layers, 'cities', { label: 'enabled' }).on('change', () => {
        updateCitiesDisabled();
    });
    citiesMat.addButton({ title: 'Reset' }).on('click', () => {
        state.layers.cities = DEFAULTS.layers.cities;
        Object.assign(state.materials.cities, DEFAULTS.materials.cities);
        pane.refresh();
        updateCitiesDisabled();
    });
    const cBricks = citiesMat.addFolder({ title: 'Brick pattern', expanded: false });
    citiesSubFolders.push(cBricks);
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
    cBricks.addBinding(state.materials.cities, 'nightFillColor', { label: 'night fill' });
    cBricks.addBinding(state.materials.cities, 'nightOutlineColor', { label: 'night outline' });
    cBricks.addBinding(state.materials.cities, 'dayNeutralColor', { label: 'day base' });
    const cLook = citiesMat.addFolder({ title: 'Look', expanded: false });
    citiesSubFolders.push(cLook);
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
    updateCitiesDisabled();
    // Urban — procedural close-up city detail (buildings + streets). Engages
    // when the camera is within ~800 km of a city; below ~1100 km it
    // disengages back to the cities glow. Header row = layer toggle +
    // reset chip; sub-folders below are greyed out when the toggle is off.
    const urbanMat = pane.addFolder({ title: 'Urban', expanded: false });
    const urbanSubFolders = [];
    const updateUrbanDisabled = () => {
        const off = !state.layers.urban;
        for (const f of urbanSubFolders)
            f.disabled = off;
    };
    urbanMat.addBinding(state.layers, 'urban', { label: 'enabled' }).on('change', () => {
        updateUrbanDisabled();
    });
    urbanMat.addButton({ title: 'Reset' }).on('click', () => {
        state.layers.urban = DEFAULTS.layers.urban;
        Object.assign(state.materials.urban, DEFAULTS.materials.urban);
        pane.refresh();
        updateUrbanDisabled();
    });
    const urbanBld = urbanMat.addFolder({ title: 'Buildings', expanded: false });
    urbanSubFolders.push(urbanBld);
    urbanBld.addBinding(state.materials.urban, 'buildingBaseLow', { label: 'base (low storey)' });
    urbanBld.addBinding(state.materials.urban, 'buildingBaseHigh', { label: 'base (high storey)' });
    urbanBld.addBinding(state.materials.urban, 'buildingNightDark', { label: 'night unlit' });
    urbanBld.addBinding(state.materials.urban, 'buildingNightLitWarm', { label: 'night lit' });
    const urbanStr = urbanMat.addFolder({ title: 'Streets', expanded: false });
    urbanSubFolders.push(urbanStr);
    urbanStr.addBinding(state.materials.urban, 'streetDayDark', { label: 'day (centre)' });
    urbanStr.addBinding(state.materials.urban, 'streetDayLight', { label: 'day (edge)' });
    urbanStr.addBinding(state.materials.urban, 'streetNightDark', { label: 'night unlit' });
    urbanStr.addBinding(state.materials.urban, 'streetNightLit', { label: 'night lit' });
    updateUrbanDisabled();
    // Scenarios — global wasteland look + per-scenario tuning. Per-scenario
    // shape/duration knobs live in the floating Scenarios launcher
    // (#scenarios-launcher); this folder owns the cross-scenario decay
    // exponent + wasteland palette, and nests the Nuclear visual calibration
    // since every nuclear strike is itself a scenario.
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
    // Nuclear explosion knobs. "Calibration (baseline)" + "Wind dynamics"
    // live-apply every frame; the other groups only take effect on the next
    // detonation because they alter the configs the particle list is built
    // from. The launcher's Blast radius slider scales the visual relative
    // to `visuals.referenceRadiusKm` (config-only constant), so the
    // baseline-size slider here is what an artist tunes the calibrated
    // 450 km strike against — the per-strike multiplier composes with it.
    const nukeFolder = scnFolder.addFolder({ title: 'Nuclear', expanded: false });
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
    const pickFolder = pane.addFolder({ title: 'Pick', expanded: false });
    pickFolder.addBinding(state.pick, 'lastPick', { readonly: true, multiline: true, rows: 8 });
    return {
        pane,
        state,
        dispose: () => pane.dispose(),
    };
}

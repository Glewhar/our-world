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
export const initialDebugState = {
    camera: { autoOrbit: false, orbitSpeed: 0.05 },
    scene: { background: '#06080c', showGrid: false },
    timeOfDay: { t01: 0.5, paused: false },
    altitude: { scaleFactor: 5 },
    layers: {
        globe: true,
        atmosphere: true,
        ocean: true,
        clouds: true,
        cities: true,
        airports: true,
        routeScaffold: true,
        trails: true,
        planes: true,
        postFx: true,
    },
    airplanes: {
        speed: 0.15,
        targetInFlight: 2200,
        scaffoldOpacity: 0.04,
        trailOpacity: 0.05,
    },
    materials: {
        globe: {
            ambient: 0.3,
            nightTint: '#141a29',
            lerpColorFire: '#1a1014',
            lerpColorIce: '#d4ecff',
            lerpColorInfection: '#bb33cc',
            lerpColorPollution: '#7a6a3a',
            lerpStrengthFire: 1.0,
            lerpStrengthIce: 1.0,
            lerpStrengthInfection: 1.0,
            lerpStrengthPollution: 1.0,
            biomeStrength: 0.85,
            snowLineStrength: 0.55,
            seasonOffsetC: 0.0,
            alpineStrength: 0.7,
        },
        atmosphere: {
            rayleighScale: 2.5,
            mieScale: 0.4,
            sunDiskSize: 0.18,
            exposure: 2.5,
        },
        ocean: {
            waveAmplitude: 150,
            waveSpeed: 1.0,
            waveSteepness: 0.5,
            fresnelStrength: 1.0,
            deepColor: '#0a2a4f',
            shallowColor: '#3da6c2',
            currentStrength: 1.0,
            streamlinesEnabled: true,
            strongJetsOnly: false,
        },
        clouds: {
            density: 0.1,
            coverage: 0.5,
            beer: 1.4,
            henyey: 0.4,
            advection: 14,
        },
        cities: {
            baseRadiusKm: 30,
            minRadiusKm: 5,
            maxRadiusKm: 80,
            minPopulation: 0,
            falloffStrength: 3.0,
            gridDensity: 10,
            blockThreshold: 0.25,
            outlineMin: 0.01,
            outlineMax: 0.06,
            nightBrightness: 1.5,
            dayContrast: 0.5,
            opacity: 0.65,
        },
        postFx: { bloomThreshold: 0.85, bloomStrength: 0.6, vignette: 0.35, gradeTint: '#f3eee0' },
    },
    pick: { lastPick: '(click on the globe)' },
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
    // Time of day: the floating bottom-center slider drives `t01` and the
    // pause button toggles `paused`. Tweakpane mirrors the pause toggle so
    // it can also be flipped from here.
    const todFolder = pane.addFolder({ title: 'Time of day' });
    todFolder.addBinding(state.timeOfDay, 'paused', { label: 'pause' });
    // Altitude scale is driven by the floating left-center vertical slider
    // (#altitude-control in index.html), next to the season thermostat — same
    // pattern as season, which is also pulled out of the panel. The slider
    // mutates state.altitude.scaleFactor directly; nothing else to bind here.
    // Clouds / ocean / atmosphere / cities / planes (combined planes+trails)
    // live on the floating bottom toggle bar (#layer-toggles in index.html).
    // Airports + routes remain here as the fine-grained airline-overlay knobs;
    // globe stays here; postFx is n/a.
    const layersFolder = pane.addFolder({ title: 'Layers' });
    layersFolder.addBinding(state.layers, 'globe');
    layersFolder.addBinding(state.layers, 'airports', { label: 'airports' });
    layersFolder.addBinding(state.layers, 'routeScaffold', { label: 'routes' });
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
    // remaining globe knobs (ambient, night tint, dynamic recolour, biomeStrength,
    // snowLineStrength, alpineStrength) are tuned via DebugState defaults and
    // pushed to uniforms each frame via `applyMaterials` — re-add a Globe folder
    // here if any of them needs live tuning again.
    // Atmosphere — Hillaire 2020 LUTs. `rayleighScale`/`mieScale` are
    // multipliers on the physical β coefficients; 1.0 = real Earth.
    const atmMat = mat.addFolder({ title: 'Atmosphere', expanded: false });
    atmMat.addBinding(state.materials.atmosphere, 'rayleighScale', { min: 0, max: 5, step: 0.05 });
    atmMat.addBinding(state.materials.atmosphere, 'mieScale', { min: 0, max: 3, step: 0.05 });
    atmMat.addBinding(state.materials.atmosphere, 'sunDiskSize', {
        min: 0.001,
        max: 0.25,
        step: 0.005,
    });
    atmMat.addBinding(state.materials.atmosphere, 'exposure', { min: 0.1, max: 6, step: 0.05 });
    // Ocean — Gerstner waves. `waveAmplitude` is in metres; the shader
    // multiplies by `uElevationScale` to land in the same visual regime as
    // terrain. 0–600 m covers calm sea through storm swell.
    const oceanMat = mat.addFolder({ title: 'Ocean', expanded: false });
    oceanMat.addBinding(state.materials.ocean, 'waveAmplitude', { min: 0, max: 600, step: 5 });
    oceanMat.addBinding(state.materials.ocean, 'waveSpeed', { min: 0, max: 5, step: 0.05 });
    oceanMat.addBinding(state.materials.ocean, 'waveSteepness', { min: 0, max: 1, step: 0.01 });
    oceanMat.addBinding(state.materials.ocean, 'fresnelStrength', { min: 0, max: 3, step: 0.05 });
    oceanMat.addBinding(state.materials.ocean, 'deepColor');
    oceanMat.addBinding(state.materials.ocean, 'shallowColor');
    // Surface current streamlines — animated overlay on the day-side ocean.
    // 0 = hidden, 1 = subtle default, 3 = obviously highlighted (debug).
    oceanMat.addBinding(state.materials.ocean, 'currentStrength', {
        min: 0,
        max: 3,
        step: 0.05,
        label: 'currents',
    });
    oceanMat.addBinding(state.materials.ocean, 'streamlinesEnabled', {
        label: 'streamlines',
    });
    oceanMat.addBinding(state.materials.ocean, 'strongJetsOnly', {
        label: 'jets only',
    });
    // Clouds — volumetric raymarch in the [1.012, 1.025] shell.
    const cloudsMat = mat.addFolder({ title: 'Clouds', expanded: false });
    cloudsMat.addBinding(state.materials.clouds, 'density', { min: 0, max: 2, step: 0.01 });
    cloudsMat.addBinding(state.materials.clouds, 'coverage', { min: 0, max: 1, step: 0.01 });
    cloudsMat.addBinding(state.materials.clouds, 'beer', { min: 0, max: 4, step: 0.05 });
    cloudsMat.addBinding(state.materials.clouds, 'henyey', { min: -0.95, max: 0.95, step: 0.01 });
    cloudsMat.addBinding(state.materials.clouds, 'advection', { min: 0, max: 100, step: 0.5 });
    // Cities — instanced quads with procedural rectangular blocks. Size +
    // opacity scale with population; coastline-clipped via the id raster.
    const citiesMat = mat.addFolder({ title: 'Cities', expanded: false });
    citiesMat.addBinding(state.materials.cities, 'baseRadiusKm', { min: 5, max: 60, step: 1 });
    citiesMat.addBinding(state.materials.cities, 'minRadiusKm', { min: 1, max: 20, step: 0.5 });
    citiesMat.addBinding(state.materials.cities, 'maxRadiusKm', { min: 40, max: 200, step: 1 });
    citiesMat.addBinding(state.materials.cities, 'minPopulation', {
        min: 0,
        max: 1_000_000,
        step: 1000,
    });
    citiesMat.addBinding(state.materials.cities, 'falloffStrength', { min: 1, max: 6, step: 0.1 });
    citiesMat.addBinding(state.materials.cities, 'gridDensity', { min: 4, max: 20, step: 1 });
    citiesMat.addBinding(state.materials.cities, 'blockThreshold', { min: 0, max: 0.6, step: 0.01 });
    citiesMat.addBinding(state.materials.cities, 'outlineMin', { min: 0, max: 0.05, step: 0.001 });
    citiesMat.addBinding(state.materials.cities, 'outlineMax', { min: 0.02, max: 0.2, step: 0.005 });
    citiesMat.addBinding(state.materials.cities, 'nightBrightness', { min: 0, max: 3, step: 0.05 });
    citiesMat.addBinding(state.materials.cities, 'dayContrast', { min: 0, max: 1, step: 0.01 });
    citiesMat.addBinding(state.materials.cities, 'opacity', { min: 0, max: 1, step: 0.01 });
    // PostFX — bloom + vignette + grade tint. Not wired: PostFXChain currently
    // ships a passthrough RenderPass, so these bindings are greyed out until
    // the bloom / vignette / grade passes are attached.
    const postMat = mat.addFolder({ title: 'PostFX (n/a)', expanded: false });
    postMat.disabled = true;
    postMat.addBinding(state.materials.postFx, 'bloomThreshold', { min: 0, max: 2, step: 0.01 });
    postMat.addBinding(state.materials.postFx, 'bloomStrength', { min: 0, max: 3, step: 0.01 });
    postMat.addBinding(state.materials.postFx, 'vignette', { min: 0, max: 1.5, step: 0.01 });
    postMat.addBinding(state.materials.postFx, 'gradeTint');
    const pickFolder = pane.addFolder({ title: 'Pick', expanded: true });
    pickFolder.addBinding(state.pick, 'lastPick', { readonly: true, multiline: true, rows: 8 });
    return {
        pane,
        state,
        dispose: () => pane.dispose(),
    };
}

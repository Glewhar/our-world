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
            coastSharpness: 50.0,
            biomeEdgeSharpness: 80.0,
            biomeSurfaceStrength: 1.0,
            biomeColorVar: 0.6,
            biomeBumpStrength: 0.6,
            biomeNoiseFreq: 12.0,
            biomeSurfaceAmps: [0.8, 0.7, 0.6, 0.5, 0.6, 0.4, 0.9, 0.3, 0.7, 0.4, 0.6, 1.0],
            specularStrength: 1.0,
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
            abyssalColor: '#03081a',
            deepColor: '#143e7a',
            shelfColor: '#1a6b95',
            shallowColor: '#3da6c2',
            trenchStart: 4500,
            trenchEnd: 8000,
            coastalTintColor: '#2d8c80',
            coastalTintStrength: 0.4,
            coastalTintFalloff: 400,
            currentStrength: 1.0,
            streamlinesEnabled: true,
            strongJetsOnly: false,
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
            localWidthPx: 2.0,
            nightBrightness: 0.6,
            majorBoost: 0.8,
            arterialBoost: 0.6,
            localBoost: 0.7,
            coreWidth: 0.3,
            coreBoost: 1.2,
            haloStrength: 0.5,
            haloFalloff: 1.8,
            dayStrength: 0.7,
            opacityNear: 1.0,
            opacityFar: 0.05,
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
    globeMat.addBinding(state.materials.globe, 'coastSharpness', {
        min: 0,
        max: 100,
        step: 0.1,
        label: 'coast sharpness (km)',
    });
    globeMat.addBinding(state.materials.globe, 'biomeEdgeSharpness', {
        min: 0,
        max: 100,
        step: 0.5,
        label: 'biome edge fade (km)',
    });
    globeMat.addBinding(state.materials.globe, 'biomeSurfaceStrength', {
        min: 0,
        max: 1,
        step: 0.01,
        label: 'biome surf master',
    });
    globeMat.addBinding(state.materials.globe, 'biomeColorVar', {
        min: 0,
        max: 1,
        step: 0.01,
        label: 'biome color var',
    });
    globeMat.addBinding(state.materials.globe, 'biomeBumpStrength', {
        min: 0,
        max: 1,
        step: 0.01,
        label: 'biome bump',
    });
    globeMat.addBinding(state.materials.globe, 'biomeNoiseFreq', {
        min: 1,
        max: 40,
        step: 0.5,
        label: 'biome noise freq',
    });
    // Per-biome amplitudes — 12 sliders. Tweakpane needs each entry as a
    // distinct binding key, so wrap each index in a small per-entry proxy
    // object whose mutation writes back into the array.
    const ampsFolder = globeMat.addFolder({ title: 'Per-biome amps', expanded: false });
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
    globeMat.addBinding(state.materials.globe, 'specularStrength', {
        min: 0,
        max: 3,
        step: 0.01,
        label: 'specular',
    });
    const specAmpsFolder = globeMat.addFolder({ title: 'Per-biome spec', expanded: false });
    for (let i = 0; i < 12; i++) {
        const proxy = { v: state.materials.globe.biomeSpecAmps[i] };
        specAmpsFolder
            .addBinding(proxy, 'v', { min: 0, max: 1, step: 0.01, label: BIOME_LABELS[i] })
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
    // Ocean — Gerstner waves. `waveAmplitude` is in metres; the shader
    // multiplies by `uElevationScale` to land in the same visual regime as
    // terrain. 0–600 m covers calm sea through storm swell.
    const oceanMat = mat.addFolder({ title: 'Ocean', expanded: false });
    oceanMat.addBinding(state.materials.ocean, 'waveAmplitude', { min: 0, max: 600, step: 5 });
    oceanMat.addBinding(state.materials.ocean, 'waveSpeed', { min: 0, max: 5, step: 0.05 });
    oceanMat.addBinding(state.materials.ocean, 'waveSteepness', { min: 0, max: 1, step: 0.01 });
    oceanMat.addBinding(state.materials.ocean, 'fresnelStrength', { min: 0, max: 3, step: 0.05 });
    // Exponential depth-falloff scale for the ocean tint. Smaller = sharper /
    // narrower shelves, larger = softer / wider shelves. The whole transition
    // happens within ~3× this value, so 200 m → tight shelves, 2000 m → broad.
    oceanMat.addBinding(state.materials.ocean, 'depthFalloff', {
        min: 0,
        max: 100,
        step: 1,
        label: 'depth falloff',
    });
    // Layered ocean gradient stops. \`deep\` is the open-ocean baseline that
    // most of the world ocean reads as; \`shelf\` and \`shallow\` blend up
    // toward the coast via exp ramps; \`abyssal\` blends in only at trench
    // depths via the smoothstep gate below.
    oceanMat.addBinding(state.materials.ocean, 'abyssalColor');
    oceanMat.addBinding(state.materials.ocean, 'deepColor');
    oceanMat.addBinding(state.materials.ocean, 'shelfColor');
    oceanMat.addBinding(state.materials.ocean, 'shallowColor');
    // Trench gate — abyssal blends in over [trenchStart, trenchEnd] m.
    // Below trenchStart no abyssal; above trenchEnd fully abyssal.
    oceanMat.addBinding(state.materials.ocean, 'trenchStart', {
        min: 0,
        max: 11000,
        step: 100,
        label: 'trench start',
    });
    oceanMat.addBinding(state.materials.ocean, 'trenchEnd', {
        min: 0,
        max: 12000,
        step: 100,
        label: 'trench end',
    });
    // Coastal sediment / chlorophyll tint over the shallowest band.
    // Strength 0 disables, 0.25 is the default subtle cast, 1 saturates.
    oceanMat.addBinding(state.materials.ocean, 'coastalTintColor', { label: 'coastal tint' });
    oceanMat.addBinding(state.materials.ocean, 'coastalTintStrength', {
        min: 0,
        max: 1,
        step: 0.01,
        label: 'tint strength',
    });
    oceanMat.addBinding(state.materials.ocean, 'coastalTintFalloff', {
        min: 0,
        max: 1500,
        step: 10,
        label: 'tint falloff',
    });
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
    // Highways — merged ribbon mesh tracing every kept road polyline. Width
    // is in *screen pixels* (per kind), so the network stays delicate at
    // every zoom. Night shows bright core + soft warm halo; day shows a
    // thin dark warm-grey trace. Three kinds (major / arterial / local) each
    // have their own pixel width and brightness boost.
    const highwaysMat = mat.addFolder({ title: 'Highways', expanded: false });
    highwaysMat.addBinding(state.materials.highways, 'majorWidthPx', {
        min: 1,
        max: 8,
        step: 0.25,
        label: 'major width (px)',
    });
    highwaysMat.addBinding(state.materials.highways, 'arterialWidthPx', {
        min: 0.5,
        max: 6,
        step: 0.25,
        label: 'arterial width (px)',
    });
    highwaysMat.addBinding(state.materials.highways, 'localWidthPx', {
        min: 0.2,
        max: 4,
        step: 0.1,
        label: 'local width (px)',
    });
    highwaysMat.addBinding(state.materials.highways, 'nightBrightness', {
        min: 0,
        max: 2,
        step: 0.05,
        label: 'night brightness',
    });
    highwaysMat.addBinding(state.materials.highways, 'majorBoost', {
        min: 1,
        max: 15,
        step: 0.05,
        label: 'major boost',
    });
    highwaysMat.addBinding(state.materials.highways, 'arterialBoost', {
        min: 0.2,
        max: 2,
        step: 0.05,
        label: 'arterial boost',
    });
    highwaysMat.addBinding(state.materials.highways, 'localBoost', {
        min: 0.2,
        max: 1.5,
        step: 0.05,
        label: 'local boost',
    });
    highwaysMat.addBinding(state.materials.highways, 'coreWidth', {
        min: 0.05,
        max: 0.6,
        step: 0.01,
        label: 'core size',
    });
    highwaysMat.addBinding(state.materials.highways, 'coreBoost', {
        min: 0.5,
        max: 4,
        step: 0.05,
        label: 'core boost',
    });
    highwaysMat.addBinding(state.materials.highways, 'haloStrength', {
        min: 0,
        max: 2,
        step: 0.05,
        label: 'halo strength',
    });
    highwaysMat.addBinding(state.materials.highways, 'haloFalloff', {
        min: 0.5,
        max: 5,
        step: 0.05,
        label: 'halo falloff',
    });
    highwaysMat.addBinding(state.materials.highways, 'dayStrength', {
        min: 0,
        max: 2,
        step: 0.05,
        label: 'day strength',
    });
    highwaysMat.addBinding(state.materials.highways, 'opacityNear', {
        min: 0,
        max: 1,
        step: 0.01,
        label: 'opacity (zoom-in)',
    });
    highwaysMat.addBinding(state.materials.highways, 'opacityFar', {
        min: 0,
        max: 1,
        step: 0.01,
        label: 'opacity (zoom-out)',
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
    const pickFolder = pane.addFolder({ title: 'Pick', expanded: true });
    pickFolder.addBinding(state.pick, 'lastPick', { readonly: true, multiline: true, rows: 8 });
    return {
        pane,
        state,
        dispose: () => pane.dispose(),
    };
}

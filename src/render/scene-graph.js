/**
 * Owns the Three.Scene, the perspective camera (with `up` set to the bake's
 * Z-up axis), the OrbitControls, the unified `Globe` (single icosphere with
 * vertex displacement + per-fragment HEALPix lookups for land + ocean), the
 * AtmospherePass, the volumetric cloud pass, the directional sun light, and
 * the PostFXChain. The Renderer is intentionally thin: just the WebGLRenderer
 * + resize + per-frame tick that delegates to this module.
 *
 * Picking flow:
 *   pointerdown → NDC → Raycaster → world.pickFromRay → BodyRecord → log + HUD.
 * NEVER raycast the mesh itself; the icosphere is displaced by elevation
 * and a mesh raycast would miss the id-raster's true cell boundaries.
 *
 * Time of day:
 *   `debug.timeOfDay.t01` rotates the sun direction around Z (longitude). At
 *   t01 = 0.5 the sun is at the +X side. The clock auto-advances at
 *   `T01_PER_SECOND` per real second unless `debug.timeOfDay.paused` is true.
 *   The floating bottom-center slider in index.html reads/writes `t01`.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Globe } from './globe/Globe.js';
import { AtmospherePass } from './atmosphere/AtmospherePass.js';
import { PostFXChain } from './postfx/PostFXChain.js';
import { VolumetricCloudPass } from './clouds/VolumetricCloudPass.js';
import { CitiesLayer } from './cities/CitiesLayer.js';
import { AirplaneSystem } from './airplanes/AirplaneSystem.js';
import { loadAirplaneData } from './airplanes/data.js';
import { SunMoon } from './sky/SunMoon.js';
import { atmosphereRadiusFromFactor, elevationScaleFromFactor, } from './globe/LandMaterial.js';
const CAMERA_RADIUS = 3.0;
const SUN_TILT_RAD = (23.4 * Math.PI) / 180;
// Full day cycle in 1 / T01_PER_SECOND real seconds. 0.04 → 25 sec/day.
const T01_PER_SECOND = 0.04;
export function createSceneGraph() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#06080c');
    // Z-up matches the data-pipeline's `lonlat_to_xyz` convention end-to-end.
    // Orbit, picking, and shading all stay in this frame — no axis swap.
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.up.set(0, 0, 1);
    camera.position.set(CAMERA_RADIUS, CAMERA_RADIUS * 0.4, CAMERA_RADIUS * 0.5);
    camera.lookAt(0, 0, 0);
    let controls = null;
    let attachedCanvas = null;
    let webglRenderer = null;
    let postFx = null;
    const sun = new THREE.DirectionalLight(0xfff4d6, 1.0);
    sun.position.set(3, 2, 1.5);
    scene.add(sun);
    scene.add(new THREE.AmbientLight(0x223046, 0.3));
    const sunDirection = new THREE.Vector3().copy(sun.position).normalize();
    // AtmospherePass requires the WebGLRenderer for LUT precompute, so we
    // defer construction until `attachRenderer`.
    let atmosphere = null;
    let world = null;
    let globe = null;
    let cloudsPass = null;
    let cities = null;
    let airplanes = null;
    const sunMoon = new SunMoon();
    scene.add(sunMoon.group);
    let pointerHandler = null;
    let orbitAngle = 0;
    const raycaster = new THREE.Raycaster();
    const tmpVec2 = new THREE.Vector2();
    const tmpSunDir = new THREE.Vector3();
    function attachRenderer(r) {
        webglRenderer = r;
        postFx = new PostFXChain(r, scene, camera);
        // Construct with the baseline (factor=5) atmosphere radius so the LUTs
        // bake at the right scale on first frame. The slider can shift it later
        // and the LUTs re-bake on change.
        atmosphere = new AtmospherePass(r, {
            atmosphereRadius: atmosphereRadiusFromFactor(5),
        });
        atmosphere.setSunDirection(sunDirection);
        atmosphere.syncFromCamera(camera);
        scene.add(atmosphere.mesh);
    }
    function attachWorld(w, canvas) {
        world = w;
        attachedCanvas = canvas;
        controls = new OrbitControls(camera, canvas);
        controls.enableDamping = true;
        controls.minDistance = 1.2;
        controls.maxDistance = 30;
        controls.target.set(0, 0, 0);
        // A single Globe mesh covers both land and water. The unified shader does
        // HEALPix lookups per fragment, branching on `id_raster` to colour land
        // vs ocean cells, and per vertex displaces land outward by the continuous
        // `elevation_meters` texture. All attribute texture bindings happen
        // inside the Globe constructor.
        globe = new Globe(w);
        globe.setSunDirection(sunDirection);
        scene.add(globe.group);
        cloudsPass = new VolumetricCloudPass(w);
        cloudsPass.setSunDirection(sunDirection);
        cloudsPass.syncFromCamera(camera);
        cloudsPass.setSize(canvas.clientWidth || canvas.width || 1, canvas.clientHeight || canvas.height || 1);
        scene.add(cloudsPass.mesh);
        // Cities — instanced quads tangent to the globe, painted with an
        // organic spray of rectangular blocks. Empty city array (fixture or
        // legacy bake) yields a no-op layer. The id raster uniform is shared
        // with Land/Clouds for the coastline mask.
        cities = new CitiesLayer(w, w.getCities());
        cities.setSunDirection(sunDirection);
        scene.add(cities.mesh);
        // Airplane visualisation — async because the data is loaded over fetch.
        // Failure is non-fatal; the rest of the scene still renders.
        loadAirplaneData()
            .then((data) => {
            airplanes = new AirplaneSystem(data);
            scene.add(airplanes.group);
        })
            .catch((err) => {
            console.warn('[airplanes] disabled:', err);
        });
        pointerHandler = (event) => {
            if (!world)
                return;
            const rect = canvas.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
            tmpVec2.set(x, y);
            raycaster.setFromCamera(tmpVec2, camera);
            const hit = world.pickFromRay(raycaster.ray);
            reportPick(world, hit);
        };
        canvas.addEventListener('pointerdown', pointerHandler);
    }
    function reportPick(w, hit) {
        if (!hit) {
            lastPickRef.value = '(no body — click on the globe)';
            console.info('[pick] no body');
            return;
        }
        const body = w.getBody(hit.bodyId);
        if (!body) {
            lastPickRef.value = `(body id ${hit.bodyId} not in registry)`;
            console.warn('[pick] body id missing from registry', hit);
            return;
        }
        const summary = {
            id: body.id,
            type: body.type,
            display_name: body.display_name,
            area_km2: body.area_km2,
            centroid: body.centroid,
            bbox: body.bbox,
            cellIndex: hit.cellIndex,
            lat: Number(hit.lat.toFixed(3)),
            lon: Number(hit.lon.toFixed(3)),
        };
        lastPickRef.value = JSON.stringify(summary, null, 2);
        console.info('[pick]', summary, body.metadata);
    }
    // Tweakpane reads this object live by reference.
    const lastPickRef = { value: '(click on the globe)' };
    function applyTimeOfDay(debug) {
        const theta = (debug.timeOfDay.t01 - 0.5) * Math.PI * 2;
        tmpSunDir.set(Math.cos(theta), Math.sin(theta), Math.sin(SUN_TILT_RAD)).normalize();
        sun.position.copy(tmpSunDir).multiplyScalar(3);
        globe?.setSunDirection(tmpSunDir);
        atmosphere?.setSunDirection(tmpSunDir);
        cloudsPass?.setSunDirection(tmpSunDir);
        cities?.setSunDirection(tmpSunDir);
        sunMoon.syncFromCamera(camera, tmpSunDir);
    }
    function applyMaterials(debug) {
        const m = debug.materials.globe;
        if (globe) {
            // Land-tinted Tweakpane bindings drive the land mesh; ocean-tinted
            // bindings drive the water mesh. Ambient + night tint are shared
            // visual properties — push the same value to both so the day/night
            // wrap stays consistent across the split.
            const land = globe.uniforms.land;
            land.uAmbient.value = m.ambient;
            land.uNightTint.value.set(m.nightTint);
            land.uColorFire.value.set(m.lerpColorFire);
            land.uColorIce.value.set(m.lerpColorIce);
            land.uColorInfection.value.set(m.lerpColorInfection);
            land.uColorPollution.value.set(m.lerpColorPollution);
            land.uLerpStrength.value.set(m.lerpStrengthFire, m.lerpStrengthIce, m.lerpStrengthInfection, m.lerpStrengthPollution);
            land.uBiomeStrength.value = m.biomeStrength;
            land.uSnowLineStrength.value = m.snowLineStrength;
            land.uSeasonOffsetC.value = m.seasonOffsetC;
            land.uAlpineStrength.value = m.alpineStrength;
            // Ocean colours + Gerstner knobs live on the dedicated water material.
            // Time is advanced separately in `update()`; this hook only pushes
            // Tweakpane-driven uniforms.
            const o = debug.materials.ocean;
            const water = globe.uniforms.water;
            water.uAmbient.value = m.ambient;
            water.uNightTint.value.set(m.nightTint);
            water.uOceanDeep.value.set(o.deepColor);
            water.uOceanShallow.value.set(o.shallowColor);
            water.uWaveAmplitude.value = o.waveAmplitude;
            water.uWaveSpeed.value = o.waveSpeed;
            water.uWaveSteepness.value = o.waveSteepness;
            water.uFresnelStrength.value = o.fresnelStrength;
            water.uCurrentStrength.value = o.currentStrength;
            water.uStreamlinesEnabled.value = o.streamlinesEnabled ? 1 : 0;
            water.uStrongJetsOnly.value = o.strongJetsOnly ? 1 : 0;
        }
        if (cloudsPass) {
            const c = debug.materials.clouds;
            cloudsPass.setDensity(c.density);
            cloudsPass.setCoverage(c.coverage);
            cloudsPass.setBeer(c.beer);
            cloudsPass.setHenyey(c.henyey);
            cloudsPass.setAdvection(c.advection);
        }
        if (cities) {
            const cz = debug.materials.cities;
            const u = cities.uniforms;
            u.uBaseRadiusKm.value = cz.baseRadiusKm;
            u.uMinRadiusKm.value = cz.minRadiusKm;
            u.uMaxRadiusKm.value = cz.maxRadiusKm;
            u.uMinPopulation.value = cz.minPopulation;
            u.uFalloffStrength.value = cz.falloffStrength;
            u.uGridDensity.value = cz.gridDensity;
            u.uBlockThreshold.value = cz.blockThreshold;
            u.uOutlineMin.value = cz.outlineMin;
            u.uOutlineMax.value = cz.outlineMax;
            u.uNightBrightness.value = cz.nightBrightness;
            u.uDayContrast.value = cz.dayContrast;
            u.uOpacity.value = cz.opacity;
        }
        // Altitude exaggeration — drives every metres-based altitude in the
        // project (terrain, water, clouds, cities, plane bow arcs, atmosphere
        // shell). The slider value is the multiplier; baseline is factor=5
        // (matches the previous hardcoded 1.2e-5 elevation scale).
        const factor = debug.altitude.scaleFactor;
        const elevScale = elevationScaleFromFactor(factor);
        const atmRadius = atmosphereRadiusFromFactor(factor);
        if (globe) {
            globe.uniforms.land.uElevationScale.value = elevScale;
            globe.uniforms.water.uElevationScale.value = elevScale;
        }
        cloudsPass?.setElevationScale(elevScale);
        cities?.setElevationScale(elevScale);
        if (airplanes) {
            airplanes.trails.setElevationScale(elevScale);
            airplanes.scaffold.setElevationScale(elevScale);
            airplanes.heads.setElevationScale(elevScale);
        }
        // Atmosphere — Hillaire 2020 LUT-driven. `rayleighScale` / `mieScale`
        // and `atmosphereRadius` mutate optical-depth integration, so changing
        // any of them re-renders all three LUTs; `exposure` and `sunDiskSize`
        // are runtime-only uniforms.
        const a = debug.materials.atmosphere;
        if (atmosphere) {
            atmosphere.setScales(a.rayleighScale, a.mieScale, atmRadius);
            atmosphere.setExposure(a.exposure);
            atmosphere.setSunDiskAngleDeg(a.sunDiskSize * 3);
        }
        sunMoon.setSunDiskSize(a.sunDiskSize);
    }
    function applyLayers(debug) {
        // Land and water are separate meshes inside `globe.group`. Toggling the
        // parent group on/off would mask both at once, so route each layer flag
        // to its own mesh. The parent stays visible whenever either is on.
        if (globe) {
            globe.group.visible = debug.layers.globe || debug.layers.ocean;
            globe.land.mesh.visible = debug.layers.globe;
            globe.water.mesh.visible = debug.layers.ocean;
        }
        if (atmosphere)
            atmosphere.mesh.visible = debug.layers.atmosphere;
        cloudsPass?.setActive(debug.layers.clouds);
        cities?.setActive(debug.layers.cities);
        if (airplanes) {
            airplanes.setLayerActive('airports', debug.layers.airports);
            airplanes.setLayerActive('scaffold', debug.layers.routeScaffold);
            airplanes.setLayerActive('trails', debug.layers.trails);
            airplanes.setLayerActive('heads', debug.layers.planes);
        }
    }
    function update(deltaSec, debug) {
        if (debug.camera.autoOrbit) {
            if (controls)
                controls.enabled = false;
            orbitAngle += deltaSec * debug.camera.orbitSpeed * Math.PI * 2;
            camera.position.set(Math.cos(orbitAngle) * CAMERA_RADIUS, Math.sin(orbitAngle) * CAMERA_RADIUS, CAMERA_RADIUS * 0.5);
            camera.lookAt(0, 0, 0);
        }
        else {
            if (controls) {
                controls.enabled = true;
                controls.update();
            }
        }
        if (scene.background instanceof THREE.Color) {
            scene.background.set(debug.scene.background);
        }
        debug.pick.lastPick = lastPickRef.value;
        if (!debug.timeOfDay.paused) {
            const next = debug.timeOfDay.t01 + deltaSec * T01_PER_SECOND;
            debug.timeOfDay.t01 = next - Math.floor(next);
        }
        applyMaterials(debug);
        applyTimeOfDay(debug);
        applyLayers(debug);
        // Advance the water clock so the Gerstner waves drift. `applyMaterials`
        // already pushed `waveSpeed`; here we just step `uTime` by real seconds
        // so toggling speed scales an honest second count.
        if (globe) {
            globe.uniforms.water.uTime.value += deltaSec;
        }
        atmosphere?.syncFromCamera(camera);
        cloudsPass?.syncFromCamera(camera);
        cloudsPass?.update(deltaSec);
        if (airplanes) {
            airplanes.setSpeed(debug.airplanes.speed);
            airplanes.setTargetInFlight(debug.airplanes.targetInFlight);
            airplanes.scaffold.setOpacity(debug.airplanes.scaffoldOpacity);
            airplanes.trails.setOpacity(debug.airplanes.trailOpacity);
            // Sun longitude derived from the existing time-of-day knob — same θ
            // formula the lighting uses, so day/night biasing on routes lines up
            // with the rendered terminator.
            const sunTheta = (debug.timeOfDay.t01 - 0.5) * Math.PI * 2;
            airplanes.setSunLonRad(sunTheta);
            airplanes.update(deltaSec);
        }
    }
    function render(deltaSec) {
        // Half-res cloud raymarch — must run BEFORE the main scene render so
        // the composite mesh inside the scene has fresh half-res data when
        // its draw call lands.
        if (cloudsPass && webglRenderer) {
            cloudsPass.renderHalfRes(webglRenderer, camera);
        }
        // When no extra postfx passes are attached the composer is pure
        // overhead — its offscreen target bypasses Mali's tile-MSAA fast path.
        // Render direct to the canvas instead and pick up the WebGLRenderer's
        // built-in MSAA.
        if (postFx && postFx.hasExtraPasses()) {
            postFx.render(deltaSec);
            return;
        }
        if (webglRenderer) {
            webglRenderer.render(scene, camera);
        }
    }
    function resize(width, height) {
        camera.aspect = width / Math.max(1, height);
        camera.updateProjectionMatrix();
        postFx?.setSize(width, height);
        cloudsPass?.setSize(width, height);
        airplanes?.setViewport(width, height);
    }
    function dispose() {
        if (pointerHandler && attachedCanvas) {
            attachedCanvas.removeEventListener('pointerdown', pointerHandler);
        }
        pointerHandler = null;
        attachedCanvas = null;
        globe?.dispose();
        globe = null;
        cloudsPass?.dispose();
        cloudsPass = null;
        cities?.dispose();
        cities = null;
        airplanes?.dispose();
        airplanes = null;
        atmosphere?.dispose();
        atmosphere = null;
        sunMoon.dispose();
        controls?.dispose();
        controls = null;
        postFx?.dispose();
        postFx = null;
        webglRenderer = null;
    }
    return { scene, camera, attachRenderer, attachWorld, update, render, resize, dispose };
}

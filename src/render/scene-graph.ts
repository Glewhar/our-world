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
import { HighwaysLayer } from './highways/HighwaysLayer.js';
import { AirplaneSystem } from './airplanes/AirplaneSystem.js';
import { loadAirplaneData } from './airplanes/data.js';
import { SunMoon } from './sky/SunMoon.js';
import {
  atmosphereRadiusFromFactor,
  elevationScaleFromFactor,
} from './globe/LandMaterial.js';
import type { BodyRecord, WorldRuntime } from '../world/index.js';
import type { DebugState } from '../debug/Tweakpane.js';

const CAMERA_RADIUS = 3.0;
const SUN_TILT_RAD = (23.4 * Math.PI) / 180;
// Full day cycle in 1 / T01_PER_SECOND real seconds. 0.04 → 25 sec/day.
const T01_PER_SECOND = 0.04;

export type SceneGraph = {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  attachRenderer(webglRenderer: THREE.WebGLRenderer): void;
  attachWorld(world: WorldRuntime, canvas: HTMLCanvasElement): void;
  update(deltaSec: number, debug: DebugState): void;
  render(deltaSec: number): void;
  resize(width: number, height: number): void;
  dispose(): void;
};

export function createSceneGraph(): SceneGraph {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#06080c');

  // Z-up matches the data-pipeline's `lonlat_to_xyz` convention end-to-end.
  // Orbit, picking, and shading all stay in this frame — no axis swap.
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.up.set(0, 0, 1);
  camera.position.set(CAMERA_RADIUS, CAMERA_RADIUS * 0.4, CAMERA_RADIUS * 0.5);
  camera.lookAt(0, 0, 0);

  let controls: OrbitControls | null = null;
  let attachedCanvas: HTMLCanvasElement | null = null;
  let webglRenderer: THREE.WebGLRenderer | null = null;
  let postFx: PostFXChain | null = null;

  const sun = new THREE.DirectionalLight(0xfff4d6, 1.0);
  sun.position.set(3, 2, 1.5);
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0x223046, 0.3));

  const sunDirection = new THREE.Vector3().copy(sun.position).normalize();

  // AtmospherePass requires the WebGLRenderer for LUT precompute, so we
  // defer construction until `attachRenderer`.
  let atmosphere: AtmospherePass | null = null;

  let world: WorldRuntime | null = null;
  let globe: Globe | null = null;
  let cloudsPass: VolumetricCloudPass | null = null;
  let highways: HighwaysLayer | null = null;
  let airplanes: AirplaneSystem | null = null;
  const sunMoon = new SunMoon();
  scene.add(sunMoon.group);
  let pointerHandler: ((e: PointerEvent) => void) | null = null;
  let orbitAngle = 0;

  const raycaster = new THREE.Raycaster();
  const tmpVec2 = new THREE.Vector2();
  const tmpSunDir = new THREE.Vector3();

  function attachRenderer(r: THREE.WebGLRenderer): void {
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

  function attachWorld(w: WorldRuntime, canvas: HTMLCanvasElement): void {
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
    if (!webglRenderer) {
      throw new Error('attachWorld called before attachRenderer — Land needs the renderer for the biome-color prebake.');
    }
    globe = new Globe(w, webglRenderer);
    globe.setSunDirection(sunDirection);
    scene.add(globe.group);

    cloudsPass = new VolumetricCloudPass(w);
    cloudsPass.setSunDirection(sunDirection);
    cloudsPass.syncFromCamera(camera);
    cloudsPass.setSize(
      canvas.clientWidth || canvas.width || 1,
      canvas.clientHeight || canvas.height || 1,
    );
    scene.add(cloudsPass.mesh);

    // Highways — merged ribbon mesh wrapping every kept road polyline.
    // Width is in *screen pixels* (Mapbox-style), so the network stays
    // delicate at every zoom. Three kinds (major / arterial / local)
    // each drive their own pixel width + brightness boost. Coastline-
    // clipped via the same HEALPix id raster Land + Clouds use.
    const initW = canvas.clientWidth || canvas.width || 1;
    const initH = canvas.clientHeight || canvas.height || 1;
    highways = new HighwaysLayer(w, w.getRoads());
    highways.setSunDirection(sunDirection);
    highways.setViewportSize(initW, initH);
    scene.add(highways.mesh);

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

    pointerHandler = (event: PointerEvent) => {
      if (!world) return;
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

  function reportPick(w: WorldRuntime, hit: ReturnType<WorldRuntime['pickFromRay']>): void {
    if (!hit) {
      lastPickRef.value = '(no body — click on the globe)';
      console.info('[pick] no body');
      return;
    }
    const body: BodyRecord | null = w.getBody(hit.bodyId);
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

  function applyTimeOfDay(debug: DebugState): void {
    const theta = (debug.timeOfDay.t01 - 0.5) * Math.PI * 2;
    tmpSunDir.set(Math.cos(theta), Math.sin(theta), Math.sin(SUN_TILT_RAD)).normalize();
    sun.position.copy(tmpSunDir).multiplyScalar(3);
    globe?.setSunDirection(tmpSunDir);
    atmosphere?.setSunDirection(tmpSunDir);
    cloudsPass?.setSunDirection(tmpSunDir);
    highways?.setSunDirection(tmpSunDir);
    sunMoon.syncFromCamera(camera, tmpSunDir);
  }

  function applyMaterials(debug: DebugState): void {
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
      land.uLerpStrength.value.set(
        m.lerpStrengthFire,
        m.lerpStrengthIce,
        m.lerpStrengthInfection,
        m.lerpStrengthPollution,
      );
      land.uBiomeStrength.value = m.biomeStrength;
      land.uSnowLineStrength.value = m.snowLineStrength;
      land.uSeasonOffsetC.value = m.seasonOffsetC;
      land.uAlpineStrength.value = m.alpineStrength;

      // Distance-field knobs — coast smoothstep half-width and biome
      // edge fade distance, both in km.
      land.uCoastSharpness.value = m.coastSharpness;
      land.uBiomeEdgeSharpness.value = m.biomeEdgeSharpness;

      // Biome surface variation. Master = 0 → identical to pre-feature look.
      land.uBiomeSurfaceStrength.value = m.biomeSurfaceStrength;
      land.uBiomeColorVar.value = m.biomeColorVar;
      land.uBiomeBumpStrength.value = m.biomeBumpStrength;
      land.uBiomeNoiseFreq.value = m.biomeNoiseFreq;
      const amps = land.uBiomeSurfaceAmps.value;
      for (let i = 0; i < 12; i++) {
        amps[i] = m.biomeSurfaceAmps[i] ?? amps[i]!;
      }

      land.uSpecularStrength.value = m.specularStrength;
      const specAmps = land.uBiomeSpecAmps.value;
      for (let i = 0; i < 12; i++) {
        specAmps[i] = m.biomeSpecAmps[i] ?? specAmps[i]!;
      }

      // Ocean colours + Gerstner knobs live on the dedicated water material.
      // Time is advanced separately in `update()`; this hook only pushes
      // Tweakpane-driven uniforms.
      const o = debug.materials.ocean;
      const water = globe.uniforms.water;
      water.uAmbient.value = m.ambient;
      water.uNightTint.value.set(m.nightTint);
      water.uOceanAbyssal.value.set(o.abyssalColor);
      water.uOceanDeep.value.set(o.deepColor);
      water.uOceanShelf.value.set(o.shelfColor);
      water.uOceanShallow.value.set(o.shallowColor);
      water.uOceanTrenchStart.value = o.trenchStart;
      water.uOceanTrenchEnd.value = o.trenchEnd;
      water.uCoastalTintColor.value.set(o.coastalTintColor);
      water.uCoastalTintStrength.value = o.coastalTintStrength;
      water.uCoastalTintFalloff.value = o.coastalTintFalloff;
      water.uWaveAmplitude.value = o.waveAmplitude;
      water.uWaveSpeed.value = o.waveSpeed;
      water.uWaveSteepness.value = o.waveSteepness;
      water.uFresnelStrength.value = o.fresnelStrength;
      water.uDepthFalloff.value = o.depthFalloff;
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

    // Zoom-fade factor for highways. Camera position length to the origin
    // is the globe-centre distance (globe is at world 0). tFar = 0 at
    // camera distance ≤ 1.5 (zoomed in), 1 at ≥ 15 (zoomed out).
    const camDist = camera.position.length();
    const tFar = THREE.MathUtils.smoothstep(camDist, 1.5, 15);

    if (highways) {
      const hz = debug.materials.highways;
      const u = highways.uniforms;
      u.uMajorWidthPx.value = hz.majorWidthPx;
      u.uArterialWidthPx.value = hz.arterialWidthPx;
      u.uLocalWidthPx.value = hz.localWidthPx;
      u.uNightBrightness.value = hz.nightBrightness;
      u.uMajorBoost.value = hz.majorBoost;
      u.uArterialBoost.value = hz.arterialBoost;
      u.uLocalBoost.value = hz.localBoost;
      u.uCoreWidth.value = hz.coreWidth;
      u.uCoreBoost.value = hz.coreBoost;
      u.uHaloStrength.value = hz.haloStrength;
      u.uHaloFalloff.value = hz.haloFalloff;
      u.uDayStrength.value = hz.dayStrength;
      u.uOpacity.value = THREE.MathUtils.lerp(hz.opacityNear, hz.opacityFar, tFar);
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
    highways?.setElevationScale(elevScale);
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

      // Share the atmosphere's sky-view LUT with land + water so the
      // in-shader aerial perspective tint colour-matches the rim halo.
      // The LUT rebakes on sun/camera change inside AtmospherePass; the
      // texture reference itself stays stable, so this assignment is a
      // no-op after the first frame — left in the loop for clarity and
      // to survive any future LUT swap.
      if (globe) {
        globe.uniforms.land.uSkyView.value = atmosphere.skyViewTexture;
        globe.uniforms.land.uHazeExposure.value = a.exposure;
        globe.uniforms.land.uHazeAmount.value = a.hazeAmount;
        globe.uniforms.water.uSkyView.value = atmosphere.skyViewTexture;
        globe.uniforms.water.uHazeExposure.value = a.exposure;
        globe.uniforms.water.uHazeAmount.value = a.hazeAmount;
      }
    }
    sunMoon.setSunDiskSize(a.sunDiskSize);
  }

  function applyLayers(debug: DebugState): void {
    // Land and water are separate meshes inside `globe.group`. Toggling the
    // parent group on/off would mask both at once, so route each layer flag
    // to its own mesh. The parent stays visible whenever either is on.
    if (globe) {
      globe.group.visible = debug.layers.globe || debug.layers.ocean;
      globe.land.mesh.visible = debug.layers.globe;
      globe.water.mesh.visible = debug.layers.ocean;
    }
    if (atmosphere) atmosphere.mesh.visible = debug.layers.atmosphere;
    cloudsPass?.setActive(debug.layers.clouds);
    highways?.setActive(debug.layers.highways);
    if (airplanes) {
      airplanes.setLayerActive('airports', debug.layers.airports);
      airplanes.setLayerActive('scaffold', debug.layers.routeScaffold);
      airplanes.setLayerActive('trails', debug.layers.trails);
      airplanes.setLayerActive('heads', debug.layers.planes);
    }
  }

  function update(deltaSec: number, debug: DebugState): void {
    if (debug.camera.autoOrbit) {
      if (controls) controls.enabled = false;
      orbitAngle += deltaSec * debug.camera.orbitSpeed * Math.PI * 2;
      camera.position.set(
        Math.cos(orbitAngle) * CAMERA_RADIUS,
        Math.sin(orbitAngle) * CAMERA_RADIUS,
        CAMERA_RADIUS * 0.5,
      );
      camera.lookAt(0, 0, 0);
    } else {
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

    // When paused, freeze every time-driven system (waves, clouds, planes)
    // by feeding them a zero delta. Camera + opacity sliders still apply.
    const simDelta = debug.timeOfDay.paused ? 0 : deltaSec;

    applyMaterials(debug);
    applyTimeOfDay(debug);
    applyLayers(debug);

    // Advance the water clock so the Gerstner waves drift. `applyMaterials`
    // already pushed `waveSpeed`; here we just step `uTime` by real seconds
    // so toggling speed scales an honest second count.
    if (globe) {
      globe.uniforms.water.uTime.value += simDelta;
    }

    atmosphere?.syncFromCamera(camera);
    cloudsPass?.syncFromCamera(camera);
    cloudsPass?.update(simDelta);

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
      airplanes.update(simDelta);
    }
  }

  function render(deltaSec: number): void {
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

  function resize(width: number, height: number): void {
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
    postFx?.setSize(width, height);
    cloudsPass?.setSize(width, height);
    airplanes?.setViewport(width, height);
    highways?.setViewportSize(width, height);
  }

  function dispose(): void {
    if (pointerHandler && attachedCanvas) {
      attachedCanvas.removeEventListener('pointerdown', pointerHandler);
    }
    pointerHandler = null;
    attachedCanvas = null;
    globe?.dispose();
    globe = null;
    cloudsPass?.dispose();
    cloudsPass = null;
    highways?.dispose();
    highways = null;
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

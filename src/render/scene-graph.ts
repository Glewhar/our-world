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
 * Time / calendar:
 *   For the data contract — which fields exist, which are canonical vs
 *   derived, and the day/month/year rate — see `DebugState.timeOfDay`
 *   in debug/Tweakpane.ts. This file is responsible for the writes:
 *
 *     1. Each unpaused frame, the tick loop advances `totalDays` by
 *        `deltaSec * T01_PER_SECOND`. T01_PER_SECOND = 0.04 → 25 sec
 *        per in-game day, 5 min per in-game year.
 *     2. Immediately after, in the SAME tick, t01 / timeOfYear01 /
 *        yearsElapsed are recomputed from `totalDays` so they stay
 *        consistent for downstream consumers (applyTimeOfDay, the
 *        top-left clock + date readout in main.ts, future game logic).
 *        The year wrap is `Math.floor(totalDays / 12)` — mathematically
 *        unmissable, no float drift.
 *     3. `applyTimeOfDay` then reads the derived fields to set the sun:
 *        longitude θ from `t01` (Math.cos/sin), declination from
 *        `timeOfYear01` (a sinusoid modulated by MAX_SUN_TILT_RAD and
 *        YEAR_PHASE_OFFSET so timeOfYear01 ≈ 0 → January → southern
 *        hemisphere summer).
 *
 *   The top-left clock in index.html drives `t01` via drag; main.ts
 *   translates that drag into a rewrite of `totalDays`'s fractional
 *   part (preserving the integer day count) so scrubbing the dial
 *   never bumps the month or year.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { Globe } from './globe/Globe.js';
import { AtmospherePass } from './atmosphere/AtmospherePass.js';
import { PostFXChain } from './postfx/PostFXChain.js';
import { FxaaPass } from './postfx/FxaaPass.js';
import { VolumetricCloudPass } from './clouds/VolumetricCloudPass.js';
import { HighwaysLayer } from './highways/HighwaysLayer.js';
import { AirplaneSystem } from './airplanes/AirplaneSystem.js';
import { loadAirplaneData } from './airplanes/data.js';
import { SunMoon } from './sky/SunMoon.js';
import { CitiesLayer } from './cities/CitiesLayer.js';
import { UrbanDetailLayer } from './urban/UrbanDetailLayer.js';
import { BlastSystem } from './effects/nuclear/BlastSystem.js';
import { DEFAULT_NUCLEAR_CONFIG } from '../world/scenarios/handlers/NuclearScenario.config.js';
import {
  ATMOSPHERE_TOP_KM,
  atmosphereRadiusFromFactor,
  elevationScaleFromFactor,
} from './globe/LandMaterial.js';
import type { BodyRecord, WorldRuntime } from '../world/index.js';
import type { DebugState } from '../debug/Tweakpane.js';
import { DEFAULTS } from '../debug/defaults.js';

const CAMERA_RADIUS = 3.0;
// Maximum solar declination — Earth's axial tilt. The per-frame declination
// is a sinusoid of `timeOfDay.timeOfYear01`: +MAX at the June solstice,
// -MAX at the December solstice, 0 at the equinoxes.
const MAX_SUN_TILT_RAD = (23.4 * Math.PI) / 180;
// Phase offset so that timeOfYear01=0 ≈ Jan 1, peak (+23.4°) lands at June 21.
// June 21 is day 172/365 ≈ 0.471; sin peaks when its argument is π/2, so
// 2π × (0.471 - phase) = π/2 → phase ≈ 0.221.
const YEAR_PHASE_OFFSET = 0.221;
// Rate at which `totalDays` advances per real second while unpaused.
// 0.04 → one in-game day every 25 sec → one in-game year every 5 min.
// Bumping this scales the whole calendar (day, month, year) proportionally.
const T01_PER_SECOND = 0.04;

export type SceneGraph = {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  attachRenderer(webglRenderer: THREE.WebGLRenderer): void;
  attachWorld(world: WorldRuntime, canvas: HTMLCanvasElement): void;
  update(deltaSec: number, debug: DebugState): void;
  render(deltaSec: number): void;
  resize(width: number, height: number): void;
  detonateAt(
    direction: THREE.Vector3,
    elevationM: number,
    wind: { u: number; v: number } | null,
    sizeKm: number,
  ): void;
  /**
   * Frame-accumulated climate contribution from ScenarioRegistry. Owned by
   * main.ts: call once per frame BEFORE `update()` so `applyMaterials` reads
   * a fresh value. Default `{tempC:0, seaLevelM:0}` keeps the shader visually
   * identical when no climate scenario is active.
   */
  setClimateFrame(frame: { tempC: number; seaLevelM: number }): void;
  /**
   * Per-cell biome-override textures from AttributeTextures. Both null
   * until a climate scenario fires. The land shader gates the override
   * pass by `uClimateEnvelope > 0` and the per-cell stamp weight, so a
   * lingering reference is a safe no-op when envelope is 0.
   */
  setBiomeOverrideTextures(
    classTex: THREE.DataTexture | null,
    stampTex: THREE.DataTexture | null,
  ): void;
  /**
   * Per-slot climate envelopes in [0, 1]. Pushed each frame from
   * `ScenarioRegistry.getClimateEnvelopes()`. The land shader's two
   * override slots (`uClimateEnvelope` / `uClimateEnvelopeB`)
   * multiply each by their own baked stamp-weight channel for an
   * independent crossfade.
   */
  setClimateEnvelopes(envelopes: [number, number]): void;
  /**
   * Per-slot seafloor frame from `ScenarioRegistry.getSeafloorFrame()`.
   * The LAND shader's seafloor branch crossfades each shelf biome's
   * default palette toward the scenario-supplied colours by the
   * per-slot envelope weight. No active climate scenario → both
   * weights stay 0 and the default palette paints unchanged.
   */
  setSeafloorFrame(frame: {
    paletteA: [
      { r: number; g: number; b: number },
      { r: number; g: number; b: number },
      { r: number; g: number; b: number },
    ];
    paletteB: [
      { r: number; g: number; b: number },
      { r: number; g: number; b: number },
      { r: number; g: number; b: number },
    ];
    weightA: number;
    weightB: number;
  }): void;
  /**
   * Cloud frame contribution from the scenario registry — nuclear-winter
   * soot overcast tint + regional cover bump. Zero everywhere on cold
   * boot; updated each frame by main.ts.
   */
  setCloudFrame(frame: {
    sootGlobal: number;
    sootRegionalWeight: number;
    sootSunTint: { r: number; g: number; b: number };
    sootAmbientTint: { r: number; g: number; b: number };
  }): void;
  /**
   * Per-frame destruction frame from `ScenarioRegistry.getDestructionFrame()`.
   * Pushes the polygon flip mask + flooded sea-level threshold + envelope
   * into the cities + highways layers; both layers gate per-fragment
   * destruction on the GPU. Mask setter compares against the previously
   * uploaded bytes and skips the GPU upload when unchanged.
   */
  setDestructionFrame(frame: {
    polyFlipMask: Uint8Array | null;
    seaLevelM: number;
    intensity: number;
  }): void;
  /**
   * Scale the airplane respawn target (0..1). Default is 1 (normal).
   * Nuclear War sets to 0 after day 1 to stop new spawns; existing
   * planes finish their current flight cycle.
   */
  setAirplaneSpawnScale(scale: number): void;
  dispose(): void;
};

export function createSceneGraph(): SceneGraph {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

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

  // Slightly warm sun. The shader's day term is `base × uSunColor`, so any
  // channel of `sun.color × sun.intensity` that exceeds 1.0 will overdrive
  // snow past the white point and tilt it toward the warm side — keep the
  // product ≤ 1.0 per channel.
  const sun = new THREE.DirectionalLight(DEFAULTS.scene.sunLightColor, 1.0);
  sun.position.set(3, 2, 1.5);
  scene.add(sun);

  const sunDirection = new THREE.Vector3().copy(sun.position).normalize();

  // AtmospherePass requires the WebGLRenderer for LUT precompute, so we
  // defer construction until `attachRenderer`.
  let atmosphere: AtmospherePass | null = null;

  let world: WorldRuntime | null = null;
  let globe: Globe | null = null;
  let cloudsPass: VolumetricCloudPass | null = null;
  let highways: HighwaysLayer | null = null;
  let cities: CitiesLayer | null = null;
  let urbanDetail: UrbanDetailLayer | null = null;
  let airplanes: AirplaneSystem | null = null;
  const sunMoon = new SunMoon();
  scene.add(sunMoon.group);
  // Single shared-mesh particle system carries up to MAX_CONCURRENT_BLASTS
  // simultaneous detonations in one draw call. Per-blast state (quaternion,
  // origin, per-strike scale, wind, particles, splines) lives in BlastSlot
  // records inside the system. One scene-add, one update, one draw call.
  const blastSystem = new BlastSystem(camera, DEFAULT_NUCLEAR_CONFIG);
  scene.add(blastSystem.mesh);
  let pointerHandler: ((e: PointerEvent) => void) | null = null;

  const raycaster = new THREE.Raycaster();
  const tmpVec2 = new THREE.Vector2();
  const tmpSunDir = new THREE.Vector3();
  const tmpCameraDir = new THREE.Vector3();
  // Reusable 20-entry palette buffer fed to BiomeColorEquirect each frame.
  // Allocated once so the per-frame palette sync stays GC-free. Length
  // tracks `defaults.ts:biomePalette` — bumped to 20 to cover the three
  // synthetic shelf biomes (16/17/18) and wasteland (19); BiomeColorEquirect
  // ignores 16..19 since shelf cells have no polygon and wasteland is
  // uniform-driven, but the array length must still match.
  const paletteColors: THREE.Color[] = Array.from({ length: 20 }, () => new THREE.Color());
  // Last css string per palette slot — skip `.set(css)` when unchanged so we
  // don't re-parse a hex string 20×/frame.
  const paletteCssCache: (string | null)[] = Array.from({ length: 20 }, () => null);

  // Reusable tuning packets fed to BlastSystem each frame. Mutated in place
  // (both setters read fields immediately or store the reference for
  // detonate-time reads) so the per-frame nuclear handoff stays GC-free.
  const liveTuning = {
    worldScale: 0,
    timeScale: 0,
    spriteScale: 0,
    windStrength: 0,
    windDelay: 0,
    windRamp: 0,
    windJitter: 0,
    windDrag: 0,
  };
  const detonateTuning = {
    enables: {
      fire: false,
      smoke: false,
      mushroom: false,
      mushroomFire: false,
      columnFire: false,
      columnSmoke: false,
    },
    mushroomHeightScale: 0,
    columnHeightScale: 0,
    fireColorStart: 0,
    fireColorEnd: 0,
    smokeColorStart: 0,
    smokeColorEnd: 0,
  };
  // CSS-hex → packed hex cache. Tweakpane hands us a small set of distinct
  // hex strings; parsing each one through `new THREE.Color(css).getHex()`
  // every frame allocates and walks the css parser. Lookup is O(1).
  const cssHexCache = new Map<string, number>();
  const cssParseColor = new THREE.Color();
  function cssToHex(css: string): number {
    let hex = cssHexCache.get(css);
    if (hex === undefined) {
      hex = cssParseColor.set(css).getHex();
      cssHexCache.set(css, hex);
    }
    return hex;
  }

  // Stashed by the consolidator (main.ts) ahead of each `update()`. The
  // climate frame is the per-tick contribution from ScenarioRegistry
  // (warming / ice-age accumulator); the override textures carry the
  // per-cell biome rewrite from AttributeTextures. Defaults are neutral so
  // the shader compiles and renders identically when nothing has pushed
  // yet (cold start, no climate scenario active).
  let stashedClimateFrame: { tempC: number; seaLevelM: number } = { tempC: 0, seaLevelM: 0 };
  let stashedOverrideTex: THREE.DataTexture | null = null;
  let stashedOverrideStampTex: THREE.DataTexture | null = null;
  const stashedClimateEnvelopes: [number, number] = [0, 0];
  // Per-slot seafloor frame stash. Mirrors `stashedClimateFrame` —
  // main.ts calls `setSeafloorFrame(registry.getSeafloorFrame())` once
  // per tick and `applyMaterials` copies the values into the LAND
  // shader uniforms. Defaults zero so the no-scenario path paints the
  // default palette unchanged.
  type StashedSeafloorFrame = {
    paletteA: [
      { r: number; g: number; b: number },
      { r: number; g: number; b: number },
      { r: number; g: number; b: number },
    ];
    paletteB: [
      { r: number; g: number; b: number },
      { r: number; g: number; b: number },
      { r: number; g: number; b: number },
    ];
    weightA: number;
    weightB: number;
  };
  let stashedSeafloorFrame: StashedSeafloorFrame = {
    paletteA: [
      { r: 0, g: 0, b: 0 },
      { r: 0, g: 0, b: 0 },
      { r: 0, g: 0, b: 0 },
    ],
    paletteB: [
      { r: 0, g: 0, b: 0 },
      { r: 0, g: 0, b: 0 },
      { r: 0, g: 0, b: 0 },
    ],
    weightA: 0,
    weightB: 0,
  };
  // Scratch THREE.Color reused by the seafloor-default uniform push so
  // the per-frame palette parse stays GC-free.
  const seafloorDefaultScratch = new THREE.Color();
  let stashedCloudFrame: {
    sootGlobal: number;
    sootRegionalWeight: number;
    sootSunTint: { r: number; g: number; b: number };
    sootAmbientTint: { r: number; g: number; b: number };
  } = {
    sootGlobal: 0,
    sootRegionalWeight: 0,
    sootSunTint: { r: 1, g: 1, b: 1 },
    sootAmbientTint: { r: 1, g: 1, b: 1 },
  };
  /** Scenario-driven airplane respawn multiplier (default 1). */
  let airplaneSpawnScale = 1;

  // Wiring contract (main.ts): each rAF tick, right after `scenarioRegistry.tick()`,
  // call `setClimateFrame(registry.getClimateFrame())`,
  // `setBiomeOverrideTextures(world.getBiomeOverrideTexture(),
  //  world.getBiomeOverrideStampTexture())`, and
  // `setClimateEnvelopes(registry.getClimateEnvelopes())` so `applyMaterials`
  // reads fresh values.
  function setClimateFrame(frame: { tempC: number; seaLevelM: number }): void {
    stashedClimateFrame = frame;
  }
  function setBiomeOverrideTextures(
    classTex: THREE.DataTexture | null,
    stampTex: THREE.DataTexture | null,
  ): void {
    stashedOverrideTex = classTex;
    stashedOverrideStampTex = stampTex;
  }
  function setClimateEnvelopes(envelopes: [number, number]): void {
    stashedClimateEnvelopes[0] = envelopes[0];
    stashedClimateEnvelopes[1] = envelopes[1];
  }
  function setSeafloorFrame(frame: StashedSeafloorFrame): void {
    stashedSeafloorFrame = frame;
  }
  function setCloudFrame(frame: {
    sootGlobal: number;
    sootRegionalWeight: number;
    sootSunTint: { r: number; g: number; b: number };
    sootAmbientTint: { r: number; g: number; b: number };
  }): void {
    stashedCloudFrame = frame;
  }
  function setAirplaneSpawnScale(scale: number): void {
    airplaneSpawnScale = Math.max(0, scale);
  }
  function setDestructionFrame(frame: {
    polyFlipMask: Uint8Array | null;
    seaLevelM: number;
    intensity: number;
  }): void {
    if (frame.polyFlipMask) {
      cities?.setPolyFlipMask(frame.polyFlipMask);
      highways?.setPolyFlipMask(frame.polyFlipMask);
    }
    cities?.setDestructionSeaLevel(frame.seaLevelM);
    cities?.setDestructionIntensity(frame.intensity);
    highways?.setDestructionSeaLevel(frame.seaLevelM);
    highways?.setDestructionIntensity(frame.intensity);
  }

  function attachRenderer(r: THREE.WebGLRenderer): void {
    webglRenderer = r;
    postFx = new PostFXChain(r, scene, camera);
    // Replace WebGLRenderer MSAA (now off) with a single fullscreen FXAA pass.
    // Cheap on tile-based mobile GPUs; keeps the composer path active.
    postFx.addPass(new FxaaPass());
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
    controls.enableDamping = false;
    controls.minDistance = 1.2;
    controls.maxDistance = 15;
    controls.target.set(0, 0, 0);
    controls.enablePan = false;

    // Globe owns two separate icosphere meshes — land (vertex-displaced by
    // `elevation_meters`, discard below sea level) and water (gerstner +
    // depth tint at `uSeaLevelOffsetM`). Attribute texture bindings happen
    // inside each mesh's constructor.
    if (!webglRenderer) {
      throw new Error('attachWorld called before attachRenderer — Land needs the renderer for the elevation-equirect prebake.');
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
    // The layer is now a Group of per-bucket meshes; renderOrder lives on
    // each bucket's Mesh (set inside the layer) so transparent sort still
    // honours it. The Group itself is just a container.
    scene.add(highways.group);

    // Urban-area layers: far-LOD polygon-shape glow (CitiesLayer) +
    // near-LOD procedural streets/buildings (UrbanDetailLayer). The two
    // are zoom-faded by `applyMaterials` — glow is full at globe view
    // and fades out as the camera approaches; the detail layer is the
    // mirror.
    const urbans = w.getUrbanAreas();
    cities = new CitiesLayer(w, urbans);
    cities.setSunDirection(sunDirection);
    // Render before the cloud raymarch so cloud cover occludes city glow
    // instead of cities shining through. Matches the highways pattern.
    // renderOrder is set on each bucket Mesh inside the layer.
    scene.add(cities.group);

    urbanDetail = new UrbanDetailLayer(w, urbans);
    urbanDetail.setSunDirection(sunDirection);
    scene.add(urbanDetail.group);

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
    const theta = -(debug.timeOfDay.t01 - 0.5) * Math.PI * 2;
    const declRad =
      MAX_SUN_TILT_RAD *
      Math.sin((debug.timeOfDay.timeOfYear01 - YEAR_PHASE_OFFSET) * Math.PI * 2);
    const cosDecl = Math.cos(declRad);
    tmpSunDir
      .set(Math.cos(theta) * cosDecl, Math.sin(theta) * cosDecl, Math.sin(declRad))
      .normalize();
    sun.position.copy(tmpSunDir).multiplyScalar(3);
    globe?.setSunDirection(tmpSunDir);
    // Push `sun.color × sun.intensity` as `uSunColor` so any tweak to the
    // directional light flows to the shader. Keep the product ≤ 1.0 per
    // channel — anything above clamps and tints snow warm.
    const sr = sun.color.r * sun.intensity;
    const sg = sun.color.g * sun.intensity;
    const sb = sun.color.b * sun.intensity;
    if (globe) {
      globe.uniforms.land.uSunColor.value.set(sr, sg, sb);
      globe.uniforms.water.uSunColor.value.set(sr, sg, sb);
    }
    atmosphere?.setSunDirection(tmpSunDir);
    cloudsPass?.setSunDirection(tmpSunDir);
    highways?.setSunDirection(tmpSunDir);
    cities?.setSunDirection(tmpSunDir);
    urbanDetail?.setSunDirection(tmpSunDir);
    sunMoon.syncFromCamera(camera, tmpSunDir);
  }

  function applyMaterials(debug: DebugState): void {
    const m = debug.materials.globe;
    if (globe) {
      // Tweakpane "Globe" bindings drive the land mesh; "Ocean" bindings
      // drive the water mesh. Ambient is shared, but the night tint is
      // pushed straight to land and scaled down for water — keeps the
      // ocean near-black at night so the (brighter-based) continents pop
      // above it, NASA Black Marble style, while one slider still drives
      // both.
      const land = globe.uniforms.land;
      land.uAmbient.value = m.ambient;
      land.uNightTint.value.set(m.nightTint);
      land.uMoonColor.value.set(m.moonColor);
      land.uMoonIntensity.value = m.moonIntensity;
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
      land.uSnowLineStrength.value = m.snowLineStrength;
      // Live land-tint colours. These all back uniforms that previously only
      // got their value from DEFAULTS at material construction. Tweakpane now
      // owns them — the per-frame push here turns the colour pickers into
      // live edits.
      land.uAlpineBareColor.value.set(m.alpineBareColor);
      land.uColdToneColor.value.set(m.coldToneColor);
      land.uHotDryColor.value.set(m.hotDryColor);
      land.uSpecularTintWarm.value.set(m.specularTintWarm);
      land.uSpecularTintCool.value.set(m.specularTintCool);
      land.uMoonReflectanceBase.value.set(m.moonReflectanceBase);
      // Sun-locked seasonal swing in the land shader keys off the same
      // `timeOfYear01` calendar fraction that drives the sun declination
      // in `applyTimeOfDay`, so north winter / south summer line up with
      // the rendered terminator.
      land.uTimeOfYear01.value = debug.timeOfDay.timeOfYear01;
      // Climate-scenario frame contribution. Stashed by main.ts before
      // each tick; defaults to {0,0} when no climate scenario is active.
      land.uClimateTempDeltaC.value = stashedClimateFrame.tempC;
      land.uBiomeOverrideTex.value = stashedOverrideTex;
      land.uBiomeOverrideStamp.value = stashedOverrideStampTex;
      land.uClimateEnvelope.value = stashedClimateEnvelopes[0];
      land.uClimateEnvelopeB.value = stashedClimateEnvelopes[1];
      land.uAlpineStrength.value = m.alpineStrength;

      // Biome palette → blurred colour equirects. Both Land sub-objects
      // own their own dirty-bits; we feed them the live palette + blur
      // slider and they re-bake only when something has actually changed.
      // The land shader reads the baked base colour and the baked override
      // (RGB + stamp weight) with one bilinear tap each.
      for (let i = 0; i < paletteColors.length; i++) {
        const css = m.biomePalette[i];
        if (css && paletteCssCache[i] !== css) {
          paletteColors[i]!.set(css);
          paletteCssCache[i] = css;
        }
      }
      if (webglRenderer) {
        // Live blur sigmas — slider value × 375 px. Defaults: biome 0.08
        // → σ = 30 px on the 8192-wide grid; mountain/snow 0.04 → σ = 15
        // px on the 4096-wide grid; seafloor 0.4 → σ = 150 px on the
        // 4096-wide grid. Bakers only re-run when sigma actually moves.
        const biomeSigma = m.biomeBlur * 375;
        const mountainSigma = m.mountainBlur * 375;
        const snowSigma = m.snowBlur * 375;
        const seafloorSigma = m.seafloorBlur * 375;
        globe.land.biomeColor.setSigmaPx(biomeSigma);
        globe.land.biomeOverride.setSigmaPx(biomeSigma);
        globe.land.biomeOverrideB.setSigmaPx(biomeSigma);
        globe.land.mountain.setSigmaPx(mountainSigma);
        globe.land.snow.setSigmaPx(snowSigma);
        globe.land.seafloorColor.setSigmaPx(seafloorSigma);
        globe.land.biomeColor.rebuildIfDirty(webglRenderer, paletteColors, {
          biomePalette: m.biomePalette,
          realmTint: m.realmTint,
          ecoregionJitter: m.ecoregionJitter,
        });
        // Same dirty-bit dance for the climate-scenario override equirect.
        // Re-bakes when override textures change (scenario start/end) or
        // when the palette changes. The LAND shader gates this path by
        // uClimateEnvelope > 0, so a re-bake with stamp-weight = 0 every-
        // where (no scenario) is harmless.
        globe.land.biomeOverride.rebuildIfDirty(webglRenderer, paletteColors);
        globe.land.biomeOverrideB.rebuildIfDirty(webglRenderer, paletteColors);
        globe.land.mountain.rebuildIfDirty(webglRenderer);
        globe.land.snow.rebuildIfDirty(webglRenderer);
        // Seafloor frame — CPU-mix the live default palette with the
        // stashed scenario palettes/weights inside the baker. Hash-based
        // dirty bit keeps the re-bake to one per genuine colour change.
        const sf = m.seafloorPalette;
        seafloorDefaultScratch.set(sf.polar);
        const defPolar = { r: seafloorDefaultScratch.r, g: seafloorDefaultScratch.g, b: seafloorDefaultScratch.b };
        seafloorDefaultScratch.set(sf.temperate);
        const defTemperate = { r: seafloorDefaultScratch.r, g: seafloorDefaultScratch.g, b: seafloorDefaultScratch.b };
        seafloorDefaultScratch.set(sf.equatorial);
        const defEquatorial = { r: seafloorDefaultScratch.r, g: seafloorDefaultScratch.g, b: seafloorDefaultScratch.b };
        globe.land.seafloorColor.setFrame({
          defaultPolar: defPolar,
          defaultTemperate: defTemperate,
          defaultEquatorial: defEquatorial,
          scenarioAPolar: stashedSeafloorFrame.paletteA[0],
          scenarioATemperate: stashedSeafloorFrame.paletteA[1],
          scenarioAEquatorial: stashedSeafloorFrame.paletteA[2],
          scenarioBPolar: stashedSeafloorFrame.paletteB[0],
          scenarioBTemperate: stashedSeafloorFrame.paletteB[1],
          scenarioBEquatorial: stashedSeafloorFrame.paletteB[2],
          weightA: stashedSeafloorFrame.weightA,
          weightB: stashedSeafloorFrame.weightB,
        });
        globe.land.seafloorColor.rebuildIfDirty(webglRenderer);
      }
      land.uLandSpecularSmoothness.value = m.landSpecularSmoothness;
      land.uSpecularStrength.value = m.specularStrength;

      // Wasteland tint uniforms — pushed every frame so Tweakpane edits
      // land immediately. The texture itself is set once in Land.ts.
      const s = debug.scenarios;
      land.uWastelandColor.value.set(s.wastelandColor);
      land.uWastelandDesaturate.value = s.wastelandDesaturate;
      land.uWastelandStrength.value = s.wastelandStrength;

      // Ocean colours + Gerstner knobs live on the dedicated water material.
      // Time is advanced separately in `update()`; this hook only pushes
      // Tweakpane-driven uniforms.
      const o = debug.materials.ocean;
      const water = globe.uniforms.water;
      water.uAmbient.value = m.ambient;
      water.uNightTint.value.set(m.nightTint).multiplyScalar(0.35);
      water.uMoonColor.value.set(m.moonColor);
      water.uMoonIntensity.value = m.moonIntensity;
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
      water.uCurrentTintEnabled.value = o.currentTintEnabled ? 1 : 0;
      water.uShowMediumCurrents.value = o.showMediumCurrents ? 1 : 0;
      water.uShimmerCurrentDrift.value = o.shimmerCurrentDrift;
      // Live ocean tint colours — Tweakpane-owned, previously frozen at
      // material construction. Drives the cool current cast, sun-glint
      // sparkle, and grazing-angle sky reflection respectively.
      water.uCurrentTintColor.value.set(o.currentTintColor);
      water.uSunGlintColor.value.set(o.sunGlintColor);
      water.uSkyTintColor.value.set(o.skyTintColor);
      // Composed sea level = slider + climate-scenario accumulator.
      // Land mesh + water mesh + atmosphere shell all read the same
      // value below so the three surfaces stay in vertical sync as a
      // warming/ice-age scenario shifts the ocean up or down.
      const finalSeaLevelM = o.seaLevelOffsetM + stashedClimateFrame.seaLevelM;
      water.uSeaLevelOffsetM.value = finalSeaLevelM;
      // Mirror the sea-level slider on the land material so the
      // fragment shader can reclassify cells as exposed (baked-ocean
      // now above water) or drowned (baked-land now below water).
      land.uSeaLevelOffsetM.value = finalSeaLevelM;
    }

    if (cloudsPass) {
      const c = debug.materials.clouds;
      cloudsPass.setDensity(c.density);
      // Soot stacks an additive bump onto the Tweakpane coverage so the
      // panel slider stays the baseline of truth (no clobbering on rebind).
      cloudsPass.setCoverage(c.coverage + stashedCloudFrame.sootGlobal * 0.5);
      cloudsPass.setBeer(c.beer);
      cloudsPass.setHenyey(c.henyey);
      cloudsPass.setAdvection(c.advection);
      cloudsPass.setSunColor(c.sunColor);
      cloudsPass.setAmbientColor(c.ambientColor);
      cloudsPass.setSootFrame(
        stashedCloudFrame.sootGlobal,
        stashedCloudFrame.sootRegionalWeight,
        stashedCloudFrame.sootSunTint,
        stashedCloudFrame.sootAmbientTint,
      );
    }

    // Zoom-fade factor for highways. Camera position length to the origin
    // is the globe-centre distance (globe is at world 0). tFar = 0 at
    // camera distance ≤ 1.2 (zoomed in), 1 at ≥ 5 (zoomed out).
    const camDist = camera.position.length();
    const tFar = THREE.MathUtils.smoothstep(camDist, 1.2, 5);

    if (highways) {
      const hz = debug.materials.highways;
      const u = highways.uniforms;
      u.uMajorWidthPx.value = hz.majorWidthPx;
      u.uArterialWidthPx.value = hz.arterialWidthPx;
      u.uLocalWidthPx.value = hz.localWidthPx;
      u.uLocal2WidthPx.value = hz.local2WidthPx;
      u.uNightBrightness.value = hz.nightBrightness;
      u.uMajorBoost.value = hz.majorBoost;
      u.uArterialBoost.value = hz.arterialBoost;
      u.uLocalBoost.value = hz.localBoost;
      u.uLocal2Boost.value = hz.local2Boost;
      u.uCoreWidth.value = hz.coreWidth;
      u.uCoreBoost.value = hz.coreBoost;
      u.uHaloStrength.value = hz.haloStrength;
      u.uHaloFalloff.value = hz.haloFalloff;
      u.uDayStrength.value = hz.dayStrength;
      u.uDayCasingPx.value = hz.dayCasingPx;
      u.uDayCasingStrength.value = hz.dayCasingStrength;
      u.uDayFillBrightness.value = hz.dayFillBrightness;
      u.uDayFillScale.value = hz.dayFillScale;
      u.uOpacity.value = THREE.MathUtils.lerp(hz.opacityNear, hz.opacityFar, tFar);
      (u.uNightColor.value as THREE.Color).set(hz.nightColor);
      (u.uDayCasingColor.value as THREE.Color).set(hz.dayCasingColor);
      (u.uDayFillColor.value as THREE.Color).set(hz.dayFillColor);
    }

    if (cities) {
      const ct = debug.materials.cities;
      const cu = cities.uniforms;
      cu.uGridDensity.value = ct.gridDensity;
      cu.uAspectJitter.value = ct.aspectJitter;
      cu.uRowOffset.value = ct.rowOffset;
      cu.uBlockThreshold.value = ct.blockThreshold;
      cu.uOutlineMin.value = ct.outlineMin;
      cu.uOutlineMax.value = ct.outlineMax;
      cu.uNightBrightness.value = ct.nightBrightness;
      cu.uTileSparkle.value = ct.tileSparkle;
      cu.uDayContrast.value = ct.dayContrast;
      cu.uMinPopulation.value = ct.minPopulation;
      cu.uOpacity.value = ct.opacity;
      cu.uNightOpacity.value = ct.nightOpacity;
      (cu.uNightFillColor.value as THREE.Color).set(ct.nightFillColor);
      (cu.uNightOutlineColor.value as THREE.Color).set(ct.nightOutlineColor);
      (cu.uDayNeutralColor.value as THREE.Color).set(ct.dayNeutralColor);
    }

    // Urban detail (procedural close-up buildings + streets). Push colour
    // uniforms each frame so Tweakpane edits land live. Both materials
    // share the same shape so the colours apply identically across each.
    if (urbanDetail) {
      const ud = debug.materials.urban;
      const bu = urbanDetail.bldUniforms;
      const su = urbanDetail.strUniforms;
      bu.uBuildingBaseLow.value.set(ud.buildingBaseLow);
      bu.uBuildingBaseHigh.value.set(ud.buildingBaseHigh);
      bu.uBuildingNightDark.value.set(ud.buildingNightDark);
      bu.uBuildingNightLitWarm.value.set(ud.buildingNightLitWarm);
      bu.uStreetDayDark.value.set(ud.streetDayDark);
      bu.uStreetDayLight.value.set(ud.streetDayLight);
      bu.uStreetNightDark.value.set(ud.streetNightDark);
      bu.uStreetNightLit.value.set(ud.streetNightLit);
      su.uBuildingBaseLow.value.set(ud.buildingBaseLow);
      su.uBuildingBaseHigh.value.set(ud.buildingBaseHigh);
      su.uBuildingNightDark.value.set(ud.buildingNightDark);
      su.uBuildingNightLitWarm.value.set(ud.buildingNightLitWarm);
      su.uStreetDayDark.value.set(ud.streetDayDark);
      su.uStreetDayLight.value.set(ud.streetDayLight);
      su.uStreetNightDark.value.set(ud.streetNightDark);
      su.uStreetNightLit.value.set(ud.streetNightLit);
    }

    // Airplane visuals — per-frame colour push so the four colour pickers
    // in the Airplanes folder land live. setColor on each layer mutates
    // the underlying uColor uniform in place.
    if (airplanes) {
      const ap = debug.materials.airplanes;
      airplanes.heads.setColor(ap.headBlinkColor);
      airplanes.trails.setColor(ap.trailColor);
      airplanes.scaffold.setColor(ap.scaffoldColor);
      airplanes.airports.setColor(ap.airportColor);
    }

    // Sun + moon disk billboards behind the atmosphere shell.
    const sky = debug.materials.sky;
    sunMoon.setSunColors(sky.sunDiskColor, sky.sunGlowColor);
    sunMoon.setMoonColors(sky.moonDiskColor, sky.moonGlowColor);

    // Directional sun light tint. The shader's day term is `base ×
    // uSunColor`; the sun light is constructed once at scene-graph init
    // from DEFAULTS.scene.sunLightColor, and this push keeps the
    // Tweakpane colour picker live.
    sun.color.set(debug.scene.sunLightColor);

    // Altitude exaggeration — drives every metres-based altitude in the
    // project (terrain, water, clouds, cities, plane bow arcs, atmosphere
    // shell). The slider value is the multiplier; baseline is factor=5
    // (matches the previous hardcoded 1.2e-5 elevation scale).
    const factor = debug.altitude.scaleFactor;
    const elevScale = elevationScaleFromFactor(factor);
    // Atmosphere physics tracks the rendered ocean surface. The water vertex
    // shader displaces the unit icosphere by `seaLevelOffsetM * elevScale`,
    // so the atmosphere's inner radius and outer shell ride the same offset
    // — drop sea level (slider or climate accumulator), and the halo sinks
    // with the water rather than bleeding above exposed seafloor.
    const finalSeaLevelM =
      debug.materials.ocean.seaLevelOffsetM + stashedClimateFrame.seaLevelM;
    const planetRadius = 1.0 + finalSeaLevelM * elevScale;
    const atmRadius = planetRadius + ATMOSPHERE_TOP_KM * 1000 * elevScale;
    if (globe) {
      globe.uniforms.land.uElevationScale.value = elevScale;
      globe.uniforms.water.uElevationScale.value = elevScale;
    }
    cloudsPass?.setElevationScale(elevScale);
    highways?.setElevationScale(elevScale);
    cities?.setElevationScale(elevScale);
    urbanDetail?.setElevationScale(elevScale);

    // Hemisphere visibility — flip per-bucket .visible based on which
    // side of the globe each bucket sits on relative to the camera.
    // Three's frustum cull doesn't help with back-of-globe occlusion;
    // this is what actually drops those buckets' draw calls + vertex
    // stage work. Cheap (one dot product per bucket per frame).
    tmpCameraDir.copy(camera.position).normalize();
    highways?.update(tmpCameraDir);
    cities?.update(tmpCameraDir);

    // Cities glow renders at every zoom — opacity is set from the
    // Tweakpane cities folder above. The procedural urban-detail mesh
    // ramps in close-up on top, no longer a hard cross-fade.
    const detailNear = 1.0 - THREE.MathUtils.smoothstep(camDist, 1.45, 1.8);
    urbanDetail?.setOpacity(detailNear);
    if (urbanDetail) {
      // Detail layer only engages when sufficiently close — the engage
      // check inside `update` does the per-frame engage/disengage.
      urbanDetail.update(camera.position);
    }
    if (airplanes) {
      airplanes.trails.setElevationScale(elevScale);
      airplanes.scaffold.setElevationScale(elevScale);
      airplanes.heads.setElevationScale(elevScale);
      airplanes.heads.setOpacity(THREE.MathUtils.lerp(1.0, 0.5, tFar));
    }

    // Atmosphere — Hillaire 2020 LUT-driven. `rayleighScale` / `mieScale`
    // and `atmosphereRadius` mutate optical-depth integration, so changing
    // any of them re-renders all three LUTs; `exposure` and `sunDiskSize`
    // are runtime-only uniforms.
    const a = debug.materials.atmosphere;
    if (atmosphere) {
      atmosphere.setScales(a.rayleighScale, a.mieScale, atmRadius, planetRadius);
      atmosphere.setSolarIrradiance(a.solarIrradiance.r, a.solarIrradiance.g, a.solarIrradiance.b);
      atmosphere.setExposure(a.exposure);
      atmosphere.setSunDiskAngleDeg(a.sunDiskSize * 3);

      // Share the atmosphere's sky-view LUT with every visible planet
      // shader so the in-shader aerial perspective tint colour-matches
      // the rim halo. The LUT rebakes on sun/camera change inside
      // AtmospherePass; the texture reference itself stays stable, so
      // these assignments are a no-op after the first frame — left in
      // the loop for clarity and to survive any future LUT swap.
      const skyView = atmosphere.skyViewTexture;
      if (globe) {
        globe.uniforms.land.uSkyView.value = skyView;
        globe.uniforms.land.uHazeExposure.value = a.exposure;
        globe.uniforms.land.uHazeAmount.value = a.hazeAmount;
        globe.uniforms.land.uHazeFalloffM.value = a.hazeFalloffM;
        globe.uniforms.water.uSkyView.value = skyView;
        globe.uniforms.water.uHazeExposure.value = a.exposure;
        globe.uniforms.water.uHazeAmount.value = a.hazeAmount;
      }
      if (cities) {
        cities.uniforms.uSkyView.value = skyView;
        cities.uniforms.uHazeExposure.value = a.exposure;
        cities.uniforms.uHazeAmount.value = a.hazeAmount;
      }
      if (highways) {
        highways.uniforms.uSkyView.value = skyView;
        highways.uniforms.uHazeExposure.value = a.exposure;
        highways.uniforms.uHazeAmount.value = a.hazeAmount;
      }
      if (urbanDetail) {
        urbanDetail.bldUniforms.uSkyView.value = skyView;
        urbanDetail.bldUniforms.uHazeExposure.value = a.exposure;
        urbanDetail.bldUniforms.uHazeAmount.value = a.hazeAmount;
        urbanDetail.strUniforms.uSkyView.value = skyView;
        urbanDetail.strUniforms.uHazeExposure.value = a.exposure;
        urbanDetail.strUniforms.uHazeAmount.value = a.hazeAmount;
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
    cities?.setActive(debug.layers.cities);
    urbanDetail?.setActive(debug.layers.urban);
    if (airplanes) {
      airplanes.setLayerActive('airports', false);
      airplanes.setLayerActive('scaffold', false);
      airplanes.setLayerActive('trails', debug.layers.trails);
      airplanes.setLayerActive('heads', debug.layers.planes);
    }
  }

  function update(deltaSec: number, debug: DebugState): void {
    if (controls) {
      controls.autoRotate = debug.camera.autoOrbit && !debug.timeOfDay.paused;
      controls.autoRotateSpeed = debug.camera.orbitSpeed * 60;
      controls.update(deltaSec);
    }

    debug.pick.lastPick = lastPickRef.value;

    // Time / calendar tick. See the "Time / calendar" header at the top of
    // this file for the design. `totalDays` is the only field the tick
    // writes directly; the three derived fields are recomputed every frame
    // (even when paused) so downstream consumers always see consistent
    // values — including right after a clock scrub.
    if (!debug.timeOfDay.paused) {
      debug.timeOfDay.totalDays += deltaSec * T01_PER_SECOND;
    }
    const days = debug.timeOfDay.totalDays;
    debug.timeOfDay.t01 = days - Math.floor(days);
    const totalYears = days / 12;
    const years = Math.floor(totalYears);
    debug.timeOfDay.yearsElapsed = years;
    debug.timeOfDay.timeOfYear01 = totalYears - years;

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

    // Nuclear explosion: tick with simDelta so pausing the sim freezes
    // the blast (consistent with every other time-driven layer). Dormant
    // when no detonation is active — `update` is an early-out then.
    const n = debug.nuclear;
    liveTuning.worldScale = n.worldScale;
    liveTuning.timeScale = n.timeScale;
    liveTuning.spriteScale = n.spriteScale;
    liveTuning.windStrength = n.windStrength;
    liveTuning.windDelay = n.windDelay;
    liveTuning.windRamp = n.windRamp;
    liveTuning.windJitter = n.windJitter;
    liveTuning.windDrag = n.windDrag;
    detonateTuning.enables.fire = n.enableFire;
    detonateTuning.enables.smoke = n.enableSmoke;
    detonateTuning.enables.mushroom = n.enableMushroom;
    detonateTuning.enables.mushroomFire = n.enableMushroomFire;
    detonateTuning.enables.columnFire = n.enableColumnFire;
    detonateTuning.enables.columnSmoke = n.enableColumnSmoke;
    detonateTuning.mushroomHeightScale = n.mushroomHeightScale;
    detonateTuning.columnHeightScale = n.columnHeightScale;
    detonateTuning.fireColorStart = cssToHex(n.fireColorStart);
    detonateTuning.fireColorEnd = cssToHex(n.fireColorEnd);
    detonateTuning.smokeColorStart = cssToHex(n.smokeColorStart);
    detonateTuning.smokeColorEnd = cssToHex(n.smokeColorEnd);
    blastSystem.setLiveTuning(liveTuning);
    blastSystem.setDetonateTuning(detonateTuning);
    blastSystem.update(simDelta);

    if (airplanes) {
      airplanes.setSpeed(debug.airplanes.speed);
      airplanes.setTargetInFlight(debug.airplanes.targetInFlight * airplaneSpawnScale);
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
    blastSystem.setViewportHeight(height);
  }

  function detonateAt(
    direction: THREE.Vector3,
    elevationM: number,
    wind: { u: number; v: number } | null,
    sizeKm: number,
  ): void {
    // Lift the blast origin off the unit sphere so it sits on top of the
    // displaced land mesh — without this, tall terrain (Himalayas, Andes)
    // pokes through and clips the fireball. Elevation comes in metres
    // from the caller (scenario handler sampled it via ctx.sampleTerrainAt);
    // we apply the live `uElevationScale` uniform here because that scale
    // is a render-layer concept that the scenario layer shouldn't reach into.
    let radius = 1.0;
    if (globe) {
      radius += Math.max(0, elevationM) * globe.uniforms.land.uElevationScale.value;
    }
    // BlastSystem owns slot-picking (free slot first, then lowest particle
    // count) and per-strike scale conversion (sizeKm / referenceRadiusKm).
    blastSystem.detonateAt(direction, radius, wind, sizeKm);
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
    cities?.dispose();
    cities = null;
    urbanDetail?.dispose();
    urbanDetail = null;
    airplanes?.dispose();
    airplanes = null;
    atmosphere?.dispose();
    atmosphere = null;
    blastSystem.dispose();
    sunMoon.dispose();
    controls?.dispose();
    controls = null;
    postFx?.dispose();
    postFx = null;
    webglRenderer = null;
  }

  return {
    scene,
    camera,
    attachRenderer,
    attachWorld,
    update,
    render,
    resize,
    detonateAt,
    setClimateFrame,
    setBiomeOverrideTextures,
    setClimateEnvelopes,
    setSeafloorFrame,
    setCloudFrame,
    setAirplaneSpawnScale,
    setDestructionFrame,
    dispose,
  };
}

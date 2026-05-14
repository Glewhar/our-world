/**
 * Scenario system — type contracts (C1, C2, C3 from the scenario plan).
 *
 * A Scenario is a time-bounded effect on the world that the user fires from
 * UI (e.g. the Explode button). The registry owns the active list; each
 * scenario kind has a handler that wires it to its render/sim side effects.
 *
 * Time domain: every duration is in `totalDays`, the canonical continuous
 * counter from `DebugState.timeOfDay`. 1 day = 1 unit, 1 year = 12 days, a
 * 2-year wasteland = 24 days. Pause and 4× speed are free — the registry
 * just reads totalDays each frame.
 */

export type ScenarioKind = 'nuclear' | 'globalWarming' | 'iceAge' | 'nuclearWar';

/**
 * Names the registry passes through `ScenarioContext.setWorldEffect`. The
 * render layer (`main.ts`) switches on the name and routes to the matching
 * subsystem. To add a new effect: extend this union and add a `case` in the
 * render-side dispatch. Handlers reference effects by name only — they
 * don't know which subsystem handles them.
 */
export type WorldEffectName = 'airplaneSpawn';

export type NuclearScenarioPayload = {
  latDeg: number;
  lonDeg: number;
  /** Cross-wind half-extent of the wasteland ellipse, in km. */
  radiusKm: number;
  /** Downwind half-extent of the wasteland ellipse, in km. Upwind tail = 0.2 × this. */
  stretchKm: number;
  /**
   * Wind bearing in degrees from north (0 = blowing toward north, 90 = east).
   * Sampled once at detonation and frozen for the scenario's lifetime — the
   * wasteland plume direction does not update if real wind shifts later.
   */
  windBearingDeg: number;
  /**
   * Decay shape for the wasteland stamp. `'quickThenSlow'` (default) gives
   * a quick visible drop and a long tail — the standard single-strike
   * recovery. `'sustained'` holds the stamp at peak for most of the
   * lifetime then falls fast at the end; used by Nuclear War strikes
   * during the "no rebuild" run so cities and streets stay dead through
   * the plateau.
   */
  decayMode?: 'quickThenSlow' | 'sustained';
};

/**
 * Nuclear War scheduled-strike entry. Built once in `onStart` from the
 * top-N populated cities; consumed in `onTick` to spawn child Nuclear
 * scenarios at their `fireAtRelDay` mark. `spawnedScenarioId` flips from
 * empty string to the child id the moment the strike fires, so the
 * scheduler doesn't double-fire.
 */
export type NuclearStrike = {
  latDeg: number;
  lonDeg: number;
  radiusKm: number;
  stretchKm: number;
  /** Days since the parent scenario started; the strike fires when elapsed ≥ this. */
  fireAtRelDay: number;
  /** Per-strike child Nuclear scenario lifetime in `totalDays` units. */
  childDurationDays: number;
  /** Empty until the child fires; then the registry-assigned scenario id. */
  spawnedScenarioId: string;
};

export type NuclearWarScenarioPayload = {
  /** Pre-built schedule. Empty arrays in `onStart` are filled from top-N cities. */
  schedule: NuclearStrike[];
  /**
   * Optional override for the number of strikes generated when
   * `schedule` is empty. Defaults to the config's `strikeCount`.
   */
  strikeCount?: number;
  /** Days from start by which all strikes have fired. */
  strikeWindowDays: number;
  /** Relative day at which airplane respawn flips to zero. */
  airplaneStopAtDay: number;
  /** Peak ΔT at plateau in °C (negative — cooling). */
  maxTempDeltaC: number;
  /** Peak Δsea-level at plateau in metres (negative — falling). */
  maxSeaLevelM: number;
  /** Peak soot/overcast contribution at plateau in [0, 1]. */
  peakSootGlobal: number;
  /** Fraction of lifetime over which the strike phase fires (envelope stays 0). */
  strikeEndFrac: number;
  /** Fraction by which the winter ramp reaches peak (envelope = 1). */
  winterRampEndFrac: number;
  /** Fraction at which the plateau ends and the recovery tail begins. */
  winterPlateauEndFrac: number;
  /** When false, child Nuclear strikes use sustained decay (no rebuild). */
  rebuildAfterWar: boolean;
};

/**
 * Global-warming payload. Both fields are positive — the climate frame
 * scales them by `climateRisePlateauFall(progress01)` each tick so the
 * shader sees `+maxTempDeltaC` at plateau, falling back to 0.
 */
export type GlobalWarmingScenarioPayload = {
  /** Peak ΔT at plateau in °C. Positive (warming). */
  maxTempDeltaC: number;
  /** Peak sea-level rise at plateau in metres. Positive. */
  maxSeaLevelM: number;
};

/**
 * Ice-age payload. Both fields are negative — symmetric counterpart to
 * GW. Scaled by the same `climateRisePlateauFall` envelope.
 */
export type IceAgeScenarioPayload = {
  /** Peak ΔT at plateau in °C. Negative (cooling). */
  maxTempDeltaC: number;
  /** Peak sea-level fall at plateau in metres. Negative. */
  maxSeaLevelM: number;
};

export type ScenarioPayload = {
  nuclear: NuclearScenarioPayload;
  globalWarming: GlobalWarmingScenarioPayload;
  iceAge: IceAgeScenarioPayload;
  nuclearWar: NuclearWarScenarioPayload;
};

export type Scenario<K extends ScenarioKind = ScenarioKind> = {
  readonly id: string;
  readonly kind: K;
  readonly label: string;
  /** Snapshot of `totalDays` taken at start. Drives the progress curve. */
  startedAtDay: number;
  /** How long the scenario lives, in `totalDays` units. */
  readonly durationDays: number;
  /** When true, the registry re-fires the scenario with the same payload at end. */
  autoRepeat: boolean;
  /** When true, the scenario is hidden from `list()` (still in `listAll()`). */
  silent: boolean;
  /**
   * Handlers may mutate fields on start (e.g. `windBearingDeg` after the
   * one-time wind sample). After `onStart` returns, treat as read-only.
   */
  payload: ScenarioPayload[K];
  /**
   * `false` while a climate scenario's async biome-transition walker is
   * still running (envelope is gated to 0); `true` once stamps are baked.
   * Non-climate scenarios are always `true`.
   */
  walkerComplete: boolean;
};

/**
 * Args for `paintAttributeEllipse` — the registry-internal hook that
 * scenario handlers call from `onStart` to stamp a wasteland (or other
 * dynamic attribute) ellipse into the registry's accumulator.
 *
 * Distance metric is geodesic. The ellipse is downwind-elongated:
 * `stretchKm` is the downwind half-axis; the upwind tail is 0.2 × that;
 * `radiusKm` is the cross-wind half-axis. Falloff is hard-coded to
 * smoothstep.
 */
export type EllipsePaintArgs = {
  /**
   * Sink key the captured stamp routes to. `'biomeOverride'` is the
   * baked-class pipeline; every other key names a dynamic R8 attribute
   * sink registered with the registry (built-in `'wasteland'`, plus
   * any handler-specific extras like `'infectionLevel'` or
   * `'ashDeposit'`).
   */
  attribute: string;
  /**
   * Required when `attribute === 'biomeOverride'`. Identifies which
   * biome class the cells inside this ellipse should flip to once the
   * intensity crosses the hysteresis threshold.
   */
  biomeOverride?: { biomeId: number };
  /** Peak intensity at the centre, in [0, 1]. */
  value: number;
  centreLatDeg: number;
  centreLonDeg: number;
  radiusKm: number;
  stretchKm: number;
  /** Azimuth from north, in degrees. Wind "toward" direction. */
  bearingDeg: number;
  falloff: 'smoothstep';
  /** Carried onto the captured stamp; decides which decay curve applies. */
  decayMode?: 'quickThenSlow' | 'sustained';
};

/**
 * Args for `paintAttributeBand` — latitude-band stamp primitive. Used by
 * climate-class scenarios (global warming, ice age) to flip whole zonal
 * belts (e.g. mid-latitudes → desert, sub-polar → tundra). Pair two calls
 * (N + S) for a symmetric climate effect.
 *
 * Falloff is smoothstep across the `edgeSoftnessDeg` band around each
 * latitude edge; inside the band, value is the constant peak. When the
 * optional `lonDegMin / lonDegMax` are omitted, the band wraps the full
 * longitude ring.
 */
export type BandPaintArgs = {
  /** Sink key — see `EllipsePaintArgs.attribute` for the contract. */
  attribute: string;
  /** Required when `attribute === 'biomeOverride'`. */
  biomeOverride?: { biomeId: number };
  /** Peak intensity inside the band, in [0, 1]. */
  value: number;
  latDegMin: number;
  latDegMax: number;
  /** Smoothstep edge softness in degrees. */
  edgeSoftnessDeg: number;
  /** Optional longitude window (full ring if both omitted). */
  lonDegMin?: number;
  lonDegMax?: number;
  falloff: 'smoothstep';
  /** Carried onto the captured stamp; decides which decay curve applies. */
  decayMode?: 'quickThenSlow' | 'sustained';
};

/**
 * One row of a climate scenario's biome-transition LUT. The registry
 * walks every HEALPix cell at `onStart`, reads its baseline biome and
 * elevation, looks the biome up in the LUT, and (if the gates pass)
 * routes the cell into a per-target-biome stamp bucket. Per-cell
 * `tStart01` lets vulnerable biomes start transforming early while
 * resilient ones plateau later under the same global envelope.
 */
export type BiomeTransitionRule = {
  /** Baseline biome id this rule matches (1..14 from WWF TEOW). */
  from: number;
  /** Target biome id the cell crossfades toward (1..15; 15 = ice). */
  to: number;
  /**
   * Peak stamp weight in [0, 1] at full envelope. Encodes resilience:
   * tundra → ice = 1.0 (full glaciation); rainforest core ≈ 0.25
   * (mostly survives). Multiplied by per-cell envelope on the GPU.
   */
  weight: number;
  /**
   * Onset time in [0, 1]. Cell starts transforming when the global
   * envelope crosses this value; reaches full weight at envelope = 1.
   * Vulnerable biomes ≈ 0; resilient cores ≈ 0.5+.
   */
  tStart01: number;
  /**
   * Optional |latitude| gate in degrees. Cell must have
   * `absLatDeg >= latGateAbsDegMin` to qualify. Use to keep
   * rainforest cores at the equator from transforming.
   */
  latGateAbsDegMin?: number;
  /** Optional |latitude| upper gate. Cell must have `absLatDeg <= latGateAbsDegMax`. */
  latGateAbsDegMax?: number;
  /** Optional elevation gate. Cell elevation in metres must be >= this. */
  elevGateMinM?: number;
  /** Optional elevation upper gate. Cell elevation in metres must be <= this. */
  elevGateMaxM?: number;
};

/** Union of paint primitives the registry's capture hook understands. */
export type PaintArgs = EllipsePaintArgs | BandPaintArgs;

/**
 * Per-scenario peak stamp: cell index → peak attribute value in [0, 1].
 * Produced once at `onStart` from an ellipse paint and held by the registry
 * for the scenario's lifetime. The registry multiplies each stamp by the
 * decay curve every frame to produce the live wasteland texture.
 *
 * Climate scenarios paint into the same shape but carry an `attribute`
 * tag and (for biome-override stamps) the target biome class so the
 * registry knows which texture to compose into.
 */
export type ScenarioStamp = {
  cells: Uint32Array;
  values: Float32Array;
  /**
   * Sink key this stamp composes into. Defaults to `'wasteland'`.
   * `'biomeOverride'` flows into the baked class + stamp-weight
   * textures; every other key names a dynamic R8 attribute sink
   * registered with the registry.
   */
  attribute?: string;
  /** Target biome class when `attribute === 'biomeOverride'`. */
  biomeId?: number;
  /**
   * Decay shape for wasteland stamps — defaults to `'quickThenSlow'`
   * (single-strike Nuclear recovery shape). Climate / biome-override
   * stamps ignore this field; the override pipeline scales them on the GPU.
   */
  decayMode?: 'quickThenSlow' | 'sustained';
  /**
   * Per-cell onset time in [0, 1] for biome-override stamps. When set,
   * the land shader gates the override per cell as
   * `cellEnv = saturate((envelope - tStart01) / (1 - tStart01))`, so
   * vulnerable biomes (small tStart) start transforming before
   * resilient ones (large tStart) at the same global envelope.
   * Length matches `cells`. Optional — omitted on band/ellipse paints
   * for backward compatibility (treated as 0 everywhere).
   */
  tStart01s?: Float32Array;
};

/**
 * Sampled terrain at a lat/lon — produced by `ScenarioContext.sampleTerrainAt`.
 * Wraps the two world-layer reads (elevation + wind) that scenario handlers
 * need so they can hand the result back to `ctx.detonateAt` without the
 * render layer reaching into world state on the handler's behalf.
 */
export type TerrainSample = {
  /** Elevation above sea level in metres (clamped ≥ 0 by the world layer). */
  elevationM: number;
  /** Wind vector in m/s (u = eastward, v = northward), or null if no wind field. */
  wind: { u: number; v: number } | null;
};

/**
 * Climate scenarios push a `{ tempC, seaLevelM }` contribution each frame.
 * The registry sums (at most one climate scenario at a time per the mutex)
 * and publishes via `ScenarioRegistry.getClimateFrame()`; render / UI read
 * the frame to tint the globe, shift sea level, and update HUD readouts.
 */
export type ClimateContribution = {
  /** Δ temperature in °C, signed. */
  tempC: number;
  /** Δ sea level in metres, signed. */
  seaLevelM: number;
};

/**
 * Cloud-side contribution from a climate-class scenario. `sootGlobal` is
 * an overcast multiplier + tint weight applied scene-wide; `sootRegional
 * Weight` gates the wasteland-texture-driven local cover bump (denser
 * cloud above strike sites). Both fields default to zero so the cloud
 * pass renders identically when no scenario pushes soot.
 */
export type CloudContribution = {
  sootGlobal: number;
  sootRegionalWeight: number;
  sootSunTint: { r: number; g: number; b: number };
  sootAmbientTint: { r: number; g: number; b: number };
};

/**
 * Per-scenario destruction census for strikes-based scenarios (Nuclear
 * and Nuclear War). Counts surface what the strike footprint has
 * destroyed — cities (above the kill threshold), summed population, and
 * length of major/arterial roads inside the kill zone.
 */
export type DestructionCensus = {
  /** Number of strikes that have actually fired (vs scheduled). */
  strikes: number;
  /** Strikes scheduled in total (== strikes for single-Nuclear scenarios). */
  strikesScheduled: number;
  /** Cities whose centre cell is over the kill threshold. */
  cities: number;
  /** Summed POP_MAX from Natural Earth across those cities. */
  population: number;
  /** Kilometres of major + arterial roads inside the kill zone. */
  streetKm: number;
};

/**
 * Minimal city record handed to scenarios via `ScenarioContext.getMajorCities`.
 * Decoupled from the world-runtime `CityRecord` type so the scenarios
 * package doesn't pull a render-world dependency.
 */
export type ScenarioCity = {
  latDeg: number;
  lonDeg: number;
  pop: number;
  name: string;
};

/**
 * Per-climate-scenario biome census. `baseline` is snapshotted at the
 * scenario's `onStart` (a single `countBiomesGlobal()` walk). `current` is
 * maintained live by the override-recompose loop's hysteresis (cells that
 * flip class debit one bucket and credit the other). `delta = current -
 * baseline` for every class either side has touched, so UI can render
 * "Forest -3.2M km² / Desert +3.2M km²" without re-counting.
 */
export type BiomeCensus = {
  /** Biome class index → cell count, snapshotted at scenario start. */
  baseline: Record<number, number>;
  /** Biome class index → live cell count. */
  current: Record<number, number>;
  /** `current[c] - baseline[c]` for every class touched. */
  delta: Record<number, number>;
};

/**
 * Context passed to handler callbacks. The registry injects this — handlers
 * don't pull from globals, so tests can drive them with stubs.
 */
export type ScenarioContext = {
  /**
   * Resolve a lat/lon to a wind sample `{ u, v }` in m/s, or null if the
   * bake doesn't ship a wind field. Handlers convert this to a bearing
   * once at start.
   */
  sampleWindAt(latDeg: number, lonDeg: number): { u: number; v: number } | null;
  /**
   * Resolve a lat/lon to elevation + wind in a single call. Use this when
   * you need both — keeps the render-layer code out of the scenario's
   * sampling concerns.
   */
  sampleTerrainAt(latDeg: number, lonDeg: number): TerrainSample;
  /**
   * Fire the existing particle blast at a lat/lon. Pass the terrain sample
   * captured by `sampleTerrainAt` so the render layer doesn't have to
   * re-sample on the scenario's behalf — sampling is the scenario's job,
   * the render layer just consumes the result.
   *
   * `sizeKm` is the scenario's per-strike blast radius in km. The render
   * layer scales the visual relative to its calibrated reference radius
   * (see `NuclearScenarioConfig.visuals.referenceRadiusKm`) so a strike at
   * that exact radius matches the calibrated reference fireball. Passing
   * a `sizeKm` that exceeds reasonable bounds is the caller's responsibility
   * to clamp — the render layer applies a hard floor to keep the blast
   * visible but otherwise trusts the input.
   */
  detonateAt(latDeg: number, lonDeg: number, terrain: TerrainSample, sizeKm: number): void;
  /**
   * Stamp an attribute ellipse into the registry's accumulator. The
   * registry captures the result as a peak stamp; subsequent ticks scale
   * it by the recovery curve.
   */
  paintAttributeEllipse(args: EllipsePaintArgs): void;
  /**
   * Stamp an attribute latitude band into the registry's accumulator.
   * Multiple calls accumulate (max-merge per cell) — climate handlers use
   * this to paint a north + south pair of zonal bands per `onStart`.
   */
  paintAttributeBand(args: BandPaintArgs): void;
  /**
   * Walk every HEALPix cell, look up its baseline biome + elevation,
   * apply the transition rule list, and emit one biome-override stamp
   * per distinct target biome. Used by climate-class scenarios (global
   * warming, ice age) to drive biome-aware transitions instead of
   * latitudinal strips. The first matching rule per cell wins (rules
   * earlier in the array take precedence — useful for elev-gated
   * special cases like high montane → ice that must beat the general
   * montane → grassland rule). Per-cell `tStart01` flows into the
   * stamp's G channel so the shader can stagger onset by resilience.
   */
  paintBiomeTransition(rules: readonly BiomeTransitionRule[]): void;

  /**
   * Spawn a child scenario; kind is restricted to prevent recursive
   * nesting. Returns the child id, or '' if the registry refused.
   */
  spawnChildScenario<K extends Exclude<ScenarioKind, 'nuclearWar'>>(
    kind: K,
    payload: ScenarioPayload[K],
    durationDays: number,
    opts?: StartScenarioOpts,
  ): string;

  /**
   * Stop a child scenario by id. No-op if the id is unknown (already
   * ended, never spawned, or stale after auto-repeat). Parent handlers
   * call this from `onEnd` to cascade their stop to scheduled children.
   */
  stopChildScenario(id: string): void;

  /**
   * Multiply a named world-spawn effect by `scale` (0..1). The render
   * layer routes the name to the matching subsystem (e.g.
   * `'airplaneSpawn'` gates `AirplaneSystem`'s respawn target). Existing
   * entities finish their current cycle; only new spawns are gated.
   * Handlers must restore the scale to 1 on `onEnd`. Add new effects by
   * extending `WorldEffectName` and the switch in `main.ts`.
   */
  setWorldEffect(name: WorldEffectName, scale: number): void;

  /** Top-N populated cities by `pop` descending. Empty on fixture bakes. */
  getMajorCities(maxCount: number): readonly ScenarioCity[];

  /** Road polylines for the destruction census walk. */
  getRoadSegments(): readonly {
    kind: 'major' | 'arterial' | 'local' | 'local2';
    vertices: readonly [number, number][];
  }[];
};

export interface ScenarioKindHandler<K extends ScenarioKind> {
  /**
   * Mutex group flag — at most one `isClimateClass` scenario may be
   * active at a time. `ScenarioRegistry.start` returns a busy result if
   * another climate-class scenario is already running.
   */
  isClimateClass?: true;
  /**
   * When set, the registry maintains a per-scenario destruction census
   * (strikes / cities / population / streetKm). Exposed via
   * `ScenarioRegistry.getDestructionCensus(id)` for UI cards.
   */
  hasDestructionCensus?: true;
  onStart(scn: Scenario<K>, ctx: ScenarioContext): void;
  /** `progress01` ∈ [0, 1]. Called each frame after `totalDays` advances. */
  onTick(scn: Scenario<K>, progress01: number, ctx: ScenarioContext): void;
  onEnd(scn: Scenario<K>, ctx: ScenarioContext): void;
  /**
   * Climate-class hook. Returns the temperature + sea-level contribution
   * for this frame given the scenario's `progress01`. The registry sums
   * over all active scenarios that implement this hook (in practice
   * always one, due to the mutex) and publishes via `getClimateFrame()`.
   */
  getClimateContribution?(scn: Scenario<K>, progress01: number): ClimateContribution;
  /**
   * Optional cloud-side contribution. Used by Nuclear War to push soot
   * (global overcast tint + regional wasteland-driven cover bump) onto
   * the volumetric cloud pass.
   */
  getCloudContribution?(scn: Scenario<K>, progress01: number): CloudContribution;
  /**
   * Optional override for the scalar climate envelope. When omitted the
   * registry falls back to `climateRisePlateauFall(progress01)`. Nuclear
   * War overrides so biome crossfade waits out the strike phase.
   */
  getClimateEnvelope?(scn: Scenario<K>, progress01: number): number;
  /**
   * Strike-based scenarios expose their detonation points so the registry
   * can build a destruction-census bbox without reading payload shape.
   * Single Nuclear returns one point; Nuclear War returns one per scheduled
   * strike (regardless of whether it has fired yet).
   */
  getStrikePoints?(scn: Scenario<K>): readonly { latDeg: number; lonDeg: number }[];
  /**
   * Census progress counters for the destruction card. `scheduled` is the
   * total strikes the scenario plans to fire; `fired` is the count that
   * have already spawned. Single Nuclear is `{ 1, 1 }` once the stamp is
   * captured.
   */
  getStrikeProgress?(scn: Scenario<K>): { fired: number; scheduled: number };
  /**
   * Spawned child scenario ids — the registry folds each child's wasteland
   * stamps into the parent's kill-zone set. Returning an empty array (or
   * omitting the hook) keeps the fold parent-only.
   */
  getChildScenarioIds?(scn: Scenario<K>): readonly string[];
}

export type StartScenarioOpts = {
  autoRepeat?: boolean;
  label?: string;
  /**
   * When true, the scenario is hidden from `ScenarioRegistry.list()`
   * (and therefore from the card UI) but is otherwise live. Used by
   * Nuclear War's child Nuclear strikes — the parent card already shows
   * the strike count, so 70 individual cards would be noise.
   */
  silent?: boolean;
};

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

import type { ImpactBudgetDeps, ScenarioImpactBudget } from './impactBudget.js';

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
  /**
   * Peak Δprecipitation at plateau in mm/year (negative — dry winter).
   * Optional; falls back to config default when omitted.
   */
  precipDeltaMm?: number;
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
 * Global-warming payload. All deltas positive — the climate frame
 * scales them by `climateRisePlateauFall(progress01)` each tick so the
 * shader sees `+maxTempDeltaC` at plateau, falling back to 0. Sea
 * level falls out of `seaLevelFromTempDelta(liveTempC, mult)` —
 * payload no longer carries an independent sea-level peak.
 */
export type GlobalWarmingScenarioPayload = {
  /** Peak ΔT at plateau in °C. Positive (warming). */
  maxTempDeltaC: number;
  /**
   * Peak Δprecipitation at plateau in mm/year. Positive — a warmer
   * atmosphere holds more moisture. Optional; falls back to the config
   * default when omitted (UI hasn't surfaced a slider yet).
   */
  precipDeltaMm?: number;
};

/**
 * Ice-age payload. All deltas negative — symmetric counterpart to GW.
 * Scaled by the same `climateRisePlateauFall` envelope. Sea level
 * derives from the temperature curve via `seaLevelFromTempDelta`.
 */
export type IceAgeScenarioPayload = {
  /** Peak ΔT at plateau in °C. Negative (cooling). */
  maxTempDeltaC: number;
  /**
   * Peak Δprecipitation at plateau in mm/year. Negative — colder air
   * holds less moisture. Optional; falls back to the config default
   * when omitted.
   */
  precipDeltaMm?: number;
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
 * Climate scenarios push a `{ tempC, seaLevelM, precipMm }` contribution each
 * frame. The registry sums across every active climate scenario and publishes
 * via `ScenarioRegistry.getClimateFrame()`; render / UI read the frame to tint
 * the globe, shift sea level, and update HUD readouts.
 *
 * Cancellation: temperature, sea-level, and precipitation deltas all signed-
 * sum, so a Global Warming + Ice Age pair lands at a near-zero combined
 * delta — and the polygon biome projection driven by that combined delta
 * produces near-empty stamps, which is the planet visibly "resetting".
 */
export type ClimateContribution = {
  /** Δ temperature in °C, signed. */
  tempC: number;
  /** Δ sea level in metres, signed. */
  seaLevelM: number;
  /** Δ precipitation in mm/year, signed. */
  precipMm: number;
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
 * One slot's contribution to the LAND seafloor branch. `palette` is the
 * 3-colour shelf palette (polar / temperate / equatorial) the scenario
 * wants to paint onto exposed seafloor; `weight` is its per-frame
 * envelope × handler weight in [0, 1]. The shader receives one of
 * these per climate slot and crossfades between the default palette
 * and the scenario palette by `weight`.
 *
 * Inactive slot → `weight = 0` (palette ignored). Both slots zero
 * means the shader paints the default palette unchanged.
 */
export type SeafloorContribution = {
  palette: [
    { r: number; g: number; b: number }, // polar shelf (biome 16)
    { r: number; g: number; b: number }, // temperate shelf (biome 17)
    { r: number; g: number; b: number }, // equatorial shelf (biome 18)
  ];
  weight: number;
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

  /**
   * Global multiplier handed to `seaLevelFromTempDelta`. Climate
   * handlers read this each tick to scale their sea-level response —
   * 1.0 = paleoclimate-anchored response, 10.0 = stress-test extreme
   * for shader / atmosphere shell behaviour at huge sea heights. The
   * launcher's "Sea-level multiplier" slider drives it.
   */
  getSeaLevelMultiplier(): number;
};

export interface ScenarioKindHandler<K extends ScenarioKind> {
  /**
   * Mutex group flag — at most one `isClimateClass` scenario may be
   * active at a time. `ScenarioRegistry.start` returns a busy result if
   * another climate-class scenario is already running.
   */
  isClimateClass?: true;
  onStart(scn: Scenario<K>, ctx: ScenarioContext): void;
  /** `progress01` ∈ [0, 1]. Called each frame after `totalDays` advances. */
  onTick(scn: Scenario<K>, progress01: number, ctx: ScenarioContext): void;
  onEnd(scn: Scenario<K>, ctx: ScenarioContext): void;
  /**
   * Climate-class hook. Returns the temperature + sea-level + precipitation
   * contribution for this frame given the scenario's `progress01`. The
   * registry sums over every active climate scenario and publishes the
   * combined frame via `getClimateFrame()` — opposing scenarios cancel.
   * `ctx` is passed in so handlers can read live tunables (sea-level
   * multiplier in particular) without reaching into globals.
   */
  getClimateContribution?(
    scn: Scenario<K>,
    progress01: number,
    ctx: ScenarioContext,
  ): ClimateContribution;
  /**
   * Climate-class hook. Returns this scenario's peak (envelope = 1)
   * climate contribution. The registry sums these across active climate
   * scenarios to drive the polygon biome projection at bake time, so the
   * combined-frame cancellation works regardless of where each scenario
   * currently sits on its progress curve. Optional — when omitted the
   * registry falls back to `getClimateContribution(scn, 1.0, ctx)`.
   */
  peakClimateContribution?(scn: Scenario<K>, ctx: ScenarioContext): ClimateContribution;
  /**
   * Optional cloud-side contribution. Used by Nuclear War to push soot
   * (global overcast tint + regional wasteland-driven cover bump) onto
   * the volumetric cloud pass.
   */
  getCloudContribution?(scn: Scenario<K>, progress01: number): CloudContribution;
  /**
   * Optional seafloor contribution. Only meaningful for climate-class
   * scenarios that move sea level enough to expose the synthetic shelf
   * biomes (Ice Age in particular). When omitted, the scenario does
   * not influence the LAND seafloor branch — exposed shelf cells take
   * the default palette.
   */
  getSeafloorContribution?(scn: Scenario<K>, progress01: number): SeafloorContribution;
  /**
   * Optional override for the scalar climate envelope. When omitted the
   * registry falls back to `climateRisePlateauFall(progress01)`. Nuclear
   * War overrides so biome crossfade waits out the strike phase.
   */
  getClimateEnvelope?(scn: Scenario<K>, progress01: number): number;
  /**
   * Number of bombs the scenario has detonated so far. Surfaced through
   * `WorldHealthSnapshot.stats.bombsActive`. Single Nuclear is `1` once
   * its stamp is captured; Nuclear War counts every spawned child.
   * Default: 0.
   */
  getBombsActive?(scn: Scenario<K>): number;
  /**
   * Damage envelope sampled per frame. Multiplied by every channel of
   * the scenario's `ScenarioImpactBudget` to derive the live world-health
   * contribution. 0 = no damage (pristine), 1 = peak damage (every
   * city / biome cell / radiation unit in the budget is currently
   * impacting the world). Default: `(p) => p` (identity).
   */
  intensity?(scn: Scenario<K>, progress01: number): number;
  /**
   * One-shot impact tally taken right after `onStart` and reused for the
   * rest of the scenario's life. Returns the population, cities, biome
   * fractions, and radiation units the scenario will inflict at peak;
   * the registry scales by `intensity()` every frame. Silent scenarios
   * (Nuclear War's per-strike children) return `zeroBudget()` so the
   * parent's budget isn't double-counted.
   */
  computeImpactBudget(scn: Scenario<K>, deps: ImpactBudgetDeps): ScenarioImpactBudget;
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

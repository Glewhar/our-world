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

export type ScenarioKind = 'nuclear';

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
};

export type ScenarioPayload = {
  nuclear: NuclearScenarioPayload;
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
 * smoothstep for v1.
 */
export type EllipsePaintArgs = {
  attribute: 'wasteland';
  /** Peak intensity at the centre, in [0, 1]. */
  value: number;
  centreLatDeg: number;
  centreLonDeg: number;
  radiusKm: number;
  stretchKm: number;
  /** Azimuth from north, in degrees. Wind "toward" direction. */
  bearingDeg: number;
  falloff: 'smoothstep';
};

/**
 * Per-scenario peak stamp: cell index → peak attribute value in [0, 1].
 * Produced once at `onStart` from an ellipse paint and held by the registry
 * for the scenario's lifetime. The registry multiplies each stamp by the
 * decay curve every frame to produce the live wasteland texture.
 */
export type ScenarioStamp = {
  cells: Uint32Array;
  values: Float32Array;
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
   * re-sample on the scenario's behalf (which was the Phase-1 shape — the
   * render layer secretly knew about wasteland-driven detonates).
   */
  detonateAt(latDeg: number, lonDeg: number, terrain: TerrainSample): void;
  /**
   * Stamp an attribute ellipse into the registry's accumulator. The
   * registry captures the result as a peak stamp; subsequent ticks scale
   * it by the recovery curve.
   */
  paintAttributeEllipse(args: EllipsePaintArgs): void;
};

export interface ScenarioKindHandler<K extends ScenarioKind> {
  onStart(scn: Scenario<K>, ctx: ScenarioContext): void;
  /** `progress01` ∈ [0, 1]. Called each frame after `totalDays` advances. */
  onTick(scn: Scenario<K>, progress01: number, ctx: ScenarioContext): void;
  onEnd(scn: Scenario<K>, ctx: ScenarioContext): void;
}

export type StartScenarioOpts = {
  autoRepeat?: boolean;
  label?: string;
};

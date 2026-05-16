/**
 * ScenarioRegistry — singleton owner of the active scenario list.
 *
 * Lifecycle:
 *   - `start(kind, payload, totalDays, durationDays, opts)` snapshots
 *     `totalDays`, builds a Scenario, runs the kind's handler `onStart`
 *     with paint capture active, and pushes it onto the active list.
 *   - `tick(totalDays)` advances every active scenario. On `progress01 >= 1`
 *     it calls `onEnd`; if `autoRepeat`, the scenario re-fires with the
 *     same payload (re-snapshotting startedAtDay), otherwise it's removed.
 *     Otherwise `onTick(progress01)` runs.
 *   - `stop(id)` immediately ends the scenario; the next recompose drops
 *     its contribution from the wasteland texture.
 *
 * Wasteland texture accounting (load-bearing):
 *   The wasteland texture is the sum, capped at 1, of every active
 *   scenario's wasteland-attribute stamps. Each stamp carries a sparse
 *   `cells[] / peakValues[]` pair captured once at `onStart`. Every tick
 *   the registry composes:
 *
 *     wastelandTex[cell] = min(1, Σ_active stamp[cell] × decayQuickThenSlow(progress01))
 *
 *   The intensity function is `decayQuickThenSlow`; the exponent is
 *   tunable through Tweakpane via `tuning.decayExponent`.
 *
 *   Dirty-cell tracking: the union of cells of every active stamp plus
 *   the union of cells from any stamp that was just removed (so the
 *   texture re-zeroes those cells on the same frame).
 *
 * Climate / biome-override accounting:
 *   Scenarios with `isClimateClass` paint into a per-polygon biome
 *   override pipeline driven by `biomeProjection.ts`. Up to two
 *   climate-class scenarios run concurrently (two-slot pool — a third
 *   `start()` returns `'climate-busy'`). On every membership change the
 *   registry sums each active climate handler's
 *   `peakClimateContribution` into a single combined Δ frame, runs
 *   `projectBiome` over every polygon, and writes the resulting
 *   (class / weight / tStart01) into each active slot's per-polygon
 *   textures. Both slots receive the same combined-frame projection at
 *   half weight when both are active, so opposing scenarios (Global
 *   Warming + Ice Age) collapse to a near-zero combined delta and the
 *   projection emits near-empty stamps — the cancellation mechanism.
 *
 *   Per frame the registry exposes per-slot envelopes via
 *   `getClimateEnvelopes()`; the land shader computes
 *
 *     intensity[cell] = polygonStampWeight[poly] × climateEnvelope[slot]
 *
 *   on the GPU and crossfades the baseline biome colour toward the
 *   override class. No CPU work proportional to cells per frame.
 *
 * World-health snapshot:
 *   `getWorldHealth()` rolls up each active scenario's `impactBudget`
 *   (computed once at `onStart` via `handler.computeImpactBudget`,
 *   re-computed on climate-membership change so the combined delta
 *   stays current) by the handler's `intensity(progress01)` sample.
 *   Pure O(activeScenarios × distinct biomeChanges) scalar math per
 *   frame; no per-cell, per-city, or per-road walks.
 */
import { computeEllipseStamp } from '../../sim/fields/ellipse.js';
import { computeBandStamp } from '../../sim/fields/band.js';
import { computeWorldTotals } from '../worldTotals.js';
import { zeroBudget, } from './impactBudget.js';
import { decayQuickThenSlow, decaySustained, climateRisePlateauFall } from './recoveryCurves.js';
import { pristineWorldHealth, zeroBiomeCategoryShares, } from './healthSnapshot.js';
import { biomeCategoryOf, biomeName } from '../biomes/BiomeLookup.js';
import { buildProjectionPolygonTextures } from './biomeProjection.js';
/**
 * Radiation half-saturation point in km² — `1 - exp(-units / RAD_HALF)`
 * is the bar fill. Tuned so a Nuclear War ramps the bar smoothly with
 * bombs landing: ~3 strikes ≈ 25%, ~10 strikes ≈ 60%, ~25 strikes ≈ 90%,
 * full 50-strike war saturates. Previously 1.5M, which pinned the bar
 * to 100% after just 3 bombs because the war's aggregate `radiationUnits`
 * (sum of every kill ellipse) is ~120M km² × intensity.
 */
const RADIATION_HALF_FULL = 80_000_000;
let nextScenarioCounter = 1;
const ZERO_RGB = { r: 0, g: 0, b: 0 };
function zeroSeafloorFrame() {
    return {
        paletteA: [{ ...ZERO_RGB }, { ...ZERO_RGB }, { ...ZERO_RGB }],
        paletteB: [{ ...ZERO_RGB }, { ...ZERO_RGB }, { ...ZERO_RGB }],
        weightA: 0,
        weightB: 0,
    };
}
/**
 * PERF TUNABLE — scar recompose throttle.
 * Wallclock cap on how often `recomposeFrame` runs. The recompose touches
 * the union of all active + retired stamp cells (millions of cells during
 * a Nuclear War), but the per-frame fade is sub-perceptible. Higher =
 * cheaper, more banded scar fade. Lower = smoother fade, hotter main thread.
 * 1000 ms is the default — ~150 fade steps over a 24-day scar life at 4×
 * sim speed, visually indistinguishable from per-frame fade.
 */
const RECOMPOSE_THROTTLE_MS = 1000;
/**
 * PERF TUNABLE — force-recompose floor.
 * Lower bound for *forced* recomposes (new strike, scenario start/stop,
 * auto-repeat). Without a floor, an async-stamp burst (Nuclear War with
 * dozens of simultaneous strike replies) trips one full recompose per
 * reply — the cumulative cost trips the browser's "Page not responsive"
 * watchdog. 150 ms caps forced recomposes at ~6 paint steps/sec — the
 * visible scar growth during a war is still smooth, but the main thread
 * gets time to breathe between repaints.
 */
const RECOMPOSE_FORCE_FLOOR_MS = 150;
export class ScenarioRegistry {
    handlers = new Map();
    active = [];
    attributeSinks;
    /** Lookup by `sink.key` for the recompose loop + retired-cell routing. */
    sinkByKey;
    biomeOverrideSink;
    context;
    nside;
    ordering;
    /** Async stamp dispatcher (sim worker). Null = synchronous compute. */
    requestStamp;
    /** Last `totalDays` value seen by `tick` — used by recompose at start/stop. */
    lastTotalDays = 0;
    /**
     * Cells that were part of stamps removed since the previous frame,
     * keyed by the stamp's `attribute` sink key. Those cells must be
     * re-emitted (with their new sum, which may be 0) so the texture
     * clears them — otherwise the sink would never see the "fully gone"
     * value. Biome-override stamps don't track here (the bake pass owns
     * their lifetime).
     */
    retiredCellsByKey = new Map();
    /** Sum of retired-cell counts across every key — short-circuit gate. */
    retiredCellsTotal = 0;
    /**
     * Tweakpane-tunable knobs. Exposed as a plain object so the debug panel
     * can bind to fields directly (no setters needed).
     */
    tuning = {
        decayExponent: 2.5,
    };
    // Sized to all 12·nside² cells so reset cost stays O(touched), not O(npix).
    accBuf;
    markBuf;
    dirtyList;
    dirtyCount = 0;
    // Composed picture is a pure function of (active, totalDays, decayExponent).
    // `dirty` flips on active-list change; the other two are checked in recompose.
    dirty = false;
    lastComposedTotalDays = Number.NaN;
    lastComposedDecayExponent = Number.NaN;
    // Recompose throttle: scar paint is composed from millions of cells but the
    // per-frame fade is sub-perceptible. Cap recompose at ≤1× per real-time
    // second. `forceRecomposeNext` is set on edges that must show immediately
    // (auto-repeat of a stamp scenario, etc.).
    lastRecomposeWallMs = 0;
    forceRecomposeNext = false;
    /**
     * Paint capture buffer — active only during `onStart` so the handler's
     * paint calls land in the new scenario's stamp list. Outside of
     * `onStart` paint calls fall through to the user context.
     */
    capturingStamps = null;
    /**
     * Pre-allocated scratch for the per-sink emit (cells + values). Grown
     * on demand; emitted via `subarray(0, count)` so each sink sees a
     * length-matched view without copying. Reused across sinks within a
     * single recompose pass — `accBuf` + `markBuf` are reset between
     * passes so a cell touched by sink A doesn't leak into sink B.
     */
    scratchEmitCells;
    scratchEmitValues;
    /**
     * Boot-time totals — cities sum, biome cells per class, polygon-area
     * proxy per class. Built lazily on first impact-budget call (the
     * boot-time computation is fast — ~14k polygons + ~7k cities — but
     * lazy lets the registry initialise before the world data is fully
     * resolved in test fixtures).
     */
    worldTotalsCache = null;
    /** Cached city array used by impact budgets; sorted by pop descending. */
    citiesCache = null;
    /**
     * Six-bucket diorama shares of the pristine planet's land biome
     * composition. Computed once from `worldTotalsCache.biomeCellsByClass`
     * — every biome id is binned via `biomeCategoryOf`, shelf / no-data
     * ids drop, the surviving counts normalise to sum 1. The HUD biome
     * hex row reads this for the baseline layout and the registry
     * subtracts / adds per-frame deltas on top in `getWorldHealth`.
     */
    baselineSharesCache = null;
    /** Composed climate + cloud + seafloor frame cache, keyed by `lastTotalDays`. */
    composedFrame = null;
    composedFrameTotalDays = Number.NaN;
    constructor(deps) {
        if (deps.attributeSinks.length === 0) {
            throw new Error('ScenarioRegistry: at least one AttributeSink is required');
        }
        this.attributeSinks = deps.attributeSinks;
        this.sinkByKey = new Map();
        for (const s of deps.attributeSinks)
            this.sinkByKey.set(s.key, s);
        this.biomeOverrideSink = deps.biomeOverrideSink ?? null;
        this.nside = deps.nside;
        this.ordering = deps.ordering;
        this.requestStamp = deps.requestStamp;
        const npix = 12 * deps.nside * deps.nside;
        this.accBuf = new Float32Array(npix);
        this.markBuf = new Uint8Array(npix);
        this.dirtyList = new Uint32Array(4096);
        this.scratchEmitCells = new Uint32Array(4096);
        this.scratchEmitValues = new Float32Array(4096);
        const userCtx = deps.context;
        this.context = {
            sampleWindAt: (lat, lon) => userCtx.sampleWindAt(lat, lon),
            sampleTerrainAt: (lat, lon) => userCtx.sampleTerrainAt(lat, lon),
            detonateAt: (lat, lon, terrain, sizeKm) => userCtx.detonateAt(lat, lon, terrain, sizeKm),
            paintAttributeEllipse: (args) => this.captureEllipsePaint(args, userCtx),
            paintAttributeBand: (args) => this.captureBandPaint(args, userCtx),
            paintAttributeCells: (args) => this.captureCellsPaint(args, userCtx),
            getElevationMetersAtCell: (ipix) => this.biomeOverrideSink ? this.biomeOverrideSink.getElevationMetersAtCell(ipix) : 0,
            getPolygonOfCell: (ipix) => this.biomeOverrideSink ? this.biomeOverrideSink.getPolygonOfCell(ipix) : 0,
            getCellCount: () => 12 * this.nside * this.nside,
            getPolygonLookup: () => this.biomeOverrideSink ? this.biomeOverrideSink.getPolygonLookup() : null,
            spawnChildScenario: (kind, payload, durationDays, opts) => {
                // Runtime belt-and-braces against recursive nesting — the type
                // already excludes 'nuclearWar' but a JS caller could still pass it.
                if (kind === 'nuclearWar')
                    return '';
                const result = this.start(kind, payload, this.lastTotalDays, durationDays, opts);
                return result.ok ? result.id : '';
            },
            stopChildScenario: (id) => this.stop(id),
            setWorldEffect: (name, scale) => userCtx.setWorldEffect(name, scale),
            getMajorCities: (maxCount) => userCtx.getMajorCities(maxCount),
            getRoadCount: () => userCtx.getRoadCount(),
            getSeaLevelMultiplier: () => userCtx.getSeaLevelMultiplier(),
        };
    }
    registerHandler(kind, handler) {
        this.handlers.set(kind, handler);
    }
    start(kind, payload, totalDays, durationDays, opts = {}) {
        const handler = this.handlers.get(kind);
        if (!handler) {
            throw new Error(`ScenarioRegistry: no handler registered for kind '${kind}'`);
        }
        // Climate-class scenarios get one of two slots. Both slots full
        // (two concurrent climate scenarios already running) → refuse.
        let assignedSlot = null;
        if (handler.isClimateClass) {
            const slotA = this.active.find((e) => e.climateSlot === 0);
            const slotB = this.active.find((e) => e.climateSlot === 1);
            if (!slotA)
                assignedSlot = 0;
            else if (!slotB)
                assignedSlot = 1;
            else
                return { ok: false, reason: 'climate-busy', activeId: slotA.scn.id };
        }
        const id = `scn_${nextScenarioCounter++}`;
        const scn = {
            id,
            kind,
            label: opts.label ?? defaultLabel(kind),
            startedAtDay: totalDays,
            durationDays,
            autoRepeat: opts.autoRepeat ?? false,
            silent: opts.silent ?? false,
            payload,
        };
        const stamps = [];
        this.capturingStamps = stamps;
        try {
            handler.onStart(scn, this.context);
        }
        finally {
            this.capturingStamps = null;
        }
        // Push first so `getPeakCombinedClimate` sees this scenario when the
        // budget is computed — opposing climate scenarios then read each
        // other's peak contributions and cancel inside `tallyProjectionBiome`.
        this.active.push({
            scn,
            stamps,
            climateSlot: assignedSlot,
            impactBudget: zeroBudget(),
        });
        this.active[this.active.length - 1].impactBudget = this.computeBudgetFor(handler, scn);
        this.lastTotalDays = totalDays;
        this.dirty = true;
        this.composedFrame = null;
        this.recomposeFrame(totalDays);
        if (handler.isClimateClass) {
            this.bakeBiomeOverrideTextures();
            // Combined peak changed — every other active climate scenario's
            // projection-based budget needs to re-read the new combined frame.
            this.recomputeClimateBudgets();
        }
        return { ok: true, id };
    }
    stop(id) {
        const idx = this.active.findIndex((e) => e.scn.id === id);
        if (idx < 0)
            return;
        const entry = this.active[idx];
        const handler = this.handlers.get(entry.scn.kind);
        if (handler)
            handler.onEnd(entry.scn, this.context);
        this.retireStamps(entry.stamps);
        this.active.splice(idx, 1);
        this.dirty = true;
        this.composedFrame = null;
        this.recomposeFrame(this.lastTotalDays);
        if (handler?.isClimateClass) {
            this.bakeBiomeOverrideTextures();
            this.recomputeClimateBudgets();
        }
    }
    /**
     * Throttled recompose: scar paint feeds millions of cells but the per-frame
     * fade is sub-perceptible. Two floors, picked by whether a force flag is set:
     *   • Natural fade   → RECOMPOSE_THROTTLE_MS (1 s)
     *   • Forced (edge)  → RECOMPOSE_FORCE_FLOOR_MS (150 ms)
     * Async stamp replies during a Nuclear War set the force flag dozens of
     * times per second; the 150 ms floor collapses that burst into ~6 paint
     * steps/sec so the main thread isn't pegged. Force flag is preserved
     * across throttle skips so the next eligible frame still paints.
     */
    maybeRecompose(totalDays) {
        if (!this.dirty)
            return;
        const now = performance.now();
        const floor = this.forceRecomposeNext
            ? RECOMPOSE_FORCE_FLOOR_MS
            : RECOMPOSE_THROTTLE_MS;
        if (now - this.lastRecomposeWallMs < floor)
            return;
        this.recomposeFrame(totalDays);
        this.lastRecomposeWallMs = now;
        this.forceRecomposeNext = false;
    }
    tick(totalDays) {
        this.lastTotalDays = totalDays;
        // Invalidate the composed-frame cache — totalDays drives every
        // progress-dependent value in it.
        this.composedFrame = null;
        if (totalDays !== this.lastComposedTotalDays) {
            this.dirty = true;
        }
        // Idle path (no live scenarios). Covers two cases: pristine boot AND
        // post-war when only retired stamps remain. The only useful per-frame
        // work here is the throttled recompose (it drains retired-stamp clears).
        if (this.active.length === 0) {
            this.maybeRecompose(totalDays);
            return;
        }
        let climateMembershipChanged = false;
        for (let i = this.active.length - 1; i >= 0; i--) {
            const entry = this.active[i];
            const elapsed = totalDays - entry.scn.startedAtDay;
            const raw = elapsed / Math.max(1e-6, entry.scn.durationDays);
            const handler = this.handlers.get(entry.scn.kind);
            if (raw >= 1) {
                if (handler)
                    handler.onEnd(entry.scn, this.context);
                if (entry.scn.autoRepeat) {
                    // Re-fire with the same payload; new stamps captured from a
                    // fresh onStart so wind / position can re-sample.
                    entry.scn.startedAtDay = totalDays;
                    this.retireStamps(entry.stamps);
                    const stamps = [];
                    this.capturingStamps = stamps;
                    try {
                        if (handler)
                            handler.onStart(entry.scn, this.context);
                    }
                    finally {
                        this.capturingStamps = null;
                    }
                    entry.stamps = stamps;
                    // Auto-repeat must paint the fresh stamps this frame, not 1s later.
                    this.forceRecomposeNext = true;
                    // Re-tally the impact budget — the fresh payload may have
                    // moved the strike footprint or changed strike count.
                    if (handler)
                        entry.impactBudget = this.computeBudgetFor(handler, entry.scn);
                    if (handler?.isClimateClass)
                        climateMembershipChanged = true;
                }
                else {
                    this.retireStamps(entry.stamps);
                    this.active.splice(i, 1);
                    if (handler?.isClimateClass)
                        climateMembershipChanged = true;
                }
                this.dirty = true;
            }
            else if (handler) {
                const progress01 = raw < 0 ? 0 : raw;
                handler.onTick(entry.scn, progress01, this.context);
            }
        }
        this.maybeRecompose(totalDays);
        if (climateMembershipChanged) {
            this.bakeBiomeOverrideTextures();
            this.recomputeClimateBudgets();
        }
    }
    /**
     * Active scenarios visible to UI / `__ED.scenarios.list()`. Silent
     * children (e.g. Nuclear War's per-strike Nuclear scenarios) are
     * filtered out — the parent card already surfaces their state.
     */
    list() {
        const out = [];
        for (let i = 0; i < this.active.length; i++) {
            const scn = this.active[i].scn;
            if (!scn.silent)
                out.push(scn);
        }
        return out;
    }
    /** All active scenarios including silent children. Use for debug. */
    listAll() {
        return this.active.map((e) => e.scn);
    }
    size() {
        return this.active.length;
    }
    /**
     * Slot-occupancy snapshot for the climate scenario pool. `activeIds`
     * lists the scenario ids holding a slot (0, 1, or 2 entries); `full`
     * flips true when both slots are taken so launcher UI can disable
     * new climate launches without polling individual scenarios.
     */
    getClimateSlotState() {
        const activeIds = [];
        for (let i = 0; i < this.active.length; i++) {
            const handler = this.handlers.get(this.active[i].scn.kind);
            if (handler?.isClimateClass)
                activeIds.push(this.active[i].scn.id);
        }
        return { activeIds, full: activeIds.length >= 2 };
    }
    /**
     * Composed climate + cloud + envelope frame at `lastTotalDays`. Walks
     * the active list once, builds all values, caches the result for the
     * rest of the tick. The per-channel getters delegate here so reading
     * all of them (the common case in `main.ts`) costs one walk, not
     * many.
     *
     * Temperature and sea level SUM across active climate scenarios.
     * `envelopes[slot]` carries each scenario's own envelope so the two
     * slot equirects in the LAND shader can crossfade independently.
     *
     * Cache invalidates whenever `lastTotalDays` advances or the active
     * list mutates (start / stop / auto-repeat).
     */
    composeFrame() {
        if (this.composedFrame && this.composedFrameTotalDays === this.lastTotalDays) {
            return this.composedFrame;
        }
        let tempC = 0;
        let seaLevelM = 0;
        let precipMm = 0;
        const envelopes = [0, 0];
        const cloud = {
            sootGlobal: 0,
            sootRegionalWeight: 0,
            sootSunTint: { r: 1, g: 1, b: 1 },
            sootAmbientTint: { r: 1, g: 1, b: 1 },
        };
        const seafloor = zeroSeafloorFrame();
        let bestSoot = -1;
        for (let i = 0; i < this.active.length; i++) {
            const entry = this.active[i];
            const handler = this.handlers.get(entry.scn.kind);
            if (!handler)
                continue;
            const elapsed = this.lastTotalDays - entry.scn.startedAtDay;
            const raw = elapsed / Math.max(1e-6, entry.scn.durationDays);
            const progress01 = raw < 0 ? 0 : raw > 1 ? 1 : raw;
            if (handler.isClimateClass) {
                if (handler.getClimateContribution) {
                    const c = handler.getClimateContribution(entry.scn, progress01, this.context);
                    tempC += c.tempC;
                    seaLevelM += c.seaLevelM;
                    precipMm += c.precipMm;
                }
                const slot = entry.climateSlot;
                if (slot !== null) {
                    envelopes[slot] = handler.getClimateEnvelope
                        ? handler.getClimateEnvelope(entry.scn, progress01)
                        : climateRisePlateauFall(progress01);
                    // Per-slot seafloor contribution. LAND shader takes the two
                    // palettes + weights and crossfades against the default — no
                    // summation across slots here, so two co-active scenarios stay
                    // independently visible.
                    if (handler.getSeafloorContribution) {
                        const sf = handler.getSeafloorContribution(entry.scn, progress01);
                        if (slot === 0) {
                            seafloor.paletteA[0] = { ...sf.palette[0] };
                            seafloor.paletteA[1] = { ...sf.palette[1] };
                            seafloor.paletteA[2] = { ...sf.palette[2] };
                            seafloor.weightA = sf.weight;
                        }
                        else {
                            seafloor.paletteB[0] = { ...sf.palette[0] };
                            seafloor.paletteB[1] = { ...sf.palette[1] };
                            seafloor.paletteB[2] = { ...sf.palette[2] };
                            seafloor.weightB = sf.weight;
                        }
                    }
                }
            }
            if (handler.getCloudContribution) {
                const c = handler.getCloudContribution(entry.scn, progress01);
                // Sum-capped at 1.0: two soot emitters add their overcast/regional
                // bumps but can't push the sky past fully clouded. Tint snaps to
                // whichever individual contribution carries the most soot.
                cloud.sootGlobal = Math.min(1, cloud.sootGlobal + c.sootGlobal);
                cloud.sootRegionalWeight = Math.min(1, cloud.sootRegionalWeight + c.sootRegionalWeight);
                if (c.sootGlobal > bestSoot) {
                    bestSoot = c.sootGlobal;
                    cloud.sootSunTint = c.sootSunTint;
                    cloud.sootAmbientTint = c.sootAmbientTint;
                }
            }
        }
        this.composedFrame = { climate: { tempC, seaLevelM, precipMm }, envelopes, cloud, seafloor };
        this.composedFrameTotalDays = this.lastTotalDays;
        return this.composedFrame;
    }
    /**
     * Composed climate frame at `lastTotalDays`. Sum over every active
     * climate-class scenario (≤1 due to the mutex). Returns the zero
     * contribution when no climate scenario is active.
     */
    getClimateFrame() {
        return this.composeFrame().climate;
    }
    /**
     * Per-slot climate envelopes in [0, 1]. Each entry corresponds to one
     * of the two climate-scenario slots; index 0 is `uClimateEnvelope`
     * and index 1 is `uClimateEnvelopeB` in the land shader. The shader
     * multiplies each by its slot's baked stamp-weight channel per
     * fragment for an independent crossfade.
     *
     * Handlers may override the envelope shape via `getClimateEnvelope` —
     * Nuclear War does so to suppress biome crossfade during the strike
     * phase. Otherwise the fallback is `climateRisePlateauFall(progress01)`.
     */
    getClimateEnvelopes() {
        return this.composeFrame().envelopes;
    }
    /**
     * Per-slot seafloor frame for the LAND shader's seafloor branch.
     * Cached on the same key as the climate frame, so reading both each
     * tick costs one walk over the active list.
     *
     * Zeroed when no active climate scenario implements
     * `getSeafloorContribution` — the shader then paints the default
     * palette unchanged on exposed shelf cells.
     */
    getSeafloorFrame() {
        return this.composeFrame().seafloor;
    }
    /**
     * True iff both climate slots (0 and 1) are taken — a third
     * climate-class `start()` would return `'climate-busy'`. The
     * scenarios-launcher polls this each frame to disable the Launch
     * buttons when neither slot is free.
     */
    climateSlotsFull() {
        let slotATaken = false;
        let slotBTaken = false;
        for (let i = 0; i < this.active.length; i++) {
            const slot = this.active[i].climateSlot;
            if (slot === 0)
                slotATaken = true;
            else if (slot === 1)
                slotBTaken = true;
        }
        return slotATaken && slotBTaken;
    }
    /**
     * Composed cloud frame across every active scenario that emits a cloud
     * contribution. Soot scalars sum across emitters and clamp at 1.0 so
     * two concurrent soot sources can't push the sky past fully clouded.
     * Tint colours snap to whichever individual contribution carries the
     * highest `sootGlobal`.
     */
    getCloudFrame() {
        return this.composeFrame().cloud;
    }
    /**
     * World-health snapshot for the HUD strip. Pure scalar roll-up of
     * each active scenario's `impactBudget` scaled by its `intensity()`
     * sample. O(activeScenarios × distinct biome classes) — typically a
     * dozen multiply-adds, sub-microsecond — runs every frame and reads
     * nothing per-cell.
     *
     * Bars:
     *   biome         1 - sum_class(biomeLossFraction)
     *   civilization  1 - populationLost / TOTAL_POPULATION
     *   radiation     1 - exp(-radUnits / RADIATION_HALF_FULL)
     */
    getWorldHealth() {
        const baselineShares = this.getBaselineCategoryShares();
        const citiesTotal = this.citiesCache?.length ?? 0;
        if (this.active.length === 0) {
            return pristineWorldHealth(baselineShares, citiesTotal);
        }
        let popLost = 0;
        let citiesLost = 0;
        let radUnits = 0;
        let bombsActive = 0;
        let biomeQualityNetTotal = 0;
        const changeByKey = new Map();
        // Live diorama shares — start from baseline, push area between
        // categories as scenarios degrade or upgrade land.
        const shares = { ...baselineShares };
        for (let i = 0; i < this.active.length; i++) {
            const entry = this.active[i];
            const handler = this.handlers.get(entry.scn.kind);
            if (!handler)
                continue;
            const elapsed = this.lastTotalDays - entry.scn.startedAtDay;
            const raw = elapsed / Math.max(1e-6, entry.scn.durationDays);
            const progress01 = raw < 0 ? 0 : raw > 1 ? 1 : raw;
            const intensity = handler.intensity
                ? handler.intensity(entry.scn, progress01)
                : progress01;
            if (intensity <= 0)
                continue;
            const b = entry.impactBudget;
            popLost += b.populationAtRisk * intensity;
            citiesLost += b.citiesAtRisk * intensity;
            radUnits += b.radiationUnits * intensity;
            biomeQualityNetTotal += b.biomeQualityNet * intensity;
            for (let c = 0; c < b.biomeChanges.length; c++) {
                const ch = b.biomeChanges[c];
                const key = (ch.fromId << 8) | ch.toId;
                const scaled = ch.areaFraction * intensity;
                const prev = changeByKey.get(key);
                if (prev)
                    prev.areaFraction += scaled;
                else
                    changeByKey.set(key, {
                        fromId: ch.fromId,
                        toId: ch.toId,
                        areaFraction: scaled,
                        qualityDelta: ch.qualityDelta,
                    });
                const fromCat = biomeCategoryOf(ch.fromId);
                const toCat = biomeCategoryOf(ch.toId);
                if (fromCat)
                    shares[fromCat] = Math.max(0, shares[fromCat] - scaled);
                if (toCat)
                    shares[toCat] += scaled;
            }
            if (handler.getBombsActive)
                bombsActive += handler.getBombsActive(entry.scn);
        }
        const biomeChanges = [];
        for (const ch of changeByKey.values()) {
            biomeChanges.push({
                fromId: ch.fromId,
                toId: ch.toId,
                name: biomeName(ch.fromId),
                deltaPct: ch.areaFraction * ch.qualityDelta * 100,
            });
        }
        // Order by absolute quality impact so the biggest movers — losses
        // OR gains — float to the top of the HUD top-3 readout.
        biomeChanges.sort((a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct));
        const totals = this.worldTotalsCache;
        const totalPop = totals && totals.population > 0 ? totals.population : 1;
        // `populationLostPct` is a fraction 0..1 (the HUD multiplies by 100
        // for the readout). Despite the name, NOT pre-multiplied — keep the
        // contract uniform with `biome` / `civilization` (also 0..1).
        const populationLostPct = popLost / totalPop;
        const civilization = Math.max(0, 1 - popLost / totalPop);
        // Biome bar fill is computed in the HUD layer from `biomeQualityNet`
        // and `SCALE_BIOME_BAR` so the signed net stays inspectable here.
        const biome = 1;
        const radiation = 1 - Math.exp(-radUnits / RADIATION_HALF_FULL);
        return {
            biome,
            civilization,
            radiation,
            stats: {
                citiesLost,
                citiesTotal,
                populationLost: popLost,
                populationLostPct,
                biomeChanges,
                biomeQualityNet: biomeQualityNetTotal,
                biomeCategoryShares: shares,
                bombsActive,
                radiationUnits: radUnits,
            },
        };
    }
    /**
     * Boot-time world totals (population, cities count, etc.) for HUD
     * readouts. Returns null until the first impact-budget call has
     * lazily populated the cache. UI polls each frame and falls back to
     * placeholder text while null.
     */
    getWorldTotals() {
        if (!this.worldTotalsCache && this.biomeOverrideSink) {
            this.getImpactDeps();
        }
        return this.worldTotalsCache;
    }
    /**
     * Six-bucket pristine biome diorama composition. Walks
     * `worldTotalsCache.biomeCellsByClass` once via `biomeCategoryOf`,
     * caches the result for the registry's life — the underlying baked
     * biome raster never changes after manifest load. Returns zero shares
     * if the world totals haven't been built yet (boot moment before the
     * first impact-budget call); the HUD treats zero shares as "no
     * diorama yet" and renders empty hexes.
     */
    getBaselineCategoryShares() {
        if (this.baselineSharesCache)
            return this.baselineSharesCache;
        // Force the world-totals cache to populate so we can read the
        // biome cell histogram even when no scenarios are active.
        if (!this.worldTotalsCache && this.biomeOverrideSink) {
            this.getImpactDeps();
        }
        const totals = this.worldTotalsCache;
        if (!totals)
            return zeroBiomeCategoryShares();
        const shares = zeroBiomeCategoryShares();
        let total = 0;
        for (const k of Object.keys(totals.biomeCellsByClass)) {
            const id = Number(k);
            const cat = biomeCategoryOf(id);
            if (!cat)
                continue;
            const count = totals.biomeCellsByClass[id] ?? 0;
            shares[cat] += count;
            total += count;
        }
        // Refuse to cache an empty histogram — that just means the baked
        // attribute texture isn't ready yet (this can happen on the very
        // first frame after reload). Let the next frame retry instead of
        // freezing an all-zero diorama.
        if (total <= 0)
            return zeroBiomeCategoryShares();
        shares.rainforest /= total;
        shares.temperateForest /= total;
        shares.grassland /= total;
        shares.desert /= total;
        shares.tundraIce /= total;
        shares.wasteland /= total;
        this.baselineSharesCache = shares;
        return shares;
    }
    /**
     * Lazy world-totals + cities-cache build. Both read straight from
     * the context / biome-override sink; cached for the registry's life.
     * The combined climate frame passes through fresh on every call so a
     * scenario starting / stopping always sees the up-to-date cancellation.
     */
    getImpactDeps() {
        if (!this.biomeOverrideSink)
            return null;
        if (!this.worldTotalsCache) {
            this.citiesCache = this.context.getMajorCities(50000);
            const sink = this.biomeOverrideSink;
            const polygonLookup = sink.getPolygonLookup();
            const cities = this.citiesCache;
            this.worldTotalsCache = computeWorldTotals({
                getCityPopulations: function* () {
                    for (let i = 0; i < cities.length; i++)
                        yield cities[i].pop;
                },
                getRoadCount: () => this.context.getRoadCount(),
                countBiomesGlobal: () => sink.countBiomesGlobal(),
                getPolygonLookup: () => polygonLookup,
            });
        }
        const lookup = this.biomeOverrideSink.getPolygonLookup();
        const sink = this.biomeOverrideSink;
        return {
            cities: this.citiesCache ?? [],
            polygonLookup: lookup,
            totals: this.worldTotalsCache,
            getPolygonIdAt: (lat, lon) => sink.getPolygonIdAt(lat, lon),
            combinedClimate: this.getPeakCombinedClimate(),
        };
    }
    /**
     * Peak combined climate frame — Σ over active climate scenarios of
     * each handler's `peakClimateContribution(scn)` (or the envelope = 1
     * fallback of `getClimateContribution`). This is the delta the polygon
     * projection consumes at bake / budget time, so opposing scenarios
     * (Global Warming + Ice Age) cancel here exactly once, on every
     * surface that consults it.
     */
    getPeakCombinedClimate() {
        let tempC = 0;
        let seaLevelM = 0;
        let precipMm = 0;
        for (let i = 0; i < this.active.length; i++) {
            const entry = this.active[i];
            const handler = this.handlers.get(entry.scn.kind);
            if (!handler?.isClimateClass)
                continue;
            let c = null;
            if (handler.peakClimateContribution) {
                c = handler.peakClimateContribution(entry.scn, this.context);
            }
            else if (handler.getClimateContribution) {
                c = handler.getClimateContribution(entry.scn, 1, this.context);
            }
            if (!c)
                continue;
            tempC += c.tempC;
            seaLevelM += c.seaLevelM;
            precipMm += c.precipMm;
        }
        return { tempC, seaLevelM, precipMm };
    }
    /**
     * Re-tally every active climate scenario's impact budget. Called when
     * a climate scenario starts, stops, or auto-repeats — the combined
     * peak frame has shifted, so each surviving scenario needs to see the
     * new delta its `tallyProjectionBiome` will project against.
     */
    recomputeClimateBudgets() {
        for (let i = 0; i < this.active.length; i++) {
            const entry = this.active[i];
            const handler = this.handlers.get(entry.scn.kind);
            if (!handler?.isClimateClass)
                continue;
            entry.impactBudget = this.computeBudgetFor(handler, entry.scn);
        }
    }
    /**
     * Run a handler's `computeImpactBudget` against the lazy impact deps.
     * Returns `zeroBudget()` when the impact pipeline is unavailable
     * (fixture / test setups with no `biomeOverrideSink`) so the rest of
     * the registry keeps working with a benign zero contribution.
     */
    computeBudgetFor(handler, scn) {
        const deps = this.getImpactDeps();
        if (!deps)
            return zeroBudget();
        return handler.computeImpactBudget(scn, deps);
    }
    retireStamps(stamps) {
        for (let s = 0; s < stamps.length; s++) {
            const stamp = stamps[s];
            const key = stamp.attribute ?? 'wasteland';
            // Biome-override stamps are handled by the bake pass — no
            // per-sink dirty-cell emit needed for them.
            if (key === 'biomeOverride')
                continue;
            // Unknown sink key: skip silently. A handler may declare a sink
            // that isn't wired in this registry instance (e.g. dev builds
            // running a subset of attribute textures) — there's nothing to
            // emit to in that case.
            if (!this.sinkByKey.has(key))
                continue;
            let bucket = this.retiredCellsByKey.get(key);
            if (!bucket) {
                bucket = [];
                this.retiredCellsByKey.set(key, bucket);
            }
            const cells = stamp.cells;
            for (let i = 0; i < cells.length; i++)
                bucket.push(cells[i]);
            this.retiredCellsTotal += cells.length;
        }
    }
    /**
     * For each registered attribute sink, compose every active stamp
     * targeting that sink by `value × decay(progress01)`, cap at 1, and
     * push the dirty cells + values to the sink. `accBuf` / `markBuf` /
     * `dirtyList` are reset between sinks so an emission for one
     * attribute never leaks into another.
     *
     * Stamps with `attribute === sink.key` route to that sink; stamps
     * with no `attribute` default to `'wasteland'`. Biome-override
     * stamps live outside this loop — the bake pass owns them.
     */
    recomposeFrame(totalDays) {
        if (this.tuning.decayExponent !== this.lastComposedDecayExponent)
            this.dirty = true;
        if (!this.dirty)
            return;
        for (let sinkIdx = 0; sinkIdx < this.attributeSinks.length; sinkIdx++) {
            this.composeAndEmitForSink(this.attributeSinks[sinkIdx], totalDays);
        }
        // Per-sink composition drained its own retired bucket. Reset the
        // global counter so the tick-time short-circuit sees clean state.
        this.retiredCellsTotal = 0;
        this.dirty = false;
        this.lastComposedTotalDays = totalDays;
        this.lastComposedDecayExponent = this.tuning.decayExponent;
    }
    composeAndEmitForSink(sink, totalDays) {
        const sinkKey = sink.key;
        for (let s = 0; s < this.active.length; s++) {
            const entry = this.active[s];
            const elapsed = totalDays - entry.scn.startedAtDay;
            const raw = elapsed / Math.max(1e-6, entry.scn.durationDays);
            const progress01 = raw < 0 ? 0 : raw > 1 ? 1 : raw;
            const intensityNormal = decayQuickThenSlow(progress01, this.tuning.decayExponent);
            const intensitySustained = decaySustained(progress01);
            const intensityClimate = climateRisePlateauFall(progress01);
            for (let stIdx = 0; stIdx < entry.stamps.length; stIdx++) {
                const stamp = entry.stamps[stIdx];
                const stampKey = stamp.attribute ?? 'wasteland';
                if (stampKey !== sinkKey)
                    continue;
                const intensity = stamp.decayMode === 'sustained'
                    ? intensitySustained
                    : stamp.decayMode === 'climateRiseFall'
                        ? intensityClimate
                        : intensityNormal;
                if (intensity <= 0)
                    continue;
                const cells = stamp.cells;
                const values = stamp.values;
                for (let i = 0; i < cells.length; i++) {
                    const ipix = cells[i];
                    if (this.markBuf[ipix] === 0) {
                        this.markBuf[ipix] = 1;
                        this.appendDirty(ipix);
                    }
                    this.accBuf[ipix] += values[i] * intensity;
                }
            }
        }
        // Re-emit cells whose stamps retired since the previous frame so
        // this sink's texture clears them.
        const retired = this.retiredCellsByKey.get(sinkKey);
        if (retired && retired.length > 0) {
            for (let i = 0; i < retired.length; i++) {
                const ipix = retired[i];
                if (this.markBuf[ipix] === 0) {
                    this.markBuf[ipix] = 1;
                    this.appendDirty(ipix);
                }
            }
            retired.length = 0;
        }
        if (this.dirtyCount > 0) {
            const need = this.dirtyCount;
            if (this.scratchEmitCells.length < need) {
                const cap = Math.max(this.scratchEmitCells.length * 2, need);
                this.scratchEmitCells = new Uint32Array(cap);
                this.scratchEmitValues = new Float32Array(cap);
            }
            const cells = this.scratchEmitCells;
            const values = this.scratchEmitValues;
            for (let i = 0; i < need; i++) {
                const ipix = this.dirtyList[i];
                cells[i] = ipix;
                const v = this.accBuf[ipix];
                values[i] = v > 1 ? 1 : v;
            }
            sink.applyFrame(cells.subarray(0, need), values.subarray(0, need));
            for (let i = 0; i < need; i++) {
                const ipix = this.dirtyList[i];
                this.accBuf[ipix] = 0;
                this.markBuf[ipix] = 0;
            }
            this.dirtyCount = 0;
        }
    }
    /**
     * Bake every active climate-class scenario's biome paint into the
     * two-slot per-polygon override textures. Called when membership
     * changes (start / stop / auto-repeat) — never per frame.
     *
     * Projection-driven: the registry sums every active climate
     * scenario's `peakClimateContribution` into a single combined delta,
     * runs `projectBiome` over every polygon, and writes the resulting
     * (class / weight / tStart01) trio into each active slot's per-polygon
     * textures. With two climate slots both active, the projection
     * weight is split 50/50 between them so the GPU sum stays
     * consistent — opposing scenarios at peak collapse to a near-zero
     * combined delta, which `projectBiome` then renders as near-empty
     * stamps. That's the cancellation mechanism.
     *
     * Any handler-painted `'biomeOverride'` ellipse / band stamps still
     * flow into the slot stamps as before — projection drives the bulk
     * planet paint, hand-painted regions stack on top.
     */
    bakeBiomeOverrideTextures() {
        if (!this.biomeOverrideSink)
            return;
        const slotA = [];
        const slotB = [];
        let slotAActive = false;
        let slotBActive = false;
        for (let s = 0; s < this.active.length; s++) {
            const entry = this.active[s];
            const handler = this.handlers.get(entry.scn.kind);
            if (!handler?.isClimateClass)
                continue;
            const slot = entry.climateSlot;
            if (slot === null)
                continue;
            if (slot === 0)
                slotAActive = true;
            else if (slot === 1)
                slotBActive = true;
            const target = slot === 0 ? slotA : slotB;
            for (let stIdx = 0; stIdx < entry.stamps.length; stIdx++) {
                const stamp = entry.stamps[stIdx];
                if (stamp.attribute !== 'biomeOverride')
                    continue;
                const biomeId = stamp.biomeId ?? 0;
                if (biomeId === 0)
                    continue;
                const baked = {
                    cells: stamp.cells,
                    values: stamp.values,
                    biomeId,
                };
                if (stamp.tStart01s)
                    baked.tStart01s = stamp.tStart01s;
                target.push(baked);
            }
        }
        this.biomeOverrideSink.bakeBiomeOverrideStamps({ slotA, slotB });
        // Projection bake — combined-frame polygon walk. Drives the bulk of
        // climate biome paint. Slot bookkeeping clears any slot that no
        // active climate scenario holds anymore, otherwise the stale
        // projection would linger on the planet.
        if (slotAActive || slotBActive) {
            const sink = this.biomeOverrideSink;
            const lookup = sink.getPolygonLookup();
            const combined = this.getPeakCombinedClimate();
            const activeSlots = (slotAActive ? 1 : 0) + (slotBActive ? 1 : 0);
            const weightScale = activeSlots > 0 ? 1 / activeSlots : 0;
            const tex = buildProjectionPolygonTextures({
                polygonBiome: lookup.biome,
                count: lookup.count,
                delta: { tempC: combined.tempC, precipMm: combined.precipMm },
                weightScale,
            });
            if (slotAActive) {
                sink.bakePolygonOverride(0, tex.classByPoly, tex.weightByPoly, tex.tStart01ByPoly);
            }
            else if (sink.clearPolygonOverrideSlot) {
                sink.clearPolygonOverrideSlot(0);
            }
            if (slotBActive) {
                // Both slots receive the same combined-frame projection at the
                // split weight. Cheap — already computed above, just rewrite
                // the slot-1 textures with the same buffers.
                sink.bakePolygonOverride(1, tex.classByPoly, tex.weightByPoly, tex.tStart01ByPoly);
            }
            else if (sink.clearPolygonOverrideSlot) {
                sink.clearPolygonOverrideSlot(1);
            }
        }
        else if (this.biomeOverrideSink.clearPolygonOverrideSlot) {
            this.biomeOverrideSink.clearPolygonOverrideSlot(0);
            this.biomeOverrideSink.clearPolygonOverrideSlot(1);
        }
    }
    appendDirty(ipix) {
        if (this.dirtyCount >= this.dirtyList.length) {
            const grown = new Uint32Array(Math.max(this.dirtyList.length * 2, this.dirtyCount + 1));
            grown.set(this.dirtyList);
            this.dirtyList = grown;
        }
        this.dirtyList[this.dirtyCount++] = ipix;
    }
    captureEllipsePaint(args, userCtx) {
        if (!this.capturingStamps) {
            userCtx.paintAttributeEllipse(args);
            return;
        }
        // Async path (worker): push an empty shell now, fill its cells +
        // values when the worker replies. The shell carries the routing
        // metadata (attribute, biomeId, decayMode) up front so `start()`'s
        // accounting (slot pick, peakCombinedClimate, bake passes) still
        // sees a well-formed stamp — it just has zero cells until the
        // worker resolves.
        const stamp = {
            cells: new Uint32Array(0),
            values: new Float32Array(0),
            attribute: args.attribute,
        };
        if (args.attribute === 'biomeOverride' && args.biomeOverride) {
            stamp.biomeId = args.biomeOverride.biomeId;
        }
        if (args.decayMode)
            stamp.decayMode = args.decayMode;
        this.capturingStamps.push(stamp);
        if (this.requestStamp) {
            void this.requestStamp('ellipse', args, this.nside, this.ordering).then((r) => this.fillCapturedStamp(stamp, r));
        }
        else {
            const result = computeEllipseStamp(args, this.nside, this.ordering);
            stamp.cells = result.cells;
            stamp.values = result.values;
        }
    }
    /**
     * Pre-baked cell-list stamp. Climate destruction scenarios compute
     * the exact HEALPix cell footprint at `onStart` (cells under peak
     * sea level / cells inside polygons projected to flip to ICE) and
     * hand it to the registry as a single `value`-everywhere stamp. The
     * registry composes it just like an ellipse / band stamp; no worker
     * round-trip — the caller already did the work.
     */
    captureCellsPaint(args, userCtx) {
        if (!this.capturingStamps) {
            userCtx.paintAttributeCells(args);
            return;
        }
        const v = args.value > 1 ? 1 : args.value < 0 ? 0 : args.value;
        const values = new Float32Array(args.cells.length);
        if (v !== 0)
            values.fill(v);
        const stamp = {
            cells: args.cells,
            values,
            attribute: args.attribute,
        };
        if (args.decayMode)
            stamp.decayMode = args.decayMode;
        this.capturingStamps.push(stamp);
    }
    captureBandPaint(args, userCtx) {
        if (!this.capturingStamps) {
            userCtx.paintAttributeBand(args);
            return;
        }
        const stamp = {
            cells: new Uint32Array(0),
            values: new Float32Array(0),
            attribute: args.attribute,
        };
        if (args.attribute === 'biomeOverride' && args.biomeOverride) {
            stamp.biomeId = args.biomeOverride.biomeId;
        }
        if (args.decayMode)
            stamp.decayMode = args.decayMode;
        this.capturingStamps.push(stamp);
        if (this.requestStamp) {
            void this.requestStamp('band', args, this.nside, this.ordering).then((r) => this.fillCapturedStamp(stamp, r));
        }
        else {
            const result = computeBandStamp(args, this.nside, this.ordering);
            stamp.cells = result.cells;
            stamp.values = result.values;
        }
    }
    /**
     * Worker-reply landing for an async-captured stamp shell. Writes the
     * cells + values, then re-fires the post-start work the registry
     * normally does in `start()`. Drops the reply if the owning scenario
     * has already been retired (stop() / autoRepeat may close it before
     * the worker replies).
     */
    fillCapturedStamp(stamp, result) {
        // Verify the stamp is still attached to an active scenario. Stop()
        // / autoRepeat may have retired it; cross-scenario contamination is
        // impossible because the closure captures the specific stamp object.
        let owner = null;
        for (const e of this.active) {
            if (e.stamps.indexOf(stamp) >= 0) {
                owner = e;
                break;
            }
        }
        if (!owner)
            return;
        stamp.cells = result.cells;
        stamp.values = result.values;
        this.dirty = true;
        this.composedFrame = null;
        // Set the force flag and let the next `tick` → `maybeRecompose` paint it.
        // Direct `recomposeFrame()` here used to fire once per async reply — a
        // 70-strike war reply storm would trigger 70 full recomposes back-to-back
        // and trip the browser's "Page not responsive" watchdog. The 150 ms
        // force floor in maybeRecompose now collapses those replies into ~6
        // paint steps/sec while still feeling immediate to the eye.
        this.forceRecomposeNext = true;
        if (stamp.attribute === 'biomeOverride' && owner.climateSlot !== null) {
            this.bakeBiomeOverrideTextures();
        }
    }
}
function defaultLabel(kind) {
    switch (kind) {
        case 'nuclear':
            return 'Nuclear strike';
        case 'globalWarming':
            return 'Global warming';
        case 'iceAge':
            return 'Ice age';
        case 'nuclearWar':
            return 'Nuclear war';
    }
}

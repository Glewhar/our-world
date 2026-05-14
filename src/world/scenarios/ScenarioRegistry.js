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
 *   Scenarios with `isClimateClass` paint into a static biome-override
 *   pipeline. Each climate-class scenario can only run one at a time
 *   (mutex via `isClimateClass`). At scenario start the registry hands
 *   the union of biome-override stamps to the sink's
 *   `bakeBiomeOverrideStamps`, which writes them once into two R8
 *   textures (class id + stamp weight). Per frame the registry exposes
 *   per-slot envelopes via `getClimateEnvelopes()`; the land shader
 *   computes
 *
 *     intensity[cell] = stampWeight[cell] × climateEnvelope
 *
 *   on the GPU and crossfades the baseline biome colour toward the
 *   override class. No CPU work proportional to stamp cells per frame.
 *
 *   Census: per-class cell counts refresh at ~1 Hz by walking the union
 *   of stamp cells and thresholding `stamp[cell] × envelope ≥ 0.5`.
 */
import { computeEllipseStamp } from '../../sim/fields/ellipse.js';
import { computeBandStamp } from '../../sim/fields/band.js';
import { zPhiToPix } from '../healpix.js';
import { decayQuickThenSlow, decaySustained, climateRisePlateauFall } from './recoveryCurves.js';
let nextScenarioCounter = 1;
/** Per-frame main-thread budget for the async biome-transition walker. */
const WALK_BUDGET_MS = 5;
/**
 * Census refresh threshold in wall-clock milliseconds. The biome-override
 * census walks the union of stamp cells (~2.8 M for global warming);
 * once-per-second amortises the cost to ≤ 1 % of frame budget.
 */
const CENSUS_REFRESH_MS = 1000;
/**
 * Cell counts as "overridden" once stampWeight × envelope crosses this
 * threshold. Matches the shader's smoothstep midpoint so the census
 * tracks what's actually visible.
 */
const CENSUS_OVERRIDE_THRESHOLD = 0.5;
/**
 * Saturated cell threshold for the destruction census. Matches the
 * cities + highways shader discard threshold (`mix(0.0, 0.5, h)`) so a
 * cell counted as "destroyed" here is one that's also visually wiped.
 */
const DESTRUCTION_KILL_THRESHOLD = 0.5;
// Earth's mean radius (km) — used for the destruction census's road
// length accumulation. Matches the same constant used elsewhere in the
// pipeline.
const EARTH_RADIUS_KM = 6371;
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
function latLonToPix(nside, ordering, latDeg, lonDeg) {
    const DEG = Math.PI / 180;
    const lat = latDeg * DEG;
    const TWO_PI = 2 * Math.PI;
    let lon = lonDeg * DEG;
    if (lon < 0)
        lon += TWO_PI;
    else if (lon >= TWO_PI)
        lon -= TWO_PI;
    return zPhiToPix(nside, ordering, Math.sin(lat), lon);
}
function haversineKm(lat1Deg, lon1Deg, lat2Deg, lon2Deg) {
    const DEG = Math.PI / 180;
    const lat1 = lat1Deg * DEG;
    const lat2 = lat2Deg * DEG;
    const dLat = (lat2Deg - lat1Deg) * DEG;
    const dLon = (lon2Deg - lon1Deg) * DEG;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
}
/**
 * Given `values` and `sorted` (a permutation of indices into `values`
 * with `values[sorted[k]]` non-increasing in k), return the smallest k
 * such that `values[sorted[k]] < cutoff`. Equivalently: the count of
 * indices at the front of `sorted` whose values are ≥ cutoff. Used by
 * the climate census so the threshold scan terminates as soon as the
 * sorted prefix drops below the qualifying value.
 */
function upperPrefixDesc(values, sorted, cutoff) {
    let lo = 0;
    let hi = sorted.length;
    while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if (values[sorted[mid]] >= cutoff)
            lo = mid + 1;
        else
            hi = mid;
    }
    return lo;
}
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
    capturingPendingWalk = null;
    /**
     * Pre-allocated scratch for the per-sink emit (cells + values). Grown
     * on demand; emitted via `subarray(0, count)` so each sink sees a
     * length-matched view without copying. Reused across sinks within a
     * single recompose pass — `accBuf` + `markBuf` are reset between
     * passes so a cell touched by sink A doesn't leak into sink B.
     */
    scratchEmitCells;
    scratchEmitValues;
    // ── Biome-override (climate) bookkeeping ─────────────────────────────
    /** Wall-clock ms at the last census refresh; 0 forces a refresh. */
    lastCensusRefreshMs = 0;
    /** Wall-clock ms at the last destruction-census refresh. */
    lastDestructionRefreshMs = 0;
    /**
     * Per-slot walker buffer pool (two sets, one per climate slot). With
     * two concurrent climate scenarios allowed, both can be walking at
     * the same time — each uses its own slot's buffers so they don't
     * stomp each other. Allocated lazily on first use; reset between
     * runs rather than reallocated, saving ~132 MB of GC churn per
     * scenario start at nside=1024.
     */
    walkerTargetByCell = [null, null];
    walkerWeightByCell = [null, null];
    walkerTStartByCell = [null, null];
    walkerMark = [null, null];
    /** Reusable per-target counts buffer for the two-pass walker finalizer. */
    walkerBucketCounts = null;
    /** Per-target write index during the second walker-finalize pass. */
    walkerBucketCursor = null;
    /**
     * Slot index attached to the next `paintBiomeTransition` capture. Set
     * by `start()` / auto-repeat for climate scenarios; null otherwise
     * (non-climate scenarios can't paint biome transitions).
     */
    capturingClimateSlot = null;
    /**
     * Lazy cache of `latLonToPix` per road vertex. Built on the first
     * destruction-census refresh; reused for every subsequent refresh.
     * The road set is static across the session.
     */
    roadIpixCache = null;
    /** Composed climate + cloud frame cache, keyed by `lastTotalDays`. */
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
            paintBiomeTransition: (rules) => this.captureBiomeTransitionPaint(rules, userCtx),
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
            getRoadSegments: () => userCtx.getRoadSegments(),
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
            walkerComplete: true,
        };
        let census = null;
        if (handler.isClimateClass && this.biomeOverrideSink) {
            const baseline = this.biomeOverrideSink.countBiomesGlobal();
            const current = {};
            for (const k of Object.keys(baseline))
                current[Number(k)] = baseline[Number(k)];
            census = { baseline, current, delta: {} };
        }
        else if (handler.isClimateClass) {
            census = { baseline: {}, current: {}, delta: {} };
        }
        const destruction = handler.hasDestructionCensus
            ? { strikes: 0, strikesScheduled: 0, cities: 0, population: 0, streetKm: 0 }
            : null;
        const stamps = [];
        this.capturingStamps = stamps;
        this.capturingPendingWalk = null;
        this.capturingClimateSlot = assignedSlot;
        try {
            handler.onStart(scn, this.context);
        }
        finally {
            this.capturingStamps = null;
            this.capturingClimateSlot = null;
        }
        const pendingWalk = this.capturingPendingWalk;
        this.capturingPendingWalk = null;
        scn.walkerComplete = !pendingWalk;
        this.active.push({
            scn,
            stamps,
            stampSortedIndices: new Array(stamps.length).fill(null),
            census,
            destruction,
            destructionBbox: null,
            lastDestructionCellCount: -1,
            pendingWalk,
            climateSlot: assignedSlot,
            lastCensusEnvelopeQuant: -1,
        });
        this.lastTotalDays = totalDays;
        this.dirty = true;
        this.composedFrame = null;
        this.recomposeFrame(totalDays);
        if (handler.isClimateClass)
            this.bakeBiomeOverrideTextures();
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
        entry.pendingWalk = null;
        this.retireStamps(entry.stamps);
        this.active.splice(idx, 1);
        this.dirty = true;
        this.composedFrame = null;
        this.recomposeFrame(this.lastTotalDays);
        if (handler?.isClimateClass)
            this.bakeBiomeOverrideTextures();
    }
    /**
     * Throttled recompose: scar paint feeds millions of cells but the per-frame
     * fade is sub-perceptible. Cap at ≤1× per real-time second so the long
     * post-war tail (~15 min real-time) stops saturating the main thread.
     * Wallclock cadence keeps the visible fade rate stable across sim speed,
     * pause, and scrub. Edges that must show immediately (new strike, scenario
     * start/stop, auto-repeat) bypass via `forceRecomposeNext`.
     */
    maybeRecompose(totalDays) {
        if (!this.dirty)
            return;
        const now = performance.now();
        if (!this.forceRecomposeNext &&
            now - this.lastRecomposeWallMs < RECOMPOSE_THROTTLE_MS) {
            return;
        }
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
        // post-war when only retired stamps remain. Walker + both census
        // refreshes all iterate `this.active` and degenerate to no-ops when
        // it's empty, but the function-call overhead is visible at 144 FPS
        // for the 15-minute scar-fade tail. The only useful per-frame work
        // here is the throttled recompose (it drains retired-stamp clears).
        if (this.active.length === 0) {
            this.maybeRecompose(totalDays);
            return;
        }
        const walkerJustCompleted = this.advancePendingWalks();
        let climateMembershipChanged = walkerJustCompleted;
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
                    this.capturingPendingWalk = null;
                    this.capturingClimateSlot = entry.climateSlot;
                    try {
                        if (handler)
                            handler.onStart(entry.scn, this.context);
                    }
                    finally {
                        this.capturingStamps = null;
                        this.capturingClimateSlot = null;
                    }
                    entry.stamps = stamps;
                    // Auto-repeat must paint the fresh stamps this frame, not 1s later.
                    this.forceRecomposeNext = true;
                    entry.stampSortedIndices = new Array(stamps.length).fill(null);
                    entry.pendingWalk = this.capturingPendingWalk;
                    this.capturingPendingWalk = null;
                    entry.scn.walkerComplete = !entry.pendingWalk;
                    // Destruction census also resets on auto-repeat (the bbox + cells
                    // may have moved with the new payload).
                    entry.destructionBbox = null;
                    entry.lastDestructionCellCount = -1;
                    if (entry.destruction) {
                        entry.destruction.strikes = 0;
                        entry.destruction.strikesScheduled = 0;
                        entry.destruction.cities = 0;
                        entry.destruction.population = 0;
                        entry.destruction.streetKm = 0;
                    }
                    // Climate auto-repeat resets the baseline census.
                    if (handler?.isClimateClass) {
                        if (this.biomeOverrideSink) {
                            const baseline = this.biomeOverrideSink.countBiomesGlobal();
                            const current = {};
                            for (const k of Object.keys(baseline))
                                current[Number(k)] = baseline[Number(k)];
                            entry.census = { baseline, current, delta: {} };
                        }
                        climateMembershipChanged = true;
                    }
                }
                else {
                    entry.pendingWalk = null;
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
        if (climateMembershipChanged)
            this.bakeBiomeOverrideTextures();
        this.refreshCensusIfDue();
        this.refreshDestructionCensusIfDue();
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
        const envelopes = [0, 0];
        const cloud = {
            sootGlobal: 0,
            sootRegionalWeight: 0,
            sootSunTint: { r: 1, g: 1, b: 1 },
            sootAmbientTint: { r: 1, g: 1, b: 1 },
        };
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
                    const c = handler.getClimateContribution(entry.scn, progress01);
                    tempC += c.tempC;
                    seaLevelM += c.seaLevelM;
                }
                // Walker not yet finished → suppress envelope for this slot so
                // the shader doesn't crossfade against an empty stamp channel.
                const slot = entry.climateSlot;
                if (slot !== null) {
                    envelopes[slot] = entry.pendingWalk
                        ? 0
                        : handler.getClimateEnvelope
                            ? handler.getClimateEnvelope(entry.scn, progress01)
                            : climateRisePlateauFall(progress01);
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
        this.composedFrame = { climate: { tempC, seaLevelM }, envelopes, cloud };
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
     * Per-scenario biome census. Returns null when no scenario with that
     * id is active, or when the scenario is non-climate-class.
     */
    getBiomeCensus(scenarioId) {
        const entry = this.active.find((e) => e.scn.id === scenarioId);
        if (!entry)
            return null;
        return entry.census;
    }
    /**
     * Per-scenario destruction census (strikes / cities / population /
     * streetKm). Returns null when no scenario with that id is active, or
     * when the handler did not opt into `hasDestructionCensus`.
     */
    getDestructionCensus(scenarioId) {
        const entry = this.active.find((e) => e.scn.id === scenarioId);
        if (!entry)
            return null;
        return entry.destruction;
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
            for (let stIdx = 0; stIdx < entry.stamps.length; stIdx++) {
                const stamp = entry.stamps[stIdx];
                const stampKey = stamp.attribute ?? 'wasteland';
                if (stampKey !== sinkKey)
                    continue;
                const intensity = stamp.decayMode === 'sustained' ? intensitySustained : intensityNormal;
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
     * Bake every active climate-class scenario's biome-override stamps
     * into the two-slot class + stamp textures. Called when membership
     * changes — never per frame.
     *
     * Each scenario's stamps go into its assigned slot (`entry.climateSlot`).
     * Surviving scenarios keep their slot across a peer's start/end so the
     * shader sampler doesn't flash. Scenarios whose walker is still
     * running contribute nothing this bake; the next bake (triggered when
     * the walker completes) installs their stamps.
     *
     * Trade-off: full rewrite of both slot channels every membership
     * change. A delta path that only re-wrote the changing slot's cells
     * would be cheaper for the asymmetric end-one-keep-one case, but the
     * bookkeeping would have to track per-slot stamp ownership across
     * auto-repeats; current call rate is low enough that the simpler
     * full rebake wins.
     */
    bakeBiomeOverrideTextures() {
        if (!this.biomeOverrideSink)
            return;
        const slotA = [];
        const slotB = [];
        for (let s = 0; s < this.active.length; s++) {
            const entry = this.active[s];
            const handler = this.handlers.get(entry.scn.kind);
            if (!handler?.isClimateClass)
                continue;
            if (entry.pendingWalk)
                continue;
            const slot = entry.climateSlot;
            if (slot === null)
                continue;
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
        // Force a census refresh on the next tick so the in-card table picks
        // up the new baseline / new stamp cells without waiting up to 1 s.
        for (let i = 0; i < this.active.length; i++) {
            this.active[i].lastCensusEnvelopeQuant = -1;
        }
        this.lastCensusRefreshMs = 0;
    }
    /**
     * Refresh the biome census for every active climate scenario at most
     * once per `CENSUS_REFRESH_MS`. Each scenario's census tracks its own
     * stamps against the same global baseline; per-cell flips below
     * threshold are accumulated independently so each scenario card shows
     * its own "Forest -3.2M km² / Desert +3.2M km²" readout.
     *
     * Per-stamp `sortedIndices` permutations order cells by `values`
     * descending; the threshold scan only iterates the prefix where
     * `values[ipix] ≥ threshold / envelope`. Sort is one-time per stamp
     * (O(N log N)); every subsequent refresh is O(K + log N).
     */
    refreshCensusIfDue() {
        if (!this.biomeOverrideSink)
            return;
        const now = performance.now();
        if (now - this.lastCensusRefreshMs < CENSUS_REFRESH_MS)
            return;
        this.lastCensusRefreshMs = now;
        const envelopes = this.getClimateEnvelopes();
        const sink = this.biomeOverrideSink;
        const threshold = CENSUS_OVERRIDE_THRESHOLD;
        for (let ei = 0; ei < this.active.length; ei++) {
            const entry = this.active[ei];
            const handler = this.handlers.get(entry.scn.kind);
            if (!handler?.isClimateClass)
                continue;
            if (!entry.census)
                continue;
            const slot = entry.climateSlot;
            if (slot === null)
                continue;
            const envelope = envelopes[slot];
            const envQuant = Math.round(envelope * 255);
            if (envQuant === entry.lastCensusEnvelopeQuant)
                continue;
            entry.lastCensusEnvelopeQuant = envQuant;
            const census = entry.census;
            for (const k of Object.keys(census.baseline)) {
                const cls = Number(k);
                census.current[cls] = census.baseline[cls];
            }
            for (const k of Object.keys(census.delta)) {
                const cls = Number(k);
                census.delta[cls] = 0;
            }
            if (envelope > 0) {
                // values[ipix] × envelope ≥ threshold ⇔ values[ipix] ≥ valueCutoff.
                const valueCutoff = threshold / envelope;
                for (let s = 0; s < entry.stamps.length; s++) {
                    const stamp = entry.stamps[s];
                    if (stamp.attribute !== 'biomeOverride')
                        continue;
                    const overrideClass = stamp.biomeId ?? 0;
                    if (overrideClass === 0)
                        continue;
                    const cells = stamp.cells;
                    const values = stamp.values;
                    let sorted = entry.stampSortedIndices[s];
                    if (!sorted) {
                        sorted = this.buildSortedByValueDesc(values);
                        entry.stampSortedIndices[s] = sorted;
                    }
                    const prefixLen = upperPrefixDesc(values, sorted, valueCutoff);
                    for (let k = 0; k < prefixLen; k++) {
                        const idx = sorted[k];
                        const ipix = cells[idx];
                        const baselineClass = sink.getBaselineClass(ipix);
                        if (baselineClass === overrideClass)
                            continue;
                        census.current[baselineClass] = (census.current[baselineClass] ?? 0) - 1;
                        census.current[overrideClass] = (census.current[overrideClass] ?? 0) + 1;
                    }
                }
            }
            for (const k of Object.keys(census.current)) {
                const cls = Number(k);
                const cur = census.current[cls] ?? 0;
                const base = census.baseline[cls] ?? 0;
                census.delta[cls] = cur - base;
            }
        }
    }
    /**
     * Build a permutation `sorted` such that `values[sorted[k]]` is
     * non-increasing in k. Used by the climate census's prefix scan so a
     * threshold check terminates as soon as values fall under the cutoff.
     */
    buildSortedByValueDesc(values) {
        const n = values.length;
        const sorted = new Uint32Array(n);
        for (let i = 0; i < n; i++)
            sorted[i] = i;
        // Standard sort accepts a comparator; Uint32Array.sort returns numeric
        // sort by default — wrap in Array.from + sort + write-back since
        // Uint32Array.sort doesn't take a comparator across all engines.
        const arr = Array.from(sorted);
        arr.sort((a, b) => values[b] - values[a]);
        for (let i = 0; i < n; i++)
            sorted[i] = arr[i];
        return sorted;
    }
    /**
     * Refresh the per-scenario destruction census (strikes / cities /
     * population / streetKm) at most once per `CENSUS_REFRESH_MS`. Quant
     * gate: skip when the saturated-cell count hasn't changed across the
     * last refresh — same trick the climate census uses.
     *
     * Bounding box is cached per scenario from the first refresh after the
     * walker completes (for Nuclear War this is once, immediately, since
     * its strikes paint synchronously). Cities outside the bbox are pruned
     * before the per-cell-set check; same for road vertices.
     */
    refreshDestructionCensusIfDue() {
        if (this.active.length === 0)
            return;
        const now = performance.now();
        if (now - this.lastDestructionRefreshMs < CENSUS_REFRESH_MS)
            return;
        this.lastDestructionRefreshMs = now;
        let citiesCache = null;
        let roadCache = null;
        for (let i = 0; i < this.active.length; i++) {
            const entry = this.active[i];
            if (!entry.destruction)
                continue;
            const handler = this.handlers.get(entry.scn.kind);
            if (!handler?.hasDestructionCensus)
                continue;
            // Fold all wasteland stamps for this scenario (and its child
            // scenarios, if it carries a schedule) into one kill-zone set.
            // Saturation threshold matches the cities/highways discard
            // threshold so a "destroyed" cell is one that's also visually wiped.
            const satSet = new Set();
            const foldEntryStamps = (e) => {
                const p = this.normalisedProgress(e);
                const elNorm = decayQuickThenSlow(p, this.tuning.decayExponent);
                const elSust = decaySustained(p);
                for (let s = 0; s < e.stamps.length; s++) {
                    const stamp = e.stamps[s];
                    if (stamp.attribute && stamp.attribute !== 'wasteland')
                        continue;
                    const inten = stamp.decayMode === 'sustained' ? elSust : elNorm;
                    if (inten <= 0)
                        continue;
                    const cells = stamp.cells;
                    const values = stamp.values;
                    for (let c = 0; c < cells.length; c++) {
                        if (values[c] * inten >= DESTRUCTION_KILL_THRESHOLD)
                            satSet.add(cells[c]);
                    }
                }
            };
            foldEntryStamps(entry);
            const childIds = handler.getChildScenarioIds?.(entry.scn) ?? [];
            for (let k = 0; k < childIds.length; k++) {
                const childEntry = this.active.find((c) => c.scn.id === childIds[k]);
                if (childEntry)
                    foldEntryStamps(childEntry);
            }
            // Strike counts come from the handler. Scenarios without a strike
            // notion fall back to the captured-stamp count.
            const progress = handler.getStrikeProgress?.(entry.scn);
            const scheduledStrikes = progress
                ? progress.scheduled
                : entry.stamps.length > 0 ? 1 : 0;
            const firedStrikes = progress ? progress.fired : scheduledStrikes;
            // Quant gate — skip the city + road walk when neither saturated-cell
            // count nor schedule progress has moved since the last refresh.
            const cellCountSig = satSet.size * 31 + firedStrikes;
            if (cellCountSig === entry.lastDestructionCellCount &&
                entry.destruction.strikes === firedStrikes) {
                continue;
            }
            entry.lastDestructionCellCount = cellCountSig;
            // Bbox prune from the handler's strike points. Padded so the full
            // ellipse extent stays inside.
            if (!entry.destructionBbox) {
                let latMin = 90, latMax = -90, lonMin = 180, lonMax = -180;
                const strikePoints = handler.getStrikePoints?.(entry.scn) ?? [];
                for (let k = 0; k < strikePoints.length; k++) {
                    const st = strikePoints[k];
                    if (st.latDeg < latMin)
                        latMin = st.latDeg;
                    if (st.latDeg > latMax)
                        latMax = st.latDeg;
                    if (st.lonDeg < lonMin)
                        lonMin = st.lonDeg;
                    if (st.lonDeg > lonMax)
                        lonMax = st.lonDeg;
                }
                if (latMin <= latMax && lonMin <= lonMax) {
                    const padDeg = 10;
                    const finalLatMin = Math.max(-90, latMin - padDeg);
                    const finalLatMax = Math.min(90, latMax + padDeg);
                    // Antimeridian wrap detection: a strike set spanning > 180° of
                    // longitude is almost certainly global (70+ strike global war);
                    // in that case skip prune.
                    const lonSpan = lonMax - lonMin;
                    const wrapLon = lonSpan > 180;
                    entry.destructionBbox = {
                        latDegMin: finalLatMin,
                        latDegMax: finalLatMax,
                        lonDegMin: wrapLon ? -180 : Math.max(-180, lonMin - padDeg),
                        lonDegMax: wrapLon ? 180 : Math.min(180, lonMax + padDeg),
                        wrapLon,
                    };
                }
            }
            if (!citiesCache) {
                citiesCache = this.context
                    .getMajorCities(50000)
                    .map((c) => ({ latDeg: c.latDeg, lonDeg: c.lonDeg, pop: c.pop }));
            }
            const bbox = entry.destructionBbox;
            let cities = 0;
            let population = 0;
            for (let k = 0; k < citiesCache.length; k++) {
                const c = citiesCache[k];
                if (bbox && !bbox.wrapLon) {
                    if (c.latDeg < bbox.latDegMin || c.latDeg > bbox.latDegMax)
                        continue;
                    if (c.lonDeg < bbox.lonDegMin || c.lonDeg > bbox.lonDegMax)
                        continue;
                }
                const ipix = latLonToPix(this.nside, this.ordering, c.latDeg, c.lonDeg);
                if (!satSet.has(ipix))
                    continue;
                cities++;
                population += c.pop;
            }
            // Major + arterial road segments only — local streets are millions
            // of vertices and a visual wash inside a kill zone. Per-vertex ipix
            // is cached once at first refresh (road set is static), so this
            // collapses to set-membership tests on global wars where the bbox
            // prune is bypassed by the antimeridian wrap. Per-road bbox prunes
            // whole segments before any vertex is touched.
            if (!roadCache)
                roadCache = this.buildRoadIpixCache();
            let streetKm = 0;
            for (let r = 0; r < roadCache.length; r++) {
                const road = roadCache[r];
                if (road.kind !== 'major' && road.kind !== 'arterial')
                    continue;
                const verts = road.vertices;
                if (verts.length < 2)
                    continue;
                // Whole-segment bbox prune. Skip the per-vertex check inside —
                // either the segment is in or it isn't.
                if (bbox && !bbox.wrapLon) {
                    if (road.bboxLatMax < bbox.latDegMin)
                        continue;
                    if (road.bboxLatMin > bbox.latDegMax)
                        continue;
                    if (road.bboxLonMax < bbox.lonDegMin)
                        continue;
                    if (road.bboxLonMin > bbox.lonDegMax)
                        continue;
                }
                const ipixArr = road.ipix;
                let prevIpix = -1;
                for (let v = 0; v < verts.length; v++) {
                    const ipix = ipixArr[v];
                    if (v > 0 && prevIpix >= 0 && satSet.has(ipix) && satSet.has(prevIpix)) {
                        const [pLat, pLon] = verts[v - 1];
                        const [latDeg, lonDeg] = verts[v];
                        streetKm += haversineKm(pLat, pLon, latDeg, lonDeg);
                    }
                    prevIpix = ipix;
                }
            }
            entry.destruction.strikes = firedStrikes;
            entry.destruction.strikesScheduled = scheduledStrikes;
            entry.destruction.cities = cities;
            entry.destruction.population = population;
            entry.destruction.streetKm = streetKm;
        }
    }
    /** Clamped [0,1] elapsed-fraction for an entry vs `lastTotalDays`. */
    normalisedProgress(entry) {
        const elapsed = this.lastTotalDays - entry.scn.startedAtDay;
        const raw = elapsed / Math.max(1e-6, entry.scn.durationDays);
        return raw < 0 ? 0 : raw > 1 ? 1 : raw;
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
        const result = computeEllipseStamp(args, this.nside, this.ordering);
        const stamp = {
            cells: result.cells,
            values: result.values,
            attribute: args.attribute,
        };
        if (args.attribute === 'biomeOverride' && args.biomeOverride) {
            stamp.biomeId = args.biomeOverride.biomeId;
        }
        if (args.decayMode)
            stamp.decayMode = args.decayMode;
        this.capturingStamps.push(stamp);
    }
    captureBandPaint(args, userCtx) {
        if (!this.capturingStamps) {
            userCtx.paintAttributeBand(args);
            return;
        }
        const result = computeBandStamp(args, this.nside, this.ordering);
        const stamp = {
            cells: result.cells,
            values: result.values,
            attribute: args.attribute,
        };
        if (args.attribute === 'biomeOverride' && args.biomeOverride) {
            stamp.biomeId = args.biomeOverride.biomeId;
        }
        if (args.decayMode)
            stamp.decayMode = args.decayMode;
        this.capturingStamps.push(stamp);
    }
    /**
     * Kick off an async lat/lon walk over every HEALPix cell for a climate
     * scenario's biome-transition LUT. The walker is stored on the active
     * entry and advanced over many frames by `advancePendingWalks`.
     *
     * Sampling strategy mirrors `computeBandStamp` — walk a lat/lon grid
     * at ≈half the HEALPix cell-edge spacing, dedupe by ipix, first rule
     * per cell wins. Per-cell `tStart01` flows into the stamp's G channel
     * so the shader can stagger onset by resilience.
     *
     * Working buffers come from a two-slot pool, indexed by the current
     * climate slot — two concurrent climate scenarios can walk in
     * parallel without stomping each other's buffers. Slot occupancy
     * persists across `acquireWalkerBuffers` calls, so per-scenario start
     * pays no allocation cost after the first walk.
     */
    captureBiomeTransitionPaint(rules, _userCtx) {
        if (!this.capturingStamps)
            return;
        if (!this.biomeOverrideSink)
            return;
        if (rules.length === 0)
            return;
        const slot = this.capturingClimateSlot;
        if (slot === null)
            return;
        const nside = this.nside;
        const npix = 12 * nside * nside;
        const DEG = Math.PI / 180;
        const cellEdgeRad = Math.sqrt((4 * Math.PI) / npix);
        const stepRad = cellEdgeRad * 0.5;
        const stepDeg = stepRad / DEG;
        const latSteps = Math.max(2, Math.ceil(180 / stepDeg) + 1);
        const rulesByFrom = new Map();
        for (let i = 0; i < rules.length; i++) {
            const r = rules[i];
            const list = rulesByFrom.get(r.from);
            if (list)
                list.push(r);
            else
                rulesByFrom.set(r.from, [r]);
        }
        const buffers = this.acquireWalkerBuffers(slot, npix);
        this.capturingPendingWalk = {
            rulesByFrom,
            targetByCell: buffers.targetByCell,
            weightByCell: buffers.weightByCell,
            tStartByCell: buffers.tStartByCell,
            mark: buffers.mark,
            latSteps,
            stepDeg,
            nextLatIdx: 0,
            assigned: 0,
            startedAtMs: performance.now(),
            complete: false,
        };
    }
    /**
     * Reset (or first-time allocate) the walker buffers for a slot.
     * Called once per climate scenario start for that slot; the per-frame
     * walker work touches these buffers but never reallocates.
     */
    acquireWalkerBuffers(slot, npix) {
        let target = this.walkerTargetByCell[slot];
        if (!target || target.length !== npix) {
            target = new Int16Array(npix);
            this.walkerTargetByCell[slot] = target;
            this.walkerWeightByCell[slot] = new Float32Array(npix);
            this.walkerTStartByCell[slot] = new Float32Array(npix);
            this.walkerMark[slot] = new Uint8Array(npix);
        }
        const weight = this.walkerWeightByCell[slot];
        const tStart = this.walkerTStartByCell[slot];
        const mark = this.walkerMark[slot];
        target.fill(-1);
        weight.fill(0);
        tStart.fill(0);
        mark.fill(0);
        return { targetByCell: target, weightByCell: weight, tStartByCell: tStart, mark };
    }
    advancePendingWalks() {
        if (!this.biomeOverrideSink)
            return false;
        let anyCompleted = false;
        for (let i = 0; i < this.active.length; i++) {
            const entry = this.active[i];
            if (!entry.pendingWalk)
                continue;
            if (this.advanceWalker(entry))
                anyCompleted = true;
        }
        return anyCompleted;
    }
    /** Returns true the frame the walker finishes. */
    advanceWalker(entry) {
        const walk = entry.pendingWalk;
        if (!walk || walk.complete)
            return false;
        const sink = this.biomeOverrideSink;
        const nside = this.nside;
        const ordering = this.ordering;
        const npix = 12 * nside * nside;
        const DEG = Math.PI / 180;
        const TWO_PI = 2 * Math.PI;
        const frameStart = performance.now();
        while (walk.nextLatIdx < walk.latSteps) {
            const i = walk.nextLatIdx;
            const tLat = i / (walk.latSteps - 1);
            const latDeg = -90 + tLat * 180;
            const lat = latDeg * DEG;
            const sinLat = Math.sin(lat);
            const cosLat = Math.cos(lat);
            const absLatDeg = Math.abs(latDeg);
            const lonStepDeg = walk.stepDeg / Math.max(0.05, cosLat);
            const lonSteps = Math.max(2, Math.ceil(360 / lonStepDeg) + 1);
            for (let j = 0; j < lonSteps; j++) {
                const tLon = j / (lonSteps - 1);
                const lonDeg = -180 + tLon * 360;
                const lon = lonDeg * DEG;
                const lonNorm = lon < 0 ? lon + TWO_PI : lon >= TWO_PI ? lon - TWO_PI : lon;
                const ipix = zPhiToPix(nside, ordering, sinLat, lonNorm);
                if (ipix < 0 || ipix >= npix)
                    continue;
                if (walk.mark[ipix] === 1)
                    continue;
                walk.mark[ipix] = 1;
                const biomeId = sink.getBaselineClass(ipix);
                const matchingRules = walk.rulesByFrom.get(biomeId);
                if (!matchingRules)
                    continue;
                let elevM = Number.NaN;
                for (let r = 0; r < matchingRules.length; r++) {
                    const rule = matchingRules[r];
                    if (rule.latGateAbsDegMin !== undefined && absLatDeg < rule.latGateAbsDegMin) {
                        continue;
                    }
                    if (rule.latGateAbsDegMax !== undefined && absLatDeg > rule.latGateAbsDegMax) {
                        continue;
                    }
                    if (rule.elevGateMinM !== undefined || rule.elevGateMaxM !== undefined) {
                        if (Number.isNaN(elevM))
                            elevM = sink.getElevationMetersAtCell(ipix);
                        if (rule.elevGateMinM !== undefined && elevM < rule.elevGateMinM)
                            continue;
                        if (rule.elevGateMaxM !== undefined && elevM > rule.elevGateMaxM)
                            continue;
                    }
                    walk.targetByCell[ipix] = rule.to & 0x7fff;
                    walk.weightByCell[ipix] = rule.weight;
                    walk.tStartByCell[ipix] = rule.tStart01;
                    walk.assigned++;
                    break;
                }
            }
            walk.nextLatIdx++;
            if (performance.now() - frameStart > WALK_BUDGET_MS)
                return false;
        }
        this.finalizeWalker(entry);
        return true;
    }
    /**
     * Finalize the async biome-transition walker. Two-pass: count cells per
     * target biome, allocate one typed-array trio per target up-front, then
     * fill them. Avoids the previous `Map<biomeId, number[]>.push` path
     * which was the dominant allocation burst on the walker-complete frame
     * (50–100 ms stall, blowing past the 5 ms WALK_BUDGET_MS that the
     * walker promised). The two passes together are O(npix) reads — the
     * same work the original buckets walk did, minus the `Map` plus
     * `number[]` allocator pressure.
     *
     * Biome class id is stored as `Int16` in `targetByCell`; biome ids in
     * the project are < 256 (TEOW palette), so we index per-target counts
     * by id via a 256-entry buffer rather than a `Map`.
     */
    finalizeWalker(entry) {
        const walk = entry.pendingWalk;
        if (!walk)
            return;
        const npix = 12 * this.nside * this.nside;
        // 256 covers every biome id that fits in the R8 class texture.
        const COUNT_LEN = 256;
        if (!this.walkerBucketCounts || this.walkerBucketCounts.length !== COUNT_LEN) {
            this.walkerBucketCounts = new Int32Array(COUNT_LEN);
            this.walkerBucketCursor = new Int32Array(COUNT_LEN);
        }
        const counts = this.walkerBucketCounts;
        const cursor = this.walkerBucketCursor;
        counts.fill(0);
        const targetByCell = walk.targetByCell;
        // Pass 1: count per target.
        for (let ipix = 0; ipix < npix; ipix++) {
            const t = targetByCell[ipix];
            if (t < 0)
                continue;
            counts[t]++;
        }
        const newStamps = [];
        for (let id = 0; id < COUNT_LEN; id++) {
            const n = counts[id];
            if (n <= 0)
                continue;
            newStamps.push({
                biomeId: id,
                cells: new Uint32Array(n),
                values: new Float32Array(n),
                tStart01s: new Float32Array(n),
            });
            cursor[id] = newStamps.length - 1;
        }
        // Pass 2: fill the pre-allocated arrays. `cursor[id]` indexes into
        // `newStamps`; per-target write head is the count-down view of
        // `counts[id]` — we decrement after each write so it ends at 0.
        const weightByCell = walk.weightByCell;
        const tStartByCell = walk.tStartByCell;
        // Re-use counts as the per-target write-down counter.
        for (let ipix = 0; ipix < npix; ipix++) {
            const t = targetByCell[ipix];
            if (t < 0)
                continue;
            const stamp = newStamps[cursor[t]];
            const writeIdx = stamp.cells.length - counts[t]; // counts[t] decremented below
            stamp.cells[writeIdx] = ipix;
            stamp.values[writeIdx] = weightByCell[ipix];
            stamp.tStart01s[writeIdx] = tStartByCell[ipix];
            counts[t]--;
        }
        // Replace any leftover biomeOverride stamps from a prior cycle.
        entry.stamps = entry.stamps.filter((s) => s.attribute !== 'biomeOverride');
        for (let i = 0; i < newStamps.length; i++) {
            const s = newStamps[i];
            entry.stamps.push({
                cells: s.cells,
                values: s.values,
                attribute: 'biomeOverride',
                biomeId: s.biomeId,
                tStart01s: s.tStart01s,
            });
        }
        // sortedIndices array must match the new stamp count; clear and re-init.
        entry.stampSortedIndices = new Array(entry.stamps.length).fill(null);
        walk.complete = true;
        entry.pendingWalk = null;
        entry.scn.walkerComplete = true;
        const dtMs = performance.now() - walk.startedAtMs;
        console.info(`[ScenarioRegistry] paintBiomeTransition: ${walk.assigned} cells across ${newStamps.length} target biomes in ${dtMs.toFixed(1)} ms (async)`);
    }
    /**
     * Build the per-road `latLonToPix` + bbox cache once and memoise it.
     * The road set is loaded at world boot and never changes afterwards,
     * so a one-shot precompute pays for itself within a single Nuclear War
     * destruction-census refresh — the per-vertex hash dominates the cost
     * on global wars where the antimeridian-spanning bbox prune is bypassed.
     *
     * Only major + arterial vertices are hashed (the same tier the census
     * walks); locals are stored unhashed since the census ignores them.
     */
    buildRoadIpixCache() {
        if (this.roadIpixCache)
            return this.roadIpixCache;
        const raw = this.context.getRoadSegments();
        const out = [];
        for (let r = 0; r < raw.length; r++) {
            const road = raw[r];
            const verts = road.vertices;
            const n = verts.length;
            const ipix = new Uint32Array(n);
            let latMin = 90;
            let latMax = -90;
            let lonMin = 180;
            let lonMax = -180;
            const isCensusTier = road.kind === 'major' || road.kind === 'arterial';
            for (let v = 0; v < n; v++) {
                const [latDeg, lonDeg] = verts[v];
                if (latDeg < latMin)
                    latMin = latDeg;
                if (latDeg > latMax)
                    latMax = latDeg;
                if (lonDeg < lonMin)
                    lonMin = lonDeg;
                if (lonDeg > lonMax)
                    lonMax = lonDeg;
                if (isCensusTier) {
                    ipix[v] = latLonToPix(this.nside, this.ordering, latDeg, lonDeg);
                }
            }
            out.push({
                kind: road.kind,
                vertices: verts,
                ipix,
                bboxLatMin: latMin,
                bboxLatMax: latMax,
                bboxLonMin: lonMin,
                bboxLonMax: lonMax,
            });
        }
        this.roadIpixCache = out;
        return out;
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

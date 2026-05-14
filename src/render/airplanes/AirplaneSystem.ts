/**
 * AirplaneSystem — owns the airplane visualisation: airports, route scaffold,
 * trails (one per active plane), and plane head dots.
 *
 * Runtime model
 * -------------
 * `simHoursPerRealSecond` is the speed multiplier (Tweakpane-controlled,
 * default 1.0 → 1 sim hour per real second).
 *
 * Planes are pooled to a fixed capacity. Each frame:
 *   1. Advance every active plane:
 *      - while in flight (`planeT < 1`): grow head; tail anchored at origin.
 *      - after landing (`planeT == 1`): retract tail at the same per-route
 *        speed the plane originally flew. The trail visibly dissipates from
 *        the origin end, like clearing smoke.
 *      - recycle once the tail has caught up (`planeTTail >= 1`).
 *   2. For each route, accumulate a spawn counter `rate * dt_sim_sec * dnFactor`
 *      where `rate ∝ route_weight` and `dnFactor` is a soft day/night
 *      multiplier driven by the route's midpoint longitude vs. the sun
 *      longitude. When the counter crosses 1 we spawn a plane (if pool space).
 *   3. Pack the active planes into the GPU instance buffers for trails + heads.
 *      Active in-flight planes (planeT<1) come first so the heads layer can
 *      draw only that prefix while the trails layer draws the full set.
 *
 * Relative spawn rates therefore stay faithful to route weights at any speed
 * — busier routes always get proportionally more planes than quiet ones.
 *
 * The pool capacity is sized for the two-phase lifecycle (≈ 2 × flight time
 * per slot: one flight time growing, one retracting).
 */

import * as THREE from 'three';

import { DEFAULTS } from '../../debug/defaults.js';
import type { AirplaneData } from './data.js';
import { AirportsLayer } from './AirportsLayer.js';
import { RouteScaffoldLayer } from './RouteScaffoldLayer.js';
import { TrailsLayer } from './TrailsLayer.js';
import { PlaneHeadsLayer } from './PlaneHeadsLayer.js';

const CRUISE_KM_PER_HR = 850;

/**
 * Trail length as a fraction of the route's t-parameter. The trail follows
 * the plane like a comet tail rather than spanning the entire flight path,
 * which also means dissipation only takes TRAIL_LEN_T × flight duration.
 */
const TRAIL_LEN_T = 0.3;

/**
 * Pool capacity — accommodates ≈ 2 × the in-flight count because each slot
 * lives through a full grow-then-retract cycle (flight time + dissipation).
 */
const PLANE_CAPACITY = 8192;
/** Soft mean flight time used to map target-in-flight → spawns/hour. */
const APPROX_MEAN_FLIGHT_HRS = 4.0;

export class AirplaneSystem {
  readonly group: THREE.Group;

  readonly airports: AirportsLayer;
  readonly scaffold: RouteScaffoldLayer;
  readonly trails: TrailsLayer;
  readonly heads: PlaneHeadsLayer;

  private readonly data: AirplaneData;
  private readonly capacity = PLANE_CAPACITY;

  // Compact active-plane state. Slots [0..activeCount) are live.
  private readonly planeRouteIdx: Uint32Array;
  /** Head end of the trail in [0,1]. Reaches 1.0 when the plane lands. */
  private readonly planeT: Float32Array;
  /** Origin end of the trail in [0,1]. Stays at 0 in flight, then advances. */
  private readonly planeTTail: Float32Array;
  private readonly planeSpeed: Float32Array;
  private readonly planeAlpha: Float32Array;
  private activeCount = 0;

  // Per-route spawn counter — when ≥ 1 we spawn one and decrement.
  private readonly routeSpawnAccum: Float32Array;
  /** Per-route base spawn rate (planes per sim hour). */
  private readonly routeBaseRate: Float32Array;

  private simHoursPerRealSecond = 1.0;
  private targetInFlight: number = DEFAULTS.airplanes.targetInFlight;
  private elapsedRealSeconds = 0;
  private sunLonRad = 0;

  constructor(data: AirplaneData) {
    this.data = data;
    this.group = new THREE.Group();
    this.group.name = 'airplanes';

    this.airports = new AirportsLayer(data);
    this.scaffold = new RouteScaffoldLayer(data);
    this.trails = new TrailsLayer(this.capacity);
    this.heads = new PlaneHeadsLayer(this.capacity);

    this.group.add(this.airports.mesh);
    this.group.add(this.scaffold.mesh);
    this.group.add(this.trails.mesh);
    this.group.add(this.heads.mesh);

    this.planeRouteIdx = new Uint32Array(this.capacity);
    this.planeT = new Float32Array(this.capacity);
    this.planeTTail = new Float32Array(this.capacity);
    this.planeSpeed = new Float32Array(this.capacity);
    this.planeAlpha = new Float32Array(this.capacity);

    const N = data.routeWeight.length;
    this.routeSpawnAccum = new Float32Array(N);
    // Random-phase the per-route spawn accumulators so the global spawn rate
    // hits its steady value immediately. Otherwise low-weight routes (most of
    // them) need many minutes of frame-time to first cross 1.0, and the
    // prefilled in-flight cohort drains away faster than it gets replaced.
    for (let i = 0; i < N; i++) this.routeSpawnAccum[i] = Math.random();
    this.routeBaseRate = new Float32Array(N);
    this.computeRouteRates();
    this.prefillToSteadyState();
  }

  setSpeed(simHoursPerRealSecond: number): void {
    this.simHoursPerRealSecond = Math.max(0, simHoursPerRealSecond);
  }

  setTargetInFlight(n: number): void {
    // Target counts in-flight planes. The pool needs room for the same
    // number again of dissipating-trail slots.
    const cap = Math.floor(this.capacity / 2);
    this.targetInFlight = Math.max(0, Math.min(cap, n));
    this.computeRouteRates();
  }

  setSunLonRad(lonRad: number): void {
    this.sunLonRad = lonRad;
  }

  setLayerActive(layer: 'airports' | 'scaffold' | 'trails' | 'heads', on: boolean): void {
    if (layer === 'airports') this.airports.setActive(on);
    else if (layer === 'scaffold') this.scaffold.setActive(on);
    else if (layer === 'trails') this.trails.setActive(on);
    else if (layer === 'heads') this.heads.setActive(on);
  }

  setViewport(w: number, h: number): void {
    this.heads.setViewport(w, h);
  }

  /** dtRealSec is the wall-clock delta. */
  update(dtRealSec: number): void {
    this.elapsedRealSeconds += dtRealSec;
    this.heads.setTime(this.elapsedRealSeconds);

    const dtSimHrs = dtRealSec * this.simHoursPerRealSecond;
    const dtSimSec = dtSimHrs * 3600.0;

    if (dtSimSec <= 0) {
      // Speed = 0 means "freeze the sim" but keep blink + render alive.
      this.repackInstances();
      return;
    }

    this.advancePlanes(dtSimSec);
    this.spawnPlanes(dtSimHrs);
    this.repackInstances();
  }

  dispose(): void {
    this.airports.dispose();
    this.scaffold.dispose();
    this.trails.dispose();
    this.heads.dispose();
  }

  // ---------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------

  /**
   * Drop planes onto routes at random progress so the world starts already
   * at the steady-state in-flight population, instead of taking ~30 real
   * seconds to ramp up from zero.
   *
   * Per-route expected in-flight count = spawnRate × routeLifetime.
   * Normalised so the total exactly hits `targetInFlight`. We only prefill
   * in-flight planes (planeT<1, planeTTail=0) — the dissipating-trail
   * population builds up naturally over the first few flight times.
   */
  private prefillToSteadyState(): void {
    if (this.targetInFlight <= 0) return;
    const N = this.data.routeWeight.length;
    let totalContribution = 0;
    const lifetimeHrs = new Float32Array(N);
    for (let r = 0; r < N; r++) {
      const distKm = Math.max(50, this.data.routeDistanceKm[r]!);
      lifetimeHrs[r] = distKm / CRUISE_KM_PER_HR;
      totalContribution += this.routeBaseRate[r]! * lifetimeHrs[r]!;
    }
    if (totalContribution <= 0) return;
    const norm = this.targetInFlight / totalContribution;

    for (let r = 0; r < N; r++) {
      const expected = this.routeBaseRate[r]! * lifetimeHrs[r]! * norm;
      const whole = Math.floor(expected);
      const frac = expected - whole;
      const count = whole + (Math.random() < frac ? 1 : 0);
      const distKm = Math.max(50, this.data.routeDistanceKm[r]!);
      const speed = (CRUISE_KM_PER_HR / distKm) / 3600.0;
      const alpha = 0.6 + 0.4 * this.data.routeWeight[r]!;
      for (let i = 0; i < count && this.activeCount < this.capacity; i++) {
        const slot = this.activeCount++;
        this.planeRouteIdx[slot] = r;
        // Random progress in (0,1) so the head is still in flight at boot.
        const t = Math.random() * 0.999;
        this.planeT[slot] = t;
        this.planeTTail[slot] = Math.max(0, t - TRAIL_LEN_T);
        this.planeSpeed[slot] = speed;
        this.planeAlpha[slot] = alpha;
      }
    }
  }

  private computeRouteRates(): void {
    // Total spawns per sim hour = target_in_flight / mean_flight_hours.
    const N = this.data.routeWeight.length;
    let sumW = 0;
    for (let i = 0; i < N; i++) sumW += this.data.routeWeight[i]!;
    if (sumW <= 0) return;
    const totalRate = this.targetInFlight / APPROX_MEAN_FLIGHT_HRS;
    for (let i = 0; i < N; i++) {
      this.routeBaseRate[i] = (this.data.routeWeight[i]! / sumW) * totalRate;
    }
  }

  private advancePlanes(dtSimSec: number): void {
    let i = 0;
    while (i < this.activeCount) {
      const speed = this.planeSpeed[i]!;
      let head = this.planeT[i]!;
      let tail = this.planeTTail[i]!;

      if (head < 1.0) {
        // Phase 1: flight in progress — head grows; tail follows at a fixed
        // offset so the trail is a comet tail behind the plane, not a line
        // back to the origin.
        head += speed * dtSimSec;
        if (head >= 1.0) head = 1.0;
        this.planeT[i] = head;
        this.planeTTail[i] = Math.max(0, head - TRAIL_LEN_T);
        i++;
      } else {
        // Phase 2: plane has landed — tail retracts at the same speed the
        // head originally moved.
        tail += speed * dtSimSec;
        if (tail >= 1.0) {
          // Slot done. Swap-remove.
          const last = this.activeCount - 1;
          if (i !== last) {
            this.planeRouteIdx[i] = this.planeRouteIdx[last]!;
            this.planeT[i] = this.planeT[last]!;
            this.planeTTail[i] = this.planeTTail[last]!;
            this.planeSpeed[i] = this.planeSpeed[last]!;
            this.planeAlpha[i] = this.planeAlpha[last]!;
          }
          this.activeCount = last;
          // Don't advance `i`: re-process the swapped-in plane.
        } else {
          this.planeTTail[i] = tail;
          i++;
        }
      }
    }
  }

  private spawnPlanes(dtSimHrs: number): void {
    const N = this.data.routeWeight.length;
    const sunLon = this.sunLonRad;
    for (let r = 0; r < N; r++) {
      // Day/night multiplier: rough cosine of the angle between the route's
      // midpoint and the sun. ×0.5 amplitude → factor ∈ [0.5, 1.5]; total
      // global throughput averages out so the speed slider stays calibrated.
      const dLon = this.data.routeMidpointLon[r]! - sunLon;
      const dnDot = Math.cos(dLon) * Math.cos(this.data.routeMidpointLat[r]!);
      const dnFactor = 1.0 + 0.5 * dnDot;

      const spawnIncrement = this.routeBaseRate[r]! * dtSimHrs * dnFactor;
      let acc = this.routeSpawnAccum[r]! + spawnIncrement;
      while (acc >= 1.0 && this.activeCount < this.capacity) {
        const slot = this.activeCount++;
        this.planeRouteIdx[slot] = r;
        this.planeT[slot] = 0.0;
        this.planeTTail[slot] = 0.0;
        // Speed in t-units per simulated second.
        const distKm = Math.max(50, this.data.routeDistanceKm[r]!);
        this.planeSpeed[slot] = (CRUISE_KM_PER_HR / distKm) / 3600.0;
        // Brighter trails for trunk routes — purely cosmetic, the trail
        // accumulation already conveys traffic density.
        this.planeAlpha[slot] = 0.6 + 0.4 * this.data.routeWeight[r]!;
        acc -= 1.0;
      }
      this.routeSpawnAccum[r] = acc;
    }
  }

  private repackInstances(): void {
    const trailSrcDst = this.trails.aSrcDstAttr.array as Float32Array;
    const trailTMin = this.trails.aTMinAttr.array as Float32Array;
    const trailTMax = this.trails.aTMaxAttr.array as Float32Array;
    const trailAlpha = this.trails.aAlphaAttr.array as Float32Array;
    const headSrcDst = this.heads.aSrcDstAttr.array as Float32Array;
    const headT = this.heads.aTAttr.array as Float32Array;

    const latLons = this.data.airportLatLons;
    const src = this.data.routeSrc;
    const dst = this.data.routeDst;

    // Trails draw every active slot. Heads draw only the prefix where
    // planeT<1 (still in flight). We pack heads slot-by-slot by walking
    // the active list in order — order doesn't matter for either layer.
    let headCount = 0;
    for (let i = 0; i < this.activeCount; i++) {
      const r = this.planeRouteIdx[i]!;
      const a = src[r]!;
      const b = dst[r]!;
      const latA = latLons[a * 2]!;
      const lonA = latLons[a * 2 + 1]!;
      const latB = latLons[b * 2]!;
      const lonB = latLons[b * 2 + 1]!;
      const off = i * 4;
      trailSrcDst[off + 0] = latA;
      trailSrcDst[off + 1] = lonA;
      trailSrcDst[off + 2] = latB;
      trailSrcDst[off + 3] = lonB;
      trailTMin[i] = this.planeTTail[i]!;
      trailTMax[i] = this.planeT[i]!;
      trailAlpha[i] = this.planeAlpha[i]!;

      if (this.planeT[i]! < 1.0) {
        const hoff = headCount * 4;
        headSrcDst[hoff + 0] = latA;
        headSrcDst[hoff + 1] = lonA;
        headSrcDst[hoff + 2] = latB;
        headSrcDst[hoff + 3] = lonB;
        headT[headCount] = this.planeT[i]!;
        headCount++;
      }
    }
    this.trails.setActiveCount(this.activeCount);
    this.heads.setActiveCount(headCount);
  }
}

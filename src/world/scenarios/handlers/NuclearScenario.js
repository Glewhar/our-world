/**
 * NuclearScenario — first concrete scenario kind.
 *
 * Behaviour:
 *   onStart:
 *     1. Sample elevation + wind once via ctx.sampleTerrainAt. Both feed
 *        the visual blast (radius lifts off the displaced surface, wind
 *        drives the smoke drift). The render layer no longer reaches into
 *        world state on the scenario's behalf — the scenario hands over
 *        the sampled terrain.
 *     2. Fire the particle blast at (lat, lon) with that terrain.
 *     3. Convert wind (u, v) → bearing in degrees from north and freeze
 *        it onto the payload (used by the wasteland paint + UI).
 *     4. Paint a downwind-elongated wasteland ellipse. The registry
 *        captures the resulting cells/values as the scenario's peak stamp.
 *   onTick:
 *     no-op — the registry's frame composer handles intensity scaling
 *     against the stamp + the shared decay curve.
 *   onEnd:
 *     no-op — the registry removes the stamp from its accumulator on the
 *     last frame so the wasteland texture redraws naturally.
 *
 * Tuning lives in [NuclearScenario.config.ts] — visuals, wind dynamics,
 * wasteland geometry defaults, decay exponent, and particle templates
 * all co-locate there so changing "what the nuclear scenario looks like"
 * never requires editing the render layer or the handler logic.
 */
import { DEFAULT_NUCLEAR_CONFIG } from './NuclearScenario.config.js';
export const NuclearScenario = {
    hasDestructionCensus: true,
    onStart(scn, ctx) {
        const { latDeg, lonDeg, radiusKm, stretchKm, decayMode } = scn.payload;
        // 1) Single terrain sample — feeds blast altitude + smoke drift below.
        const terrain = ctx.sampleTerrainAt(latDeg, lonDeg);
        // 2) Visual blast at the surface, with elevation lift + wind drift.
        //    The render layer scales the fireball by `radiusKm` relative to
        //    its calibrated reference radius — see BlastSystem.detonateAt.
        ctx.detonateAt(latDeg, lonDeg, terrain, radiusKm);
        // 3) Freeze the wind bearing onto the payload.
        // Bearing convention: 0 = blowing toward north, 90 = east. `u` is
        // eastward, `v` is northward, so atan2(u, v) gives the angle clockwise
        // from north — exactly the convention the ellipse paint and UI use.
        const wind = terrain.wind;
        let bearingDeg = 0;
        if (wind && (wind.u !== 0 || wind.v !== 0)) {
            const rad = Math.atan2(wind.u, wind.v);
            bearingDeg = (rad * 180) / Math.PI;
            if (bearingDeg < 0)
                bearingDeg += 360;
        }
        scn.payload.windBearingDeg = bearingDeg;
        // 4) Paint the wasteland ellipse. The registry captures this as the
        //    scenario's peak stamp via the paint hook on ctx. Scaled by the
        //    config's killRadiusMultiplier so the urban-destruction footprint
        //    (cities + highways sample this same texture) can be tuned wider
        //    than the slider value without touching the fireball visual.
        const killScale = DEFAULT_NUCLEAR_CONFIG.wasteland.killRadiusMultiplier;
        ctx.paintAttributeEllipse({
            attribute: 'wasteland',
            value: 1.0,
            centreLatDeg: latDeg,
            centreLonDeg: lonDeg,
            radiusKm: radiusKm * killScale,
            stretchKm: stretchKm * killScale,
            bearingDeg,
            falloff: 'smoothstep',
            ...(decayMode ? { decayMode } : {}),
        });
    },
    onTick(_scn, _progress01, _ctx) {
        // No per-frame work — decay is owned by the registry's composer.
    },
    onEnd(_scn, _ctx) {
        // No teardown — stamp removal is handled by the registry.
    },
    getStrikePoints(scn) {
        return [{ latDeg: scn.payload.latDeg, lonDeg: scn.payload.lonDeg }];
    },
    getStrikeProgress(_scn) {
        return { fired: 1, scheduled: 1 };
    },
};

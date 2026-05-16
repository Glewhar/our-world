/**
 * NuclearWarScenario — orchestrates a multi-strike Nuclear war with a
 * trailing nuclear winter. Reuses existing mechanics:
 *
 *   - `ctx.spawnChildScenario('nuclear', ...)` fires a per-strike Nuclear
 *     child at each scheduled `fireAtRelDay`. The child paints the same
 *     downwind wasteland stamp the single-Nuclear scenario uses today.
 *     Each child lifetime = 50% of the parent war lifetime. Children run
 *     past the parent's end on their own clock — no force-stop, no
 *     immersion-breaking cut.
 *   - Polygon biome projection is driven by the registry's bake — the
 *     handler exposes its peak ΔT / Δsea / Δprecip via
 *     `peakClimateContribution`; the bake folds that into the combined
 *     frame and projects polygons. If GW or IA is already running the
 *     combined frame cancels the winter signal proportionally.
 *   - `getClimateContribution` + `getCloudContribution` ride a shared
 *     `nuclearWinterEnvelope` so cooling, sea-level fall, soot tint, and
 *     biome crossfade all line up on the same curve.
 *   - `getClimateEnvelope` overrides the registry's default so biome
 *     crossfade stays at 0 during the strike phase (envelope rises only
 *     after the last fireball lands).
 *   - `ctx.setWorldEffect('airplaneSpawn', 0)` after day 1 stops planes
 *     respawning; `onEnd` restores it to 1.
 *
 * Impact budget: parent owns the whole war's tally — sum of every
 * scheduled strike's city kills + non-city pop (BLT density) +
 * residency-weighted radiation, plus the polygon-projection biome
 * impact from the combined climate frame. Child Nuclear scenarios are
 * silent and report `zeroBudget()`, so no double counting.
 */
import { tallyProjectionBiome, tallyStrikeBiomeBlt, tallyStrikeCities, zeroBudget, } from '../impactBudget.js';
import { seaLevelFromTempDelta } from '../seaLevelFromTemp.js';
import { DEFAULT_NUCLEAR_CONFIG, } from './NuclearScenario.config.js';
import { DEFAULT_NUCLEAR_WAR_CONFIG, buildStrikeSchedule, nuclearWinterEnvelope, } from './NuclearWarScenario.config.js';
const SOOT_SUN_TINT = { r: 0.42, g: 0.31, b: 0.22 };
const SOOT_AMBIENT_TINT = { r: 0.30, g: 0.27, b: 0.26 };
/**
 * Game-pace damage scales for the raw population / city tallies out of
 * `tallyStrikeCities` + `tallyStrikeBiomeBlt`. Two separate knobs:
 *
 *   - `WAR_CITIES_SCALE` (flat 0.15) — keeps HUD "cities lost" pacing
 *     in lockstep with the on-screen visual destruction. Without the
 *     down-scale a 50-strike war reports ~3× as many city-losses as
 *     ellipses have actually swept the surface.
 *   - `warPopulationScale(strikes)` — slider-driven kill curve. Decays
 *     linearly across [1..50] (first nukes more lethal per-strike than
 *     later ones — early kills are clustered on the densest cities)
 *     then snaps to 1.0 above 50 so the slider's upper third is the
 *     "annihilation" range the brief asks for. The 50→51 step IS the
 *     dramatic threshold — every nuke ≥51 kills 100%.
 *
 * See SCENARIO_TUNING_NOTES.md for the full sample table and how to
 * re-tune the constants if telemetry drifts.
 */
const WAR_CITIES_SCALE = 0.15;
function warPopulationScale(strikes) {
    if (strikes > 50)
        return 1.0;
    return 0.45 - 0.0014 * (strikes - 1);
}
export const NuclearWarScenario = {
    isClimateClass: true,
    onStart(scn, ctx) {
        const cfg = DEFAULT_NUCLEAR_WAR_CONFIG;
        if (scn.payload.schedule.length === 0) {
            const wanted = scn.payload.strikeCount ?? cfg.strikeCount;
            const cities = ctx.getMajorCities(wanted);
            const childDur = scn.durationDays * 0.5;
            scn.payload.schedule = buildStrikeSchedule(cfg, cities.map((c) => ({ latDeg: c.latDeg, lonDeg: c.lonDeg, pop: c.pop })), wanted, scn.payload.strikeWindowDays > 0
                ? scn.payload.strikeWindowDays
                : cfg.strikeFireWindowDays, childDur, ((scn.startedAtDay * 1000) | 0) ^ 0xc0ffee);
        }
    },
    onTick(scn, progress01, ctx) {
        const elapsedRel = progress01 * scn.durationDays;
        const childMode = scn.payload.rebuildAfterWar ? 'quickThenSlow' : 'sustained';
        // One strike per tick: a front-loaded fire window at high sim speed
        // can mature 8–12 strikes in a single frame, each spending a stamp
        // dispatch + RAF cost. The schedule walk re-runs every tick so unfired
        // strikes pick up on subsequent frames; total war extends by at most
        // ~strikeCount × frame_period, invisible against the war envelope.
        const schedule = scn.payload.schedule;
        for (let i = 0; i < schedule.length; i++) {
            const s = schedule[i];
            if (s.spawnedScenarioId)
                continue;
            if (elapsedRel < s.fireAtRelDay)
                continue;
            s.spawnedScenarioId = ctx.spawnChildScenario('nuclear', {
                latDeg: s.latDeg,
                lonDeg: s.lonDeg,
                radiusKm: s.radiusKm,
                stretchKm: s.stretchKm,
                windBearingDeg: 0,
                decayMode: childMode,
            }, s.childDurationDays, { label: `Strike ${i + 1}`, silent: true });
            break;
        }
        if (elapsedRel >= scn.payload.airplaneStopAtDay) {
            ctx.setWorldEffect('airplaneSpawn', 0);
        }
    },
    onEnd(_scn, ctx) {
        // Children are NOT force-stopped — they keep running on their own
        // clock so kill zones fade naturally past the war's end.
        ctx.setWorldEffect('airplaneSpawn', 1);
    },
    getClimateContribution(scn, progress01, ctx) {
        const env = nuclearWinterEnvelope(progress01, scn.payload);
        const liveTempC = scn.payload.maxTempDeltaC * env;
        const precipPeak = scn.payload.precipDeltaMm ?? DEFAULT_NUCLEAR_WAR_CONFIG.precipDeltaMm;
        const peakSeaLevelM = seaLevelFromTempDelta(scn.payload.maxTempDeltaC, ctx.getSeaLevelMultiplier());
        return {
            tempC: liveTempC,
            seaLevelM: peakSeaLevelM * env,
            precipMm: precipPeak * env,
        };
    },
    peakClimateContribution(scn, ctx) {
        const peakTempC = scn.payload.maxTempDeltaC;
        return {
            tempC: peakTempC,
            seaLevelM: seaLevelFromTempDelta(peakTempC, ctx.getSeaLevelMultiplier()),
            precipMm: scn.payload.precipDeltaMm ?? DEFAULT_NUCLEAR_WAR_CONFIG.precipDeltaMm,
        };
    },
    getCloudContribution(scn, progress01) {
        const env = nuclearWinterEnvelope(progress01, scn.payload);
        return {
            sootGlobal: scn.payload.peakSootGlobal * env,
            sootRegionalWeight: env,
            sootSunTint: SOOT_SUN_TINT,
            sootAmbientTint: SOOT_AMBIENT_TINT,
        };
    },
    getClimateEnvelope(scn, progress01) {
        return nuclearWinterEnvelope(progress01, scn.payload);
    },
    intensity(scn, progress01) {
        // Damage envelope tracks the actual strike schedule: cities only die
        // when their bomb has visibly landed. `strikeEndFrac` (3% of duration)
        // was too aggressive — the HUD pinned to "fully destroyed" within
        // ~11 game hours while bombs were still falling for another 2.5 days.
        // Now `intensity` ramps in lockstep with `strikesFired / scheduled`,
        // plateaus through the winter, then decays via `nuclearWinterEnvelope`.
        const cfg = scn.payload;
        const schedule = scn.payload.schedule;
        if (progress01 >= cfg.winterPlateauEndFrac) {
            return nuclearWinterEnvelope(progress01, cfg);
        }
        let fired = 0;
        for (let i = 0; i < schedule.length; i++) {
            if (schedule[i].spawnedScenarioId)
                fired++;
        }
        const strikeRamp = schedule.length === 0 ? 0 : fired / schedule.length;
        if (strikeRamp >= 1)
            return 1;
        return strikeRamp;
    },
    getBombsActive(scn) {
        const schedule = scn.payload.schedule;
        let fired = 0;
        for (let i = 0; i < schedule.length; i++) {
            if (schedule[i].spawnedScenarioId)
                fired++;
        }
        return fired;
    },
    computeImpactBudget(scn, deps) {
        const budget = zeroBudget();
        const killScale = DEFAULT_NUCLEAR_CONFIG.wasteland.killRadiusMultiplier;
        // City + non-city pop + radiation tally per strike. Wind bearing is
        // unknown until each child fires — use 0° here; the bearing only
        // skews the ellipse downwind, so the kill set is roughly correct
        // either way for HUD purposes. `tallyStrikeBiomeBlt` reads each
        // polygon's BLT entry for non-city density + residency, so open
        // desert / tundra strikes retain more fallout than rainforest strikes.
        //
        // Dedupe masks are load-bearing: 50+ city-buster ellipses overlap
        // heavily (Tokyo + Yokohama + Osaka, the BosWash corridor, the
        // Pearl River delta), and without them every overlapping city /
        // polygon is counted once per strike. Tallied populationAtRisk
        // ballooned to ~5× world population, so as soon as the war's
        // intensity envelope crossed ~20% the civilization bar pinned to 0
        // ("DESTROYED" within seconds of launch).
        const schedule = scn.payload.schedule;
        const cityHitMask = new Uint8Array(deps.cities.length);
        const polyHitMask = new Uint8Array(deps.polygonLookup.count + 1);
        for (let i = 0; i < schedule.length; i++) {
            const s = schedule[i];
            const ellipse = {
                centreLatDeg: s.latDeg,
                centreLonDeg: s.lonDeg,
                radiusKm: s.radiusKm * killScale,
                stretchKm: s.stretchKm * killScale,
                bearingDeg: 0,
            };
            tallyStrikeCities(ellipse, deps.cities, budget, cityHitMask);
            tallyStrikeBiomeBlt(ellipse, deps, budget, polyHitMask);
        }
        // Winter biome shift — projection-driven against the combined frame
        // so a concurrent climate scenario cancels appropriately.
        const combined = deps.combinedClimate;
        tallyProjectionBiome({ tempC: combined.tempC, precipMm: combined.precipMm }, deps, budget);
        // Game-pace tuning: scale civilization-side tallies down so the
        // population / cities / streets bars decline visibly without
        // bottoming out the moment a war is in mid-fire. Radiation is
        // left at its raw tally — `RADIATION_HALF_FULL` already shapes
        // that bar separately.
        const strikes = scn.payload.strikeCount ?? DEFAULT_NUCLEAR_WAR_CONFIG.strikeCount;
        budget.populationAtRisk *= warPopulationScale(strikes);
        budget.citiesAtRisk *= WAR_CITIES_SCALE;
        return budget;
    },
};

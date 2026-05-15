/**
 * NuclearWarScenario — orchestrates a multi-strike Nuclear war with a
 * trailing nuclear winter. Reuses existing mechanics:
 *
 *   - `ctx.spawnChildScenario('nuclear', ...)` fires a per-strike Nuclear
 *     child at each scheduled `fireAtRelDay`. The child paints the same
 *     downwind wasteland stamp the single-Nuclear scenario uses today.
 *     Its decay mode flips to `'sustained'` when `rebuildAfterWar` is off
 *     so cities + streets stay dead through the winter plateau.
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
export const NuclearWarScenario = {
    isClimateClass: true,
    onStart(scn, ctx) {
        const cfg = DEFAULT_NUCLEAR_WAR_CONFIG;
        if (scn.payload.schedule.length === 0) {
            const wanted = scn.payload.strikeCount ?? cfg.strikeCount;
            const cities = ctx.getMajorCities(wanted);
            // Sustained children must outlast the parent so kill zones hold
            // through the winter plateau; in rebuild mode, the shorter
            // child duration from config lets urban features return after the
            // fireball fades.
            const childDur = scn.payload.rebuildAfterWar
                ? cfg.childDurationDays
                : scn.durationDays;
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
        const schedule = _scn.payload.schedule;
        for (let i = 0; i < schedule.length; i++) {
            const id = schedule[i].spawnedScenarioId;
            if (id)
                ctx.stopChildScenario(id);
        }
        ctx.setWorldEffect('airplaneSpawn', 1);
    },
    getClimateContribution(scn, progress01, ctx) {
        const env = nuclearWinterEnvelope(progress01, scn.payload);
        const liveTempC = scn.payload.maxTempDeltaC * env;
        const precipPeak = scn.payload.precipDeltaMm ?? DEFAULT_NUCLEAR_WAR_CONFIG.precipDeltaMm;
        return {
            tempC: liveTempC,
            seaLevelM: seaLevelFromTempDelta(liveTempC, ctx.getSeaLevelMultiplier()),
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
        // Damage envelope: ramps to peak during the strike phase (cities die
        // immediately under the fireballs), holds while the winter scar is
        // active, then decays as `nuclearWinterEnvelope` falls. Biome shown
        // on the HUD slightly leads the GPU biome paint during strikes — by
        // strikeEndFrac (≈3% of war duration) they're aligned again.
        const cfg = scn.payload;
        const env = nuclearWinterEnvelope(progress01, cfg);
        if (progress01 <= cfg.strikeEndFrac) {
            const ramp = cfg.strikeEndFrac <= 0 ? 1 : progress01 / cfg.strikeEndFrac;
            return ramp > env ? ramp : env;
        }
        if (progress01 < cfg.winterPlateauEndFrac)
            return 1;
        return env;
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
        const schedule = scn.payload.schedule;
        for (let i = 0; i < schedule.length; i++) {
            const s = schedule[i];
            const ellipse = {
                centreLatDeg: s.latDeg,
                centreLonDeg: s.lonDeg,
                radiusKm: s.radiusKm * killScale,
                stretchKm: s.stretchKm * killScale,
                bearingDeg: 0,
            };
            tallyStrikeCities(ellipse, deps.cities, budget);
            tallyStrikeBiomeBlt(ellipse, deps, budget);
        }
        // Winter biome shift — projection-driven against the combined frame
        // so a concurrent climate scenario cancels appropriately.
        const combined = deps.combinedClimate;
        tallyProjectionBiome({ tempC: combined.tempC, precipMm: combined.precipMm }, deps, budget);
        return budget;
    },
};

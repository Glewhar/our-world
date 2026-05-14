/**
 * NuclearWarScenario — orchestrates a multi-strike Nuclear war with a
 * trailing nuclear winter. Reuses existing mechanics:
 *
 *   - `ctx.spawnChildScenario('nuclear', ...)` fires a per-strike Nuclear
 *     child at each scheduled `fireAtRelDay`. The child paints the same
 *     downwind wasteland stamp the single-Nuclear scenario uses today.
 *     Its decay mode flips to `'sustained'` when `rebuildAfterWar` is off
 *     so cities + streets stay dead through the winter plateau.
 *   - `ctx.paintBiomeTransition(transitionRules)` kicks off the async
 *     biome-override walker that ice age + global warming already use.
 *   - `getClimateContribution` + `getCloudContribution` ride a shared
 *     `nuclearWinterEnvelope` so cooling, sea-level fall, soot tint, and
 *     biome crossfade all line up on the same curve.
 *   - `getClimateEnvelope` overrides the registry's default so biome
 *     crossfade stays at 0 during the strike phase (envelope rises only
 *     after the last fireball lands).
 *   - `ctx.setWorldEffect('airplaneSpawn', 0)` after day 1 stops planes
 *     respawning; `onEnd` restores it to 1.
 *
 * Per-card destruction census (`hasDestructionCensus: true`) is
 * maintained by the registry walking cities + major/arterial roads
 * inside the strike-set bbox.
 */
import { DEFAULT_NUCLEAR_WAR_CONFIG, buildStrikeSchedule, nuclearWinterEnvelope, } from './NuclearWarScenario.config.js';
const SOOT_SUN_TINT = { r: 0.42, g: 0.31, b: 0.22 };
const SOOT_AMBIENT_TINT = { r: 0.30, g: 0.27, b: 0.26 };
export const NuclearWarScenario = {
    isClimateClass: true,
    hasDestructionCensus: true,
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
        ctx.paintBiomeTransition(cfg.transitionRules);
    },
    onTick(scn, progress01, ctx) {
        const elapsedRel = progress01 * scn.durationDays;
        const childMode = scn.payload.rebuildAfterWar ? 'quickThenSlow' : 'sustained';
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
    getClimateContribution(scn, progress01) {
        const env = nuclearWinterEnvelope(progress01, scn.payload);
        return {
            tempC: scn.payload.maxTempDeltaC * env,
            seaLevelM: scn.payload.maxSeaLevelM * env,
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
    getStrikePoints(scn) {
        const schedule = scn.payload.schedule;
        const out = new Array(schedule.length);
        for (let i = 0; i < schedule.length; i++) {
            const s = schedule[i];
            out[i] = { latDeg: s.latDeg, lonDeg: s.lonDeg };
        }
        return out;
    },
    getStrikeProgress(scn) {
        const schedule = scn.payload.schedule;
        let fired = 0;
        for (let i = 0; i < schedule.length; i++) {
            if (schedule[i].spawnedScenarioId)
                fired++;
        }
        return { fired, scheduled: schedule.length };
    },
    getChildScenarioIds(scn) {
        const schedule = scn.payload.schedule;
        const ids = [];
        for (let i = 0; i < schedule.length; i++) {
            const id = schedule[i].spawnedScenarioId;
            if (id)
                ids.push(id);
        }
        return ids;
    },
};

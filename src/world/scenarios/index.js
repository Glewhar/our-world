/**
 * Scenario-system barrel. Re-exports the registry + handlers so main.ts
 * and the UI layer can `import { ScenarioRegistry, NuclearScenario } from
 * '../world/scenarios/index.js'` without reaching into individual files.
 */
export { ScenarioRegistry } from './ScenarioRegistry.js';
export { NuclearScenario } from './handlers/NuclearScenario.js';
export { DEFAULT_NUCLEAR_CONFIG, hexNumberToCss, NUCLEAR_PARTICLE_TYPES, } from './handlers/NuclearScenario.config.js';
export { GlobalWarmingScenario } from './handlers/GlobalWarmingScenario.js';
export { DEFAULT_GLOBAL_WARMING_CONFIG } from './handlers/GlobalWarmingScenario.config.js';
export { IceAgeScenario } from './handlers/IceAgeScenario.js';
export { DEFAULT_ICE_AGE_CONFIG } from './handlers/IceAgeScenario.config.js';
export { InfraDecayScenario } from './handlers/InfraDecayScenario.js';
export { INFRA_DECAY_DURATION_DAYS, INFRA_DECAY_LABEL, } from './handlers/InfraDecayScenario.config.js';
export { NuclearWarScenario } from './handlers/NuclearWarScenario.js';
export { DEFAULT_NUCLEAR_WAR_CONFIG, buildStrikeSchedule, nuclearWinterEnvelope, } from './handlers/NuclearWarScenario.config.js';
export { projectBiome, buildProjectionPolygonTextures, deltaMagnitude, } from './biomeProjection.js';
export { climateRisePlateauFall, decayQuickThenSlow, decaySustained, infraDecayEnvelope, } from './recoveryCurves.js';
export { pristineWorldHealth } from './healthSnapshot.js';
export { zeroBudget } from './impactBudget.js';

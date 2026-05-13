/**
 * Scenario-system barrel. Re-exports the registry + handlers so main.ts
 * and the UI layer can `import { ScenarioRegistry, NuclearScenario } from
 * '../world/scenarios/index.js'` without reaching into individual files.
 */
export { ScenarioRegistry } from './ScenarioRegistry.js';
export { NuclearScenario } from './handlers/NuclearScenario.js';
export { DEFAULT_NUCLEAR_CONFIG, hexNumberToCss, NUCLEAR_PARTICLE_TYPES, } from './handlers/NuclearScenario.config.js';
export { decayQuickThenSlow } from './recoveryCurves.js';

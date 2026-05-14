/**
 * Scenario-system barrel. Re-exports the registry + handlers so main.ts
 * and the UI layer can `import { ScenarioRegistry, NuclearScenario } from
 * '../world/scenarios/index.js'` without reaching into individual files.
 */

export { ScenarioRegistry } from './ScenarioRegistry.js';
export type {
  AttributeSink,
  BiomeOverrideSink,
  ScenarioRegistryDeps,
  StartResult,
} from './ScenarioRegistry.js';
export { NuclearScenario } from './handlers/NuclearScenario.js';
export {
  DEFAULT_NUCLEAR_CONFIG,
  hexNumberToCss,
  NUCLEAR_PARTICLE_TYPES,
} from './handlers/NuclearScenario.config.js';
export type {
  NuclearDetonateTuning,
  NuclearLiveTuning,
  NuclearScenarioConfig,
} from './handlers/NuclearScenario.config.js';
export { GlobalWarmingScenario } from './handlers/GlobalWarmingScenario.js';
export {
  DEFAULT_GLOBAL_WARMING_CONFIG,
  GLOBAL_WARMING_TRANSITIONS,
} from './handlers/GlobalWarmingScenario.config.js';
export type { GlobalWarmingScenarioConfig } from './handlers/GlobalWarmingScenario.config.js';
export { IceAgeScenario } from './handlers/IceAgeScenario.js';
export {
  BIOME,
  DEFAULT_ICE_AGE_CONFIG,
  ICE_AGE_TRANSITIONS,
} from './handlers/IceAgeScenario.config.js';
export type { IceAgeScenarioConfig } from './handlers/IceAgeScenario.config.js';
export { NuclearWarScenario } from './handlers/NuclearWarScenario.js';
export {
  DEFAULT_NUCLEAR_WAR_CONFIG,
  NUCLEAR_WAR_TRANSITIONS,
  buildStrikeSchedule,
  nuclearWinterEnvelope,
} from './handlers/NuclearWarScenario.config.js';
export type {
  NuclearWarScenarioConfig,
  StrikeSize,
} from './handlers/NuclearWarScenario.config.js';
export { climateRisePlateauFall, decayQuickThenSlow, decaySustained } from './recoveryCurves.js';
export type {
  BandPaintArgs,
  BiomeCensus,
  BiomeTransitionRule,
  ClimateContribution,
  CloudContribution,
  DestructionCensus,
  EllipsePaintArgs,
  GlobalWarmingScenarioPayload,
  IceAgeScenarioPayload,
  NuclearScenarioPayload,
  NuclearStrike,
  NuclearWarScenarioPayload,
  PaintArgs,
  Scenario,
  ScenarioCity,
  ScenarioContext,
  ScenarioKind,
  ScenarioKindHandler,
  ScenarioPayload,
  ScenarioStamp,
  StartScenarioOpts,
  TerrainSample,
} from './types.js';

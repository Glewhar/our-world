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
export { DEFAULT_GLOBAL_WARMING_CONFIG } from './handlers/GlobalWarmingScenario.config.js';
export type { GlobalWarmingScenarioConfig } from './handlers/GlobalWarmingScenario.config.js';
export { IceAgeScenario } from './handlers/IceAgeScenario.js';
export { DEFAULT_ICE_AGE_CONFIG } from './handlers/IceAgeScenario.config.js';
export type { IceAgeScenarioConfig } from './handlers/IceAgeScenario.config.js';
export { InfraDecayScenario } from './handlers/InfraDecayScenario.js';
export {
  INFRA_DECAY_DURATION_DAYS,
  INFRA_DECAY_LABEL,
} from './handlers/InfraDecayScenario.config.js';
export { RebuildingScenario } from './handlers/RebuildingScenario.js';
export {
  REBUILD_DURATION_DAYS,
  REBUILD_LABEL,
} from './handlers/RebuildingScenario.config.js';
export { NuclearWarScenario } from './handlers/NuclearWarScenario.js';
export {
  DEFAULT_NUCLEAR_WAR_CONFIG,
  buildStrikeSchedule,
  nuclearWinterEnvelope,
} from './handlers/NuclearWarScenario.config.js';
export type {
  NuclearWarScenarioConfig,
  StrikeSize,
} from './handlers/NuclearWarScenario.config.js';
export {
  projectBiome,
  buildProjectionPolygonTextures,
  deltaMagnitude,
} from './biomeProjection.js';
export type {
  ClimateDelta,
  ProjectedTransition,
} from './biomeProjection.js';
export {
  climateRisePlateauFall,
  decayQuickThenSlow,
  decaySustained,
  infraDecayEnvelope,
  rebuildEnvelope,
} from './recoveryCurves.js';
export { pristineWorldHealth } from './healthSnapshot.js';
export type { WorldHealthSnapshot } from './healthSnapshot.js';
export { zeroBudget } from './impactBudget.js';
export type {
  ImpactBudgetDeps,
  ScenarioImpactBudget,
  StrikeEllipse,
} from './impactBudget.js';
export type {
  BandPaintArgs,
  ClimateContribution,
  CloudContribution,
  EllipsePaintArgs,
  GlobalWarmingScenarioPayload,
  IceAgeScenarioPayload,
  InfraDecayScenarioPayload,
  NuclearScenarioPayload,
  NuclearStrike,
  NuclearWarScenarioPayload,
  PaintArgs,
  RebuildingScenarioPayload,
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

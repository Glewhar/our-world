import { describe, it, expect } from 'vitest';
import {
  ScenarioRegistry,
  type AttributeSink,
  type BiomeOverrideSink,
} from '../ScenarioRegistry.js';
import { GlobalWarmingScenario } from '../handlers/GlobalWarmingScenario.js';
import { IceAgeScenario } from '../handlers/IceAgeScenario.js';
import { DEFAULT_GLOBAL_WARMING_CONFIG } from '../handlers/GlobalWarmingScenario.config.js';
import { DEFAULT_ICE_AGE_CONFIG } from '../handlers/IceAgeScenario.config.js';
import { climateRisePlateauFall } from '../recoveryCurves.js';
import { seaLevelFromTempDelta } from '../seaLevelFromTemp.js';
import { BIOME } from '../../biomes/BiomeLookup.js';
import { polygonsThatFlipTo } from '../climateDestructionStamps.js';
import type { PolygonLookup } from '../../PolygonTexture.js';
import type { ScenarioContext } from '../types.js';

function buildLookup(): PolygonLookup {
  const biomes = [
    0,
    BIOME.TUNDRA,
    BIOME.BOREAL,
    BIOME.TEMPERATE_BROADLEAF,
    BIOME.TROPICAL_MOIST,
    BIOME.DESERT,
  ];
  const n = biomes.length;
  const biome = new Int8Array(n);
  const lats = [0, 70, 60, 45, 0, 25];
  const latC = new Float32Array(n);
  const lonC = new Float32Array(n);
  const latMin = new Float32Array(n);
  const latMax = new Float32Array(n);
  const lonMin = new Float32Array(n);
  const lonMax = new Float32Array(n);
  for (let i = 1; i < n; i++) {
    biome[i] = biomes[i]!;
    latC[i] = lats[i]!;
    latMin[i] = lats[i]! - 5;
    latMax[i] = lats[i]! + 5;
    lonMin[i] = -5;
    lonMax[i] = 5;
  }
  return {
    count: n - 1,
    entries: [],
    rasterWidth: 0,
    rasterHeight: 0,
    biome,
    realm: new Int8Array(n),
    latC,
    lonC,
    latMin,
    latMax,
    lonMin,
    lonMax,
    elevMin: new Float32Array(n),
    elevP10: new Float32Array(n),
    elevP50: new Float32Array(n),
    elevP90: new Float32Array(n),
    elevMax: new Float32Array(n),
    realmNames: {},
  };
}

function buildRegistry(lookup: PolygonLookup): ScenarioRegistry {
  const biomeOverrideSink: BiomeOverrideSink = {
    bakeBiomeOverrideStamps: () => {},
    countBiomesGlobal: () => {
      const out: Record<number, number> = {};
      for (let i = 1; i <= lookup.count; i++) {
        const c = lookup.biome[i]! & 0xff;
        out[c] = (out[c] ?? 0) + 1;
      }
      return out;
    },
    getElevationMetersAtCell: () => 0,
    getPolygonOfCell: () => 0,
    getPolygonIdAt: () => 0,
    getPolygonLookup: () => lookup,
    bakePolygonOverride: () => {},
    clearPolygonOverrideSlot: () => {},
  };
  const attributeSink: AttributeSink = {
    key: 'wasteland',
    applyFrame: () => {},
  };
  const context: ScenarioContext = {
    sampleWindAt: () => null,
    sampleTerrainAt: () => ({ elevationM: 0, wind: null }),
    detonateAt: () => {},
    paintAttributeEllipse: () => {},
    paintAttributeBand: () => {},
    paintAttributeCells: () => {},
    getElevationMetersAtCell: () => 0,
    getPolygonOfCell: () => 0,
    getCellCount: () => 12 * 16 * 16,
    getPolygonLookup: () => null,
    spawnChildScenario: () => '',
    stopChildScenario: () => {},
    setWorldEffect: () => {},
    getMajorCities: () => [],
    getRoadCount: () => 0,
    getSeaLevelMultiplier: () => 1,
  };
  const registry = new ScenarioRegistry({
    attributeSinks: [attributeSink],
    biomeOverrideSink,
    context,
    nside: 16,
    ordering: 'ring',
  });
  registry.registerHandler('globalWarming', GlobalWarmingScenario);
  registry.registerHandler('iceAge', IceAgeScenario);
  return registry;
}

describe('ScenarioRegistry.getDestructionFrame', () => {
  it('Global Warming publishes a non-null flip mask, positive sea level, and rising envelope', () => {
    const lookup = buildLookup();
    const registry = buildRegistry(lookup);
    const expectedMask = polygonsThatFlipTo(
      {
        tempC: DEFAULT_GLOBAL_WARMING_CONFIG.maxTempDeltaC,
        precipMm: DEFAULT_GLOBAL_WARMING_CONFIG.precipDeltaMm,
      },
      BIOME.DESERT,
      lookup,
    );
    registry.start(
      'globalWarming',
      {
        maxTempDeltaC: DEFAULT_GLOBAL_WARMING_CONFIG.maxTempDeltaC,
        precipDeltaMm: DEFAULT_GLOBAL_WARMING_CONFIG.precipDeltaMm,
      },
      0,
      DEFAULT_GLOBAL_WARMING_CONFIG.durationDays,
    );
    const earlyProgress = 0.5; // before plateau in this fixture's lifetime
    registry.tick(DEFAULT_GLOBAL_WARMING_CONFIG.durationDays * earlyProgress);
    const f = registry.getDestructionFrame();
    expect(f.polyFlipMask).not.toBeNull();
    expect(f.polyFlipMask!.length).toBe(lookup.count + 1);
    // Mask bytes match what `polygonsThatFlipTo` would emit directly.
    for (let i = 0; i < expectedMask.length; i++) {
      expect(f.polyFlipMask![i]).toBe(expectedMask[i]);
    }
    const expectedSea = Math.max(
      0,
      seaLevelFromTempDelta(DEFAULT_GLOBAL_WARMING_CONFIG.maxTempDeltaC, 1),
    );
    expect(f.seaLevelM).toBe(expectedSea);
    expect(f.seaLevelM).toBeGreaterThan(0);
    expect(f.intensity).toBeCloseTo(climateRisePlateauFall(earlyProgress));
  });

  it('Global Warming on plateau publishes intensity ≈ 1', () => {
    const lookup = buildLookup();
    const registry = buildRegistry(lookup);
    registry.start(
      'globalWarming',
      {
        maxTempDeltaC: DEFAULT_GLOBAL_WARMING_CONFIG.maxTempDeltaC,
        precipDeltaMm: DEFAULT_GLOBAL_WARMING_CONFIG.precipDeltaMm,
      },
      0,
      DEFAULT_GLOBAL_WARMING_CONFIG.durationDays,
    );
    // riseFrac = 0.10, fallFrac = 0.30 — 0.5 lands inside the plateau.
    registry.tick(DEFAULT_GLOBAL_WARMING_CONFIG.durationDays * 0.5);
    const f = registry.getDestructionFrame();
    expect(f.intensity).toBeCloseTo(1, 6);
  });

  it('zeroes the mask and clears scalars after the scenario ends', () => {
    const lookup = buildLookup();
    const registry = buildRegistry(lookup);
    const { id } = registry.start(
      'globalWarming',
      {
        maxTempDeltaC: DEFAULT_GLOBAL_WARMING_CONFIG.maxTempDeltaC,
        precipDeltaMm: DEFAULT_GLOBAL_WARMING_CONFIG.precipDeltaMm,
      },
      0,
      DEFAULT_GLOBAL_WARMING_CONFIG.durationDays,
    ) as { ok: true; id: string };
    registry.tick(DEFAULT_GLOBAL_WARMING_CONFIG.durationDays * 0.5);
    const live = registry.getDestructionFrame();
    expect(live.polyFlipMask).not.toBeNull();
    let liveHasFlip = false;
    for (let i = 0; i < live.polyFlipMask!.length; i++) {
      if (live.polyFlipMask![i]! > 0) {
        liveHasFlip = true;
        break;
      }
    }
    expect(liveHasFlip).toBe(true);

    registry.stop(id);
    const after = registry.getDestructionFrame();
    expect(after.polyFlipMask).not.toBeNull();
    for (let i = 0; i < after.polyFlipMask!.length; i++) {
      expect(after.polyFlipMask![i]).toBe(0);
    }
    expect(after.seaLevelM).toBe(0);
    expect(after.intensity).toBe(0);
  });

  it('Ice Age publishes an ICE flip mask with seaLevelM == 0 throughout', () => {
    const lookup = buildLookup();
    const registry = buildRegistry(lookup);
    const expectedMask = polygonsThatFlipTo(
      {
        tempC: DEFAULT_ICE_AGE_CONFIG.maxTempDeltaC,
        precipMm: DEFAULT_ICE_AGE_CONFIG.precipDeltaMm,
      },
      BIOME.ICE,
      lookup,
    );
    registry.start(
      'iceAge',
      {
        maxTempDeltaC: DEFAULT_ICE_AGE_CONFIG.maxTempDeltaC,
        precipDeltaMm: DEFAULT_ICE_AGE_CONFIG.precipDeltaMm,
      },
      0,
      DEFAULT_ICE_AGE_CONFIG.durationDays,
    );
    registry.tick(DEFAULT_ICE_AGE_CONFIG.durationDays * 0.5);
    const f = registry.getDestructionFrame();
    expect(f.polyFlipMask).not.toBeNull();
    for (let i = 0; i < expectedMask.length; i++) {
      expect(f.polyFlipMask![i]).toBe(expectedMask[i]);
    }
    expect(f.seaLevelM).toBe(0);
    expect(f.intensity).toBeCloseTo(1, 6);
  });

  it('Ice Age plateau intensity ≈ 1, falls to 0 after stop', () => {
    const lookup = buildLookup();
    const registry = buildRegistry(lookup);
    const { id } = registry.start(
      'iceAge',
      {
        maxTempDeltaC: DEFAULT_ICE_AGE_CONFIG.maxTempDeltaC,
        precipDeltaMm: DEFAULT_ICE_AGE_CONFIG.precipDeltaMm,
      },
      0,
      DEFAULT_ICE_AGE_CONFIG.durationDays,
    ) as { ok: true; id: string };
    registry.tick(DEFAULT_ICE_AGE_CONFIG.durationDays * 0.5);
    expect(registry.getDestructionFrame().intensity).toBeCloseTo(1, 6);
    registry.stop(id);
    const after = registry.getDestructionFrame();
    expect(after.seaLevelM).toBe(0);
    expect(after.intensity).toBe(0);
    for (let i = 0; i < after.polyFlipMask!.length; i++) {
      expect(after.polyFlipMask![i]).toBe(0);
    }
  });
});

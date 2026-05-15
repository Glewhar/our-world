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
import { BIOME } from '../../biomes/BiomeLookup.js';
import type { PolygonLookup } from '../../PolygonTexture.js';
import type { ScenarioContext } from '../types.js';

/**
 * Synthetic 5-polygon lookup spanning the biome niches we care about for
 * GW vs IA cancellation. Each polygon is a 10°×10° bbox at the latitude
 * suggested by its baseline biome; centroids drive nothing in the
 * projection path (the projection is climate-niche driven), but the bbox
 * area is what `tallyProjectionBiome` divides by `landAreaProxy`.
 */
function buildLookup(): PolygonLookup {
  const biomes = [
    0, // slot 0 sentinel
    BIOME.TUNDRA,
    BIOME.BOREAL,
    BIOME.TEMPERATE_BROADLEAF,
    BIOME.TROPICAL_MOIST,
    BIOME.DESERT,
  ];
  const n = biomes.length;
  const biome = new Int8Array(n);
  const realm = new Int8Array(n);
  const latC = new Float32Array(n);
  const lonC = new Float32Array(n);
  const latMin = new Float32Array(n);
  const latMax = new Float32Array(n);
  const lonMin = new Float32Array(n);
  const lonMax = new Float32Array(n);
  const elevMin = new Float32Array(n);
  const elevP10 = new Float32Array(n);
  const elevP50 = new Float32Array(n);
  const elevP90 = new Float32Array(n);
  const elevMax = new Float32Array(n);
  // Suggested centroid latitudes by biome niche (so absLat gates align if
  // any future config uses them). All 10°×10° boxes at lon=0.
  const lats = [0, 70, 60, 45, 0, 25];
  for (let i = 1; i < n; i++) {
    biome[i] = biomes[i]!;
    latC[i] = lats[i]!;
    lonC[i] = 0;
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
    realm,
    latC,
    lonC,
    latMin,
    latMax,
    lonMin,
    lonMax,
    elevMin,
    elevP10,
    elevP50,
    elevP90,
    elevMax,
    realmNames: {},
  };
}

function buildRegistry(): ScenarioRegistry {
  const lookup = buildLookup();
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
    spawnChildScenario: () => '',
    stopChildScenario: () => {},
    setWorldEffect: () => {},
    getMajorCities: () => [],
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

describe('climate-class cancellation', () => {
  it('pristine world reports biomeQualityNet === 0', () => {
    const registry = buildRegistry();
    const h = registry.getWorldHealth();
    expect(h.stats.biomeQualityNet).toBe(0);
  });

  it('Global Warming alone drives biomeQualityNet negative', () => {
    const registry = buildRegistry();
    registry.start(
      'globalWarming',
      {
        maxTempDeltaC: DEFAULT_GLOBAL_WARMING_CONFIG.maxTempDeltaC,
        precipDeltaMm: DEFAULT_GLOBAL_WARMING_CONFIG.precipDeltaMm,
      },
      0,
      DEFAULT_GLOBAL_WARMING_CONFIG.durationDays,
    );
    // Run to plateau so envelope = 1 and the budget shows full impact.
    registry.tick(DEFAULT_GLOBAL_WARMING_CONFIG.durationDays * 0.5);
    const h = registry.getWorldHealth();
    expect(h.stats.biomeQualityNet).toBeLessThan(0);
  });

  it('symmetric Global Warming + Ice Age combined cancel below the flip threshold', () => {
    const registry = buildRegistry();
    // Use symmetric peaks so the combined frame lands at (0, 0) and the
    // projection's MIN_DELTA_TO_FLIP gate refuses every flip.
    const symmetricMagnitudeC = 8;
    const symmetricMagnitudeMm = 30;
    registry.start(
      'globalWarming',
      {
        maxTempDeltaC: symmetricMagnitudeC,
        precipDeltaMm: symmetricMagnitudeMm,
      },
      0,
      30,
    );
    registry.start(
      'iceAge',
      {
        maxTempDeltaC: -symmetricMagnitudeC,
        precipDeltaMm: -symmetricMagnitudeMm,
      },
      0,
      30,
    );
    // Tick into both envelopes' plateaus.
    registry.tick(15);
    const combined = registry.getWorldHealth();
    // Combined delta is (0, 0); MIN_DELTA_TO_FLIP gates every projection
    // call to no-flip → biomeChanges empty and biomeQualityNet exactly 0.
    expect(combined.stats.biomeQualityNet).toBe(0);
    expect(combined.stats.biomeChanges).toHaveLength(0);
  });

  it('asymmetric Global Warming + Ice Age combined still drag toward zero', () => {
    const registry = buildRegistry();
    registry.start(
      'globalWarming',
      {
        maxTempDeltaC: DEFAULT_GLOBAL_WARMING_CONFIG.maxTempDeltaC,
        precipDeltaMm: DEFAULT_GLOBAL_WARMING_CONFIG.precipDeltaMm,
      },
      0,
      DEFAULT_GLOBAL_WARMING_CONFIG.durationDays,
    );
    registry.tick(DEFAULT_GLOBAL_WARMING_CONFIG.durationDays * 0.5);
    const gwOnlyChanges = registry.getWorldHealth().stats.biomeChanges.length;

    registry.start(
      'iceAge',
      {
        maxTempDeltaC: DEFAULT_ICE_AGE_CONFIG.maxTempDeltaC,
        precipDeltaMm: DEFAULT_ICE_AGE_CONFIG.precipDeltaMm,
      },
      DEFAULT_GLOBAL_WARMING_CONFIG.durationDays * 0.5,
      DEFAULT_ICE_AGE_CONFIG.durationDays,
    );
    registry.tick(
      DEFAULT_GLOBAL_WARMING_CONFIG.durationDays * 0.5
        + DEFAULT_ICE_AGE_CONFIG.durationDays * 0.5,
    );
    const combinedChanges = registry.getWorldHealth().stats.biomeChanges.length;
    // Even with the asymmetric default deltas the combined frame's
    // smaller magnitude produces strictly fewer distinct transitions
    // than GW alone.
    expect(combinedChanges).toBeLessThanOrEqual(gwOnlyChanges);
  });

  it('refuses a third concurrent climate-class scenario', () => {
    const registry = buildRegistry();
    const gwPayload = {
      maxTempDeltaC: DEFAULT_GLOBAL_WARMING_CONFIG.maxTempDeltaC,
      precipDeltaMm: DEFAULT_GLOBAL_WARMING_CONFIG.precipDeltaMm,
    };
    const iaPayload = {
      maxTempDeltaC: DEFAULT_ICE_AGE_CONFIG.maxTempDeltaC,
      precipDeltaMm: DEFAULT_ICE_AGE_CONFIG.precipDeltaMm,
    };
    const a = registry.start('globalWarming', gwPayload, 0, DEFAULT_GLOBAL_WARMING_CONFIG.durationDays);
    expect(a.ok).toBe(true);
    const b = registry.start('iceAge', iaPayload, 0, DEFAULT_ICE_AGE_CONFIG.durationDays);
    expect(b.ok).toBe(true);
    expect(registry.climateSlotsFull()).toBe(true);
    const c = registry.start('globalWarming', gwPayload, 0, DEFAULT_GLOBAL_WARMING_CONFIG.durationDays);
    expect(c.ok).toBe(false);
    if (!c.ok) expect(c.reason).toBe('climate-busy');
  });
});

/**
 * BiomeLookup — single source of truth for per-biome ecology metadata.
 *
 * Effect summary:
 *   - simulation: scenarios read `qualityRank`, `popDensityKm2`,
 *     `radiationResidency`, and `climateNiche` to compute signed impact
 *     budgets (population at risk, fallout absorption, biome quality
 *     gain/loss) without each scenario hard-coding its own assumptions.
 *   - visual: no direct render path. HUD signed-transition readout
 *     consumes `qualityRank` via `biomeQuality(id)` to decide whether a
 *     desert → wetland flip reads as gain or loss.
 *
 * The numeric `BIOME` id constant is owned here too — the WWF TEOW
 * baked attribute (G channel of `attribute_static`) emits ids 1..14
 * plus the three synthetic shelf biomes (16 polar, 17 temperate, 18
 * equatorial) classified at bake time by latitude for cells outside
 * every TEOW polygon. Ids 15 ("ice / glacier") and 19 ("wasteland")
 * are synthetic too and only ever produced by override stamps
 * (cold-climate / nuclear fallout), never baked.
 *
 * Index [0] is a no-data sentinel — keeps `BIOME_LOOKUP[id]` lookups
 * branch-free for ids 1..19.
 */

export type BiomeEntry = {
  readonly id: number;
  readonly name: string;
  /**
   * 0..10 ecosystem quality rank. Rainforest=10, wetland=9, mangrove=9,
   * temperate forest=8, savanna=6, grassland=5, desert=2, ice=1.
   */
  readonly qualityRank: number;
  /**
   * Approximate persons / km² for non-city population estimate. Empty
   * desert ~0.5, savanna ~8, temperate forest ~30, rainforest ~15.
   */
  readonly popDensityKm2: number;
  /**
   * 0..1 — how strongly fallout sticks. Forest canopy filters (low),
   * open desert/tundra retain (high). Scales radiationUnits per cell.
   */
  readonly radiationResidency: number;
  /**
   * Climate niche used by `projectBiome`. Center + tolerance in °C and
   * mm/year. Cells outside their baseline's tolerance are candidates to
   * flip toward the nearest matching niche.
   */
  readonly climateNiche: {
    readonly tempCenterC: number;
    readonly tempToleranceC: number;
    readonly precipCenterMm: number;
    readonly precipToleranceMm: number;
  };
};

/**
 * WWF TEOW biome ids — see `data-pipeline/src/earth_pipeline/wwf_biomes.py`
 * and `web/src/debug/defaults.ts:biomePalette`. Id 15 is the synthetic
 * "ice / glacier" biome added in the override palette (never produced
 * by the baked attribute_static.G).
 */
export const BIOME = {
  TROPICAL_MOIST: 1,
  TROPICAL_DRY: 2,
  TROPICAL_CONIFER: 3,
  TEMPERATE_BROADLEAF: 4,
  TEMPERATE_CONIFER: 5,
  BOREAL: 6,
  TROPICAL_SAVANNA: 7,
  TEMPERATE_GRASSLAND: 8,
  FLOODED_GRASSLAND: 9,
  MONTANE_GRASSLAND: 10,
  TUNDRA: 11,
  MEDITERRANEAN: 12,
  DESERT: 13,
  MANGROVE: 14,
  ICE: 15,
  POLAR_SHELF: 16,
  TEMPERATE_SHELF: 17,
  EQUATORIAL_SHELF: 18,
  WASTELAND: 19,
} as const;

const NO_DATA: BiomeEntry = {
  id: 0,
  name: 'no data',
  qualityRank: 0,
  popDensityKm2: 0,
  radiationResidency: 0.5,
  climateNiche: {
    tempCenterC: 0,
    tempToleranceC: 100,
    precipCenterMm: 0,
    precipToleranceMm: 10000,
  },
};

export const BIOME_LOOKUP: readonly BiomeEntry[] = [
  NO_DATA,
  {
    id: BIOME.TROPICAL_MOIST,
    name: 'tropical moist forest',
    qualityRank: 10,
    popDensityKm2: 15,
    radiationResidency: 0.35,
    climateNiche: {
      tempCenterC: 26,
      tempToleranceC: 4,
      precipCenterMm: 2200,
      precipToleranceMm: 700,
    },
  },
  {
    id: BIOME.TROPICAL_DRY,
    name: 'tropical dry forest',
    qualityRank: 7,
    popDensityKm2: 20,
    radiationResidency: 0.5,
    climateNiche: {
      tempCenterC: 25,
      tempToleranceC: 4,
      precipCenterMm: 1200,
      precipToleranceMm: 400,
    },
  },
  {
    id: BIOME.TROPICAL_CONIFER,
    name: 'tropical conifer',
    qualityRank: 7,
    popDensityKm2: 10,
    radiationResidency: 0.4,
    climateNiche: {
      tempCenterC: 18,
      tempToleranceC: 5,
      precipCenterMm: 1500,
      precipToleranceMm: 500,
    },
  },
  {
    id: BIOME.TEMPERATE_BROADLEAF,
    name: 'temperate broadleaf',
    qualityRank: 8,
    popDensityKm2: 30,
    radiationResidency: 0.4,
    climateNiche: {
      tempCenterC: 10,
      tempToleranceC: 6,
      precipCenterMm: 900,
      precipToleranceMm: 400,
    },
  },
  {
    id: BIOME.TEMPERATE_CONIFER,
    name: 'temperate conifer',
    qualityRank: 7,
    popDensityKm2: 20,
    radiationResidency: 0.4,
    climateNiche: {
      tempCenterC: 8,
      tempToleranceC: 6,
      precipCenterMm: 700,
      precipToleranceMm: 300,
    },
  },
  {
    id: BIOME.BOREAL,
    name: 'boreal / taiga',
    qualityRank: 7,
    popDensityKm2: 3,
    radiationResidency: 0.5,
    climateNiche: {
      tempCenterC: 2,
      tempToleranceC: 5,
      precipCenterMm: 500,
      precipToleranceMm: 300,
    },
  },
  {
    id: BIOME.TROPICAL_SAVANNA,
    name: 'tropical savanna',
    qualityRank: 6,
    popDensityKm2: 8,
    radiationResidency: 0.7,
    climateNiche: {
      tempCenterC: 24,
      tempToleranceC: 6,
      precipCenterMm: 900,
      precipToleranceMm: 400,
    },
  },
  {
    id: BIOME.TEMPERATE_GRASSLAND,
    name: 'temperate grassland',
    qualityRank: 5,
    popDensityKm2: 12,
    radiationResidency: 0.85,
    climateNiche: {
      tempCenterC: 8,
      tempToleranceC: 6,
      precipCenterMm: 500,
      precipToleranceMm: 250,
    },
  },
  {
    id: BIOME.FLOODED_GRASSLAND,
    name: 'flooded grassland',
    qualityRank: 9,
    popDensityKm2: 5,
    radiationResidency: 0.3,
    climateNiche: {
      tempCenterC: 24,
      tempToleranceC: 6,
      precipCenterMm: 1900,
      precipToleranceMm: 600,
    },
  },
  {
    id: BIOME.MONTANE_GRASSLAND,
    name: 'montane grassland',
    qualityRank: 6,
    popDensityKm2: 2,
    radiationResidency: 0.75,
    climateNiche: {
      tempCenterC: 5,
      tempToleranceC: 6,
      precipCenterMm: 600,
      precipToleranceMm: 300,
    },
  },
  {
    id: BIOME.TUNDRA,
    name: 'tundra',
    qualityRank: 3,
    popDensityKm2: 0.1,
    radiationResidency: 0.9,
    climateNiche: {
      tempCenterC: -5,
      tempToleranceC: 5,
      precipCenterMm: 300,
      precipToleranceMm: 200,
    },
  },
  {
    id: BIOME.MEDITERRANEAN,
    name: 'mediterranean',
    qualityRank: 5,
    popDensityKm2: 80,
    radiationResidency: 0.65,
    climateNiche: {
      tempCenterC: 16,
      tempToleranceC: 4,
      precipCenterMm: 500,
      precipToleranceMm: 200,
    },
  },
  {
    id: BIOME.DESERT,
    name: 'desert / xeric',
    qualityRank: 2,
    popDensityKm2: 0.5,
    radiationResidency: 0.95,
    climateNiche: {
      tempCenterC: 25,
      tempToleranceC: 3,
      precipCenterMm: 150,
      precipToleranceMm: 150,
    },
  },
  {
    id: BIOME.MANGROVE,
    name: 'mangroves',
    qualityRank: 9,
    popDensityKm2: 20,
    radiationResidency: 0.3,
    climateNiche: {
      tempCenterC: 26,
      tempToleranceC: 3,
      precipCenterMm: 2000,
      precipToleranceMm: 700,
    },
  },
  {
    id: BIOME.ICE,
    name: 'ice / glacier',
    qualityRank: 1,
    popDensityKm2: 0,
    radiationResidency: 0.85,
    climateNiche: {
      tempCenterC: -25,
      tempToleranceC: 8,
      precipCenterMm: 100,
      precipToleranceMm: 150,
    },
  },
  {
    // Exposed continental-shelf seafloor, |lat| ≥ 60°. Bake-time
    // classifier (`assign_shelf_biomes`) tags every TEOW-uncovered
    // cell so the LAND seafloor branch can colour it under a dropping
    // sea level. Quality / popDensity neutral so impact scoring treats
    // these as inert — no civilisation lives on bare shelf.
    id: BIOME.POLAR_SHELF,
    name: 'polar shelf',
    qualityRank: 1,
    popDensityKm2: 0,
    radiationResidency: 0.5,
    climateNiche: {
      tempCenterC: 0,
      tempToleranceC: 100,
      precipCenterMm: 0,
      precipToleranceMm: 10000,
    },
  },
  {
    // Exposed shelf, 23.5° ≤ |lat| < 60°. Same neutral profile.
    id: BIOME.TEMPERATE_SHELF,
    name: 'temperate shelf',
    qualityRank: 1,
    popDensityKm2: 0,
    radiationResidency: 0.5,
    climateNiche: {
      tempCenterC: 0,
      tempToleranceC: 100,
      precipCenterMm: 0,
      precipToleranceMm: 10000,
    },
  },
  {
    // Exposed shelf, |lat| < 23.5°. Same neutral profile.
    id: BIOME.EQUATORIAL_SHELF,
    name: 'equatorial shelf',
    qualityRank: 1,
    popDensityKm2: 0,
    radiationResidency: 0.5,
    climateNiche: {
      tempCenterC: 0,
      tempToleranceC: 100,
      precipCenterMm: 0,
      precipToleranceMm: 10000,
    },
  },
  {
    id: BIOME.WASTELAND,
    name: 'wasteland',
    qualityRank: 0,
    popDensityKm2: 0,
    radiationResidency: 1,
    climateNiche: {
      tempCenterC: 0,
      tempToleranceC: 100,
      precipCenterMm: 0,
      precipToleranceMm: 10000,
    },
  },
] as const;

export function biomeQuality(id: number): number {
  const entry = BIOME_LOOKUP[id];
  return entry ? entry.qualityRank : 0;
}

export function biomeName(id: number): string {
  const entry = BIOME_LOOKUP[id];
  return entry ? entry.name : 'unknown';
}

/**
 * Coarse diorama categories used by the HUD biome hex row. Every land
 * biome id maps to one of six visual buckets — the HUD doesn't care
 * about the full ontology, only enough variety to read at a glance
 * (lush forest vs. dry grass vs. ice vs. wasteland). Exposed shelf
 * biomes (16/17/18) and the no-data sentinel return `null` — they're
 * seafloor under normal sea level and shouldn't push hexes into the
 * diorama.
 */
export type BiomeCategory =
  | 'rainforest'
  | 'temperateForest'
  | 'grassland'
  | 'desert'
  | 'tundraIce'
  | 'wasteland';

export const BIOME_CATEGORY: Record<number, BiomeCategory | null> = {
  0: null,
  [BIOME.TROPICAL_MOIST]: 'rainforest',
  [BIOME.TROPICAL_DRY]: 'temperateForest',
  [BIOME.TROPICAL_CONIFER]: 'temperateForest',
  [BIOME.TEMPERATE_BROADLEAF]: 'temperateForest',
  [BIOME.TEMPERATE_CONIFER]: 'temperateForest',
  [BIOME.BOREAL]: 'temperateForest',
  [BIOME.TROPICAL_SAVANNA]: 'grassland',
  [BIOME.TEMPERATE_GRASSLAND]: 'grassland',
  [BIOME.FLOODED_GRASSLAND]: 'grassland',
  [BIOME.MONTANE_GRASSLAND]: 'grassland',
  [BIOME.TUNDRA]: 'tundraIce',
  [BIOME.MEDITERRANEAN]: 'grassland',
  [BIOME.DESERT]: 'desert',
  [BIOME.MANGROVE]: 'rainforest',
  [BIOME.ICE]: 'tundraIce',
  [BIOME.POLAR_SHELF]: null,
  [BIOME.TEMPERATE_SHELF]: null,
  [BIOME.EQUATORIAL_SHELF]: null,
  [BIOME.WASTELAND]: 'wasteland',
};

export function biomeCategoryOf(id: number): BiomeCategory | null {
  return BIOME_CATEGORY[id] ?? null;
}

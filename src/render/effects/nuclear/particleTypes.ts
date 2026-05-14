// Particle-type data shape consumed by [BlastSystem.ts]. The renderer
// defines the schema; concrete particle templates (and all tuning values)
// live in the scenario layer at
// [../../../world/scenarios/handlers/NuclearScenario.config.ts].

export type ColourKeyframe = { interval: number; value: number };

export type ParticleTypeConfig = {
  readonly name: string;
  readonly enabled: boolean;
  readonly alpha: number;
  readonly lifeTime: { minLife: number; maxLife: number };
  readonly blend: number;
  readonly particleType: number;
  readonly minRadius: number;
  readonly maxRadius: number;
  readonly dynamicSize?: boolean;
  readonly growingOnly?: boolean;
  readonly vertical?: boolean;
  readonly radiusMod?: number;
  readonly sizeMod: number;
  readonly count: number;
  readonly radiusModifier: number;
  readonly minHeight?: number;
  readonly maxHeight?: number;
  readonly minSize?: number;
  readonly maxSize?: number;
  readonly startColour: number;
  readonly endColour: number;
  readonly intervals: readonly number[];
  readonly maxValues: {
    readonly alpha: number;
    readonly speed: number;
    readonly size: number;
    readonly height?: number;
  };
  readonly spleens: {
    readonly alpha: readonly number[];
    readonly speed: readonly number[];
    readonly size: readonly number[];
    readonly height?: readonly number[];
    readonly colour: readonly ColourKeyframe[];
  };
};

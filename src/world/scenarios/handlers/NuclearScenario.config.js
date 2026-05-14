/**
 * NuclearScenario.config — all tunables for the nuclear scenario, in one
 * place. The handler ([NuclearScenario.ts]) reads from this for wasteland
 * geometry, the renderer ([../../render/effects/nuclear/NuclearExplosion.ts])
 * receives it as its `profile`, and the debug panel ([../../debug/Tweakpane.ts])
 * sources its initial state from `DEFAULT_NUCLEAR_CONFIG` so editing values
 * here flips the live default with no other touch-points.
 *
 * Tuning categories:
 *   - `particleTypes` — per-particle-type templates (counts, lifespans,
 *     colour ramps, spline shapes). These were lifted out of the renderer's
 *     `particleTypes.ts` so the scenario fully owns "what the explosion
 *     looks like" while the renderer just consumes the data shape.
 *   - `live` — per-frame knobs pushed to the renderer via setLiveTuning
 *     each tick (worldScale, timeScale, sprite size, wind dynamics).
 *   - `detonate` — knobs sampled at the moment of detonation and used to
 *     override per-type defaults (sub-effect enables, mushroom height
 *     scale, fire/smoke colour starts and ends).
 *   - `wasteland` — geometry + lifetime of the downwind paint stamp.
 *   - `decayExponent` — shared recovery curve exponent.
 *   - `visuals` — static, build-time visual constants the renderer reads
 *     at particle creation (sprite-size base, wind reference height).
 */
// Source values stored as base-10 in the original demo bundle:
//   FIRE  0xA73A1E warm orange-red → 0x932601 dark red-brown
//   SMOKE 0x646464 medium grey     → 0xe4e1e1 near-white grey
//   DEBRIS 0xFF7420 bright orange  → 0xFFFFFF white
const FIRE_COLOURS = { start: 0xa73a1e, end: 0x932601 };
const SMOKE_COLOURS = { start: 0x646464, end: 0xe4e1e1 };
const DEBRIS_COLOURS = { start: 0xff7420, end: 0xffffff };
const NukeFire = {
    name: 'fire',
    enabled: true,
    alpha: 1,
    lifeTime: { minLife: 6, maxLife: 8 },
    blend: 0,
    particleType: 0,
    minRadius: 3.5,
    maxRadius: 5,
    dynamicSize: true,
    radiusMod: 0.2,
    sizeMod: 6,
    count: 2000,
    radiusModifier: 0.95,
    startColour: FIRE_COLOURS.start,
    endColour: FIRE_COLOURS.end,
    intervals: [0, 0.33, 0.66, 1],
    maxValues: { alpha: 1, speed: 1.5, size: 1.35 },
    spleens: {
        alpha: [0, 1, 1, 0],
        speed: [1, 0.66, 0.33, 0.06],
        size: [1, 0.3, 0.74, 0.148],
        colour: [
            { interval: 0, value: FIRE_COLOURS.start },
            { interval: 0.5, value: FIRE_COLOURS.end },
            { interval: 1, value: FIRE_COLOURS.end },
        ],
    },
};
const NukeSmoke = {
    name: 'smoke',
    enabled: true,
    alpha: 1,
    lifeTime: { minLife: 11, maxLife: 15 },
    blend: 1,
    particleType: 1,
    minRadius: 1.3,
    maxRadius: 3.44,
    dynamicSize: true,
    radiusMod: 0.2,
    sizeMod: 1.2,
    count: 3000,
    radiusModifier: 1.3,
    growingOnly: true,
    startColour: SMOKE_COLOURS.start,
    endColour: SMOKE_COLOURS.end,
    intervals: [0, 0.33, 0.66, 1],
    maxValues: { alpha: 1, speed: 2, size: 8 },
    spleens: {
        alpha: [0, 1, 1, 0],
        speed: [0.95, 1, 0.125, 0],
        size: [0.0375, 0.56, 0.78, 1],
        colour: [
            { interval: 0, value: SMOKE_COLOURS.start },
            { interval: 0.5, value: SMOKE_COLOURS.end },
            { interval: 1, value: SMOKE_COLOURS.end },
        ],
    },
};
const NukeMushroom = {
    name: 'mushroom',
    enabled: true,
    alpha: 1,
    lifeTime: { minLife: 10, maxLife: 14 },
    blend: 1,
    particleType: 3,
    minRadius: 1.21,
    maxRadius: 1.36,
    radiusMod: 1,
    sizeMod: 1,
    count: 500,
    radiusModifier: 1,
    minHeight: -2.5,
    maxHeight: 2,
    growingOnly: true,
    startColour: SMOKE_COLOURS.start,
    endColour: SMOKE_COLOURS.end,
    intervals: [0, 0.33, 0.66, 1],
    maxValues: { alpha: 1, speed: 2, size: 11, height: 16 },
    spleens: {
        alpha: [0, 0.5, 1, 0],
        speed: [0.55, 1, 0.08, 0],
        size: [0.2, 0.4, 0.85, 1],
        height: [0, 0.3, 0.65, 1],
        colour: [
            { interval: 0, value: SMOKE_COLOURS.start },
            { interval: 0.6, value: SMOKE_COLOURS.end },
            { interval: 1, value: SMOKE_COLOURS.end },
        ],
    },
};
const NukeMushroomFire = {
    name: 'mushroomFire',
    enabled: true,
    alpha: 1,
    lifeTime: { minLife: 5, maxLife: 6 },
    blend: 0,
    particleType: 4,
    minRadius: 0.8,
    maxRadius: 1.75,
    dynamicSize: true,
    radiusMod: 1,
    sizeMod: 2,
    count: 400,
    radiusModifier: 0.5,
    minHeight: -2,
    maxHeight: 2,
    startColour: FIRE_COLOURS.start,
    endColour: FIRE_COLOURS.end,
    intervals: [0, 0.33, 0.66, 1],
    maxValues: { alpha: 1, speed: 2, size: 5, height: 7 },
    spleens: {
        alpha: [0, 1, 1, 0],
        speed: [0.55, 1, 0.08, 0],
        size: [0.3, 0.4, 0.7, 1],
        height: [0.0714, 0.38, 0.689, 1],
        colour: [
            { interval: 0, value: FIRE_COLOURS.start },
            { interval: 0.5, value: FIRE_COLOURS.end },
            { interval: 1, value: FIRE_COLOURS.end },
        ],
    },
};
const NukeColumnFire = {
    name: 'columnFire',
    enabled: true,
    alpha: 1,
    lifeTime: { minLife: 6, maxLife: 8.5 },
    blend: 0,
    particleType: 5,
    minRadius: 2,
    maxRadius: 4,
    dynamicSize: true,
    radiusMod: 0.2,
    sizeMod: 3,
    count: 250,
    radiusModifier: 2.5,
    minHeight: -5,
    maxHeight: 1,
    vertical: true,
    startColour: FIRE_COLOURS.start,
    endColour: FIRE_COLOURS.end,
    intervals: [0, 0.33, 0.66, 1],
    maxValues: { alpha: 1, speed: 2, size: 3, height: 5 },
    spleens: {
        alpha: [0, 1, 1, 0],
        speed: [0.55, 1, 0.08, 0],
        size: [0, 0.85, 1, 1],
        height: [0, 0.33, 0.66, 1],
        colour: [
            { interval: 0, value: FIRE_COLOURS.start },
            { interval: 0.5, value: FIRE_COLOURS.end },
            { interval: 1, value: FIRE_COLOURS.end },
        ],
    },
};
const NukeColumnSmoke = {
    name: 'columnSmoke',
    enabled: true,
    alpha: 1,
    lifeTime: { minLife: 11, maxLife: 15 },
    blend: 1,
    particleType: 6,
    minRadius: 0.42,
    maxRadius: 0.8,
    dynamicSize: true,
    radiusMod: 0.2,
    sizeMod: 3,
    count: 50,
    radiusModifier: 0.335,
    minHeight: -5,
    maxHeight: 1,
    vertical: true,
    startColour: SMOKE_COLOURS.start,
    endColour: SMOKE_COLOURS.end,
    intervals: [0, 0.33, 0.66, 1],
    maxValues: { alpha: 1, speed: 2, size: 3, height: 10 },
    spleens: {
        alpha: [0, 1, 1, 0],
        speed: [0.55, 1, 0.08, 0],
        size: [0, 0.85, 1, 1],
        height: [0, 0.33, 0.66, 1],
        colour: [
            { interval: 0, value: SMOKE_COLOURS.start },
            { interval: 0.5, value: SMOKE_COLOURS.end },
            { interval: 1, value: SMOKE_COLOURS.end },
        ],
    },
};
const NukeDebris = {
    name: 'debris',
    enabled: true,
    alpha: 1,
    lifeTime: { minLife: 2, maxLife: 3 },
    blend: 1,
    particleType: 2,
    minRadius: 1,
    maxRadius: 3,
    dynamicSize: false,
    sizeMod: 0.1,
    count: 500,
    minHeight: -1,
    maxHeight: 1,
    radiusModifier: 1,
    minSize: 0,
    maxSize: 3,
    startColour: DEBRIS_COLOURS.start,
    endColour: DEBRIS_COLOURS.end,
    intervals: [0, 0.33, 0.66, 1],
    maxValues: { alpha: 1, speed: 9, size: 1, height: 1.05 },
    spleens: {
        alpha: [0, 1, 1, 0],
        speed: [1, 0.444, 0.166, 0.033],
        size: [1, 0.832, 0.66, 0.5],
        height: [0, 0.65, 1, 0],
        colour: [
            { interval: 0, value: DEBRIS_COLOURS.start },
            { interval: 0.5, value: DEBRIS_COLOURS.end },
            { interval: 1, value: DEBRIS_COLOURS.end },
        ],
    },
};
export const NUCLEAR_PARTICLE_TYPES = [
    NukeFire,
    NukeSmoke,
    NukeMushroom,
    NukeMushroomFire,
    NukeColumnFire,
    NukeColumnSmoke,
    NukeDebris,
];
export const DEFAULT_NUCLEAR_CONFIG = {
    particleTypes: NUCLEAR_PARTICLE_TYPES,
    live: {
        worldScale: 0.003,
        timeScale: 1.3,
        spriteScale: 4.0,
        windStrength: 2.0,
        windDelay: 1.4,
        windRamp: 8.0,
        windJitter: 1.0,
        windDrag: 1.0,
    },
    detonate: {
        enables: {
            fire: true,
            smoke: true,
            mushroom: true,
            mushroomFire: true,
            columnFire: true,
            columnSmoke: true,
            debris: true,
        },
        mushroomHeightScale: 1.0,
        columnHeightScale: 1.0,
        fireColorStart: FIRE_COLOURS.start,
        fireColorEnd: FIRE_COLOURS.end,
        smokeColorStart: SMOKE_COLOURS.start,
        smokeColorEnd: SMOKE_COLOURS.end,
    },
    wasteland: {
        radiusKm: 450,
        stretchKm: 1200,
        durationDays: 24,
    },
    decayExponent: 2.5,
    visuals: {
        spriteSizeScale: 6 / 14,
        windRefHeight: 16,
    },
};
/**
 * Format a 24-bit colour number as a CSS hex string. Tweakpane stores
 * colour pickers as `'#rrggbb'` strings; the config stores them as raw
 * numbers (matching the demo's source format and Three.Color.getHex()).
 * Use this when populating Tweakpane state from the config defaults.
 */
export function hexNumberToCss(n) {
    return '#' + (n & 0xffffff).toString(16).padStart(6, '0');
}

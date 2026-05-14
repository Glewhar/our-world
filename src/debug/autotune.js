/**
 * GPU auto-tune: probe rendering during loading, classify the system into a
 * tier, and disable expensive visual layers on weaker hardware before the
 * UI initializes.
 *
 * Run between `sceneGraph.attachWorld()` and `createDebugPanel()` in main.ts —
 * the scene is fully wired, the loading overlay still covers the canvas, and
 * Tweakpane / the floating toggle bar haven't bound to state yet, so mutating
 * `initialDebugState.layers.*` here is reflected by the UI on first render.
 *
 * The probe runs a synchronous loop with `gl.finish()` after each frame to
 * force GPU completion before timing — RAF would be vsync-locked at 16.67ms
 * on a 60Hz display and couldn't distinguish a 2ms GPU from a 14ms one.
 *
 * Ordering, per user intent (visual decluttering first, not raw cost):
 *   Medium    → clouds off               (~2-4ms saved)
 *   Low       → clouds + planes off      (planes ~0.1ms — cosmetic, not perf)
 *   Very low  → clouds + planes + atmo   (atmo ~0.5-1ms)
 * Ocean and highways stay on at every tier.
 */
export var Tier;
(function (Tier) {
    Tier[Tier["High"] = 0] = "High";
    Tier[Tier["Medium"] = 1] = "Medium";
    Tier[Tier["Low"] = 2] = "Low";
    Tier[Tier["VeryLow"] = 3] = "VeryLow";
})(Tier || (Tier = {}));
export const TIER_THRESHOLDS_MS = {
    high: 5,
    medium: 12,
    low: 22,
};
const WARMUP_FRAMES = 20;
const SAMPLE_FRAMES = 60;
const YIELD_EVERY = 10;
const MAX_WALL_TIME_MS = 1500;
function classify(avgFrameMs) {
    if (avgFrameMs < TIER_THRESHOLDS_MS.high)
        return Tier.High;
    if (avgFrameMs < TIER_THRESHOLDS_MS.medium)
        return Tier.Medium;
    if (avgFrameMs < TIER_THRESHOLDS_MS.low)
        return Tier.Low;
    return Tier.VeryLow;
}
function trimmedMean(samples) {
    if (samples.length === 0)
        return Infinity;
    const sorted = [...samples].sort((a, b) => a - b);
    const trim = Math.floor(sorted.length * 0.1);
    const kept = sorted.slice(trim, sorted.length - trim);
    if (kept.length === 0)
        return sorted[Math.floor(sorted.length / 2)] ?? Infinity;
    let sum = 0;
    for (const v of kept)
        sum += v;
    return sum / kept.length;
}
export async function runGpuProbe(renderer, _sceneGraph, probeState) {
    const gl = renderer.renderer.getContext();
    const probeStart = performance.now();
    const samples = [];
    const total = WARMUP_FRAMES + SAMPLE_FRAMES;
    let frames = 0;
    let partial = false;
    for (let i = 0; i < total; i++) {
        if (performance.now() - probeStart > MAX_WALL_TIME_MS) {
            partial = true;
            break;
        }
        const t0 = performance.now();
        renderer.tick(0.016, probeState);
        // Force GPU completion so the elapsed measures real work, not just
        // command buffer submission. Blocks the main thread until the GPU is
        // idle — fine here because the loading overlay covers the canvas.
        gl.finish();
        const t1 = performance.now();
        if (i >= WARMUP_FRAMES)
            samples.push(t1 - t0);
        frames = i + 1;
        if (i % YIELD_EVERY === YIELD_EVERY - 1) {
            // eslint-disable-next-line no-await-in-loop
            await new Promise((r) => setTimeout(r, 0));
        }
    }
    let avgFrameMs;
    if (samples.length >= 5) {
        avgFrameMs = trimmedMean(samples);
    }
    else {
        // Wall-time cap killed the probe before enough samples landed. Fall
        // back to overall elapsed / frames-attempted — over-classifies slightly
        // because warmup is included, which is fine for tier decisions.
        const elapsed = performance.now() - probeStart;
        avgFrameMs = elapsed / Math.max(1, frames);
    }
    return {
        tier: classify(avgFrameMs),
        avgFrameMs,
        samples: samples.length,
        partial,
    };
}
export function applyTier(state, tier) {
    switch (tier) {
        case Tier.High:
            break;
        case Tier.Medium:
            state.layers.clouds = false;
            break;
        case Tier.Low:
            state.layers.clouds = false;
            // Floating toggle bar treats planes+trails as one switch — keep them
            // in lockstep so the combined "Planes" toggle reflects reality.
            state.layers.planes = false;
            state.layers.trails = false;
            break;
        case Tier.VeryLow:
            state.layers.clouds = false;
            state.layers.planes = false;
            state.layers.trails = false;
            state.layers.atmosphere = false;
            break;
    }
}
export function tierName(tier) {
    return Tier[tier] ?? 'Unknown';
}

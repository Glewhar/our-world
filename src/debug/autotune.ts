/**
 * GPU auto-tune: probe rendering during loading, classify the system into a
 * tier, and adjust render cost on weaker hardware before the UI initializes.
 *
 * Run between `sceneGraph.attachWorld()` and `createDebugPanel()` in main.ts —
 * the scene is fully wired, the loading overlay still covers the canvas, and
 * Tweakpane / the floating toggle bar haven't bound to state yet, so mutating
 * `initialDebugState.layers.*` and `initialDebugState.renderScale` here is
 * reflected by the UI on first render.
 *
 * The probe runs a synchronous loop with `gl.finish()` after each frame to
 * force GPU completion before timing — RAF would be vsync-locked at 16.67ms
 * on a 60Hz display and couldn't distinguish a 2ms GPU from a 14ms one.
 *
 * Cascade behaviour (only clouds toggle automatically; atmosphere / planes /
 * trails / ocean / highways stay ON at every tier):
 *   High      (<5ms)    → clouds ON,  renderScale 1.00
 *   Medium    (5-12ms)  → clouds OFF, renderScale 1.00
 *   Low       (12-22ms) → clouds OFF, renderScale 0.75
 *   VeryLow   (>=22ms)  → clouds OFF, renderScale 0.50
 *
 * 4K pixel-budget guard — a weak iGPU on a 4K screen still reports DPR=1.0,
 * so the tier alone may not catch it. If the canvas pixel budget exceeds
 * 6M pixels AND tier is Medium or worse, clamp renderScale to <=0.7.
 */

import type { Renderer } from '../render/Renderer.js';
import type { SceneGraph } from '../render/scene-graph.js';
import type { DebugState } from './Tweakpane.js';

export enum Tier {
  High,
  Medium,
  Low,
  VeryLow,
}

export const TIER_THRESHOLDS_MS = {
  high: 5,
  medium: 12,
  low: 22,
} as const;

const WARMUP_FRAMES = 20;
const SAMPLE_FRAMES = 60;
const YIELD_EVERY = 10;
const MAX_WALL_TIME_MS = 1500;
const PIXEL_BUDGET_4K = 6_000_000;
const RENDER_SCALE_4K_CLAMP = 0.7;

type ProbeResult = {
  tier: Tier;
  avgFrameMs: number;
  samples: number;
  partial: boolean;
  renderScale: number;
};

function classify(avgFrameMs: number): Tier {
  if (avgFrameMs < TIER_THRESHOLDS_MS.high) return Tier.High;
  if (avgFrameMs < TIER_THRESHOLDS_MS.medium) return Tier.Medium;
  if (avgFrameMs < TIER_THRESHOLDS_MS.low) return Tier.Low;
  return Tier.VeryLow;
}

function trimmedMean(samples: number[]): number {
  if (samples.length === 0) return Infinity;
  const sorted = [...samples].sort((a, b) => a - b);
  const trim = Math.floor(sorted.length * 0.1);
  const kept = sorted.slice(trim, sorted.length - trim);
  if (kept.length === 0) return sorted[Math.floor(sorted.length / 2)] ?? Infinity;
  let sum = 0;
  for (const v of kept) sum += v;
  return sum / kept.length;
}

function pickRenderScale(tier: Tier): number {
  switch (tier) {
    case Tier.High:    return 1.0;
    case Tier.Medium:  return 1.0;
    case Tier.Low:     return 0.75;
    case Tier.VeryLow: return 0.5;
  }
}

function pixelBudgetGuard(scale: number, tier: Tier): number {
  if (tier === Tier.High) return scale;
  const pixels =
    window.innerWidth * window.innerHeight * Math.min(window.devicePixelRatio, 2);
  if (pixels > PIXEL_BUDGET_4K) return Math.min(scale, RENDER_SCALE_4K_CLAMP);
  return scale;
}

export async function runGpuProbe(
  renderer: Renderer,
  _sceneGraph: SceneGraph,
  probeState: DebugState,
): Promise<ProbeResult> {
  const gl = renderer.renderer.getContext();
  const probeStart = performance.now();
  const samples: number[] = [];
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
    if (i >= WARMUP_FRAMES) samples.push(t1 - t0);
    frames = i + 1;
    if (i % YIELD_EVERY === YIELD_EVERY - 1) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise<void>((r) => setTimeout(r, 0));
    }
  }

  let avgFrameMs: number;
  if (samples.length >= 5) {
    avgFrameMs = trimmedMean(samples);
  } else {
    // Wall-time cap killed the probe before enough samples landed. Fall
    // back to overall elapsed / frames-attempted — over-classifies slightly
    // because warmup is included, which is fine for tier decisions.
    const elapsed = performance.now() - probeStart;
    avgFrameMs = elapsed / Math.max(1, frames);
  }

  const tier = classify(avgFrameMs);
  const renderScale = pixelBudgetGuard(pickRenderScale(tier), tier);

  return {
    tier,
    avgFrameMs,
    samples: samples.length,
    partial,
    renderScale,
  };
}

export function applyTier(state: DebugState, tier: Tier): void {
  // Only clouds is auto-toggled. Atmosphere / planes / trails / ocean /
  // highways stay on at every tier — render-scale absorbs the rest of the
  // cost on weaker hardware.
  switch (tier) {
    case Tier.High:
      state.renderScale = 1.0;
      break;
    case Tier.Medium:
      state.layers.clouds = false;
      state.renderScale = 1.0;
      break;
    case Tier.Low:
      state.layers.clouds = false;
      state.renderScale = 0.75;
      break;
    case Tier.VeryLow:
      state.layers.clouds = false;
      state.renderScale = 0.5;
      break;
  }
  state.renderScale = pixelBudgetGuard(state.renderScale, tier);
}

export function tierName(tier: Tier): string {
  return Tier[tier] ?? 'Unknown';
}

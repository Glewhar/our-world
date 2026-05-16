/**
 * Thin owner of the WebGLRenderer + resize handling.
 *
 * Scene/camera/picking/material/postfx live in `scene-graph.ts`. Renderer
 * just runs the per-frame update + render delegation and keeps the canvas
 * sized to its host. The PostFXChain that owns the EffectComposer is
 * created inside `sceneGraph.attachRenderer(this.renderer)`.
 */

import * as THREE from 'three';

import type { SceneGraph } from './scene-graph.js';
import type { DebugState } from '../debug/Tweakpane.js';

export class Renderer {
  readonly canvas: HTMLCanvasElement;
  readonly renderer: THREE.WebGLRenderer;
  private resizeObserver: ResizeObserver | null = null;
  private renderScale = 1.0;

  // Context-loss subscribers. main.ts wires these after constructing the
  // Renderer so the sim can be frozen + the loading overlay re-shown when
  // the GPU driver yanks the WebGL context (Win+L, TDR, OOM, etc.).
  onContextLost: (() => void) | null = null;
  onContextRestored: (() => void) | null = null;

  constructor(
    private readonly host: HTMLElement,
    private readonly sceneGraph: SceneGraph,
  ) {
    this.canvas = document.createElement('canvas');
    host.appendChild(this.canvas);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    // Apply default render scale (1.0). main.ts re-calls setRenderScale
    // with the auto-tuned value once the GPU probe lands.
    this.setRenderScale(1.0);

    // preventDefault on `webglcontextlost` is what asks the browser to fire
    // `webglcontextrestored` once the driver recovers. Without it the canvas
    // stays dead forever and Three.js silently swallows every subsequent
    // draw call — what looked like a freeze in earlier sessions.
    this.canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.onContextLost?.();
    });
    this.canvas.addEventListener('webglcontextrestored', () => {
      this.onContextRestored?.();
    });

    // Hand the WebGLRenderer to the scene graph so it can construct the
    // PostFXChain (EffectComposer + RenderPass at M0; passes attach in
    // later milestones).
    this.sceneGraph.attachRenderer(this.renderer);

    this.handleResize();
  }

  tick(deltaSec: number, debug: DebugState): void {
    this.sceneGraph.update(deltaSec, debug);
    this.sceneGraph.render(deltaSec);
  }

  /**
   * Set the sub-canvas render-resolution multiplier. 1.0 = native (clamped
   * DPR); 0.5 = half-resolution upscale. The CSS canvas size is unchanged;
   * the backing-store resolution drops, so fewer fragments are coloured.
   */
  setRenderScale(scale: number): void {
    const clamped = Math.max(0.25, Math.min(2.0, scale));
    this.renderScale = clamped;
    const dpr = Math.min(window.devicePixelRatio, 2) * clamped;
    this.renderer.setPixelRatio(dpr);
    const w = this.host.clientWidth || window.innerWidth;
    const h = this.host.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.sceneGraph.resize(w, h);
  }

  getRenderScale(): number {
    return this.renderScale;
  }

  dispose(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.renderer.dispose();
    this.canvas.remove();
  }

  private handleResize(): void {
    const apply = () => {
      const w = this.host.clientWidth || window.innerWidth;
      const h = this.host.clientHeight || window.innerHeight;
      this.renderer.setSize(w, h, false);
      this.sceneGraph.resize(w, h);
    };
    apply();
    this.resizeObserver = new ResizeObserver(apply);
    this.resizeObserver.observe(this.host);
  }
}

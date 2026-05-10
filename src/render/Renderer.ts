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

  constructor(
    private readonly host: HTMLElement,
    private readonly sceneGraph: SceneGraph,
  ) {
    this.canvas = document.createElement('canvas');
    host.appendChild(this.canvas);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

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

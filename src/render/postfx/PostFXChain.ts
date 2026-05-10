/**
 * Postprocessing chain — owns the EffectComposer and per-pass attach/detach.
 *
 * The composer is built lazily: when no extra passes are attached the scene
 * graph bypasses it entirely (`hasExtraPasses() === false`) and renders
 * straight to the canvas, picking up the WebGLRenderer's free MSAA. The
 * Mali tile-MSAA fast path is active in that mode; only when an extra pass
 * needs an offscreen target do we pay for the composer's render target.
 *
 * The offscreen target itself is plain RGBA8, samples=0 — when extra
 * passes ship later we can opt back into MSAA / HDR per-pass instead of
 * paying for both unconditionally.
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import type { Pass } from 'three/examples/jsm/postprocessing/Pass.js';

export class PostFXChain {
  readonly composer: EffectComposer;
  private readonly renderPass: RenderPass;
  private extraPasses: Pass[] = [];

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
  ) {
    const size = renderer.getSize(new THREE.Vector2());
    const pixelRatio = renderer.getPixelRatio();
    const target = new THREE.WebGLRenderTarget(
      Math.max(1, Math.floor(size.x * pixelRatio)),
      Math.max(1, Math.floor(size.y * pixelRatio)),
      { samples: 0, type: THREE.UnsignedByteType },
    );
    this.composer = new EffectComposer(renderer, target);
    this.composer.setPixelRatio(renderer.getPixelRatio());
    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);
  }

  /**
   * True if any pass beyond the baseline RenderPass is attached. The scene
   * graph uses this to bypass the composer (and its offscreen target) when
   * nothing extra is queued — direct-to-canvas with the WebGLRenderer's
   * built-in MSAA is faster and gives free silhouette AA.
   */
  hasExtraPasses(): boolean {
    return this.extraPasses.length > 0;
  }

  /**
   * Update the scene + camera the RenderPass draws (e.g. when the sandbox
   * combo box swaps to an isolated scene).
   */
  setSceneCamera(scene: THREE.Scene, camera: THREE.Camera): void {
    this.renderPass.scene = scene;
    this.renderPass.camera = camera;
  }

  /**
   * Attach a pass after the RenderPass and any previously-attached passes.
   * Order of `addPass` calls matches the composer's draw order; callers that
   * need fine control over insertion can use `insertPass` instead.
   */
  addPass(pass: Pass): void {
    this.composer.addPass(pass);
    this.extraPasses.push(pass);
  }

  /** Insert a pass at the given index (0 = before RenderPass). */
  insertPass(pass: Pass, index: number): void {
    this.composer.insertPass(pass, index);
    this.extraPasses.push(pass);
  }

  setSize(width: number, height: number): void {
    this.composer.setSize(width, height);
  }

  /**
   * Per-frame render entry. `deltaSec` is forwarded to passes that opt in
   * (e.g. animated cloud advection) via the composer's internal `EffectComposer.render(delta)`
   * which propagates to passes implementing `Pass.render(renderer, ..., deltaTime)`.
   */
  render(deltaSec: number): void {
    this.composer.render(deltaSec);
  }

  dispose(): void {
    for (const pass of this.extraPasses) {
      const disposable = pass as Pass & { dispose?: () => void };
      disposable.dispose?.();
    }
    this.extraPasses = [];
    this.composer.dispose();
  }
}

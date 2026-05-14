/**
 * Cheap screen-space anti-aliasing pass.
 *
 * Replaces the WebGLRenderer's built-in MSAA, which costs an MSAA resolve
 * every frame and disables Mali's tile-MSAA fast path. FXAA is a single
 * fullscreen fragment pass — bandwidth-light, ALU-light, and runs after
 * the scene is composited so it sees the final image including atmosphere,
 * clouds, and PostFX. Edge quality is softer than 4× MSAA on hard
 * silhouettes but visually close on the styled palette this scene uses.
 *
 * Shader: Timothy Lottes' FXAA 3.11 (reduced quality preset PC quality 12,
 * matches the Three.js examples FXAAShader byte-for-byte semantics).
 */

import * as THREE from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

const FXAA_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FXAA_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tDiffuse;
uniform vec2 resolution; // 1.0 / screen size in pixels
varying vec2 vUv;

#define FXAA_REDUCE_MIN (1.0/128.0)
#define FXAA_REDUCE_MUL (1.0/8.0)
#define FXAA_SPAN_MAX   8.0

void main() {
  vec2 inv = resolution;
  vec3 rgbNW = texture2D(tDiffuse, vUv + vec2(-1.0, -1.0) * inv).rgb;
  vec3 rgbNE = texture2D(tDiffuse, vUv + vec2( 1.0, -1.0) * inv).rgb;
  vec3 rgbSW = texture2D(tDiffuse, vUv + vec2(-1.0,  1.0) * inv).rgb;
  vec3 rgbSE = texture2D(tDiffuse, vUv + vec2( 1.0,  1.0) * inv).rgb;
  vec4 texColor = texture2D(tDiffuse, vUv);
  vec3 rgbM = texColor.rgb;

  vec3 luma = vec3(0.299, 0.587, 0.114);
  float lumaNW = dot(rgbNW, luma);
  float lumaNE = dot(rgbNE, luma);
  float lumaSW = dot(rgbSW, luma);
  float lumaSE = dot(rgbSE, luma);
  float lumaM  = dot(rgbM,  luma);

  float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
  float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));

  vec2 dir;
  dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));
  dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));

  float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) * 0.25 * FXAA_REDUCE_MUL,
                        FXAA_REDUCE_MIN);
  float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);
  dir = min(vec2(FXAA_SPAN_MAX, FXAA_SPAN_MAX),
            max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX), dir * rcpDirMin)) * inv;

  vec3 rgbA = 0.5 * (
    texture2D(tDiffuse, vUv + dir * (1.0/3.0 - 0.5)).rgb +
    texture2D(tDiffuse, vUv + dir * (2.0/3.0 - 0.5)).rgb);
  vec3 rgbB = rgbA * 0.5 + 0.25 * (
    texture2D(tDiffuse, vUv + dir * -0.5).rgb +
    texture2D(tDiffuse, vUv + dir *  0.5).rgb);

  float lumaB = dot(rgbB, luma);
  if ((lumaB < lumaMin) || (lumaB > lumaMax)) {
    gl_FragColor = vec4(rgbA, texColor.a);
  } else {
    gl_FragColor = vec4(rgbB, texColor.a);
  }
}
`;

export class FxaaPass extends ShaderPass {
  constructor() {
    super({
      uniforms: {
        tDiffuse: { value: null },
        resolution: { value: new THREE.Vector2(1 / 1280, 1 / 720) },
      },
      vertexShader: FXAA_VERT,
      fragmentShader: FXAA_FRAG,
    });
  }

  override setSize(width: number, height: number): void {
    const u = (this.uniforms as { resolution: { value: THREE.Vector2 } }).resolution;
    u.value.set(1 / Math.max(1, width), 1 / Math.max(1, height));
  }
}

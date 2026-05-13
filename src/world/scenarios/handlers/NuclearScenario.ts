/**
 * NuclearScenario — first concrete scenario kind.
 *
 * Behaviour:
 *   onStart:
 *     1. Fire the existing particle blast at (lat, lon) via ctx.detonateAt.
 *     2. Sample wind once; convert (u, v) → bearing in degrees from north.
 *        Store back into the payload so the UI / future ticks can read it.
 *     3. Paint a downwind-elongated wasteland ellipse. The registry
 *        captures the resulting cells/values as the scenario's peak stamp.
 *   onTick:
 *     no-op — the registry's frame composer handles intensity scaling
 *     against the stamp + the shared decay curve.
 *   onEnd:
 *     no-op — the registry removes the stamp from its accumulator on the
 *     last frame so the wasteland texture redraws naturally.
 */

import type { Scenario, ScenarioContext, ScenarioKindHandler } from '../types.js';

export const NuclearScenario: ScenarioKindHandler<'nuclear'> = {
  onStart(scn: Scenario<'nuclear'>, ctx: ScenarioContext): void {
    const { latDeg, lonDeg, radiusKm, stretchKm } = scn.payload;

    // 1) Visual blast at the surface.
    ctx.detonateAt(latDeg, lonDeg);

    // 2) Sample wind once and freeze the bearing onto the payload.
    // Bearing convention: 0 = blowing toward north, 90 = east. `u` is
    // eastward, `v` is northward, so atan2(u, v) gives the angle clockwise
    // from north — exactly the convention the ellipse paint and UI use.
    const wind = ctx.sampleWindAt(latDeg, lonDeg);
    let bearingDeg = 0;
    if (wind && (wind.u !== 0 || wind.v !== 0)) {
      const rad = Math.atan2(wind.u, wind.v);
      bearingDeg = (rad * 180) / Math.PI;
      if (bearingDeg < 0) bearingDeg += 360;
    }
    scn.payload.windBearingDeg = bearingDeg;

    // 3) Paint the wasteland ellipse. The registry captures this as the
    // scenario's peak stamp via the paint hook on ctx.
    ctx.paintAttributeEllipse({
      attribute: 'wasteland',
      value: 1.0,
      centreLatDeg: latDeg,
      centreLonDeg: lonDeg,
      radiusKm,
      stretchKm,
      bearingDeg,
      falloff: 'smoothstep',
    });
  },

  onTick(_scn: Scenario<'nuclear'>, _progress01: number, _ctx: ScenarioContext): void {
    // No per-frame work for v1. Decay is owned by the registry's composer.
  },

  onEnd(_scn: Scenario<'nuclear'>, _ctx: ScenarioContext): void {
    // No teardown for v1. Stamp removal is handled by the registry.
  },
};

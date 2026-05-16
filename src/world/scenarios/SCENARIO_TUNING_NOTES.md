# Scenario Tuning Notes

Living document for the per-event mortality tuning that backs the Nuke
/ Heat / Ice sliders. Captures the *why* behind every constant in the
handlers + `impactBudget.ts` so a future pass (yours, mine, anyone's)
can re-tune without re-discovering the traps.

If you change any of the constants in this file, update the sample
tables below — they are the only thing that catches a regression
before a player does.

---

## How a kill ends up on the HUD

```
slider notch
  → scenario `payload` (strikeCount / maxTempDeltaC / …)
    → handler.computeImpactBudget(scn, deps)
      → tallyProjectionBiome (climate)  / tallyStrikeBlt (nukes)
        → budget.populationAtRisk + budget.citiesAtRisk
          → handler scales / floors the budget
            → registry multiplies by handler.intensity(progress01)
              → HUD bars
```

Two independent dials per scenario:

1. **Underlying tally**  — physics-shaped, walks polygons / cities /
   strike ellipses. Lives in `impactBudget.ts`. Same code feeds every
   scenario.
2. **Handler scale / floor** — slider-shaped, lives in the per-handler
   `computeImpactBudget`. Scales or floors the underlying tally so the
   slider notch the player picks corresponds to the body count they
   expect.

The tally is "what the simulation says happened." The scale is "how the
designer wants the slider to feel." Both are needed; neither is enough
on its own.

---

## The big trap: biome-projection score saturation

`projectBiome(baselineId, delta)` ranks every land biome by
`scoreNiche = 1 / (dT + dP + 1)` where `dT` and `dP` are
tolerance-normalised distances to each biome's niche centre.

**Failure mode:** at extreme `delta.tempC` (≥ +40 or ≤ −40), the
effective temperature blows past every land biome's tolerance. Every
`dT` becomes huge. The score landscape flattens, and the **wide-tolerance**
biomes win — not the **semantically correct** ones.

Concrete example, +50°C delta on a `TEMPERATE_BROADLEAF` polygon:

| target            | tempCenter | tempTol | score  |
|-------------------|-----------:|--------:|-------:|
| `DESERT`          | 25         | 3       | 0.057  |
| `MEDITERRANEAN`   | 16         | 4       | 0.071  |
| `TROPICAL_DRY`    | 25         | 4       | 0.095  |
| `TROPICAL_SAVANNA`| 24         | **6**   | **0.143** ← winner |
| `MANGROVE`        | 26         | 3       | 0.072  |

Savanna's tolerance of 6 beats desert's 3, so polygons project to
savanna instead of desert. **Any kill mechanic gated on
`proj.toId === DESERT` collapses to zero at slider max** — exactly when
the player expects total annihilation.

**Symmetric on the cold side.** At −50°C, `TROPICAL_MOIST` projects to
`BOREAL` (tolerance 5, precipCenter 500) rather than `ICE` (tolerance
8 but precipCenter 100, far from rainforest's 2200mm). The precip gap
swamps the temperature win.

### The fix pattern

Climate handlers add a **direct extinction floor** independent of biome
projection:

```ts
const intensity = Math.pow(absT / 50, 2.5);
const floor = intensity * deps.totals.population;
if (floor > budget.populationAtRisk) budget.populationAtRisk = floor;
```

The underlying tally still drives the low-end body count where the
score landscape behaves; the floor takes over at the top end where it
doesn't. Result: monotonic kill curve from 0 to 100% across the slider
range. Same shape applied to `citiesAtRisk` (using `deps.cities.length`)
because the city-kill loop in `tallyProjectionBiome` has the same
projection dependency.

**Power 2.5 is a feel knob.** Lower = more linear (kills ramp earlier);
higher = sharper top-end cliff. Re-tune by sampling at ±5 / ±15 / ±30
/ ±45 / ±50.

### Why we don't fix this in `projectBiome` itself

The brief's hard rule was "don't change what flips." Boosting `DESERT`
or `ICE` scores in the projection would change the *visual* biome paint
(more polygons turning desert/ice on screen), and the visual flip
distribution is hand-tuned. The floor lives in the kill-budget side
only; visuals are untouched.

---

## Per-scenario constants

### Nuclear War — `NuclearWarScenario.ts`

```ts
const WAR_CITIES_SCALE = 0.15;
function warPopulationScale(strikes: number): number {
  if (strikes > 50) return 1.0;
  return 0.45 - 0.0014 * (strikes - 1);
}
```

| strikes | scale  | predicted % pop killed |
|---------|--------|------------------------|
| 1       | 0.450  | ~2.6%                  |
| 5       | 0.444  | ~12%                   |
| 10      | 0.437  | ~35%                   |
| 25      | 0.416  | ~55%                   |
| 50      | 0.382  | ~83%                   |
| 51      | 1.000  | **100%**               |
| 120     | 1.000  | **100%**               |

- **`WAR_CITIES_SCALE = 0.15`** — kept flat so the HUD "cities lost"
  ticker pacing matches the on-screen ellipse-sweep pacing. If you
  raise it, the counter races ahead of the visuals.
- **`0.45 - 0.0014 × (strikes - 1)`** — slight per-strike decay across
  [1..50] so the first nukes hit harder per-strike than later ones
  (early strikes land on the densest cities; later strikes are
  redundant overlap). Tune the `0.45` start to shift the entire low-end
  curve up/down; tune the `0.0014` decay to flatten or steepen.
- **The 50→51 cliff is intentional.** Brief calls for "total
  annihilation above 50 strikes." Don't smooth it — the cliff IS the
  drama.

### Heat — `GlobalWarmingScenario.ts`

```ts
const intensity = Math.pow(absT / 50, 2.5);
const heatFloor = intensity * deps.totals.population;
const cityFloor = intensity * deps.cities.length;
```

| ΔT     | intensity | predicted % pop killed |
|--------|-----------|------------------------|
| +1°C   | 0.00009   | ~0.01%                 |
| +5°C   | 0.0032    | ~0.3%                  |
| +15°C  | 0.049     | ~5%                    |
| +30°C  | 0.279     | ~28%                   |
| +45°C  | 0.769     | ~77%                   |
| +50°C  | 1.000     | **100%**               |

- **Power 2.5** — pushes most of the kill into the upper half of the
  slider (matches the brief's "small bite at low, annihilation at
  high"). Drop to 2.0 for a more linear curve; bump to 3.0 for a
  steeper top-end.
- **The floor is `Math.max`-style** — it takes over only when the
  underlying biome-flip tally is smaller. At low ΔT the projection
  tally usually dominates (real DESERT flips on the equatorial belt
  produce visible body count); at high ΔT the floor dominates because
  the projection has saturated to TROPICAL_SAVANNA.
- **Two separate floors** (`populationAtRisk` and `citiesAtRisk`)
  because the biome-flip city-kill loop in `tallyProjectionBiome` has
  the same DESERT/ICE gate as the rural-kill side and collapses
  identically at high ΔT.

### Ice — `IceAgeScenario.ts`

Same shape, mirrored:

```ts
const intensity = Math.pow(absT / 50, 2.5);
const coldFloor = intensity * deps.totals.population;
const cityFloor = intensity * deps.cities.length;
```

Same sample table as heat, signs flipped on ΔT. Less critical at low
deltas (cold flips actually do reach ICE for many baselines because
ICE's tempCenter sits at the cold extreme), but at ≤ −40°C the same
saturation hits and the floor is needed.

---

## `impactBudget.ts` — the underlying climate tally

Function: `tallyProjectionBiome(delta, deps, budget)`. Walks every
polygon, projects it under the combined climate delta, accumulates
rural-pop kill on flips toward DESERT/ICE, and after the loop walks
cities once to crush the cities inside fully-flipped polygons.

Three knobs in the gate:

```ts
if (proj.weight >= 0.1 && (proj.toId === BIOME.DESERT || proj.toId === BIOME.ICE)) {
  budget.populationAtRisk += proj.weight * area * blt.popDensityKm2;
  if (proj.weight >= 0.4) {
    iceFlipPolyMask[i] = 1;  // city-kill loop reads this
  }
}
```

- **`weight ≥ 0.1`** (rural gate) — was 0.4 originally, dropped to 0.1
  to remove the dead-band. Now small temperature changes already bleed
  some rural deaths into the HUD instead of reading flat zero until
  the polygon crossed the 40% transformation threshold.
- **`proj.weight × area × popDensityKm2`** — was a fixed `0.5` rural
  fraction. Scaling on `proj.weight` makes 10% flips kill 10% and 100%
  flips kill 100%, smooth ramp in between.
- **`weight ≥ 0.4`** (city gate) — kept tight so cities only fully
  evacuate on heavy transformation. Cities are large investments;
  marginal climate change displaces farmers, not Tokyo.
- **`DESERT || ICE`** target gate — kept (originally ICE-only;
  extended to DESERT so heat can crush cities visually + on the HUD).
  This is the gate that fails at ±50°C — see "biome-projection score
  saturation" above.

The variable `iceFlipPolyMask` keeps its name even though it now
covers DESERT too. Renaming churns three files for no behaviour win.

---

## Verification recipe

When you tune a constant:

1. **Build**: `cd web && npm run build`. Type errors mean the change
   hit a downstream consumer.
2. **Empirical sample**:
   - Hard reset, pause sim.
   - Fire each scenario at `[1, 10, 25, 50, 51, 100, 120]` (Nuke) or
     `[±1, ±5, ±15, ±30, ±45, ±50]` (Heat / Ice).
   - Bump `totalDays = startDay + 0.55 × 15`, settle, record peak
     `populationLost`, `populationLostPct`, `citiesLost`, civ-min,
     radiation, ΔT, Δsea.
3. **Acceptance**:
   - Every notch produces a visibly different `populationLostPct`.
   - Slider max kills 100% (civilization bar = 0).
   - Nukes at strikeCount > 50 always kill 100%.
   - No `populationLost > totalPopulation` anywhere.
4. **Re-tune**: tweak the single constant, re-sample, update the
   sample tables in this file.

---

## Pitfalls for new scenario authors

If you add a scenario that uses biome projection for kill counting:

- **Don't gate kills on `proj.toId === SOMETHING_SPECIFIC`** — use a
  weight threshold, not a target identity, or you'll inherit the
  saturation bug.
- **If you must gate on a specific target**, add a magnitude-driven
  extinction floor in the handler so the slider stays monotonic at
  extreme deltas.
- **Two separate budget fields need two separate floors.** The city
  counter and population counter both drop independently when
  projection saturates; flooring one without the other gives a HUD
  that contradicts itself.
- **Visual destruction (`infrastructure_loss` paint) is independent
  of the budget tally.** They share the same projection helper
  (`cellsInProjectedFlipPolygons`) and inherit the same saturation —
  if the budget is wrong, the visual probably is too. Floor both.
- **Multiple `paintAttributeCells` calls in one `onStart` is fine** —
  the registry captures each as a separate stamp and composes them
  together. But early `return`s between paint passes will silently
  drop the later ones (cf. the flood-paint-then-desert-paint bug
  fixed during this pass).

/**
 * Scenario system — type contracts (C1, C2, C3 from the scenario plan).
 *
 * A Scenario is a time-bounded effect on the world that the user fires from
 * UI (e.g. the Explode button). The registry owns the active list; each
 * scenario kind has a handler that wires it to its render/sim side effects.
 *
 * Time domain: every duration is in `totalDays`, the canonical continuous
 * counter from `DebugState.timeOfDay`. 1 day = 1 unit, 1 year = 12 days, a
 * 2-year wasteland = 24 days. Pause and 4× speed are free — the registry
 * just reads totalDays each frame.
 */
export {};

import { describe, expect, it } from "vitest";
import {
  currentStep,
  demoElapsedMs,
  demoReducer,
  INITIAL_DEMO_STATE,
  MAX_TICK_MS,
  riderCanRespond,
  stepProgress,
  type DemoAction,
  type DemoState,
} from "./demo-machine";
import {
  DEMO_STEPS,
  NUMBERED_STEP_COUNT,
  RIDER_CHECK_COUNTDOWN_MS,
  RIDER_CHECK_INDEX,
  STEP_COUNT,
  STEP_OFFSETS,
  TOTAL_MS,
} from "./demo-script";

const run = (state: DemoState, ...actions: DemoAction[]) => actions.reduce(demoReducer, state);
const at = (step: number, elapsed = 0, status: DemoState["status"] = "playing"): DemoState => ({
  status,
  step,
  elapsed,
  riderOk: false,
});
/** Advance a playing demo by `ms` using realistic 50 ms ticks. */
function play(state: DemoState, ms: number): DemoState {
  let s = state;
  for (let left = ms; left > 0; left -= 50) s = demoReducer(s, { type: "tick", dt: Math.min(50, left) });
  return s;
}

describe("demo script", () => {
  it("has nine numbered steps plus a finale, totalling about 2:10", () => {
    expect(NUMBERED_STEP_COUNT).toBe(9);
    expect(STEP_COUNT).toBe(10);
    expect(DEMO_STEPS[STEP_COUNT - 1].layout).toBe("finale");
    expect(TOTAL_MS).toBeGreaterThanOrEqual(125_000);
    expect(TOTAL_MS).toBeLessThanOrEqual(140_000);
  });

  it("keeps the rider-check step long enough for the full countdown", () => {
    expect(DEMO_STEPS[RIDER_CHECK_INDEX].durationMs).toBeGreaterThan(RIDER_CHECK_COUNTDOWN_MS);
  });

  it("gives every step a unique id and a one-sentence caption", () => {
    expect(new Set(DEMO_STEPS.map((s) => s.id)).size).toBe(STEP_COUNT);
    for (const s of DEMO_STEPS) expect(s.caption.trim().split(/[.!?]\s/).length).toBe(1);
  });
});

describe("start / pause / resume", () => {
  it("starts from idle at step 1", () => {
    expect(run(INITIAL_DEMO_STATE, { type: "start" })).toEqual(at(0));
  });

  it("pauses and resumes without losing time", () => {
    const s = run(at(3, 1200), { type: "pause" });
    expect(s).toEqual(at(3, 1200, "paused"));
    expect(run(s, { type: "tick", dt: 100 })).toBe(s);
    expect(run(s, { type: "resume" })).toEqual(at(3, 1200));
  });

  it("toggle cycles idle → playing → paused → playing", () => {
    const a = run(INITIAL_DEMO_STATE, { type: "toggle" });
    expect(a.status).toBe("playing");
    const b = run(a, { type: "toggle" });
    expect(b.status).toBe("paused");
    expect(run(b, { type: "toggle" }).status).toBe("playing");
  });

  it("toggle and start replay from the beginning once finished", () => {
    const done = play(at(STEP_COUNT - 1), 60_000);
    expect(done.status).toBe("finished");
    expect(run(done, { type: "toggle" })).toEqual(at(0));
    expect(run(done, { type: "start" })).toEqual(at(0));
  });

  it("ignores pause when not playing", () => {
    expect(run(INITIAL_DEMO_STATE, { type: "pause" })).toBe(INITIAL_DEMO_STATE);
  });
});

describe("tick", () => {
  it("does nothing unless playing", () => {
    expect(run(INITIAL_DEMO_STATE, { type: "tick", dt: 100 })).toBe(INITIAL_DEMO_STATE);
    const paused = at(2, 10, "paused");
    expect(run(paused, { type: "tick", dt: 100 })).toBe(paused);
  });

  it("ignores negative and non-finite deltas", () => {
    const s = at(1, 500);
    expect(run(s, { type: "tick", dt: -10 })).toBe(s);
    expect(run(s, { type: "tick", dt: Number.NaN })).toBe(s);
    expect(run(s, { type: "tick", dt: Number.POSITIVE_INFINITY })).toBe(s);
  });

  it("caps a single tick so a throttled tab never skips a step", () => {
    expect(run(at(0), { type: "tick", dt: 60_000 })).toEqual(at(0, MAX_TICK_MS));
  });

  it("advances to the next step when a step's time elapses, carrying the overflow", () => {
    const d = DEMO_STEPS[0].durationMs;
    expect(run(at(0, d - 30), { type: "tick", dt: 50 })).toEqual(at(1, 20));
  });

  it("plays the whole script in TOTAL_MS and ends on the finale", () => {
    const almost = play(at(0), TOTAL_MS - 50);
    expect(almost.status).toBe("playing");
    expect(almost.step).toBe(STEP_COUNT - 1);
    const done = play(almost, 50);
    expect(done).toEqual({ status: "finished", step: STEP_COUNT - 1, elapsed: DEMO_STEPS[STEP_COUNT - 1].durationMs, riderOk: false });
    expect(demoElapsedMs(done)).toBe(TOTAL_MS);
  });
});

describe("navigation", () => {
  it("skip moves to the next step and keeps playing", () => {
    expect(run(at(2, 4000), { type: "skip" })).toEqual(at(3));
  });

  it("skip keeps a paused demo paused", () => {
    expect(run(at(2, 4000, "paused"), { type: "skip" })).toEqual(at(3, 0, "paused"));
  });

  it("skip from idle skips the intro to step 1; skip on the finale finishes", () => {
    expect(run(INITIAL_DEMO_STATE, { type: "skip" })).toEqual(at(0));
    expect(run(at(STEP_COUNT - 1, 100), { type: "skip" }).status).toBe("finished");
    const done = run(at(STEP_COUNT - 1, 100), { type: "skip" });
    expect(run(done, { type: "skip" })).toBe(done);
  });

  it("prev goes back one step and restarts step 1 at the start", () => {
    expect(run(at(4, 900), { type: "prev" })).toEqual(at(3));
    expect(run(at(0, 900), { type: "prev" })).toEqual(at(0));
    expect(run(INITIAL_DEMO_STATE, { type: "prev" })).toBe(INITIAL_DEMO_STATE);
  });

  it("prev from the finished state returns to the last numbered step", () => {
    const done = play(at(STEP_COUNT - 1), 60_000);
    expect(run(done, { type: "prev" })).toEqual(at(STEP_COUNT - 2));
  });

  it("jumpTo clamps the index and can force playback", () => {
    expect(run(at(1), { type: "jumpTo", index: 6 })).toEqual(at(6));
    expect(run(at(1), { type: "jumpTo", index: 99 })).toEqual(at(STEP_COUNT - 1));
    expect(run(at(1), { type: "jumpTo", index: -3 })).toEqual(at(0));
    expect(run(at(1), { type: "jumpTo", index: Number.NaN })).toEqual(at(1));
    expect(run(at(1, 0, "paused"), { type: "jumpTo", index: 4 })).toEqual(at(4, 0, "paused"));
    expect(run(at(1, 0, "paused"), { type: "jumpTo", index: 4, play: true })).toEqual(at(4));
    expect(run(INITIAL_DEMO_STATE, { type: "jumpTo", index: 8 })).toEqual(at(8));
  });

  it("reset returns to idle from anywhere", () => {
    expect(run(at(7, 3000, "paused"), { type: "reset" })).toBe(INITIAL_DEMO_STATE);
  });
});

describe("rider check", () => {
  const rc = (elapsed: number, status: DemoState["status"] = "playing") => at(RIDER_CHECK_INDEX, elapsed, status);

  it("I'M OKAY pauses on the step and cancels the alert", () => {
    const s = run(rc(3000), { type: "riderOk" });
    expect(s).toEqual({ ...rc(3000, "paused"), riderOk: true });
    expect(riderCanRespond(s)).toBe(false);
  });

  it("resuming after I'M OKAY continues to the emergency workflow step", () => {
    const s = run(rc(3000), { type: "riderOk" }, { type: "resume" });
    expect(s).toEqual(at(RIDER_CHECK_INDEX + 1));
    expect(currentStep(s).id).toBe("emergency");
  });

  it("replaying the countdown after I'M OKAY restarts the step and clears the flag", () => {
    const s = run(rc(3000), { type: "riderOk" }, { type: "jumpTo", index: RIDER_CHECK_INDEX, play: true });
    expect(s).toEqual(rc(0));
  });

  it("NEED HELP skips straight to the emergency workflow and plays", () => {
    expect(run(rc(1500, "paused"), { type: "needHelp" })).toEqual(at(RIDER_CHECK_INDEX + 1));
  });

  it("ignores rider responses on other steps or once the countdown expired", () => {
    const other = at(2, 1000);
    expect(run(other, { type: "riderOk" })).toBe(other);
    expect(run(other, { type: "needHelp" })).toBe(other);
    const expired = rc(RIDER_CHECK_COUNTDOWN_MS + 1);
    expect(run(expired, { type: "riderOk" })).toBe(expired);
    expect(run(expired, { type: "needHelp" })).toBe(expired);
    expect(run(INITIAL_DEMO_STATE, { type: "riderOk" })).toBe(INITIAL_DEMO_STATE);
  });

  it("without a response the countdown completes and the demo moves on", () => {
    const s = play(rc(0), DEMO_STEPS[RIDER_CHECK_INDEX].durationMs);
    expect(currentStep(s).id).toBe("emergency");
  });
});

describe("selectors", () => {
  it("reports global elapsed time", () => {
    expect(demoElapsedMs(INITIAL_DEMO_STATE)).toBe(0);
    expect(demoElapsedMs(at(3, 1500))).toBe(STEP_OFFSETS[3] + 1500);
  });

  it("reports per-step progress for the rail", () => {
    const s = at(2, DEMO_STEPS[2].durationMs / 2);
    expect(stepProgress(s, 1)).toBe(1);
    expect(stepProgress(s, 2)).toBeCloseTo(0.5);
    expect(stepProgress(s, 3)).toBe(0);
    expect(stepProgress(INITIAL_DEMO_STATE, 0)).toBe(0);
  });
});

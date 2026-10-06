import { describe, expect, it } from "vitest";
import { CRASH_ASSESSMENT, CRASH_PCT, DROP_ASSESSMENT, DROP_PCT, READY_READINESS, SIGNAL_COUNT } from "./demo-data";
import { INITIAL_DEMO_STATE } from "./demo-machine";
import { DEMO_STEPS, RIDER_CHECK_COUNTDOWN_MS, RIDER_CHECK_INDEX, stepIndexOf } from "./demo-script";
import {
  analysisFrame,
  announcement,
  blockedFrame,
  emergencyCompleted,
  failsafeStage,
  finaleFrame,
  frameDescription,
  HELMET_DROP_TIMING,
  readyFrame,
  reconFrame,
  revealCount,
  riderCheckFrame,
  SEVERE_CRASH_TIMING,
} from "./timeline";

const duration = (id: (typeof DEMO_STEPS)[number]["id"]) => DEMO_STEPS[stepIndexOf(id)].durationMs;

describe("engine results shown in jury mode", () => {
  it("uses the real engine: helmet drop 98 %, severe crash 96 %", () => {
    expect(DROP_ASSESSMENT.eventClass).toBe("HELMET_DROP");
    expect(DROP_PCT).toBe(98);
    expect(DROP_ASSESSMENT.emergency).toBe(false);
    expect(CRASH_ASSESSMENT.eventClass).toBe("SEVERE_CRASH");
    expect(CRASH_PCT).toBe(96);
    expect(CRASH_ASSESSMENT.emergency).toBe(true);
  });

  it("starts from a blocked pre-ride state and a ready one", () => {
    expect(READY_READINESS.state).toBe("ready");
  });
});

describe("revealCount", () => {
  it("reveals the first item at start and one per interval, capped", () => {
    expect(revealCount(999, 1000, 500, 3)).toBe(0);
    expect(revealCount(1000, 1000, 500, 3)).toBe(1);
    expect(revealCount(1499, 1000, 500, 3)).toBe(1);
    expect(revealCount(1500, 1000, 500, 3)).toBe(2);
    expect(revealCount(10_000, 1000, 500, 3)).toBe(3);
  });
});

describe("step frames are deterministic and finish inside their step", () => {
  it("step 1 shows both blockers and the blocked permission", () => {
    expect(blockedFrame(0)).toEqual({ blockersShown: 0, permissionShown: false });
    expect(blockedFrame(duration("precheck-blocked") - 1)).toEqual({ blockersShown: 2, permissionShown: true });
  });

  it("step 2 completes every pre-ride check before the step ends", () => {
    expect(readyFrame(0).checksDone).toBe(-1);
    expect(readyFrame(0).worn).toBe(false);
    const end = readyFrame(duration("system-ready") - 2000);
    expect(end.allPassed).toBe(true);
    expect(end.checksDone).toBe(READY_READINESS.checks.length);
  });

  it("helmet drop: impact after a calm lead-in, then signals one by one, then the verdict", () => {
    const start = analysisFrame(0, HELMET_DROP_TIMING);
    expect(start).toMatchObject({ phase: "stream", cursor: -4, impacted: false, signals: 0 });
    expect(analysisFrame(4000, HELMET_DROP_TIMING).impacted).toBe(true);
    const verifying = analysisFrame(HELMET_DROP_TIMING.verifyStartMs + 10, HELMET_DROP_TIMING);
    expect(verifying.phase).toBe("verify");
    expect(verifying.signals).toBe(1);
    const verdict = analysisFrame(HELMET_DROP_TIMING.verdictMs, HELMET_DROP_TIMING);
    expect(verdict).toMatchObject({ phase: "verdict", signals: SIGNAL_COUNT });
    expect(HELMET_DROP_TIMING.verdictMs).toBeLessThan(duration("helmet-drop") - 3000);
  });

  it("severe crash: replay slows down through the impact", () => {
    expect(analysisFrame(1000, SEVERE_CRASH_TIMING).rate).toBe(2);
    expect(analysisFrame(5000, SEVERE_CRASH_TIMING).rate).toBeCloseTo(0.75);
    expect(analysisFrame(5000, SEVERE_CRASH_TIMING).cursor).toBeCloseTo(-0.5);
    expect(analysisFrame(SEVERE_CRASH_TIMING.verdictMs, SEVERE_CRASH_TIMING).phase).toBe("verdict");
    expect(SEVERE_CRASH_TIMING.verdictMs).toBeLessThan(duration("severe-crash") - 3000);
  });

  it("all signals are revealed before the verdict appears", () => {
    for (const t of [HELMET_DROP_TIMING, SEVERE_CRASH_TIMING]) {
      expect(analysisFrame(t.verdictMs - 1, t).signals).toBe(SIGNAL_COUNT);
    }
  });

  it("rider check counts down 10 s then expires", () => {
    expect(riderCheckFrame(0)).toEqual({ remaining: 10, total: 10, expired: false });
    expect(riderCheckFrame(2500).remaining).toBe(7.5);
    expect(riderCheckFrame(RIDER_CHECK_COUNTDOWN_MS).expired).toBe(true);
    expect(riderCheckFrame(RIDER_CHECK_COUNTDOWN_MS + 5000).remaining).toBe(0);
  });

  it("emergency workflow and fail-safe complete with time to spare", () => {
    expect(emergencyCompleted(0)).toBe(0);
    expect(emergencyCompleted(duration("emergency") - 3000)).toBe(3);
    expect(failsafeStage(0)).toBe(0);
    expect(failsafeStage(duration("failsafe") - 5000)).toBe(3);
  });

  it("reconstruction walks through its sections and scrolls monotonically", () => {
    expect(reconFrame(0)).toEqual({ section: 0, scroll: 0 });
    expect(reconFrame(8000).section).toBe(1);
    expect(reconFrame(duration("reconstruction") - 1).section).toBe(2);
    expect(reconFrame(duration("reconstruction") - 1).scroll).toBe(1);
    let prev = -1;
    for (let ms = 0; ms <= duration("reconstruction"); ms += 250) {
      const { scroll } = reconFrame(ms);
      expect(scroll).toBeGreaterThanOrEqual(prev);
      prev = scroll;
    }
  });

  it("finale reveals the triad", () => {
    expect(finaleFrame(0)).toEqual({ tagline: false, words: 0, outro: false });
    expect(finaleFrame(duration("finale"))).toEqual({ tagline: true, words: 3, outro: true });
  });
});

describe("narration", () => {
  it("describes every step without throwing", () => {
    for (const s of DEMO_STEPS) {
      for (const ms of [0, s.durationMs / 2, s.durationMs]) expect(frameDescription(s.id, ms, false)).toMatch(/\w/);
    }
  });

  it("states verdicts with the engine confidence", () => {
    expect(frameDescription("helmet-drop", HELMET_DROP_TIMING.verdictMs, false)).toContain(`${DROP_PCT} percent`);
    expect(frameDescription("severe-crash", SEVERE_CRASH_TIMING.verdictMs, false)).toContain(`${CRASH_PCT} percent`);
  });

  it("labels emergency communication as simulated and announces pause / rider OK", () => {
    expect(frameDescription("emergency", 10_000, false)).toMatch(/^Simulation/);
    expect(announcement(INITIAL_DEMO_STATE)).toMatch(/Start Demo/);
    expect(announcement({ status: "paused", step: RIDER_CHECK_INDEX, elapsed: 2000, riderOk: true })).toBe(
      `Paused. Step ${RIDER_CHECK_INDEX + 1} of 9, Are you okay? Alert cancelled. Rider confirmed OK.`,
    );
  });

  it("keeps the text stable within a phase so screen readers are not flooded", () => {
    const texts = new Set<string>();
    for (let ms = 0; ms < RIDER_CHECK_COUNTDOWN_MS; ms += 100) texts.add(frameDescription("rider-check", ms, false));
    expect(texts.size).toBe(1);
  });
});

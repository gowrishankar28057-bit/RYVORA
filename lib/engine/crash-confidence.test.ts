import { describe, expect, it } from "vitest";
import { assessEvent, confidencePct } from "./crash-confidence";
import { SCENARIOS, SCENARIO_MAP, SEVERE_CRASH_NO_HELMET } from "../simulation/scenarios";

describe("crash confidence engine", () => {
  it.each(SCENARIOS.map((s) => [s.id, s] as const))("classifies %s as its expected class", (_, s) => {
    expect(assessEvent(s.input).eventClass).toBe(s.expected);
  });

  it("rejects a helmet drop as a false trigger (jury demo: 98 %)", () => {
    const a = assessEvent(SCENARIO_MAP["helmet-drop"].input);
    expect(a.eventClass).toBe("HELMET_DROP");
    expect(confidencePct(a)).toBe(98);
    expect(a.emergency).toBe(false);
  });

  it("verifies a severe crash and escalates (jury demo: 96 %)", () => {
    const a = assessEvent(SCENARIO_MAP["severe-crash"].input);
    expect(a.eventClass).toBe("SEVERE_CRASH");
    expect(confidencePct(a)).toBe(96);
    expect(a.emergency).toBe(true);
    expect(a.action).toBe("rider-check-escalate");
  });

  it("still escalates when the helmet is destroyed before its impact packet arrives", () => {
    const a = assessEvent(SEVERE_CRASH_NO_HELMET);
    expect(a.eventClass).toBe("SEVERE_CRASH");
    expect(a.coverage).toBeLessThan(1);
    expect(a.confidence).toBeLessThan(assessEvent(SCENARIO_MAP["severe-crash"].input).confidence);
    expect(a.emergency).toBe(true);
  });

  it("never escalates on non-crash scenarios", () => {
    for (const s of SCENARIOS.filter((x) => x.expected !== "SEVERE_CRASH")) {
      expect(assessEvent(s.input).emergency).toBe(false);
    }
  });

  it("a high helmet impact alone is not a crash", () => {
    const a = assessEvent({
      helmetImpactG: 60,
      helmetWorn: null,
      bikeSpeedKmh: 0,
      speedDropKmh: 0,
      bikeRotationDps: 0,
      phoneDecelG: 0.1,
      postImpactMotion: 0.5,
      helmetLinkLost: false,
    });
    expect(a.emergency).toBe(false);
  });

  it("returns a safe result when every signal is missing", () => {
    const a = assessEvent({
      helmetImpactG: null,
      helmetWorn: null,
      bikeSpeedKmh: null,
      speedDropKmh: null,
      bikeRotationDps: null,
      phoneDecelG: null,
      postImpactMotion: null,
      helmetLinkLost: null,
    });
    expect(a.coverage).toBe(0);
    expect(a.emergency).toBe(false);
    expect(Number.isFinite(a.confidence)).toBe(true);
  });
});

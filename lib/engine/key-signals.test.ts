import { describe, expect, it } from "vitest";
import { classificationLabel, keySignalRows, outcomeFor, signalCount, UNAVAILABLE, type KeySignalId } from "@/lib/engine/key-signals";
import { assessEvent, confidencePct } from "@/lib/engine/crash-confidence";
import { SCENARIOS, SCENARIO_MAP, SEVERE_CRASH_NO_HELMET } from "@/lib/simulation/scenarios";
import type { FusionInput } from "@/lib/types/events";

function valuesOf(input: FusionInput): Record<KeySignalId, string> {
  return Object.fromEntries(keySignalRows(assessEvent(input)).map((r) => [r.id, r.value])) as Record<KeySignalId, string>;
}

describe("key signals readout", () => {
  it("helmet drop: high impact, not worn, bike parked, no bike impact, no phone crash pattern → no emergency", () => {
    const a = assessEvent(SCENARIO_MAP["helmet-drop"].input);
    expect(valuesOf(SCENARIO_MAP["helmet-drop"].input)).toMatchObject({
      helmetImpact: "HIGH",
      helmetWorn: "NO",
      bikeSpeed: "0 km/h",
      bikeImpact: "NONE",
      phoneCrashPattern: "NONE",
    });
    expect(classificationLabel(a)).toBe("HELMET DROP");
    expect(confidencePct(a)).toBe(98);
    expect(outcomeFor(a)).toMatchObject({ tone: "success", title: "NO EMERGENCY TRIGGERED" });
  });

  it("severe crash: every device agrees → possible severe crash, critical", () => {
    const a = assessEvent(SCENARIO_MAP["severe-crash"].input);
    expect(valuesOf(SCENARIO_MAP["severe-crash"].input)).toEqual({
      helmetImpact: "HIGH",
      helmetWorn: "YES",
      bikeSpeed: "52 km/h",
      speedReduction: "YES",
      bikeImpact: "HIGH",
      phoneCrashPattern: "HIGH",
      postImpactMovement: "LOW",
    });
    expect(confidencePct(a)).toBe(96);
    expect(outcomeFor(a)).toMatchObject({ tone: "critical", title: "POSSIBLE SEVERE CRASH" });
  });

  it("only the severe crash escalates; every other scenario reports no emergency", () => {
    for (const s of SCENARIOS) {
      const o = outcomeFor(assessEvent(s.input));
      if (s.expected === "SEVERE_CRASH") expect(o.tone).toBe("critical");
      else expect(o.title).toBe("NO EMERGENCY TRIGGERED");
    }
  });

  it("marks a missing helmet packet as unavailable and still escalates", () => {
    const a = assessEvent(SEVERE_CRASH_NO_HELMET);
    const impact = keySignalRows(a).find((r) => r.id === "helmetImpact");
    expect(impact).toMatchObject({ available: false, value: UNAVAILABLE, tone: "warning" });
    expect(signalCount(a)).toEqual({ available: 7, total: 8 });
    expect(outcomeFor(a).tone).toBe("critical");
  });

  it("never throws when every signal is missing", () => {
    const empty: FusionInput = {
      helmetImpactG: null,
      helmetWorn: null,
      bikeSpeedKmh: null,
      speedDropKmh: null,
      bikeRotationDps: null,
      phoneDecelG: null,
      postImpactMotion: null,
      helmetLinkLost: null,
    };
    const a = assessEvent(empty);
    const rows = keySignalRows(a);
    expect(rows).toHaveLength(7);
    expect(rows.every((r) => !r.available && r.value === UNAVAILABLE)).toBe(true);
    expect(outcomeFor(a)).toMatchObject({ tone: "warning", title: "NO SENSOR DATA" });
  });

  it("keeps rows in the engine's reveal order", () => {
    const orders = keySignalRows(assessEvent(SCENARIO_MAP.normal.input)).map((r) => r.order);
    expect(orders).toEqual([...orders].sort((x, y) => x - y));
  });
});

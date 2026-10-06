import { describe, expect, it } from "vitest";
import {
  activeEntryIndex,
  buildIncident,
  buildIncidentPackage,
  buildMarkers,
  channelPeak,
  explanationSentence,
  EXPLANATION_DISCLAIMER,
  fmtDelta,
  fmtIst,
  lastAvailableT,
  layoutMarkers,
  tableRows,
} from "@/components/reconstruction/incident-model";
import { assessEvent } from "@/lib/engine/crash-confidence";
import { SCENARIO_MAP, SEVERE_CRASH_NO_HELMET } from "@/lib/simulation/scenarios";
import type { TelemetrySample } from "@/lib/types/telemetry";

const sample = (t: number, helmet: number | null): TelemetrySample => ({
  t,
  speedKmh: 10,
  helmetAccelG: helmet,
  bikeAccelG: 0.2,
  angularRateDps: 5,
  phoneAccelG: 0.1,
});

describe("incident model", () => {
  const incident = buildIncident();

  it("reconstructs the severe crash with helmet link loss at T+0.1 s", () => {
    expect(incident.assessment.eventClass).toBe("SEVERE_CRASH");
    expect(incident.helmetLinkLostT).toBeCloseTo(0.1, 5);
    expect(incident.sampleHz).toBe(10);
    expect(incident.window).toEqual({ from: -12, to: 10 });
    expect(incident.samples.at(-1)?.helmetAccelG).toBeNull();
    expect(incident.devices.find((d) => d.device === "helmet")?.status).toBe("Link lost at T + 0.1 s");
    expect(incident.devices.find((d) => d.device === "phone")?.status).toBe("30 s buffer retained");
  });

  it("places the four key markers with non-colliding label rows", () => {
    expect(incident.markers.map((m) => [m.label, m.t, m.side, m.row])).toEqual([
      ["Braking", -4, "left", 1],
      ["Rotation", -1.2, "left", 0],
      ["Impact", 0, "right", 0],
      ["Link lost", 0.1, "right", 1],
    ]);
    expect(buildMarkers([], null).map((m) => m.label)).toEqual(["Impact"]);
    expect(layoutMarkers([{ t: 2, label: "a", tone: "neutral" }])[0]).toMatchObject({ side: "right", row: 0 });
  });

  it("writes the spec explanation sentence for the severe crash", () => {
    expect(incident.explanation.summary).toBe(
      "Crash confidence increased because a helmet impact, rapid motorcycle deceleration, bike rotation and phone movement occurred within the same event window.",
    );
    expect(incident.explanation.disclaimer).toBe(EXPLANATION_DISCLAIMER);
  });

  it("drops the helmet phrase when the helmet impact packet is missing", () => {
    const s = explanationSentence(assessEvent(SEVERE_CRASH_NO_HELMET));
    expect(s).not.toContain("helmet impact");
    expect(s).toContain("bike rotation");
  });

  it("does not claim a crash for a normal ride", () => {
    expect(explanationSentence(assessEvent(SCENARIO_MAP.normal.input))).toBe(
      "No combination of strong crash signals occurred within the same event window.",
    );
  });

  it("detects trailing dropouts only", () => {
    expect(lastAvailableT([sample(0, 1), sample(1, 2), sample(2, null)], "helmetAccelG")).toBe(1);
    expect(lastAvailableT([sample(0, null), sample(1, 2)], "helmetAccelG")).toBeNull();
    expect(lastAvailableT([sample(0, null)], "helmetAccelG")).toBeNull();
    expect(lastAvailableT([], "helmetAccelG")).toBeNull();
  });

  it("finds channel peaks and ignores nulls", () => {
    expect(channelPeak([sample(0, null), sample(1, 3), sample(2, 1)], "helmetAccelG")).toEqual({ t: 1, value: 3 });
    expect(channelPeak([sample(0, null)], "helmetAccelG")).toBeNull();
    expect(channelPeak(incident.samples, "helmetAccelG")?.t).toBe(0);
  });

  it("maps a cursor time to the latest timeline entry", () => {
    const tl = incident.timeline;
    expect(activeEntryIndex(tl, null)).toBeNull();
    expect(activeEntryIndex(tl, -13)).toBe(-1);
    expect(tl[activeEntryIndex(tl, -2) ?? 0].title).toBe("Braking begins");
    expect(tl[activeEntryIndex(tl, 0) ?? 0].title).toBe("Helmet impact");
    expect(tl[activeEntryIndex(tl, 10) ?? 0].title).toBe("No rider response");
  });

  it("formats IST deterministically", () => {
    expect(fmtIst("2026-10-04T14:12:18Z")).toBe("4 Oct 2026, 19:42:18 IST");
    expect(fmtIst("not a date")).toBe("Unavailable");
    expect(fmtDelta(-0.3 - -1.2)).toBe("0.9 s");
    expect(fmtDelta(8)).toBe("8 s");
  });

  it("table rows include whole seconds and every key instant", () => {
    const ts = tableRows(incident).map((r) => r.t);
    for (const t of [-12, -4, -1.2, -0.3, 0, 0.1, 5, 10]) expect(ts).toContain(t);
    expect(ts.length).toBeLessThan(40);
  });

  it("builds a serializable, simulated incident package", () => {
    const pkg = buildIncidentPackage(incident, "2026-10-06T00:00:00.000Z");
    const round = JSON.parse(JSON.stringify(pkg));
    expect(round.simulated).toBe(true);
    expect(round.incident.id).toBe(incident.id);
    expect(round.assessment.eventClass).toBe("SEVERE_CRASH");
    expect(round.assessment.signals).toHaveLength(8);
    expect(round.timeline).toHaveLength(8);
    expect(round.timeline[0].label).toBe("T − 12 s");
    expect(round.series.samples).toHaveLength(incident.samples.length);
    expect(round.disclaimer).toContain("Not a medical, legal or insurance determination");
  });
});

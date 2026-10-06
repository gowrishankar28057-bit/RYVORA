import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { deviceRows } from "@/components/dashboard/status-card";
import {
  EmergencyWorkflow,
  emergencySteps,
  formatFix,
  formatFixAge,
  locationAttachment,
} from "@/components/safety/emergency-workflow";
import { IncidentOverlay } from "@/components/safety/incident-overlay";
import { RiderCheckScreen } from "@/components/safety/rider-check";
import { buildSnapshot, HEALTHY_STATE, SIM_LOCATION } from "@/lib/simulation/device-state";
import { foldLastSeen, NEVER_SEEN } from "@/lib/simulation/telemetry-source";
import { unpairedSnapshot } from "@/lib/simulation/web-bluetooth-source";

const NOW = 1_700_000_000_000;
const noop = () => {};

describe("locationAttachment", () => {
  it("attaches the live fix when GPS is locked", () => {
    const s = buildSnapshot(HEALTHY_STATE, NOW);
    const a = locationAttachment(s, foldLastSeen(NEVER_SEEN, s));
    expect(a).toEqual({ live: true, fix: SIM_LOCATION, ageSec: 0 });
  });

  it("falls back to the last known fix, with its age, when GPS drops", () => {
    const before = buildSnapshot(HEALTHY_STATE, NOW);
    const after = buildSnapshot({ ...HEALTHY_STATE, gpsAvailable: false }, NOW + 95_000);
    const lastSeen = foldLastSeen(foldLastSeen(NEVER_SEEN, before), after);
    const a = locationAttachment(after, lastSeen);
    expect(a.live).toBe(false);
    expect(a.fix).toEqual(SIM_LOCATION);
    expect(a.ageSec).toBe(95);
    const [step] = emergencySteps(false, a);
    expect(step.title).toBe("Last known location attached");
    expect(step.detail).toContain("fix from 2 min ago");
  });

  it("reports no location without throwing when nothing was ever received", () => {
    const a = locationAttachment(unpairedSnapshot("unsupported"), NEVER_SEEN);
    expect(a).toEqual({ live: false, fix: null, ageSec: null });
    expect(emergencySteps(false, a)[0].title).toBe("Location unavailable");
  });
});

describe("formatting", () => {
  it("formats coordinates with hemispheres and accuracy", () => {
    expect(formatFix(SIM_LOCATION)).toBe("12.9352° N, 77.6245° E · ±6 m");
    expect(formatFix({ lat: -33.8688, lon: -70.1, accuracyM: 12.4, label: "x" })).toBe("33.8688° S, 70.1000° W · ±12 m");
  });

  it("formats fix age and tolerates missing values", () => {
    expect(formatFixAge(null)).toBe("time unknown");
    expect(formatFixAge(Number.NaN)).toBe("time unknown");
    expect(formatFixAge(0.2)).toBe("1 s ago");
    expect(formatFixAge(42)).toBe("42 s ago");
    expect(formatFixAge(600)).toBe("10 min ago");
    expect(formatFixAge(7200)).toBe("2 h ago");
  });
});

describe("emergency workflow wording", () => {
  it("uses the jury-script wording in the phone's order, and keeps the demo default", () => {
    expect(emergencySteps(true).map((s) => s.title)).toEqual([
      "Location attached",
      "Emergency contact alerted",
      "Incident data prepared",
    ]);
    expect(emergencySteps(true)[0].detail).toBe("12.9352° N, 77.6245° E · ±6 m");
  });

  it("is labelled as a simulation and never claims a real call", () => {
    const html = renderToString(createElement(EmergencyWorkflow, { completed: 1 }));
    expect(html).toContain("EMERGENCY RESPONSE ACTIVATED");
    expect(html).toContain("no real call sent");
    expect(html).toContain("does not contact hospitals or emergency services");
  });
});

describe("rider check accessibility", () => {
  const render = (remaining: number, extra: Record<string, unknown> = {}) =>
    renderToString(createElement(RiderCheckScreen, { remaining, total: 15, confidencePct: 96, ...extra }));

  it("does not announce every second", () => {
    const html = render(9.5);
    expect(html).not.toContain('aria-live="assertive"');
    expect(html).toContain('role="timer"');
  });

  it("announces politely at 3 seconds left, unless the parent narrates", () => {
    expect(render(2.75)).toContain("3 seconds left to respond.");
    expect(render(2.75, { announce: false })).not.toContain("3 seconds left to respond.");
  });

  it("keeps the copy truthful when automatic escalation is off", () => {
    expect(render(10)).toContain("within 15 seconds");
    expect(render(10, { autoEscalate: false })).toContain("Automatic escalation is off");
  });

  it("renders safely with invalid countdown values", () => {
    expect(() => render(Number.NaN, { total: 0 })).not.toThrow();
  });
});

describe("IncidentOverlay", () => {
  it("renders the rider check as a modal alert dialog with I'M OKAY marked for focus", () => {
    const html = renderToString(createElement(IncidentOverlay, { confidencePct: 96, onClose: noop }));
    expect(html).toContain('role="alertdialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toMatch(/data-autofocus[^>]*>.*I’M OKAY/);
  });
});

describe("deviceRows", () => {
  it("distinguishes Bluetooth unavailable from Bluetooth off", () => {
    const unsupported = deviceRows(unpairedSnapshot("unsupported"));
    expect(unsupported.find((r) => r.label === "Helmet")?.value).toBe("Bluetooth unavailable");
    const off = deviceRows(buildSnapshot({ ...HEALTHY_STATE, phoneBluetooth: false }, NOW));
    expect(off.find((r) => r.label === "Helmet")?.value).toBe("Bluetooth off");
    expect(off.find((r) => r.label === "Bike module")?.value).toBe("Bluetooth off");
  });

  it("uses amber, not red, for an advisory IMU fault", () => {
    const rows = deviceRows(buildSnapshot({ ...HEALTHY_STATE, helmetImuFault: true }, NOW));
    expect(rows.find((r) => r.label === "Helmet IMU")?.tone).toBe("warning");
  });
});

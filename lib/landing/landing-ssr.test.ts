import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Landing from "@/app/page";
import { FailSafeSequence } from "@/components/safety/failsafe-sequence";
import { SafetyLab } from "@/components/safety/safety-lab";

/** Server-render smoke tests for the landing page, Safety lab and fail-safe sequence. */
describe("landing SSR", () => {
  const html = renderToString(createElement(Landing));

  it("renders the hero copy and both CTAs", () => {
    expect(html).toContain("Intelligence that protects every ride.");
    expect(html).toContain("Helmet. Bike. Phone.");
    expect(html).toContain("One intelligent safety system.");
    expect(html).toMatch(/href="\/dashboard"[^>]*>Explore RYVORA/);
    expect(html).toContain('href="/jury-demo"');
  });

  it("explains Prevent, Verify and Respond with the spec wording", () => {
    expect(html).toContain("Verify helmet and safety conditions before riding.");
    expect(html).toContain("Use multiple sensor sources to distinguish genuine crashes from false triggers.");
    expect(html).toContain("Escalate emergencies when the rider cannot respond.");
  });

  it("shows the engine-computed helmet drop vs crash comparison", () => {
    expect(html).toContain("Impact does not always mean accident.");
    expect(html).toContain("HELMET DROP");
    expect(html).toContain("98<!-- -->% confidence");
    expect(html).toContain("96<!-- -->% confidence");
    expect(html).toContain("NO EMERGENCY TRIGGERED");
    expect(html).toContain("POSSIBLE SEVERE CRASH");
  });

  it("includes the fail-safe line, the verification band and an honest disclaimer", () => {
    expect(html).toContain("The helmet does not need to survive the crash for RYVORA to respond.");
    expect(html).toContain("Existing systems detect impact.");
    expect(html).toContain("RYVORA verifies the accident.");
    expect(html).toContain("does not contact emergency services or hospitals");
    expect(html).toContain('id="main"');
  });
});

describe("FailSafeSequence", () => {
  it("shows the spec statuses once phone + bike take over", () => {
    const html = renderToString(createElement(FailSafeSequence, { stage: 3 }));
    for (const label of ["Helmet", "Impact", "Connection lost", "Phone Buffer", "Bike Sensor", "GPS", "Emergency Workflow"]) {
      expect(html).toContain(label);
    }
    expect(html.match(/AVAILABLE/g)).toHaveLength(3);
    expect(html.match(/ACTIVE/g)).toHaveLength(1);
  });

  it("stages progressively for the jury demo and tolerates bad stage values", () => {
    const early = renderToString(createElement(FailSafeSequence, { stage: 1, compact: true }));
    expect(early).toContain("Pending");
    expect(early).not.toContain("AVAILABLE");
    expect(() => renderToString(createElement(FailSafeSequence, { stage: Number.NaN, compact: true }))).not.toThrow();
    expect(renderToString(createElement(FailSafeSequence, { stage: 7.4 }))).toContain("ACTIVE");
  });
});

describe("Safety lab SSR", () => {
  const html = renderToString(createElement(SafetyLab));

  it("renders the helmet drop verdict and the key signals readout", () => {
    expect(html).toContain("Impact does not always mean accident.");
    expect(html).toContain("Key signals");
    expect(html).toContain("Phone crash pattern");
    expect(html).toContain("HELMET DROP");
    expect(html).toContain("NO EMERGENCY TRIGGERED");
    expect(html).toContain("Multiple devices. One verified decision.");
  });

  it("offers every scenario as a radio and the fail-safe toggle", () => {
    expect(html.match(/type="radio"/g)).toHaveLength(7);
    expect(html).toContain("Helmet destroyed before impact packet");
    expect(html).toContain('href="/reconstruction"');
  });
});

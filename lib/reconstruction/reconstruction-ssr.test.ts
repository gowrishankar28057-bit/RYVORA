import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ReconstructionView } from "@/components/reconstruction/reconstruction-view";
import { EventTimeline } from "@/components/safety/event-timeline";
import { SCENARIO_MAP } from "@/lib/simulation/scenarios";

/** Server-render smoke tests: the reconstruction must never crash during SSR. */
describe("reconstruction SSR", () => {
  it("renders the full view with headline, explanation and disclaimer", () => {
    const html = renderToString(createElement(ReconstructionView));
    expect(html).toContain("Understand the seconds that mattered.");
    expect(html).toContain("Simulated incident");
    expect(html).toContain("Download incident package (JSON)");
    expect(html).toContain("Helmet link lost — remaining verification by phone + bike");
    expect(html).toContain("Not a medical, legal or insurance determination.");
    expect(html).toContain("4 Oct 2026, 19:42:18 IST");
  });

  it("renders compact mode", () => {
    expect(() => renderToString(createElement(ReconstructionView, { compact: true }))).not.toThrow();
  });

  it("renders the timeline as an ordered list with an active step", () => {
    const html = renderToString(
      createElement(EventTimeline, { entries: SCENARIO_MAP["severe-crash"].timeline, horizontal: true, activeIndex: 4 }),
    );
    expect(html.startsWith("<ol")).toBe(true);
    expect(html.match(/<li/g)).toHaveLength(8);
    expect(html).toContain('aria-current="step"');
    expect(renderToString(createElement(EventTimeline, { entries: [] }))).toContain("No timeline events recorded.");
  });
});

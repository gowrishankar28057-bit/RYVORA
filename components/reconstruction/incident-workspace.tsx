"use client";

import { Crosshair } from "lucide-react";
import { useState } from "react";
import { EventTimeline } from "@/components/safety/event-timeline";
import { Card, SimLabel } from "@/components/ui/primitives";
import type { TimelineEntry } from "@/lib/types/events";
import type { TelemetrySample } from "@/lib/types/telemetry";
import { cn } from "@/lib/utils/cn";
import { fmtT } from "@/lib/utils/format";
import { activeEntryIndex, DEVICE_COLORS, DEVICE_NAMES, type ChartMarker, type SourceDevice } from "./incident-model";
import { SensorCharts } from "./sensor-charts";
import { SensorDataTable } from "./sensor-data-table";

const MARKER_KEY: Record<ChartMarker["tone"], string> = {
  neutral: "border-muted/70 border-dashed",
  warning: "border-warn border-dashed",
  critical: "border-crit-strong",
};

/**
 * Black-box timeline + synchronized charts. Hovering any chart moves one shared cursor:
 * every chart shows the same instant and the timeline highlights the latest event reached.
 */
export function IncidentWorkspace({
  timeline,
  samples,
  markers,
  tableRows,
  helmetLinkLostT,
  bufferSeconds,
  compact = false,
}: {
  timeline: TimelineEntry[];
  samples: TelemetrySample[];
  markers: ChartMarker[];
  tableRows: TelemetrySample[];
  helmetLinkLostT: number | null;
  bufferSeconds: number;
  compact?: boolean;
}) {
  const [cursorT, setCursorT] = useState<number | null>(null);
  const activeIndex = activeEntryIndex(timeline, cursorT);
  const activeEntry = activeIndex !== null && activeIndex >= 0 ? timeline[activeIndex] : null;

  return (
    <>
      <Card className={cn("min-w-0 p-4 sm:p-5 lg:p-6", compact && "lg:p-5")} aria-labelledby="recon-blackbox-title">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">Digital black box</p>
            <h2
              id="recon-blackbox-title"
              className={cn("mt-1 font-[family-name:var(--font-display)] font-extrabold leading-tight text-navy", compact ? "text-xl" : "text-xl sm:text-2xl")}
            >
              Understand the seconds that mattered.
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-body">
              The phone continuously keeps a rolling {bufferSeconds} s window of helmet, bike and phone sensor data. When the event was
              detected, that window was frozen and kept — before the helmet link dropped.
            </p>
          </div>
          <SimLabel>Simulated data</SimLabel>
        </div>
        <div className="mt-5 lg:mt-6">
          <EventTimeline entries={timeline} horizontal activeIndex={activeIndex} compact={compact} label="Incident timeline, seconds relative to impact" />
        </div>
      </Card>

      <Card className={cn("min-w-0 p-4 sm:p-5 lg:p-6", compact && "lg:p-5")} aria-labelledby="recon-charts-title">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Crash reconstruction</p>
            <h2 id="recon-charts-title" className="text-base font-bold text-navy">
              Synchronized sensor channels
            </h2>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-body" aria-label="Legend">
              {(Object.keys(DEVICE_COLORS) as SourceDevice[]).map((d) => (
                <li key={d} className="flex items-center gap-1.5">
                  <span className="h-0.5 w-4 rounded-full" style={{ background: DEVICE_COLORS[d] }} aria-hidden />
                  {DEVICE_NAMES[d]}
                </li>
              ))}
              {markers.map((m) => (
                <li key={`${m.label}-${m.t}`} className="flex items-center gap-1.5">
                  <span className={cn("h-3.5 w-0 border-l-[1.5px]", MARKER_KEY[m.tone])} aria-hidden />
                  {m.label} <span className="text-muted tabular">{fmtT(m.t)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div
            className="flex min-h-11 min-w-0 items-center gap-2 rounded-xl border border-line-soft bg-surface px-3 py-2 text-xs lg:w-80"
            aria-hidden
          >
            <Crosshair className="size-4 shrink-0 text-brand-600" />
            {cursorT === null ? (
              <span className="text-muted">Hover or tap a chart to scrub every channel and the timeline together.</span>
            ) : (
              <span className="min-w-0 truncate">
                <strong className="font-semibold text-navy tabular">{fmtT(cursorT)}</strong>
                <span className="text-muted"> · {activeEntry ? activeEntry.title : "Before first recorded event"}</span>
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 lg:mt-5">
          <SensorCharts data={samples} markers={markers} gapFrom={helmetLinkLostT} compact={compact} onActiveT={setCursorT} />
        </div>

        {!compact && <SensorDataTable rows={tableRows} className="mt-4" />}
      </Card>
    </>
  );
}

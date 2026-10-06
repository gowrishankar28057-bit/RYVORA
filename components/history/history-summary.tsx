import { Activity, Route, ShieldCheck, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { HistorySummary } from "./history-model";

/** Totals computed from the history list. Server component. */
export function HistorySummaryStrip({ summary, className }: { summary: HistorySummary; className?: string }) {
  const items = [
    { label: "Rides", value: String(summary.rides), Icon: Activity, cls: "bg-brand-50 text-brand-600" },
    {
      label: "Distance",
      value: summary.distanceKm.toLocaleString("en-IN", { maximumFractionDigits: 1 }),
      unit: "km",
      Icon: Route,
      cls: "bg-brand-50 text-brand-600",
    },
    { label: "Safety events", value: String(summary.events), Icon: TriangleAlert, cls: "bg-surface text-navy" },
    { label: "False triggers rejected", value: String(summary.falseTriggersRejected), Icon: ShieldCheck, cls: "bg-ok-bg text-ok" },
  ];
  return (
    <dl className={cn("grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2", className)}>
      {items.map(({ label, value, unit, Icon, cls }) => (
        <div
          key={label}
          className="flex flex-col justify-between gap-3 rounded-2xl border border-line bg-white p-3.5 shadow-[var(--shadow-card)]"
        >
          <dt className="flex items-start gap-2 text-xs font-semibold leading-tight text-muted">
            <span className={cn("grid size-7 shrink-0 place-items-center rounded-lg", cls)}>
              <Icon className="size-4" aria-hidden />
            </span>
            <span className="pt-1.5">{label}</span>
          </dt>
          <dd className="font-[family-name:var(--font-display)] text-2xl font-extrabold leading-none text-navy tabular">
            {value}
            {unit && <span className="ml-1 text-sm font-semibold text-muted">{unit}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

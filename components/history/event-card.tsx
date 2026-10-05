import Link from "next/link";
import { Activity, ChevronRight, OctagonAlert, ShieldCheck, TriangleAlert, Waves } from "lucide-react";
import { HelmetIcon } from "@/components/brand/icons";
import { RiskBadge } from "@/components/safety/risk-badge";
import { SimLabel } from "@/components/ui/primitives";
import type { RideEvent } from "@/lib/types/events";
import { cn } from "@/lib/utils/cn";
import { fmtDateTime } from "@/lib/utils/format";
import { assessEvent, confidencePct } from "@/lib/engine/crash-confidence";
import { getScenario } from "@/lib/simulation/scenarios";

function iconFor(e: RideEvent) {
  switch (e.scenarioId) {
    case "severe-crash":
      return { Icon: OctagonAlert, cls: "bg-crit-bg text-crit" };
    case "helmet-drop":
      return { Icon: HelmetIcon, cls: "bg-ok-bg text-ok" };
    case "hard-brake":
      return { Icon: TriangleAlert, cls: "bg-brand-50 text-brand-600" };
    case "pothole":
      return { Icon: Waves, cls: "bg-brand-50 text-brand-600" };
    case "bike-fall":
      return { Icon: TriangleAlert, cls: "bg-warn-bg text-warn" };
    default:
      return { Icon: e.kind === "ride" ? Activity : ShieldCheck, cls: "bg-surface text-navy" };
  }
}

export function EventCard({ event, compact = false }: { event: RideEvent; compact?: boolean }) {
  const { Icon, cls } = iconFor(event);
  const scenario = getScenario(event.scenarioId);
  const assessment = scenario && event.kind === "event" ? assessEvent(scenario.input) : null;
  const metric =
    event.kind === "ride"
      ? `${event.distanceKm?.toFixed(1)} km`
      : event.scenarioId === "helmet-drop"
        ? "False trigger rejected"
        : assessment
          ? `${confidencePct(assessment)}% confidence`
          : "";

  return (
    <li>
      <Link
        href={`/history/${event.id}`}
        className={cn(
          "group flex items-center gap-3 rounded-2xl border border-line-soft bg-white transition-colors hover:border-brand",
          compact ? "p-3" : "p-4",
        )}
      >
        <span className={cn("grid size-11 shrink-0 place-items-center rounded-2xl", cls)}>
          <Icon className="size-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-[family-name:var(--font-display)] text-[15px] font-bold text-navy">{event.title}</span>
            {!compact && event.scenarioId === "severe-crash" && <SimLabel>Simulation</SimLabel>}
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted">
            {fmtDateTime(event.occurredAt)} · {event.locationLabel}
          </span>
        </span>
        <span className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
          <span className="text-sm font-bold text-navy tabular">{metric}</span>
          {!compact && <RiskBadge risk={event.risk} />}
        </span>
        <span className="flex shrink-0 flex-col items-end sm:hidden">
          <span className="text-xs font-bold text-navy tabular">{metric}</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </li>
  );
}

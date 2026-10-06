import { SignalList } from "@/components/safety/crash-confidence-panel";
import { Card, CardHeader } from "@/components/ui/primitives";
import { EVENT_LABELS } from "@/lib/engine/crash-confidence";
import type { CrashAssessment } from "@/lib/types/events";
import { cn } from "@/lib/utils/cn";

/** Sensor inputs, reasoning and runner-up classes behind an engine verdict. */
export function EvidenceCard({ assessment, className }: { assessment: CrashAssessment; className?: string }) {
  const available = assessment.signals.filter((s) => s.available).length;
  return (
    <Card className={cn("p-5", className)}>
      <CardHeader
        kicker="Sensor evidence"
        title="Why the engine decided this"
        action={
          <span className="shrink-0 rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-navy tabular">
            {available}/{assessment.signals.length} signals
          </span>
        }
      />
      <ul className="mt-3 space-y-1.5">
        {assessment.reasons.map((r) => (
          <li key={r} className="flex gap-2 text-sm text-body">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
            {r}
          </li>
        ))}
      </ul>

      <div className="mt-4">
        <SignalList signals={assessment.signals} />
      </div>

      <div className="mt-4 rounded-2xl border border-line-soft bg-surface p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Also considered</p>
        <ul className="mt-2 space-y-1.5">
          {assessment.ranking.slice(1, 4).map((r) => {
            const pct = Math.round(r.score * 100);
            return (
              <li key={r.eventClass} className="flex items-center gap-3 text-xs">
                <span className="w-28 shrink-0 font-semibold text-navy">{EVENT_LABELS[r.eventClass]}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line-soft" aria-hidden>
                  <span className="block h-full rounded-full bg-muted/50" style={{ width: `${pct}%` }} />
                </span>
                <span className="w-9 text-right text-muted tabular">{pct}%</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-[11px] text-muted">
          Signature match per event type · signal coverage {Math.round(assessment.coverage * 100)}%.
        </p>
      </div>
    </Card>
  );
}

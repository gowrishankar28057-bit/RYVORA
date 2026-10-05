import { BrainCircuit, CircleCheck, Motorbike, OctagonAlert, Smartphone, Wifi } from "lucide-react";
import { HelmetIcon } from "@/components/brand/icons";
import { Badge, ConfidenceRing, type Tone } from "@/components/ui/primitives";
import { CLASS_TONE } from "@/components/safety/risk-badge";
import { EVENT_LABELS } from "@/lib/engine/crash-confidence";
import type { CrashAssessment, SignalReading } from "@/lib/types/events";
import { cn } from "@/lib/utils/cn";

const DEVICE_ICON: Record<SignalReading["device"], React.ReactNode> = {
  helmet: <HelmetIcon className="size-4" />,
  bike: <Motorbike className="size-4" />,
  phone: <Smartphone className="size-4" />,
  system: <Wifi className="size-4" />,
};

const LEVEL_TONE: Record<string, Tone> = {
  HIGH: "critical",
  MODERATE: "warning",
  LOW: "info",
  NONE: "neutral",
  YES: "info",
  NO: "neutral",
  "N/A": "neutral",
};

export function SignalList({
  signals,
  revealed = signals.length,
  dense = false,
}: {
  signals: SignalReading[];
  revealed?: number;
  dense?: boolean;
}) {
  return (
    <ul className={cn("space-y-1.5", dense && "space-y-1")}>
      {signals.map((s, i) => {
        const shown = i < revealed;
        return (
          <li
            key={s.key}
            className={cn(
              "flex items-center gap-3 rounded-xl border border-line-soft bg-white transition-all duration-300",
              dense ? "px-2.5 py-1.5" : "px-3 py-2.5",
              !shown && "opacity-30",
            )}
          >
            <span className={cn("grid shrink-0 place-items-center rounded-lg bg-surface text-navy", dense ? "size-7" : "size-8")}>
              {DEVICE_ICON[s.device]}
            </span>
            <span className="min-w-0 flex-1">
              <span className={cn("block truncate font-semibold text-navy", dense ? "text-xs" : "text-[13px]")}>{s.label}</span>
              <span className={cn("block truncate text-muted tabular", dense ? "text-[11px]" : "text-xs")}>
                {shown ? s.display : "…"}
              </span>
            </span>
            {shown && (
              <span className="flex shrink-0 flex-col items-end gap-1">
                <Badge tone={s.available ? LEVEL_TONE[s.level] : "warning"}>{s.available ? s.level : "Missing"}</Badge>
                {!dense && s.agreement !== null && (
                  <span className="h-1 w-14 overflow-hidden rounded-full bg-line-soft" aria-hidden title="Agreement with verdict">
                    <span className="block h-full rounded-full bg-brand" style={{ width: `${Math.round(s.agreement * 100)}%` }} />
                  </span>
                )}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function VerdictCard({ assessment, compact = false }: { assessment: CrashAssessment; compact?: boolean }) {
  const tone = CLASS_TONE[assessment.eventClass];
  const severe = assessment.eventClass === "SEVERE_CRASH";
  const label = severe ? "POSSIBLE SEVERE CRASH" : EVENT_LABELS[assessment.eventClass].toUpperCase();
  return (
    <div
      className={cn(
        "rounded-3xl border p-5",
        severe ? "border-crit-line bg-crit-bg" : tone === "warning" ? "border-warn-line bg-warn-bg" : "border-line bg-white",
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-4">
        <ConfidenceRing value={assessment.confidence} size={compact ? 84 : 104} stroke={compact ? 8 : 9} tone={severe ? "critical" : tone === "warning" ? "warning" : "info"} label="Confidence" />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Classification</p>
          <p className={cn("font-[family-name:var(--font-display)] font-extrabold leading-tight", compact ? "text-lg" : "text-2xl", severe ? "text-crit" : "text-navy")}>
            {label}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-navy tabular">{Math.round(assessment.confidence * 100)}% confidence</p>
        </div>
      </div>
      <div
        className={cn(
          "mt-4 flex items-center gap-2 rounded-2xl px-3.5 py-3 text-sm font-bold",
          assessment.emergency ? "bg-crit-strong text-white" : "bg-ok-bg text-ok",
        )}
      >
        {assessment.emergency ? <OctagonAlert className="size-4 shrink-0" aria-hidden /> : <CircleCheck className="size-4 shrink-0" aria-hidden />}
        {assessment.emergency ? "Rider check started → emergency escalation if no response" : assessment.eventClass === "HELMET_DROP" ? "NO EMERGENCY TRIGGERED" : assessment.headline}
      </div>
    </div>
  );
}

/** The hero visual: inputs → engine → verdict. */
export function CrashConfidencePanel({
  assessment,
  revealed,
  evaluating = false,
  showRanking = true,
}: {
  assessment: CrashAssessment;
  revealed?: number;
  evaluating?: boolean;
  showRanking?: boolean;
}) {
  const done = !evaluating && (revealed === undefined || revealed >= assessment.signals.length);
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-stretch">
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Sensor inputs</p>
        <SignalList signals={assessment.signals} revealed={revealed} />
      </div>

      <div className="flex items-center justify-center lg:flex-col" aria-hidden>
        <div className="h-px w-full bg-gradient-to-r from-transparent via-brand/40 to-transparent lg:h-full lg:w-px lg:bg-gradient-to-b" />
        <div className="relative mx-3 my-1 grid size-16 shrink-0 place-items-center rounded-2xl bg-navy text-white shadow-[var(--shadow-lift)] lg:my-3">
          {!done && <span className="absolute inset-0 rounded-2xl bg-brand/40 animate-pulse-ring" />}
          <BrainCircuit className="relative size-7" />
        </div>
        <div className="h-px w-full bg-gradient-to-r from-transparent via-brand/40 to-transparent lg:h-full lg:w-px lg:bg-gradient-to-b" />
      </div>

      <div className="flex flex-col">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">RYVORA crash confidence engine</p>
        {done ? (
          <div className="space-y-4 animate-fade-up">
            <VerdictCard assessment={assessment} />
            {showRanking && (
              <div className="rounded-2xl border border-line-soft bg-surface p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Also considered</p>
                <ul className="mt-2 space-y-1.5">
                  {assessment.ranking.slice(1, 4).map((r) => (
                    <li key={r.eventClass} className="flex items-center gap-3 text-xs">
                      <span className="w-28 shrink-0 font-semibold text-navy">{EVENT_LABELS[r.eventClass]}</span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line-soft">
                        <span className="block h-full rounded-full bg-muted/50" style={{ width: `${Math.round(r.score * 100)}%` }} />
                      </span>
                      <span className="w-9 text-right text-muted tabular">{Math.round(r.score * 100)}%</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[11px] text-muted">Signature match per event type.</p>
              </div>
            )}
            <ul className="space-y-1.5">
              {assessment.reasons.map((r) => (
                <li key={r} className="flex gap-2 text-sm text-body">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="grid flex-1 place-items-center rounded-3xl border border-dashed border-line bg-surface p-8 text-center">
            <div>
              <p className="font-[family-name:var(--font-display)] text-lg font-bold text-navy">Verifying across devices…</p>
              <p className="mt-1 text-sm text-muted">Helmet · Bike · Phone</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

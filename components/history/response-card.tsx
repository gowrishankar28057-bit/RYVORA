import { BellRing, CircleCheck, FileText, MessageCircleQuestion, Siren } from "lucide-react";
import { HelmetIcon } from "@/components/brand/icons";
import { Card, CardHeader, SimLabel } from "@/components/ui/primitives";
import type { CrashAssessment, ResponseAction } from "@/lib/types/events";
import { cn } from "@/lib/utils/cn";
import { describeResponse, type ResponseTone } from "./history-model";

const TONE: Record<ResponseTone, string> = {
  success: "border-ok-line bg-ok-bg text-ok",
  info: "border-brand-100 bg-brand-50 text-brand-600",
  warning: "border-warn-line bg-warn-bg text-warn",
  critical: "border-crit-line bg-crit-bg text-crit",
};

const ICON: Record<ResponseAction, React.ComponentType<{ className?: string }>> = {
  none: CircleCheck,
  log: FileText,
  "inspect-helmet": HelmetIcon,
  "notify-rider": BellRing,
  "rider-check": MessageCircleQuestion,
  "rider-check-escalate": Siren,
};

/** What RYVORA did about the event — derived from the engine's action, plus the recorded outcome. */
export function ResponseCard({ assessment, outcome, className }: { assessment: CrashAssessment; outcome: string; className?: string }) {
  const r = describeResponse(assessment);
  const Icon = ICON[r.action];
  return (
    <Card className={cn("p-5", className)}>
      <CardHeader kicker="Response taken" title={r.title} action={r.simulated ? <SimLabel>Demonstrated</SimLabel> : undefined} />
      <div className="mt-3 flex gap-3">
        <span className={cn("grid size-11 shrink-0 place-items-center rounded-2xl border", TONE[r.tone])}>
          <Icon className="size-5" aria-hidden />
        </span>
        <p className="text-sm leading-relaxed text-body">{r.detail}</p>
      </div>
      <dl className="mt-4 rounded-2xl bg-surface p-3.5 text-sm">
        <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Recorded outcome</dt>
        <dd className="mt-0.5 font-semibold text-navy">{outcome || "—"}</dd>
      </dl>
      {r.simulated && (
        <p className="mt-3 text-xs text-muted">
          This browser prototype never contacts emergency services or sends messages. Escalation is a simulated workflow.
        </p>
      )}
    </Card>
  );
}

import { Info, Motorbike, Smartphone, Sparkles, Wifi } from "lucide-react";
import { HelmetIcon } from "@/components/brand/icons";
import { Badge, Card, CardHeader, type Tone } from "@/components/ui/primitives";
import { confidencePct } from "@/lib/engine/crash-confidence";
import type { CrashAssessment, SignalLevel, SignalReading } from "@/lib/types/events";
import { cn } from "@/lib/utils/cn";
import { DASH } from "@/lib/utils/format";
import type { IncidentExplanation } from "./incident-model";

/** Level is magnitude, not status — keep it calm; the agreement bar carries the meaning. */
const LEVEL_TONE: Record<SignalLevel, Tone> = {
  HIGH: "dark",
  MODERATE: "info",
  LOW: "neutral",
  NONE: "neutral",
  YES: "info",
  NO: "neutral",
  "N/A": "warning",
};

const DEVICE_NAME: Record<SignalReading["device"], string> = { helmet: "Helmet", bike: "Bike", phone: "Phone", system: "Link" };

function SignalIcon({ device }: { device: SignalReading["device"] }) {
  const cls = "size-4";
  if (device === "helmet") return <HelmetIcon className={cls} />;
  if (device === "bike") return <Motorbike className={cls} aria-hidden />;
  if (device === "phone") return <Smartphone className={cls} aria-hidden />;
  return <Wifi className={cls} aria-hidden />;
}

function Agreement({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <>
        <span aria-hidden className="text-muted">{DASH}</span>
        <span className="sr-only">Unavailable</span>
      </>
    );
  }
  const pct = Math.round(value * 100);
  return (
    <span className="inline-flex items-center justify-end gap-2">
      <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-line-soft sm:block" aria-hidden>
        <span className="block h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </span>
      <span className="w-9 text-right font-semibold text-navy tabular">{pct}%</span>
    </span>
  );
}

export function SignalContributionTable({
  assessment,
  classLabel,
  className,
}: {
  assessment: CrashAssessment;
  classLabel: string;
  className?: string;
}) {
  return (
    <Card className={cn("p-4 sm:p-5 lg:p-6", className)}>
      <CardHeader kicker="Sensor fusion" title="Signal contribution" />
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Agreement shows how closely each reading matches the {classLabel.toLowerCase()} signature. Weight is the signal&apos;s share of the
        engine&apos;s decision; missing signals are excluded, never guessed.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Per-signal value, level, weight and agreement with the classification</caption>
          <thead className="text-[11px] uppercase tracking-wider text-muted">
            <tr className="border-b border-line-soft">
              <th scope="col" className="py-2 pr-2 font-semibold">Signal</th>
              <th scope="col" className="hidden px-2 py-2 font-semibold sm:table-cell">Value</th>
              <th scope="col" className="px-2 py-2 font-semibold">Level</th>
              <th scope="col" className="hidden px-2 py-2 text-right font-semibold md:table-cell">Weight</th>
              <th scope="col" className="py-2 pl-2 text-right font-semibold">Agreement</th>
            </tr>
          </thead>
          <tbody>
            {assessment.signals.map((s) => (
              <tr key={s.key} className="border-b border-line-soft last:border-0">
                <th scope="row" className="py-2.5 pr-2 font-normal">
                  <span className="flex items-center gap-2.5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface text-navy" title={DEVICE_NAME[s.device]}>
                      <SignalIcon device={s.device} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold leading-tight text-navy">{s.label}</span>
                      <span className="block text-xs text-muted tabular sm:hidden">{s.display}</span>
                      <span className="sr-only">, {DEVICE_NAME[s.device]}</span>
                    </span>
                  </span>
                </th>
                <td className="hidden px-2 py-2.5 text-[13px] text-body tabular sm:table-cell">{s.display}</td>
                <td className="px-2 py-2.5">
                  <Badge tone={LEVEL_TONE[s.level]}>{s.available ? s.level : "Missing"}</Badge>
                </td>
                <td className="hidden px-2 py-2.5 text-right text-[13px] text-muted tabular md:table-cell">{Math.round(s.weight * 100)}%</td>
                <td className="py-2.5 pl-2 text-right text-[13px]">
                  <Agreement value={s.agreement} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-line-soft pt-3 text-xs text-muted tabular">
        <span>
          Confidence <strong className="font-semibold text-navy">{confidencePct(assessment)}%</strong>
        </span>
        <span>
          Signal coverage <strong className="font-semibold text-navy">{Math.round(assessment.coverage * 100)}%</strong>
        </span>
      </p>
    </Card>
  );
}

export function AiExplanation({
  explanation,
  severe,
  className,
}: {
  explanation: IncidentExplanation;
  severe: boolean;
  className?: string;
}) {
  return (
    <Card className={cn("flex flex-col p-4 sm:p-5 lg:p-6", className)}>
      <CardHeader
        kicker="AI explanation"
        title={severe ? "Why crash confidence increased" : "How this event was classified"}
        action={
          <Badge tone="info">
            <Sparkles className="size-3" aria-hidden />
            Rule-based
          </Badge>
        }
      />
      <p className="mt-3 text-[15px] font-semibold leading-relaxed text-navy">{explanation.summary}</p>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Evidence in the event window</p>
      <ul className="mt-2 space-y-1.5">
        {explanation.reasons.map((r) => (
          <li key={r} className="flex gap-2 text-sm leading-relaxed text-body">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
            {r}
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-5">
        <p className="flex gap-2 rounded-2xl border border-line-soft bg-surface p-3 text-xs leading-relaxed text-muted">
          <Info className="mt-px size-3.5 shrink-0 text-brand-600" aria-hidden />
          {explanation.disclaimer}
        </p>
      </div>
    </Card>
  );
}

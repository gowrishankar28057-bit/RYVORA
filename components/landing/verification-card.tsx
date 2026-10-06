import { BrainCircuit, CircleCheck, OctagonAlert } from "lucide-react";
import { Badge, SimLabel, StatusDot } from "@/components/ui/primitives";
import { assessEvent, confidencePct } from "@/lib/engine/crash-confidence";
import { getScenario } from "@/lib/simulation/scenarios";
import { cn } from "@/lib/utils/cn";
import { DEVICE_NAMES, DeviceIcon } from "./device-icon";
import { classificationLabel, keySignalRows, outcomeFor, type KeySignalDevice, type KeySignalId, type Outcome } from "@/lib/engine/key-signals";

const DEVICES: KeySignalDevice[] = ["helmet", "bike", "phone"];
/** The five signals that tell a dropped helmet apart from a crash. */
const SHOWN: KeySignalId[] = ["helmetImpact", "helmetWorn", "bikeSpeed", "bikeImpact", "phoneCrashPattern"];
const OUTCOME_STYLE: Record<Outcome["tone"], { box: string; text: string }> = {
  success: { box: "border-ok-line bg-ok-bg", text: "text-ok" },
  warning: { box: "border-warn-line bg-warn-bg", text: "text-warn" },
  critical: { box: "border-crit-line bg-crit-bg", text: "text-crit" },
};

/**
 * Static "live verification" illustration for the hero. Values come from the
 * crash confidence engine run on the simulated helmet-drop scenario at render
 * time on the server, so no client JavaScript is shipped for it.
 */
export function VerificationCard({ className }: { className?: string }) {
  const scenario = getScenario("helmet-drop");
  if (!scenario) return null;
  const assessment = assessEvent(scenario.input);
  const rows = keySignalRows(assessment).filter((r) => SHOWN.includes(r.id));
  const outcome = outcomeFor(assessment);
  const pct = confidencePct(assessment);
  const style = OUTCOME_STYLE[outcome.tone];
  const OutcomeIcon = outcome.tone === "success" ? CircleCheck : OctagonAlert;

  return (
    <figure aria-labelledby="verification-card-title" className={cn("mx-auto w-full max-w-md", className)}>
      <div className="rounded-[28px] border border-line bg-white p-4 shadow-[var(--shadow-lift)] sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <p id="verification-card-title" className="flex items-center gap-2 text-sm font-bold text-navy">
            <StatusDot tone="info" pulse />
            Live verification
          </p>
          <SimLabel>Simulated</SimLabel>
        </div>
        <p className="mt-1 text-xs text-muted">Helmet impact detected. Cross-checking every device.</p>

        <ul className="mt-5 space-y-2">
          {DEVICES.map((device, i) => (
            <li
              key={device}
              className="flex items-start gap-3 rounded-2xl border border-line-soft bg-surface p-3 animate-fade-up"
              style={{ animationDelay: `${120 + i * 140}ms` }}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-navy shadow-[var(--shadow-card)]">
                <DeviceIcon device={device} className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-navy">{DEVICE_NAMES[device]}</p>
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {rows
                    .filter((r) => r.device === device)
                    .map((r) => (
                      <li key={r.id}>
                        <Badge tone={r.tone} className="normal-case tracking-normal">
                          <span className="font-medium opacity-75">{r.short}</span>
                          {r.value}
                        </Badge>
                      </li>
                    ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3 py-3 pl-5" aria-hidden>
          <span className="h-6 w-px bg-linear-to-b from-line to-brand/60" />
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            <BrainCircuit className="size-3.5 text-brand" />
            Crash confidence engine
          </span>
        </div>

        <div className={cn("rounded-2xl border p-4 animate-fade-up", style.box)} style={{ animationDelay: "620ms" }}>
          <div className="flex items-baseline justify-between gap-3">
            <p className={cn("text-[11px] font-semibold uppercase tracking-[0.14em]", style.text)}>Classification</p>
            <p className="text-sm font-bold text-navy tabular">{pct}% confidence</p>
          </div>
          <p className="mt-0.5 font-[family-name:var(--font-display)] text-xl font-extrabold text-navy">{classificationLabel(assessment)}</p>
          <p className={cn("mt-2 flex items-center gap-1.5 text-sm font-bold", style.text)}>
            <OutcomeIcon className="size-4 shrink-0" aria-hidden />
            {outcome.title}
          </p>
        </div>
      </div>
      <figcaption className="sr-only">
        Simulated example: a {rows[0]?.value.toLowerCase()} helmet impact while the helmet is not worn, the bike is parked and the phone sees no crash
        pattern is classified as {classificationLabel(assessment).toLowerCase()} with {pct}% confidence. {outcome.title.toLowerCase()}.
      </figcaption>
    </figure>
  );
}

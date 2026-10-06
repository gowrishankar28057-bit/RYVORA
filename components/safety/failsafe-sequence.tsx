import { Check, Database, MapPin, Motorbike, Siren, Unplug, Zap, type LucideIcon } from "lucide-react";
import { HelmetIcon } from "@/components/brand/icons";
import { SimLabel } from "@/components/ui/primitives";
import { cn } from "@/lib/utils/cn";

type StepTone = "navy" | "warn" | "crit";

const STEPS: { label: string; status: string; tone: StepTone; icon: LucideIcon | typeof HelmetIcon }[] = [
  { label: "Helmet", status: "Streaming", tone: "navy", icon: HelmetIcon },
  { label: "Impact", status: "Detected", tone: "warn", icon: Zap },
  { label: "Connection lost", status: "Helmet offline", tone: "crit", icon: Unplug },
];

const CONTINUES: { label: string; status: "AVAILABLE" | "ACTIVE"; detail: string; icon: LucideIcon }[] = [
  { label: "Phone Buffer", status: "AVAILABLE", detail: "30 s rolling pre-impact data", icon: Database },
  { label: "Bike Sensor", status: "AVAILABLE", detail: "IMU, rotation and speed", icon: Motorbike },
  { label: "GPS", status: "AVAILABLE", detail: "Location fix on the phone", icon: MapPin },
  { label: "Emergency Workflow", status: "ACTIVE", detail: "Runs on the phone", icon: Siren },
];

const STEP_ON: Record<StepTone, { box: string; tile: string; status: string }> = {
  navy: { box: "border-line bg-white", tile: "bg-brand-50 text-navy", status: "text-muted" },
  warn: { box: "border-warn-line bg-warn-bg", tile: "bg-white text-warn", status: "text-warn" },
  crit: { box: "border-crit-line bg-crit-bg", tile: "bg-white text-crit", status: "text-crit" },
};

const STAGE_TEXT = [
  "Helmet streaming to the phone.",
  "Impact detected by the helmet.",
  "Helmet connection lost.",
  "Helmet connection lost. Phone buffer, bike sensor and GPS available; emergency workflow active.",
];

/** Clamp any (possibly fractional or invalid) stage to 0…3. */
function clampStage(stage: number) {
  if (!Number.isFinite(stage)) return 3;
  return Math.max(0, Math.min(3, Math.floor(stage)));
}

/**
 * "The helmet does not need to survive the crash for RYVORA to respond."
 *
 * `stage`: 0 helmet streaming · 1 impact · 2 connection lost · 3 phone + bike continue.
 * `compact` fits a 360 px phone frame (used by the jury demo).
 */
export function FailSafeSequence({ stage = 3, compact = false }: { stage?: number; compact?: boolean }) {
  const s = clampStage(stage);
  const continuing = s >= 3;

  return (
    <div className={cn("grid min-w-0", compact ? "gap-3" : "gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center")}>
      <p className="sr-only">{STAGE_TEXT[s]}</p>

      <ol aria-label="Helmet failure sequence" className="flex min-w-0 items-stretch">
        {STEPS.map((step, i) => {
          const on = i <= s;
          const tone = STEP_ON[step.tone];
          return (
            <li key={step.label} className="flex min-w-0 flex-1 items-center" aria-current={i === Math.min(s, 2) ? "step" : undefined}>
              <div
                className={cn(
                  "flex h-full min-w-0 flex-1 flex-col items-center gap-1.5 rounded-2xl border px-1 text-center transition-all duration-500",
                  compact ? "py-2.5" : "py-3.5",
                  on ? tone.box : "border-line-soft bg-white opacity-40",
                )}
              >
                <span className={cn("grid place-items-center rounded-xl", compact ? "size-8" : "size-10", on ? tone.tile : "bg-surface text-muted")}>
                  <step.icon className={compact ? "size-4" : "size-5"} aria-hidden />
                </span>
                <span className="text-[11px] font-bold leading-tight text-navy">{step.label}</span>
                <span className={cn("text-[10px] font-semibold leading-tight", on ? tone.status : "text-muted")}>
                  {on ? step.status : "Pending"}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <span aria-hidden className={cn("h-px shrink-0 bg-line", compact ? "w-2" : "w-3 sm:w-5", i < s && "bg-brand/50")} />
              )}
            </li>
          );
        })}
      </ol>

      <div
        className={cn(
          "min-w-0 rounded-3xl border transition-all duration-500",
          compact ? "p-3" : "p-4",
          continuing ? "border-ok-line bg-ok-bg" : "border-line-soft bg-surface opacity-50",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <p className={cn("text-[11px] font-bold uppercase tracking-[0.12em]", continuing ? "text-ok" : "text-muted")}>
            Phone + bike continue
          </p>
          <SimLabel>Demo</SimLabel>
        </div>
        <ul className={cn("mt-2.5 grid gap-1.5", !compact && "sm:grid-cols-2 sm:gap-2")}>
          {CONTINUES.map((c) => (
            <li key={c.label} className={cn("flex min-w-0 items-center gap-2.5 rounded-xl bg-white", compact ? "px-2.5 py-2" : "px-3 py-2.5")}>
              <c.icon className="size-4 shrink-0 text-navy" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-bold leading-tight text-navy">{c.label}</span>
                {!compact && <span className="block truncate text-[11px] text-muted">{c.detail}</span>}
              </span>
              <span
                className={cn(
                  "flex shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-wider",
                  !continuing ? "text-muted" : c.status === "ACTIVE" ? "text-brand-600" : "text-ok",
                )}
              >
                {continuing ? (
                  <>
                    <Check className="size-3.5" strokeWidth={3} aria-hidden />
                    {c.status}
                  </>
                ) : (
                  "Standby"
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

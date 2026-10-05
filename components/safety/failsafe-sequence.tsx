import { ArrowRight, Check, Database, MapPin, Motorbike, Siren, Unplug, Zap } from "lucide-react";
import { HelmetIcon } from "@/components/brand/icons";
import { cn } from "@/lib/utils/cn";

const CONTINUES = [
  { label: "Phone buffer", icon: Database, detail: "30 s pre-impact window" },
  { label: "Bike sensor", icon: Motorbike, detail: "IMU + speed" },
  { label: "GPS", icon: MapPin, detail: "Location fix" },
  { label: "Emergency workflow", icon: Siren, detail: "Runs on phone" },
];

/**
 * "The helmet does not need to survive the crash."
 * `stage`: 0 helmet streaming · 1 impact · 2 connection lost · 3 phone + bike continue.
 */
export function FailSafeSequence({ stage = 3, compact = false }: { stage?: number; compact?: boolean }) {
  return (
    <div className={cn("grid gap-4", !compact && "lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center")}>
      <ol className="flex items-center gap-2" aria-label="Helmet sequence">
        {[
          { label: "Helmet", icon: <HelmetIcon className="size-5" />, on: stage >= 0, tone: "navy" },
          { label: "Impact", icon: <Zap className="size-5" />, on: stage >= 1, tone: "warn" },
          { label: "Connection lost", icon: <Unplug className="size-5" />, on: stage >= 2, tone: "crit" },
        ].map((s, i) => (
          <li key={s.label} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex flex-1 flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center transition-all duration-500",
                !s.on && "border-line-soft opacity-35",
                s.on && s.tone === "navy" && "border-line bg-white text-navy",
                s.on && s.tone === "warn" && "border-warn-line bg-warn-bg text-warn",
                s.on && s.tone === "crit" && "border-crit-line bg-crit-bg text-crit",
              )}
            >
              {s.icon}
              <span className="text-[11px] font-bold leading-tight">{s.label}</span>
            </div>
            {i < 2 && <ArrowRight className="size-4 shrink-0 text-muted" aria-hidden />}
          </li>
        ))}
      </ol>
      <div className={cn("rounded-3xl border border-ok-line bg-ok-bg p-4 transition-opacity duration-500", stage < 3 && "opacity-30")}>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ok">Phone + bike continue response</p>
        <ul className={cn("mt-3 grid gap-2", compact ? "grid-cols-1" : "grid-cols-2")}>
          {CONTINUES.map((c) => (
            <li key={c.label} className="flex items-center gap-2.5 rounded-xl bg-white px-3 py-2.5">
              <c.icon className="size-4 shrink-0 text-navy" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-bold text-navy">{c.label}</span>
                {!compact && <span className="block truncate text-[11px] text-muted">{c.detail}</span>}
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-ok">
                <Check className="size-3.5" strokeWidth={3} aria-hidden />
                {c.label === "Emergency workflow" ? "Active" : "Available"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

import { Check, Loader2, X, AlertTriangle, LockOpen, Lock } from "lucide-react";
import { SimLabel } from "@/components/ui/primitives";
import type { ReadinessCheck } from "@/lib/engine/readiness";
import { cn } from "@/lib/utils/cn";

/**
 * Presentational, animated checklist. `revealed` controls how many checks
 * have completed; the next one shows a spinner.
 */
export function PrecheckList({ checks, revealed }: { checks: ReadinessCheck[]; revealed: number }) {
  return (
    <ol className="space-y-2" aria-label="Pre-ride safety checks">
      {checks.map((c, i) => {
        const done = i < revealed;
        const running = i === revealed;
        const failed = done && !c.passed;
        const warn = failed && !c.essential;
        return (
          <li
            key={c.id}
            className={cn(
              "flex items-center gap-3 rounded-2xl border px-3.5 py-3 transition-colors duration-300",
              !done && !running && "border-line-soft bg-white opacity-55",
              running && "border-brand-100 bg-brand-50",
              done && c.passed && "border-line-soft bg-white",
              failed && !warn && "border-crit-line bg-crit-bg",
              warn && "border-warn-line bg-warn-bg",
            )}
          >
            <span
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-full transition-colors",
                done && c.passed && "bg-ok text-white",
                failed && !warn && "bg-crit-strong text-white",
                warn && "bg-[#f79009] text-white",
                !done && "bg-line-soft text-muted",
              )}
              aria-hidden
            >
              {done ? (
                c.passed ? <Check className="size-4" strokeWidth={3} /> : warn ? <AlertTriangle className="size-4" /> : <X className="size-4" strokeWidth={3} />
              ) : running ? (
                <Loader2 className="size-4 animate-spin text-brand" />
              ) : (
                <span className="text-xs font-bold">{i + 1}</span>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-navy">{c.label}</span>
              <span className="block text-xs text-muted">
                {done ? (failed ? c.fix : c.detail) : running ? "Checking…" : "Waiting"}
              </span>
            </span>
            <span className="sr-only">{done ? (c.passed ? "passed" : "failed") : running ? "checking" : "pending"}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function StartPermission({ enabled, compact = false }: { enabled: boolean; compact?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        enabled ? "border-ok-line bg-ok-bg" : "border-crit-line bg-crit-bg",
      )}
      role="status"
    >
      <div className="flex items-center gap-3">
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl text-white", enabled ? "bg-ok" : "bg-crit-strong")}>
          {enabled ? <LockOpen className="size-5" aria-hidden /> : <Lock className="size-5" aria-hidden />}
        </span>
        <div className="min-w-0">
          <p className={cn("font-[family-name:var(--font-display)] text-[15px] font-extrabold tracking-wide", enabled ? "text-ok" : "text-crit")}>
            {enabled ? "START PERMISSION ENABLED" : "START PERMISSION BLOCKED"}
          </p>
          {!compact && (
            <p className="text-xs text-body">
              {enabled ? "Bike module may enable ignition." : "Bike module keeps ignition interlock open."}
            </p>
          )}
        </div>
        <SimLabel className="ml-auto">Simulated</SimLabel>
      </div>
      {!compact && (
        <p className="mt-3 border-t border-black/5 pt-3 text-[11px] leading-relaxed text-muted">
          Prototype: this page only simulates the permission signal. In hardware, an ESP32 on the bike module drives an
          ignition-enable relay — the browser never controls the motorcycle.
        </p>
      )}
    </div>
  );
}

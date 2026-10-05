import { HeartHandshake, PhoneCall } from "lucide-react";
import { SimLabel } from "@/components/ui/primitives";
import { cn } from "@/lib/utils/cn";

/** "Are you okay?" screen. Presentational — the parent owns the countdown. */
export function RiderCheckScreen({
  remaining,
  total,
  confidencePct,
  onOk,
  onHelp,
  className,
}: {
  remaining: number;
  total: number;
  confidencePct: number;
  onOk?: () => void;
  onHelp?: () => void;
  className?: string;
}) {
  const r = 70;
  const c = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, remaining / total));
  return (
    <div className={cn("flex h-full flex-col bg-white", className)} role="alertdialog" aria-labelledby="rc-title" aria-describedby="rc-desc">
      <div className="bg-crit-bg px-5 pb-5 pt-6 text-center">
        <div className="flex justify-center gap-2">
          <span className="rounded-full bg-crit-strong px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
            Possible severe crash · {confidencePct}%
          </span>
        </div>
        <h2 id="rc-title" className="mt-4 text-3xl font-extrabold text-navy">
          Are you okay?
        </h2>
        <p id="rc-desc" className="mt-1 text-sm text-body">
          If you don’t respond, RYVORA will start the emergency workflow.
        </p>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-5">
        <div className="relative grid size-44 place-items-center" aria-live="assertive" aria-atomic>
          <svg viewBox="0 0 160 160" className="absolute inset-0 -rotate-90" aria-hidden>
            <circle cx="80" cy="80" r={r} fill="none" stroke="var(--color-crit-bg)" strokeWidth="10" />
            <circle
              cx="80"
              cy="80"
              r={r}
              fill="none"
              stroke="var(--color-crit-strong)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c * (1 - frac)}
              style={{ transition: "stroke-dashoffset 250ms linear" }}
            />
          </svg>
          <div className="text-center">
            <div className="font-[family-name:var(--font-display)] text-6xl font-extrabold text-navy tabular">{Math.ceil(remaining)}</div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">seconds</div>
          </div>
        </div>
      </div>
      <div className="grid gap-3 px-5 pb-6">
        <button
          type="button"
          onClick={onOk}
          className="flex h-16 items-center justify-center gap-2 rounded-2xl bg-ok font-[family-name:var(--font-display)] text-lg font-extrabold tracking-wide text-white hover:brightness-110"
        >
          <HeartHandshake className="size-5" aria-hidden /> I’M OKAY
        </button>
        <button
          type="button"
          onClick={onHelp}
          className="flex h-16 items-center justify-center gap-2 rounded-2xl bg-crit-strong font-[family-name:var(--font-display)] text-lg font-extrabold tracking-wide text-white hover:bg-crit"
        >
          <PhoneCall className="size-5" aria-hidden /> NEED HELP
        </button>
        <p className="text-center">
          <SimLabel>Demo countdown</SimLabel>
        </p>
      </div>
    </div>
  );
}

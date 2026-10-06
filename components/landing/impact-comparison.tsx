import Link from "next/link";
import { ArrowRight, CircleCheck, OctagonAlert } from "lucide-react";
import { Badge, SimLabel } from "@/components/ui/primitives";
import { assessEvent, confidencePct } from "@/lib/engine/crash-confidence";
import { getScenario } from "@/lib/simulation/scenarios";
import type { CrashAssessment } from "@/lib/types/events";
import { cn } from "@/lib/utils/cn";
import { DeviceIcon } from "./device-icon";
import { classificationLabel, keySignalRows, outcomeFor, type KeySignalRow } from "@/lib/engine/key-signals";

function SignalValue({ row }: { row: KeySignalRow | undefined }) {
  if (!row || !row.available) return <span className="text-xs font-semibold text-muted">—</span>;
  if (row.kind === "measure") return <span className="text-sm font-bold text-navy tabular">{row.value}</span>;
  return <Badge tone={row.tone}>{row.value}</Badge>;
}

function OutcomeCell({ assessment }: { assessment: CrashAssessment }) {
  const o = outcomeFor(assessment);
  const ok = o.tone === "success";
  return (
    <span
      className={cn(
        "flex flex-col items-start gap-1 rounded-xl px-2 py-2 text-[10px] font-bold uppercase leading-tight tracking-[0.04em] sm:flex-row sm:gap-1.5 sm:px-2.5 sm:text-xs",
        ok ? "bg-ok-bg text-ok" : o.tone === "critical" ? "bg-crit-bg text-crit" : "bg-warn-bg text-warn",
      )}
    >
      {ok ? <CircleCheck className="mt-px size-3.5 shrink-0" aria-hidden /> : <OctagonAlert className="mt-px size-3.5 shrink-0" aria-hidden />}
      {o.title}
    </span>
  );
}

/** Helmet drop vs real crash: same helmet impact, different verdict. */
export function ImpactComparison() {
  const drop = getScenario("helmet-drop");
  const crash = getScenario("severe-crash");
  if (!drop || !crash) return null;

  const a = assessEvent(drop.input);
  const b = assessEvent(crash.input);
  const rowsA = keySignalRows(a);
  const rowsB = keySignalRows(b);
  const cell = "border-t border-line-soft px-2 py-2.5 align-middle sm:px-3";

  return (
    <section id="verification" aria-labelledby="verification-title" className="scroll-mt-20 border-y border-line-soft bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center lg:gap-14 lg:py-24">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Verification</p>
          <h2 id="verification-title" className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">
            Impact does not always mean accident.
          </h2>
          <p className="mt-4 leading-relaxed text-body">
            A dropped helmet and a real crash can both register a high helmet impact. RYVORA cross-checks the bike and the phone before it decides.
          </p>
          <p className="mt-6 font-[family-name:var(--font-display)] text-lg font-bold text-navy">Multiple devices. One verified decision.</p>
          <Link
            href="/safety"
            className="mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-lg text-sm font-semibold text-brand-600 hover:text-navy"
          >
            Try every scenario in the Safety lab
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        <figure className="rounded-3xl border border-line bg-white p-2 shadow-[var(--shadow-card)] sm:p-4">
          <table className="w-full table-fixed border-separate border-spacing-0 text-left text-sm">
            <caption className="sr-only">Key signals and outcome for a helmet drop compared with a real crash (simulated data)</caption>
            <colgroup>
              <col className="w-[34%] sm:w-[38%]" />
              <col className="w-[33%] sm:w-[31%]" />
              <col className="w-[33%] sm:w-[31%]" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col" className="px-2 pb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted sm:px-3">
                  Signal
                </th>
                <th scope="col" className="px-2 pb-3 font-[family-name:var(--font-display)] font-bold text-navy sm:px-3">
                  {drop.label}
                </th>
                <th scope="col" className="px-2 pb-3 font-[family-name:var(--font-display)] font-bold text-navy sm:px-3">
                  Real crash
                </th>
              </tr>
            </thead>
            <tbody>
              {rowsA.map((row) => (
                <tr key={row.id}>
                  <th scope="row" className={cn(cell, "font-semibold text-navy")}>
                    <span className="flex items-center gap-2">
                      <span className="hidden text-muted min-[400px]:inline">
                        <DeviceIcon device={row.device} />
                      </span>
                      <span className="text-[13px] leading-tight">{row.label}</span>
                    </span>
                  </th>
                  <td className={cell}>
                    <SignalValue row={row} />
                  </td>
                  <td className={cell}>
                    <SignalValue row={rowsB.find((r) => r.id === row.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" className={cn(cell, "border-line text-xs font-semibold text-muted")}>
                  Classification
                </th>
                {[a, b].map((x) => (
                  <td key={x.eventClass} className={cn(cell, "border-line")}>
                    <span className="block text-[13px] font-extrabold leading-tight text-navy">{classificationLabel(x)}</span>
                    <span className="block text-xs text-muted tabular">{confidencePct(x)}% confidence</span>
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row" className={cn(cell, "text-xs font-semibold text-muted")}>
                  Outcome
                </th>
                <td className={cell}>
                  <OutcomeCell assessment={a} />
                </td>
                <td className={cell}>
                  <OutcomeCell assessment={b} />
                </td>
              </tr>
            </tfoot>
          </table>
          <figcaption className="flex flex-wrap items-center justify-between gap-2 px-2 pt-3 text-xs text-muted sm:px-3">
            <span>Computed by the RYVORA crash confidence engine.</span>
            <SimLabel>Simulated sensor data</SimLabel>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

import { ChevronDown, Table2 } from "lucide-react";
import type { TelemetrySample } from "@/lib/types/telemetry";
import { cn } from "@/lib/utils/cn";
import { DASH, fmt, fmtT } from "@/lib/utils/format";
import { CHANNELS } from "./incident-model";

/**
 * Table view of the black-box window — the screen-reader / no-hover twin of the charts.
 * Missing values (e.g. helmet after link loss) render as an em dash with an accessible label.
 */
export function SensorDataTable({ rows, highlightT = 0, className }: { rows: TelemetrySample[]; highlightT?: number; className?: string }) {
  return (
    <details className={cn("group rounded-2xl border border-line bg-white", className)}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-navy hover:bg-brand-50 [&::-webkit-details-marker]:hidden">
        <Table2 className="size-4 text-brand-600" aria-hidden />
        Sensor data table
        <span className="font-normal text-muted">· {rows.length} rows</span>
        <ChevronDown className="ml-auto size-4 text-muted transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="max-h-96 overflow-auto border-t border-line-soft">
        <table className="w-full min-w-[560px] text-left text-xs tabular">
          <caption className="sr-only">Synchronized sensor values per instant, relative to impact (T = 0). Simulated data.</caption>
          <thead className="sticky top-0 bg-surface text-[11px] uppercase tracking-wider text-muted">
            <tr>
              <th scope="col" className="px-4 py-2 font-semibold">Time</th>
              {CHANNELS.map((c) => (
                <th key={c.key} scope="col" className="px-3 py-2 text-right font-semibold">
                  {c.short} <span className="normal-case tracking-normal">({c.unit})</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const key = Math.abs(r.t - highlightT) < 1e-6;
              return (
                <tr key={r.t} className={cn("border-t border-line-soft", key && "bg-crit-bg")}>
                  <th scope="row" className={cn("whitespace-nowrap px-4 py-1.5 font-semibold", key ? "text-crit" : "text-navy")}>
                    {fmtT(r.t)}
                  </th>
                  {CHANNELS.map((c) => {
                    const v = r[c.key];
                    return (
                      <td key={c.key} className="px-3 py-1.5 text-right text-body">
                        {v === null ? (
                          <>
                            <span aria-hidden className="text-muted">{DASH}</span>
                            <span className="sr-only">Unavailable</span>
                          </>
                        ) : (
                          fmt(v, c.digits)
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </details>
  );
}

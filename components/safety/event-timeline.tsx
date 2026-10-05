import type { TimelineEntry } from "@/lib/types/events";
import { cn } from "@/lib/utils/cn";
import { fmtT } from "@/lib/utils/format";

const DOT: Record<string, string> = { neutral: "bg-muted", info: "bg-brand", warning: "bg-[#f79009]", critical: "bg-crit-strong", success: "bg-[#12b76a]" };

export function EventTimeline({ entries, horizontal = false }: { entries: TimelineEntry[]; horizontal?: boolean }) {
  return (
    <ol className={cn(horizontal ? "lg:grid lg:auto-cols-fr lg:grid-flow-col lg:gap-3" : "", "space-y-0")}>
      {entries.map((e, i) => (
        <li key={i} className={cn("relative flex gap-3 pb-4", horizontal && "lg:flex-col lg:gap-2 lg:pb-0")}>
          <span className="flex flex-col items-center" aria-hidden>
            <span className={cn("mt-1 size-3 rounded-full ring-4 ring-white", DOT[e.tone ?? "neutral"])} />
            {i < entries.length - 1 && <span className={cn("w-px flex-1 bg-line", horizontal && "lg:hidden")} />}
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-muted tabular">{fmtT(e.t)}</span>
            <span className="block text-sm font-bold text-navy">{e.title}</span>
            {e.detail && <span className="block text-xs text-muted">{e.detail}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

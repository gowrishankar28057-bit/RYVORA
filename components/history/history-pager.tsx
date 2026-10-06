import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HistoryEntry } from "@/data/rides";
import { cn } from "@/lib/utils/cn";
import { fmtIstShort } from "./history-model";

function PagerLink({ entry, dir }: { entry: HistoryEntry | null; dir: "newer" | "older" }) {
  const newer = dir === "newer";
  const Icon = newer ? ChevronLeft : ChevronRight;
  const base = "flex min-h-16 min-w-0 flex-1 items-center gap-3 rounded-2xl border p-3.5";
  if (!entry) {
    return (
      <div
        className={cn(base, "hidden border-dashed border-line text-sm text-muted sm:flex", !newer && "justify-end text-right")}
        aria-hidden
      >
        {newer ? "This is the newest entry" : "This is the oldest entry"}
      </div>
    );
  }
  return (
    <Link
      href={`/history/${entry.id}`}
      rel={newer ? "prev" : "next"}
      className={cn(base, "group border-line bg-white transition-colors hover:border-brand", !newer && "flex-row-reverse text-right")}
    >
      <Icon className="size-5 shrink-0 text-muted transition-colors group-hover:text-brand-600" aria-hidden />
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{newer ? "Newer" : "Older"}</span>
        <span className="block truncate text-sm font-bold text-navy">{entry.title}</span>
        <span className="block truncate text-xs text-muted">{fmtIstShort(entry.occurredAt)}</span>
      </span>
    </Link>
  );
}

/** Newer / older navigation through the (newest-first) history list. */
export function HistoryPager({ newer, older }: { newer: HistoryEntry | null; older: HistoryEntry | null }) {
  return (
    <nav aria-label="More history" className="flex flex-col gap-3 sm:flex-row">
      <PagerLink entry={newer} dir="newer" />
      <PagerLink entry={older} dir="older" />
    </nav>
  );
}

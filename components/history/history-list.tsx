"use client";

import { useState } from "react";
import { Inbox } from "lucide-react";
import type { HistoryEntry } from "@/data/rides";
import { EventCard } from "./event-card";
import { filterHistory, groupByIstDay, HISTORY_FILTERS, type HistoryFilter } from "./history-model";
import { SegmentedControl } from "@/components/ui/segmented-control";

/** Filterable, day-grouped history list. */
export function HistoryList({ entries }: { entries: HistoryEntry[] }) {
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const visible = filterHistory(entries, filter);
  const days = groupByIstDay(visible);
  const active = HISTORY_FILTERS.find((f) => f.value === filter) ?? HISTORY_FILTERS[0];
  const noun = active.noun[visible.length === 1 ? 0 : 1];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <SegmentedControl
          label="Filter history"
          value={filter}
          onChange={setFilter}
          options={HISTORY_FILTERS.map((f) => ({ value: f.value, label: f.label, count: filterHistory(entries, f.value).length }))}
          className="w-full sm:w-auto"
        />
        <p className="text-xs font-semibold text-muted" aria-live="polite" aria-atomic>
          Showing {visible.length} {noun} · times in IST
        </p>
      </div>

      {days.length === 0 ? (
        <div className="grid place-items-center rounded-3xl border border-dashed border-line bg-white px-6 py-12 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-surface text-muted">
            <Inbox className="size-6" aria-hidden />
          </span>
          <p className="mt-3 font-[family-name:var(--font-display)] text-base font-bold text-navy">No {active.noun[1]} yet</p>
          <p className="mt-1 max-w-xs text-sm text-muted">Rides you record and events RYVORA verifies will appear here.</p>
          {filter !== "all" && (
            <button
              type="button"
              onClick={() => setFilter("all")}
              className="mt-4 h-11 rounded-xl border border-line bg-white px-4 text-sm font-semibold text-navy hover:border-brand hover:bg-brand-50"
            >
              Show everything
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {days.map((day) => (
            <section key={day.key} aria-labelledby={`day-${day.key}`}>
              {/* Global h2 styles are unlayered, so colour / tracking live on the spans. */}
              <h2 id={`day-${day.key}`} className="mb-2 flex items-baseline justify-between gap-3 px-1 text-xs font-semibold">
                <span className="uppercase tracking-[0.14em] text-muted">{day.label}</span>
                <span className="font-sans font-medium text-muted">
                  {day.entries.length} {day.entries.length === 1 ? "item" : "items"}
                </span>
              </h2>
              <ul className="space-y-2">
                {day.entries.map((e) => (
                  <EventCard key={e.id} event={e} timeOnly />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

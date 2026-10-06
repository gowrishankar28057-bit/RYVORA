import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BrainCircuit } from "lucide-react";
import { HistoryList } from "@/components/history/history-list";
import { summarizeHistory } from "@/components/history/history-model";
import { HistorySummaryStrip } from "@/components/history/history-summary";
import { Card, CardHeader, PageHeader, SimLabel } from "@/components/ui/primitives";
import { RIDE_HISTORY } from "@/data/rides";

export const metadata: Metadata = {
  title: "History",
  description: "Previous rides and verified safety events, with the evidence behind each decision. Simulated data.",
};

export default function HistoryPage() {
  const summary = summarizeHistory(RIDE_HISTORY);
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        kicker="History"
        title="Rides & safety events"
        description="Every ride and every event RYVORA verified. Open one to see the sensor evidence and what happened next."
        action={<SimLabel>Simulated data</SimLabel>}
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-[auto_1fr] lg:gap-x-8 lg:gap-y-5">
        <section aria-label="Summary" className="lg:col-start-2 lg:row-start-1">
          <HistorySummaryStrip summary={summary} />
        </section>

        <div className="min-w-0 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <HistoryList entries={RIDE_HISTORY} />
        </div>

        <Card className="p-5 lg:col-start-2 lg:row-start-2 lg:self-start">
          <CardHeader kicker="How it works" title="Every event is verified" />
          <div className="mt-3 flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-navy text-white">
              <BrainCircuit className="size-5" aria-hidden />
            </span>
            <p className="text-sm leading-relaxed text-body">
              Each event is re-scored by the crash confidence engine from helmet, bike and phone signals — the confidence and response you
              see are computed, not stored labels.
            </p>
          </div>
          <p className="mt-3 rounded-2xl bg-ok-bg p-3 text-xs leading-relaxed text-ok">
            <strong className="font-bold">False trigger rejected</strong> means one sensor saw a spike a simple threshold would treat as a
            crash — a dropped helmet, a parked-bike fall or a pothole — and fusion confirmed it was not.
          </p>
          <Link
            href="/safety"
            className="mt-4 inline-flex h-11 items-center gap-1.5 rounded-xl text-sm font-semibold text-brand-600 hover:underline"
          >
            Try the crash engine <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Card>
      </div>
    </div>
  );
}

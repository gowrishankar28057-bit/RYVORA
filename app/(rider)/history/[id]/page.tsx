import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, FileSearch, MapPin, Route, ShieldCheck } from "lucide-react";
import { EventCard } from "@/components/history/event-card";
import { EventSensorChart } from "@/components/history/event-sensor-chart";
import { EvidenceCard } from "@/components/history/evidence-card";
import { HistoryPager } from "@/components/history/history-pager";
import {
  adjacentEntries,
  assessEntry,
  defaultChannelFor,
  fmtIstDateTime,
  fmtIstShort,
  rideStats,
} from "@/components/history/history-model";
import { ResponseCard } from "@/components/history/response-card";
import { RideStatsGrid } from "@/components/history/ride-stats";
import { VerdictCard } from "@/components/safety/crash-confidence-panel";
import { EventTimeline } from "@/components/safety/event-timeline";
import { RiskBadge } from "@/components/safety/risk-badge";
import { ButtonLink, Card, CardHeader, PageHeader, SimLabel } from "@/components/ui/primitives";
import { getEventsForRide, getRideEvent, RIDE_HISTORY, type HistoryEntry } from "@/data/rides";
import { assessEvent, confidencePct, EVENT_LABELS } from "@/lib/engine/crash-confidence";
import { getScenario } from "@/lib/simulation/scenarios";
import { downsample } from "@/lib/simulation/series";
import type { CrashAssessment, ScenarioDefinition } from "@/lib/types/events";
import type { TelemetrySample } from "@/lib/types/telemetry";

/** Every history entry is known at build time; anything else is a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return RIDE_HISTORY.map((e) => ({ id: e.id }));
}

export async function generateMetadata(props: PageProps<"/history/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const entry = getRideEvent(id);
  if (!entry) return { title: "Not found" };
  return {
    title: `${entry.title} · ${fmtIstShort(entry.occurredAt)}`,
    description: `${entry.kind === "ride" ? "Ride" : "Safety event"}: ${entry.subtitle}. ${entry.locationLabel}. Simulated data.`,
  };
}

export default async function HistoryDetailPage(props: PageProps<"/history/[id]">) {
  const { id } = await props.params;
  const entry = getRideEvent(id);
  const scenario = entry ? getScenario(entry.scenarioId) : undefined;
  if (!entry || !scenario) notFound();

  const { newer, older } = adjacentEntries(RIDE_HISTORY, entry.id);
  const parentRide = entry.rideId ? getRideEvent(entry.rideId) : undefined;
  // 10 Hz is plenty for a chart and keeps the T = 0 impact samples.
  const samples = downsample(scenario.series(), 2);
  const assessment = assessEntry(entry);

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/history"
        className="-ml-1 mb-2 inline-flex h-11 items-center gap-1.5 rounded-xl px-1 text-sm font-semibold text-brand-600 hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden /> All history
      </Link>

      <PageHeader
        kicker={entry.kind === "ride" ? "Ride" : "Safety event"}
        title={entry.title}
        description={
          <span className="flex flex-col gap-1 text-sm sm:flex-row sm:flex-wrap sm:gap-x-5">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4 shrink-0 text-muted" aria-hidden />
              <time dateTime={entry.occurredAt}>{fmtIstDateTime(entry.occurredAt)}</time>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4 shrink-0 text-muted" aria-hidden />
              {entry.locationLabel}
            </span>
            {parentRide && (
              <span className="inline-flex items-center gap-1.5">
                <Route className="size-4 shrink-0 text-muted" aria-hidden />
                During{" "}
                <Link href={`/history/${parentRide.id}`} className="font-semibold text-brand-600 hover:underline">
                  {parentRide.title.toLowerCase()} ({parentRide.subtitle})
                </Link>
              </span>
            )}
          </span>
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <RiskBadge risk={entry.risk} />
            <SimLabel>Simulated data</SimLabel>
          </div>
        }
      />

      <div className="space-y-5">
        {entry.kind === "ride" ? (
          <RideDetail entry={entry} scenario={scenario} samples={samples} />
        ) : assessment ? (
          <EventDetail entry={entry} scenario={scenario} samples={samples} assessment={assessment} />
        ) : null}

        <HistoryPager newer={newer} older={older} />
      </div>
    </div>
  );
}

function ChartCard({
  samples,
  assessment,
  title,
  note,
}: {
  samples: TelemetrySample[];
  assessment: CrashAssessment | null;
  title: string;
  note: string;
}) {
  return (
    <Card className="min-w-0 p-5">
      <CardHeader kicker="Black box" title={title} action={<SimLabel />} />
      <p className="mt-1 text-xs text-muted">{note}</p>
      <div className="mt-4">
        <EventSensorChart samples={samples} initialChannel={defaultChannelFor(assessment?.eventClass)} />
      </div>
    </Card>
  );
}

function EventDetail({
  entry,
  scenario,
  samples,
  assessment,
}: {
  entry: HistoryEntry;
  scenario: ScenarioDefinition;
  samples: TelemetrySample[];
  assessment: CrashAssessment;
}) {
  const severe = assessment.eventClass === "SEVERE_CRASH";
  return (
    <>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
        <div className="space-y-5">
          <VerdictCard assessment={assessment} />
          {severe && (
            <section aria-labelledby="recon-cta" className="rounded-3xl bg-navy p-5 text-white shadow-[var(--shadow-lift)]">
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/10">
                  <FileSearch className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  {/* Global h2 colour is unlayered; the span carries the white text. */}
                  <h2 id="recon-cta" className="text-lg font-extrabold">
                    <span className="text-white">Full crash reconstruction</span>
                  </h2>
                  <p className="mt-1 text-sm text-white/75">
                    Synchronised helmet, bike and phone charts, the incident summary and an explanation of the {confidencePct(assessment)}%
                    confidence.
                  </p>
                </div>
              </div>
              <ButtonLink href="/reconstruction" variant="primary" size="lg" className="mt-4 w-full sm:w-auto">
                Open reconstruction <ArrowRight className="size-5" aria-hidden />
              </ButtonLink>
            </section>
          )}
          <ResponseCard assessment={assessment} outcome={entry.outcome} />
        </div>
        <EvidenceCard assessment={assessment} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
        <Card className="p-5">
          <CardHeader kicker="Digital black box" title="Event timeline" />
          <p className="mt-1 mb-4 text-xs text-muted">
            Seconds relative to the primary event · {EVENT_LABELS[assessment.eventClass].toLowerCase()}.
          </p>
          <EventTimeline entries={scenario.timeline} />
        </Card>
        <ChartCard
          samples={samples}
          assessment={assessment}
          title="Sensor window"
          note="From the phone’s rolling pre-event buffer · T = 0 is the primary event."
        />
      </div>
    </>
  );
}

function RideDetail({ entry, scenario, samples }: { entry: HistoryEntry; scenario: ScenarioDefinition; samples: TelemetrySample[] }) {
  const events = getEventsForRide(entry.id);
  const check = assessEvent(scenario.input);
  return (
    <>
      <RideStatsGrid stats={rideStats(entry)} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
        <Card className="p-5">
          <CardHeader
            kicker="Safety"
            title="Events on this ride"
            action={<span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-navy tabular">{events.length}</span>}
          />
          {events.length === 0 ? (
            <div className="mt-4 flex gap-3 rounded-2xl border border-ok-line bg-ok-bg p-4">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-ok" aria-hidden />
              <div>
                <p className="font-[family-name:var(--font-display)] font-bold text-navy">No events</p>
                <p className="mt-0.5 text-sm text-body">
                  No safety events were recorded on this ride. Engine check on the sampled window:{" "}
                  {EVENT_LABELS[check.eventClass].toLowerCase()} ({confidencePct(check)}% confidence).
                </p>
              </div>
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {events.map((e) => (
                <EventCard key={e.id} event={e} timeOnly />
              ))}
            </ul>
          )}
          <dl className="mt-4 rounded-2xl bg-surface p-3.5 text-sm">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Route</dt>
            <dd className="mt-0.5 font-semibold text-navy">
              {entry.subtitle} · {entry.locationLabel}
            </dd>
          </dl>
        </Card>
        <ChartCard
          samples={samples}
          assessment={null}
          title="Sample ride window"
          note="A 22-second sample from the phone’s rolling buffer during this ride."
        />
      </div>
    </>
  );
}

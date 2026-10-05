import Link from "next/link";
import { notFound } from "next/navigation";
import { CrashConfidencePanel } from "@/components/safety/crash-confidence-panel";
import { EventTimeline } from "@/components/safety/event-timeline";
import { buttonClass, Card, PageHeader, SimLabel } from "@/components/ui/primitives";
import { getRideEvent, RIDE_HISTORY } from "@/data/rides";
import { assessEvent } from "@/lib/engine/crash-confidence";
import { getScenario } from "@/lib/simulation/scenarios";
import { fmtDateTime } from "@/lib/utils/format";

export function generateStaticParams() { return RIDE_HISTORY.map((e) => ({ id: e.id })); }

export default async function EventPage(props: PageProps<"/history/[id]">) {
  const { id } = await props.params;
  const event = getRideEvent(id);
  const scenario = event ? getScenario(event.scenarioId) : undefined;
  if (!event || !scenario) notFound();
  const a = assessEvent(scenario.input);
  return (
    <div className="space-y-5">
      <PageHeader kicker={fmtDateTime(event.occurredAt)} title={event.title} description={`${event.locationLabel} · ${event.outcome}`} action={<SimLabel />} />
      {event.kind === "event" && <Card className="p-4 sm:p-6"><CrashConfidencePanel assessment={a} /></Card>}
      <Card className="p-5"><EventTimeline entries={scenario.timeline} /></Card>
      {event.scenarioId === "severe-crash" && <Link href="/reconstruction" className={buttonClass("primary", "lg")}>Open full reconstruction</Link>}
    </div>
  );
}

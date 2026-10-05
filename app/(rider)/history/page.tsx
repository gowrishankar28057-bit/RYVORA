import type { Metadata } from "next";
import { EventCard } from "@/components/history/event-card";
import { PageHeader } from "@/components/ui/primitives";
import { RIDE_HISTORY } from "@/data/rides";
export const metadata: Metadata = { title: "History" };
export default function HistoryPage() {
  return (<div className="mx-auto max-w-3xl"><PageHeader kicker="History" title="Rides & safety events" /><ul className="space-y-2">{RIDE_HISTORY.map((e) => <EventCard key={e.id} event={e} />)}</ul></div>);
}

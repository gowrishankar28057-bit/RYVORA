import { Check, FileArchive, MapPin, MessageSquareText, PhoneOutgoing } from "lucide-react";
import { Kicker, PhoneStage, revealClass } from "@/components/jury/stage";
import { EmergencyWorkflow } from "@/components/safety/emergency-workflow";
import { Card, CardHeader, SimLabel } from "@/components/ui/primitives";
import { INCIDENT, RIDER } from "@/data/rider";
import { BUFFER_SECONDS, CRASH_PCT } from "@/lib/jury/demo-data";
import { emergencyCompleted } from "@/lib/jury/timeline";
import { cn } from "@/lib/utils/cn";

const contact = RIDER.contacts.find((c) => c.primary) ?? RIDER.contacts[0];

/** Same order as the phone workflow; wording matches the jury script. */
const OUTCOMES = [
  { title: "Location attached", icon: MapPin },
  { title: "Emergency contact alerted", icon: PhoneOutgoing },
  { title: "Incident data prepared", icon: FileArchive },
];

const PACKAGE = [
  ["Classification", `Possible severe crash · ${CRASH_PCT}% confidence`],
  ["Location", `${INCIDENT.location.label} · ±${INCIDENT.location.accuracyM} m`],
  ["Black box", `${BUFFER_SECONDS} s before impact + 10 s after, all devices`],
  ["Devices", "Helmet link lost T+0.1 s · bike OK · phone OK"],
  ["Rider-entered notes", "Included as entered — not a medical record"],
] as const;

/** Step 7 — simulated emergency workflow. */
export function EmergencyStep({ ms }: { ms: number }) {
  const completed = emergencyCompleted(ms);
  return (
    <PhoneStage
      stepId="emergency"
      phoneLabel="Rider's phone: emergency workflow (simulated)"
      phone={<EmergencyWorkflow completed={completed} />}
      panel={
        <div className="space-y-4">
          <ul className="grid gap-2 sm:grid-cols-3">
            {OUTCOMES.map((o, i) => {
              const done = i < completed;
              return (
                <li
                  key={o.title}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border px-3.5 py-3 transition-colors duration-300",
                    done ? "border-ok-line bg-ok-bg" : "border-line bg-white",
                  )}
                >
                  <span className={cn("grid size-8 shrink-0 place-items-center rounded-xl", done ? "bg-ok text-white" : "bg-surface text-navy")}>
                    {done ? <Check className="size-4" strokeWidth={3} aria-hidden /> : <o.icon className="size-4" aria-hidden />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold leading-tight text-navy">{o.title}</span>
                    <SimLabel className="mt-1">{done ? "Simulation" : "Pending"}</SimLabel>
                  </span>
                </li>
              );
            })}
          </ul>

          <Card className={cn("p-5", revealClass(completed >= 2))} aria-hidden={completed < 2}>
            <CardHeader
              kicker={`To ${contact.name} (${contact.relation})`}
              title="Message preview"
              action={<SimLabel>Simulation · not sent</SimLabel>}
            />
            <div className="mt-4 flex gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <MessageSquareText className="size-4" aria-hidden />
              </span>
              <p className="rounded-2xl rounded-tl-md bg-surface px-4 py-3 text-sm leading-relaxed text-navy">
                RYVORA alert: a possible severe crash was detected for {RIDER.name}, who did not respond to a safety check.
                Approximate location: {INCIDENT.location.label}. Incident data attached.
              </p>
            </div>
          </Card>

          <Card className={cn("p-5", revealClass(completed >= 3))} aria-hidden={completed < 3}>
            <CardHeader kicker="Prepared on the phone" title="Incident data package" />
            <dl className="mt-3 divide-y divide-line-soft text-sm">
              {PACKAGE.map(([k, v]) => (
                <div key={k} className="grid gap-1 py-2 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-3">
                  <dt className="text-muted">{k}</dt>
                  <dd className="font-semibold text-navy">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Kicker className="normal-case tracking-normal">
            Demonstrated workflow. This prototype does not contact emergency services or hospitals and makes no medical
            assessment.
          </Kicker>
        </div>
      }
    />
  );
}

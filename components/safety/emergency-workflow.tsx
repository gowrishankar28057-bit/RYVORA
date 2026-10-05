import { Check, FileArchive, Loader2, MapPin, PhoneOutgoing, Siren } from "lucide-react";
import { SimLabel } from "@/components/ui/primitives";
import { RIDER } from "@/data/rider";
import { cn } from "@/lib/utils/cn";

export interface EmergencyStep {
  id: string;
  title: string;
  detail: string;
  icon: React.ReactNode;
}

export function emergencySteps(locationAvailable: boolean): EmergencyStep[] {
  const primary = RIDER.contacts.find((c) => c.primary) ?? RIDER.contacts[0];
  return [
    {
      id: "location",
      title: locationAvailable ? "Location acquired" : "Last known location attached",
      detail: locationAvailable ? "12.9352° N, 77.6245° E · ±6 m" : "GPS unavailable · using fix from 2 min ago",
      icon: <MapPin className="size-4" />,
    },
    {
      id: "contact",
      title: "Emergency contact notified",
      detail: `${primary.name} (${primary.relation}) · SMS + call`,
      icon: <PhoneOutgoing className="size-4" />,
    },
    {
      id: "package",
      title: "Incident package prepared",
      detail: "Black-box data, crash confidence, location",
      icon: <FileArchive className="size-4" />,
    },
  ];
}

/** Presentational emergency workflow. `completed` = number of finished steps. */
export function EmergencyWorkflow({
  completed,
  locationAvailable = true,
  className,
}: {
  completed: number;
  locationAvailable?: boolean;
  className?: string;
}) {
  const steps = emergencySteps(locationAvailable);
  return (
    <div className={cn("flex h-full flex-col bg-white", className)}>
      <div className="bg-navy px-5 pb-6 pt-6 text-white">
        <div className="flex items-center justify-between">
          <span className="grid size-11 place-items-center rounded-2xl bg-crit-strong">
            <Siren className="size-5" aria-hidden />
          </span>
          <SimLabel className="border-white/40 bg-white/10 text-white">Simulation · no real call sent</SimLabel>
        </div>
        <h2 className="mt-4 text-2xl font-extrabold leading-tight text-white">EMERGENCY RESPONSE ACTIVATED</h2>
        <p className="mt-1 text-sm text-white/70">No rider response. Escalating through the phone.</p>
      </div>
      <ol className="flex-1 space-y-2.5 p-5" aria-live="polite">
        {steps.map((s, i) => {
          const done = i < completed;
          const running = i === completed;
          return (
            <li
              key={s.id}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-3.5 py-3 transition-colors",
                done ? "border-ok-line bg-ok-bg" : running ? "border-brand-100 bg-brand-50" : "border-line-soft opacity-50",
              )}
            >
              <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", done ? "bg-ok text-white" : "bg-white text-navy")}>
                {done ? <Check className="size-4" strokeWidth={3} /> : running ? <Loader2 className="size-4 animate-spin text-brand" /> : s.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-navy">{s.title}</span>
                <span className="block text-xs text-muted">{s.detail}</span>
              </span>
            </li>
          );
        })}
      </ol>
      <p className="px-5 pb-5 text-[11px] leading-relaxed text-muted">
        Prototype workflow. RYVORA does not contact hospitals or emergency services in this demo, and does not make
        medical assessments.
      </p>
    </div>
  );
}

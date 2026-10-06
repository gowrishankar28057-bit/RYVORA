import { useId } from "react";
import { Check, FileArchive, Loader2, MapPin, PhoneOutgoing, Siren } from "lucide-react";
import { SimLabel } from "@/components/ui/primitives";
import { RIDER } from "@/data/rider";
import type { LastSeen } from "@/lib/simulation/telemetry-source";
import type { GeoFix, SystemSnapshot } from "@/lib/types/telemetry";
import { cn } from "@/lib/utils/cn";

export interface EmergencyStep {
  id: string;
  title: string;
  detail: string;
  icon: React.ReactNode;
}

/** The location attached to the (simulated) alert. */
export interface LocationAttachment {
  /** True when the fix is live (GPS locked); false when it is the last known fix. */
  live: boolean;
  fix: GeoFix | null;
  /** Age of the fix in seconds at the time of the incident; null when unknown. */
  ageSec: number | null;
}

/**
 * Pick the location to attach at the moment of an incident (pure).
 * GPS locked → live fix. Otherwise → the newest fix the phone remembers.
 */
export function locationAttachment(snapshot: SystemSnapshot, lastSeen: LastSeen): LocationAttachment {
  if (snapshot.phone.gps === "locked" && snapshot.phone.location) {
    return { live: true, fix: snapshot.phone.location, ageSec: 0 };
  }
  const now = snapshot.phone.timestamp ?? lastSeen.phoneAt;
  const at = lastSeen.locationAt;
  const ageSec = now !== null && at !== null && Number.isFinite(now - at) ? Math.max(0, (now - at) / 1000) : null;
  return { live: false, fix: lastSeen.location, ageSec: lastSeen.location ? ageSec : null };
}

export function formatFix(fix: GeoFix): string {
  const lat = `${Math.abs(fix.lat).toFixed(4)}° ${fix.lat >= 0 ? "N" : "S"}`;
  const lon = `${Math.abs(fix.lon).toFixed(4)}° ${fix.lon >= 0 ? "E" : "W"}`;
  return `${lat}, ${lon} · ±${Math.round(fix.accuracyM)} m`;
}

export function formatFixAge(ageSec: number | null): string {
  if (ageSec === null || !Number.isFinite(ageSec)) return "time unknown";
  if (ageSec < 60) return `${Math.max(1, Math.round(ageSec))} s ago`;
  if (ageSec < 3600) return `${Math.round(ageSec / 60)} min ago`;
  return `${Math.round(ageSec / 3600)} h ago`;
}

function locationStep(locationAvailable: boolean, location?: LocationAttachment): Pick<EmergencyStep, "title" | "detail"> {
  if (!location) {
    // Scripted demo values (jury mode / scenario playback).
    return locationAvailable
      ? { title: "Location attached", detail: "12.9352° N, 77.6245° E · ±6 m" }
      : { title: "Last known location attached", detail: "GPS unavailable · using fix from 2 min ago" };
  }
  if (location.live && location.fix) return { title: "Location attached", detail: formatFix(location.fix) };
  if (location.fix) {
    return {
      title: "Last known location attached",
      detail: `GPS unavailable · ${formatFix(location.fix)} · fix from ${formatFixAge(location.ageSec)}`,
    };
  }
  return { title: "Location unavailable", detail: "No GPS fix recorded yet · alert sent without coordinates" };
}

/**
 * Steps of the demonstrated emergency workflow. Wording matches the jury script:
 * location attached → emergency contact alerted → incident data prepared.
 */
export function emergencySteps(locationAvailable: boolean, location?: LocationAttachment): EmergencyStep[] {
  const primary = RIDER.contacts.find((c) => c.primary) ?? RIDER.contacts[0];
  return [
    {
      id: "location",
      ...locationStep(locationAvailable, location),
      icon: <MapPin className="size-4" aria-hidden />,
    },
    {
      id: "contact",
      title: "Emergency contact alerted",
      detail: primary ? `${primary.name} (${primary.relation}) · SMS + call` : "No emergency contact saved",
      icon: <PhoneOutgoing className="size-4" aria-hidden />,
    },
    {
      id: "package",
      title: "Incident data prepared",
      detail: "Black-box data, crash confidence, location",
      icon: <FileArchive className="size-4" aria-hidden />,
    },
  ];
}

/** Presentational emergency workflow. `completed` = number of finished steps. */
export function EmergencyWorkflow({
  completed,
  locationAvailable = true,
  location,
  className,
}: {
  completed: number;
  locationAvailable?: boolean;
  /** Real location to attach (from telemetry). Omit to show the scripted demo location. */
  location?: LocationAttachment;
  className?: string;
}) {
  const titleId = useId();
  const steps = emergencySteps(locationAvailable, location);
  return (
    <div className={cn("flex h-full flex-col bg-white", className)}>
      <div className="bg-navy px-5 pb-6 pt-6 text-white">
        <div className="flex items-center justify-between">
          <span className="grid size-11 place-items-center rounded-2xl bg-crit-strong">
            <Siren className="size-5" aria-hidden />
          </span>
          <SimLabel className="border-white/40 bg-white/10 text-white">Simulation · no real call sent</SimLabel>
        </div>
        <h2 id={titleId} className="mt-4 text-2xl font-extrabold leading-tight text-white">
          EMERGENCY RESPONSE ACTIVATED
        </h2>
        <p className="mt-1 text-sm text-white/70">No rider response. Escalating through the phone.</p>
      </div>
      <ol className="flex-1 space-y-2.5 p-5" aria-live="polite" aria-labelledby={titleId}>
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
                {done ? (
                  <Check className="size-4" strokeWidth={3} aria-hidden />
                ) : running ? (
                  <Loader2 className="size-4 animate-spin text-brand" aria-hidden />
                ) : (
                  s.icon
                )}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-navy">
                  {s.title}
                  <span className="sr-only">{done ? " — done" : running ? " — in progress" : " — pending"}</span>
                </span>
                <span className="block break-words text-xs text-muted">{s.detail}</span>
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

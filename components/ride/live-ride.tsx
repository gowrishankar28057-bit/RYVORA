"use client";

import { useState } from "react";
import Link from "next/link";
import { CircleStop, FlaskConical, Power, ShieldCheck } from "lucide-react";
import { RideHud } from "@/components/ride/ride-hud";
import { useSafetySettings } from "@/components/profile/safety-settings";
import { locationAttachment, type LocationAttachment } from "@/components/safety/emergency-workflow";
import { IncidentOverlay } from "@/components/safety/incident-overlay";
import { DeviceStatusGrid } from "@/components/dashboard/status-card";
import { Button, buttonClass, Card, CardHeader, SimLabel } from "@/components/ui/primitives";
import { assessEvent, confidencePct, EVENT_LABELS } from "@/lib/engine/crash-confidence";
import { SCENARIO_MAP } from "@/lib/simulation/scenarios";
import { useTelemetry } from "@/lib/telemetry/telemetry-provider";
import type { CrashAssessment } from "@/lib/types/events";
import { cn } from "@/lib/utils/cn";

const SIM_EVENTS = [
  { id: "pothole", label: "Pothole" },
  { id: "hard-brake", label: "Hard brake" },
  { id: "minor", label: "Minor fall" },
  { id: "severe-crash", label: "Severe crash" },
];

export function LiveRide() {
  const { snapshot, lastSeen, ride, endRide, readiness } = useTelemetry();
  const { riderCheckSeconds, autoEscalation } = useSafetySettings();
  const [toast, setToast] = useState<CrashAssessment | null>(null);
  // The location is captured when the incident fires, so the attached fix does not drift afterwards.
  const [incident, setIncident] = useState<{ assessment: CrashAssessment; location: LocationAttachment } | null>(null);

  if (!ride.active) {
    return (
      <div className="mx-auto max-w-xl">
        <Card className="p-6 text-center sm:p-8">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <ShieldCheck className="size-7" aria-hidden />
          </span>
          <h1 className="mt-4 text-2xl font-extrabold">No active ride</h1>
          <p className="mt-2 text-sm text-body">
            Run the pre-ride safety check to get start permission. RYVORA starts monitoring as soon as you ride.
          </p>
          <Link href="/precheck" className={buttonClass("primary", "lg", "mt-6 w-full")} aria-disabled={readiness.state === "blocked"}>
            <Power className="size-5" aria-hidden /> Start pre-ride check
          </Link>
          {readiness.state === "blocked" && (
            <p className="mt-3 text-xs font-semibold text-crit">{readiness.blockers[0]?.fix}</p>
          )}
        </Card>
      </div>
    );
  }

  const durationSec =
    ride.startedAt !== null && snapshot.phone.timestamp !== null ? (snapshot.phone.timestamp - ride.startedAt) / 1000 : 0;
  const tail = ride.buffer.slice(-48);
  const streams = {
    helmet: tail.map((s) => s.helmetAccelG),
    bike: tail.map((s) => s.bikeAccelG),
    phone: tail.map((s) => s.phoneAccelG),
  };

  const trigger = (id: string) => {
    const scenario = SCENARIO_MAP[id];
    if (!scenario) return;
    const a = assessEvent(scenario.input);
    if (a.emergency) setIncident({ assessment: a, location: locationAttachment(snapshot, lastSeen) });
    else {
      setToast(a);
      setTimeout(() => setToast((t) => (t === a ? null : t)), 4500);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-7">
      <div className="space-y-4">
        <RideHud snapshot={snapshot} durationSec={durationSec} streams={streams} />
        <Button variant="secondary" size="lg" className="w-full" onClick={endRide}>
          <CircleStop className="size-5" aria-hidden /> End ride
        </Button>
      </div>

      <div className="space-y-4">
        <Card className="p-5">
          <CardHeader kicker="Demo" title="Simulate a riding event" action={<SimLabel />} />
          <p className="mt-1 text-sm text-muted">Injects a recorded scenario into the live stream and runs the crash confidence engine.</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {SIM_EVENTS.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => trigger(e.id)}
                className={cn(
                  "flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors",
                  e.id === "severe-crash"
                    ? "border-crit-line bg-crit-bg text-crit hover:border-crit"
                    : "border-line text-navy hover:border-brand hover:bg-brand-50",
                )}
              >
                <FlaskConical className="size-4" aria-hidden />
                {e.label}
              </button>
            ))}
          </div>
        </Card>
        <Card className="hidden p-5 lg:block">
          <CardHeader kicker="Diagnostics" title="Device status" />
          <DeviceStatusGrid snapshot={snapshot} className="mt-3 grid-cols-1" />
        </Card>
      </div>

      {toast && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-md rounded-2xl border border-line bg-white p-4 shadow-[var(--shadow-lift)] animate-fade-up lg:bottom-8"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Classified · {confidencePct(toast)}% confidence
          </p>
          <p className="mt-0.5 font-[family-name:var(--font-display)] text-lg font-extrabold text-navy">
            {EVENT_LABELS[toast.eventClass]}
          </p>
          <p className="text-sm text-body">{toast.headline}</p>
        </div>
      )}

      {incident && (
        <IncidentOverlay
          confidencePct={confidencePct(incident.assessment)}
          countdownSec={riderCheckSeconds}
          autoEscalate={autoEscalation}
          locationAvailable={incident.location.live}
          location={incident.location}
          onClose={() => setIncident(null)}
        />
      )}
    </div>
  );
}

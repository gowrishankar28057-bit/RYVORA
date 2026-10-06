import { Clock, Database, MapPin, Motorbike, ShieldCheck, Siren, Smartphone } from "lucide-react";
import type { ReactNode } from "react";
import { HelmetIcon } from "@/components/brand/icons";
import { ClassBadge, CLASS_TONE } from "@/components/safety/risk-badge";
import { Card, ConfidenceRing, SimLabel, StatusDot, type Tone } from "@/components/ui/primitives";
import { confidencePct } from "@/lib/engine/crash-confidence";
import { cn } from "@/lib/utils/cn";
import { fmtT } from "@/lib/utils/format";
import { DownloadPackageButton } from "./download-package-button";
import { DEVICE_COLORS, fmtCoord, type DeviceAtImpact, type Incident } from "./incident-model";

function Meta({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-navy">{children}</dd>
    </div>
  );
}

export function IncidentHeader({ incident, compact = false, className }: { incident: Incident; compact?: boolean; className?: string }) {
  const a = incident.assessment;
  const severe = a.eventClass === "SEVERE_CRASH";
  const tone: Tone = CLASS_TONE[a.eventClass];
  const ringTone: Tone = severe ? "critical" : tone === "warning" ? "warning" : "info";
  return (
    <Card className={cn("flex flex-col p-4 sm:p-5 lg:p-6", className)} aria-labelledby="recon-incident-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
        <div className="shrink-0 self-start sm:self-center">
          <ConfidenceRing value={a.confidence} size={compact ? 88 : 108} stroke={compact ? 8 : 9} tone={ringTone} label="Confidence" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted tabular">{incident.id}</span>
            <SimLabel>Simulated incident</SimLabel>
          </div>
          <h2
            id="recon-incident-title"
            className={cn(
              "mt-1.5 font-[family-name:var(--font-display)] font-extrabold leading-tight",
              compact ? "text-xl" : "text-xl sm:text-2xl",
              severe ? "text-crit" : "text-navy",
            )}
          >
            {incident.classLabel}
          </h2>
          <p className="mt-1 text-sm text-body tabular">
            {confidencePct(a)}% crash confidence · {Math.round(a.coverage * 100)}% signal coverage
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <ClassBadge eventClass={a.eventClass} />
            <span className="text-xs text-muted">Rule-based sensor fusion · {incident.scenarioLabel.toLowerCase()} scenario</span>
          </div>
        </div>
      </div>

      <dl className="mt-5 grid gap-x-6 gap-y-4 border-t border-line-soft pt-5 sm:grid-cols-2">
        <Meta icon={<Clock className="size-3.5" aria-hidden />} label="Timestamp">
          <span className="tabular">{incident.occurredAtIst}</span>
        </Meta>
        <Meta icon={<MapPin className="size-3.5" aria-hidden />} label={`Approx. location · ±${incident.location.accuracyM} m`}>
          {incident.location.label}
          <span className="block text-xs font-normal text-muted tabular">{fmtCoord(incident.location.lat, incident.location.lon)}</span>
        </Meta>
        <Meta icon={<Database className="size-3.5" aria-hidden />} label="Black-box window">
          <span className="tabular">
            {fmtT(incident.window.from)} → {fmtT(incident.window.to)}
          </span>
          <span className="block text-xs font-normal text-muted">
            {incident.sourceHz} Hz on phone · charted at {incident.sampleHz} Hz
          </span>
        </Meta>
        <Meta icon={<Siren className="size-3.5" aria-hidden />} label="Response">
          <span className="flex flex-wrap items-center gap-1.5">
            {a.emergency ? "Rider check → emergency workflow" : "Logged · no escalation"}
            <SimLabel>Demonstrated</SimLabel>
          </span>
        </Meta>
      </dl>

      <div className="mt-auto flex flex-col gap-3 border-t border-line-soft pt-4 sm:mt-5 sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-sm text-xs text-muted">
          Assessment, timeline and the {incident.sampleHz} Hz sensor window as one JSON file. Marked simulated.
        </p>
        <DownloadPackageButton scenarioId={incident.scenarioId} size={compact ? "sm" : "md"} />
      </div>
    </Card>
  );
}

const STATUS_TEXT: Record<DeviceAtImpact["tone"], string> = { success: "text-ok", warning: "text-warn", critical: "text-crit" };

function DeviceGlyph({ device }: { device: DeviceAtImpact["device"] }) {
  if (device === "helmet") return <HelmetIcon className="size-5" />;
  if (device === "bike") return <Motorbike className="size-5" aria-hidden />;
  return <Smartphone className="size-5" aria-hidden />;
}

export function DeviceStatusCard({ devices, className }: { devices: DeviceAtImpact[]; className?: string }) {
  return (
    <Card className={cn("flex flex-col p-4 sm:p-5 lg:p-6", className)} aria-labelledby="recon-devices-title">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">At impact</p>
      <h2 id="recon-devices-title" className="text-base font-bold text-navy">
        Device status
      </h2>
      <ul className="mt-4 grid gap-2.5 sm:grid-cols-3 xl:grid-cols-1">
        {devices.map((d) => (
          <li key={d.device} className="flex min-w-0 items-start gap-3 rounded-2xl border border-line-soft bg-surface p-3">
            <span
              className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-white text-navy"
              style={{ boxShadow: `inset 0 -2px 0 ${DEVICE_COLORS[d.device]}` }}
            >
              <DeviceGlyph device={d.device} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-navy">{d.name}</span>
              <span className={cn("flex items-center gap-1.5 text-xs font-semibold tabular", STATUS_TEXT[d.tone])}>
                <StatusDot tone={d.tone} />
                {d.status}
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-muted">{d.detail}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-body">
        <ShieldCheck className="mt-px size-4 shrink-0 text-brand-600" aria-hidden />
        The helmet is not a single point of failure: the phone already held the pre-crash buffer, and phone + bike module
        completed verification after the helmet link dropped.
      </p>
    </Card>
  );
}

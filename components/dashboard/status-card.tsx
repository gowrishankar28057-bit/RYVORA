import { AlertTriangle, Bluetooth, BrainCircuit, Cpu, Lock, LockOpen, Motorbike, Smartphone, Unplug } from "lucide-react";
import { HelmetIcon } from "@/components/brand/icons";
import { Badge, StatusDot, type Tone } from "@/components/ui/primitives";
import type { Readiness } from "@/lib/engine/readiness";
import type { SystemSnapshot } from "@/lib/types/telemetry";
import { cn } from "@/lib/utils/cn";
import { fmt } from "@/lib/utils/format";

interface Row {
  label: string;
  value: string;
  tone: Tone;
  icon: React.ReactNode;
  battery?: number | null;
}

export function deviceRows(s: SystemSnapshot): Row[] {
  const helmetUp = s.helmet.connection !== "disconnected";
  const bikeUp = s.bike.connection !== "disconnected";
  const imuText = (h: SystemSnapshot["helmet"]["imu"]) => (h === "healthy" ? "Healthy" : h === "offline" ? "Offline" : h === "degraded" ? "Degraded" : "Error");
  // IMU faults are advisory (readiness stays "degraded", not blocked), so they use amber — red is reserved for blockers.
  const imuTone = (h: SystemSnapshot["helmet"]["imu"]): Tone => (h === "healthy" ? "success" : h === "offline" ? "neutral" : "warning");
  const linkDown = s.phone.bluetooth === "unsupported" ? "Bluetooth unavailable" : s.phone.bluetooth !== "on" ? "Bluetooth off" : "Disconnected";
  const icon = (n: React.ReactNode) => n;
  return [
    {
      label: "Helmet",
      value: helmetUp ? "Connected" : linkDown,
      tone: helmetUp ? "success" : "critical",
      icon: icon(<HelmetIcon className="size-[18px]" />),
      battery: s.helmet.batteryPct,
    },
    {
      label: "Helmet worn",
      value: s.helmet.worn === null ? "Unknown" : s.helmet.worn ? "Yes" : "No",
      tone: s.helmet.worn ? "success" : s.helmet.worn === null ? "neutral" : "critical",
      icon: <HelmetIcon className="size-[18px]" />,
    },
    {
      label: "Buckle",
      value: s.helmet.buckleSecured === null ? "Unknown" : s.helmet.buckleSecured ? "Secured" : "Open",
      tone: s.helmet.buckleSecured ? "success" : s.helmet.buckleSecured === null ? "neutral" : "critical",
      icon: s.helmet.buckleSecured ? <Lock className="size-[18px]" /> : <LockOpen className="size-[18px]" />,
    },
    {
      label: "Helmet IMU",
      value: imuText(s.helmet.imu),
      tone: imuTone(s.helmet.imu),
      icon: <Cpu className="size-[18px]" />,
    },
    {
      label: "Bike module",
      value: bikeUp ? "Connected" : linkDown,
      tone: bikeUp ? "success" : "critical",
      icon: <Motorbike className="size-[18px]" />,
      battery: s.bike.batteryPct,
    },
    {
      label: "Bike IMU",
      value: imuText(s.bike.imu),
      tone: imuTone(s.bike.imu),
      icon: <Cpu className="size-[18px]" />,
    },
    {
      label: "Phone sensors",
      value: s.phone.sensorsActive ? "Active" : "Unavailable",
      tone: s.phone.sensorsActive ? "success" : "critical",
      icon: <Smartphone className="size-[18px]" />,
      battery: s.phone.batteryPct,
    },
    {
      label: "AI safety engine",
      value: s.engine.state === "active" ? "Active" : s.engine.state === "degraded" ? "Degraded" : "Offline",
      tone: s.engine.state === "active" ? "success" : s.engine.state === "degraded" ? "warning" : "critical",
      icon: <BrainCircuit className="size-[18px]" />,
    },
  ];
}

const TONE_TEXT: Record<Tone, string> = {
  success: "text-ok",
  critical: "text-crit",
  warning: "text-warn",
  info: "text-brand-600",
  neutral: "text-muted",
  dark: "text-navy",
};

export function DeviceStatusGrid({ snapshot, className }: { snapshot: SystemSnapshot; className?: string }) {
  return (
    <ul className={cn("grid grid-cols-2 gap-2", className)}>
      {deviceRows(snapshot).map((r) => (
        <li key={r.label} className="flex items-center gap-3 rounded-2xl border border-line-soft bg-surface/70 px-3 py-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-navy shadow-[var(--shadow-card)]">{r.icon}</span>
          <span className="min-w-0">
            <span className="block truncate text-[11px] font-medium text-muted">{r.label}</span>
            <span className={cn("flex items-center gap-1.5 text-[13px] font-bold", TONE_TEXT[r.tone])}>
              {r.value}
              {r.battery !== undefined && r.battery !== null && (
                <span className={cn("font-semibold tabular", r.battery < 20 ? "text-warn" : "text-muted")}>· {fmt(r.battery, 0, "%")}</span>
              )}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function StatusCard({
  readiness,
  snapshot,
  action,
  greeting,
}: {
  readiness: Readiness;
  snapshot: SystemSnapshot;
  action?: React.ReactNode;
  greeting?: React.ReactNode;
}) {
  const state = readiness.state;
  const tone: Tone = state === "ready" ? "success" : state === "degraded" ? "warning" : "critical";
  const title = state === "ready" ? "READY TO RIDE" : state === "degraded" ? "READY · DEGRADED" : "RIDE NOT READY";
  const btOff = snapshot.phone.bluetooth !== "on";

  return (
    <section
      aria-labelledby="system-status-title"
      className="overflow-hidden rounded-[28px] border border-line bg-white shadow-[var(--shadow-lift)]"
    >
      <div
        className={cn(
          "relative px-5 pb-5 pt-5 sm:px-6",
          state === "ready" ? "bg-gradient-to-br from-brand-50 to-white" : state === "degraded" ? "bg-gradient-to-br from-warn-bg to-white" : "bg-gradient-to-br from-crit-bg to-white",
        )}
      >
        {greeting}
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">System status</p>
          <Badge tone={tone}>
            <StatusDot tone={tone} pulse={state === "ready"} className="size-2" />
            {state === "ready" ? "All systems" : state === "degraded" ? `${readiness.warnings.length} warning${readiness.warnings.length > 1 ? "s" : ""}` : `${readiness.blockers.length} to fix`}
          </Badge>
        </div>
        <h2
          id="system-status-title"
          className={cn(
            "mt-2 text-[28px] font-extrabold leading-none tracking-tight sm:text-[32px]",
            state === "ready" ? "text-navy" : state === "degraded" ? "text-warn" : "text-crit",
          )}
          aria-live="polite"
        >
          {title}
        </h2>

        {readiness.blockers.length > 0 && (
          <ul className="mt-4 space-y-2" aria-label="What to fix">
            {Array.from(new Set(readiness.blockers.map((b) => b.fix))).map((fix) => (
              <li key={fix} className="flex items-start gap-2.5 rounded-2xl border border-crit-line bg-white px-3.5 py-3 text-sm font-semibold text-navy">
                {btOff ? (
                  <Bluetooth className="mt-0.5 size-4 shrink-0 text-crit" aria-hidden />
                ) : (
                  <Unplug className="mt-0.5 size-4 shrink-0 text-crit" aria-hidden />
                )}
                {fix}
              </li>
            ))}
          </ul>
        )}
        {readiness.blockers.length === 0 && readiness.warnings.length > 0 && (
          <ul className="mt-4 space-y-2">
            {readiness.warnings.map((w) => (
              <li key={w.id} className="flex items-start gap-2.5 rounded-2xl border border-warn-line bg-white px-3.5 py-3 text-sm text-navy">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
                <span>
                  <span className="font-semibold">{w.label}.</span> {w.fix}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="px-4 pb-4 pt-1 sm:px-5 sm:pb-5">
        <DeviceStatusGrid snapshot={snapshot} />
        {action && <div className="mt-4">{action}</div>}
      </div>
    </section>
  );
}

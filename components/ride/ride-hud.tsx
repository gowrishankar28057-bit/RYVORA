import { Activity, Gauge, MapPin, Motorbike, Smartphone } from "lucide-react";
import { HelmetIcon } from "@/components/brand/icons";
import { Sparkline } from "@/components/sensors/sparkline";
import { StatusDot } from "@/components/ui/primitives";
import type { SystemSnapshot } from "@/lib/types/telemetry";
import { cn } from "@/lib/utils/cn";
import { fmt, fmtDuration } from "@/lib/utils/format";

export interface RideStreams {
  helmet: (number | null)[];
  bike: (number | null)[];
  phone: (number | null)[];
}

function Pill({ ok, label, icon }: { ok: boolean | null; label: string; icon: React.ReactNode }) {
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        ok ? "border-white/15 bg-white/5 text-white" : ok === null ? "border-white/15 text-white/60" : "border-[#f97066]/50 bg-[#f97066]/15 text-[#fecdca]",
      )}
    >
      {icon}
      {label}
      <StatusDot tone={ok ? "success" : ok === null ? "neutral" : "critical"} className="size-2" />
    </span>
  );
}

/** Presentational riding interface. Used by /ride and the jury demo. */
export function RideHud({
  snapshot,
  durationSec,
  streams,
  message = "RYVORA is monitoring your ride.",
  compact = false,
  children,
}: {
  snapshot: SystemSnapshot;
  durationSec: number;
  streams: RideStreams;
  message?: string;
  compact?: boolean;
  children?: React.ReactNode;
}) {
  const speed = snapshot.bike.speedKmh;
  const helmetOk = snapshot.helmet.connection === "connected";
  const bikeOk = snapshot.bike.connection === "connected";
  const gpsOk = snapshot.phone.gps === "locked";
  const sysOk = snapshot.engine.state === "active";

  return (
    <div className="relative overflow-hidden rounded-[28px] bg-navy text-white shadow-[var(--shadow-lift)]">
      <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-brand/25 blur-3xl" aria-hidden />
      <div className={cn("relative", compact ? "p-4" : "p-5 sm:p-6")}>
        <div className="flex items-center justify-between text-xs text-white/70">
          <span className="flex items-center gap-2 font-semibold uppercase tracking-[0.14em]">
            <StatusDot tone="info" pulse /> Live ride
          </span>
          <span className="tabular font-semibold text-white" aria-label="Ride duration">
            {fmtDuration(durationSec)}
          </span>
        </div>

        <div className={cn("flex items-end gap-2", compact ? "mt-3" : "mt-6")}>
          <span
            className={cn(
              "font-[family-name:var(--font-display)] font-extrabold leading-none tabular",
              compact ? "text-6xl" : "text-7xl sm:text-8xl",
            )}
            aria-label={`Speed ${fmt(speed, 0)} kilometres per hour`}
          >
            {fmt(speed, 0)}
          </span>
          <span className="mb-2 text-sm font-semibold text-white/60">km/h</span>
          <Gauge className="mb-2 ml-auto size-5 text-white/40" aria-hidden />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Pill ok={helmetOk} label="Helmet" icon={<HelmetIcon className="size-3.5" />} />
          <Pill ok={bikeOk} label="Bike" icon={<Motorbike className="size-3.5" />} />
          <Pill ok={gpsOk} label="GPS" icon={<MapPin className="size-3.5" />} />
          <Pill ok={sysOk} label="System" icon={<Activity className="size-3.5" />} />
        </div>

        <p className="mt-5 flex items-center gap-2 rounded-2xl bg-white/[0.06] px-3.5 py-3 text-sm font-semibold" aria-live="polite">
          <span className="relative grid size-5 place-items-center">
            <span className="absolute inset-0 rounded-full bg-brand/50 animate-pulse-ring" />
            <span className="size-2 rounded-full bg-brand" />
          </span>
          {message}
        </p>

        <div className={cn("mt-4 grid grid-cols-3 gap-2", compact && "gap-1.5")}>
          {[
            { label: "Helmet", unit: "g", values: streams.helmet, color: "#7cb4ff", icon: <HelmetIcon className="size-3" /> },
            { label: "Bike", unit: "g", values: streams.bike, color: "#5ee0b5", icon: <Motorbike className="size-3" /> },
            { label: "Phone", unit: "g", values: streams.phone, color: "#ffd479", icon: <Smartphone className="size-3" /> },
          ].map((s) => {
            const last = [...s.values].reverse().find((v) => v !== null) ?? null;
            return (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-2.5">
                <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">
                  <span className="flex items-center gap-1">{s.icon}{s.label}</span>
                </div>
                <div className="mt-0.5 text-sm font-bold tabular">
                  {last === null ? <span className="text-white/50">No data</span> : `${last.toFixed(2)} ${s.unit}`}
                </div>
                <Sparkline values={s.values} stroke={s.color} label={`${s.label} acceleration`} className="mt-1 h-10" />
              </div>
            );
          })}
        </div>
      </div>
      {children}
    </div>
  );
}

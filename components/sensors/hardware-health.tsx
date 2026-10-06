"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Bluetooth, BrainCircuit, Cable, Motorbike, RotateCcw, SlidersHorizontal, Smartphone } from "lucide-react";
import { HelmetIcon } from "@/components/brand/icons";
import { Button, PageHeader, SimLabel, StatusDot, type Tone } from "@/components/ui/primitives";
import { HEALTHY_STATE, type SimulatedDeviceState } from "@/lib/simulation/device-state";
import {
  formatPacketAge,
  latencyQuality,
  packetAgeMs,
  SIM_RATE_HZ,
  STALE_LINK_MS,
  webBluetoothSupport,
  type LastSeen,
  type LatencyQuality,
  type WebBluetoothSupport,
} from "@/lib/simulation/telemetry-source";
import { useTelemetry } from "@/lib/telemetry/telemetry-provider";
import type { ConnectionState, RadioStatus, SensorHealth, SystemSnapshot } from "@/lib/types/telemetry";
import { cn } from "@/lib/utils/cn";
import { DeviceHealthCard, HealthWarning, LOW_BATTERY_PCT, type HealthRow, type HealthStatus, type HealthTone } from "./device-health-card";

/* -------------------------------------------------------------------------- */
/* Client-only inputs                                                          */
/* -------------------------------------------------------------------------- */

/** Ticking wall clock. `null` until mounted, so SSR and hydration agree. */
function useClientNow(intervalMs: number): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, intervalMs);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [intervalMs]);
  return now;
}

const noopSubscribe = () => () => {};
const serverSupport = () => "unknown" as const;

/** Real browser capability, detected after hydration ("unknown" on the server). */
function useWebBluetoothSupport(): WebBluetoothSupport | "unknown" {
  return useSyncExternalStore<WebBluetoothSupport | "unknown">(noopSubscribe, webBluetoothSupport, serverSupport);
}

/* -------------------------------------------------------------------------- */
/* Row + warning builders (pure)                                               */
/* -------------------------------------------------------------------------- */

interface Warning {
  tone: "critical" | "warning" | "info";
  title: string;
  body: string;
}

interface CardModel {
  status: HealthStatus;
  rows: HealthRow[];
  warnings: Warning[];
}

const LATENCY_TEXT: Record<LatencyQuality, string> = { excellent: "Excellent", good: "Good", fair: "Fair", poor: "Poor" };
const LATENCY_TONE: Record<LatencyQuality, HealthTone> = { excellent: "success", good: "success", fair: "info", poor: "warning" };

const isLow = (pct: number | null) => pct !== null && pct < LOW_BATTERY_PCT;

function connectionRow(conn: ConnectionState, radio: RadioStatus): HealthRow {
  if (conn === "connected") return { label: "Connection", value: "Connected", tone: "success", hint: "BLE link to phone" };
  if (conn === "degraded") return { label: "Connection", value: "Weak", tone: "warning", hint: "Packets dropping" };
  const value = radio === "off" ? "Bluetooth off" : radio === "unsupported" ? "No Bluetooth" : "Disconnected";
  return { label: "Connection", value, tone: "critical", hint: "Device offline" };
}

/** Why a BLE module is unreachable, when the phone's radio is the cause. */
function radioCause(radio: RadioStatus): string | null {
  if (radio === "off") return "Bluetooth is off on the phone.";
  if (radio === "unsupported") return "Bluetooth is unavailable on this device.";
  return null;
}

function imuRow(imu: SensorHealth): HealthRow {
  if (imu === "healthy") return { label: "IMU", value: "Healthy", tone: "success", hint: "Self-test passed" };
  if (imu === "degraded") return { label: "IMU", value: "Degraded", tone: "warning", hint: "Noisy readings" };
  if (imu === "error") return { label: "IMU", value: "Error", tone: "warning", hint: "Not responding" };
  return { label: "IMU", value: "Unavailable", tone: "neutral", hint: "Device offline" };
}

function binarySensorRow(label: string, v: boolean | null, yes: string, no: string): HealthRow {
  if (v === null) return { label, value: "Unavailable", tone: "neutral" };
  return v ? { label, value: yes, tone: "success" } : { label, value: no, tone: "critical", hint: "Start permission blocked" };
}

function latencyRow(ms: number | null): HealthRow {
  const q = latencyQuality(ms);
  if (q === null || ms === null) return { label: "Communication latency", value: "Unavailable", tone: "neutral" };
  return { label: "Communication latency", value: `${Math.round(ms)} ms`, tone: LATENCY_TONE[q], hint: LATENCY_TEXT[q] };
}

function syncRow(label: string, timestamp: number | null, lastAt: number | null, now: number | null): HealthRow {
  if (now === null) return { label, value: "—", tone: "neutral" };
  const age = packetAgeMs(timestamp, now);
  if (age !== null) {
    const stale = age > STALE_LINK_MS;
    return { label, value: formatPacketAge(age), tone: stale ? "warning" : "success", hint: stale ? "Link stale" : "Live" };
  }
  const lost = packetAgeMs(lastAt, now);
  return lost === null
    ? { label, value: "Never", tone: "neutral", hint: "No packet received" }
    : { label, value: formatPacketAge(lost), tone: "warning", hint: "Link lost" };
}

/** Which verification sources keep working when one module drops out. */
function backupNote(s: SystemSnapshot, lost: "helmet" | "bike"): string {
  const phone = s.phone.sensorsActive;
  const other =
    lost === "helmet"
      ? s.bike.connection !== "disconnected" && s.bike.imu === "healthy"
      : s.helmet.connection !== "disconnected" && s.helmet.imu === "healthy";
  const otherName = lost === "helmet" ? "bike" : "helmet";
  if (phone && other) return `Phone and ${otherName} verification remain active.`;
  if (phone) return "Phone verification remains active.";
  if (other) return `${otherName === "bike" ? "Bike" : "Helmet"} verification remains active.`;
  return "No backup verification source is active.";
}

function helmetModel(s: SystemSnapshot, lastSeen: LastSeen, now: number | null): CardModel {
  const h = s.helmet;
  const cause = radioCause(s.phone.bluetooth);
  const up = h.connection !== "disconnected";
  const warnings: Warning[] = [];
  if (!up) {
    warnings.push({
      tone: "critical",
      title: "HELMET OFFLINE",
      body: cause
        ? `${cause} Start permission blocked.`
        : "No packets from the helmet module. Start permission blocked until it reconnects.",
    });
  }
  if (h.imu === "error" || h.imu === "degraded") {
    warnings.push({
      tone: "warning",
      title: h.imu === "error" ? "HELMET IMU ERROR" : "HELMET IMU DEGRADED",
      body: `Crash detection capability may be degraded. ${backupNote(s, "helmet")}`,
    });
  }
  if (h.worn === false) warnings.push({ tone: "critical", title: "HELMET NOT WORN", body: "Wear sensor reports no rider. Start permission blocked." });
  if (h.buckleSecured === false) warnings.push({ tone: "critical", title: "BUCKLE OPEN", body: "Secure the chin strap. Start permission blocked." });

  const status: HealthStatus = !up
    ? { tone: "critical", label: "Offline" }
    : h.worn === false || h.buckleSecured === false
      ? { tone: "critical", label: "Start blocked" }
      : h.imu !== "healthy"
        ? { tone: "warning", label: "Degraded" }
        : isLow(h.batteryPct)
          ? { tone: "warning", label: "Low battery" }
          : { tone: "success", label: "Healthy" };

  return {
    status,
    warnings,
    rows: [
      connectionRow(h.connection, s.phone.bluetooth),
      imuRow(h.imu),
      binarySensorRow("Wear sensor", h.worn, "Worn", "Not worn"),
      binarySensorRow("Buckle sensor", h.buckleSecured, "Secured", "Open"),
      latencyRow(h.latencyMs),
      syncRow("Last synchronization", h.timestamp, lastSeen.helmetAt, now),
    ],
  };
}

function bikeModel(s: SystemSnapshot, lastSeen: LastSeen, now: number | null): CardModel {
  const b = s.bike;
  const cause = radioCause(s.phone.bluetooth);
  const up = b.connection !== "disconnected";
  const warnings: Warning[] = [];
  if (!up) {
    warnings.push({
      tone: "critical",
      title: "BIKE MODULE OFFLINE",
      body: cause
        ? `${cause} Start permission blocked.`
        : "Start permission blocked. Check the module power and stay near the motorcycle.",
    });
  }
  if (b.imu === "error" || b.imu === "degraded") {
    warnings.push({
      tone: "warning",
      title: b.imu === "error" ? "BIKE IMU ERROR" : "BIKE IMU DEGRADED",
      body: `Fall and lean detection may be degraded. ${backupNote(s, "bike")}`,
    });
  }

  const status: HealthStatus = !up
    ? { tone: "critical", label: "Offline" }
    : b.imu !== "healthy"
      ? { tone: "warning", label: "Degraded" }
      : isLow(b.batteryPct)
        ? { tone: "warning", label: "Low battery" }
        : { tone: "success", label: "Healthy" };

  return {
    status,
    warnings,
    rows: [
      connectionRow(b.connection, s.phone.bluetooth),
      imuRow(b.imu),
      b.startPermission === "enabled"
        ? { label: "Start permission", value: "Enabled", tone: "success", hint: "Ignition-enable signal" }
        : { label: "Start permission", value: "Blocked", tone: "critical", hint: up ? "Pre-ride check failing" : "Module unreachable" },
      latencyRow(b.latencyMs),
      syncRow("Last synchronization", b.timestamp, lastSeen.bikeAt, now),
    ],
  };
}

function phoneModel(s: SystemSnapshot, lastSeen: LastSeen, now: number | null): CardModel {
  const p = s.phone;
  const warnings: Warning[] = [];
  if (!p.sensorsActive) {
    warnings.push({
      tone: "critical",
      title: "PHONE SENSORS OFF",
      body: "AI safety engine offline — crash detection unavailable. Start permission blocked.",
    });
  }
  if (p.bluetooth === "off") {
    warnings.push({ tone: "critical", title: "BLUETOOTH OFF", body: "Helmet and bike module cannot connect. Start permission blocked." });
  } else if (p.bluetooth === "unsupported") {
    warnings.push({ tone: "critical", title: "BLUETOOTH UNAVAILABLE", body: "This device cannot reach the helmet or bike module." });
  }
  if (p.gps === "unavailable") {
    const last = lastSeen.location;
    const age = formatPacketAge(packetAgeMs(lastSeen.locationAt, now));
    warnings.push({
      tone: "warning",
      title: "LOCATION UNAVAILABLE",
      body: last
        ? `The emergency workflow will use the last known location: ${last.label}${now !== null ? ` (${age})` : ""}.`
        : "The emergency workflow will use the last known location. No fix recorded this session.",
    });
  }
  if (p.network === "offline") {
    warnings.push({ tone: "warning", title: "NO NETWORK", body: "Simulated emergency alerts would wait until the connection returns." });
  }

  const status: HealthStatus = !p.sensorsActive
    ? { tone: "critical", label: "Sensors off" }
    : p.bluetooth !== "on"
      ? { tone: "critical", label: p.bluetooth === "off" ? "Bluetooth off" : "No Bluetooth" }
      : p.gps === "unavailable"
        ? { tone: "warning", label: "No location" }
        : p.network === "offline" || isLow(p.batteryPct)
          ? { tone: "warning", label: "Attention" }
          : { tone: "success", label: "Healthy" };

  const gpsRow: HealthRow =
    p.gps === "locked"
      ? { label: "Location (GPS)", value: "Locked", tone: "success", hint: p.location ? `±${Math.round(p.location.accuracyM)} m` : undefined }
      : p.gps === "searching"
        ? { label: "Location (GPS)", value: "Searching…", tone: "info" }
        : { label: "Location (GPS)", value: "Unavailable", tone: "warning", hint: lastSeen.location ? "Using last known" : "No fix yet" };

  return {
    status,
    warnings,
    rows: [
      p.sensorsActive
        ? { label: "Motion sensors (IMU)", value: "Active", tone: "success", hint: "Accelerometer · gyroscope" }
        : { label: "Motion sensors (IMU)", value: "Off", tone: "critical", hint: "Permission denied or unavailable" },
      p.bluetooth === "on"
        ? { label: "Bluetooth", value: "On", tone: "success" }
        : { label: "Bluetooth", value: p.bluetooth === "off" ? "Off" : "Unavailable", tone: "critical" },
      gpsRow,
      p.network === "online" ? { label: "Network", value: "Online", tone: "success" } : { label: "Network", value: "Offline", tone: "warning" },
      syncRow("Last sensor sample", p.timestamp, lastSeen.phoneAt, now),
    ],
  };
}

function engineModel(s: SystemSnapshot, rideActive: boolean, bufferedSamples: number): CardModel {
  const sources = [
    s.helmet.connection !== "disconnected" && s.helmet.imu === "healthy",
    s.bike.connection !== "disconnected" && s.bike.imu === "healthy",
    s.phone.sensorsActive,
  ].filter(Boolean).length;
  const bufferUp = s.phone.sensorsActive && s.phone.bufferSeconds > 0;
  const warnings: Warning[] = [];
  if (s.engine.state === "degraded") {
    warnings.push({ tone: "warning", title: "REDUCED COVERAGE", body: "Fusion continues with the remaining sensors. The phone buffer still records every ride." });
  } else if (s.engine.state === "offline") {
    warnings.push({ tone: "critical", title: "ENGINE OFFLINE", body: "Phone motion sensors are required for crash detection." });
  }
  return {
    status:
      s.engine.state === "active"
        ? { tone: "success", label: "Active" }
        : s.engine.state === "degraded"
          ? { tone: "warning", label: "Degraded" }
          : { tone: "critical", label: "Offline" },
    warnings,
    rows: [
      { label: "Sensor coverage", value: `${sources} of 3 IMUs`, tone: sources === 3 ? "success" : sources === 0 ? "critical" : "warning", hint: "Helmet · bike · phone" },
      bufferUp
        ? { label: "Pre-crash buffer", value: `${s.phone.bufferSeconds} s rolling`, tone: "success", hint: "Held on the phone" }
        : { label: "Pre-crash buffer", value: "Unavailable", tone: "critical" },
      rideActive
        ? { label: "Buffer state", value: "Recording", tone: "info", hint: `${bufferedSamples} samples held` }
        : { label: "Buffer state", value: "Standby", tone: "neutral", hint: "Arms when a ride starts" },
    ],
  };
}

/* -------------------------------------------------------------------------- */
/* UI                                                                          */
/* -------------------------------------------------------------------------- */

function Warnings({ items }: { items: Warning[] }) {
  if (items.length === 0) return null;
  return (
    <>
      {items.map((w) => (
        <HealthWarning key={w.title} tone={w.tone} title={w.title}>
          {w.body}
        </HealthWarning>
      ))}
    </>
  );
}

const FAULTS: { key: keyof SimulatedDeviceState; label: string; faultValue: boolean }[] = [
  { key: "helmetImuFault", label: "Helmet IMU fault", faultValue: true },
  { key: "bikeConnected", label: "Bike module disconnect", faultValue: false },
  { key: "phoneBluetooth", label: "Bluetooth off", faultValue: false },
  { key: "gpsAvailable", label: "GPS off", faultValue: false },
  { key: "phoneSensors", label: "Phone sensors off", faultValue: false },
];

function FaultInjection() {
  const { device, setDevice, resetDevices, setSimulatorOpen, simulatorAvailable } = useTelemetry();
  const healthy = (Object.keys(HEALTHY_STATE) as (keyof SimulatedDeviceState)[]).every((k) => device[k] === HEALTHY_STATE[k]);
  return (
    <section aria-labelledby="fault-injection-title" className="rounded-3xl border border-dashed border-brand/40 bg-brand-50/60 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex items-center gap-2">
          <SimLabel>Simulator</SimLabel>
          <h2 id="fault-injection-title" className="text-sm font-bold">
            Fault injection
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setSimulatorOpen(true)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-brand-600 hover:bg-white"
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          All switches
        </button>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-body">
        {simulatorAvailable
          ? "Inject a hardware failure and watch diagnostics react. Simulated only — no real device is affected."
          : "Fault injection is only available with the simulated telemetry source."}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {FAULTS.map((f) => {
          const active = device[f.key] === f.faultValue;
          return (
            <button
              key={f.key}
              type="button"
              aria-pressed={active}
              disabled={!simulatorAvailable}
              onClick={() => setDevice({ [f.key]: !device[f.key] })}
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45",
                active ? "border-navy bg-navy text-white" : "border-line bg-white text-navy hover:border-brand",
              )}
            >
              <span
                aria-hidden
                className={cn("size-2.5 shrink-0 rounded-full border", active ? "border-white bg-white" : "border-muted bg-transparent")}
              />
              {f.label}
            </button>
          );
        })}
        <Button variant="secondary" className="rounded-xl" onClick={resetDevices} disabled={!simulatorAvailable || healthy}>
          <RotateCcw className="size-4" aria-hidden />
          Reset
        </Button>
      </div>
    </section>
  );
}

const SUMMARY_TONE: Record<"ready" | "degraded" | "blocked", Tone> = { ready: "success", degraded: "warning", blocked: "critical" };
const SUMMARY_BOX: Record<"ready" | "degraded" | "blocked", string> = {
  ready: "border-line bg-white",
  degraded: "border-warn-line bg-warn-bg",
  blocked: "border-crit-line bg-crit-bg",
};

function SystemSummary({ state, issues }: { state: "ready" | "degraded" | "blocked"; issues: string[] }) {
  const headline =
    state === "ready"
      ? "All safety hardware reporting normally"
      : state === "degraded"
        ? "Riding allowed with reduced safety coverage"
        : "Start permission blocked";
  return (
    <div className={cn("flex items-start gap-3 rounded-2xl border px-4 py-3", SUMMARY_BOX[state])}>
      <StatusDot tone={SUMMARY_TONE[state]} pulse={state === "ready"} className="mt-1.5" />
      <div className="min-w-0" aria-live="polite" aria-atomic="true">
        <p className="text-sm font-bold text-navy">{headline}</p>
        <p className="text-xs text-body">
          {issues.length === 0 ? "No hardware issues detected." : `${issues.length} issue${issues.length > 1 ? "s" : ""}: ${issues.join(" · ")}`}
        </p>
      </div>
    </div>
  );
}

function adapterMessage(kind: SystemSnapshot["source"]["kind"], support: WebBluetoothSupport | "unknown"): string {
  if (support === "unknown") return "Checking this browser for Web Bluetooth…";
  if (kind === "simulated") {
    return support === "supported"
      ? "This browser supports Web Bluetooth — hardware pairing planned."
      : "Web Bluetooth unavailable in this browser — using simulated hardware.";
  }
  return support === "supported"
    ? "This browser supports Web Bluetooth — RYVORA pairing is not implemented in this build yet."
    : "Web Bluetooth unavailable in this browser — no hardware can connect.";
}

export function HardwareHealth() {
  const { snapshot: s, lastSeen, readiness, ride, simulatorAvailable } = useTelemetry();
  const now = useClientNow(250);
  const btSupport = useWebBluetoothSupport();
  const simulated = s.source.kind === "simulated";

  const helmet = helmetModel(s, lastSeen, now);
  const bike = bikeModel(s, lastSeen, now);
  const phone = phoneModel(s, lastSeen, now);
  const engine = engineModel(s, ride.active, ride.buffer.length);
  const issues = Array.from(new Set([helmet, bike, phone, engine].flatMap((m) => m.warnings.map((w) => w.title))));

  return (
    <div className="space-y-5">
      <PageHeader
        kicker="Diagnostics"
        title="Hardware health"
        description="RYVORA also monitors the safety hardware itself — link, power and sensor self-tests for every module."
      />

      <SystemSummary state={readiness.state} issues={issues} />
      <FaultInjection />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DeviceHealthCard
          title="Helmet module"
          subtitle={`Firmware ${s.helmet.firmware}`}
          icon={<HelmetIcon className="size-5" />}
          status={helmet.status}
          rows={helmet.rows}
          battery={{ pct: s.helmet.batteryPct }}
          warnings={<Warnings items={helmet.warnings} />}
          footer="Smart helmet · BLE"
          simulated={simulated}
        />
        <DeviceHealthCard
          title="Bike module"
          subtitle={`Firmware ${s.bike.firmware}`}
          icon={<Motorbike className="size-5" />}
          status={bike.status}
          rows={bike.rows}
          battery={{ pct: s.bike.batteryPct, label: "Backup battery" }}
          warnings={<Warnings items={bike.warnings} />}
          footer="Motorcycle sensor module · BLE"
          simulated={simulated}
        />
        <DeviceHealthCard
          title="Phone"
          subtitle="Rider's smartphone · hub"
          icon={<Smartphone className="size-5" />}
          status={phone.status}
          rows={phone.rows}
          battery={{ pct: s.phone.batteryPct }}
          warnings={<Warnings items={phone.warnings} />}
          footer="Runs the AI safety engine"
          simulated={simulated}
        />
        <DeviceHealthCard
          title="AI safety engine"
          subtitle={s.engine.model}
          icon={<BrainCircuit className="size-5" />}
          status={engine.status}
          rows={engine.rows}
          warnings={<Warnings items={engine.warnings} />}
          footer="Helmet is not a single point of failure"
          simulated={simulated}
        />
        <DeviceHealthCard
          title="Hardware adapter"
          subtitle={s.source.label}
          icon={<Cable className="size-5" />}
          status={simulated ? { tone: "info", label: "Simulated" } : { tone: "neutral", label: "Not paired" }}
          columns={2}
          className="md:col-span-2"
          warnings={
            <div className="flex gap-2.5 rounded-2xl border border-brand-100 bg-brand-50 px-3.5 py-3 text-sm text-navy" role="status">
              <Bluetooth className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
              <p className="min-w-0 leading-snug">{adapterMessage(s.source.kind, btSupport)}</p>
            </div>
          }
          rows={[
            { label: "Telemetry source", value: simulated ? "Simulated" : "Web Bluetooth", tone: "info", hint: "Configured at build time" },
            simulated
              ? { label: "Stream rate", value: `${ride.active ? SIM_RATE_HZ.riding : SIM_RATE_HZ.idle} Hz`, tone: "neutral", hint: ride.active ? "Riding" : "Idle" }
              : { label: "Stream rate", value: "Unavailable", tone: "neutral", hint: "No device paired" },
            simulatorAvailable
              ? { label: "Fault injection", value: "Available", tone: "info" }
              : { label: "Fault injection", value: "Not available", tone: "neutral", hint: "Real-hardware source" },
            { label: "Planned adapters", value: "Web Bluetooth · Android", tone: "neutral", hint: "GATT notify · native bridge" },
          ]}
          footer="UI reads one TelemetrySource contract"
          simulated={simulated}
        />
      </div>
    </div>
  );
}

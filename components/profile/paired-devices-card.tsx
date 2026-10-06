"use client";

import Link from "next/link";
import { Motorbike, SlidersHorizontal, Smartphone } from "lucide-react";
import { HelmetIcon } from "@/components/brand/icons";
import { Button, Card, CardHeader, SimLabel, StatusDot, type Tone } from "@/components/ui/primitives";
import { RIDER } from "@/data/rider";
import { useTelemetry } from "@/lib/telemetry/telemetry-provider";
import type { ConnectionState, SystemSnapshot } from "@/lib/types/telemetry";
import { cn } from "@/lib/utils/cn";

const LOW_BATTERY = 20;

interface DeviceModel {
  id: string;
  name: string;
  role: string;
  Icon: React.ComponentType<{ className?: string }>;
  status: { text: string; tone: Tone };
  firmware: string;
  batteryLabel: string;
  battery: number | null;
  details: string[];
}

function linkStatus(conn: ConnectionState, bluetoothOff: boolean): DeviceModel["status"] {
  if (conn === "connected") return { text: "Connected", tone: "success" };
  if (conn === "degraded") return { text: "Weak link", tone: "warning" };
  return { text: bluetoothOff ? "Bluetooth off" : "Disconnected", tone: "critical" };
}

function devicesFrom(s: SystemSnapshot): DeviceModel[] {
  const btOff = s.phone.bluetooth !== "on";
  const helmetUp = s.helmet.connection !== "disconnected";
  return [
    {
      id: "helmet",
      name: RIDER.helmet,
      role: "Smart helmet",
      Icon: HelmetIcon,
      status: linkStatus(s.helmet.connection, btOff),
      firmware: s.helmet.firmware || "Unavailable",
      batteryLabel: "Battery",
      battery: s.helmet.batteryPct,
      details: helmetUp
        ? [
            s.helmet.worn === null ? "Wear sensor —" : s.helmet.worn ? "Worn" : "Not worn",
            s.helmet.buckleSecured ? "Buckle secured" : "Buckle open",
          ]
        : ["Phone keeps the pre-crash buffer"],
    },
    {
      id: "bike",
      name: RIDER.bikeModule,
      role: RIDER.motorcycle,
      Icon: Motorbike,
      status: linkStatus(s.bike.connection, btOff),
      firmware: s.bike.firmware || "Unavailable",
      batteryLabel: "Backup battery",
      battery: s.bike.batteryPct,
      details: [s.bike.startPermission === "enabled" ? "Start permission enabled (simulated)" : "Start permission blocked (simulated)"],
    },
    {
      id: "phone",
      name: "This phone",
      role: "Fusion hub",
      Icon: Smartphone,
      status: s.phone.sensorsActive ? { text: "Sensors active", tone: "success" } : { text: "Sensors off", tone: "critical" },
      firmware: "RYVORA web app (prototype)",
      batteryLabel: "Battery",
      battery: s.phone.batteryPct,
      details: [
        `Bluetooth ${s.phone.bluetooth === "on" ? "on" : s.phone.bluetooth === "off" ? "off" : "unsupported"}`,
        `GPS ${s.phone.gps}`,
        `${s.phone.bufferSeconds} s rolling buffer`,
      ],
    },
  ];
}

function BatteryMeter({ label, pct }: { label: string; pct: number | null }) {
  const low = pct !== null && pct < LOW_BATTERY;
  return (
    <span className="flex items-center gap-2">
      <span className="text-muted">{label}</span>
      {pct === null ? (
        <span className="font-semibold text-muted">Unavailable</span>
      ) : (
        <>
          <span className="h-1.5 w-12 overflow-hidden rounded-full bg-line-soft" aria-hidden>
            <span
              className={cn("block h-full rounded-full", low ? "bg-[#f79009]" : "bg-brand")}
              style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
            />
          </span>
          <span className={cn("font-semibold tabular", low ? "text-warn" : "text-navy")}>
            {Math.round(pct)}%{low && " · low"}
          </span>
        </>
      )}
    </span>
  );
}

/** Live status of the paired (simulated) hardware. */
export function PairedDevicesCard() {
  const { snapshot, setSimulatorOpen } = useTelemetry();
  const devices = devicesFrom(snapshot);

  return (
    <Card className="p-5">
      <CardHeader kicker="Hardware" title="Paired devices" action={<SimLabel>{snapshot.source.label}</SimLabel>} />
      <ul className="mt-3 space-y-2" aria-live="polite">
        {devices.map((d) => (
          <li key={d.id} className="rounded-2xl border border-line-soft bg-white p-3.5">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface text-navy">
                <d.Icon className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <p className="min-w-0 truncate text-sm font-bold text-navy">{d.name}</p>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy">
                    <StatusDot tone={d.status.tone} />
                    {d.status.text}
                  </span>
                </div>
                <p className="truncate text-xs text-muted">
                  {d.role} · <span className="tabular">{d.firmware}</span>
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                  <BatteryMeter label={d.batteryLabel} pct={d.battery} />
                  <span className="text-muted">{d.details.join(" · ")}</span>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setSimulatorOpen(true)} className="flex-1 sm:flex-none">
          <SlidersHorizontal className="size-4" aria-hidden /> Open hardware simulator
        </Button>
        <Link href="/health" className="inline-flex h-11 items-center px-2 text-sm font-semibold text-brand-600 hover:underline">
          Hardware health
        </Link>
      </div>
    </Card>
  );
}

"use client";

import { AlertTriangle, Motorbike, Smartphone } from "lucide-react";
import { HelmetIcon } from "@/components/brand/icons";
import { Button, Card, PageHeader, SimLabel } from "@/components/ui/primitives";
import { useTelemetry } from "@/lib/telemetry/telemetry-provider";
import { fmt } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

function Row({ k, v, bad }: { k: string; v: string; bad?: boolean }) {
  return <div className="flex justify-between gap-3 border-b border-line-soft py-2.5 text-sm last:border-0"><dt className="text-muted">{k}</dt><dd className={cn("font-bold", bad ? "text-crit" : "text-navy")}>{v}</dd></div>;
}

export function HardwareHealth() {
  const { snapshot: s, device, setDevice } = useTelemetry();
  const imuErr = s.helmet.imu === "error";
  const cards = [
    { title: "Helmet module", icon: <HelmetIcon className="size-5" />, rows: [
      ["Connection", s.helmet.connection, s.helmet.connection !== "connected"], ["Battery", fmt(s.helmet.batteryPct, 0, "%"), (s.helmet.batteryPct ?? 100) < 20],
      ["IMU", s.helmet.imu, s.helmet.imu !== "healthy"], ["Wear sensor", s.helmet.worn === null ? "Unknown" : s.helmet.worn ? "Worn" : "Not worn", s.helmet.worn === false],
      ["Buckle sensor", s.helmet.buckleSecured === null ? "Unknown" : s.helmet.buckleSecured ? "Secured" : "Open", s.helmet.buckleSecured === false],
      ["Latency", fmt(s.helmet.latencyMs, 0, "ms"), s.helmet.latencyMs === null], ["Last sync", s.helmet.timestamp ? "Live" : "—", !s.helmet.timestamp], ["Firmware", s.helmet.firmware, false]] },
    { title: "Bike module", icon: <Motorbike className="size-5" />, rows: [
      ["Connection", s.bike.connection, s.bike.connection !== "connected"], ["Backup battery", fmt(s.bike.batteryPct, 0, "%"), false], ["IMU", s.bike.imu, s.bike.imu !== "healthy"],
      ["Start permission", s.bike.startPermission, s.bike.startPermission === "blocked"], ["Latency", fmt(s.bike.latencyMs, 0, "ms"), s.bike.latencyMs === null], ["Last sync", s.bike.timestamp ? "Live" : "—", !s.bike.timestamp], ["Firmware", s.bike.firmware, false]] },
    { title: "Phone", icon: <Smartphone className="size-5" />, rows: [
      ["Motion sensors", s.phone.sensorsActive ? "Active" : "Unavailable", !s.phone.sensorsActive], ["Battery", fmt(s.phone.batteryPct, 0, "%"), false], ["GPS", s.phone.gps, s.phone.gps !== "locked"],
      ["Bluetooth", s.phone.bluetooth, s.phone.bluetooth !== "on"], ["Pre-crash buffer", `${s.phone.bufferSeconds} s rolling`, false], ["AI engine", s.engine.state, s.engine.state !== "active"]] },
  ] as const;
  return (
    <div className="space-y-5">
      <PageHeader kicker="Diagnostics" title="Hardware health" description="RYVORA monitors the safety hardware itself." action={<Button variant="secondary" onClick={() => setDevice({ helmetImuFault: !device.helmetImuFault })}>{device.helmetImuFault ? "Clear" : "Simulate"} helmet IMU fault</Button>} />
      {imuErr && <div role="alert" className="flex gap-3 rounded-2xl border border-crit-line bg-crit-bg p-4"><AlertTriangle className="size-5 shrink-0 text-crit" /><div><p className="font-extrabold text-crit">HELMET IMU ERROR</p><p className="text-sm text-navy">Crash detection capability may be degraded. Phone and bike verification remain active.</p></div></div>}
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.title} className="p-5"><div className="mb-2 flex items-center justify-between"><h2 className="flex items-center gap-2 font-bold">{c.icon}{c.title}</h2><SimLabel /></div>
            <dl>{c.rows.map(([k, v, bad]) => <Row key={k} k={k} v={String(v)} bad={bad} />)}</dl></Card>
        ))}
      </div>
    </div>
  );
}

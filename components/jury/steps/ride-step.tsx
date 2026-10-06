import { Activity, Gauge, Motorbike, MoveDiagonal, Smartphone } from "lucide-react";
import { HelmetIcon } from "@/components/brand/icons";
import { Kicker, PhoneStage } from "@/components/jury/stage";
import { RideHud } from "@/components/ride/ride-hud";
import { SensorMetric } from "@/components/sensors/sensor-metric";
import { Card, CardHeader } from "@/components/ui/primitives";
import { BUFFER_SECONDS } from "@/lib/jury/demo-data";
import { DEVICE_COLORS, rideSnapshot, rideStreams, type TraceDevice } from "@/lib/jury/playback";
import { fmt } from "@/lib/utils/format";

const LANES: { device: TraceDevice; label: string }[] = [
  { device: "helmet", label: "Helmet" },
  { device: "bike", label: "Bike module" },
  { device: "phone", label: "Phone" },
];

/** Rolling buffer lanes; the stripes move with the clock (no CSS animation, so it is frame-exact). */
function BufferLanes({ t }: { t: number }) {
  return (
    <ul className="space-y-2">
      {LANES.map((l) => (
        <li key={l.device} className="grid grid-cols-[92px_minmax(0,1fr)] items-center gap-3 text-xs">
          <span className="font-semibold text-navy">{l.label}</span>
          <span
            className="block h-3 rounded-full motion-reduce:[background-position-x:0px]!"
            style={{
              backgroundColor: `${DEVICE_COLORS[l.device]}22`,
              backgroundImage: `repeating-linear-gradient(90deg, ${DEVICE_COLORS[l.device]} 0 6px, transparent 6px 10px)`,
              backgroundPositionX: `${-Math.round(t * 24)}px`,
            }}
            aria-hidden
          />
        </li>
      ))}
    </ul>
  );
}

/** Step 3 — ride starts; live telemetry from all three devices. */
export function RideStep({ ms }: { ms: number }) {
  const t = ms / 1000;
  const snapshot = rideSnapshot(t);
  return (
    <PhoneStage
      stepId="ride"
      phone={
        <div className="p-3">
          <RideHud compact snapshot={snapshot} durationSec={t} streams={rideStreams(t)} />
        </div>
      }
      panel={
        <div className="space-y-4">
          <Card className="p-5">
            <CardHeader kicker="Synchronized telemetry" title="Three devices, one timeline" />
            <div className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-3">
              <SensorMetric label="Speed" value={fmt(snapshot.bike.speedKmh, 0)} unit="km/h" icon={<Gauge className="size-3.5" aria-hidden />} />
              <SensorMetric label="Lean" value={fmt(snapshot.bike.leanDeg, 1)} unit="°" icon={<MoveDiagonal className="size-3.5" aria-hidden />} />
              <SensorMetric label="Helmet" value={fmt(snapshot.helmet.accelG, 2)} unit="g" icon={<HelmetIcon className="size-3.5" />} />
              <SensorMetric label="Bike" value={fmt(snapshot.bike.accelG, 2)} unit="g" icon={<Motorbike className="size-3.5" aria-hidden />} />
              <SensorMetric label="Rotation" value={fmt(snapshot.bike.angularRateDps, 0)} unit="deg/s" icon={<Activity className="size-3.5" aria-hidden />} />
              <SensorMetric label="Phone" value={fmt(snapshot.phone.accelG, 2)} unit="g" icon={<Smartphone className="size-3.5" aria-hidden />} />
            </div>
          </Card>
          <Card className="p-5">
            <CardHeader kicker="On the phone" title={`${BUFFER_SECONDS}-second rolling pre-crash buffer`} />
            <div className="mt-4">
              <BufferLanes t={t} />
            </div>
            <Kicker className="mt-2 text-right normal-case tracking-normal">Last {BUFFER_SECONDS} s · 20 Hz · always overwritten</Kicker>
            <p className="mt-3 text-sm leading-relaxed text-body">
              The phone fuses all three streams and keeps the last {BUFFER_SECONDS} seconds. If a device is destroyed in a
              crash, what it sensed before impact is already safe on the phone.
            </p>
          </Card>
        </div>
      }
    />
  );
}

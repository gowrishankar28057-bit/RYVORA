import { Clock, Gauge, Route, Zap } from "lucide-react";
import { SensorMetric } from "@/components/sensors/sensor-metric";
import { fmt } from "@/lib/utils/format";
import { fmtMinutes, type RideStats } from "./history-model";

/** Distance / duration / average / max speed. Missing values render as "Unavailable". */
export function RideStatsGrid({ stats }: { stats: RideStats }) {
  const icon = "size-3.5";
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <SensorMetric
        label="Distance"
        value={stats.distanceKm === null ? null : fmt(stats.distanceKm, 1)}
        unit="km"
        icon={<Route className={icon} aria-hidden />}
      />
      <SensorMetric
        label="Duration"
        value={stats.durationMin === null ? null : fmtMinutes(stats.durationMin)}
        icon={<Clock className={icon} aria-hidden />}
      />
      <SensorMetric
        label="Avg speed"
        value={stats.avgSpeedKmh === null ? null : fmt(stats.avgSpeedKmh, 0)}
        unit="km/h"
        hint="Distance ÷ ride time"
        icon={<Gauge className={icon} aria-hidden />}
      />
      <SensorMetric
        label="Max speed"
        value={stats.maxSpeedKmh === null ? null : fmt(stats.maxSpeedKmh, 0)}
        unit="km/h"
        hint="Bike module"
        icon={<Zap className={icon} aria-hidden />}
      />
    </div>
  );
}

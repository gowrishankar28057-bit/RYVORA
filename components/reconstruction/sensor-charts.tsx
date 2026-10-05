"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TelemetrySample } from "@/lib/types/telemetry";

const CHARTS: { key: keyof TelemetrySample; title: string; unit: string; color: string }[] = [
  { key: "speedKmh", title: "Speed", unit: "km/h", color: "#071A52" },
  { key: "helmetAccelG", title: "Helmet acceleration", unit: "g", color: "#1677FF" },
  { key: "bikeAccelG", title: "Bike acceleration", unit: "g", color: "#0E9384" },
  { key: "angularRateDps", title: "Angular rotation", unit: "deg/s", color: "#B54708" },
];

export function SensorCharts({ data }: { data: TelemetrySample[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {CHARTS.map((c) => (
        <figure key={c.key} className="rounded-3xl border border-line bg-white p-4">
          <figcaption className="mb-2 flex justify-between text-sm font-bold text-navy">{c.title}<span className="text-xs font-semibold text-muted">{c.unit}</span></figcaption>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} syncId="recon" margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="#E9F0FB" vertical={false} />
                <XAxis dataKey="t" type="number" domain={[-12, 10]} ticks={[-12, -8, -4, 0, 4, 8]} tick={{ fontSize: 11, fill: "#6B7A93" }} tickFormatter={(v) => `${v}s`} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7A93" }} width={44} />
                <Tooltip formatter={(v) => [`${v} ${c.unit}`, c.title]} labelFormatter={(l) => `T ${Number(l) >= 0 ? "+" : ""}${l} s`} />
                <ReferenceLine x={0} stroke="#D92D20" strokeDasharray="4 4" />
                <Line type="monotone" dataKey={c.key} stroke={c.color} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </figure>
      ))}
    </div>
  );
}

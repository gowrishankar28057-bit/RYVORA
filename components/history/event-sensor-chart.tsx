"use client";

import { useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TelemetrySample } from "@/lib/types/telemetry";
import { fmt, fmtT } from "@/lib/utils/format";
import { channelStats, SENSOR_CHANNELS, type ChannelKey } from "./history-model";
import { SegmentedControl } from "@/components/ui/segmented-control";

const INK = { grid: "#E9F0FB", axis: "#6B7A93", navy: "#071A52", line: "#1677FF" };

function ticksFor(min: number, max: number, step = 4): number[] {
  const out: number[] = [];
  for (let t = Math.ceil(min / step) * step; t <= max; t += step) out.push(t);
  return out;
}

/**
 * Compact single-channel view of the black-box window around an event.
 * One series at a time (picked with the segmented control), crosshair tooltip,
 * T = 0 marker, a shaded band where the channel went silent, and a data table.
 */
export function EventSensorChart({ samples, initialChannel = "speedKmh" }: { samples: TelemetrySample[]; initialChannel?: ChannelKey }) {
  const [channel, setChannel] = useState<ChannelKey>(initialChannel);
  const meta = SENSOR_CHANNELS.find((c) => c.key === channel) ?? SENSOR_CHANNELS[0];
  const stats = channelStats(samples, channel);
  const tMin = samples[0]?.t ?? -12;
  const tMax = samples[samples.length - 1]?.t ?? 10;
  const value = (v: number | null) => (v === null ? "Unavailable" : `${fmt(v, meta.digits)} ${meta.unit}`);
  const tableRows = samples.filter((s) => Number.isInteger(s.t));

  return (
    <figure>
      {/* Five options do not fit a 360 px card, so phones get a native select. */}
      <label className="block sm:hidden">
        <span className="sr-only">Sensor channel</span>
        <select
          value={channel}
          onChange={(e) => setChannel(SENSOR_CHANNELS.find((c) => c.key === e.target.value)?.key ?? channel)}
          className="h-11 w-full rounded-xl border border-line bg-white px-3 text-sm font-semibold text-navy"
        >
          {SENSOR_CHANNELS.map((c) => (
            <option key={c.key} value={c.key}>
              {c.title} ({c.unit})
            </option>
          ))}
        </select>
      </label>
      <SegmentedControl
        label="Sensor channel"
        size="sm"
        value={channel}
        onChange={setChannel}
        options={SENSOR_CHANNELS.map((c) => ({ value: c.key, label: c.label }))}
        className="hidden sm:inline-flex"
      />

      <div className="mt-3 hidden items-baseline justify-between gap-3 sm:flex">
        <p className="text-sm font-bold text-navy">{meta.title}</p>
        <p className="text-xs font-semibold text-muted">{meta.unit}</p>
      </div>

      {stats.available < 2 ? (
        <div className="mt-2 grid h-52 place-items-center rounded-2xl border border-dashed border-line bg-surface text-sm text-muted">
          Unavailable for this event
        </div>
      ) : (
        <div className="mt-2 h-52">
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 208 }}>
            <LineChart data={samples} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid stroke={INK.grid} vertical={false} />
              <XAxis
                dataKey="t"
                type="number"
                domain={[tMin, tMax]}
                ticks={ticksFor(tMin, tMax)}
                tick={{ fontSize: 11, fill: INK.axis }}
                tickFormatter={(v: number) => `${v}s`}
                stroke={INK.grid}
              />
              <YAxis tick={{ fontSize: 11, fill: INK.axis }} width={44} stroke={INK.grid} domain={[0, "auto"]} />
              {stats.gap && (
                <ReferenceArea
                  x1={stats.gap.lastSeen}
                  x2={stats.gap.until}
                  fill={INK.grid}
                  fillOpacity={0.7}
                  label={{ value: "No signal", position: "insideTop", fill: INK.axis, fontSize: 11 }}
                />
              )}
              <ReferenceLine
                x={0}
                stroke={INK.navy}
                strokeOpacity={0.45}
                strokeDasharray="4 4"
                label={{ value: "T = 0", position: "insideTopLeft", fill: INK.axis, fontSize: 11 }}
              />
              <Tooltip
                cursor={{ stroke: INK.navy, strokeOpacity: 0.25 }}
                formatter={(v) => [value(typeof v === "number" ? v : null), meta.label]}
                labelFormatter={(l) => fmtT(Number(l))}
                contentStyle={{ borderRadius: 12, borderColor: "#D9E8FF", fontSize: 12, color: INK.navy }}
                labelStyle={{ color: INK.axis, fontWeight: 600 }}
                itemStyle={{ color: INK.navy }}
              />
              <Line
                type="monotone"
                dataKey={channel}
                stroke={INK.line}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <figcaption className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-live="polite">
        <span>
          Peak{" "}
          <strong className="font-semibold text-navy tabular">
            {stats.peak ? `${value(stats.peak.value)} at ${fmtT(stats.peak.t)}` : "Unavailable"}
          </strong>
        </span>
        {stats.gap && (
          <span>
            Signal lost after <strong className="font-semibold text-navy tabular">{fmtT(stats.gap.lastSeen)}</strong> · earlier data kept in
            the phone buffer
          </span>
        )}
      </figcaption>

      <details className="mt-3 rounded-2xl border border-line-soft bg-surface px-3 text-sm">
        <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-navy">Data table · 1 sample per second</summary>
        <div className="max-h-64 overflow-auto pb-3">
          <table className="w-full text-left text-xs tabular">
            <caption className="sr-only">
              {meta.title} in {meta.unit}, one sample per second relative to the event
            </caption>
            <thead className="text-muted">
              <tr>
                <th scope="col" className="py-1.5 pr-3 font-semibold">
                  Time
                </th>
                <th scope="col" className="py-1.5 font-semibold">
                  {meta.label}
                </th>
              </tr>
            </thead>
            <tbody className="text-navy">
              {tableRows.map((s) => (
                <tr key={s.t} className="border-t border-line-soft">
                  <td className="py-1 pr-3">{fmtT(s.t)}</td>
                  <td className="py-1">{value(s[channel])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

"use client";

import { Unplug } from "lucide-react";
import { memo, useId } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import type { TelemetrySample } from "@/lib/types/telemetry";
import { cn } from "@/lib/utils/cn";
import { fmt, fmtT } from "@/lib/utils/format";
import {
  CHANNEL_MAP,
  CHANNELS,
  channelPeak,
  DEVICE_COLORS,
  DEVICE_NAMES,
  type ChannelKey,
  type ChannelMeta,
  type ChartMarker,
} from "./incident-model";

const INK = { grid: "#E9F0FB", axis: "#6B7A93", muted: "#6B7A93", warn: "#B54708", crit: "#D92D20", gap: "#F6F9FE" };
const MARKER_COLOR: Record<ChartMarker["tone"], string> = { neutral: INK.axis, warning: INK.warn, critical: INK.crit };
const SYNC_ID = "ryvora-recon";

function ticksFor(min: number, max: number, step: number): number[] {
  const out: number[] = [];
  for (let t = Math.ceil(min / step) * step; t <= max + 1e-9; t += step) out.push(Math.round(t * 10) / 10);
  return out;
}

const fmtTick = (v: number) => (v === 0 ? "0" : `${v > 0 ? "+" : "−"}${Math.abs(v)}s`);

/** Marker labels live in the top margin, above the plot, so they never cover data. */
function renderMarkerLabel(m: ChartMarker, viewBox: { x?: number; y?: number } | undefined) {
  const x = viewBox?.x ?? 0;
  const y = viewBox?.y ?? 0;
  const right = m.side === "right";
  return (
    <text
      x={x + (right ? 3 : -3)}
      y={y - 5 - m.row * 11}
      textAnchor={right ? "start" : "end"}
      fontSize={10}
      fontWeight={m.tone === "critical" ? 700 : 600}
      fill={MARKER_COLOR[m.tone]}
    >
      {m.label}
    </text>
  );
}

function ChartTooltip({ active, payload, meta }: Pick<TooltipContentProps, "active" | "payload"> & { meta: ChannelMeta }) {
  const entry = payload?.[0];
  if (!active || !entry) return null;
  const row = entry.payload as TelemetrySample | undefined;
  const v = row?.[meta.key];
  return (
    <div className="rounded-xl border border-line bg-white px-2.5 py-1.5 text-xs shadow-[var(--shadow-lift)]">
      <p className="font-bold text-navy tabular">{typeof v === "number" ? `${fmt(v, meta.digits)} ${meta.unit}` : "Unavailable"}</p>
      <p className="mt-0.5 flex items-center gap-1.5 text-muted tabular">
        <span className="h-0.5 w-3 rounded-full" style={{ background: DEVICE_COLORS[meta.device] }} aria-hidden />
        {row ? fmtT(row.t) : "—"}
      </p>
    </div>
  );
}

interface ChartProps {
  meta: ChannelMeta;
  data: TelemetrySample[];
  markers: ChartMarker[];
  domain: [number, number];
  gapFrom: number | null;
  tall: boolean;
  compact: boolean;
  onActiveT?: (t: number | null) => void;
}

function ChannelChart({ meta, data, markers, domain, gapFrom, tall, compact, onActiveT }: ChartProps) {
  const color = DEVICE_COLORS[meta.device];
  const peak = channelPeak(data, meta.key);
  const hasData = data.filter((s) => s[meta.key] !== null).length >= 2;
  const showGap = gapFrom !== null && gapFrom < domain[1];
  const height = compact ? (tall ? "h-44" : "h-40") : tall ? "h-60" : "h-52";
  const captionId = useId();

  return (
    <figure className="flex h-full min-w-0 flex-col rounded-2xl border border-line bg-white p-3.5 sm:p-4" aria-describedby={captionId}>
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-sm font-bold text-navy">{meta.title}</span>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-muted">
          <span className="h-0.5 w-3.5 rounded-full" style={{ background: color }} aria-hidden />
          {DEVICE_NAMES[meta.device]} · {meta.unit}
        </span>
      </figcaption>
      <p id={captionId} className="mt-0.5 text-xs text-muted tabular">
        {peak ? `Peak ${fmt(peak.value, meta.digits)} ${meta.unit} at ${fmtT(peak.t)}` : "No samples recorded"}
      </p>
      {hasData ? (
        <div className={cn("mt-1 w-full min-w-0", height)}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              syncId={SYNC_ID}
              margin={{ top: 28, right: 10, left: 0, bottom: 0 }}
              onMouseMove={(state) => {
                if (!onActiveT) return;
                const idx = Number(state.activeTooltipIndex);
                onActiveT(state.isTooltipActive && Number.isInteger(idx) ? (data[idx]?.t ?? null) : null);
              }}
              onMouseLeave={() => onActiveT?.(null)}
            >
              <CartesianGrid stroke={INK.grid} vertical={false} />
              {showGap && (
                <ReferenceArea
                  x1={gapFrom}
                  x2={domain[1]}
                  fill={INK.gap}
                  fillOpacity={1}
                  ifOverflow="hidden"
                  label={{ value: "No helmet signal", position: "center", fill: INK.muted, fontSize: 11, fontWeight: 600 }}
                />
              )}
              <XAxis
                dataKey="t"
                type="number"
                domain={domain}
                ticks={ticksFor(domain[0], domain[1], tall && !compact ? 2 : 4)}
                tick={{ fontSize: 11, fill: INK.axis }}
                tickFormatter={fmtTick}
                stroke={INK.grid}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 11, fill: INK.axis }} width={40} stroke={INK.grid} tickLine={false} axisLine={false} domain={[0, "auto"]} allowDecimals={meta.digits > 0} />
              <Tooltip
                content={(p) => <ChartTooltip active={p.active} payload={p.payload} meta={meta} />}
                cursor={{ stroke: "#071A52", strokeOpacity: 0.25, strokeWidth: 1 }}
                filterNull={false}
                isAnimationActive={false}
              />
              {markers.map((m) => (
                <ReferenceLine
                  key={`${m.label}-${m.t}`}
                  x={m.t}
                  stroke={MARKER_COLOR[m.tone]}
                  strokeWidth={m.tone === "critical" ? 1.5 : 1}
                  strokeDasharray={m.tone === "critical" ? undefined : "3 3"}
                  strokeOpacity={m.tone === "neutral" ? 0.7 : 1}
                  ifOverflow="hidden"
                  label={(p: { viewBox?: { x?: number; y?: number } }) => renderMarkerLabel(m, p.viewBox)}
                />
              ))}
              <Line
                type="monotone"
                dataKey={meta.key}
                name={meta.title}
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2, fill: color }}
                isAnimationActive={false}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className={cn("mt-2 grid place-items-center rounded-xl border border-dashed border-line bg-surface text-sm text-muted", height)}>
          Unavailable for this event
        </div>
      )}
      {showGap && meta.key === "helmetAccelG" && (
        <p className="mt-2 flex items-start gap-1.5 text-xs font-semibold text-navy">
          <Unplug className="mt-px size-3.5 shrink-0 text-warn" aria-hidden />
          Helmet link lost — remaining verification by phone + bike
        </p>
      )}
    </figure>
  );
}

/**
 * Synchronized black-box charts. All charts share one `syncId`, so hovering (or arrow-keying)
 * one shows the same instant on every channel. Vertical markers are shared timeline events.
 */
export const SensorCharts = memo(function SensorCharts({
  data,
  markers = [{ t: 0, label: "Impact", tone: "critical", side: "right", row: 0 }],
  channels = CHANNELS.map((c) => c.key),
  gapFrom = null,
  compact = false,
  onActiveT,
}: {
  data: TelemetrySample[];
  markers?: ChartMarker[];
  channels?: ChannelKey[];
  /** T at which the helmet stream went silent; shades the rest of the helmet chart. */
  gapFrom?: number | null;
  compact?: boolean;
  /** Called with the hovered T (or null) — lets a parent sync the incident timeline. */
  onActiveT?: (t: number | null) => void;
}) {
  const domain: [number, number] = [data[0]?.t ?? -12, data[data.length - 1]?.t ?? 10];
  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
      {channels.map((key, i) => (
        <div key={key} className={cn("min-w-0", i === 0 && "md:col-span-2")}>
          <ChannelChart
            meta={CHANNEL_MAP[key]}
            data={data}
            markers={markers}
            domain={domain}
            gapFrom={key === "helmetAccelG" ? gapFrom : null}
            tall={i === 0}
            compact={compact}
            onActiveT={onActiveT}
          />
        </div>
      ))}
    </div>
  );
});

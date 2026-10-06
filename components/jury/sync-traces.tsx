import { BrainCircuit, CircleCheck } from "lucide-react";
import { SignalList, VerdictCard } from "@/components/safety/crash-confidence-panel";
import { Kicker } from "@/components/jury/stage";
import { Badge } from "@/components/ui/primitives";
import { HELMET_LOST_AT } from "@/lib/jury/demo-data";
import {
  DEVICE_COLORS,
  peakOf,
  sampleAt,
  sliceBetween,
  tracePath,
  TRACE_CHANNELS,
  xFraction,
  type TraceChannel,
} from "@/lib/jury/playback";
import type { AnalysisFrame } from "@/lib/jury/timeline";
import type { CrashAssessment } from "@/lib/types/events";
import type { TelemetrySample } from "@/lib/types/telemetry";
import { cn } from "@/lib/utils/cn";
import { fmt, fmtT } from "@/lib/utils/format";

const W = 300;
const H = 40;

function TraceRow({
  channel,
  visible,
  from,
  to,
  cursor,
  current,
}: {
  channel: TraceChannel;
  visible: TelemetrySample[];
  from: number;
  to: number;
  cursor: number;
  current: number | null;
}) {
  const color = DEVICE_COLORS[channel.device];
  const path = tracePath(visible, channel.key, { from, to, max: channel.max, width: W, height: H });
  const peak = peakOf(visible, channel.key);
  const lost = current === null && channel.device === "helmet" && cursor > HELMET_LOST_AT;
  const cursorX = xFraction(cursor, from, to) * 100;
  const impactX = xFraction(0, from, to) * 100;
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="flex min-w-0 items-center gap-1.5 font-semibold text-navy">
          <span className="size-2 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
          {channel.label}
          <span className="font-normal text-muted">{channel.unit}</span>
        </span>
        <span className={cn("shrink-0 font-bold tabular", lost ? "text-crit" : "text-navy")}>
          {lost ? "Link lost" : current === null ? "—" : fmt(current, channel.digits)}
        </span>
      </div>
      <div className="relative mt-1 h-10 rounded-lg bg-surface">
        <span className="absolute inset-x-0 bottom-0 h-px bg-line" aria-hidden />
        {cursor >= 0 && (
          <span
            className="absolute inset-y-0 border-l border-dashed border-crit-strong/60"
            style={{ left: `${impactX}%` }}
            aria-hidden
          />
        )}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 size-full overflow-visible"
          role="img"
          aria-label={`${channel.label}: peak so far ${peak === null ? "unavailable" : `${fmt(peak, channel.digits)} ${channel.unit}`}`}
        >
          <path d={path} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        </svg>
        <span className="absolute inset-y-[-3px] w-0.5 rounded-full bg-navy" style={{ left: `calc(${cursorX}% - 1px)` }} aria-hidden />
      </div>
    </li>
  );
}

/**
 * Synchronized mini-charts on fixed, shared scales. Data is revealed up to the
 * replay cursor, so the jury watches every device react at the same instant.
 */
export function SyncTraces({
  series,
  from,
  to,
  cursor,
  channels = TRACE_CHANNELS,
}: {
  series: readonly TelemetrySample[];
  from: number;
  to: number;
  cursor: number;
  channels?: readonly TraceChannel[];
}) {
  const visible = sliceBetween(series, from, Math.min(cursor, to));
  const now = sampleAt(series, cursor);
  return (
    <div>
      <ul className="space-y-2.5">
        {channels.map((ch) => (
          <TraceRow key={ch.key} channel={ch} visible={visible} from={from} to={to} cursor={cursor} current={now?.[ch.key] ?? null} />
        ))}
      </ul>
      <div className="mt-2 flex justify-between text-[11px] font-semibold text-muted tabular" aria-hidden>
        <span>{fmtT(from)}</span>
        <span className="text-navy">{fmtT(Math.round(cursor * 10) / 10)}</span>
        <span>{fmtT(to)}</span>
      </div>
    </div>
  );
}

/** Peak value per channel over the event window — the evidence the engine reads. */
export function EvidenceStrip({ series, from, to }: { series: readonly TelemetrySample[]; from: number; to: number }) {
  const samples = sliceBetween(series, from, to);
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5" aria-label="Peak values in the event window">
      {TRACE_CHANNELS.map((ch) => {
        const peak = peakOf(samples, ch.key);
        return (
          <li key={ch.key} className="rounded-2xl border border-line-soft bg-white px-3 py-2">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
              <span className="size-1.5 rounded-full" style={{ background: DEVICE_COLORS[ch.device] }} aria-hidden />
              {ch.label} peak
            </span>
            <span className="mt-0.5 block font-[family-name:var(--font-display)] text-base font-extrabold text-navy tabular">
              {peak === null ? "Unavailable" : fmt(peak, ch.digits)}
              {peak !== null && <span className="ml-1 text-[11px] font-semibold text-muted">{ch.unit}</span>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Engine signals revealed one by one, then the verdict and the reasons. */
export function EnginePanel({ assessment, frame }: { assessment: CrashAssessment; frame: AnalysisFrame }) {
  const done = frame.phase === "verdict";
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <div className="min-w-0">
        <Kicker className="mb-2">Sensor inputs · helmet · bike · phone</Kicker>
        <SignalList signals={assessment.signals} revealed={frame.signals} />
      </div>
      <div className="flex min-w-0 flex-col">
        <div className="mb-2 flex items-center gap-2">
          <span className="relative grid size-7 place-items-center rounded-lg bg-navy text-white">
            {!done && <span className="absolute inset-0 rounded-lg bg-brand/40 motion-safe:animate-pulse-ring" aria-hidden />}
            <BrainCircuit className="relative size-4" aria-hidden />
          </span>
          <Kicker>RYVORA crash confidence engine</Kicker>
        </div>
        {done ? (
          <div className="space-y-3 motion-safe:animate-fade-up">
            {/* VerdictCard shrinks itself below `sm`, so one copy serves every width. */}
            <VerdictCard assessment={assessment} />
            <ul className="space-y-1.5">
              {assessment.reasons.map((r) => (
                <li key={r} className="flex gap-2 text-sm text-body">
                  <CircleCheck className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="grid flex-1 place-items-center rounded-3xl border border-dashed border-line bg-surface p-8 text-center">
            <div>
              <p className="font-[family-name:var(--font-display)] text-lg font-bold text-navy">Verifying across devices…</p>
              <p className="mt-1 text-sm text-muted tabular">
                {frame.signals} of {assessment.signals.length} signals read
              </p>
              <Badge tone="info" className="mt-3">
                No single threshold decides
              </Badge>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

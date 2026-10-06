import { buildSnapshot, HEALTHY_STATE, type LiveValues } from "@/lib/simulation/device-state";
import type { SystemSnapshot, TelemetrySample } from "@/lib/types/telemetry";
import { DEMO_EPOCH, HELMET_LOST_AT } from "./demo-data";

/**
 * Deterministic playback over simulated telemetry. Pure functions of time only.
 */

export type ChannelKey = Exclude<keyof TelemetrySample, "t">;
export type TraceDevice = "helmet" | "bike" | "phone";

/** One hue per device, matching the desktop reconstruction charts. */
export const DEVICE_COLORS: Record<TraceDevice, string> = {
  helmet: "#1677FF",
  bike: "#0E9384",
  phone: "#6E56CF",
};

export interface TraceChannel {
  key: ChannelKey;
  label: string;
  unit: string;
  digits: number;
  device: TraceDevice;
  /** Fixed y-axis ceiling, shared by every step so the helmet drop and the crash compare honestly. */
  max: number;
}

export const TRACE_CHANNELS: readonly TraceChannel[] = [
  { key: "speedKmh", label: "Speed", unit: "km/h", digits: 0, device: "bike", max: 60 },
  { key: "helmetAccelG", label: "Helmet", unit: "g", digits: 1, device: "helmet", max: 70 },
  { key: "bikeAccelG", label: "Bike", unit: "g", digits: 2, device: "bike", max: 7 },
  { key: "angularRateDps", label: "Rotation", unit: "deg/s", digits: 0, device: "bike", max: 350 },
  { key: "phoneAccelG", label: "Phone", unit: "g", digits: 2, device: "phone", max: 4 },
];

/** Index of the last sample with `t <= at` (0 when `at` precedes the series). Series are sorted by t. */
export function indexAt(series: readonly TelemetrySample[], at: number): number {
  let lo = 0;
  let hi = series.length - 1;
  if (hi < 0 || at <= series[0].t) return 0;
  if (at >= series[hi].t) return hi;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (series[mid].t <= at + 1e-9) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

export function sampleAt(series: readonly TelemetrySample[], at: number): TelemetrySample | null {
  return series.length ? series[indexAt(series, at)] : null;
}

/** Samples with `from <= t <= to`. */
export function sliceBetween(series: readonly TelemetrySample[], from: number, to: number): TelemetrySample[] {
  if (!series.length || to < from) return [];
  return series.filter((s) => s.t >= from - 1e-9 && s.t <= to + 1e-9);
}

/** Peak non-null value of a channel (null when the channel has no data). */
export function peakOf(samples: readonly TelemetrySample[], key: ChannelKey): number | null {
  let peak: number | null = null;
  for (const s of samples) {
    const v = s[key];
    if (v !== null && Number.isFinite(v) && (peak === null || v > peak)) peak = v;
  }
  return peak;
}

export interface PathBox {
  from: number;
  to: number;
  max: number;
  width: number;
  height: number;
}

/** SVG path for one channel; null samples break the line (lost signal stays visibly lost). */
export function tracePath(samples: readonly TelemetrySample[], key: ChannelKey, box: PathBox): string {
  const span = box.to - box.from || 1;
  const max = box.max > 0 ? box.max : 1;
  let d = "";
  let pen = false;
  for (const s of samples) {
    const v = s[key];
    if (v === null || !Number.isFinite(v)) {
      pen = false;
      continue;
    }
    const x = ((s.t - box.from) / span) * box.width;
    const y = box.height - (Math.max(0, Math.min(max, v)) / max) * box.height;
    d += `${pen ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
    pen = true;
  }
  return d;
}

/** x position (0..1) of event time `t` inside [from, to]. */
export function xFraction(t: number, from: number, to: number): number {
  return to === from ? 0 : Math.max(0, Math.min(1, (t - from) / (to - from)));
}

/* ── Step 3 · live ride (synthetic but smooth and deterministic) ────────── */

/** Riding values at `t` seconds after the ride started. Before t = 0 the bike idles. */
export function rideLive(t: number): LiveValues {
  const ramp = t <= 0 ? 0 : 1 - (1 - Math.min(1, t / 4.5)) ** 2;
  const speedKmh = 44 * ramp + 2.2 * Math.sin(t * 0.9) * ramp;
  const vib = 0.0025 * speedKmh;
  return {
    speedKmh: Math.max(0, speedKmh),
    helmetAccelG: 1 + 0.06 * Math.sin(t * 2.3) + 0.03 * Math.sin(t * 7.1 + 0.4) + vib,
    bikeAccelG: 0.04 + ramp * (0.1 + 0.05 * Math.sin(t * 3.1)) + 0.02 * Math.sin(t * 9.7 + 1.1) * ramp,
    angularRateDps: 0.5 + ramp * (8 + 6 * Math.abs(Math.sin(t / 1.6))),
    phoneAccelG: 0.05 + ramp * (0.07 + 0.04 * Math.sin(t * 1.7 + 1)) + 0.015 * Math.sin(t * 6.3),
    leanDeg: ramp * 6 * Math.sin(t / 2.2),
  };
}

export const RIDE_STREAM_POINTS = 40;
export const RIDE_STREAM_SPACING_S = 0.125;

/** Sparkline windows (last 5 s) ending at `t`. */
export function rideStreams(t: number) {
  const helmet: number[] = [];
  const bike: number[] = [];
  const phone: number[] = [];
  for (let i = RIDE_STREAM_POINTS - 1; i >= 0; i--) {
    const v = rideLive(t - i * RIDE_STREAM_SPACING_S);
    helmet.push(v.helmetAccelG);
    bike.push(v.bikeAccelG);
    phone.push(v.phoneAccelG);
  }
  return { helmet, bike, phone };
}

export function rideSnapshot(t: number): SystemSnapshot {
  return buildSnapshot(HEALTHY_STATE, DEMO_EPOCH + Math.round(t * 1000), rideLive(t), 0.5 + 0.5 * Math.sin(t));
}

/* ── Step 5 · severe crash replay ───────────────────────────────────────── */

/** Phone view of the crash at event time `at`: the helmet link drops just after impact. */
export function crashSnapshot(series: readonly TelemetrySample[], at: number): SystemSnapshot {
  const s = sampleAt(series, at);
  const helmetConnected = at <= HELMET_LOST_AT;
  return buildSnapshot(
    { ...HEALTHY_STATE, helmetConnected },
    DEMO_EPOCH + Math.round(at * 1000),
    {
      speedKmh: s?.speedKmh ?? 0,
      helmetAccelG: s?.helmetAccelG ?? 0,
      bikeAccelG: s?.bikeAccelG ?? 0,
      angularRateDps: s?.angularRateDps ?? 0,
      phoneAccelG: s?.phoneAccelG ?? 0,
      leanDeg: 0,
    },
  );
}

/** Last `count` values of a channel up to event time `at` (padded with the first value). */
export function streamUntil(series: readonly TelemetrySample[], at: number, key: ChannelKey, count: number): (number | null)[] {
  const end = indexAt(series, at);
  const out: (number | null)[] = [];
  for (let i = end - count + 1; i <= end; i++) out.push(series[Math.max(0, i)]?.[key] ?? null);
  return out;
}

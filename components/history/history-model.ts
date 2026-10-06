import type { HistoryEntry } from "@/data/rides";
import { assessEvent, ESCALATION_THRESHOLD } from "@/lib/engine/crash-confidence";
import { getScenario } from "@/lib/simulation/scenarios";
import type { CrashAssessment, EventClass, ResponseAction } from "@/lib/types/events";
import type { TelemetrySample } from "@/lib/types/telemetry";

/**
 * Pure helpers behind the History screens. Everything here is derived from
 * `RIDE_HISTORY` + the crash confidence engine — nothing is hard-coded per event.
 */

/* ── Filtering ─────────────────────────────────────────────────────────── */

export type HistoryFilter = "all" | "rides" | "events";

export const HISTORY_FILTERS: { value: HistoryFilter; label: string; noun: [string, string] }[] = [
  { value: "all", label: "All", noun: ["entry", "entries"] },
  { value: "rides", label: "Rides", noun: ["ride", "rides"] },
  { value: "events", label: "Safety events", noun: ["safety event", "safety events"] },
];

export function filterHistory<T extends Pick<HistoryEntry, "kind">>(entries: T[], filter: HistoryFilter): T[] {
  if (filter === "rides") return entries.filter((e) => e.kind === "ride");
  if (filter === "events") return entries.filter((e) => e.kind === "event");
  return entries;
}

export function isHistoryFilter(v: string): v is HistoryFilter {
  return HISTORY_FILTERS.some((f) => f.value === v);
}

/* ── Engine verdicts ───────────────────────────────────────────────────── */

/** Engine verdict for a safety event. `null` for rides or an unknown scenario. */
export function assessEntry(entry: Pick<HistoryEntry, "kind" | "scenarioId">): CrashAssessment | null {
  if (entry.kind !== "event") return null;
  const scenario = getScenario(entry.scenarioId);
  return scenario ? assessEvent(scenario.input) : null;
}

/**
 * Event classes where a spike that a single-sensor threshold could mistake
 * for a crash (head impact, bike rotation, road shock) was rejected by fusion.
 */
export const FALSE_TRIGGER_CLASSES: ReadonlySet<EventClass> = new Set<EventClass>(["POTHOLE", "HELMET_DROP", "BIKE_FALL"]);

export function isFalseTriggerRejected(assessment: CrashAssessment | null): boolean {
  return !!assessment && !assessment.emergency && FALSE_TRIGGER_CLASSES.has(assessment.eventClass);
}

/* ── Summary ───────────────────────────────────────────────────────────── */

export interface HistorySummary {
  rides: number;
  distanceKm: number;
  events: number;
  falseTriggersRejected: number;
}

export function summarizeHistory(entries: HistoryEntry[]): HistorySummary {
  let rides = 0;
  let distanceKm = 0;
  let events = 0;
  let falseTriggersRejected = 0;
  for (const e of entries) {
    if (e.kind === "ride") {
      rides += 1;
      distanceKm += finite(e.distanceKm) ?? 0;
    } else {
      events += 1;
      if (isFalseTriggerRejected(assessEntry(e))) falseTriggersRejected += 1;
    }
  }
  return { rides, distanceKm: Math.round(distanceKm * 10) / 10, events, falseTriggersRejected };
}

/* ── Ride stats ────────────────────────────────────────────────────────── */

export interface RideStats {
  distanceKm: number | null;
  durationMin: number | null;
  avgSpeedKmh: number | null;
  maxSpeedKmh: number | null;
}

function finite(v: number | null | undefined): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** Ride figures with `null` for anything missing. Average speed is derived from distance ÷ time. */
export function rideStats(entry: Pick<HistoryEntry, "distanceKm" | "durationMin" | "maxSpeedKmh">): RideStats {
  const distanceKm = finite(entry.distanceKm);
  const durationMin = finite(entry.durationMin);
  const avgSpeedKmh = distanceKm !== null && durationMin !== null && durationMin > 0 ? (distanceKm / durationMin) * 60 : null;
  return { distanceKm, durationMin, avgSpeedKmh, maxSpeedKmh: finite(entry.maxSpeedKmh) };
}

export function fmtMinutes(min: number | null): string {
  if (min === null || min < 0) return "—";
  const m = Math.round(min);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h} h ${rest} min` : `${h} h`;
}

/* ── Dates (always shown in IST) ───────────────────────────────────────── */

/*
 * IST is a fixed UTC+05:30 with no daylight saving, so dates are formatted
 * arithmetically rather than through Intl. That keeps server and browser
 * output byte-identical (no ICU-version differences → no hydration mismatch).
 */
const IST_OFFSET_MS = 330 * 60_000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const pad = (n: number) => String(n).padStart(2, "0");

function istParts(iso: string) {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return null;
  const z = new Date(ms + IST_OFFSET_MS);
  return {
    year: z.getUTCFullYear(),
    month: z.getUTCMonth(),
    day: z.getUTCDate(),
    weekday: z.getUTCDay(),
    time: `${pad(z.getUTCHours())}:${pad(z.getUTCMinutes())}`,
  };
}

/** `YYYY-MM-DD` of the IST calendar day, or `"unknown"`. */
export function istDayKey(iso: string): string {
  const p = istParts(iso);
  return p ? `${p.year}-${pad(p.month + 1)}-${pad(p.day)}` : "unknown";
}

/** e.g. "Sun, 4 Oct 2026". */
export function fmtIstDay(iso: string): string {
  const p = istParts(iso);
  return p ? `${WEEKDAYS[p.weekday]}, ${p.day} ${MONTHS[p.month]} ${p.year}` : "Date unavailable";
}

/** e.g. "19:42". */
export function fmtIstTime(iso: string): string {
  return istParts(iso)?.time ?? "—";
}

/** e.g. "4 Oct, 19:42" — compact form for cards. */
export function fmtIstShort(iso: string): string {
  const p = istParts(iso);
  return p ? `${p.day} ${MONTHS[p.month]}, ${p.time}` : "Date unavailable";
}

/** e.g. "Sun, 4 Oct 2026 · 19:42 IST". */
export function fmtIstDateTime(iso: string): string {
  const p = istParts(iso);
  return p ? `${fmtIstDay(iso)} · ${p.time} IST` : "Date unavailable";
}

export interface HistoryDay<T> {
  key: string;
  label: string;
  entries: T[];
}

/** Group entries by IST calendar day, keeping the input order (history is newest first). */
export function groupByIstDay<T extends Pick<HistoryEntry, "occurredAt">>(entries: T[]): HistoryDay<T>[] {
  const days = new Map<string, HistoryDay<T>>();
  for (const e of entries) {
    const key = istDayKey(e.occurredAt);
    const day = days.get(key);
    if (day) day.entries.push(e);
    else days.set(key, { key, label: fmtIstDay(e.occurredAt), entries: [e] });
  }
  return [...days.values()];
}

/* ── Sensor channels (for the event chart) ─────────────────────────────── */

export type ChannelKey = "speedKmh" | "helmetAccelG" | "bikeAccelG" | "angularRateDps" | "phoneAccelG";

export interface ChannelMeta {
  key: ChannelKey;
  /** Short label for the channel picker. */
  label: string;
  title: string;
  unit: string;
  digits: number;
}

export const SENSOR_CHANNELS: ChannelMeta[] = [
  { key: "speedKmh", label: "Speed", title: "Bike speed", unit: "km/h", digits: 0 },
  { key: "helmetAccelG", label: "Helmet", title: "Helmet acceleration", unit: "g", digits: 1 },
  { key: "bikeAccelG", label: "Bike", title: "Bike acceleration", unit: "g", digits: 2 },
  { key: "angularRateDps", label: "Rotation", title: "Bike rotation", unit: "deg/s", digits: 0 },
  { key: "phoneAccelG", label: "Phone", title: "Phone acceleration", unit: "g", digits: 2 },
];

const DEFAULT_CHANNEL: Record<EventClass, ChannelKey> = {
  NORMAL: "speedKmh",
  POTHOLE: "bikeAccelG",
  HARD_BRAKING: "speedKmh",
  HELMET_DROP: "helmetAccelG",
  BIKE_FALL: "angularRateDps",
  MINOR_INCIDENT: "angularRateDps",
  SEVERE_CRASH: "helmetAccelG",
};

export interface ChannelStats {
  /** Highest reading and when it happened, or `null` when the channel has no data. */
  peak: { t: number; value: number } | null;
  /**
   * First stretch where the channel went silent after having data (e.g. helmet link lost):
   * `lastSeen` is the last sample with a value, `until` the last silent sample.
   */
  gap: { lastSeen: number; until: number } | null;
  /** Number of samples with a value. */
  available: number;
}

export function channelStats(samples: TelemetrySample[], key: ChannelKey): ChannelStats {
  let peak: ChannelStats["peak"] = null;
  let available = 0;
  let lastSeen: number | null = null;
  let gapLastSeen: number | null = null;
  let gapUntil: number | null = null;
  let gapClosed = false;
  for (const s of samples) {
    const v = s[key];
    if (typeof v === "number" && Number.isFinite(v)) {
      available += 1;
      lastSeen = s.t;
      if (gapLastSeen !== null) gapClosed = true;
      if (!peak || v > peak.value) peak = { t: s.t, value: v };
    } else if (lastSeen !== null && !gapClosed) {
      gapLastSeen ??= lastSeen;
      gapUntil = s.t;
    }
  }
  const gap = gapLastSeen !== null && gapUntil !== null ? { lastSeen: gapLastSeen, until: gapUntil } : null;
  return { peak, gap, available };
}

/** The channel that best shows why the engine reached its verdict. */
export function defaultChannelFor(eventClass: EventClass | null | undefined): ChannelKey {
  return eventClass ? DEFAULT_CHANNEL[eventClass] : "speedKmh";
}

/* ── Navigation ────────────────────────────────────────────────────────── */

/** Neighbours in a newest-first list: `newer` is the previous item, `older` the next. */
export function adjacentEntries<T extends { id: string }>(entries: T[], id: string): { newer: T | null; older: T | null } {
  const i = entries.findIndex((e) => e.id === id);
  if (i === -1) return { newer: null, older: null };
  return { newer: entries[i - 1] ?? null, older: entries[i + 1] ?? null };
}

/* ── Response taken ────────────────────────────────────────────────────── */

export type ResponseTone = "success" | "info" | "warning" | "critical";

export interface ResponseDescription {
  action: ResponseAction;
  title: string;
  detail: string;
  tone: ResponseTone;
  /** True when the step is a demonstrated workflow, not something that happened. */
  simulated: boolean;
}

const RESPONSES: Record<ResponseAction, Omit<ResponseDescription, "action">> = {
  none: {
    title: "No action needed",
    detail: "All signals stayed in normal riding ranges. Nothing was raised to the rider.",
    tone: "success",
    simulated: false,
  },
  log: {
    title: "Logged only",
    detail: "Saved to ride history for review. No alert was raised and no one was contacted.",
    tone: "info",
    simulated: false,
  },
  "inspect-helmet": {
    title: "Helmet inspection suggested",
    detail:
      "The helmet took a hard knock while it was not being worn. Check the shell and liner before the next ride. No emergency was triggered.",
    tone: "info",
    simulated: false,
  },
  "notify-rider": {
    title: "Rider notified",
    detail: "A phone notification told the rider the parked bike had fallen. No emergency contact was alerted.",
    tone: "info",
    simulated: false,
  },
  "rider-check": {
    title: "Rider check-in",
    detail: "An “Are you okay?” check-in was shown on the phone. This event type never escalates automatically.",
    tone: "warning",
    simulated: false,
  },
  "rider-check-escalate": {
    title: "Rider check → emergency workflow",
    detail:
      "An “Are you okay?” rider check started. Without a response before the countdown ends, the emergency workflow runs: location, contact notification and incident package. In this prototype it is demonstrated only — no messages, calls or emergency services are contacted.",
    tone: "critical",
    simulated: true,
  },
};

/** Human description of what RYVORA did, derived from the engine's action. */
export function describeResponse(a: Pick<CrashAssessment, "action" | "emergency">): ResponseDescription {
  if (a.action === "rider-check-escalate" && !a.emergency) {
    return {
      action: a.action,
      title: "Rider check-in · escalation held",
      detail: `Confidence stayed below the ${Math.round(ESCALATION_THRESHOLD * 100)} % escalation threshold, so only a rider check-in was requested.`,
      tone: "warning",
      simulated: false,
    };
  }
  return { action: a.action, ...RESPONSES[a.action] };
}

import { INCIDENT } from "@/data/rider";
import { assessEvent, confidencePct, EVENT_LABELS } from "@/lib/engine/crash-confidence";
import { SCENARIO_MAP } from "@/lib/simulation/scenarios";
import { downsample } from "@/lib/simulation/series";
import type { CrashAssessment, EventClass, SignalKey, TimelineEntry } from "@/lib/types/events";
import type { TelemetrySample } from "@/lib/types/telemetry";
import { fmtT } from "@/lib/utils/format";

/**
 * Pure model for the desktop crash reconstruction.
 * Everything here is deterministic so server and client render identical output.
 * All data is SIMULATED.
 */

export type ChannelKey = Exclude<keyof TelemetrySample, "t">;
export type SourceDevice = "helmet" | "bike" | "phone";

/** Validated categorical palette (one hue per device; colour follows the device). */
export const DEVICE_COLORS: Record<SourceDevice, string> = {
  helmet: "#1677FF",
  bike: "#0E9384",
  phone: "#6E56CF",
};

export const DEVICE_NAMES: Record<SourceDevice | "system", string> = {
  helmet: "Helmet",
  bike: "Bike module",
  phone: "Phone",
  system: "RYVORA engine",
};

export interface ChannelMeta {
  key: ChannelKey;
  title: string;
  short: string;
  unit: string;
  digits: number;
  device: SourceDevice;
}

export const CHANNELS: ChannelMeta[] = [
  { key: "speedKmh", title: "Speed over time", short: "Speed", unit: "km/h", digits: 0, device: "bike" },
  { key: "helmetAccelG", title: "Helmet acceleration", short: "Helmet", unit: "g", digits: 1, device: "helmet" },
  { key: "bikeAccelG", title: "Bike acceleration", short: "Bike", unit: "g", digits: 2, device: "bike" },
  { key: "angularRateDps", title: "Angular rotation", short: "Rotation", unit: "deg/s", digits: 0, device: "bike" },
  { key: "phoneAccelG", title: "Phone acceleration", short: "Phone", unit: "g", digits: 2, device: "phone" },
];

export const CHANNEL_MAP = Object.fromEntries(CHANNELS.map((c) => [c.key, c])) as Record<ChannelKey, ChannelMeta>;

export type MarkerTone = "neutral" | "warning" | "critical";

/** A vertical reference line drawn on every chart. */
export interface ChartMarker {
  t: number;
  label: string;
  tone: MarkerTone;
  /** Labels left of T = 0 grow leftwards, the rest rightwards. */
  side: "left" | "right";
  /** Stacked label row (0 = closest to the plot) so nearby labels never collide. */
  row: number;
}

export interface DeviceAtImpact {
  device: SourceDevice;
  name: string;
  status: string;
  detail: string;
  tone: "success" | "warning" | "critical";
}

export interface IncidentExplanation {
  summary: string;
  reasons: string[];
  disclaimer: string;
}

export interface Incident {
  id: string;
  scenarioId: string;
  scenarioLabel: string;
  occurredAt: string;
  occurredAtIst: string;
  location: { lat: number; lon: number; accuracyM: number; label: string };
  assessment: CrashAssessment;
  classLabel: string;
  timeline: TimelineEntry[];
  /** Chart-rate samples (downsampled from the 20 Hz source). */
  samples: TelemetrySample[];
  sourceHz: number;
  sampleHz: number;
  window: { from: number; to: number };
  /** Seconds of rolling pre-crash history the phone keeps. */
  bufferSeconds: number;
  /** T of the last helmet packet when the link dropped mid-window, else null. */
  helmetLinkLostT: number | null;
  markers: ChartMarker[];
  devices: DeviceAtImpact[];
  explanation: IncidentExplanation;
}

export const RECON_SCENARIO_ID = "severe-crash";
export const PHONE_BUFFER_SECONDS = 30;
const SOURCE_HZ = 20;
const DOWNSAMPLE_EVERY = 2;

export const EXPLANATION_DISCLAIMER =
  "Automated, rule-based summary of simulated sensor data. Not a medical, legal or insurance determination.";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const pad = (n: number) => String(n).padStart(2, "0");

/** Deterministic IST formatting (no locale/ICU differences between server and browser). */
export function fmtIst(iso: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "Unavailable";
  const d = new Date(ms + IST_OFFSET_MS);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} IST`;
}

export function fmtCoord(lat: number, lon: number): string {
  return `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? "E" : "W"}`;
}

/** "8 s", "0.9 s" — gap between two timeline entries. */
export function fmtDelta(seconds: number): string {
  const v = Math.round(Math.abs(seconds) * 10) / 10;
  return `${Number.isInteger(v) ? v.toFixed(0) : v.toFixed(1)} s`;
}

/**
 * If a channel goes silent part-way through the window (trailing nulls after real data),
 * returns the T of its last sample. Returns null when the channel never drops out.
 */
export function lastAvailableT(samples: TelemetrySample[], key: ChannelKey): number | null {
  let last = -1;
  for (let i = 0; i < samples.length; i++) if (samples[i][key] !== null) last = i;
  if (last === -1 || last === samples.length - 1) return null;
  return samples[last].t;
}

export function channelPeak(samples: TelemetrySample[], key: ChannelKey): { t: number; value: number } | null {
  let best: { t: number; value: number } | null = null;
  for (const s of samples) {
    const v = s[key];
    if (v !== null && Number.isFinite(v) && (best === null || v > best.value)) best = { t: s.t, value: v };
  }
  return best;
}

/** Index of the latest timeline entry at or before `t` (−1 if none yet, null if no cursor). */
export function activeEntryIndex(timeline: TimelineEntry[], t: number | null): number | null {
  if (t === null || !Number.isFinite(t)) return null;
  let idx = -1;
  timeline.forEach((e, i) => {
    if (e.t <= t + 1e-6) idx = i;
  });
  return idx;
}

/** Assigns label sides and rows so labels around T = 0 never overlap. */
export function layoutMarkers(raw: { t: number; label: string; tone: MarkerTone }[]): ChartMarker[] {
  const left = raw.filter((m) => m.t < 0).sort((a, b) => b.t - a.t);
  const right = raw.filter((m) => m.t >= 0).sort((a, b) => a.t - b.t);
  const placed = [
    ...left.map((m, i) => ({ ...m, side: "left" as const, row: i % 2 })),
    ...right.map((m, i) => ({ ...m, side: "right" as const, row: i % 2 })),
  ];
  return placed.sort((a, b) => a.t - b.t);
}

const findT = (timeline: TimelineEntry[], pattern: RegExp) => timeline.find((e) => pattern.test(e.title))?.t;

export function buildMarkers(timeline: TimelineEntry[], helmetLinkLostT: number | null): ChartMarker[] {
  const raw: { t: number; label: string; tone: MarkerTone }[] = [];
  const braking = findT(timeline, /brak/i);
  const rotation = findT(timeline, /rotation/i);
  if (braking !== undefined && braking < 0) raw.push({ t: braking, label: "Braking", tone: "neutral" });
  if (rotation !== undefined && rotation < 0) raw.push({ t: rotation, label: "Rotation", tone: "warning" });
  raw.push({ t: 0, label: "Impact", tone: "critical" });
  if (helmetLinkLostT !== null && helmetLinkLostT >= 0) raw.push({ t: helmetLinkLostT, label: "Link lost", tone: "neutral" });
  return layoutMarkers(raw);
}

const SENTENCE_PHRASES: { key: SignalKey; phrase: string }[] = [
  { key: "helmetImpactG", phrase: "a helmet impact" },
  { key: "speedDropKmh", phrase: "rapid motorcycle deceleration" },
  { key: "bikeRotationDps", phrase: "bike rotation" },
  { key: "phoneDecelG", phrase: "phone movement" },
];

function joinPhrases(parts: string[]): string {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/** One-sentence, plain-language summary of which signals agreed inside the event window. */
export function explanationSentence(assessment: CrashAssessment): string {
  const strong = SENTENCE_PHRASES.filter(({ key }) => {
    const s = assessment.signals.find((x) => x.key === key);
    return !!s && s.available && (s.level === "HIGH" || s.level === "MODERATE") && (s.agreement ?? 0) >= 0.5;
  }).map((p) => p.phrase);
  const severe = assessment.eventClass === "SEVERE_CRASH";
  if (strong.length === 0) {
    return severe
      ? "Crash confidence is limited because few independent signals agreed within the event window."
      : "No combination of strong crash signals occurred within the same event window.";
  }
  const verb = severe ? "increased" : "was assessed";
  return `Crash confidence ${verb} because ${joinPhrases(strong)} occurred within the same event window.`;
}

function deviceStatus(
  samples: TelemetrySample[],
  assessment: CrashAssessment,
  helmetLinkLostT: number | null,
  accuracyM: number,
): DeviceAtImpact[] {
  const helmetPeak = channelPeak(samples, "helmetAccelG");
  const impact = assessment.signals.find((s) => s.key === "helmetImpactG");
  const impactText = impact?.available ? impact.display : helmetPeak ? `${helmetPeak.value.toFixed(0)} g` : null;
  const bikeLost = lastAvailableT(samples, "speedKmh");
  const phoneLost = lastAvailableT(samples, "phoneAccelG");
  return [
    {
      device: "helmet",
      name: DEVICE_NAMES.helmet,
      status: helmetLinkLostT !== null ? `Link lost at ${fmtT(helmetLinkLostT)}` : "Connected",
      detail: impactText ? `Impact packet (${impactText}) received before link loss` : "Impact packet unavailable",
      tone: helmetLinkLostT !== null ? "critical" : "success",
    },
    {
      device: "bike",
      name: DEVICE_NAMES.bike,
      status: bikeLost !== null ? `Link lost at ${fmtT(bikeLost)}` : "Connected · logging",
      detail: "Speed, acceleration and rotation recorded",
      tone: bikeLost !== null ? "warning" : "success",
    },
    {
      device: "phone",
      name: DEVICE_NAMES.phone,
      status: `${PHONE_BUFFER_SECONDS} s buffer retained`,
      detail: phoneLost !== null ? `Motion sensors stopped at ${fmtT(phoneLost)}` : `GPS fix ±${accuracyM} m · motion sensors active`,
      tone: phoneLost !== null ? "warning" : "success",
    },
  ];
}

export function buildIncident(scenarioId: string = RECON_SCENARIO_ID): Incident {
  const scenario = SCENARIO_MAP[scenarioId] ?? SCENARIO_MAP[RECON_SCENARIO_ID];
  const assessment = assessEvent(scenario.input);
  const samples = downsample(scenario.series(), DOWNSAMPLE_EVERY);
  const helmetLinkLostT = lastAvailableT(samples, "helmetAccelG");
  const location = { ...INCIDENT.location };
  return {
    id: INCIDENT.id,
    scenarioId: scenario.id,
    scenarioLabel: scenario.label,
    occurredAt: INCIDENT.occurredAt,
    occurredAtIst: fmtIst(INCIDENT.occurredAt),
    location,
    assessment,
    classLabel: classLabel(assessment.eventClass),
    timeline: scenario.timeline,
    samples,
    sourceHz: SOURCE_HZ,
    sampleHz: SOURCE_HZ / DOWNSAMPLE_EVERY,
    window: { from: samples[0]?.t ?? -12, to: samples[samples.length - 1]?.t ?? 10 },
    bufferSeconds: PHONE_BUFFER_SECONDS,
    helmetLinkLostT,
    markers: buildMarkers(scenario.timeline, helmetLinkLostT),
    devices: deviceStatus(samples, assessment, helmetLinkLostT, location.accuracyM),
    explanation: {
      summary: explanationSentence(assessment),
      reasons: assessment.reasons,
      disclaimer: EXPLANATION_DISCLAIMER,
    },
  };
}

export function classLabel(eventClass: EventClass): string {
  return eventClass === "SEVERE_CRASH" ? "Possible severe crash" : EVENT_LABELS[eventClass];
}

/** Rows for the accessible table view: whole seconds plus every timeline/marker instant. */
export function tableRows(incident: Pick<Incident, "samples" | "timeline" | "markers">): TelemetrySample[] {
  const keyTimes = new Set([...incident.timeline.map((e) => e.t), ...incident.markers.map((m) => m.t)].map((t) => Math.round(t * 10)));
  return incident.samples.filter((s) => Number.isInteger(s.t) || keyTimes.has(Math.round(s.t * 10)));
}

export const PACKAGE_FORMAT = "ryvora.incident-package";

/** Serializable incident package for download. `exportedAt` is passed in to keep this pure. */
export function buildIncidentPackage(incident: Incident, exportedAt: string) {
  const a = incident.assessment;
  return {
    format: PACKAGE_FORMAT,
    version: 1,
    simulated: true,
    notice:
      "SIMULATED demonstration data generated by the RYVORA prototype. Emergency communication shown in the app is a demonstrated workflow; no emergency service was contacted.",
    disclaimer: EXPLANATION_DISCLAIMER,
    exportedAt,
    incident: {
      id: incident.id,
      scenarioId: incident.scenarioId,
      scenario: incident.scenarioLabel,
      occurredAt: incident.occurredAt,
      occurredAtLocal: incident.occurredAtIst,
      timezone: "Asia/Kolkata",
      location: { ...incident.location, approximate: true },
    },
    assessment: {
      eventClass: a.eventClass,
      classification: incident.classLabel,
      confidence: Math.round(a.confidence * 1000) / 1000,
      confidencePct: confidencePct(a),
      coverage: Math.round(a.coverage * 1000) / 1000,
      emergencyWorkflow: a.emergency ? "rider-check-then-escalate (simulated)" : "not started",
      action: a.action,
      headline: a.headline,
      ranking: a.ranking.map((r) => ({ eventClass: r.eventClass, score: Math.round(r.score * 1000) / 1000 })),
      signals: a.signals.map((s) => ({
        key: s.key,
        label: s.label,
        device: s.device,
        value: s.display,
        level: s.level,
        available: s.available,
        weight: s.weight,
        agreement: s.agreement === null ? null : Math.round(s.agreement * 1000) / 1000,
      })),
    },
    explanation: incident.explanation,
    devicesAtImpact: incident.devices.map(({ device, status, detail }) => ({ device, status, detail })),
    helmetLinkLostT: incident.helmetLinkLostT,
    timeline: incident.timeline.map((e) => ({ ...e, label: fmtT(e.t) })),
    series: {
      sourceHz: incident.sourceHz,
      sampleHz: incident.sampleHz,
      window: incident.window,
      bufferSeconds: incident.bufferSeconds,
      units: Object.fromEntries(CHANNELS.map((c) => [c.key, c.unit])),
      samples: incident.samples,
    },
  };
}

export type IncidentPackage = ReturnType<typeof buildIncidentPackage>;

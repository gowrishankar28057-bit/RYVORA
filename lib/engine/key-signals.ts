import { ESCALATION_THRESHOLD, EVENT_LABELS } from "./crash-confidence";
import type { CrashAssessment, ResponseAction, SignalKey, SignalReading } from "../types/events";

/** Display tone of a row. A subset of the UI `Tone` (components/ui/primitives), kept here so lib/ never imports from components/. */
export type KeySignalTone = "neutral" | "info" | "success" | "warning" | "critical";

/**
 * Plain-language "key signals" readout derived from a crash-confidence
 * assessment. Pure and scenario-agnostic: every row is computed from the
 * engine's own signal levels, so the copy can never drift from the verdict.
 */

export type KeySignalId =
  | "helmetImpact"
  | "helmetWorn"
  | "bikeSpeed"
  | "speedReduction"
  | "bikeImpact"
  | "phoneCrashPattern"
  | "postImpactMovement";

export type KeySignalDevice = "helmet" | "bike" | "phone";

export interface KeySignalRow {
  id: KeySignalId;
  /** Engine signal this row is derived from. */
  source: SignalKey;
  /** Position of the source signal in `assessment.signals` (drives progressive reveal). */
  order: number;
  label: string;
  /** Short label for chips, e.g. "Impact". */
  short: string;
  device: KeySignalDevice;
  /** "level" values are categorical (HIGH, NO…); "measure" values carry a unit (52 km/h). */
  kind: "level" | "measure";
  value: string;
  detail: string | null;
  tone: KeySignalTone;
  available: boolean;
}

interface RowSpec {
  id: KeySignalId;
  source: SignalKey;
  label: string;
  short: string;
  device: KeySignalDevice;
  kind: KeySignalRow["kind"];
  value: (s: SignalReading) => string;
  detail: (s: SignalReading) => string | null;
}

const isElevated = (s: SignalReading) => s.level === "HIGH" || s.level === "MODERATE";

const ROW_SPECS: RowSpec[] = [
  { id: "helmetImpact", source: "helmetImpactG", label: "Helmet impact", short: "Impact", device: "helmet", kind: "level", value: (s) => s.level, detail: (s) => `Peak ${s.display}` },
  { id: "helmetWorn", source: "helmetWorn", label: "Helmet worn", short: "Worn", device: "helmet", kind: "level", value: (s) => s.level, detail: () => "Wear sensor" },
  { id: "bikeSpeed", source: "bikeSpeedKmh", label: "Bike speed", short: "Speed", device: "bike", kind: "measure", value: (s) => s.display, detail: () => "At event start" },
  { id: "speedReduction", source: "speedDropKmh", label: "Rapid speed reduction", short: "Rapid slow-down", device: "bike", kind: "level", value: (s) => (isElevated(s) ? "YES" : "NO"), detail: (s) => `${s.display} lost in window` },
  { id: "bikeImpact", source: "bikeRotationDps", label: "Bike impact", short: "Impact", device: "bike", kind: "level", value: (s) => s.level, detail: (s) => `Rotation ${s.display}` },
  { id: "phoneCrashPattern", source: "phoneDecelG", label: "Phone crash pattern", short: "Crash pattern", device: "phone", kind: "level", value: (s) => s.level, detail: (s) => `Deceleration ${s.display}` },
  { id: "postImpactMovement", source: "postImpactMotion", label: "Post-impact movement", short: "Movement", device: "phone", kind: "level", value: (s) => s.level, detail: (s) => `Movement index ${s.display}` },
];

/** Same palette as the engine's signal list, so both readouts agree visually. */
const VALUE_TONE: Record<string, KeySignalTone> = {
  HIGH: "critical",
  MODERATE: "warning",
  LOW: "info",
  NONE: "neutral",
  YES: "info",
  NO: "neutral",
};

export const UNAVAILABLE = "Unavailable";

export function keySignalRows(assessment: Pick<CrashAssessment, "signals">): KeySignalRow[] {
  return ROW_SPECS.map((spec, i): KeySignalRow => {
    const index = assessment.signals.findIndex((s) => s.key === spec.source);
    const reading = index >= 0 ? assessment.signals[index] : undefined;
    const base = { id: spec.id, source: spec.source, label: spec.label, short: spec.short, device: spec.device, kind: spec.kind, order: index >= 0 ? index : i };
    if (!reading || !reading.available) {
      return { ...base, value: UNAVAILABLE, detail: "No data received", tone: "warning", available: false };
    }
    const value = spec.value(reading);
    return {
      ...base,
      value,
      detail: spec.detail(reading),
      tone: spec.kind === "measure" ? "neutral" : (VALUE_TONE[value] ?? "neutral"),
      available: true,
    };
  });
}

/** Engine class as an upper-case classification label, e.g. "HELMET DROP". */
export function classificationLabel(assessment: Pick<CrashAssessment, "eventClass">): string {
  return EVENT_LABELS[assessment.eventClass].toUpperCase();
}

export interface Outcome {
  tone: Extract<KeySignalTone, "success" | "warning" | "critical">;
  title: string;
  detail: string;
}

const ACTION_COPY: Record<ResponseAction, string> = {
  none: "Normal riding. Nothing to report.",
  log: "Logged to ride history. The ride continues.",
  "inspect-helmet": "Rider prompted to inspect the helmet for damage.",
  "notify-rider": "Rider notified on the phone.",
  "rider-check": "Rider check-in requested. No automatic escalation.",
  "rider-check-escalate": "Rider check started. The emergency workflow begins if there is no response.",
};

export const THRESHOLD_PCT = Math.round(ESCALATION_THRESHOLD * 100);

/** The single, plain-language status the rider would see for this assessment. */
export function outcomeFor(assessment: Pick<CrashAssessment, "eventClass" | "emergency" | "action" | "coverage">): Outcome {
  if (assessment.emergency) {
    return { tone: "critical", title: "POSSIBLE SEVERE CRASH", detail: ACTION_COPY["rider-check-escalate"] };
  }
  if (assessment.eventClass === "SEVERE_CRASH") {
    return {
      tone: "warning",
      title: "POSSIBLE SEVERE CRASH",
      detail: `Confidence is below the ${THRESHOLD_PCT}% escalation threshold. Rider check-in only.`,
    };
  }
  if (assessment.coverage === 0) {
    return { tone: "warning", title: "NO SENSOR DATA", detail: "No device reported this event, so nothing could be verified." };
  }
  return { tone: "success", title: "NO EMERGENCY TRIGGERED", detail: ACTION_COPY[assessment.action] };
}

/** "7 of 8" style signal coverage, counted from the engine's readings. */
export function signalCount(assessment: Pick<CrashAssessment, "signals">): { available: number; total: number } {
  return { available: assessment.signals.filter((s) => s.available).length, total: assessment.signals.length };
}

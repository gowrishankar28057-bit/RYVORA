import type { TelemetrySample } from "./telemetry";

export type EventClass =
  | "NORMAL"
  | "POTHOLE"
  | "HARD_BRAKING"
  | "HELMET_DROP"
  | "BIKE_FALL"
  | "MINOR_INCIDENT"
  | "SEVERE_CRASH";

/**
 * Features extracted from the synchronised event window.
 * These are the inputs to the crash confidence engine.
 * `null` means the signal was not available for this event.
 */
export interface FusionInput {
  /** Peak helmet resultant acceleration, g. */
  helmetImpactG: number | null;
  helmetWorn: boolean | null;
  /** Bike speed at the start of the event window, km/h. */
  bikeSpeedKmh: number | null;
  /** Speed lost across the event window, km/h. */
  speedDropKmh: number | null;
  /** Peak bike angular rate, deg/s. */
  bikeRotationDps: number | null;
  /** Peak phone deceleration, g. */
  phoneDecelG: number | null;
  /** 0..1 rider / phone movement index in the 10 s after the event. */
  postImpactMotion: number | null;
  /** Whether the helmet link dropped right after the event. */
  helmetLinkLost: boolean | null;
}

export type SignalKey = keyof FusionInput;

export type SignalLevel = "NONE" | "LOW" | "MODERATE" | "HIGH" | "YES" | "NO" | "N/A";

export interface SignalReading {
  key: SignalKey;
  label: string;
  device: "helmet" | "bike" | "phone" | "system";
  display: string;
  level: SignalLevel;
  available: boolean;
  /** Weight of this signal in the engine (0..1, all weights sum to 1). */
  weight: number;
  /** How strongly this reading matches the winning event signature (0..1). */
  agreement: number | null;
}

export type ResponseAction =
  | "none"
  | "log"
  | "inspect-helmet"
  | "notify-rider"
  | "rider-check"
  | "rider-check-escalate";

export interface ClassScore {
  eventClass: EventClass;
  /** Weighted signature agreement, 0..1. */
  score: number;
}

export interface CrashAssessment {
  eventClass: EventClass;
  /** Final confidence, 0..1. */
  confidence: number;
  /** Fraction of total signal weight that was available, 0..1. */
  coverage: number;
  /** All classes ranked by signature agreement. */
  ranking: ClassScore[];
  signals: SignalReading[];
  action: ResponseAction;
  /** True when the rider-check → emergency escalation path should start. */
  emergency: boolean;
  reasons: string[];
  headline: string;
}

export type RiskLevel = "none" | "low" | "medium" | "high";

export interface TimelineEntry {
  /** Seconds relative to the primary event. */
  t: number;
  title: string;
  detail?: string;
  tone?: "neutral" | "info" | "warning" | "critical" | "success";
  device?: "helmet" | "bike" | "phone" | "system";
}

/** A recorded ride or safety event, as shown in History. */
export interface RideEvent {
  id: string;
  kind: "ride" | "event";
  title: string;
  subtitle: string;
  /** ISO timestamp. */
  occurredAt: string;
  scenarioId: string;
  distanceKm?: number;
  durationMin?: number;
  risk: RiskLevel;
  simulated: boolean;
  locationLabel: string;
  outcome: string;
}

export interface ScenarioDefinition {
  id: string;
  label: string;
  short: string;
  description: string;
  expected: EventClass;
  input: FusionInput;
  timeline: TimelineEntry[];
  series: () => TelemetrySample[];
}

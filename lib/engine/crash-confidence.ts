import type {
  ClassScore,
  CrashAssessment,
  EventClass,
  FusionInput,
  ResponseAction,
  SignalKey,
  SignalLevel,
  SignalReading,
} from "../types/events";

/**
 * RYVORA Crash Confidence Engine (prototype).
 *
 * Signature-matching sensor fusion:
 *  1. Each event class has an expected signature — a membership function per
 *     signal describing which values are consistent with that event.
 *  2. A class score is the weighted agreement of all *available* signals with
 *     that signature. Missing signals are excluded, not guessed.
 *  3. Confidence = top score, reduced when signals are missing (coverage) and
 *     when another class is an almost equally good match (ambiguity).
 *
 * No single threshold decides the outcome: a 40 g helmet impact is a crash
 * signature only if the helmet is worn, the bike was moving, the bike rotated
 * and the phone saw the same event.
 *
 * Rule-based and deterministic so it is explainable and testable. A trained
 * on-device model can replace `scoreClass` later behind the same interface.
 */

type Trap = readonly [number, number, number, number];
type BoolMatch = readonly [onTrue: number, onFalse: number];

interface Signature {
  helmetImpactG: Trap;
  helmetWorn: BoolMatch;
  bikeSpeedKmh: Trap;
  speedDropKmh: Trap;
  bikeRotationDps: Trap;
  phoneDecelG: Trap;
  postImpactMotion: Trap;
  helmetLinkLost: BoolMatch;
}

const INF = Number.POSITIVE_INFINITY;
const NINF = Number.NEGATIVE_INFINITY;

export const SIGNAL_WEIGHTS: Record<SignalKey, number> = {
  helmetImpactG: 0.2,
  helmetWorn: 0.15,
  bikeSpeedKmh: 0.1,
  speedDropKmh: 0.12,
  bikeRotationDps: 0.15,
  phoneDecelG: 0.13,
  postImpactMotion: 0.1,
  helmetLinkLost: 0.05,
};

export const SIGNATURES: Record<EventClass, Signature> = {
  NORMAL: {
    helmetImpactG: [NINF, NINF, 2.5, 4],
    helmetWorn: [1, 0.3],
    bikeSpeedKmh: [5, 15, INF, INF],
    speedDropKmh: [NINF, NINF, 6, 10],
    bikeRotationDps: [NINF, NINF, 35, 50],
    phoneDecelG: [NINF, NINF, 0.4, 0.6],
    postImpactMotion: [0.4, 0.55, INF, INF],
    helmetLinkLost: [0.2, 1],
  },
  POTHOLE: {
    helmetImpactG: [2, 3, 7, 10],
    helmetWorn: [1, 0.3],
    bikeSpeedKmh: [5, 15, INF, INF],
    speedDropKmh: [NINF, NINF, 6, 10],
    bikeRotationDps: [20, 35, 90, 120],
    phoneDecelG: [0.6, 1, 2.5, 3.2],
    postImpactMotion: [0.4, 0.55, INF, INF],
    helmetLinkLost: [0.2, 1],
  },
  HARD_BRAKING: {
    helmetImpactG: [NINF, NINF, 3, 5],
    helmetWorn: [1, 0.3],
    bikeSpeedKmh: [20, 30, INF, INF],
    speedDropKmh: [15, 22, INF, INF],
    bikeRotationDps: [NINF, NINF, 40, 60],
    phoneDecelG: [0.4, 0.6, 1.2, 1.6],
    postImpactMotion: [0.35, 0.5, INF, INF],
    helmetLinkLost: [0.2, 1],
  },
  HELMET_DROP: {
    helmetImpactG: [10, 20, INF, INF],
    helmetWorn: [0.05, 1],
    bikeSpeedKmh: [NINF, NINF, 2, 5],
    speedDropKmh: [NINF, NINF, 1, 3],
    bikeRotationDps: [NINF, NINF, 8, 15],
    phoneDecelG: [NINF, NINF, 0.5, 0.8],
    postImpactMotion: [0.15, 0.25, 0.7, 0.85],
    helmetLinkLost: [0.6, 1],
  },
  BIKE_FALL: {
    helmetImpactG: [NINF, NINF, 3, 6],
    helmetWorn: [0.3, 1],
    bikeSpeedKmh: [NINF, NINF, 2, 5],
    speedDropKmh: [NINF, NINF, 1, 3],
    bikeRotationDps: [80, 120, INF, INF],
    phoneDecelG: [NINF, NINF, 0.5, 0.8],
    postImpactMotion: [0.1, 0.2, 0.7, 0.85],
    helmetLinkLost: [0.3, 1],
  },
  MINOR_INCIDENT: {
    helmetImpactG: [4, 6, 20, 30],
    helmetWorn: [1, 0.2],
    bikeSpeedKmh: [3, 8, 30, 40],
    speedDropKmh: [6, 10, 30, 40],
    bikeRotationDps: [60, 90, 200, 260],
    phoneDecelG: [0.8, 1.2, 3, 4],
    postImpactMotion: [0.3, 0.45, 0.8, 0.9],
    helmetLinkLost: [0.4, 1],
  },
  SEVERE_CRASH: {
    helmetImpactG: [12, 25, INF, INF],
    helmetWorn: [1, 0.1],
    bikeSpeedKmh: [20, 30, INF, INF],
    speedDropKmh: [20, 30, INF, INF],
    bikeRotationDps: [150, 220, INF, INF],
    phoneDecelG: [2.5, 3.5, INF, INF],
    postImpactMotion: [NINF, NINF, 0.15, 0.3],
    helmetLinkLost: [1, 0.85],
  },
};

export const EVENT_LABELS: Record<EventClass, string> = {
  NORMAL: "Normal riding",
  POTHOLE: "Pothole",
  HARD_BRAKING: "Hard braking",
  HELMET_DROP: "Helmet drop",
  BIKE_FALL: "Bike fall",
  MINOR_INCIDENT: "Minor incident",
  SEVERE_CRASH: "Severe crash",
};

/** Minimum confidence for a SEVERE_CRASH to start the escalation path. */
export const ESCALATION_THRESHOLD = 0.75;

const SIGNAL_META: Record<SignalKey, { label: string; device: SignalReading["device"] }> = {
  helmetImpactG: { label: "Helmet impact", device: "helmet" },
  helmetWorn: { label: "Helmet worn", device: "helmet" },
  bikeSpeedKmh: { label: "Bike speed", device: "bike" },
  speedDropKmh: { label: "Rapid speed reduction", device: "bike" },
  bikeRotationDps: { label: "Bike rotation", device: "bike" },
  phoneDecelG: { label: "Phone deceleration", device: "phone" },
  postImpactMotion: { label: "Post-impact motion", device: "phone" },
  helmetLinkLost: { label: "Device connectivity", device: "system" },
};

export const SIGNAL_ORDER: SignalKey[] = [
  "helmetImpactG",
  "helmetWorn",
  "bikeSpeedKmh",
  "speedDropKmh",
  "bikeRotationDps",
  "phoneDecelG",
  "postImpactMotion",
  "helmetLinkLost",
];

function trapezoid(x: number, [a, b, c, d]: Trap): number {
  if (x >= b && x <= c) return 1;
  if (x <= a || x >= d) return 0;
  if (x < b) return (x - a) / (b - a);
  return (d - x) / (d - c);
}

function membership(sig: Signature, key: SignalKey, value: number | boolean): number {
  const spec = sig[key];
  if (typeof value === "boolean") {
    const [onTrue, onFalse] = spec as BoolMatch;
    return value ? onTrue : onFalse;
  }
  return trapezoid(value, spec as Trap);
}

function isAvailable(v: unknown): v is number | boolean {
  return v !== null && v !== undefined && !(typeof v === "number" && Number.isNaN(v));
}

function scoreClass(input: FusionInput, cls: EventClass): number {
  const sig = SIGNATURES[cls];
  let num = 0;
  let den = 0;
  for (const key of SIGNAL_ORDER) {
    const v = input[key];
    if (!isAvailable(v)) continue;
    const w = SIGNAL_WEIGHTS[key];
    num += w * membership(sig, key, v);
    den += w;
  }
  return den === 0 ? 0 : num / den;
}

export function levelFor(key: SignalKey, value: number | boolean | null): SignalLevel {
  if (!isAvailable(value)) return "N/A";
  if (typeof value === "boolean") {
    if (key === "helmetLinkLost") return value ? "HIGH" : "NONE";
    return value ? "YES" : "NO";
  }
  const bands: Record<string, readonly [number, number, number]> = {
    helmetImpactG: [3, 8, 20],
    bikeSpeedKmh: [2, 20, 45],
    speedDropKmh: [6, 15, 25],
    bikeRotationDps: [40, 90, 150],
    phoneDecelG: [0.5, 1.2, 2.5],
    postImpactMotion: [0.05, 0.3, 0.6],
  };
  const [low, mod, high] = bands[key] ?? [1, 2, 3];
  if (value >= high) return "HIGH";
  if (value >= mod) return "MODERATE";
  if (value >= low) return "LOW";
  return "NONE";
}

export function formatSignal(key: SignalKey, value: number | boolean | null): string {
  if (!isAvailable(value)) return "Unavailable";
  switch (key) {
    case "helmetImpactG":
    case "phoneDecelG":
      return `${(value as number).toFixed(1)} g`;
    case "bikeSpeedKmh":
    case "speedDropKmh":
      return `${Math.round(value as number)} km/h`;
    case "bikeRotationDps":
      return `${Math.round(value as number)} deg/s`;
    case "postImpactMotion":
      return `${Math.round((value as number) * 100)} %`;
    case "helmetWorn":
      return value ? "Yes" : "No";
    case "helmetLinkLost":
      return value ? "Helmet link lost" : "All links stable";
  }
}

const ACTIONS: Record<EventClass, ResponseAction> = {
  NORMAL: "none",
  POTHOLE: "log",
  HARD_BRAKING: "log",
  HELMET_DROP: "inspect-helmet",
  BIKE_FALL: "notify-rider",
  MINOR_INCIDENT: "rider-check",
  SEVERE_CRASH: "rider-check-escalate",
};

function buildReasons(input: FusionInput, cls: EventClass): string[] {
  const r: string[] = [];
  const impact = input.helmetImpactG;
  const speed = input.bikeSpeedKmh;
  const rot = input.bikeRotationDps;
  const phone = input.phoneDecelG;
  const motion = input.postImpactMotion;

  switch (cls) {
    case "HELMET_DROP":
      if (impact !== null) r.push(`High helmet impact (${impact.toFixed(0)} g) — but the helmet was not being worn.`);
      if (speed !== null) r.push(`Bike stationary (${Math.round(speed)} km/h) with no bike IMU event.`);
      if (phone !== null) r.push("Phone recorded no crash pattern.");
      r.push("Impact isolated to one device → classified as a dropped helmet.");
      break;
    case "SEVERE_CRASH":
      if (impact !== null) r.push(`Helmet impact of ${impact.toFixed(0)} g while worn.`);
      else r.push("Helmet impact packet unavailable — verified using phone and bike only.");
      if (speed !== null && input.speedDropKmh !== null)
        r.push(`Bike moving at ${Math.round(speed)} km/h, then lost ${Math.round(input.speedDropKmh)} km/h within the event window.`);
      if (rot !== null) r.push(`Bike rotation peaked at ${Math.round(rot)} deg/s (fall / tumble signature).`);
      if (phone !== null) r.push(`Phone deceleration of ${phone.toFixed(1)} g in the same window.`);
      if (motion !== null) r.push(`Rider movement stayed low (${Math.round(motion * 100)} %) after impact.`);
      if (input.helmetLinkLost) r.push("Helmet link dropped after impact — pre-impact buffer retained on phone.");
      break;
    case "BIKE_FALL":
      r.push("Bike module detected a fall-over rotation while stationary.");
      r.push("Helmet and phone show no rider impact → parked-bike fall.");
      break;
    case "MINOR_INCIDENT":
      r.push("Low-speed fall signature across bike and phone.");
      r.push("Rider movement continued after the event → rider check-in, no automatic escalation.");
      break;
    case "HARD_BRAKING":
      r.push("Large speed reduction without rotation or head impact.");
      r.push("Phone deceleration consistent with controlled braking.");
      break;
    case "POTHOLE":
      r.push("Short vertical shock seen on helmet, bike and phone.");
      r.push("Speed and rider motion continued normally afterwards.");
      break;
    case "NORMAL":
      r.push("All signals within normal riding ranges.");
      break;
  }
  return r;
}

const HEADLINES: Record<EventClass, string> = {
  NORMAL: "Normal riding — no action needed.",
  POTHOLE: "Road shock logged. No emergency.",
  HARD_BRAKING: "Hard braking logged. No emergency.",
  HELMET_DROP: "No emergency triggered.",
  BIKE_FALL: "Parked bike fall — rider notified. No emergency.",
  MINOR_INCIDENT: "Rider check-in requested. No automatic escalation.",
  SEVERE_CRASH: "Possible severe crash — rider check started.",
};

export function assessEvent(input: FusionInput): CrashAssessment {
  const classes = Object.keys(SIGNATURES) as EventClass[];
  const ranking: ClassScore[] = classes
    .map((eventClass) => ({ eventClass, score: scoreClass(input, eventClass) }))
    .sort((a, b) => b.score - a.score);

  const top = ranking[0];
  const runnerUp = ranking[1];

  const totalWeight = SIGNAL_ORDER.reduce((s, k) => s + SIGNAL_WEIGHTS[k], 0);
  const availableWeight = SIGNAL_ORDER.reduce(
    (s, k) => s + (isAvailable(input[k]) ? SIGNAL_WEIGHTS[k] : 0),
    0,
  );
  const coverage = totalWeight === 0 ? 0 : availableWeight / totalWeight;

  const coverageFactor = 0.7 + 0.3 * coverage;
  const gap = top.score - (runnerUp?.score ?? 0);
  const ambiguityFactor = gap >= 0.2 ? 1 : 0.8 + gap;
  const confidence = Math.max(0, Math.min(0.99, top.score * coverageFactor * ambiguityFactor));

  const sig = SIGNATURES[top.eventClass];
  const signals: SignalReading[] = SIGNAL_ORDER.map((key) => {
    const v = input[key];
    const available = isAvailable(v);
    return {
      key,
      label: SIGNAL_META[key].label,
      device: SIGNAL_META[key].device,
      display: formatSignal(key, v),
      level: levelFor(key, v),
      available,
      weight: SIGNAL_WEIGHTS[key],
      agreement: available ? membership(sig, key, v) : null,
    };
  });

  const action = ACTIONS[top.eventClass];
  const emergency = top.eventClass === "SEVERE_CRASH" && confidence >= ESCALATION_THRESHOLD;

  return {
    eventClass: top.eventClass,
    confidence,
    coverage,
    ranking,
    signals,
    action,
    emergency,
    reasons: buildReasons(input, top.eventClass),
    headline: HEADLINES[top.eventClass],
  };
}

export function confidencePct(a: Pick<CrashAssessment, "confidence">): number {
  return Math.round(a.confidence * 100);
}

/**
 * Jury Mode script — the single source of truth for step order, timing and
 * the line the presenter reads. Pure data: no React, no clocks.
 *
 * Every visual in the demo is a pure function of the elapsed time inside the
 * current step, so the same timestamp always renders the same frame.
 */

export type DemoStepId =
  | "precheck-blocked"
  | "system-ready"
  | "ride"
  | "helmet-drop"
  | "severe-crash"
  | "rider-check"
  | "emergency"
  | "failsafe"
  | "reconstruction"
  | "finale";

export type DemoStepLayout = "phone" | "laptop" | "finale";

export interface DemoStep {
  id: DemoStepId;
  /** Heading shown on stage. */
  title: string;
  /** Short label for the step rail. */
  short: string;
  /** One sentence the presenter can read aloud. */
  caption: string;
  durationMs: number;
  layout: DemoStepLayout;
}

export const DEMO_STEPS: readonly DemoStep[] = [
  {
    id: "precheck-blocked",
    title: "Pre-ride safety failure",
    short: "Blocked",
    caption: "The rider tries to start without wearing the helmet — RYVORA keeps the start permission blocked.",
    durationMs: 11_000,
    layout: "phone",
  },
  {
    id: "system-ready",
    title: "Helmet worn, buckle secured",
    short: "Ready",
    caption: "Helmet on, strap buckled: every pre-ride check passes and the system is ready.",
    durationMs: 12_000,
    layout: "phone",
  },
  {
    id: "ride",
    title: "Ride starts",
    short: "Ride",
    caption: "Helmet, bike and phone now stream synchronized telemetry while the phone keeps a rolling pre-crash buffer.",
    durationMs: 10_000,
    layout: "phone",
  },
  {
    id: "helmet-drop",
    title: "Helmet drop",
    short: "Helmet drop",
    caption: "A huge helmet impact — but the helmet is not worn, the bike is parked and the phone is calm, so there is no emergency.",
    durationMs: 16_000,
    layout: "phone",
  },
  {
    id: "severe-crash",
    title: "Severe crash",
    short: "Crash",
    caption: "Now every device agrees: speed collapses, the bike rotates, the phone decelerates and the worn helmet takes the impact.",
    durationMs: 18_000,
    layout: "phone",
  },
  {
    id: "rider-check",
    title: "Are you okay?",
    short: "Rider check",
    caption: "RYVORA first asks the rider — here nobody responds, so the countdown runs out.",
    durationMs: 13_000,
    layout: "phone",
  },
  {
    id: "emergency",
    title: "Emergency workflow",
    short: "Emergency",
    caption: "The phone alerts the emergency contact, attaches the location and prepares the incident data — simulated in this demo.",
    durationMs: 12_000,
    layout: "phone",
  },
  {
    id: "failsafe",
    title: "Helmet connection lost",
    short: "Fail-safe",
    caption: "The helmet died in the crash, yet the phone and bike carry the response — the helmet is not a single point of failure.",
    durationMs: 13_000,
    layout: "phone",
  },
  {
    id: "reconstruction",
    title: "Desktop crash reconstruction",
    short: "Black box",
    caption: "On the laptop, the black box replays the seconds that mattered with synchronized graphs and a plain-language explanation.",
    durationMs: 18_000,
    layout: "laptop",
  },
  {
    id: "finale",
    title: "RYVORA",
    short: "Finale",
    caption: "Existing systems detect an impact; RYVORA verifies the accident — verify, survive, respond.",
    durationMs: 7_000,
    layout: "finale",
  },
];

export const STEP_COUNT = DEMO_STEPS.length;

/** Numbered steps shown as "Step n of 9" (the finale is not numbered). */
export const NUMBERED_STEP_COUNT = DEMO_STEPS.filter((s) => s.layout !== "finale").length;

export const TOTAL_MS = DEMO_STEPS.reduce((sum, s) => sum + s.durationMs, 0);

export function stepIndexOf(id: DemoStepId): number {
  return DEMO_STEPS.findIndex((s) => s.id === id);
}

export const RIDER_CHECK_INDEX = stepIndexOf("rider-check");

/** Rider-check countdown, shortened for the demo. */
export const RIDER_CHECK_COUNTDOWN_MS = 10_000;

/** Start offset (ms from the beginning of the demo) of every step. */
export const STEP_OFFSETS: readonly number[] = DEMO_STEPS.map((_, i) =>
  DEMO_STEPS.slice(0, i).reduce((sum, s) => sum + s.durationMs, 0),
);

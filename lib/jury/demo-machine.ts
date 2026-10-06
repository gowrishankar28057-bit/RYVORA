import {
  DEMO_STEPS,
  RIDER_CHECK_COUNTDOWN_MS,
  RIDER_CHECK_INDEX,
  STEP_COUNT,
  STEP_OFFSETS,
  TOTAL_MS,
} from "./demo-script";

/**
 * Jury Mode state machine. Pure and synchronous: React only dispatches actions
 * (from timers and event handlers) and renders the resulting state.
 *
 *   idle ──start──▶ playing ◀──resume── paused
 *                     │  └────pause────▶  ▲
 *                     │                   │ riderOk (rider-check step only)
 *                     └─tick past last step──▶ finished
 *
 * Navigation (skip / prev / jumpTo) keeps a paused demo paused and otherwise plays.
 */

export type DemoStatus = "idle" | "playing" | "paused" | "finished";

export interface DemoState {
  status: DemoStatus;
  /** Index into DEMO_STEPS. */
  step: number;
  /** Milliseconds elapsed inside the current step. */
  elapsed: number;
  /** The rider tapped I'M OKAY: escalation cancelled and the demo paused on the rider-check step. */
  riderOk: boolean;
}

export type DemoAction =
  | { type: "start" }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "toggle" }
  | { type: "tick"; dt: number }
  | { type: "skip" }
  | { type: "prev" }
  | { type: "jumpTo"; index: number; play?: boolean }
  | { type: "reset" }
  | { type: "riderOk" }
  | { type: "needHelp" };

export const INITIAL_DEMO_STATE: DemoState = { status: "idle", step: 0, elapsed: 0, riderOk: false };

/** Largest tick applied at once, so a throttled background tab never skips whole steps. */
export const MAX_TICK_MS = 250;

const LAST = STEP_COUNT - 1;

function clampIndex(i: number): number {
  return Math.max(0, Math.min(LAST, Math.trunc(i)));
}

function enter(index: number, status: DemoStatus): DemoState {
  return { status, step: clampIndex(index), elapsed: 0, riderOk: false };
}

function finished(): DemoState {
  return { status: "finished", step: LAST, elapsed: DEMO_STEPS[LAST].durationMs, riderOk: false };
}

/** Navigation keeps a paused demo paused; from any other state it plays. */
function navStatus(s: DemoState): DemoStatus {
  return s.status === "paused" ? "paused" : "playing";
}

function tick(s: DemoState, dt: number): DemoState {
  if (s.status !== "playing" || !Number.isFinite(dt) || dt <= 0) return s;
  let step = s.step;
  let elapsed = s.elapsed + Math.min(dt, MAX_TICK_MS);
  while (elapsed >= DEMO_STEPS[step].durationMs) {
    if (step === LAST) return finished();
    elapsed -= DEMO_STEPS[step].durationMs;
    step += 1;
  }
  return { status: "playing", step, elapsed, riderOk: false };
}

function resume(s: DemoState): DemoState {
  if (s.status === "idle") return enter(0, "playing");
  if (s.status !== "paused") return s;
  // After "I'm okay" the countdown is cancelled; resuming continues the story.
  if (s.riderOk) return enter(s.step + 1, "playing");
  return { ...s, status: "playing" };
}

/** True while the rider-check countdown is still running on the current step. */
export function riderCanRespond(s: DemoState): boolean {
  return (
    (s.status === "playing" || s.status === "paused") &&
    s.step === RIDER_CHECK_INDEX &&
    !s.riderOk &&
    s.elapsed < RIDER_CHECK_COUNTDOWN_MS
  );
}

export function demoReducer(s: DemoState, a: DemoAction): DemoState {
  switch (a.type) {
    case "start":
      if (s.status === "idle" || s.status === "finished") return enter(0, "playing");
      return resume(s);
    case "pause":
      return s.status === "playing" ? { ...s, status: "paused" } : s;
    case "resume":
      return resume(s);
    case "toggle":
      if (s.status === "playing") return { ...s, status: "paused" };
      if (s.status === "finished") return enter(0, "playing");
      return resume(s);
    case "tick":
      return tick(s, a.dt);
    case "skip":
      if (s.status === "finished") return s;
      // The intro is not a step: skipping it lands on step 1.
      if (s.status === "idle") return enter(0, "playing");
      if (s.step >= LAST) return finished();
      return enter(s.step + 1, navStatus(s));
    case "prev":
      if (s.status === "idle") return s;
      if (s.status === "finished") return enter(LAST - 1, "playing");
      return enter(s.step - 1, navStatus(s));
    case "jumpTo":
      if (!Number.isFinite(a.index)) return s;
      return enter(a.index, a.play ? "playing" : navStatus(s));
    case "reset":
      return INITIAL_DEMO_STATE;
    case "riderOk":
      return riderCanRespond(s) ? { ...s, status: "paused", riderOk: true } : s;
    case "needHelp":
      return riderCanRespond(s) ? enter(s.step + 1, "playing") : s;
  }
}

/* ── Selectors ─────────────────────────────────────────────────────────── */

export function demoElapsedMs(s: DemoState): number {
  if (s.status === "idle") return 0;
  if (s.status === "finished") return TOTAL_MS;
  return Math.min(TOTAL_MS, STEP_OFFSETS[s.step] + s.elapsed);
}

/** 0..1 progress of step `index` for the step rail. */
export function stepProgress(s: DemoState, index: number): number {
  if (s.status === "idle") return 0;
  if (s.status === "finished" || index < s.step) return 1;
  if (index > s.step) return 0;
  return Math.max(0, Math.min(1, s.elapsed / DEMO_STEPS[index].durationMs));
}

export function currentStep(s: DemoState) {
  return DEMO_STEPS[clampIndex(s.step)];
}

import { keyframes } from "@/lib/simulation/series";
import { CRASH_PCT, DROP_PCT, READY_READINESS, SIGNAL_COUNT } from "./demo-data";
import { DEMO_STEPS, NUMBERED_STEP_COUNT, RIDER_CHECK_COUNTDOWN_MS, type DemoStepId } from "./demo-script";
import type { DemoState } from "./demo-machine";

/**
 * Per-step choreography. Every function here maps "ms elapsed inside the step"
 * to what should be on screen, so a frame is fully determined by the clock.
 */

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * How many of `total` items are visible at `ms` when the first appears at
 * `startMs` and each following one `everyMs` later.
 */
export function revealCount(ms: number, startMs: number, everyMs: number, total: number): number {
  if (ms < startMs) return 0;
  return Math.min(total, Math.floor((ms - startMs) / everyMs) + 1);
}

/** Smooth 0..1 ease for scripted motion. */
export function easeInOut(x: number): number {
  const v = clamp01(x);
  return v < 0.5 ? 2 * v * v : 1 - (-2 * v + 2) ** 2 / 2;
}

/* ── Step 1 · pre-ride failure ─────────────────────────────────────────── */

export function blockedFrame(ms: number) {
  return {
    /** Blockers listed in the side panel (helmet worn, buckle). */
    blockersShown: revealCount(ms, 1200, 1200, 2),
    permissionShown: ms >= 3800,
  };
}

/* ── Step 2 · system ready ─────────────────────────────────────────────── */

export const READY_CHECKS_START_MS = 2400;
export const READY_CHECK_EVERY_MS = 600;

export function readyFrame(ms: number, checkCount = READY_READINESS.checks.length) {
  // -1 → nothing running yet; n → n checks complete, check n+1 spinning.
  const checksDone = ms < READY_CHECKS_START_MS ? -1 : Math.min(checkCount, Math.floor((ms - READY_CHECKS_START_MS) / READY_CHECK_EVERY_MS));
  return {
    worn: ms >= 600,
    buckled: ms >= 1600,
    checksDone,
    allPassed: checksDone >= checkCount,
  };
}

/* ── Step 4 / 5 · event analysis (playback → verification → verdict) ───── */

export type AnalysisPhase = "stream" | "verify" | "verdict";

export interface AnalysisTiming {
  /** [stepMs, eventSeconds] keyframes for the replay cursor (T = 0 is the impact). */
  cursor: ReadonlyArray<readonly [number, number]>;
  verifyStartMs: number;
  signalEveryMs: number;
  verdictMs: number;
}

export const HELMET_DROP_TIMING: AnalysisTiming = {
  cursor: [
    [0, -4],
    [6000, 2],
  ],
  verifyStartMs: 6500,
  signalEveryMs: 450,
  verdictMs: 10_600,
};

/** Fast-forward to the approach, slow motion through the impact. */
export const SEVERE_CRASH_TIMING: AnalysisTiming = {
  cursor: [
    [0, -8],
    [3000, -2],
    [7000, 1],
    [9000, 3],
  ],
  verifyStartMs: 9400,
  signalEveryMs: 450,
  verdictMs: 13_400,
};

export interface AnalysisFrame {
  phase: AnalysisPhase;
  /** Event time (s) under the replay cursor. */
  cursor: number;
  /** Replay speed relative to real time at this moment (1 = real time). */
  rate: number;
  /** Engine signals revealed so far (0..signalCount). */
  signals: number;
  /** The primary impact (T = 0) has been reached. */
  impacted: boolean;
}

/** Replay speed between the two keyframes around `ms` (0 outside the replay). */
function cursorRate(ms: number, cursor: AnalysisTiming["cursor"]): number {
  for (let i = 1; i < cursor.length; i++) {
    const [m0, t0] = cursor[i - 1];
    const [m1, t1] = cursor[i];
    if (ms >= m0 && ms < m1) return ((t1 - t0) * 1000) / (m1 - m0);
  }
  return 0;
}

export function analysisFrame(ms: number, timing: AnalysisTiming, signalCount = SIGNAL_COUNT): AnalysisFrame {
  const cursor = keyframes(
    ms / 1000,
    timing.cursor.map(([m, t]) => [m / 1000, t] as const),
  );
  const phase: AnalysisPhase = ms >= timing.verdictMs ? "verdict" : ms >= timing.verifyStartMs ? "verify" : "stream";
  const signals = phase === "verdict" ? signalCount : revealCount(ms, timing.verifyStartMs, timing.signalEveryMs, signalCount);
  return { phase, cursor, rate: cursorRate(ms, timing.cursor), signals, impacted: cursor >= 0 };
}

/* ── Step 6 · rider check ──────────────────────────────────────────────── */

export function riderCheckFrame(ms: number) {
  const remainingMs = Math.max(0, RIDER_CHECK_COUNTDOWN_MS - ms);
  return {
    remaining: remainingMs / 1000,
    total: RIDER_CHECK_COUNTDOWN_MS / 1000,
    expired: remainingMs === 0,
  };
}

/* ── Step 7 · emergency workflow ───────────────────────────────────────── */

export function emergencyCompleted(ms: number): number {
  return revealCount(ms, 2000, 2500, 3);
}

/* ── Step 8 · fail-safe ────────────────────────────────────────────────── */

/** 0 helmet streaming · 1 impact · 2 connection lost · 3 phone + bike continue. */
export function failsafeStage(ms: number): number {
  return revealCount(ms, 1500, 2000, 3);
}

/* ── Step 9 · reconstruction ───────────────────────────────────────────── */

export const RECON_SECTIONS = ["Black-box timeline", "Sensor graphs", "AI explanation"] as const;

export function reconFrame(ms: number) {
  return {
    section: ms < 5000 ? 0 : ms < 11_000 ? 1 : 2,
    /** 0..1 scroll position of the laptop screen. */
    scroll: easeInOut((ms - 2000) / 14_000),
  };
}

/* ── Finale ────────────────────────────────────────────────────────────── */

export function finaleFrame(ms: number) {
  return { tagline: ms >= 900, words: revealCount(ms, 2000, 600, 3), outro: ms >= 4200 };
}

/* ── Screen-reader narration ───────────────────────────────────────────── */

const ANALYSIS_TEXT = {
  "helmet-drop": {
    stream: (impacted: boolean) => (impacted ? "Helmet impact detected. Bike and phone stay calm." : "Bike parked. Helmet not worn."),
    verify: "Cross-checking helmet, bike and phone signals.",
    verdict: `Verdict: helmet drop, ${DROP_PCT} percent confidence. No emergency triggered.`,
  },
  "severe-crash": {
    stream: (impacted: boolean) =>
      impacted ? "Impact on all devices. Helmet connection lost." : "Riding at speed. Replaying synchronized sensor data.",
    verify: "Verifying across helmet, bike and phone.",
    verdict: `Verdict: possible severe crash, ${CRASH_PCT} percent confidence. Rider check started.`,
  },
} as const;

/** What changed on screen, phrased for an aria-live region. Stable within a phase. */
export function frameDescription(id: DemoStepId, ms: number, riderOk: boolean): string {
  switch (id) {
    case "precheck-blocked":
      return "Helmet not worn, buckle open. Start permission blocked.";
    case "system-ready":
      return readyFrame(ms).allPassed
        ? "All systems ready. Start permission enabled."
        : "Helmet worn and buckle secured. Running pre-ride checks.";
    case "ride":
      return "Ride started. Live telemetry from helmet, bike and phone.";
    case "helmet-drop":
    case "severe-crash": {
      const f = analysisFrame(ms, id === "helmet-drop" ? HELMET_DROP_TIMING : SEVERE_CRASH_TIMING);
      const t = ANALYSIS_TEXT[id];
      return f.phase === "stream" ? t.stream(f.impacted) : t[f.phase];
    }
    case "rider-check":
      if (riderOk) return "Alert cancelled. Rider confirmed OK.";
      return riderCheckFrame(ms).expired
        ? "No response. Starting the simulated emergency workflow."
        : "Are you okay? Rider check countdown running.";
    case "emergency":
      return emergencyCompleted(ms) >= 3
        ? "Simulation: emergency contact alerted, location attached, incident data prepared."
        : "Simulated emergency workflow in progress.";
    case "failsafe":
      return failsafeStage(ms) >= 3
        ? "Helmet connection lost. Phone and bike continue the response."
        : "Helmet impact. Checking device links.";
    case "reconstruction":
      return `Desktop crash reconstruction: ${RECON_SECTIONS[reconFrame(ms).section]}.`;
    case "finale":
      return "RYVORA. Intelligence that protects every ride. Verify. Survive. Respond.";
  }
}

export function announcement(s: DemoState): string {
  if (s.status === "idle") return "Jury demo ready. Press Start Demo or the space bar to begin.";
  const step = DEMO_STEPS[s.step];
  const title = /[.!?]$/.test(step.title) ? step.title : `${step.title}.`;
  const prefix = step.layout === "finale" ? "" : `Step ${s.step + 1} of ${NUMBERED_STEP_COUNT}, ${title} `;
  const paused = s.status === "paused" ? "Paused. " : "";
  return `${paused}${prefix}${frameDescription(step.id, s.elapsed, s.riderOk)}`;
}

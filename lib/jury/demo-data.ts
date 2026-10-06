import { assessEvent, confidencePct } from "@/lib/engine/crash-confidence";
import { evaluateReadiness } from "@/lib/engine/readiness";
import { buildSnapshot, HEALTHY_STATE } from "@/lib/simulation/device-state";
import { SCENARIO_MAP } from "@/lib/simulation/scenarios";

/**
 * Everything the jury demo shows, computed once from the real engine and the
 * deterministic simulator. SIMULATED hardware data — nothing here is measured.
 */

/** Fixed wall-clock for simulated packets, so server and client render the same. */
export const DEMO_EPOCH = Date.UTC(2026, 9, 4, 8, 42, 0);

export const BLOCKED_SNAPSHOT = buildSnapshot({ ...HEALTHY_STATE, helmetWorn: false, buckleSecured: false }, DEMO_EPOCH);
export const BLOCKED_READINESS = evaluateReadiness(BLOCKED_SNAPSHOT);

export const READY_SNAPSHOT = buildSnapshot(HEALTHY_STATE, DEMO_EPOCH);
export const READY_READINESS = evaluateReadiness(READY_SNAPSHOT);

export const DROP_SCENARIO = SCENARIO_MAP["helmet-drop"];
export const DROP_ASSESSMENT = assessEvent(DROP_SCENARIO.input);
export const DROP_PCT = confidencePct(DROP_ASSESSMENT);
export const DROP_SERIES = DROP_SCENARIO.series();

export const CRASH_SCENARIO = SCENARIO_MAP["severe-crash"];
export const CRASH_ASSESSMENT = assessEvent(CRASH_SCENARIO.input);
export const CRASH_PCT = confidencePct(CRASH_ASSESSMENT);
export const CRASH_SERIES = CRASH_SCENARIO.series();

/** Number of engine signals revealed one by one in steps 4 and 5. */
export const SIGNAL_COUNT = CRASH_ASSESSMENT.signals.length;

/** Event time (s) at which the helmet link drops in the severe-crash series. */
export const HELMET_LOST_AT = 0.1;

/** Rolling pre-crash buffer held on the phone. */
export const BUFFER_SECONDS = READY_SNAPSHOT.phone.bufferSeconds;

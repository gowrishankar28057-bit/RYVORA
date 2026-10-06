import { useSyncExternalStore } from "react";

/**
 * Rider safety preferences, persisted per device in localStorage.
 *
 * Read with `useSafetySettings()` in client components, or `getSafetySettings()`
 * in event handlers. Storage can be unavailable (private mode, blocked site
 * data); every access is guarded and the app falls back to the defaults or an
 * in-memory copy for the session.
 */

export const RIDER_CHECK_OPTIONS = [10, 15, 20, 30] as const;
export type RiderCheckSeconds = (typeof RIDER_CHECK_OPTIONS)[number];

export interface SafetySettings {
  /** Seconds the rider has to answer "Are you okay?" before escalation. */
  riderCheckSeconds: RiderCheckSeconds;
  /** Start the (simulated) emergency workflow automatically when the rider does not respond. */
  autoEscalation: boolean;
  /** Display unit for speed. Metric only in this prototype. */
  speedUnit: "kmh";
}

export const DEFAULT_SAFETY_SETTINGS: SafetySettings = Object.freeze({
  riderCheckSeconds: 15,
  autoEscalation: true,
  speedUnit: "kmh",
});

export const SAFETY_SETTINGS_KEY = "ryvora.safety-settings.v1";

/** Parse and validate a stored value. Unknown or malformed fields fall back to defaults. */
export function parseSafetySettings(raw: string | null): SafetySettings {
  if (!raw) return DEFAULT_SAFETY_SETTINGS;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return DEFAULT_SAFETY_SETTINGS;
  }
  if (typeof data !== "object" || data === null) return DEFAULT_SAFETY_SETTINGS;
  const d = data as Record<string, unknown>;
  const seconds = RIDER_CHECK_OPTIONS.find((o) => o === d.riderCheckSeconds);
  return {
    riderCheckSeconds: seconds ?? DEFAULT_SAFETY_SETTINGS.riderCheckSeconds,
    autoEscalation: typeof d.autoEscalation === "boolean" ? d.autoEscalation : DEFAULT_SAFETY_SETTINGS.autoEscalation,
    speedUnit: "kmh",
  };
}

/* ── Store ─────────────────────────────────────────────────────────────── */

const listeners = new Set<() => void>();
/** Last parsed value, keyed by the raw string, so snapshots stay referentially stable. */
let cache: { raw: string | null; value: SafetySettings } | null = null;
/** Session-only copy used when localStorage refuses a write. */
let memory: SafetySettings | null = null;

function readRaw(): string | null | undefined {
  try {
    return window.localStorage.getItem(SAFETY_SETTINGS_KEY);
  } catch {
    return undefined; // storage unavailable
  }
}

export function getSafetySettings(): SafetySettings {
  if (typeof window === "undefined") return DEFAULT_SAFETY_SETTINGS;
  if (memory) return memory;
  const raw = readRaw();
  if (raw === undefined) return DEFAULT_SAFETY_SETTINGS;
  if (cache && cache.raw === raw) return cache.value;
  cache = { raw, value: parseSafetySettings(raw) };
  return cache.value;
}

function emit() {
  for (const l of listeners) l();
}

/** Apply a storage change; keep `fallback` in memory unless storage is readable afterwards. */
function commit(write: (storage: Storage) => void, fallback: SafetySettings) {
  let persisted = false;
  try {
    write(window.localStorage);
    persisted = readRaw() !== undefined;
  } catch {
    persisted = false;
  }
  memory = persisted ? null : fallback;
  emit();
}

export function updateSafetySettings(patch: Partial<SafetySettings>): void {
  const next: SafetySettings = { ...getSafetySettings(), ...patch, speedUnit: "kmh" };
  commit((s) => s.setItem(SAFETY_SETTINGS_KEY, JSON.stringify(next)), next);
}

export function resetSafetySettings(): void {
  commit((s) => s.removeItem(SAFETY_SETTINGS_KEY), DEFAULT_SAFETY_SETTINGS);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Keep other tabs in sync.
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === SAFETY_SETTINGS_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const getServerSnapshot = () => DEFAULT_SAFETY_SETTINGS;

/** Current settings; renders the defaults on the server and during hydration. */
export function useSafetySettings(): SafetySettings {
  return useSyncExternalStore(subscribe, getSafetySettings, getServerSnapshot);
}

import type { GeoFix, SystemSnapshot, TelemetrySourceKind } from "../types/telemetry";
import { buildSnapshot, HEALTHY_STATE, type LiveValues, type SimulatedDeviceState } from "./device-state";
import { mulberry32 } from "./series";

/* -------------------------------------------------------------------------- */
/* Adapter contract                                                            */
/* -------------------------------------------------------------------------- */

export type SnapshotListener = (snapshot: SystemSnapshot) => void;

export interface TelemetrySourceCapabilities {
  /** Honours `setDeviceState()` — simulator switches / fault injection. */
  faultInjection: boolean;
  /** Needs an explicit, user-gesture pairing step before data flows (Web Bluetooth). */
  requiresPairing: boolean;
}

export type ConnectResult =
  | { status: "connected" }
  | { status: "unsupported"; reason: string }
  | { status: "failed"; reason: string };

/**
 * Hardware adapter contract. The UI only ever talks to a TelemetrySource.
 *
 * Implementations:
 *  - SimulatedTelemetrySource     (this MVP — the default)
 *  - WebBluetoothTelemetrySource  (stub: detection only, GATT pairing planned)
 *  - NativeBridgeTelemetrySource  (planned: Android app → WebView bridge)
 *
 * Rules every implementation follows:
 *  - Never throw. Report failures through the snapshot (connection
 *    "disconnected", `null` values) or through a ConnectResult.
 *  - `getSnapshot()` is synchronous, side-effect free and returns the same
 *    object until a new snapshot is emitted.
 *  - `subscribe()` starts data flow lazily; the last unsubscribe stops it.
 *  - `dispose()` releases timers/radios and is idempotent. A later
 *    `subscribe()` may revive the source (React Strict Mode remounts effects).
 */
export interface TelemetrySource {
  readonly kind: TelemetrySourceKind;
  /** Human-readable name shown in diagnostics. */
  readonly label: string;
  readonly capabilities: TelemetrySourceCapabilities;
  getSnapshot(): SystemSnapshot;
  subscribe(listener: SnapshotListener): () => void;
  /** Riding switches the source to its high-rate stream. */
  setRiding(riding: boolean): void;
  /** Request a hardware link. Web Bluetooth requires calling this from a user gesture. */
  connect(): Promise<ConnectResult>;
  dispose(): void;
}

/** Extra surface exposed by sources that accept simulator fault injection. */
export interface DeviceStateControl {
  setDeviceState(state: SimulatedDeviceState): void;
}

export function supportsFaultInjection(source: TelemetrySource): source is TelemetrySource & DeviceStateControl {
  return source.capabilities.faultInjection && typeof (source as Partial<DeviceStateControl>).setDeviceState === "function";
}

/* -------------------------------------------------------------------------- */
/* Simulated source                                                            */
/* -------------------------------------------------------------------------- */

/** Stream rates of the simulated modules, in Hz. */
export const SIM_RATE_HZ = { idle: 1, riding: 8 } as const;

export class SimulatedTelemetrySource implements TelemetrySource, DeviceStateControl {
  readonly kind = "simulated" as const;
  readonly label = "Simulated hardware";
  readonly capabilities: TelemetrySourceCapabilities = { faultInjection: true, requiresPairing: false };
  private state: SimulatedDeviceState;
  private snapshot: SystemSnapshot;
  private listeners = new Set<SnapshotListener>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private riding = false;
  private t = 0;
  private rand = mulberry32(2026);

  constructor(state: SimulatedDeviceState = HEALTHY_STATE) {
    this.state = state;
    // Epoch 0 marks "no packet yet"; the first real snapshot is emitted on subscribe.
    this.snapshot = buildSnapshot(state, 0);
  }

  getSnapshot() {
    return this.snapshot;
  }

  setDeviceState(state: SimulatedDeviceState) {
    this.state = state;
    this.emit();
  }

  setRiding(riding: boolean) {
    this.riding = riding;
    this.restart();
  }

  subscribe(listener: SnapshotListener) {
    this.listeners.add(listener);
    if (!this.timer) this.restart();
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) this.stop();
    };
  }

  connect(): Promise<ConnectResult> {
    return Promise.resolve({ status: "connected" });
  }

  dispose() {
    this.stop();
    this.listeners.clear();
  }

  private restart() {
    this.stop();
    if (this.listeners.size === 0) return;
    const hz = this.riding ? SIM_RATE_HZ.riding : SIM_RATE_HZ.idle;
    this.timer = setInterval(() => {
      this.t += 1 / hz;
      this.emit();
    }, 1000 / hz);
    this.emit();
  }

  private stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private live(): LiveValues {
    const t = this.t;
    const r = () => this.rand() - 0.5;
    if (!this.riding) {
      return { speedKmh: 0, helmetAccelG: 1 + r() * 0.04, bikeAccelG: 0.02, angularRateDps: 0.5, phoneAccelG: 0.05 + r() * 0.02, leanDeg: 0 };
    }
    // Smooth synthetic urban ride: 30–55 km/h with gentle lean in curves.
    const speed = 42 + 9 * Math.sin(t / 9) + 3 * Math.sin(t / 2.3);
    const lean = 14 * Math.sin(t / 5.5);
    return {
      speedKmh: Math.max(0, speed + r()),
      helmetAccelG: 1 + Math.abs(0.12 * Math.sin(t * 1.9)) + r() * 0.08,
      bikeAccelG: 0.18 + Math.abs(0.1 * Math.sin(t * 1.3)) + r() * 0.06,
      angularRateDps: Math.abs(14 * Math.cos(t / 5.5)) + Math.abs(r()) * 6,
      phoneAccelG: 0.14 + Math.abs(0.06 * Math.sin(t * 1.1)) + r() * 0.04,
      leanDeg: lean,
    };
  }

  private emit() {
    this.snapshot = buildSnapshot(this.state, Date.now(), this.live(), this.rand());
    for (const l of this.listeners) l(this.snapshot);
  }
}

/* -------------------------------------------------------------------------- */
/* Link diagnostics — shared semantics for every adapter                      */
/* -------------------------------------------------------------------------- */

/** A device whose newest packet is older than this is reported as stale (idle stream is 1 Hz). */
export const STALE_LINK_MS = 3000;

export type LatencyQuality = "excellent" | "good" | "fair" | "poor";

/** Round-trip latency bands. ≥ 150 ms also fails the readiness "communication" check. */
export function latencyQuality(ms: number | null | undefined): LatencyQuality | null {
  if (ms === null || ms === undefined || !Number.isFinite(ms) || ms < 0) return null;
  if (ms < 50) return "excellent";
  if (ms < 100) return "good";
  if (ms < 150) return "fair";
  return "poor";
}

/**
 * Milliseconds since a packet was received, or `null` when unknown.
 * Timestamps ≤ 0 are the "no packet yet" placeholder and count as unknown.
 */
export function packetAgeMs(timestamp: number | null | undefined, now: number | null | undefined): number | null {
  if (timestamp === null || timestamp === undefined || now === null || now === undefined) return null;
  if (!Number.isFinite(timestamp) || !Number.isFinite(now) || timestamp <= 0) return null;
  return Math.max(0, now - timestamp);
}

/** "0.4 s ago", "12 s ago", "3 min ago", "2 h ago"; "—" when unknown. */
export function formatPacketAge(ageMs: number | null): string {
  if (ageMs === null || !Number.isFinite(ageMs)) return "—";
  const ms = Math.max(0, ageMs);
  if (ms < 10_000) return `${(ms / 1000).toFixed(1)} s ago`;
  if (ms < 60_000) return `${Math.floor(ms / 1000)} s ago`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)} min ago`;
  return `${Math.floor(ms / 3_600_000)} h ago`;
}

/** Newest packet seen from each device. Survives disconnection, unlike the snapshot. */
export interface LastSeen {
  helmetAt: number | null;
  bikeAt: number | null;
  phoneAt: number | null;
  /** Last GPS fix — the emergency workflow falls back to this when GPS drops. */
  location: GeoFix | null;
  locationAt: number | null;
}

export const NEVER_SEEN: LastSeen = { helmetAt: null, bikeAt: null, phoneAt: null, location: null, locationAt: null };

/** Fold a freshly emitted snapshot into the last-seen record (pure). */
export function foldLastSeen(prev: LastSeen, s: SystemSnapshot): LastSeen {
  const pick = (t: number | null, fallback: number | null) => (t !== null && Number.isFinite(t) && t > 0 ? t : fallback);
  const phoneAt = pick(s.phone.timestamp, prev.phoneAt);
  return {
    helmetAt: pick(s.helmet.timestamp, prev.helmetAt),
    bikeAt: pick(s.bike.timestamp, prev.bikeAt),
    phoneAt,
    location: s.phone.location ?? prev.location,
    locationAt: s.phone.location ? phoneAt : prev.locationAt,
  };
}

/* -------------------------------------------------------------------------- */
/* Web Bluetooth feature detection                                             */
/* -------------------------------------------------------------------------- */

/** Minimal slice of the Web Bluetooth API we touch (it is not in TypeScript's DOM lib). */
export interface WebBluetoothApi {
  requestDevice?: (options: unknown) => Promise<unknown>;
  getAvailability?: () => Promise<boolean>;
}

export type WebBluetoothSupport = "supported" | "unsupported";

/** `navigator.bluetooth` when exposed (Chromium, secure context), else `null`. Never throws. */
export function getWebBluetooth(): WebBluetoothApi | null {
  try {
    if (typeof navigator === "undefined" || navigator === null) return null;
    const bt = (navigator as Navigator & { bluetooth?: unknown }).bluetooth;
    return bt && typeof bt === "object" ? (bt as WebBluetoothApi) : null;
  } catch {
    return null;
  }
}

/** Feature detection used to show the "Bluetooth unavailable" state honestly. */
export function webBluetoothSupport(): WebBluetoothSupport {
  return typeof getWebBluetooth()?.requestDevice === "function" ? "supported" : "unsupported";
}

import type { SystemSnapshot, TelemetrySourceKind } from "../types/telemetry";
import { buildSnapshot, HEALTHY_STATE, type LiveValues, type SimulatedDeviceState } from "./device-state";
import { mulberry32 } from "./series";

/**
 * Hardware adapter contract. The UI only ever talks to a TelemetrySource.
 *
 * Implementations planned:
 *  - SimulatedTelemetrySource  (this MVP)
 *  - WebBluetoothTelemetrySource (Chrome/Android, GATT notify characteristics)
 *  - NativeBridgeTelemetrySource (Android app → WebView bridge)
 */
export interface TelemetrySource {
  readonly kind: TelemetrySourceKind;
  getSnapshot(): SystemSnapshot;
  subscribe(listener: (s: SystemSnapshot) => void): () => void;
  setRiding(riding: boolean): void;
  dispose(): void;
}

export class SimulatedTelemetrySource implements TelemetrySource {
  readonly kind = "simulated" as const;
  private state: SimulatedDeviceState;
  private snapshot: SystemSnapshot;
  private listeners = new Set<(s: SystemSnapshot) => void>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private riding = false;
  private t = 0;
  private rand = mulberry32(2026);

  constructor(state: SimulatedDeviceState = HEALTHY_STATE) {
    this.state = state;
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

  subscribe(listener: (s: SystemSnapshot) => void) {
    this.listeners.add(listener);
    if (!this.timer) this.restart();
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) this.stop();
    };
  }

  dispose() {
    this.stop();
    this.listeners.clear();
  }

  private restart() {
    this.stop();
    if (this.listeners.size === 0) return;
    const hz = this.riding ? 8 : 1;
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

/** Feature detection used to show the "Bluetooth unavailable" state honestly. */
export function webBluetoothSupport(): "supported" | "unsupported" {
  if (typeof navigator === "undefined") return "unsupported";
  return "bluetooth" in navigator ? "supported" : "unsupported";
}

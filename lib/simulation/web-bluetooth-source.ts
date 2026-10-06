import type { RadioStatus, SystemSnapshot } from "../types/telemetry";
import {
  getWebBluetooth,
  webBluetoothSupport,
  type ConnectResult,
  type SnapshotListener,
  type TelemetrySource,
  type TelemetrySourceCapabilities,
} from "./telemetry-source";

/**
 * Planned GATT profile for RYVORA hardware — PLACEHOLDERS ONLY.
 *
 * The custom 128-bit UUIDs below share the base `xxxxxxxx-5259-564f-5241-…`
 * ("RYVORA" in ASCII hex) so they are easy to spot. None of them is burned
 * into any firmware yet. Start permission is read/notify only: the bike
 * module decides it locally and the browser never writes ignition control.
 */
export const RYVORA_GATT = {
  helmet: {
    // TODO(hardware): replace with the helmet firmware's primary service UUID.
    service: "52590001-5259-564f-5241-000000000001",
    // TODO(hardware): notify — batched high-g accelerometer + gyro frames.
    imu: "52590002-5259-564f-5241-000000000001",
    // TODO(hardware): notify — wear sensor + buckle switch bitfield.
    wearBuckle: "52590003-5259-564f-5241-000000000001",
    // TODO(hardware): read/notify — IMU self-test result + firmware version.
    status: "52590004-5259-564f-5241-000000000001",
  },
  bike: {
    // TODO(hardware): replace with the bike module's primary service UUID.
    service: "52591001-5259-564f-5241-000000000002",
    // TODO(hardware): notify — bike IMU (accel, angular rate, lean).
    imu: "52591002-5259-564f-5241-000000000002",
    // TODO(hardware): notify — wheel-speed / GNSS speed.
    speed: "52591003-5259-564f-5241-000000000002",
    // TODO(hardware): read/notify ONLY — start-permission state decided on the module.
    startPermission: "52591004-5259-564f-5241-000000000002",
  },
  /** Standard Bluetooth SIG Battery Service, exposed by both modules. */
  battery: { service: "battery_service", level: "battery_level" },
} as const;

const LABEL = "Web Bluetooth (pairing planned)";
const ENGINE_MODEL = "Fusion v0.4 (rule-based prototype)";

/**
 * Snapshot reported while no RYVORA hardware is paired: every device
 * disconnected, every value `null`. Only the phone's radio state is real.
 */
export function unpairedSnapshot(bluetooth: RadioStatus, network: "online" | "offline" = "online"): SystemSnapshot {
  return {
    helmet: {
      timestamp: null,
      connection: "disconnected",
      batteryPct: null,
      worn: null,
      buckleSecured: null,
      imu: "offline",
      accelG: null,
      latencyMs: null,
      firmware: "—",
    },
    bike: {
      timestamp: null,
      connection: "disconnected",
      batteryPct: null,
      imu: "offline",
      speedKmh: null,
      accelG: null,
      angularRateDps: null,
      leanDeg: null,
      startPermission: "blocked",
      latencyMs: null,
      firmware: "—",
    },
    phone: {
      timestamp: null,
      // TODO(hardware): phone motion sensors + GPS come from DeviceMotion / Geolocation, not BLE.
      sensorsActive: false,
      batteryPct: null,
      accelG: null,
      motionIndex: null,
      gps: "unavailable",
      location: null,
      bluetooth,
      network,
      bufferSeconds: 0,
    },
    engine: { state: "offline", model: ENGINE_MODEL },
    source: { kind: "web-bluetooth", label: LABEL },
  };
}

/**
 * Web Bluetooth adapter — STUB.
 *
 * Today it only detects whether the browser exposes Web Bluetooth and whether
 * the radio is available, and reports every RYVORA device as disconnected.
 * It never throws and never touches a real device.
 *
 * TODO(hardware): implement `connect()` with
 *   navigator.bluetooth.requestDevice({
 *     filters: [{ services: [RYVORA_GATT.helmet.service] }, { services: [RYVORA_GATT.bike.service] }],
 *     optionalServices: [RYVORA_GATT.battery.service],
 *   })
 * then `gatt.connect()`, subscribe to the notify characteristics and map the
 * packets into HelmetTelemetry / BikeTelemetry.
 */
export class WebBluetoothTelemetrySource implements TelemetrySource {
  readonly kind = "web-bluetooth" as const;
  readonly label = LABEL;
  readonly capabilities: TelemetrySourceCapabilities = { faultInjection: false, requiresPairing: true };
  private snapshot: SystemSnapshot = unpairedSnapshot("unsupported");
  private listeners = new Set<SnapshotListener>();
  /** Bumped on dispose so late async probe results are ignored. */
  private generation = 0;

  getSnapshot() {
    return this.snapshot;
  }

  subscribe(listener: SnapshotListener) {
    this.listeners.add(listener);
    if (this.listeners.size === 1) this.probe();
    return () => {
      this.listeners.delete(listener);
    };
  }

  setRiding() {
    // No data stream until pairing exists.
  }

  async connect(): Promise<ConnectResult> {
    if (webBluetoothSupport() === "unsupported") {
      return { status: "unsupported", reason: "Web Bluetooth is not available in this browser." };
    }
    // TODO(hardware): requestDevice() + GATT connect — see class comment.
    return { status: "failed", reason: "RYVORA hardware pairing is planned and not implemented in this build." };
  }

  dispose() {
    this.generation += 1;
    this.listeners.clear();
  }

  /** Detect radio availability without pairing anything. Never throws. */
  private probe() {
    const generation = ++this.generation;
    const settle = (radio: RadioStatus) => {
      if (generation === this.generation) this.update(radio);
    };
    const bt = getWebBluetooth();
    if (!bt || webBluetoothSupport() === "unsupported") return settle("unsupported");
    if (typeof bt.getAvailability !== "function") return settle("on");
    try {
      // TODO(hardware): also listen for the `availabilitychanged` event.
      bt.getAvailability().then(
        (available) => settle(available ? "on" : "off"),
        () => settle("unsupported"),
      );
    } catch {
      settle("unsupported");
    }
  }

  private update(radio: RadioStatus) {
    const network = typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "online";
    this.snapshot = unpairedSnapshot(radio, network);
    for (const l of this.listeners) l(this.snapshot);
  }
}

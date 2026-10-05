/**
 * Device telemetry contracts.
 *
 * Every UI surface consumes these interfaces — never raw simulator output.
 * A hardware adapter (BLE, Web Bluetooth, Android bridge, ESP32 serial) only
 * has to produce objects of these shapes for the whole app to work.
 *
 * Any field may be `null` when a value is unavailable (sensor offline,
 * permission denied, packet lost). UI code must render that gracefully.
 */

export type ConnectionState = "connected" | "degraded" | "disconnected";

export type SensorHealth = "healthy" | "degraded" | "error" | "offline";

export type GpsStatus = "locked" | "searching" | "unavailable";

export type RadioStatus = "on" | "off" | "unsupported";

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface GeoFix {
  lat: number;
  lon: number;
  /** Horizontal accuracy radius in metres. */
  accuracyM: number;
  /** Human-readable approximate place (reverse-geocoded in a real build). */
  label: string;
}

export interface HelmetTelemetry {
  /** Epoch ms of the last packet received from the helmet. */
  timestamp: number | null;
  connection: ConnectionState;
  batteryPct: number | null;
  /** Wear (proximity / capacitive) sensor. */
  worn: boolean | null;
  /** Chin-strap buckle switch. */
  buckleSecured: boolean | null;
  imu: SensorHealth;
  /** Resultant acceleration from the high-g accelerometer, in g. */
  accelG: number | null;
  /** Round-trip link latency in ms. */
  latencyMs: number | null;
  firmware: string;
}

export interface BikeTelemetry {
  timestamp: number | null;
  connection: ConnectionState;
  /** Module backup battery (not the motorcycle battery). */
  batteryPct: number | null;
  imu: SensorHealth;
  speedKmh: number | null;
  /** Resultant acceleration at the bike module, in g. */
  accelG: number | null;
  /** Peak angular rate across axes, in deg/s. */
  angularRateDps: number | null;
  /** Lean / roll angle, in degrees. 0 = upright. */
  leanDeg: number | null;
  /** Ignition-enable signal the bike module would drive (simulated here). */
  startPermission: "enabled" | "blocked";
  latencyMs: number | null;
  firmware: string;
}

export interface PhoneTelemetry {
  timestamp: number | null;
  sensorsActive: boolean;
  batteryPct: number | null;
  /** Resultant acceleration of the phone, in g. */
  accelG: number | null;
  /** 0..1 normalised movement index over the last few seconds. */
  motionIndex: number | null;
  gps: GpsStatus;
  location: GeoFix | null;
  bluetooth: RadioStatus;
  network: "online" | "offline";
  /** Seconds of rolling pre-crash sensor history held on the phone. */
  bufferSeconds: number;
}

export interface EngineStatus {
  state: "active" | "degraded" | "offline";
  model: string;
}

export type TelemetrySourceKind = "simulated" | "web-bluetooth" | "native-bridge";

/** A full, synchronised view of the ecosystem at one instant. */
export interface SystemSnapshot {
  helmet: HelmetTelemetry;
  bike: BikeTelemetry;
  phone: PhoneTelemetry;
  engine: EngineStatus;
  source: { kind: TelemetrySourceKind; label: string };
}

/** One synchronised sample used for charts and the black-box buffer. */
export interface TelemetrySample {
  /** Seconds relative to the event (T = 0 is the primary impact). */
  t: number;
  speedKmh: number | null;
  helmetAccelG: number | null;
  bikeAccelG: number | null;
  angularRateDps: number | null;
  phoneAccelG: number | null;
}

import type { SystemSnapshot } from "../types/telemetry";

/**
 * Switches the presenter can flip in the simulator panel.
 * Each maps to a real failure mode the UI must handle.
 */
export interface SimulatedDeviceState {
  helmetConnected: boolean;
  helmetWorn: boolean;
  buckleSecured: boolean;
  helmetImuFault: boolean;
  helmetBatteryLow: boolean;
  bikeConnected: boolean;
  bikeImuFault: boolean;
  phoneBluetooth: boolean;
  gpsAvailable: boolean;
  phoneSensors: boolean;
}

export const HEALTHY_STATE: SimulatedDeviceState = {
  helmetConnected: true,
  helmetWorn: true,
  buckleSecured: true,
  helmetImuFault: false,
  helmetBatteryLow: false,
  bikeConnected: true,
  bikeImuFault: false,
  phoneBluetooth: true,
  gpsAvailable: true,
  phoneSensors: true,
};

export const SIM_LOCATION = {
  lat: 12.9352,
  lon: 77.6245,
  accuracyM: 6,
  label: "Outer Ring Road, Bengaluru (simulated)",
};

export interface LiveValues {
  speedKmh: number;
  helmetAccelG: number;
  bikeAccelG: number;
  angularRateDps: number;
  phoneAccelG: number;
  leanDeg: number;
}

const IDLE: LiveValues = {
  speedKmh: 0,
  helmetAccelG: 1,
  bikeAccelG: 0.02,
  angularRateDps: 0.5,
  phoneAccelG: 0.05,
  leanDeg: 0,
};

/** Build a full snapshot from simulator switches + current live values. */
export function buildSnapshot(
  s: SimulatedDeviceState,
  now: number,
  live: LiveValues = IDLE,
  jitter = 0,
): SystemSnapshot {
  const helmetLink = s.helmetConnected && s.phoneBluetooth;
  const bikeLink = s.bikeConnected && s.phoneBluetooth;
  const startOk = helmetLink && bikeLink && s.helmetWorn && s.buckleSecured && s.phoneSensors;

  return {
    helmet: {
      timestamp: helmetLink ? now : null,
      connection: helmetLink ? "connected" : "disconnected",
      batteryPct: helmetLink ? (s.helmetBatteryLow ? 12 : 86) : null,
      worn: helmetLink ? s.helmetWorn : null,
      buckleSecured: helmetLink ? s.buckleSecured : null,
      imu: !helmetLink ? "offline" : s.helmetImuFault ? "error" : "healthy",
      accelG: helmetLink && !s.helmetImuFault ? live.helmetAccelG : null,
      latencyMs: helmetLink ? Math.round(18 + jitter * 6) : null,
      firmware: "HLM 0.9.2-sim",
    },
    bike: {
      timestamp: bikeLink ? now : null,
      connection: bikeLink ? "connected" : "disconnected",
      batteryPct: bikeLink ? 94 : null,
      imu: !bikeLink ? "offline" : s.bikeImuFault ? "error" : "healthy",
      speedKmh: bikeLink ? live.speedKmh : null,
      accelG: bikeLink && !s.bikeImuFault ? live.bikeAccelG : null,
      angularRateDps: bikeLink && !s.bikeImuFault ? live.angularRateDps : null,
      leanDeg: bikeLink && !s.bikeImuFault ? live.leanDeg : null,
      startPermission: startOk ? "enabled" : "blocked",
      latencyMs: bikeLink ? Math.round(24 + jitter * 8) : null,
      firmware: "BKM 0.7.4-sim",
    },
    phone: {
      timestamp: now,
      sensorsActive: s.phoneSensors,
      batteryPct: 78,
      accelG: s.phoneSensors ? live.phoneAccelG : null,
      motionIndex: s.phoneSensors ? Math.min(1, live.phoneAccelG * 2) : null,
      gps: s.gpsAvailable ? "locked" : "unavailable",
      location: s.gpsAvailable ? SIM_LOCATION : null,
      bluetooth: s.phoneBluetooth ? "on" : "off",
      network: "online",
      bufferSeconds: 30,
    },
    engine: {
      state: !s.phoneSensors ? "offline" : !helmetLink || !bikeLink || s.helmetImuFault || s.bikeImuFault ? "degraded" : "active",
      model: "Fusion v0.4 (rule-based prototype)",
    },
    source: { kind: "simulated", label: "Simulated hardware" },
  };
}

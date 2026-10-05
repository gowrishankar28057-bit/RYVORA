import type { SystemSnapshot } from "../types/telemetry";

export type CheckId =
  | "helmet-connected"
  | "helmet-worn"
  | "buckle"
  | "helmet-imu"
  | "bike-connected"
  | "bike-imu"
  | "phone-sensors"
  | "communication";

export interface ReadinessCheck {
  id: CheckId;
  label: string;
  passed: boolean;
  /**
   * Essential checks block start permission. Advisory checks allow riding
   * with degraded detection — the helmet is not a single point of failure.
   */
  essential: boolean;
  detail: string;
  fix?: string;
}

export interface Readiness {
  state: "ready" | "degraded" | "blocked";
  checks: ReadinessCheck[];
  blockers: ReadinessCheck[];
  warnings: ReadinessCheck[];
}

export function evaluateReadiness(s: SystemSnapshot): Readiness {
  const btOff = s.phone.bluetooth !== "on";
  const helmetUp = s.helmet.connection !== "disconnected";
  const bikeUp = s.bike.connection !== "disconnected";
  const latencies = [s.helmet.latencyMs, s.bike.latencyMs].filter((v): v is number => v !== null);
  const commsOk = helmetUp && bikeUp && latencies.every((l) => l < 150);

  const checks: ReadinessCheck[] = [
    {
      id: "helmet-connected",
      label: "Helmet connected",
      passed: helmetUp,
      essential: true,
      detail: helmetUp ? "Linked via BLE" : "No signal",
      fix: btOff ? "Turn on Bluetooth on your phone." : "Switch on your helmet and keep it near your phone.",
    },
    {
      id: "helmet-worn",
      label: "Helmet worn",
      passed: s.helmet.worn === true,
      essential: true,
      detail: s.helmet.worn === null ? "Unknown" : s.helmet.worn ? "Wear sensor confirmed" : "Not detected",
      fix: "Put on your helmet before starting.",
    },
    {
      id: "buckle",
      label: "Buckle secured",
      passed: s.helmet.buckleSecured === true,
      essential: true,
      detail: s.helmet.buckleSecured === null ? "Unknown" : s.helmet.buckleSecured ? "Strap locked" : "Strap open",
      fix: "Secure your helmet strap before starting.",
    },
    {
      id: "helmet-imu",
      label: "Helmet IMU responsive",
      passed: s.helmet.imu === "healthy",
      essential: false,
      detail: s.helmet.imu === "healthy" ? "Self-test passed" : s.helmet.imu === "offline" ? "Offline" : "Not responding",
      fix: "Helmet IMU error — crash detection capability may be degraded. Phone and bike verification remain active.",
    },
    {
      id: "bike-connected",
      label: "Bike module connected",
      passed: bikeUp,
      essential: true,
      detail: bikeUp ? "Linked via BLE" : "No signal",
      fix: btOff ? "Turn on Bluetooth on your phone." : "Check the bike module power and stay near the motorcycle.",
    },
    {
      id: "bike-imu",
      label: "Bike IMU responsive",
      passed: s.bike.imu === "healthy",
      essential: false,
      detail: s.bike.imu === "healthy" ? "Self-test passed" : s.bike.imu === "offline" ? "Offline" : "Not responding",
      fix: "Bike IMU error — fall detection relies on helmet and phone only.",
    },
    {
      id: "phone-sensors",
      label: "Phone sensors active",
      passed: s.phone.sensorsActive,
      essential: true,
      detail: s.phone.sensorsActive ? "Accelerometer · gyroscope · GPS" : "Motion sensors unavailable",
      fix: "Allow motion-sensor access for RYVORA in phone settings.",
    },
    {
      id: "communication",
      label: "Communication healthy",
      passed: commsOk,
      essential: false,
      detail: commsOk ? `Latency ${Math.max(...latencies, 0)} ms` : "Link incomplete",
      fix: "Some devices are not reporting. Safety coverage is reduced.",
    },
  ];

  const blockers = checks.filter((c) => c.essential && !c.passed);
  const warnings = checks.filter((c) => !c.essential && !c.passed);
  if (s.phone.gps === "unavailable") {
    warnings.push({
      id: "communication",
      label: "Location unavailable",
      passed: false,
      essential: false,
      detail: "GPS off",
      fix: "Location unavailable — emergency workflow will share the last known location.",
    });
  }

  return {
    state: blockers.length ? "blocked" : warnings.length ? "degraded" : "ready",
    checks,
    blockers,
    warnings,
  };
}

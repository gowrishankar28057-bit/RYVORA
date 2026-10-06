import { describe, expect, it } from "vitest";
import { evaluateReadiness } from "./readiness";
import { buildSnapshot, HEALTHY_STATE, type SimulatedDeviceState } from "../simulation/device-state";
import { unpairedSnapshot } from "../simulation/web-bluetooth-source";

const NOW = 1_700_000_000_000;
const readinessFor = (patch: Partial<SimulatedDeviceState> = {}) => evaluateReadiness(buildSnapshot({ ...HEALTHY_STATE, ...patch }, NOW));
const ids = (checks: { id: string }[]) => checks.map((c) => c.id);

describe("evaluateReadiness", () => {
  it("is ready when every module is healthy", () => {
    const r = readinessFor();
    expect(r.state).toBe("ready");
    expect(r.blockers).toEqual([]);
    expect(r.warnings).toEqual([]);
    expect(r.checks.every((c) => c.passed)).toBe(true);
  });

  it.each([
    ["helmet not worn", { helmetWorn: false }, "helmet-worn"],
    ["buckle open", { buckleSecured: false }, "buckle"],
    ["bike module disconnected", { bikeConnected: false }, "bike-connected"],
    ["helmet disconnected", { helmetConnected: false }, "helmet-connected"],
    ["phone sensors off", { phoneSensors: false }, "phone-sensors"],
  ] as const)("is blocked when %s", (_, patch, blocker) => {
    const r = readinessFor(patch);
    expect(r.state).toBe("blocked");
    expect(ids(r.blockers)).toContain(blocker);
  });

  it("is blocked when Bluetooth is off — both links drop and the fix says so", () => {
    const r = readinessFor({ phoneBluetooth: false });
    expect(r.state).toBe("blocked");
    expect(ids(r.blockers)).toEqual(expect.arrayContaining(["helmet-connected", "bike-connected"]));
    expect(r.blockers.find((b) => b.id === "helmet-connected")?.fix).toMatch(/Bluetooth/);
  });

  it("is degraded (not blocked) on a helmet IMU fault — the helmet is not a single point of failure", () => {
    const r = readinessFor({ helmetImuFault: true });
    expect(r.state).toBe("degraded");
    expect(r.blockers).toEqual([]);
    const imu = r.warnings.find((w) => w.id === "helmet-imu");
    expect(imu?.fix).toMatch(/crash detection capability may be degraded/i);
    expect(imu?.fix).toMatch(/phone and bike verification remain active/i);
  });

  it("is degraded on a bike IMU fault", () => {
    const r = readinessFor({ bikeImuFault: true });
    expect(r.state).toBe("degraded");
    expect(ids(r.warnings)).toContain("bike-imu");
  });

  it("is degraded when GPS is unavailable and points to the last known location", () => {
    const r = readinessFor({ gpsAvailable: false });
    expect(r.state).toBe("degraded");
    expect(r.blockers).toEqual([]);
    const gps = r.warnings.find((w) => w.label === "Location unavailable");
    expect(gps?.id).toBe("location");
    expect(gps?.fix).toMatch(/last known location/i);
    // Distinct ids keep lists keyed by check id collision-free.
    expect(new Set(ids(r.warnings)).size).toBe(r.warnings.length);
  });

  it("flags poor link latency as an advisory communication warning", () => {
    const s = buildSnapshot(HEALTHY_STATE, NOW);
    const r = evaluateReadiness({ ...s, helmet: { ...s.helmet, latencyMs: 240 } });
    expect(r.state).toBe("degraded");
    expect(ids(r.warnings)).toContain("communication");
  });

  it("prefers blocked over degraded when both apply", () => {
    const r = readinessFor({ helmetImuFault: true, buckleSecured: false });
    expect(r.state).toBe("blocked");
    expect(ids(r.warnings)).toContain("helmet-imu");
  });

  it("handles a snapshot with every value unavailable without throwing", () => {
    const r = evaluateReadiness(unpairedSnapshot("unsupported"));
    expect(r.state).toBe("blocked");
    expect(r.checks.find((c) => c.id === "helmet-worn")?.detail).toBe("Unknown");
    expect(r.checks.find((c) => c.id === "communication")?.passed).toBe(false);
  });
});

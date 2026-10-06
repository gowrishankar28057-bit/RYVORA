import { describe, expect, it } from "vitest";
import { buildSnapshot, HEALTHY_STATE, SIM_LOCATION, type SimulatedDeviceState } from "./device-state";

const NOW = 1_700_000_000_000;
const snap = (patch: Partial<SimulatedDeviceState> = {}, jitter = 0) => buildSnapshot({ ...HEALTHY_STATE, ...patch }, NOW, undefined, jitter);

describe("buildSnapshot", () => {
  it("reports every module live when healthy", () => {
    const s = snap();
    expect(s.helmet).toMatchObject({ timestamp: NOW, connection: "connected", worn: true, buckleSecured: true, imu: "healthy" });
    expect(s.bike).toMatchObject({ timestamp: NOW, connection: "connected", imu: "healthy", startPermission: "enabled" });
    expect(s.phone).toMatchObject({ timestamp: NOW, sensorsActive: true, gps: "locked", bluetooth: "on", location: SIM_LOCATION });
    expect(s.engine.state).toBe("active");
    expect(s.source.kind).toBe("simulated");
    expect(s.helmet.batteryPct).toBeGreaterThan(20);
    expect(s.helmet.latencyMs).not.toBeNull();
  });

  it("nulls every helmet reading when the helmet is disconnected", () => {
    const s = snap({ helmetConnected: false });
    expect(s.helmet).toMatchObject({
      timestamp: null,
      connection: "disconnected",
      batteryPct: null,
      worn: null,
      buckleSecured: null,
      imu: "offline",
      accelG: null,
      latencyMs: null,
    });
    expect(s.bike.startPermission).toBe("blocked");
    expect(s.engine.state).toBe("degraded");
  });

  it("nulls every bike reading when the bike module is disconnected", () => {
    const s = snap({ bikeConnected: false });
    expect(s.bike).toMatchObject({
      timestamp: null,
      connection: "disconnected",
      batteryPct: null,
      imu: "offline",
      speedKmh: null,
      accelG: null,
      angularRateDps: null,
      leanDeg: null,
      latencyMs: null,
      startPermission: "blocked",
    });
    // The helmet keeps reporting on its own link.
    expect(s.helmet.connection).toBe("connected");
  });

  it("drops both BLE links when phone Bluetooth is off, but the phone itself keeps sampling", () => {
    const s = snap({ phoneBluetooth: false });
    expect(s.phone.bluetooth).toBe("off");
    expect(s.helmet.connection).toBe("disconnected");
    expect(s.bike.connection).toBe("disconnected");
    expect(s.helmet.timestamp).toBeNull();
    expect(s.bike.timestamp).toBeNull();
    expect(s.phone.timestamp).toBe(NOW);
    expect(s.phone.accelG).not.toBeNull();
  });

  it("keeps the helmet linked but withholds IMU data on a helmet IMU fault", () => {
    const s = snap({ helmetImuFault: true });
    expect(s.helmet.imu).toBe("error");
    expect(s.helmet.accelG).toBeNull();
    expect(s.helmet.connection).toBe("connected");
    expect(s.helmet.worn).toBe(true);
    expect(s.engine.state).toBe("degraded");
    // Start permission is not blocked by an advisory fault.
    expect(s.bike.startPermission).toBe("enabled");
  });

  it("withholds bike motion data on a bike IMU fault but keeps speed", () => {
    const s = snap({ bikeImuFault: true });
    expect(s.bike.imu).toBe("error");
    expect(s.bike.accelG).toBeNull();
    expect(s.bike.angularRateDps).toBeNull();
    expect(s.bike.leanDeg).toBeNull();
    expect(s.bike.speedKmh).not.toBeNull();
  });

  it("clears the location when GPS is unavailable", () => {
    const s = snap({ gpsAvailable: false });
    expect(s.phone.gps).toBe("unavailable");
    expect(s.phone.location).toBeNull();
  });

  it("takes the engine offline and blocks start when phone sensors are off", () => {
    const s = snap({ phoneSensors: false });
    expect(s.phone.sensorsActive).toBe(false);
    expect(s.phone.accelG).toBeNull();
    expect(s.phone.motionIndex).toBeNull();
    expect(s.engine.state).toBe("offline");
    expect(s.bike.startPermission).toBe("blocked");
  });

  it("reports a low helmet battery below the 20 % warning line", () => {
    expect(snap({ helmetBatteryLow: true }).helmet.batteryPct).toBeLessThan(20);
  });

  it("blocks start when the helmet is not worn or the buckle is open", () => {
    expect(snap({ helmetWorn: false }).bike.startPermission).toBe("blocked");
    expect(snap({ buckleSecured: false }).bike.startPermission).toBe("blocked");
  });

  it("keeps latency jitter inside a plausible band", () => {
    for (const j of [0, 0.5, 0.999]) {
      const s = snap({}, j);
      expect(s.helmet.latencyMs).toBeGreaterThanOrEqual(18);
      expect(s.helmet.latencyMs).toBeLessThanOrEqual(24);
      expect(s.bike.latencyMs).toBeGreaterThanOrEqual(24);
      expect(s.bike.latencyMs).toBeLessThanOrEqual(32);
    }
  });

  it("does not mutate the input state", () => {
    const state = { ...HEALTHY_STATE, helmetImuFault: true };
    const copy = { ...state };
    buildSnapshot(state, NOW);
    expect(state).toEqual(copy);
  });
});

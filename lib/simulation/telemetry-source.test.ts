import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SystemSnapshot } from "../types/telemetry";
import { HEALTHY_STATE } from "./device-state";
import {
  foldLastSeen,
  formatPacketAge,
  latencyQuality,
  NEVER_SEEN,
  packetAgeMs,
  SimulatedTelemetrySource,
  supportsFaultInjection,
  webBluetoothSupport,
} from "./telemetry-source";
import { RYVORA_GATT, unpairedSnapshot, WebBluetoothTelemetrySource } from "./web-bluetooth-source";
import { createTelemetrySource, resolveTelemetrySourceKind } from "./create-source";

const T0 = 1_700_000_000_000;

describe("SimulatedTelemetrySource", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(T0);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("exposes a placeholder snapshot before anyone subscribes and starts no timers", () => {
    const src = new SimulatedTelemetrySource();
    expect(src.getSnapshot().helmet.timestamp).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("emits immediately on subscribe, then at 1 Hz while idle", () => {
    const src = new SimulatedTelemetrySource();
    const listener = vi.fn();
    const unsubscribe = src.subscribe(listener);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.lastCall?.[0].helmet.timestamp).toBe(T0);

    vi.advanceTimersByTime(3000);
    expect(listener).toHaveBeenCalledTimes(4);
    expect(src.getSnapshot()).toBe(listener.mock.lastCall?.[0]);
    expect(src.getSnapshot().helmet.timestamp).toBe(T0 + 3000);
    unsubscribe();
  });

  it("switches to 8 Hz while riding and back to 1 Hz afterwards", () => {
    const src = new SimulatedTelemetrySource();
    const listener = vi.fn();
    const unsubscribe = src.subscribe(listener);
    listener.mockClear();

    src.setRiding(true);
    expect(listener).toHaveBeenCalledTimes(1); // restart emits once
    vi.advanceTimersByTime(1000);
    expect(listener).toHaveBeenCalledTimes(9);
    expect(src.getSnapshot().bike.speedKmh).toBeGreaterThan(20);

    listener.mockClear();
    src.setRiding(false);
    vi.advanceTimersByTime(1000);
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });

  it("stops its timer when the last listener unsubscribes", () => {
    const src = new SimulatedTelemetrySource();
    const a = vi.fn();
    const b = vi.fn();
    const offA = src.subscribe(a);
    const offB = src.subscribe(b);
    expect(vi.getTimerCount()).toBe(1);

    // A late subscriber reads getSnapshot(); it is not re-sent the current one.
    expect(b).not.toHaveBeenCalled();

    offA();
    vi.advanceTimersByTime(2000);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(1);

    offB();
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(5000);
    expect(b).toHaveBeenCalledTimes(2);
  });

  it("does not start a timer when riding toggles with no listeners", () => {
    const src = new SimulatedTelemetrySource();
    src.setRiding(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("can be revived after dispose (React Strict Mode remount)", () => {
    const src = new SimulatedTelemetrySource();
    const first = vi.fn();
    src.subscribe(first);
    src.dispose();
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(2000);
    expect(first).toHaveBeenCalledTimes(1);

    const second = vi.fn();
    const off = src.subscribe(second);
    vi.advanceTimersByTime(1000);
    expect(second).toHaveBeenCalledTimes(2);
    off();
    src.dispose(); // idempotent
  });

  it("applies injected device faults to the next snapshot", () => {
    const src = new SimulatedTelemetrySource();
    const listener = vi.fn<(s: SystemSnapshot) => void>();
    const off = src.subscribe(listener);
    src.setDeviceState({ ...HEALTHY_STATE, helmetImuFault: true, gpsAvailable: false });
    const s = listener.mock.lastCall?.[0];
    expect(s?.helmet.imu).toBe("error");
    expect(s?.phone.location).toBeNull();
    off();
  });

  it("supports fault injection and connects immediately", async () => {
    const src = new SimulatedTelemetrySource();
    expect(supportsFaultInjection(src)).toBe(true);
    await expect(src.connect()).resolves.toEqual({ status: "connected" });
  });
});

describe("WebBluetoothTelemetrySource", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports an unpaired, all-unavailable snapshot without Web Bluetooth", async () => {
    vi.stubGlobal("navigator", {});
    const src = new WebBluetoothTelemetrySource();
    const listener = vi.fn<(s: SystemSnapshot) => void>();
    const off = src.subscribe(listener);
    const s = listener.mock.lastCall?.[0];
    expect(s?.phone.bluetooth).toBe("unsupported");
    expect(s?.helmet.connection).toBe("disconnected");
    expect(s?.bike.startPermission).toBe("blocked");
    expect(s?.engine.state).toBe("offline");
    expect(supportsFaultInjection(src)).toBe(false);
    await expect(src.connect()).resolves.toMatchObject({ status: "unsupported" });
    off();
    src.dispose();
  });

  it("reflects radio availability when the browser exposes Web Bluetooth", async () => {
    vi.stubGlobal("navigator", { onLine: true, bluetooth: { requestDevice: vi.fn(), getAvailability: () => Promise.resolve(false) } });
    expect(webBluetoothSupport()).toBe("supported");
    const src = new WebBluetoothTelemetrySource();
    const listener = vi.fn<(s: SystemSnapshot) => void>();
    src.subscribe(listener);
    await vi.waitFor(() => expect(listener.mock.lastCall?.[0].phone.bluetooth).toBe("off"));
    expect(src.getSnapshot().helmet.connection).toBe("disconnected");
    await expect(src.connect()).resolves.toMatchObject({ status: "failed" });
  });

  it("never throws when the availability probe fails", async () => {
    vi.stubGlobal("navigator", {
      bluetooth: {
        requestDevice: vi.fn(),
        getAvailability: () => {
          throw new Error("blocked by permissions policy");
        },
      },
    });
    const src = new WebBluetoothTelemetrySource();
    const listener = vi.fn<(s: SystemSnapshot) => void>();
    expect(() => src.subscribe(listener)).not.toThrow();
    expect(listener.mock.lastCall?.[0].phone.bluetooth).toBe("unsupported");

    vi.stubGlobal("navigator", { bluetooth: { requestDevice: vi.fn(), getAvailability: () => Promise.reject(new Error("nope")) } });
    const rejecting = new WebBluetoothTelemetrySource();
    const l2 = vi.fn<(s: SystemSnapshot) => void>();
    rejecting.subscribe(l2);
    await vi.waitFor(() => expect(l2.mock.lastCall?.[0].phone.bluetooth).toBe("unsupported"));
  });

  it("ignores a probe that resolves after dispose", async () => {
    let resolve: (v: boolean) => void = () => {};
    vi.stubGlobal("navigator", { bluetooth: { requestDevice: vi.fn(), getAvailability: () => new Promise<boolean>((r) => (resolve = r)) } });
    const src = new WebBluetoothTelemetrySource();
    const listener = vi.fn();
    src.subscribe(listener);
    src.dispose();
    resolve(true);
    await Promise.resolve();
    expect(listener).not.toHaveBeenCalled();
    expect(src.getSnapshot().phone.bluetooth).toBe("unsupported");
  });

  it("documents placeholder GATT UUIDs in 128-bit form", () => {
    const uuids = [...Object.values(RYVORA_GATT.helmet), ...Object.values(RYVORA_GATT.bike)];
    for (const u of uuids) expect(u).toMatch(/^[0-9a-f]{8}-5259-564f-5241-[0-9a-f]{12}$/);
    expect(new Set(uuids).size).toBe(uuids.length);
  });

  it("unpairedSnapshot keeps every reading null", () => {
    const s = unpairedSnapshot("off");
    expect([s.helmet.timestamp, s.helmet.batteryPct, s.helmet.worn, s.bike.speedKmh, s.phone.location, s.phone.accelG]).toEqual([
      null,
      null,
      null,
      null,
      null,
      null,
    ]);
    expect(s.source.kind).toBe("web-bluetooth");
  });
});

describe("createTelemetrySource", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    [undefined, "simulated"],
    ["", "simulated"],
    ["simulated", "simulated"],
    ["web-bluetooth", "web-bluetooth"],
    ["  Web-Bluetooth ", "web-bluetooth"],
    ["native-bridge", "simulated"],
    ["garbage", "simulated"],
  ] as const)("resolves %j to %s", (raw, kind) => {
    expect(resolveTelemetrySourceKind(raw)).toBe(kind);
    expect(createTelemetrySource(raw).kind).toBe(kind);
  });

  it("reads NEXT_PUBLIC_TELEMETRY_SOURCE by default", () => {
    vi.stubEnv("NEXT_PUBLIC_TELEMETRY_SOURCE", "web-bluetooth");
    expect(createTelemetrySource()).toBeInstanceOf(WebBluetoothTelemetrySource);
    vi.stubEnv("NEXT_PUBLIC_TELEMETRY_SOURCE", "unknown-thing");
    expect(createTelemetrySource()).toBeInstanceOf(SimulatedTelemetrySource);
  });
});

describe("link diagnostics", () => {
  it("grades latency", () => {
    expect(latencyQuality(null)).toBeNull();
    expect(latencyQuality(Number.NaN)).toBeNull();
    expect(latencyQuality(-1)).toBeNull();
    expect(latencyQuality(18)).toBe("excellent");
    expect(latencyQuality(80)).toBe("good");
    expect(latencyQuality(120)).toBe("fair");
    expect(latencyQuality(150)).toBe("poor");
  });

  it("computes packet age only for real timestamps", () => {
    expect(packetAgeMs(null, T0)).toBeNull();
    expect(packetAgeMs(T0, null)).toBeNull();
    expect(packetAgeMs(0, T0)).toBeNull();
    expect(packetAgeMs(T0 - 400, T0)).toBe(400);
    expect(packetAgeMs(T0 + 50, T0)).toBe(0);
  });

  it("formats packet age", () => {
    expect(formatPacketAge(null)).toBe("—");
    expect(formatPacketAge(0)).toBe("0.0 s ago");
    expect(formatPacketAge(400)).toBe("0.4 s ago");
    expect(formatPacketAge(12_300)).toBe("12 s ago");
    expect(formatPacketAge(185_000)).toBe("3 min ago");
    expect(formatPacketAge(2 * 3_600_000 + 5)).toBe("2 h ago");
  });

  it("keeps the last packet time and GPS fix across disconnection", () => {
    const live = new SimulatedTelemetrySource();
    live.setDeviceState(HEALTHY_STATE);
    const healthy = live.getSnapshot();
    const seen = foldLastSeen(NEVER_SEEN, healthy);
    expect(seen.helmetAt).toBe(healthy.helmet.timestamp);
    expect(seen.location).toEqual(healthy.phone.location);

    const dropped = unpairedSnapshot("off");
    const after = foldLastSeen(seen, dropped);
    expect(after.helmetAt).toBe(seen.helmetAt);
    expect(after.bikeAt).toBe(seen.bikeAt);
    expect(after.location).toEqual(seen.location);
    expect(after.locationAt).toBe(seen.locationAt);
  });

  it("ignores the epoch-0 placeholder snapshot", () => {
    const placeholder = new SimulatedTelemetrySource().getSnapshot();
    expect(foldLastSeen(NEVER_SEEN, placeholder).helmetAt).toBeNull();
  });
});

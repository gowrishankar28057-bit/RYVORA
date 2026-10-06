import { describe, expect, it } from "vitest";
import type { TelemetrySample } from "@/lib/types/telemetry";
import { CRASH_SERIES, DROP_SERIES } from "./demo-data";
import {
  crashSnapshot,
  indexAt,
  peakOf,
  rideLive,
  rideSnapshot,
  rideStreams,
  RIDE_STREAM_POINTS,
  sampleAt,
  sliceBetween,
  streamUntil,
  tracePath,
  TRACE_CHANNELS,
  xFraction,
} from "./playback";

const row = (t: number, v: number | null): TelemetrySample => ({
  t,
  speedKmh: v,
  helmetAccelG: v,
  bikeAccelG: v,
  angularRateDps: v,
  phoneAccelG: v,
});

describe("series sampling", () => {
  const series = [row(-1, 1), row(-0.5, 2), row(0, 3), row(0.5, null), row(1, 5)];

  it("finds the last sample at or before a time, clamped to the series", () => {
    expect(indexAt(series, -5)).toBe(0);
    expect(indexAt(series, -0.6)).toBe(0);
    expect(indexAt(series, -0.5)).toBe(1);
    expect(indexAt(series, 0.49)).toBe(2);
    expect(indexAt(series, 99)).toBe(4);
    expect(indexAt([], 0)).toBe(0);
    expect(sampleAt([], 0)).toBeNull();
    expect(sampleAt(series, 0.2)?.t).toBe(0);
  });

  it("slices inclusive windows and handles empty input", () => {
    expect(sliceBetween(series, -0.5, 0.5).map((s) => s.t)).toEqual([-0.5, 0, 0.5]);
    expect(sliceBetween(series, 1, 0)).toEqual([]);
    expect(sliceBetween([], -1, 1)).toEqual([]);
  });

  it("computes peaks ignoring missing values", () => {
    expect(peakOf(series, "helmetAccelG")).toBe(5);
    expect(peakOf([row(0, null)], "helmetAccelG")).toBeNull();
  });

  it("pads short streams and never throws near the series start", () => {
    expect(streamUntil(series, -1, "speedKmh", 3)).toEqual([1, 1, 1]);
    expect(streamUntil(series, 1, "speedKmh", 3)).toEqual([3, null, 5]);
    expect(streamUntil([], 0, "speedKmh", 2)).toEqual([null, null]);
  });
});

describe("tracePath", () => {
  const box = { from: -1, to: 1, max: 10, width: 100, height: 20 };

  it("maps samples into the box and breaks the line on missing data", () => {
    const d = tracePath([row(-1, 0), row(0, 10), row(0.5, null), row(1, 5)], "speedKmh", box);
    expect(d).toBe("M0.0,20.0L50.0,0.0M100.0,10.0");
  });

  it("clamps out-of-range values instead of drawing outside the chart", () => {
    expect(tracePath([row(0, 50), row(1, -3)], "speedKmh", box)).toBe("M50.0,0.0L100.0,20.0");
  });

  it("returns an empty path for no data", () => {
    expect(tracePath([], "speedKmh", box)).toBe("");
    expect(tracePath([row(0, null)], "speedKmh", box)).toBe("");
  });

  it("computes cursor fractions safely", () => {
    expect(xFraction(0, -1, 1)).toBe(0.5);
    expect(xFraction(5, -1, 1)).toBe(1);
    expect(xFraction(0, 1, 1)).toBe(0);
  });
});

describe("scenario data fits the shared trace scales", () => {
  it("keeps every channel peak under its fixed ceiling", () => {
    for (const ch of TRACE_CHANNELS) {
      for (const series of [DROP_SERIES, CRASH_SERIES]) {
        expect(peakOf(series, ch.key) ?? 0).toBeLessThanOrEqual(ch.max);
      }
    }
  });

  it("helmet drop: helmet spikes while bike and phone stay flat", () => {
    expect(peakOf(DROP_SERIES, "helmetAccelG")).toBeGreaterThan(30);
    expect(peakOf(DROP_SERIES, "bikeAccelG")).toBeLessThan(0.2);
    expect(peakOf(DROP_SERIES, "phoneAccelG")).toBeLessThan(0.5);
    expect(peakOf(DROP_SERIES, "speedKmh")).toBe(0);
  });

  it("severe crash: the helmet goes silent just after impact", () => {
    expect(sampleAt(CRASH_SERIES, 0)?.helmetAccelG).toBeGreaterThan(50);
    expect(sampleAt(CRASH_SERIES, 0.5)?.helmetAccelG).toBeNull();
    expect(crashSnapshot(CRASH_SERIES, -1).helmet.connection).toBe("connected");
    const after = crashSnapshot(CRASH_SERIES, 1);
    expect(after.helmet.connection).toBe("disconnected");
    expect(after.helmet.accelG).toBeNull();
    expect(after.bike.connection).toBe("connected");
  });
});

describe("live ride signals", () => {
  it("is deterministic and starts from a standstill", () => {
    expect(rideLive(3.3)).toEqual(rideLive(3.3));
    expect(rideLive(0).speedKmh).toBe(0);
    expect(rideLive(-2).speedKmh).toBe(0);
  });

  it("cruises at a plausible city speed with gentle, finite values", () => {
    for (let t = 0; t <= 10; t += 0.1) {
      const v = rideLive(t);
      expect(v.speedKmh).toBeGreaterThanOrEqual(0);
      expect(v.speedKmh).toBeLessThan(50);
      expect(v.helmetAccelG).toBeGreaterThan(0.8);
      expect(v.helmetAccelG).toBeLessThan(1.3);
      expect(v.phoneAccelG).toBeGreaterThan(0);
      expect(Object.values(v).every(Number.isFinite)).toBe(true);
    }
    expect(rideLive(8).speedKmh).toBeGreaterThan(38);
  });

  it("produces fixed-length sparkline windows and a ready snapshot", () => {
    const s = rideStreams(4);
    expect(s.helmet).toHaveLength(RIDE_STREAM_POINTS);
    expect(s.bike).toHaveLength(RIDE_STREAM_POINTS);
    expect(s.phone).toHaveLength(RIDE_STREAM_POINTS);
    const snap = rideSnapshot(5);
    expect(snap.bike.startPermission).toBe("enabled");
    expect(snap.engine.state).toBe("active");
    expect(snap.source.kind).toBe("simulated");
  });
});

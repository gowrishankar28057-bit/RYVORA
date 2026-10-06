import { describe, expect, it } from "vitest";
import {
  adjacentEntries,
  assessEntry,
  channelStats,
  defaultChannelFor,
  describeResponse,
  filterHistory,
  fmtIstDateTime,
  fmtIstShort,
  fmtIstTime,
  fmtMinutes,
  groupByIstDay,
  istDayKey,
  rideStats,
  summarizeHistory,
} from "@/components/history/history-model";
import { getEventsForRide, getRideEvent, RIDE_HISTORY } from "@/data/rides";
import { getScenario, SCENARIO_MAP } from "@/lib/simulation/scenarios";

describe("history data", () => {
  it("is ordered newest first with unique ids", () => {
    const times = RIDE_HISTORY.map((e) => Date.parse(e.occurredAt));
    expect([...times].sort((a, b) => b - a)).toEqual(times);
    expect(new Set(RIDE_HISTORY.map((e) => e.id)).size).toBe(RIDE_HISTORY.length);
  });

  it("references only known scenarios and rides", () => {
    for (const e of RIDE_HISTORY) {
      expect(getScenario(e.scenarioId)).toBeDefined();
      if (e.rideId) expect(getRideEvent(e.rideId)?.kind).toBe("ride");
    }
  });

  it("links events to the ride they happened on", () => {
    expect(getEventsForRide("ride-1044").map((e) => e.id)).toEqual(["evt-1039"]);
    expect(getEventsForRide("ride-1040")).toEqual([]);
  });
});

describe("history model", () => {
  it("summarises rides, distance, events and rejected false triggers", () => {
    const s = summarizeHistory(RIDE_HISTORY);
    expect(s.rides).toBe(3);
    expect(s.distanceKm).toBeCloseTo(74.2);
    expect(s.events).toBe(6);
    // pothole, helmet drop and parked bike fall
    expect(s.falseTriggersRejected).toBe(3);
  });

  it("filters by kind", () => {
    expect(filterHistory(RIDE_HISTORY, "all")).toHaveLength(RIDE_HISTORY.length);
    expect(filterHistory(RIDE_HISTORY, "rides").every((e) => e.kind === "ride")).toBe(true);
    expect(filterHistory(RIDE_HISTORY, "events").every((e) => e.kind === "event")).toBe(true);
    expect(filterHistory([], "events")).toEqual([]);
  });

  it("groups by IST calendar day, not UTC", () => {
    // 20:00 UTC on 3 Oct is 01:30 IST on 4 Oct.
    expect(istDayKey("2026-10-03T20:00:00Z")).toBe("2026-10-04");
    expect(istDayKey("not a date")).toBe("unknown");
    const days = groupByIstDay(RIDE_HISTORY);
    expect(days[0].key).toBe("2026-10-04");
    expect(days[0].entries.map((e) => e.id)).toEqual(["evt-1042", "evt-1041"]);
    expect(days.reduce((n, d) => n + d.entries.length, 0)).toBe(RIDE_HISTORY.length);
  });

  it("formats IST date-times", () => {
    expect(fmtIstDateTime("2026-10-04T14:12:18Z")).toBe("Sun, 4 Oct 2026 · 19:42 IST");
    expect(fmtIstShort("2026-09-28T01:10:00Z")).toBe("28 Sep, 06:40");
    expect(fmtIstTime("2026-10-03T18:31:00Z")).toBe("00:01");
    expect(fmtIstDateTime("bad")).toBe("Date unavailable");
  });

  it("derives ride stats and tolerates missing values", () => {
    const s = rideStats({ distanceKm: 12.6, durationMin: 31, maxSpeedKmh: 58 });
    expect(s.avgSpeedKmh).toBeCloseTo(24.39, 1);
    expect(rideStats({})).toEqual({ distanceKm: null, durationMin: null, avgSpeedKmh: null, maxSpeedKmh: null });
    expect(rideStats({ distanceKm: 5, durationMin: 0 }).avgSpeedKmh).toBeNull();
    expect(fmtMinutes(82)).toBe("1 h 22 min");
    expect(fmtMinutes(null)).toBe("—");
  });

  it("finds newer / older neighbours", () => {
    expect(adjacentEntries(RIDE_HISTORY, "evt-1042")).toEqual({ newer: null, older: RIDE_HISTORY[1] });
    expect(adjacentEntries(RIDE_HISTORY, "missing")).toEqual({ newer: null, older: null });
  });

  it("describes the engine's response, labelling the emergency path as simulated", () => {
    const severe = assessEntry({ kind: "event", scenarioId: "severe-crash" });
    expect(severe).not.toBeNull();
    const r = describeResponse(severe!);
    expect(r.title).toMatch(/emergency workflow/);
    expect(r.simulated).toBe(true);
    expect(describeResponse({ action: "rider-check-escalate", emergency: false }).simulated).toBe(false);
    expect(describeResponse({ action: "inspect-helmet", emergency: false }).title).toBe("Helmet inspection suggested");
    expect(assessEntry({ kind: "ride", scenarioId: "normal" })).toBeNull();
    expect(assessEntry({ kind: "event", scenarioId: "nope" })).toBeNull();
  });

  it("finds a channel's peak and the window where it went silent", () => {
    const series = SCENARIO_MAP["severe-crash"].series();
    const helmet = channelStats(series, "helmetAccelG");
    expect(helmet.peak?.t).toBe(0);
    expect(helmet.peak?.value).toBeGreaterThan(60);
    expect(helmet.gap?.lastSeen).toBe(0.1);
    expect(helmet.gap?.until).toBe(series[series.length - 1].t);
    expect(channelStats(series, "speedKmh").gap).toBeNull();
    expect(
      channelStats([{ t: 0, speedKmh: null, helmetAccelG: null, bikeAccelG: null, angularRateDps: null, phoneAccelG: null }], "speedKmh"),
    ).toEqual({
      peak: null,
      gap: null,
      available: 0,
    });
    const row = (t: number, v: number | null) => ({
      t,
      speedKmh: v,
      helmetAccelG: null,
      bikeAccelG: null,
      angularRateDps: null,
      phoneAccelG: null,
    });
    // Only the first silent stretch is reported; leading gaps (no data yet) are not.
    expect(channelStats([row(0, null), row(1, 5), row(2, null), row(3, null), row(4, 9), row(5, null)], "speedKmh")).toEqual({
      peak: { t: 4, value: 9 },
      gap: { lastSeen: 1, until: 3 },
      available: 2,
    });
    expect(defaultChannelFor("HELMET_DROP")).toBe("helmetAccelG");
    expect(defaultChannelFor(null)).toBe("speedKmh");
  });
});

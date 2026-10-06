import { describe, expect, it } from "vitest";
import { DEFAULT_SAFETY_SETTINGS, getSafetySettings, parseSafetySettings } from "@/components/profile/safety-settings";

describe("safety settings", () => {
  it("falls back to defaults for missing or malformed storage", () => {
    expect(parseSafetySettings(null)).toBe(DEFAULT_SAFETY_SETTINGS);
    expect(parseSafetySettings("{not json")).toBe(DEFAULT_SAFETY_SETTINGS);
    expect(parseSafetySettings("42")).toBe(DEFAULT_SAFETY_SETTINGS);
    expect(parseSafetySettings("null")).toBe(DEFAULT_SAFETY_SETTINGS);
  });

  it("keeps valid fields and repairs invalid ones", () => {
    expect(parseSafetySettings(JSON.stringify({ riderCheckSeconds: 30, autoEscalation: false }))).toEqual({
      riderCheckSeconds: 30,
      autoEscalation: false,
      speedUnit: "kmh",
    });
    expect(parseSafetySettings(JSON.stringify({ riderCheckSeconds: 7, autoEscalation: "yes", speedUnit: "mph" }))).toEqual(
      DEFAULT_SAFETY_SETTINGS,
    );
  });

  it("returns defaults where there is no window (server)", () => {
    expect(getSafetySettings()).toBe(DEFAULT_SAFETY_SETTINGS);
  });
});

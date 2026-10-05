import type { ScenarioDefinition } from "../types/events";
import { buildSeries, keyframes, pulse } from "./series";

/**
 * SIMULATED scenarios. Values are illustrative and chosen to be physically
 * plausible for a prototype — they are not measured data or validated limits.
 */

export const SCENARIOS: ScenarioDefinition[] = [
  {
    id: "normal",
    label: "Normal ride",
    short: "Normal",
    description: "Steady city riding. Small vibrations, no events.",
    expected: "NORMAL",
    input: {
      helmetImpactG: 1.2,
      helmetWorn: true,
      bikeSpeedKmh: 42,
      speedDropKmh: 3,
      bikeRotationDps: 22,
      phoneDecelG: 0.45,
      postImpactMotion: 0.72,
      helmetLinkLost: false,
    },
    timeline: [
      { t: -10, title: "Cruising", detail: "42 km/h", tone: "neutral", device: "bike" },
      { t: 0, title: "No event detected", detail: "All signals in normal range", tone: "success", device: "system" },
    ],
    series: () =>
      buildSeries({
        seed: 11,
        speed: (t) => 42 + 3 * Math.sin(t / 3),
        helmet: (t) => 1 + 0.1 * Math.sin(t * 2.1),
        bike: (t) => 0.15 + 0.05 * Math.sin(t * 1.7),
        rotation: (t) => 12 + 8 * Math.abs(Math.sin(t / 2)),
        phone: (t) => 0.12 + 0.04 * Math.sin(t * 1.3),
      }),
  },
  {
    id: "pothole",
    label: "Pothole",
    short: "Pothole",
    description: "Sharp vertical shock at speed. The ride continues.",
    expected: "POTHOLE",
    input: {
      helmetImpactG: 7.6,
      helmetWorn: true,
      bikeSpeedKmh: 36,
      speedDropKmh: 4,
      bikeRotationDps: 72,
      phoneDecelG: 1.6,
      postImpactMotion: 0.68,
      helmetLinkLost: false,
    },
    timeline: [
      { t: -3, title: "Riding", detail: "36 km/h", tone: "neutral", device: "bike" },
      { t: 0, title: "Vertical shock", detail: "Bike 2.8 g · helmet 7.6 g", tone: "info", device: "bike" },
      { t: 2, title: "Riding continues", detail: "Logged for road-quality map", tone: "success", device: "system" },
    ],
    series: () =>
      buildSeries({
        seed: 22,
        speed: (t) => 36 - pulse(t, 0.5, 0.8, 3),
        helmet: (t) => 1 + pulse(t, 0.05, 0.06, 6.6),
        bike: (t) => 0.15 + pulse(t, 0, 0.05, 2.7),
        rotation: (t) => 14 + pulse(t, 0.05, 0.08, 58),
        phone: (t) => 0.12 + pulse(t, 0.05, 0.06, 1.45),
      }),
  },
  {
    id: "hard-brake",
    label: "Hard brake",
    short: "Hard brake",
    description: "Emergency stop from 58 km/h. Controlled, upright.",
    expected: "HARD_BRAKING",
    input: {
      helmetImpactG: 1.8,
      helmetWorn: true,
      bikeSpeedKmh: 58,
      speedDropKmh: 34,
      bikeRotationDps: 24,
      phoneDecelG: 1.35,
      postImpactMotion: 0.6,
      helmetLinkLost: false,
    },
    timeline: [
      { t: -2, title: "Riding", detail: "58 km/h", tone: "neutral", device: "bike" },
      { t: 0, title: "Hard braking", detail: "1.35 g deceleration", tone: "warning", device: "phone" },
      { t: 2.5, title: "Controlled stop", detail: "24 km/h, upright", tone: "success", device: "bike" },
    ],
    series: () =>
      buildSeries({
        seed: 33,
        speed: (t) => keyframes(t, [[-12, 57], [-0.4, 58], [2.5, 24], [10, 30]]),
        helmet: (t) => 1 + pulse(t, 0.3, 0.6, 0.7),
        bike: (t) => 0.15 + pulse(t, 0.8, 1, 0.75),
        rotation: (t) => 10 + pulse(t, 0.8, 1, 12),
        phone: (t) => 0.12 + pulse(t, 0.8, 1, 1.23),
      }),
  },
  {
    id: "helmet-drop",
    label: "Helmet drop",
    short: "Helmet drop",
    description: "Helmet falls from a second-floor ledge. Bike parked, rider walking.",
    expected: "HELMET_DROP",
    input: {
      helmetImpactG: 42,
      helmetWorn: false,
      bikeSpeedKmh: 0,
      speedDropKmh: 0,
      bikeRotationDps: 1,
      phoneDecelG: 0.1,
      postImpactMotion: 0.23,
      helmetLinkLost: false,
    },
    timeline: [
      { t: -5, title: "Helmet removed", detail: "Wear sensor: not worn", tone: "neutral", device: "helmet" },
      { t: -0.6, title: "Free fall", detail: "Helmet ≈ 0 g", tone: "info", device: "helmet" },
      { t: 0, title: "Helmet impact", detail: "42 g", tone: "warning", device: "helmet" },
      { t: 0.5, title: "Cross-check", detail: "Bike parked · phone calm", tone: "info", device: "system" },
      { t: 1, title: "Helmet drop", detail: "No emergency triggered", tone: "success", device: "system" },
    ],
    series: () =>
      buildSeries({
        seed: 44,
        speed: () => 0,
        helmet: (t) => (t > -0.62 && t < -0.02 ? 0.02 : 0.02 + (t >= 0 && t < 0.06 ? 42 : 0) + pulse(t, 0.25, 0.08, 6) + (t < -0.62 || t > 0.6 ? 1 : 0)),
        bike: () => 0.01,
        rotation: () => 0.6,
        phone: (t) => 0.06 + 0.04 * Math.abs(Math.sin(t * 2)),
        noise: { speed: 0, bike: 0.01, rotation: 0.5, helmet: 0.05 },
      }),
  },
  {
    id: "bike-fall",
    label: "Bike fall",
    short: "Bike fall",
    description: "Parked motorcycle tips over. Rider is away from the bike.",
    expected: "BIKE_FALL",
    input: {
      helmetImpactG: 0.4,
      helmetWorn: false,
      bikeSpeedKmh: 0,
      speedDropKmh: 0,
      bikeRotationDps: 168,
      phoneDecelG: 0.1,
      postImpactMotion: 0.17,
      helmetLinkLost: false,
    },
    timeline: [
      { t: -30, title: "Bike parked", detail: "Side stand, ignition off", tone: "neutral", device: "bike" },
      { t: 0, title: "Bike rotation", detail: "168 deg/s · lean 84°", tone: "warning", device: "bike" },
      { t: 1, title: "Bike fall", detail: "Rider notified · no emergency", tone: "success", device: "system" },
    ],
    series: () =>
      buildSeries({
        seed: 55,
        speed: () => 0,
        helmet: () => 0.02,
        bike: (t) => 0.02 + pulse(t, 0.6, 0.06, 3.1),
        rotation: (t) => pulse(t, 0.3, 0.25, 168),
        phone: (t) => 0.08 + 0.05 * Math.abs(Math.sin(t)),
        noise: { speed: 0, helmet: 0.01 },
      }),
  },
  {
    id: "minor",
    label: "Minor incident",
    short: "Minor",
    description: "Low-speed slip on gravel. Rider gets up and moves.",
    expected: "MINOR_INCIDENT",
    input: {
      helmetImpactG: 24,
      helmetWorn: true,
      bikeSpeedKmh: 17,
      speedDropKmh: 17,
      bikeRotationDps: 128,
      phoneDecelG: 1.9,
      postImpactMotion: 0.58,
      helmetLinkLost: false,
    },
    timeline: [
      { t: -2, title: "Slow turn", detail: "17 km/h", tone: "neutral", device: "bike" },
      { t: 0, title: "Low-speed fall", detail: "Helmet 24 g · bike 128 deg/s", tone: "warning", device: "bike" },
      { t: 4, title: "Rider moving", detail: "Check-in requested", tone: "info", device: "phone" },
    ],
    series: () =>
      buildSeries({
        seed: 66,
        speed: (t) => keyframes(t, [[-12, 18], [-0.5, 17], [0.8, 0], [10, 0]]),
        helmet: (t) => (t < 1 ? 1 : 0.6) + pulse(t, 0.1, 0.05, 23),
        bike: (t) => 0.15 + pulse(t, 0.1, 0.08, 2.2),
        rotation: (t) => 12 + pulse(t, -0.1, 0.25, 116),
        phone: (t) => (t < 1 ? 0.15 : 0.35) + pulse(t, 0.1, 0.08, 1.7),
      }),
  },
  {
    id: "severe-crash",
    label: "Severe crash",
    short: "Severe crash",
    description: "Loss of control at 52 km/h. Bike slides, rider impact, rider stationary.",
    expected: "SEVERE_CRASH",
    input: {
      helmetImpactG: 64,
      helmetWorn: true,
      bikeSpeedKmh: 52,
      speedDropKmh: 52,
      bikeRotationDps: 312,
      phoneDecelG: 3.3,
      postImpactMotion: 0.17,
      helmetLinkLost: true,
    },
    timeline: [
      { t: -12, title: "Normal riding", detail: "44 km/h", tone: "neutral", device: "bike" },
      { t: -4, title: "Braking begins", detail: "52 km/h", tone: "info", device: "bike" },
      { t: -1.2, title: "Bike rotation detected", detail: "Roll rate rising", tone: "warning", device: "bike" },
      { t: -0.3, title: "Rapid deceleration", detail: "Phone 3.3 g", tone: "warning", device: "phone" },
      { t: 0, title: "Helmet impact", detail: "64 g", tone: "critical", device: "helmet" },
      { t: 0.1, title: "Helmet connection lost", detail: "Pre-impact buffer retained on phone", tone: "critical", device: "helmet" },
      { t: 5, title: "Rider movement low", detail: "Movement index 17 %", tone: "warning", device: "phone" },
      { t: 10, title: "No rider response", detail: "Emergency workflow (simulated)", tone: "critical", device: "system" },
    ],
    series: () =>
      buildSeries({
        seed: 77,
        speed: (t) => keyframes(t, [[-12, 44], [-5, 52], [-4, 52], [-1.2, 41], [-0.3, 33], [0.3, 9], [1.5, 0], [10, 0]]),
        helmet: (t) => {
          if (t > 0.1) return null; // helmet electronics lost
          return 1 + (t >= -0.02 && t <= 0.02 ? 63 : 0) + pulse(t, -0.3, 0.15, 1.6);
        },
        bike: (t) => {
          const base = t > 1.5 ? 0.02 : 0.18;
          return base + (t > -4 && t < -1.2 ? 0.3 : 0) + pulse(t, -0.6, 0.35, 1.2) + pulse(t, -0.1, 0.12, 5.4);
        },
        rotation: (t) => {
          const base = t > 1.5 ? 0.5 : 12;
          return base + pulse(t, -0.25, 0.45, 300);
        },
        phone: (t) => {
          const base = t > 1.5 ? 0.03 : 0.14;
          return base + pulse(t, -0.05, 0.18, 3.15);
        },
        noise: { helmet: 0.1, bike: 0.06, rotation: 4, phone: 0.03 },
      }),
  },
];

export const SCENARIO_MAP: Record<string, ScenarioDefinition> = Object.fromEntries(
  SCENARIOS.map((s) => [s.id, s]),
);

export function getScenario(id: string): ScenarioDefinition | undefined {
  return SCENARIO_MAP[id];
}

/** Severe crash with the helmet destroyed before its impact packet arrived. */
export const SEVERE_CRASH_NO_HELMET = {
  ...SCENARIO_MAP["severe-crash"].input,
  helmetImpactG: null,
};

import type { RideEvent } from "@/lib/types/events";

/**
 * A history entry. Extends the shared `RideEvent` contract with optional,
 * history-only fields, so it can be passed anywhere a `RideEvent` is expected.
 */
export interface HistoryEntry extends RideEvent {
  /** Rides only: top speed reported by the bike module, km/h (simulated). */
  maxSpeedKmh?: number;
  /** Safety events only: id of the ride the event was recorded on, if any. */
  rideId?: string;
}

/** SIMULATED ride and event history for the prototype. Newest first. */
export const RIDE_HISTORY: HistoryEntry[] = [
  {
    id: "evt-1042",
    kind: "event",
    title: "Severe Crash Simulation",
    subtitle: "Emergency workflow demonstrated",
    occurredAt: "2026-10-04T14:12:18Z",
    scenarioId: "severe-crash",
    risk: "high",
    simulated: true,
    locationLabel: "Outer Ring Road, Bengaluru",
    outcome: "Rider did not respond · emergency workflow (simulated)",
  },
  {
    id: "evt-1041",
    kind: "event",
    title: "Helmet Drop",
    subtitle: "False trigger rejected",
    occurredAt: "2026-10-04T09:03:40Z",
    scenarioId: "helmet-drop",
    risk: "none",
    simulated: true,
    locationLabel: "Home parking, Koramangala",
    outcome: "No emergency · helmet inspection suggested",
  },
  {
    id: "ride-1040",
    kind: "ride",
    title: "Normal Ride",
    subtitle: "Home → Office",
    occurredAt: "2026-10-03T03:45:00Z",
    scenarioId: "normal",
    distanceKm: 12.6,
    durationMin: 31,
    maxSpeedKmh: 58,
    risk: "none",
    simulated: true,
    locationLabel: "Koramangala → Bellandur",
    outcome: "No events",
  },
  {
    id: "evt-1039",
    kind: "event",
    title: "Hard Brake",
    subtitle: "Low risk",
    occurredAt: "2026-10-02T12:21:09Z",
    scenarioId: "hard-brake",
    risk: "low",
    simulated: true,
    locationLabel: "Sarjapur Road",
    outcome: "Logged · no action",
    rideId: "ride-1044",
  },
  {
    id: "ride-1044",
    kind: "ride",
    title: "Commute Ride",
    subtitle: "Office → Home",
    occurredAt: "2026-10-02T12:05:00Z",
    scenarioId: "normal",
    distanceKm: 13.4,
    durationMin: 38,
    maxSpeedKmh: 61,
    risk: "low",
    simulated: true,
    locationLabel: "Bellandur → Koramangala",
    outcome: "1 safety event · hard brake logged",
  },
  {
    id: "evt-1038",
    kind: "event",
    title: "Pothole",
    subtitle: "Road shock logged",
    occurredAt: "2026-10-01T13:02:51Z",
    scenarioId: "pothole",
    risk: "low",
    simulated: true,
    locationLabel: "HSR Layout, 27th Main",
    outcome: "Logged for road-quality map",
  },
  {
    id: "evt-1043",
    kind: "event",
    title: "Low-Speed Slip",
    subtitle: "Rider check-in",
    occurredAt: "2026-09-30T11:48:27Z",
    scenarioId: "minor",
    risk: "medium",
    simulated: true,
    locationLabel: "Bannerghatta Road, gravel patch",
    outcome: "Rider responded “I’m okay” · no escalation",
  },
  {
    id: "evt-1037",
    kind: "event",
    title: "Parked Bike Fall",
    subtitle: "Rider notified",
    occurredAt: "2026-09-29T17:40:12Z",
    scenarioId: "bike-fall",
    risk: "low",
    simulated: true,
    locationLabel: "Office basement P2",
    outcome: "Notification only · no emergency",
  },
  {
    id: "ride-1036",
    kind: "ride",
    title: "Normal Ride",
    subtitle: "Weekend ride",
    occurredAt: "2026-09-28T01:10:00Z",
    scenarioId: "normal",
    distanceKm: 48.2,
    durationMin: 82,
    maxSpeedKmh: 84,
    risk: "none",
    simulated: true,
    locationLabel: "Bengaluru → Nandi Hills",
    outcome: "No events",
  },
];

export function getRideEvent(id: string): HistoryEntry | undefined {
  return RIDE_HISTORY.find((e) => e.id === id);
}

/** Safety events recorded during the given ride, newest first. */
export function getEventsForRide(rideId: string): HistoryEntry[] {
  return RIDE_HISTORY.filter((e) => e.kind === "event" && e.rideId === rideId);
}

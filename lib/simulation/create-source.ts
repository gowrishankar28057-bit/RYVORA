import { SimulatedTelemetrySource, type TelemetrySource } from "./telemetry-source";
import { WebBluetoothTelemetrySource } from "./web-bluetooth-source";

/** Source kinds that have an implementation in this build. */
export type AvailableSourceKind = "simulated" | "web-bluetooth";

/**
 * Normalise a configured source name. Anything unknown — including the planned
 * "native-bridge" — falls back to the simulator so the app always works.
 */
export function resolveTelemetrySourceKind(value: string | null | undefined): AvailableSourceKind {
  return value?.trim().toLowerCase() === "web-bluetooth" ? "web-bluetooth" : "simulated";
}

/**
 * Create the telemetry source for this build.
 *
 * Reads `NEXT_PUBLIC_TELEMETRY_SOURCE` by default ("simulated" | "web-bluetooth").
 * Next inlines `NEXT_PUBLIC_*` at build time, so server and client agree.
 */
export function createTelemetrySource(
  kind: string | null | undefined = process.env.NEXT_PUBLIC_TELEMETRY_SOURCE,
): TelemetrySource {
  switch (resolveTelemetrySourceKind(kind)) {
    case "web-bluetooth":
      return new WebBluetoothTelemetrySource();
    case "simulated":
      return new SimulatedTelemetrySource();
  }
}

"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { SystemSnapshot, TelemetrySample } from "../types/telemetry";
import { HEALTHY_STATE, type SimulatedDeviceState } from "../simulation/device-state";
import { SimulatedTelemetrySource } from "../simulation/telemetry-source";
import { evaluateReadiness, type Readiness } from "../engine/readiness";

interface RideState {
  active: boolean;
  startedAt: number | null;
  /** Rolling buffer of live samples (the phone's black-box window). */
  buffer: TelemetrySample[];
}

interface TelemetryContextValue {
  snapshot: SystemSnapshot;
  readiness: Readiness;
  device: SimulatedDeviceState;
  setDevice: (patch: Partial<SimulatedDeviceState>) => void;
  resetDevices: () => void;
  ride: RideState;
  startRide: () => void;
  endRide: () => void;
  simulatorOpen: boolean;
  setSimulatorOpen: (open: boolean) => void;
}

const TelemetryContext = createContext<TelemetryContextValue | null>(null);

const BUFFER_SAMPLES = 8 * 30; // 30 s at 8 Hz
const IDLE_RIDE: RideState = { active: false, startedAt: null, buffer: [] };

export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  const [source] = useState(() => new SimulatedTelemetrySource());
  const [snapshot, setSnapshot] = useState<SystemSnapshot>(() => source.getSnapshot());
  const [device, setDeviceState] = useState<SimulatedDeviceState>(HEALTHY_STATE);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [ride, setRide] = useState<RideState>(IDLE_RIDE);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    const unsubscribe = source.subscribe((s) => {
      setSnapshot(s);
      const startedAt = startedAtRef.current;
      if (startedAt === null) return;
      const sample: TelemetrySample = {
        t: (Date.now() - startedAt) / 1000,
        speedKmh: s.bike.speedKmh,
        helmetAccelG: s.helmet.accelG,
        bikeAccelG: s.bike.accelG,
        angularRateDps: s.bike.angularRateDps,
        phoneAccelG: s.phone.accelG,
      };
      setRide((r) => (r.active ? { ...r, buffer: [...r.buffer.slice(-BUFFER_SAMPLES + 1), sample] } : r));
    });
    return () => {
      unsubscribe();
      source.dispose();
    };
  }, [source]);

  useEffect(() => {
    source.setDeviceState(device);
  }, [device, source]);

  const readiness = useMemo(() => evaluateReadiness(snapshot), [snapshot]);

  const value = useMemo<TelemetryContextValue>(
    () => ({
      snapshot,
      readiness,
      device,
      setDevice: (patch) => setDeviceState((d) => ({ ...d, ...patch })),
      resetDevices: () => setDeviceState(HEALTHY_STATE),
      ride,
      startRide: () => {
        const now = Date.now();
        startedAtRef.current = now;
        setRide({ active: true, startedAt: now, buffer: [] });
        source.setRiding(true);
      },
      endRide: () => {
        startedAtRef.current = null;
        setRide(IDLE_RIDE);
        source.setRiding(false);
      },
      simulatorOpen,
      setSimulatorOpen,
    }),
    [snapshot, readiness, device, ride, simulatorOpen, source],
  );

  return <TelemetryContext.Provider value={value}>{children}</TelemetryContext.Provider>;
}

export function useTelemetry(): TelemetryContextValue {
  const ctx = useContext(TelemetryContext);
  if (!ctx) throw new Error("useTelemetry must be used inside <TelemetryProvider>");
  return ctx;
}

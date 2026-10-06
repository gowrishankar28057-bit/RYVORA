"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { SystemSnapshot, TelemetrySample } from "../types/telemetry";
import { HEALTHY_STATE, type SimulatedDeviceState } from "../simulation/device-state";
import { foldLastSeen, NEVER_SEEN, supportsFaultInjection, type LastSeen, type TelemetrySource } from "../simulation/telemetry-source";
import { createTelemetrySource } from "../simulation/create-source";
import { evaluateReadiness, type Readiness } from "../engine/readiness";

export type { LastSeen } from "../simulation/telemetry-source";

interface RideState {
  active: boolean;
  startedAt: number | null;
  /** Rolling buffer of live samples (the phone's black-box window). */
  buffer: TelemetrySample[];
}

interface TelemetryContextValue {
  snapshot: SystemSnapshot;
  readiness: Readiness;
  /** Newest packet per device + last GPS fix; survives disconnection. */
  lastSeen: LastSeen;
  /** False when the configured source is real hardware — simulator switches are then no-ops. */
  simulatorAvailable: boolean;
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

interface Feed {
  snapshot: SystemSnapshot;
  lastSeen: LastSeen;
}

export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  const [source] = useState<TelemetrySource>(() => createTelemetrySource());
  const simulatorAvailable = supportsFaultInjection(source);
  const [feed, setFeed] = useState<Feed>(() => ({ snapshot: source.getSnapshot(), lastSeen: NEVER_SEEN }));
  const [device, setDeviceSwitches] = useState<SimulatedDeviceState>(HEALTHY_STATE);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [ride, setRide] = useState<RideState>(IDLE_RIDE);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    const unsubscribe = source.subscribe((s) => {
      setFeed((prev) => ({ snapshot: s, lastSeen: foldLastSeen(prev.lastSeen, s) }));
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
    if (supportsFaultInjection(source)) source.setDeviceState(device);
  }, [device, source]);

  const setDevice = useCallback(
    (patch: Partial<SimulatedDeviceState>) => {
      if (simulatorAvailable) setDeviceSwitches((d) => ({ ...d, ...patch }));
    },
    [simulatorAvailable],
  );

  const resetDevices = useCallback(() => {
    if (simulatorAvailable) setDeviceSwitches(HEALTHY_STATE);
  }, [simulatorAvailable]);

  const startRide = useCallback(() => {
    const now = Date.now();
    startedAtRef.current = now;
    setRide({ active: true, startedAt: now, buffer: [] });
    source.setRiding(true);
  }, [source]);

  const endRide = useCallback(() => {
    startedAtRef.current = null;
    setRide(IDLE_RIDE);
    source.setRiding(false);
  }, [source]);

  const { snapshot, lastSeen } = feed;
  const readiness = useMemo(() => evaluateReadiness(snapshot), [snapshot]);

  const value = useMemo<TelemetryContextValue>(
    () => ({
      snapshot,
      readiness,
      lastSeen,
      simulatorAvailable,
      device,
      setDevice,
      resetDevices,
      ride,
      startRide,
      endRide,
      simulatorOpen,
      setSimulatorOpen,
    }),
    [snapshot, readiness, lastSeen, simulatorAvailable, device, setDevice, resetDevices, ride, startRide, endRide, simulatorOpen],
  );

  return <TelemetryContext.Provider value={value}>{children}</TelemetryContext.Provider>;
}

export function useTelemetry(): TelemetryContextValue {
  const ctx = useContext(TelemetryContext);
  if (!ctx) throw new Error("useTelemetry must be used inside <TelemetryProvider>");
  return ctx;
}

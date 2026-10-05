"use client";

import { useEffect, useRef } from "react";
import { RotateCcw, X } from "lucide-react";
import { Button, SimLabel, Toggle } from "@/components/ui/primitives";
import { useTelemetry } from "@/lib/telemetry/telemetry-provider";
import type { SimulatedDeviceState } from "@/lib/simulation/device-state";

const GROUPS: { title: string; items: { key: keyof SimulatedDeviceState; label: string; description: string; invert?: boolean }[] }[] = [
  {
    title: "Smart helmet",
    items: [
      { key: "helmetConnected", label: "Helmet connected", description: "BLE link to phone" },
      { key: "helmetWorn", label: "Helmet worn", description: "Wear sensor" },
      { key: "buckleSecured", label: "Buckle secured", description: "Chin-strap switch" },
      { key: "helmetImuFault", label: "Helmet IMU fault", description: "Simulate sensor error", invert: true },
      { key: "helmetBatteryLow", label: "Helmet battery low", description: "12 %", invert: true },
    ],
  },
  {
    title: "Bike module",
    items: [
      { key: "bikeConnected", label: "Bike module connected", description: "ESP32 module link" },
      { key: "bikeImuFault", label: "Bike IMU fault", description: "Simulate sensor error", invert: true },
    ],
  },
  {
    title: "Phone",
    items: [
      { key: "phoneBluetooth", label: "Bluetooth on", description: "Off disconnects helmet + bike" },
      { key: "gpsAvailable", label: "Location available", description: "GPS fix" },
      { key: "phoneSensors", label: "Motion sensors", description: "Accelerometer / gyroscope" },
    ],
  },
];

export function SimulatorPanel() {
  const { simulatorOpen, setSimulatorOpen, device, setDevice, resetDevices } = useTelemetry();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!simulatorOpen) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSimulatorOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [simulatorOpen, setSimulatorOpen]);

  if (!simulatorOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="sim-title">
      <button
        type="button"
        aria-label="Close simulator"
        className="absolute inset-0 bg-navy/30 backdrop-blur-[2px]"
        onClick={() => setSimulatorOpen(false)}
      />
      <div className="relative flex h-full w-full max-w-sm flex-col bg-white shadow-[var(--shadow-lift)] animate-fade-up">
        <div className="flex items-start justify-between border-b border-line p-5">
          <div>
            <SimLabel>Simulator</SimLabel>
            <h2 id="sim-title" className="mt-2 text-lg font-bold">
              Hardware simulator
            </h2>
            <p className="mt-1 text-sm text-muted">
              Stand-in for the real helmet, bike module and phone sensors. Flip switches to test every failure state.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setSimulatorOpen(false)}
            aria-label="Close"
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-line text-navy"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {GROUPS.map((g) => (
            <fieldset key={g.title}>
              <legend className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{g.title}</legend>
              <div className="divide-y divide-line-soft">
                {g.items.map((it) => (
                  <Toggle
                    key={it.key}
                    id={`sim-${it.key}`}
                    label={it.label}
                    description={it.description}
                    checked={device[it.key]}
                    onChange={(v) => setDevice({ [it.key]: v })}
                  />
                ))}
              </div>
            </fieldset>
          ))}
        </div>
        <div className="border-t border-line p-5">
          <Button variant="secondary" className="w-full" onClick={resetDevices}>
            <RotateCcw className="size-4" aria-hidden /> Reset to healthy
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { RotateCcw, Timer } from "lucide-react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Badge, Card, CardHeader, SimLabel, Toggle } from "@/components/ui/primitives";
import { resetSafetySettings, RIDER_CHECK_OPTIONS, updateSafetySettings, useSafetySettings } from "./safety-settings";

/** Per-device safety preferences, persisted to localStorage. */
export function SafetySettingsCard() {
  const settings = useSafetySettings();
  const [announcement, setAnnouncement] = useState("");

  function setCountdown(v: string) {
    const seconds = RIDER_CHECK_OPTIONS.find((o) => String(o) === v);
    if (!seconds) return;
    updateSafetySettings({ riderCheckSeconds: seconds });
    setAnnouncement(`Rider-check countdown set to ${seconds} seconds.`);
  }

  function setEscalation(on: boolean) {
    updateSafetySettings({ autoEscalation: on });
    setAnnouncement(`Automatic escalation ${on ? "on" : "off"}.`);
  }

  function reset() {
    resetSafetySettings();
    setAnnouncement("Safety settings reset to defaults.");
  }

  return (
    <Card className="p-5">
      <CardHeader kicker="Preferences" title="Safety settings" action={<SimLabel>Demo</SimLabel>} />

      <div className="mt-4">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
            <Timer className="size-[18px]" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-navy">Rider-check countdown</p>
            <p className="text-xs text-muted">Time to answer “Are you okay?” before the simulated emergency workflow starts.</p>
          </div>
        </div>
        <SegmentedControl
          label="Rider-check countdown"
          value={String(settings.riderCheckSeconds)}
          onChange={setCountdown}
          options={RIDER_CHECK_OPTIONS.map((s) => ({ value: String(s), label: `${s} s` }))}
          className="mt-3 w-full"
        />
      </div>

      <div className="mt-4 border-t border-line-soft pt-2">
        <Toggle
          id="auto-escalation"
          checked={settings.autoEscalation}
          onChange={setEscalation}
          label="Automatic escalation (demo)"
          description={
            settings.autoEscalation
              ? "No response starts the simulated emergency workflow."
              : "Rider check still runs; escalation only on “Need help”."
          }
        />
      </div>

      <div className="flex min-h-12 items-center justify-between gap-4 border-t border-line-soft py-1.5">
        <div>
          <p className="text-sm font-semibold text-navy">Speed units</p>
          <p className="text-xs text-muted">Metric only in this prototype</p>
        </div>
        <Badge tone="info">km/h</Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-3">
        <p className="text-xs text-muted">
          Saved on this device only; nothing is uploaded. Used by the rider check in Live ride and the Safety lab. Jury Mode keeps
          its scripted 10 s countdown.
        </p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-navy hover:bg-brand-50"
        >
          <RotateCcw className="size-4" aria-hidden /> Reset to defaults
        </button>
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </Card>
  );
}

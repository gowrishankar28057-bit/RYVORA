"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { EmergencyWorkflow } from "./emergency-workflow";
import { RiderCheckScreen } from "./rider-check";

type Phase = "check" | "ok" | "escalated";

/**
 * Full-screen severe-crash response flow:
 * rider check countdown → (no response | NEED HELP) → emergency workflow.
 */
export function IncidentOverlay({
  confidencePct,
  countdownSec = 15,
  locationAvailable = true,
  onClose,
}: {
  confidencePct: number;
  countdownSec?: number;
  locationAvailable?: boolean;
  onClose: () => void;
}) {
  const [choice, setChoice] = useState<"pending" | "ok" | "help">("pending");
  const [elapsed, setElapsed] = useState(0);
  const [completed, setCompleted] = useState(0);
  const phase: Phase =
    choice === "ok" ? "ok" : choice === "help" || elapsed >= countdownSec ? "escalated" : "check";
  const remaining = Math.max(0, countdownSec - elapsed);

  useEffect(() => {
    if (phase !== "check") return;
    const id = setInterval(() => setElapsed((e) => e + 0.25), 250);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "escalated" || completed >= 3) return;
    const id = setTimeout(() => setCompleted((c) => c + 1), 900);
    return () => clearTimeout(id);
  }, [phase, completed]);

  return (
    <div className="fixed inset-0 z-[60] flex items-stretch justify-center bg-navy/50 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="relative flex w-full max-w-md flex-col overflow-hidden bg-white shadow-[var(--shadow-lift)] sm:max-h-[860px] sm:rounded-[32px]">
        {phase !== "check" && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 z-10 grid size-10 place-items-center rounded-xl bg-white/90 text-navy shadow"
          >
            <X className="size-4" />
          </button>
        )}
        {phase === "check" && (
          <RiderCheckScreen
            remaining={remaining}
            total={countdownSec}
            confidencePct={confidencePct}
            onOk={() => setChoice("ok")}
            onHelp={() => setChoice("help")}
          />
        )}
        {phase === "escalated" && (
          <div className="flex h-full flex-col overflow-y-auto">
            <EmergencyWorkflow completed={completed} locationAvailable={locationAvailable} />
            <div className="px-5 pb-6">
              <Button variant="secondary" className="w-full" onClick={onClose}>
                End simulation
              </Button>
            </div>
          </div>
        )}
        {phase === "ok" && (
          <div className="flex flex-col items-center px-6 py-14 text-center" role="status">
            <CheckCircle2 className="size-14 text-ok" aria-hidden />
            <h2 className="mt-4 text-2xl font-extrabold">Alert cancelled</h2>
            <p className="mt-2 text-sm text-body">
              Rider confirmed they are okay. The event is saved to the black box for review.
            </p>
            <Button className="mt-6 w-full" onClick={onClose}>
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

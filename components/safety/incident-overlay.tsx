"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, PhoneCall, TimerOff, X } from "lucide-react";
import { Button, SimLabel } from "@/components/ui/primitives";
import { EmergencyWorkflow, type LocationAttachment } from "./emergency-workflow";
import { RiderCheckScreen } from "./rider-check";

type Phase = "check" | "unanswered" | "ok" | "escalated";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Full-screen severe-crash response flow:
 * rider check countdown → (no response | NEED HELP) → emergency workflow.
 *
 * Modal behaviour: focus moves to "I'M OKAY" on open, Tab stays inside the
 * overlay, the page behind does not scroll, and focus returns to the element
 * that opened it. Escape is never treated as a rider response — it only closes
 * the overlay once the rider check is over.
 */
export function IncidentOverlay({
  confidencePct,
  countdownSec = 15,
  autoEscalate = true,
  locationAvailable = true,
  location,
  onClose,
}: {
  confidencePct: number;
  countdownSec?: number;
  /** When false, an unanswered rider check waits for NEED HELP instead of escalating (Profile → Safety settings). */
  autoEscalate?: boolean;
  locationAvailable?: boolean;
  /** Location captured from telemetry at the moment of the incident. */
  location?: LocationAttachment;
  onClose: () => void;
}) {
  const [choice, setChoice] = useState<"pending" | "ok" | "help">("pending");
  const [elapsed, setElapsed] = useState(0);
  const [completed, setCompleted] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const expired = elapsed >= countdownSec;
  const phase: Phase =
    choice === "ok" ? "ok" : choice === "help" ? "escalated" : expired ? (autoEscalate ? "escalated" : "unanswered") : "check";
  const remaining = Math.max(0, countdownSec - elapsed);
  const closable = phase !== "check";

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

  // Lock page scroll and restore focus to the opener when the overlay closes.
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      opener?.focus({ preventScroll: true });
    };
  }, []);

  // Move focus to the primary control of each phase.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const target = panel.querySelector<HTMLElement>("[data-autofocus]") ?? panel;
    target.focus({ preventScroll: phase === "escalated" });
  }, [phase]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      if (closable) {
        e.stopPropagation();
        onClose();
      }
      return;
    }
    if (e.key !== "Tab") return;
    const panel = panelRef.current;
    if (!panel) return;
    const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null || el === document.activeElement);
    if (items.length === 0) {
      e.preventDefault();
      panel.focus();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === panel)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const dialogProps =
    phase === "check"
      ? {} // RiderCheckScreen renders its own modal alertdialog.
      : {
          role: "dialog" as const,
          "aria-modal": true,
          "aria-labelledby": phase === "ok" ? "incident-ok-title" : phase === "unanswered" ? "incident-unanswered-title" : undefined,
          "aria-label": phase === "escalated" ? "Emergency response (simulated)" : undefined,
        };

  return (
    <div className="fixed inset-0 z-[60] flex items-stretch justify-center bg-navy/50 backdrop-blur-sm sm:items-center sm:p-6">
      <div
        ref={panelRef}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        {...dialogProps}
        className="relative flex w-full max-w-md flex-col overflow-hidden bg-white shadow-[var(--shadow-lift)] focus-visible:outline-none sm:max-h-[860px] sm:rounded-[32px]"
      >
        {closable && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 z-10 grid size-11 place-items-center rounded-xl bg-white/90 text-navy shadow"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
        {phase === "check" && (
          <RiderCheckScreen
            modal
            autoEscalate={autoEscalate}
            remaining={remaining}
            total={countdownSec}
            confidencePct={confidencePct}
            onOk={() => setChoice("ok")}
            onHelp={() => setChoice("help")}
          />
        )}
        {phase === "unanswered" && (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-warn-bg text-warn">
              <TimerOff className="size-7" aria-hidden />
            </span>
            <h2 id="incident-unanswered-title" className="mt-4 text-2xl font-extrabold">
              No response
            </h2>
            <p className="mt-2 text-sm text-body" role="status">
              Automatic escalation is off in your safety settings, so RYVORA is waiting for you. Tap NEED HELP to start the
              simulated emergency workflow.
            </p>
            <div className="mt-6 grid w-full gap-3">
              <Button variant="danger" size="lg" className="w-full" onClick={() => setChoice("help")} data-autofocus>
                <PhoneCall className="size-5" aria-hidden /> NEED HELP
              </Button>
              <Button variant="secondary" size="lg" className="w-full" onClick={() => setChoice("ok")}>
                I’m okay
              </Button>
            </div>
            <p className="mt-4">
              <SimLabel>Demo setting</SimLabel>
            </p>
          </div>
        )}
        {phase === "escalated" && (
          <div className="flex h-full flex-col overflow-y-auto">
            <EmergencyWorkflow completed={completed} locationAvailable={locationAvailable} location={location} />
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
            <h2 id="incident-ok-title" className="mt-4 text-2xl font-extrabold">
              Alert cancelled
            </h2>
            <p className="mt-2 text-sm text-body">
              Rider confirmed they are okay. The event is saved to the black box for review.
            </p>
            <Button className="mt-6 w-full" onClick={onClose} data-autofocus>
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

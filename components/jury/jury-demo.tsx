"use client";

import Link from "next/link";
import { useEffect, useReducer } from "react";
import { Logo } from "@/components/brand/logo";
import { DemoControls, KeyboardHint } from "@/components/jury/demo-controls";
import { IntroScreen } from "@/components/jury/intro-screen";
import { StepRail } from "@/components/jury/step-rail";
import { StepView } from "@/components/jury/step-view";
import { SimLabel } from "@/components/ui/primitives";
import { currentStep, demoElapsedMs, demoReducer, INITIAL_DEMO_STATE, type DemoAction } from "@/lib/jury/demo-machine";
import { TOTAL_MS } from "@/lib/jury/demo-script";
import { announcement } from "@/lib/jury/timeline";

/** Clock resolution. Every frame is derived from elapsed time, so this only affects smoothness. */
const TICK_MS = 50;

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || target.closest("input, textarea, select, [contenteditable='true']") !== null;
}

/** Space on a focused button/link should activate that control, not toggle playback. */
function isActivatable(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest("button, a[href], summary, [role='button'], [role='switch']") !== null;
}

/**
 * Jury Mode: the whole product in ~2 minutes.
 * State lives in a pure reducer (lib/jury/demo-machine); this component only
 * owns the clock, the keyboard shortcuts and the layout.
 */
export function JuryDemo() {
  const [state, dispatch] = useReducer(demoReducer, INITIAL_DEMO_STATE);
  const playing = state.status === "playing";

  // The clock: advance inside the timer callback, never during render.
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      dispatch({ type: "tick", dt: now - last });
      last = now;
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [playing]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.repeat || e.altKey || e.ctrlKey || e.metaKey || isTypingTarget(e.target)) return;
      let action: DemoAction | null = null;
      if (e.key === " " || e.key === "Spacebar") action = isActivatable(e.target) ? null : { type: "toggle" };
      else if (e.key === "ArrowRight") action = { type: "skip" };
      else if (e.key === "ArrowLeft") action = { type: "prev" };
      else if (e.key === "r" || e.key === "R") action = { type: "reset" };
      if (!action) return;
      e.preventDefault();
      dispatch(action);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const step = currentStep(state);

  return (
    <div className="min-h-dvh overflow-x-clip bg-surface">
      <header className="z-30 border-b border-line bg-white/95 backdrop-blur lg:sticky lg:top-0">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pb-2 pt-3">
            <Link href="/" aria-label="RYVORA home" className="rounded-lg">
              <Logo />
            </Link>
            <span className="rounded-md bg-navy px-2 py-1 text-[11px] font-bold tracking-[0.16em] text-white">JURY MODE</span>
            <SimLabel>Simulated hardware data</SimLabel>
            <DemoControls
              className="w-full lg:ml-auto lg:w-auto"
              status={state.status}
              elapsedMs={demoElapsedMs(state)}
              totalMs={TOTAL_MS}
              onToggle={() => dispatch({ type: "toggle" })}
              onPrev={() => dispatch({ type: "prev" })}
              onSkip={() => dispatch({ type: "skip" })}
              onReset={() => dispatch({ type: "reset" })}
            />
          </div>
          <StepRail state={state} onJump={(index) => dispatch({ type: "jumpTo", index })} />
          <KeyboardHint className="hidden pb-2 lg:flex" />
        </div>
      </header>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement(state)}
      </p>

      <main id="main" className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:py-8">
        {state.status === "idle" ? (
          <IntroScreen onStart={() => dispatch({ type: "start" })} />
        ) : (
          <div key={step.id} className="motion-safe:animate-fade-up">
            <StepView state={state} dispatch={dispatch} />
          </div>
        )}
      </main>
    </div>
  );
}

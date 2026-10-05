"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { StatusCard } from "@/components/dashboard/status-card";
import { PrecheckList, StartPermission } from "@/components/precheck/precheck-list";
import { ReconstructionView } from "@/components/reconstruction/reconstruction-view";
import { RideHud } from "@/components/ride/ride-hud";
import { CrashConfidencePanel, VerdictCard } from "@/components/safety/crash-confidence-panel";
import { EmergencyWorkflow } from "@/components/safety/emergency-workflow";
import { FailSafeSequence } from "@/components/safety/failsafe-sequence";
import { RiderCheckScreen } from "@/components/safety/rider-check";
import { Button, SimLabel } from "@/components/ui/primitives";
import { assessEvent, confidencePct } from "@/lib/engine/crash-confidence";
import { evaluateReadiness } from "@/lib/engine/readiness";
import { buildSnapshot, HEALTHY_STATE } from "@/lib/simulation/device-state";
import { SCENARIO_MAP } from "@/lib/simulation/scenarios";

const STEPS = [
  { title: "Pre-ride safety failure", caption: "Helmet not worn → start permission blocked.", ms: 10000 },
  { title: "Helmet worn & buckled", caption: "All checks pass → system ready.", ms: 9000 },
  { title: "Ride starts", caption: "Helmet, bike and phone stream synchronized telemetry.", ms: 9000 },
  { title: "Helmet drop", caption: "High helmet impact — but not worn, bike parked, phone calm.", ms: 12000 },
  { title: "Severe crash", caption: "Synchronized sensor changes across all three devices.", ms: 12000 },
  { title: "Rider response", caption: "No response. Countdown completes.", ms: 10000 },
  { title: "Emergency workflow", caption: "Simulated escalation through the phone.", ms: 8000 },
  { title: "Fail-safe", caption: "Helmet connection lost — phone + bike continue response.", ms: 9000 },
  { title: "Crash reconstruction", caption: "Black-box timeline, sensor graphs, AI explanation.", ms: 16000 },
];

const blocked = buildSnapshot({ ...HEALTHY_STATE, helmetWorn: false, buckleSecured: false }, 1);
const ready = buildSnapshot(HEALTHY_STATE, 1);
const drop = assessEvent(SCENARIO_MAP["helmet-drop"].input);
const crash = assessEvent(SCENARIO_MAP["severe-crash"].input);

function rideSnapshot(t: number) {
  const speed = 44 + 6 * Math.sin(t / 2);
  return buildSnapshot(HEALTHY_STATE, 1, { speedKmh: speed, helmetAccelG: 1.05, bikeAccelG: 0.2, angularRateDps: 12, phoneAccelG: 0.15, leanDeg: 0 });
}
function streams(t: number, spike = false) {
  const n = 40;
  const f = (base: number, amp: number, k: number) => Array.from({ length: n }, (_, i) => base + amp * Math.abs(Math.sin((t * 8 + i) / k)) + (spike && i > n - 4 ? base * 6 : 0));
  return { helmet: f(1, 0.15, 3), bike: f(0.18, 0.1, 4), phone: f(0.14, 0.06, 5) };
}

export function JuryDemo() {
  const [step, setStep] = useState(-1); // -1 idle, STEPS.length = finale
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);

  const next = useCallback(() => { setStep((s) => Math.min(STEPS.length, s + 1)); setElapsed(0); }, []);
  const reset = useCallback(() => { setStep(-1); setElapsed(0); setPlaying(false); }, []);
  const start = useCallback(() => { if (step === -1 || step === STEPS.length) { setStep(0); setElapsed(0); } setPlaying((p) => !(p && step >= 0 && step < STEPS.length)); }, [step]);

  useEffect(() => {
    if (!playing || step < 0 || step >= STEPS.length) return;
    const id = setInterval(() => setElapsed((e) => e + 100), 100);
    return () => clearInterval(id);
  }, [playing, step]);

  if (step >= 0 && step < STEPS.length && elapsed >= STEPS[step].ms) next();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " ") { e.preventDefault(); start(); }
      if (e.key === "ArrowRight") next();
      if (e.key.toLowerCase() === "r") reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [start, next, reset]);

  const t = elapsed / 1000;
  const p = step >= 0 && step < STEPS.length ? elapsed / STEPS[step].ms : 0;

  let phone: React.ReactNode = null;
  let side: React.ReactNode = null;
  switch (step) {
    case 0:
      phone = <div className="p-3"><StatusCard readiness={evaluateReadiness(blocked)} snapshot={blocked} action={<StartPermission enabled={false} compact />} /></div>;
      side = <StartPermission enabled={false} />;
      break;
    case 1: {
      const r = evaluateReadiness(ready);
      const revealed = Math.min(r.checks.length, Math.floor(t / 0.5));
      phone = <div className="space-y-3 p-3"><PrecheckList checks={r.checks} revealed={revealed} />{revealed >= r.checks.length && <p className="text-center font-[family-name:var(--font-display)] text-lg font-extrabold text-ok">ALL SYSTEMS READY</p>}</div>;
      side = <StartPermission enabled={revealed >= r.checks.length} />;
      break;
    }
    case 2:
      phone = <div className="p-3"><RideHud compact snapshot={rideSnapshot(t)} durationSec={t} streams={streams(t)} /></div>;
      side = <p className="text-lg text-body">RYVORA is monitoring the ride. The phone keeps a <b className="text-navy">30-second rolling pre-crash buffer</b> from all three devices.</p>;
      break;
    case 3:
      phone = <div className="p-3">{t < 4 ? <RideHud compact snapshot={buildSnapshot({ ...HEALTHY_STATE, helmetWorn: false }, 1)} durationSec={0} streams={streams(t, t > 2)} message="Helmet impact detected — verifying…" /> : <VerdictCard assessment={drop} compact />}</div>;
      side = <CrashConfidencePanel assessment={drop} revealed={Math.floor(t / 0.4)} showRanking={false} />;
      break;
    case 4:
      phone = <div className="p-3">{t < 5 ? <RideHud compact snapshot={rideSnapshot(t)} durationSec={312 + t} streams={streams(t, t > 2.5)} message="Impact on all devices — verifying…" /> : <VerdictCard assessment={crash} compact />}</div>;
      side = <CrashConfidencePanel assessment={crash} revealed={Math.floor(t / 0.5)} showRanking={false} />;
      break;
    case 5:
      phone = <RiderCheckScreen remaining={Math.max(0, 10 - t)} total={10} confidencePct={confidencePct(crash)} onOk={() => setPlaying(false)} onHelp={next} />;
      side = <p className="text-lg text-body">Escalation policy: if the rider does not respond, the phone starts the emergency workflow. <span className="text-muted">(Countdown shortened for the demo.)</span></p>;
      break;
    case 6:
      phone = <EmergencyWorkflow completed={Math.min(3, Math.floor(t / 1.6) + 1)} />;
      side = <p className="text-lg text-body">Emergency contact alerted · location attached · incident data prepared. <SimLabel>Simulation — no real call</SimLabel></p>;
      break;
    case 7:
      phone = <div className="p-3"><FailSafeSequence compact stage={Math.min(3, Math.floor(t / 1.5))} /></div>;
      side = <p className="text-lg text-body"><b className="text-navy">The helmet does not need to survive the crash for RYVORA to respond.</b> Sensor data is synchronized before impact, so the phone and bike complete verification.</p>;
      break;
  }

  return (
    <div className="min-h-dvh bg-surface">
      <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/" aria-label="RYVORA home"><Logo /></Link>
          <span className="rounded-md bg-navy px-2 py-1 text-[11px] font-bold tracking-widest text-white">JURY DEMO</span>
          <SimLabel>Simulated hardware data</SimLabel>
          <div className="ml-auto flex gap-2">
            <Button size="sm" onClick={start}>{playing && step >= 0 && step < STEPS.length ? <><Pause className="size-4" />Pause</> : <><Play className="size-4" />{step === -1 ? "Start Demo" : "Resume"}</>}</Button>
            <Button size="sm" variant="secondary" onClick={next} disabled={step >= STEPS.length}><SkipForward className="size-4" />Skip Step</Button>
            <Button size="sm" variant="secondary" onClick={reset}><RotateCcw className="size-4" />Reset Demo</Button>
          </div>
        </div>
        <ol className="mx-auto flex max-w-[1400px] gap-1 px-4 pb-2 sm:px-6" aria-label="Demo steps">
          {STEPS.map((s, i) => (
            <li key={s.title} className="h-1.5 flex-1 overflow-hidden rounded-full bg-line-soft" title={s.title}>
              <span className="block h-full bg-brand transition-[width]" style={{ width: i < step ? "100%" : i === step ? `${p * 100}%` : "0%" }} />
            </li>
          ))}
        </ol>
      </header>

      <main id="main" className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
        {step === -1 && (
          <div className="grid min-h-[60vh] place-items-center text-center">
            <div><h1 className="text-4xl font-extrabold sm:text-5xl">RYVORA in 2 minutes</h1><p className="mt-3 text-body">9 automated steps. Space = start/pause · → = skip · R = reset.</p><Button size="xl" className="mt-8" onClick={start}><Play className="size-5" />Start Demo</Button></div>
          </div>
        )}
        {step >= 0 && step < 8 && (
          <div className="grid items-start gap-6 lg:grid-cols-[400px_minmax(0,1fr)]">
            <div className="mx-auto w-full max-w-[380px] overflow-hidden rounded-[44px] border-[10px] border-navy bg-white shadow-[var(--shadow-lift)]">
              <div className="h-[680px] overflow-hidden" aria-live="polite">{phone}</div>
            </div>
            <section className="space-y-5">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">Step {step + 1} of {STEPS.length}</p>
              <h1 className="text-3xl font-extrabold sm:text-4xl">{STEPS[step].title}</h1>
              <p className="text-lg text-body">{STEPS[step].caption}</p>
              <div className="rounded-3xl border border-line bg-white p-5">{side}</div>
            </section>
          </div>
        )}
        {step === 8 && (
          <div className="space-y-4">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">Step 9 of 9 · Laptop view</p>
            <h1 className="text-3xl font-extrabold">Desktop crash reconstruction</h1>
            <div className="rounded-3xl border-[8px] border-navy bg-surface p-4"><ReconstructionView compact /></div>
          </div>
        )}
        {step === STEPS.length && (
          <div className="grid min-h-[70vh] place-items-center rounded-[40px] bg-navy p-8 text-center text-white">
            <div>
              <p className="font-[family-name:var(--font-display)] text-5xl font-extrabold tracking-[0.2em] sm:text-7xl">RYVORA</p>
              <p className="mt-4 text-xl text-white/80">“Intelligence that protects every ride.”</p>
              <p className="mt-10 font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-[0.25em] text-brand">VERIFY. SURVIVE. RESPOND.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

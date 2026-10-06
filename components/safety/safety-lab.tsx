"use client";

import { useEffect, useState } from "react";
import { ArrowRight, BrainCircuit, CircleCheck, FileSearch, Loader2, OctagonAlert, TriangleAlert } from "lucide-react";
import { DeviceIcon } from "@/components/landing/device-icon";
import {
  classificationLabel,
  keySignalRows,
  outcomeFor,
  signalCount,
  THRESHOLD_PCT,
  type KeySignalRow,
  type Outcome,
} from "@/lib/engine/key-signals";
import { CrashConfidencePanel } from "@/components/safety/crash-confidence-panel";
import { FailSafeSequence } from "@/components/safety/failsafe-sequence";
import { useSafetySettings } from "@/components/profile/safety-settings";
import { IncidentOverlay } from "@/components/safety/incident-overlay";
import { Badge, ButtonLink, Card, CardHeader, PageHeader, SimLabel, Toggle } from "@/components/ui/primitives";
import { assessEvent, confidencePct, ESCALATION_THRESHOLD, EVENT_LABELS, SIGNAL_ORDER } from "@/lib/engine/crash-confidence";
import { SCENARIOS, SCENARIO_MAP, SEVERE_CRASH_NO_HELMET } from "@/lib/simulation/scenarios";
import type { CrashAssessment, ScenarioDefinition } from "@/lib/types/events";
import { cn } from "@/lib/utils/cn";

const DEFAULT_SCENARIO = "helmet-drop";
const SIGNAL_TOTAL = SIGNAL_ORDER.length;
const REVEAL_STEP_MS = 140;
/** Pause between the verdict appearing and the rider check opening. */
const OVERLAY_DELAY_MS = 1200;

const SEVERE_FULL = assessEvent(SCENARIO_MAP["severe-crash"].input);
const SEVERE_NO_HELMET = assessEvent(SEVERE_CRASH_NO_HELMET);

function prefersReducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function SafetyLab() {
  // `run` increments on every pick, so re-selecting the same scenario replays it.
  const [selection, setSelection] = useState({ id: DEFAULT_SCENARIO, run: 0 });
  const [revealed, setRevealed] = useState(SIGNAL_TOTAL);
  // Which run the rider-check overlay belongs to; null = closed.
  const [overlayRun, setOverlayRun] = useState<number | null>(null);
  // Last run whose overlay the user closed, so a pending auto-open cannot reopen it.
  const [dismissedRun, setDismissedRun] = useState<number | null>(null);
  const { riderCheckSeconds, autoEscalation } = useSafetySettings();

  const scenario = SCENARIO_MAP[selection.id] ?? SCENARIOS[0];
  const assessment = assessEvent(scenario.input);
  const done = revealed >= SIGNAL_TOTAL;
  const { run } = selection;
  const { emergency } = assessment;

  useEffect(() => {
    if (revealed >= SIGNAL_TOTAL) return;
    const t = setTimeout(() => setRevealed((r) => r + 1), REVEAL_STEP_MS);
    return () => clearTimeout(t);
  }, [revealed]);

  // Severe crash: open the rider check once the verdict is shown, once per run.
  // Re-selecting the scenario starts a new run, which re-triggers it.
  useEffect(() => {
    if (!done || !emergency || dismissedRun === run) return;
    const t = setTimeout(() => setOverlayRun(run), OVERLAY_DELAY_MS);
    return () => clearTimeout(t);
  }, [done, emergency, run, dismissedRun]);

  const closeOverlay = () => {
    setOverlayRun(null);
    setDismissedRun(run);
  };

  const pick = (id: string) => {
    setSelection((prev) => ({ id, run: prev.run + 1 }));
    setRevealed(prefersReducedMotion() ? SIGNAL_TOTAL : 0);
    setOverlayRun(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Verify"
        title="Impact does not always mean accident."
        description="Pick a scenario. RYVORA cross-checks the helmet, the bike and the phone before it decides."
        action={<SimLabel>Simulated sensor data</SimLabel>}
      />

      <ScenarioPicker selectedId={scenario.id} onPick={pick} />

      <KeySignalsCard scenario={scenario} assessment={assessment} revealed={revealed} done={done} onOpenRiderCheck={() => setOverlayRun(run)} />

      <Card className="p-4 sm:p-6">
        <CardHeader kicker="Crash confidence engine" title="How the decision was made" className="mb-4" />
        <CrashConfidencePanel assessment={assessment} revealed={revealed} />
      </Card>

      <FailSafeLab />

      {overlayRun !== null && (
        <IncidentOverlay
          key={overlayRun}
          confidencePct={confidencePct(assessment)}
          countdownSec={riderCheckSeconds}
          autoEscalate={autoEscalation}
          onClose={closeOverlay}
        />
      )}
    </div>
  );
}

function ScenarioPicker({ selectedId, onPick }: { selectedId: string; onPick: (id: string) => void }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Scenario</legend>
      <div className="no-scrollbar -mx-4 flex snap-x scroll-px-4 gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 md:grid-cols-3 xl:grid-cols-4">
        {SCENARIOS.map((s) => {
          const selected = s.id === selectedId;
          const severe = s.expected === "SEVERE_CRASH";
          return (
            <label
              key={s.id}
              className={cn(
                "flex w-44 shrink-0 cursor-pointer snap-start flex-col rounded-2xl border p-3.5 transition-colors sm:w-auto",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand",
                selected ? (severe ? "border-crit-line bg-crit-bg" : "border-brand bg-brand-50") : "border-line bg-white hover:border-brand",
              )}
            >
              <input
                type="radio"
                name="safety-scenario"
                value={s.id}
                checked={selected}
                onChange={() => onPick(s.id)}
                onClick={() => {
                  // A checked radio fires no change event: replay on re-select.
                  if (selected) onPick(s.id);
                }}
                className="sr-only"
              />
              <span
                className={cn(
                  "text-[13px] font-extrabold uppercase tracking-[0.06em]",
                  selected ? (severe ? "text-crit" : "text-brand-600") : "text-navy",
                )}
              >
                {s.label}
              </span>
              <span className="mt-1 text-xs leading-snug text-body">{s.description}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function RowValue({ row }: { row: KeySignalRow }) {
  if (!row.available) return <Badge tone="warning">{row.value}</Badge>;
  if (row.kind === "measure") return <span className="text-sm font-bold text-navy tabular">{row.value}</span>;
  return <Badge tone={row.tone}>{row.value}</Badge>;
}

function KeySignalItem({ row, shown }: { row: KeySignalRow; shown: boolean }) {
  return (
    <li
      className={cn(
        "flex min-h-14 items-center gap-3 rounded-xl border border-line-soft bg-white px-3 py-2 transition-opacity duration-300",
        !shown && "opacity-30",
      )}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface text-navy">
        <DeviceIcon device={row.device} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold text-navy">{row.label}</span>
        <span className="block truncate text-xs text-muted tabular">{shown ? row.detail : "…"}</span>
      </span>
      <span className="shrink-0">{shown ? <RowValue row={row} /> : <span className="text-xs text-muted">…</span>}</span>
    </li>
  );
}

function ConfidenceMeter({ value, threshold, critical = false }: { value: number; threshold?: number; critical?: boolean }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="mt-3" aria-hidden>
      <div className="relative h-2 rounded-full bg-line-soft">
        <div
          className={cn("h-full rounded-full transition-[width] duration-700", critical ? "bg-crit-strong" : "bg-brand")}
          style={{ width: `${pct}%` }}
        />
        {threshold !== undefined && (
          <span className="absolute -top-1 h-4 w-0.5 -translate-x-1/2 rounded-full bg-navy" style={{ left: `${threshold * 100}%` }} />
        )}
      </div>
      {threshold !== undefined && <p className="mt-1.5 text-[11px] text-muted">Marker: {Math.round(threshold * 100)}% escalation threshold</p>}
    </div>
  );
}

const OUTCOME_STYLE: Record<Outcome["tone"], { box: string; detail: string }> = {
  success: { box: "border-ok-line bg-ok-bg text-ok", detail: "text-body" },
  warning: { box: "border-warn-line bg-warn-bg text-warn", detail: "text-body" },
  critical: { box: "border-crit-strong bg-crit-strong text-white", detail: "text-white/85" },
};

function Decision({ assessment, onOpenRiderCheck }: { assessment: CrashAssessment; onOpenRiderCheck: () => void }) {
  const outcome = outcomeFor(assessment);
  const style = OUTCOME_STYLE[outcome.tone];
  const Icon = outcome.tone === "success" ? CircleCheck : outcome.tone === "critical" ? OctagonAlert : TriangleAlert;
  const severe = assessment.eventClass === "SEVERE_CRASH";

  return (
    <div className="space-y-3 animate-fade-up">
      <div className="rounded-2xl border border-line bg-surface p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Classification</p>
          <p className="text-sm font-bold text-navy tabular">{confidencePct(assessment)}% confidence</p>
        </div>
        <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-extrabold text-navy">{classificationLabel(assessment)}</p>
        <ConfidenceMeter value={assessment.confidence} threshold={severe ? ESCALATION_THRESHOLD : undefined} critical={assessment.emergency} />
      </div>

      <div className={cn("rounded-2xl border p-4 sm:p-5", style.box)}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-80">Status</p>
        <p className="mt-1 flex items-start gap-2 font-[family-name:var(--font-display)] text-xl font-extrabold leading-tight sm:text-2xl">
          <Icon className="mt-0.5 size-6 shrink-0" aria-hidden />
          {outcome.title}
        </p>
        <p className={cn("mt-2 text-sm", style.detail)}>{outcome.detail}</p>
        {assessment.emergency && (
          <button
            type="button"
            onClick={onOpenRiderCheck}
            className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-4 font-[family-name:var(--font-display)] text-sm font-bold text-crit transition-colors hover:bg-crit-bg"
          >
            Open rider check
            <ArrowRight className="size-4" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}

function KeySignalsCard({
  scenario,
  assessment,
  revealed,
  done,
  onOpenRiderCheck,
}: {
  scenario: ScenarioDefinition;
  assessment: CrashAssessment;
  revealed: number;
  done: boolean;
  onOpenRiderCheck: () => void;
}) {
  const rows = keySignalRows(assessment);
  const outcome = outcomeFor(assessment);
  const { available, total } = signalCount(assessment);
  const announcement = done
    ? `${scenario.label}: ${classificationLabel(assessment)}, ${confidencePct(assessment)}% confidence. ${outcome.title}. ${outcome.detail}`
    : `Verifying ${scenario.label} across helmet, bike and phone.`;

  return (
    <Card className="p-4 sm:p-6" aria-labelledby="key-signals-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Key signals</p>
          <h2 id="key-signals-title" className="text-lg font-extrabold">
            {scenario.label}
          </h2>
        </div>
        <Badge tone="neutral">
          {available} of {total} signals
        </Badge>
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-6">
        <ul className="space-y-1.5" aria-label={`Key signals for ${scenario.label}`}>
          {rows.map((row) => (
            <KeySignalItem key={row.id} row={row} shown={row.order < revealed} />
          ))}
        </ul>
        <div className="flex flex-col gap-3">
          {done ? (
            <Decision assessment={assessment} onOpenRiderCheck={onOpenRiderCheck} />
          ) : (
            <div className="grid min-h-72 flex-1 place-items-center rounded-2xl border border-dashed border-line bg-surface p-6 text-center">
              <div>
                <Loader2 className="mx-auto size-6 animate-spin text-brand" aria-hidden />
                <p className="mt-3 font-[family-name:var(--font-display)] text-lg font-bold text-navy">Verifying across devices…</p>
                <p className="mt-1 text-sm text-muted">Helmet · Bike · Phone</p>
              </div>
            </div>
          )}
          <p className="mt-auto flex items-center gap-2 pt-1 font-[family-name:var(--font-display)] text-sm font-bold text-navy">
            <BrainCircuit className="size-4 shrink-0 text-brand" aria-hidden />
            Multiple devices. One verified decision.
          </p>
        </div>
      </div>
    </Card>
  );
}

function Stat({ label, value, note, className }: { label: string; value: string; note?: string; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-line-soft bg-white px-3.5 py-3", className)}>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</dt>
      <dd className="mt-1 font-[family-name:var(--font-display)] text-xl font-extrabold leading-tight text-navy tabular">{value}</dd>
      {note && <dd className="text-xs text-muted">{note}</dd>}
    </div>
  );
}

function FailSafeLab() {
  const [helmetLost, setHelmetLost] = useState(false);
  const current = helmetLost ? SEVERE_NO_HELMET : SEVERE_FULL;
  const pct = confidencePct(current);
  const delta = pct - confidencePct(SEVERE_FULL);
  const coverage = Math.round(current.coverage * 100);
  const { available, total } = signalCount(current);
  const escalation = current.emergency
    ? `Still above the ${THRESHOLD_PCT}% threshold. The emergency workflow escalates.`
    : `Below the ${THRESHOLD_PCT}% threshold. Rider check-in only.`;

  return (
    <Card className="p-4 sm:p-6" aria-labelledby="failsafe-title">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Fail-safe</p>
      <h2 id="failsafe-title" className="mt-1 max-w-3xl text-lg font-extrabold leading-snug sm:text-xl">
        The helmet does not need to survive the crash for RYVORA to respond.
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-body">
        Sensor data is continuously synchronized before impact, allowing the phone and bike module to continue verification even if helmet
        electronics are damaged.
      </p>

      <div className="mt-5">
        <FailSafeSequence stage={3} />
      </div>

      <div className="mt-5 rounded-3xl border border-line bg-surface p-4 sm:p-5">
        <Toggle
          id="helmet-destroyed"
          checked={helmetLost}
          onChange={setHelmetLost}
          label="Helmet destroyed before impact packet"
          description="Re-run the severe crash with no helmet impact data."
        />
        <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Stat label="Classification" value={EVENT_LABELS[current.eventClass]} className="col-span-2 sm:col-span-1" />
          <Stat
            label="Confidence"
            value={`${pct}%`}
            note={helmetLost ? `${delta < 0 ? "−" : "+"}${Math.abs(delta)} pts vs. all devices` : "All devices reporting"}
          />
          <Stat label="Coverage" value={`${coverage}%`} note={`${available} of ${total} signals`} />
        </dl>
        <ConfidenceMeter value={current.confidence} threshold={ESCALATION_THRESHOLD} critical={current.emergency} />
        <p
          className={cn(
            "mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl border px-3.5 py-3 text-sm font-semibold",
            current.emergency ? "border-crit-line bg-crit-bg text-crit" : "border-warn-line bg-warn-bg text-warn",
          )}
        >
          {current.emergency ? <OctagonAlert className="size-4 shrink-0" aria-hidden /> : <TriangleAlert className="size-4 shrink-0" aria-hidden />}
          <span className="min-w-0 flex-1">{escalation}</span>
          <SimLabel>Simulated</SimLabel>
        </p>
        <p className="sr-only" role="status" aria-live="polite">
          {helmetLost ? "Helmet impact data removed." : "All devices reporting."} {EVENT_LABELS[current.eventClass]}, {pct}% confidence, {coverage}% signal
          coverage. {escalation}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <ButtonLink href="/reconstruction" variant="secondary">
          <FileSearch className="size-4" aria-hidden />
          Open black-box reconstruction
        </ButtonLink>
      </div>
    </Card>
  );
}

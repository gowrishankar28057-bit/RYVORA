"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CrashConfidencePanel } from "@/components/safety/crash-confidence-panel";
import { FailSafeSequence } from "@/components/safety/failsafe-sequence";
import { IncidentOverlay } from "@/components/safety/incident-overlay";
import { buttonClass, Card, CardHeader, PageHeader, SimLabel } from "@/components/ui/primitives";
import { assessEvent, confidencePct } from "@/lib/engine/crash-confidence";
import { SCENARIOS, SCENARIO_MAP, SEVERE_CRASH_NO_HELMET } from "@/lib/simulation/scenarios";
import { cn } from "@/lib/utils/cn";

export function SafetyLab() {
  const [id, setId] = useState("helmet-drop");
  const [revealed, setRevealed] = useState(8);
  const [incident, setIncident] = useState(false);
  const assessment = assessEvent(SCENARIO_MAP[id].input);
  const noHelmet = assessEvent(SEVERE_CRASH_NO_HELMET);

  useEffect(() => {
    if (revealed >= 8) return;
    const t = setTimeout(() => setRevealed((r) => r + 1), 140);
    return () => clearTimeout(t);
  }, [revealed]);

  useEffect(() => {
    if (revealed < 8 || !assessment.emergency) return;
    const t = setTimeout(() => setIncident(true), 1200);
    return () => clearTimeout(t);
  }, [revealed, assessment.emergency, id]);

  const pick = (next: string) => {
    setId(next);
    setRevealed(0);
    setIncident(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader kicker="Verify" title="Impact does not always mean accident." description="Multiple devices. One verified decision. Pick a scenario and watch the crash confidence engine fuse helmet, bike and phone signals." action={<SimLabel>Simulated sensor data</SimLabel>} />
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0 lg:grid-cols-7" role="radiogroup" aria-label="Scenario">
        {SCENARIOS.map((s) => (
          <button key={s.id} type="button" role="radio" aria-checked={s.id === id} onClick={() => pick(s.id)}
            className={cn("min-h-12 shrink-0 rounded-2xl border px-4 py-2 text-left text-sm font-bold transition-colors",
              s.id === id ? (s.id === "severe-crash" ? "border-crit bg-crit-bg text-crit" : "border-brand bg-brand-50 text-brand-600") : "border-line bg-white text-navy hover:border-brand")}>
            {s.label.toUpperCase()}
          </button>
        ))}
      </div>
      <Card className="p-4 sm:p-6">
        <p className="mb-4 text-sm text-body"><span className="font-bold text-navy">{SCENARIO_MAP[id].label}:</span> {SCENARIO_MAP[id].description}</p>
        <CrashConfidencePanel assessment={assessment} revealed={revealed} />
      </Card>
      <Card className="p-5 sm:p-6">
        <CardHeader kicker="Fail-safe" title="The helmet does not need to survive the crash for RYVORA to respond." />
        <p className="mb-4 mt-2 max-w-3xl text-sm text-body">Sensor data is continuously synchronized before impact, allowing the phone and bike module to continue verification even if helmet electronics are damaged.</p>
        <FailSafeSequence stage={3} />
        <p className="mt-4 rounded-2xl bg-surface p-3 text-sm text-body">Even if the helmet dies <em>before</em> sending its impact packet, phone + bike alone still classify <b className="text-navy">SEVERE CRASH at {confidencePct(noHelmet)}%</b> (coverage {Math.round(noHelmet.coverage * 100)}%) — above the escalation threshold.</p>
        <Link href="/reconstruction" className={buttonClass("secondary", "md", "mt-4")}>Open black-box reconstruction</Link>
      </Card>
      {incident && <IncidentOverlay confidencePct={confidencePct(assessment)} onClose={() => setIncident(false)} />}
    </div>
  );
}

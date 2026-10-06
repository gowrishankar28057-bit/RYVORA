import { FailSafeSequence } from "@/components/safety/failsafe-sequence";
import { assessEvent, confidencePct } from "@/lib/engine/crash-confidence";
import { SEVERE_CRASH_NO_HELMET } from "@/lib/simulation/scenarios";
import { signalCount } from "@/lib/engine/key-signals";

/** One-line fail-safe story: the helmet is not a single point of failure. */
export function FailSafeBand() {
  const degraded = assessEvent(SEVERE_CRASH_NO_HELMET);
  const { available, total } = signalCount(degraded);

  return (
    <section id="fail-safe" aria-labelledby="fail-safe-title" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="grid gap-10 rounded-[32px] border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Fail-safe</p>
            <h2 id="fail-safe-title" className="mt-3 text-balance text-2xl font-extrabold leading-tight sm:text-4xl">
              The helmet does not need to survive the crash for RYVORA to respond.
            </h2>
            <p className="mt-4 leading-relaxed text-body">
              Sensor data is continuously synchronized before impact, allowing the phone and bike module to continue verification even if helmet
              electronics are damaged.
            </p>
            {degraded.emergency && (
              <p className="mt-6 flex items-baseline gap-3 border-t border-line-soft pt-6">
                <span className="font-[family-name:var(--font-display)] text-4xl font-extrabold text-navy tabular">{confidencePct(degraded)}%</span>
                <span className="text-sm text-body">
                  crash confidence from phone and bike alone ({available} of {total} signals), still above the escalation threshold. Simulated.
                </span>
              </p>
            )}
          </div>
          <FailSafeSequence stage={3} compact />
        </div>
      </div>
    </section>
  );
}

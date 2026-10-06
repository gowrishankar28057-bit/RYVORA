import { Play, Radio, ShieldCheck, Siren } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { fmtClock, KeyboardHint } from "@/components/jury/demo-controls";
import { Button, SimLabel } from "@/components/ui/primitives";
import { NUMBERED_STEP_COUNT, TOTAL_MS } from "@/lib/jury/demo-script";

const PILLARS = [
  { word: "Verify", detail: "Pre-ride checks, then a helmet drop versus a real crash", steps: "Steps 1–5", icon: ShieldCheck },
  { word: "Survive", detail: "The helmet is lost in the crash; phone and bike carry on", steps: "Step 8", icon: Radio },
  { word: "Respond", detail: "Rider check, simulated emergency workflow, black-box replay", steps: "Steps 6, 7 & 9", icon: Siren },
];

/** Idle screen shown before the demo starts and after Reset. */
export function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <section aria-labelledby="intro-title" className="grid min-h-[min(68vh,680px)] place-items-center py-6 text-center">
      <div className="w-full max-w-3xl">
        <LogoMark className="mx-auto size-12" />
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-brand-600">
          Jury mode · {NUMBERED_STEP_COUNT} automated steps · {fmtClock(TOTAL_MS)}
        </p>
        <h1 id="intro-title" className="mt-2 text-4xl font-extrabold leading-tight sm:text-5xl">
          RYVORA in two minutes
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-body sm:text-lg">
          From a blocked start to a verified crash, a simulated emergency response and the black-box reconstruction.
        </p>
        <Button size="xl" className="mt-8" onClick={onStart} aria-keyshortcuts="Space">
          <Play className="size-5" aria-hidden />
          Start Demo
        </Button>
        <KeyboardHint className="mt-5 hidden justify-center md:flex" />
        <ul className="mt-10 grid gap-3 text-left sm:grid-cols-3">
          {PILLARS.map((p) => (
            <li key={p.word} className="rounded-3xl border border-line bg-white p-4 shadow-[var(--shadow-card)]">
              <span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <p.icon className="size-4" aria-hidden />
              </span>
              <p className="mt-3 font-[family-name:var(--font-display)] text-base font-extrabold uppercase tracking-[0.14em] text-navy">
                {p.word}
              </p>
              <p className="mt-1 text-sm text-body">{p.detail}</p>
              <p className="mt-2 text-xs font-semibold text-muted">{p.steps}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6">
          <SimLabel>All hardware data in this demo is simulated</SimLabel>
        </p>
      </div>
    </section>
  );
}

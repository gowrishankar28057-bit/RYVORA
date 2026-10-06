import { RotateCcw } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { revealClass } from "@/components/jury/stage";
import { Button } from "@/components/ui/primitives";
import { finaleFrame } from "@/lib/jury/timeline";
import { cn } from "@/lib/utils/cn";

const TRIAD = ["VERIFY.", "SURVIVE.", "RESPOND."];

/** Closing frame: RYVORA / tagline / VERIFY. SURVIVE. RESPOND. */
export function FinaleStep({ ms, onReplay }: { ms: number; onReplay: () => void }) {
  const f = finaleFrame(ms);
  return (
    <section
      aria-labelledby="finale-title"
      className="relative grid min-h-[min(72vh,720px)] place-items-center overflow-hidden rounded-[32px] bg-navy px-6 py-14 text-center text-white sm:rounded-[40px]"
    >
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-brand/20 blur-3xl" aria-hidden />
      <div className="relative min-w-0">
        <LogoMark className="mx-auto size-14" />
        <h1
          id="finale-title"
          className="mt-6 font-[family-name:var(--font-display)] text-5xl font-extrabold tracking-[0.2em] text-white sm:text-7xl"
        >
          RYVORA
        </h1>
        <p className={cn("mt-4 text-lg text-white/80 sm:text-xl", revealClass(f.tagline))}>
          “Intelligence that protects every ride.”
        </p>
        <p className="mt-10 flex flex-wrap justify-center gap-x-4 gap-y-1 font-[family-name:var(--font-display)] text-xl font-extrabold tracking-[0.22em] text-brand sm:text-3xl">
          {TRIAD.map((w, i) => (
            <span key={w} className={revealClass(i < f.words)}>
              {w}
            </span>
          ))}
        </p>
        <div className={cn("mt-10 flex flex-col items-center gap-4", revealClass(f.outro))} aria-hidden={!f.outro}>
          <p className="text-sm text-white/70">Helmet · Bike · Phone — one verified decision.</p>
          <p className="rounded-md border border-dashed border-white/40 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/80">
            Prototype · simulated hardware data · simulated emergency workflow
          </p>
          <Button variant="secondary" onClick={onReplay} tabIndex={f.outro ? undefined : -1}>
            <RotateCcw className="size-4" aria-hidden />
            Replay demo
          </Button>
        </div>
      </div>
    </section>
  );
}

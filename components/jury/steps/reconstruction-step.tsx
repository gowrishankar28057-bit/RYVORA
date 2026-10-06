"use client";

import { Check } from "lucide-react";
import { memo, useEffect, useRef } from "react";
import { LaptopFrame } from "@/components/jury/device-frames";
import { StepHeading } from "@/components/jury/stage";
import { ReconstructionView } from "@/components/reconstruction/reconstruction-view";
import { INCIDENT } from "@/data/rider";
import { RECON_SECTIONS, reconFrame } from "@/lib/jury/timeline";
import { cn } from "@/lib/utils/cn";

/** Rendered once: the demo clock re-renders the page 20×/s, the charts do not need to. */
const Reconstruction = memo(function Reconstruction() {
  return <ReconstructionView compact />;
});

function SectionChips({ active }: { active: number }) {
  return (
    <ol className="flex flex-wrap gap-2" aria-label="Reconstruction walkthrough">
      {RECON_SECTIONS.map((label, i) => (
        <li
          key={label}
          aria-current={i === active ? "step" : undefined}
          className={cn(
            "flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors duration-300",
            i === active ? "border-brand bg-brand-50 text-brand-600" : i < active ? "border-line bg-white text-navy" : "border-line-soft bg-white text-muted",
          )}
        >
          {i < active ? <Check className="size-3.5 text-ok" strokeWidth={3} aria-hidden /> : <span className="tabular" aria-hidden>{i + 1}</span>}
          {label}
        </li>
      ))}
    </ol>
  );
}

/** Step 9 — the laptop view: black-box timeline, sensor graphs, AI explanation. */
export function ReconstructionStep({ ms, playing }: { ms: number; playing: boolean }) {
  const screenRef = useRef<HTMLDivElement>(null);
  const f = reconFrame(ms);

  // Scripted scroll while playing; when paused the presenter can scroll freely.
  useEffect(() => {
    const el = screenRef.current;
    if (!el || !playing) return;
    el.scrollTop = f.scroll * Math.max(0, el.scrollHeight - el.clientHeight);
  }, [f.scroll, playing]);

  return (
    <div className="space-y-5">
      <StepHeading stepId="reconstruction" aside={<SectionChips active={f.section} />} />
      <LaptopFrame ref={screenRef} url={`ryvora.app/incidents/${INCIDENT.id}`}>
        <Reconstruction />
      </LaptopFrame>
    </div>
  );
}

import { MessageSquareQuote } from "lucide-react";
import { PhoneFrame } from "@/components/jury/device-frames";
import { DEMO_STEPS, NUMBERED_STEP_COUNT, stepIndexOf, type DemoStepId } from "@/lib/jury/demo-script";
import { cn } from "@/lib/utils/cn";

/** Fade helper: keeps layout stable while content is not yet revealed. */
export function revealClass(shown: boolean) {
  return cn("transition-opacity duration-500", shown ? "opacity-100" : "pointer-events-none opacity-0");
}

/** Step kicker, title and the one-sentence presenter caption. */
export function StepHeading({ stepId, aside }: { stepId: DemoStepId; aside?: React.ReactNode }) {
  const index = stepIndexOf(stepId);
  const step = DEMO_STEPS[index];
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">
          Step {index + 1} of {NUMBERED_STEP_COUNT}
        </p>
        <h1 className="mt-1 text-[28px] font-extrabold leading-tight sm:text-4xl">{step.title}</h1>
        <p className="mt-3 flex gap-2.5 text-base leading-relaxed text-body sm:text-lg">
          <MessageSquareQuote className="mt-1 size-5 shrink-0 text-brand" aria-hidden />
          <span>
            <span className="sr-only">Presenter line: </span>
            {step.caption}
          </span>
        </p>
      </div>
      {aside}
    </header>
  );
}

/**
 * Phone + narrative layout.
 * Mobile/tablet: heading → phone → panel (stacked).
 * Desktop (≥1024px): phone on the left, heading and panel on the right.
 */
export function PhoneStage({
  stepId,
  phone,
  panel,
  phoneLabel,
}: {
  stepId: DemoStepId;
  phone: React.ReactNode;
  panel: React.ReactNode;
  phoneLabel?: string;
}) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:gap-x-10 lg:gap-y-6">
      <div className="min-w-0 lg:col-start-2 lg:row-start-1">
        <StepHeading stepId={stepId} />
      </div>
      <div className="min-w-0 lg:col-start-1 lg:row-span-2 lg:row-start-1">
        <PhoneFrame label={phoneLabel}>{phone}</PhoneFrame>
      </div>
      <div className="min-w-0 lg:col-start-2 lg:row-start-2">{panel}</div>
    </div>
  );
}

/** Small uppercase label used across jury panels. */
export function Kicker({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-[11px] font-semibold uppercase tracking-[0.14em] text-muted", className)}>{children}</p>;
}

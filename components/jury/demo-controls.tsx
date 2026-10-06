import { ChevronLeft, Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import type { DemoStatus } from "@/lib/jury/demo-machine";
import { cn } from "@/lib/utils/cn";

export function fmtClock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-grid min-w-6 place-items-center rounded-md border border-line bg-white px-1.5 py-0.5 font-sans text-[11px] font-semibold text-navy shadow-[0_1px_0_var(--color-line)]">
      {children}
    </kbd>
  );
}

export function KeyboardHint({ className }: { className?: string }) {
  return (
    <p className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted", className)}>
      <span className="flex items-center gap-1.5">
        <Kbd>Space</Kbd> start / pause
      </span>
      <span className="flex items-center gap-1.5">
        <Kbd>←</Kbd>
        <Kbd>→</Kbd> previous / skip
      </span>
      <span className="flex items-center gap-1.5">
        <Kbd>R</Kbd> reset
      </span>
    </p>
  );
}

const PRIMARY: Record<DemoStatus, { label: string; icon: React.ReactNode }> = {
  idle: { label: "Start Demo", icon: <Play className="size-4" aria-hidden /> },
  playing: { label: "Pause", icon: <Pause className="size-4" aria-hidden /> },
  paused: { label: "Resume", icon: <Play className="size-4" aria-hidden /> },
  finished: { label: "Replay", icon: <RotateCcw className="size-4" aria-hidden /> },
};

/** Start / pause / resume, previous, skip, reset, and the elapsed clock. */
export function DemoControls({
  status,
  elapsedMs,
  totalMs,
  onToggle,
  onPrev,
  onSkip,
  onReset,
  className,
}: {
  status: DemoStatus;
  elapsedMs: number;
  totalMs: number;
  onToggle: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onReset: () => void;
  className?: string;
}) {
  const primary = PRIMARY[status];
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="flex items-center gap-2" role="group" aria-label="Demo controls">
        <Button
          variant="secondary"
          className="w-11 px-0"
          onClick={onPrev}
          disabled={status === "idle"}
          aria-label="Previous step"
          aria-keyshortcuts="ArrowLeft"
          title="Previous step (←)"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </Button>
        <Button className="min-w-[8.5rem]" onClick={onToggle} aria-keyshortcuts="Space" title={`${primary.label} (Space)`}>
          {primary.icon}
          {primary.label}
        </Button>
        <Button
          variant="secondary"
          className="px-3 sm:px-4"
          onClick={onSkip}
          disabled={status === "finished"}
          aria-keyshortcuts="ArrowRight"
          title="Skip step (→)"
        >
          <SkipForward className="size-4" aria-hidden />
          <span className="sr-only sm:not-sr-only">Skip Step</span>
        </Button>
        <Button variant="secondary" className="px-3 sm:px-4" onClick={onReset} aria-keyshortcuts="R" title="Reset demo (R)">
          <RotateCcw className="size-4" aria-hidden />
          <span className="sr-only sm:not-sr-only">Reset Demo</span>
        </Button>
      </div>
      <p className="ml-auto pl-1 font-[family-name:var(--font-display)] text-sm font-bold text-navy tabular">
        <span className="sr-only">Elapsed </span>
        {fmtClock(elapsedMs)}
        <span className="text-muted" aria-hidden>
          {" "}
          / {fmtClock(totalMs)}
        </span>
        <span className="sr-only"> of {fmtClock(totalMs)}</span>
      </p>
    </div>
  );
}

"use client";

import { Check, Flag } from "lucide-react";
import { useEffect, useRef } from "react";
import { stepProgress, type DemoState } from "@/lib/jury/demo-machine";
import { DEMO_STEPS } from "@/lib/jury/demo-script";
import { cn } from "@/lib/utils/cn";

/** Clickable step rail with per-step progress. Every item is a button, so it is keyboard reachable. */
export function StepRail({ state, onJump }: { state: DemoState; onJump: (index: number) => void }) {
  const listRef = useRef<HTMLOListElement>(null);
  const active = state.status === "idle" ? -1 : state.step;

  // Keep the current step visible when the rail scrolls horizontally (phones / tablets).
  useEffect(() => {
    const list = listRef.current;
    const item = active >= 0 ? (list?.children[active] as HTMLElement | undefined) : undefined;
    if (!list || !item || list.scrollWidth <= list.clientWidth) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    list.scrollTo({
      left: Math.max(0, item.offsetLeft - (list.clientWidth - item.clientWidth) / 2),
      behavior: reduce ? "auto" : "smooth",
    });
  }, [active]);

  return (
    <nav aria-label="Demo steps">
      <ol ref={listRef} className="no-scrollbar relative -mx-1 flex gap-1 overflow-x-auto px-1 pb-2">
        {DEMO_STEPS.map((s, i) => {
          const progress = stepProgress(state, i);
          const current = i === active;
          const done = !current && progress >= 1;
          const finale = s.layout === "finale";
          return (
            <li key={s.id} className="min-w-[92px] flex-1">
              <button
                type="button"
                onClick={() => onJump(i)}
                aria-current={current ? "step" : undefined}
                className={cn(
                  "flex min-h-11 w-full flex-col justify-center gap-1.5 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-brand-50",
                  current && "bg-brand-50",
                )}
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <span
                    className={cn(
                      "grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold tabular",
                      current ? "bg-navy text-white" : done ? "bg-brand-600 text-white" : "bg-line-soft text-muted",
                    )}
                    aria-hidden
                  >
                    {done ? <Check className="size-3" strokeWidth={3} /> : finale ? <Flag className="size-3" /> : i + 1}
                  </span>
                  <span className={cn("truncate text-xs font-semibold", current ? "text-navy" : "text-muted")}>
                    <span className="sr-only">{finale ? "Finale: " : `Step ${i + 1}: `}</span>
                    {s.short}
                    <span className="sr-only">
                      {` — ${s.title}`}
                      {done ? " (done)" : ""}
                    </span>
                  </span>
                </span>
                <span className="block h-1 overflow-hidden rounded-full bg-line-soft" aria-hidden>
                  <span className="block h-full rounded-full bg-brand" style={{ width: `${progress * 100}%` }} />
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

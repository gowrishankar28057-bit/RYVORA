"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils/cn";

export interface SegmentOption<T extends string> {
  value: T;
  label: React.ReactNode;
  /** Optional count pill shown after the label. */
  count?: number;
}

/**
 * Single-select segmented control with radio-group semantics.
 * Roving tab index: Tab enters/leaves the group, arrows / Home / End move and select.
 */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  size = "md",
  className,
}: {
  /** Accessible name of the group. */
  label: string;
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  className?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  function select(i: number) {
    const next = (i + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const keys: Record<string, () => void> = {
      ArrowRight: () => select(current + 1),
      ArrowDown: () => select(current + 1),
      ArrowLeft: () => select(current - 1),
      ArrowUp: () => select(current - 1),
      Home: () => select(0),
      End: () => select(options.length - 1),
    };
    const run = keys[e.key];
    if (!run) return;
    e.preventDefault();
    run();
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn("no-scrollbar inline-flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-line bg-surface p-1", className)}
    >
      {options.map((o, i) => {
        const checked = i === current;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex h-11 flex-auto shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl font-semibold transition-colors",
              size === "sm" ? "px-2.5 text-xs" : "px-3 text-sm sm:px-3.5",
              checked ? "bg-white text-navy shadow-[var(--shadow-card)] ring-1 ring-line" : "text-muted hover:bg-white/70 hover:text-navy",
            )}
          >
            {o.label}
            {o.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[11px] font-bold tabular",
                  checked ? "bg-brand-50 text-brand-600" : "bg-line-soft text-muted",
                )}
              >
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

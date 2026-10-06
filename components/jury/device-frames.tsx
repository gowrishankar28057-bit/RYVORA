import { BatteryFull, Lock, Signal, Wifi } from "lucide-react";
import { SimLabel } from "@/components/ui/primitives";
import { cn } from "@/lib/utils/cn";

/**
 * Smartphone bezel. Width follows the column (max 380px) so it never overflows a
 * 360px screen; height tracks the viewport so the whole phone fits on a projector.
 */
export function PhoneFrame({
  children,
  label = "Rider's phone",
  className,
}: {
  children: React.ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <figure className={cn("mx-auto w-full max-w-[380px]", className)} aria-label={label}>
      <div className="rounded-[46px] bg-navy p-[9px] shadow-[var(--shadow-lift)] ring-1 ring-navy-700">
        <div className="relative flex h-[clamp(540px,calc(100dvh-220px),700px)] flex-col overflow-hidden rounded-[38px] bg-white">
          <div className="flex h-9 shrink-0 items-center justify-between px-6 text-[11px] font-semibold text-navy" aria-hidden>
            <span className="tabular">14:12</span>
            <span className="h-[22px] w-[88px] rounded-full bg-navy" />
            <span className="flex items-center gap-1">
              <Signal className="size-3.5" />
              <Wifi className="size-3.5" />
              <BatteryFull className="size-4" />
            </span>
          </div>
          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">{children}</div>
          <div className="pointer-events-none absolute bottom-2 left-1/2 h-1 w-28 -translate-x-1/2 rounded-full bg-navy/25" aria-hidden />
        </div>
      </div>
      <figcaption className="mt-3 flex justify-center">
        <SimLabel>Simulated hardware data</SimLabel>
      </figcaption>
    </figure>
  );
}

/** Laptop bezel with a browser bar; the screen scrolls inside the frame. */
export function LaptopFrame({
  children,
  url,
  ref,
  className,
}: {
  children: React.ReactNode;
  url: string;
  ref?: React.Ref<HTMLDivElement>;
  className?: string;
}) {
  return (
    <figure className={cn("mx-auto w-full max-w-[1180px]", className)} aria-label="Laptop">
      <div className="rounded-t-[22px] bg-navy p-2 pb-2.5 shadow-[var(--shadow-lift)] ring-1 ring-navy-700 sm:rounded-t-[26px] sm:p-3">
        <div className="overflow-hidden rounded-[14px] bg-surface">
          <div className="flex min-w-0 items-center gap-2 border-b border-line bg-white px-3 py-2">
            <span className="hidden gap-1.5 sm:flex" aria-hidden>
              <span className="size-2.5 rounded-full bg-line" />
              <span className="size-2.5 rounded-full bg-line" />
              <span className="size-2.5 rounded-full bg-line" />
            </span>
            <span className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1 text-xs text-muted">
              <Lock className="size-3 shrink-0" aria-hidden />
              <span className="truncate">{url}</span>
            </span>
            <SimLabel className="shrink-0">Simulated</SimLabel>
          </div>
          <div
            ref={ref}
            role="region"
            aria-label="Laptop screen: crash reconstruction"
            tabIndex={0}
            className="no-scrollbar h-[clamp(380px,calc(100dvh-330px),640px)] overflow-y-auto p-3 sm:p-5"
          >
            {children}
          </div>
        </div>
      </div>
      <div className="relative h-3 rounded-b-2xl bg-gradient-to-b from-line to-brand-100" aria-hidden>
        <span className="absolute left-1/2 top-0 h-1.5 w-24 -translate-x-1/2 rounded-b-lg bg-line-soft" />
      </div>
    </figure>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { SimLabel, StatusDot } from "@/components/ui/primitives";
import { useTelemetry } from "@/lib/telemetry/telemetry-provider";
import { cn } from "@/lib/utils/cn";
import { isActive, JURY_ITEM, NAV_ITEMS } from "./nav-items";
import { SimulatorPanel } from "./simulator-panel";

export function ResponsiveShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { readiness, ride, setSimulatorOpen } = useTelemetry();
  const statusTone = ride.active ? "info" : readiness.state === "ready" ? "success" : readiness.state === "degraded" ? "warning" : "critical";
  const statusText = ride.active ? "Monitoring ride" : readiness.state === "ready" ? "Ready to ride" : readiness.state === "degraded" ? "Degraded" : "Not ready";

  return (
    <div className="min-h-dvh bg-surface lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-white px-4 py-6 lg:flex">
        <Link href="/" className="mb-8 px-2" aria-label="RYVORA home">
          <Logo />
        </Link>
        <nav aria-label="Primary" className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors",
                  active ? "bg-brand-50 text-brand-600" : "text-body hover:bg-surface hover:text-navy",
                )}
              >
                <Icon className="size-[18px]" aria-hidden />
                {item.label}
              </Link>
            );
          })}
          <div className="my-4 h-px bg-line" />
          <Link
            href={JURY_ITEM.href}
            className="flex h-11 items-center gap-3 rounded-xl bg-navy px-3 text-sm font-semibold text-white hover:bg-navy-800"
          >
            <JURY_ITEM.icon className="size-[18px]" aria-hidden />
            Jury Demo
          </Link>
        </nav>
        <div className="space-y-3">
          <div className="rounded-2xl border border-line bg-surface p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-navy">
              <StatusDot tone={statusTone} pulse={ride.active} />
              {statusText}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <SimLabel>Simulated hardware</SimLabel>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSimulatorOpen(true)}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-line text-sm font-semibold text-navy hover:border-brand hover:bg-brand-50"
          >
            <SlidersHorizontal className="size-4" aria-hidden />
            Hardware simulator
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line/70 bg-white/90 px-4 backdrop-blur lg:hidden">
          <Link href="/" aria-label="RYVORA home">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1 text-[11px] font-semibold text-navy">
              <StatusDot tone={statusTone} pulse={ride.active} />
              {statusText}
            </span>
            <button
              type="button"
              onClick={() => setSimulatorOpen(true)}
              aria-label="Open hardware simulator"
              className="grid size-10 place-items-center rounded-xl border border-line text-navy"
            >
              <SlidersHorizontal className="size-[18px]" aria-hidden />
            </button>
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-[1320px] flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Primary"
        className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur lg:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {NAV_ITEMS.filter((i) => i.mobile).map((item) => {
            const active = isActive(pathname, item);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold",
                    active ? "text-brand-600" : "text-muted",
                  )}
                >
                  <span className={cn("grid h-7 w-12 place-items-center rounded-full transition-colors", active && "bg-brand-50")}>
                    <Icon className="size-[20px]" aria-hidden />
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <SimulatorPanel />
    </div>
  );
}

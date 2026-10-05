"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ArrowRight, ChevronRight, FileSearch, Power, ShieldCheck, Stethoscope } from "lucide-react";
import { StatusCard } from "@/components/dashboard/status-card";
import { EventCard } from "@/components/history/event-card";
import { buttonClass, Card, CardHeader } from "@/components/ui/primitives";
import { RIDE_HISTORY } from "@/data/rides";
import { RIDER } from "@/data/rider";
import { useTelemetry } from "@/lib/telemetry/telemetry-provider";
import { cn } from "@/lib/utils/cn";

const noop = () => () => {};

function useGreeting() {
  return useSyncExternalStore(
    noop,
    () => {
      const h = new Date().getHours();
      return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
    },
    () => "Welcome back",
  );
}

export function HomeDashboard() {
  const { snapshot, readiness, ride } = useTelemetry();
  const greeting = useGreeting();
  const blocked = readiness.state === "blocked";

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-7">
      <div className="space-y-5">
        <StatusCard
          readiness={readiness}
          snapshot={snapshot}
          greeting={
            <div className="mb-5">
              <p className="text-sm text-muted">{greeting},</p>
              <p className="font-[family-name:var(--font-display)] text-xl font-extrabold text-navy">
                {RIDER.name.split(" ")[0]} · {blocked ? "Rider check needed" : "Rider ready"}
              </p>
            </div>
          }
          action={
            ride.active ? (
              <Link href="/ride" className={buttonClass("dark", "xl", "w-full")}>
                Ride in progress <ArrowRight className="size-5" aria-hidden />
              </Link>
            ) : blocked ? (
              <div>
                <button type="button" disabled className={buttonClass("primary", "xl", "w-full")} aria-describedby="start-blocked">
                  <Power className="size-5" aria-hidden /> START RIDE
                </button>
                <p id="start-blocked" className="mt-2 text-center text-xs font-semibold text-crit">
                  Start permission blocked until the items above are fixed.
                </p>
              </div>
            ) : (
              <Link href="/precheck" className={buttonClass("primary", "xl", "w-full")}>
                <Power className="size-5" aria-hidden /> START RIDE
              </Link>
            )
          }
        />
      </div>

      <div className="space-y-5">
        <Card className="p-5">
          <CardHeader kicker="This month" title="Safety intelligence" />
          <dl className="mt-4 grid grid-cols-3 gap-3">
            {[
              { k: "Rides", v: RIDER.stats.rides },
              { k: "Distance", v: `${RIDER.stats.distanceKm.toLocaleString("en-IN")} km` },
              { k: "False triggers rejected", v: 3 },
            ].map((s) => (
              <div key={s.k} className="rounded-2xl bg-surface p-3">
                <dt className="text-[11px] leading-tight text-muted">{s.k}</dt>
                <dd className="mt-1 font-[family-name:var(--font-display)] text-lg font-extrabold text-navy tabular">{s.v}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <nav aria-label="Quick links" className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          {[
            { href: "/safety", label: "Crash engine", sub: "Test scenarios", icon: ShieldCheck },
            { href: "/reconstruction", label: "Black box", sub: "Reconstruction", icon: FileSearch },
            { href: "/health", label: "Hardware", sub: "Diagnostics", icon: Stethoscope },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="group flex items-center gap-3 rounded-2xl border border-line bg-white p-3.5 shadow-[var(--shadow-card)] transition-colors hover:border-brand"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <l.icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-navy">{l.label}</span>
                <span className="block text-xs text-muted">{l.sub}</span>
              </span>
              <ChevronRight className="size-4 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          ))}
        </nav>

        <Card className="p-5">
          <CardHeader
            kicker="Recent"
            title="Rides & events"
            action={
              <Link href="/history" className="text-sm font-semibold text-brand-600 hover:underline">
                View all
              </Link>
            }
          />
          <ul className={cn("mt-3 space-y-2")}>
            {RIDE_HISTORY.slice(0, 3).map((e) => (
              <EventCard key={e.id} event={e} compact />
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

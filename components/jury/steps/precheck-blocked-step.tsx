import { Motorbike, Smartphone, X } from "lucide-react";
import { HelmetIcon } from "@/components/brand/icons";
import { StatusCard } from "@/components/dashboard/status-card";
import { Kicker, PhoneStage, revealClass } from "@/components/jury/stage";
import { StartPermission } from "@/components/precheck/precheck-list";
import { Badge, Card, CardHeader, StatusDot } from "@/components/ui/primitives";
import { BLOCKED_READINESS, BLOCKED_SNAPSHOT } from "@/lib/jury/demo-data";
import { blockedFrame } from "@/lib/jury/timeline";
import { cn } from "@/lib/utils/cn";

const LINKS = [
  { label: "Helmet", icon: <HelmetIcon className="size-4" /> },
  { label: "Bike module", icon: <Motorbike className="size-4" aria-hidden /> },
  { label: "Phone", icon: <Smartphone className="size-4" aria-hidden /> },
];

/** Step 1 — helmet not worn → START PERMISSION BLOCKED. */
export function PrecheckBlockedStep({ ms }: { ms: number }) {
  const f = blockedFrame(ms);
  const blockers = BLOCKED_READINESS.blockers;
  return (
    <PhoneStage
      stepId="precheck-blocked"
      phone={
        <div className="p-3">
          <StatusCard readiness={BLOCKED_READINESS} snapshot={BLOCKED_SNAPSHOT} action={<StartPermission enabled={false} compact />} />
        </div>
      }
      panel={
        <div className="space-y-4">
          <Card className="p-5">
            <CardHeader
              kicker="Essential pre-ride checks"
              title="Why the ride is blocked"
              action={<Badge tone="critical">{blockers.length} to fix</Badge>}
            />
            <ul className="mt-4 space-y-2">
              {blockers.map((b, i) => {
                const shown = i < f.blockersShown;
                return (
                  <li
                    key={b.id}
                    aria-hidden={!shown}
                    className={cn(
                      "flex items-start gap-3 rounded-2xl border border-crit-line bg-crit-bg px-4 py-3",
                      revealClass(shown),
                    )}
                  >
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-crit-strong text-white" aria-hidden>
                      <X className="size-4" strokeWidth={3} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-navy">
                        {b.label} — <span className="text-crit">{b.detail}</span>
                      </span>
                      <span className="block text-sm text-body">{b.fix}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 border-t border-line-soft pt-4">
              <Kicker>All three devices are connected — the rider is the problem</Kicker>
              <ul className="mt-2 flex flex-wrap gap-2">
                {LINKS.map((l) => (
                  <li key={l.label} className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-navy">
                    {l.icon}
                    {l.label}
                    <StatusDot tone="success" className="size-2" />
                    <span className="sr-only">connected</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
          <div aria-hidden={!f.permissionShown} className={revealClass(f.permissionShown)}>
            <StartPermission enabled={false} />
          </div>
        </div>
      }
    />
  );
}

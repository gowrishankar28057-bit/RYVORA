import { Check, Lock, LockOpen, X } from "lucide-react";
import { HelmetIcon } from "@/components/brand/icons";
import { Kicker, PhoneStage } from "@/components/jury/stage";
import { PrecheckList, StartPermission } from "@/components/precheck/precheck-list";
import { Badge, Card, CardHeader } from "@/components/ui/primitives";
import { READY_READINESS } from "@/lib/jury/demo-data";
import { readyFrame } from "@/lib/jury/timeline";
import { cn } from "@/lib/utils/cn";

function SensorTile({ ok, label, on, off, icon }: { ok: boolean; label: string; on: string; off: string; icon: React.ReactNode }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors duration-500",
        ok ? "border-ok-line bg-ok-bg" : "border-crit-line bg-crit-bg",
      )}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-navy shadow-[var(--shadow-card)]">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-navy">{label}</span>
        <span className={cn("block text-xs font-semibold", ok ? "text-ok" : "text-crit")}>{ok ? on : off}</span>
      </span>
      <span className={cn("grid size-7 place-items-center rounded-full text-white", ok ? "bg-ok" : "bg-crit-strong")} aria-hidden>
        {ok ? <Check className="size-4" strokeWidth={3} /> : <X className="size-4" strokeWidth={3} />}
      </span>
    </div>
  );
}

/** Step 2 — helmet worn and buckle secured → animated checklist → SYSTEM READY. */
export function SystemReadyStep({ ms }: { ms: number }) {
  const f = readyFrame(ms);
  const essential = READY_READINESS.checks.filter((c) => c.essential).length;
  return (
    <PhoneStage
      stepId="system-ready"
      phone={
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <Kicker>Pre-ride safety check</Kicker>
            <Badge tone={f.allPassed ? "success" : "info"}>{f.allPassed ? "Ready" : f.checksDone < 0 ? "Waiting" : "Checking"}</Badge>
          </div>
          {f.allPassed && (
            <div className="space-y-2 motion-safe:animate-fade-up">
              <p className="text-center font-[family-name:var(--font-display)] text-xl font-extrabold tracking-wide text-ok">
                ALL SYSTEMS READY
              </p>
              <StartPermission enabled compact />
            </div>
          )}
          <PrecheckList checks={READY_READINESS.checks} revealed={f.checksDone} />
        </div>
      }
      panel={
        <div className="space-y-4">
          <Card className="p-5">
            <CardHeader kicker="Smart helmet sensors" title="The rider puts the helmet on" />
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <SensorTile ok={f.worn} label="Wear sensor" on="Helmet worn" off="Not detected" icon={<HelmetIcon className="size-5" />} />
              <SensorTile
                ok={f.buckled}
                label="Buckle switch"
                on="Strap secured"
                off="Strap open"
                icon={f.buckled ? <Lock className="size-5" aria-hidden /> : <LockOpen className="size-5" aria-hidden />}
              />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-body">
              {essential} essential checks gate the start. Helmet IMU and link quality are advisory: if they fail, the ride
              is allowed with reduced coverage, because phone and bike can still verify a crash.
            </p>
          </Card>
          <StartPermission enabled={f.allPassed} />
        </div>
      }
    />
  );
}

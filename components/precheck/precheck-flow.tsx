"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Power, RotateCcw, SlidersHorizontal } from "lucide-react";
import { PrecheckList, StartPermission } from "@/components/precheck/precheck-list";
import { Button, Card, PageHeader } from "@/components/ui/primitives";
import { useTelemetry } from "@/lib/telemetry/telemetry-provider";

const STEP_MS = 420;

export function PrecheckFlow() {
  const router = useRouter();
  const { readiness, startRide, setSimulatorOpen } = useTelemetry();
  const [run, setRun] = useState(0);
  const [revealed, setRevealed] = useState(0);
  const total = readiness.checks.length;
  const finished = revealed >= total;

  useEffect(() => {
    if (revealed >= total) return;
    const id = setTimeout(() => setRevealed((r) => r + 1), revealed === 0 ? 500 : STEP_MS);
    return () => clearTimeout(id);
  }, [revealed, total, run]);

  const blocked = readiness.state === "blocked";
  const restart = () => {
    setRevealed(0);
    setRun((r) => r + 1);
  };

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        kicker="Prevent"
        title="Pre-ride safety check"
        description="RYVORA verifies the helmet, bike module and phone before granting start permission."
      />
      <Card className="p-4 sm:p-5">
        <PrecheckList checks={readiness.checks} revealed={revealed} />

        <div className="mt-5 min-h-[180px]" aria-live="polite">
          {finished && !blocked && (
            <div className="space-y-4 animate-fade-up">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-8 text-ok" aria-hidden />
                <div>
                  <p className="font-[family-name:var(--font-display)] text-xl font-extrabold text-navy">ALL SYSTEMS READY</p>
                  {readiness.state === "degraded" && (
                    <p className="text-sm text-warn">Riding allowed with reduced crash-detection coverage.</p>
                  )}
                </div>
              </div>
              <StartPermission enabled />
              <Button
                size="xl"
                className="w-full"
                onClick={() => {
                  startRide();
                  router.push("/ride");
                }}
              >
                <Power className="size-5" aria-hidden /> Begin ride
              </Button>
            </div>
          )}
          {finished && blocked && (
            <div className="space-y-4 animate-fade-up">
              <StartPermission enabled={false} />
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" onClick={() => setSimulatorOpen(true)}>
                  <SlidersHorizontal className="size-4" aria-hidden /> Simulator
                </Button>
                <Button onClick={restart}>
                  <RotateCcw className="size-4" aria-hidden /> Re-check
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

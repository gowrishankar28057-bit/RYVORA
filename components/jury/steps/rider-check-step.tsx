import { Check, CircleCheck, Loader2, Play, RotateCcw, Siren, Timer } from "lucide-react";
import { Kicker, PhoneStage } from "@/components/jury/stage";
import { RiderCheckScreen } from "@/components/safety/rider-check";
import { Button, Card, CardHeader, SimLabel } from "@/components/ui/primitives";
import { CRASH_PCT } from "@/lib/jury/demo-data";
import { riderCheckFrame } from "@/lib/jury/timeline";
import { cn } from "@/lib/utils/cn";

function NoResponseScreen() {
  return (
    <div className="flex h-full flex-col bg-white" role="status">
      <div className="bg-crit-bg px-5 pb-6 pt-8 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-crit-strong text-white">
          <Siren className="size-6" aria-hidden />
        </span>
        <h2 className="mt-4 text-2xl font-extrabold text-navy">No response</h2>
        <p className="mt-1 text-sm text-body">The countdown ended without a tap.</p>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <Loader2 className="size-8 text-brand motion-safe:animate-spin" aria-hidden />
        <p className="font-[family-name:var(--font-display)] text-lg font-bold text-navy">Starting emergency workflow…</p>
        <SimLabel>Simulation · nothing is sent</SimLabel>
      </div>
    </div>
  );
}

function CancelledScreen({ onContinue, onReplay }: { onContinue: () => void; onReplay: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center" role="status">
      <CircleCheck className="size-16 text-ok" aria-hidden />
      <h2 className="mt-4 text-2xl font-extrabold">Alert cancelled</h2>
      <p className="mt-1 font-semibold text-ok">Rider confirmed OK</p>
      <p className="mt-3 text-sm text-body">Nobody was contacted. The event is still saved to the black box for review.</p>
      <div className="mt-8 grid w-full gap-2">
        <Button size="lg" onClick={onContinue}>
          <Play className="size-4" aria-hidden />
          Continue demo
        </Button>
        <Button size="lg" variant="secondary" onClick={onReplay}>
          <RotateCcw className="size-4" aria-hidden />
          Replay countdown
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted">The demo continues as if the rider had not responded.</p>
    </div>
  );
}

type Rung = { title: string; detail: string; state: "done" | "active" | "pending" | "cancelled" };

function Ladder({ rungs }: { rungs: Rung[] }) {
  return (
    <ol className="space-y-2">
      {rungs.map((r) => (
        <li
          key={r.title}
          className={cn(
            "flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors duration-300",
            r.state === "done" && "border-line-soft bg-white",
            r.state === "active" && "border-brand-100 bg-brand-50",
            r.state === "pending" && "border-line-soft bg-white opacity-55",
            r.state === "cancelled" && "border-ok-line bg-ok-bg",
          )}
        >
          <span
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-full",
              r.state === "done" || r.state === "cancelled" ? "bg-ok text-white" : r.state === "active" ? "bg-brand-600 text-white" : "bg-line-soft text-muted",
            )}
            aria-hidden
          >
            {r.state === "active" ? <Timer className="size-4" /> : r.state === "pending" ? <span className="size-2 rounded-full bg-muted" /> : <Check className="size-4" strokeWidth={3} />}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold text-navy">{r.title}</span>
            <span className="block text-xs text-muted tabular">{r.detail}</span>
          </span>
          <span className="sr-only">({r.state})</span>
        </li>
      ))}
    </ol>
  );
}

/** Step 6 — "Are you okay?" — no response, the countdown completes. */
export function RiderCheckStep({
  ms,
  riderOk,
  onOk,
  onHelp,
  onContinue,
  onReplay,
}: {
  ms: number;
  riderOk: boolean;
  onOk: () => void;
  onHelp: () => void;
  onContinue: () => void;
  onReplay: () => void;
}) {
  const f = riderCheckFrame(ms);
  const phone = riderOk ? (
    <CancelledScreen onContinue={onContinue} onReplay={onReplay} />
  ) : f.expired ? (
    <NoResponseScreen />
  ) : (
    <RiderCheckScreen remaining={f.remaining} total={f.total} confidencePct={CRASH_PCT} onOk={onOk} onHelp={onHelp} announce={false} />
  );

  const rungs: Rung[] = [
    { title: `Possible severe crash · ${CRASH_PCT}%`, detail: "Verified across helmet, bike and phone", state: "done" },
    riderOk
      ? { title: "Rider check", detail: "Cancelled — rider confirmed OK", state: "cancelled" }
      : {
          title: `Rider check · ${f.total} s countdown`,
          detail: f.expired ? "No response" : `${Math.ceil(f.remaining)} s left · shortened for demo`,
          state: f.expired ? "done" : "active",
        },
    {
      title: "Emergency workflow",
      detail: riderOk ? "Not started" : "Simulated in this demo",
      state: riderOk ? "pending" : f.expired ? "active" : "pending",
    },
  ];

  return (
    <PhoneStage
      stepId="rider-check"
      phoneLabel="Rider's phone: rider check"
      phone={phone}
      panel={
        <div className="space-y-4">
          <Card className="p-5">
            <CardHeader kicker="Escalation policy" title="Ask the rider first" />
            <div className="mt-4">
              <Ladder rungs={rungs} />
            </div>
          </Card>
          <Card className="p-5">
            <Kicker>The rider stays in control</Kicker>
            <p className="mt-2 text-sm leading-relaxed text-body">
              One tap on <b className="text-navy">I’M OKAY</b> cancels the alert. <b className="text-navy">NEED HELP</b>{" "}
              escalates immediately. With no response, the phone starts the emergency workflow on its own.
            </p>
            <p className="mt-3 text-xs text-muted">
              Countdown shortened to {f.total} seconds for the demo. Try the buttons on the phone.
            </p>
          </Card>
        </div>
      }
    />
  );
}

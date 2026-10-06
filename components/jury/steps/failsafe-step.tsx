import { ShieldCheck } from "lucide-react";
import { Kicker, PhoneStage } from "@/components/jury/stage";
import { FailSafeSequence } from "@/components/safety/failsafe-sequence";
import { Badge, Card, CardHeader } from "@/components/ui/primitives";
import { BUFFER_SECONDS, HELMET_LOST_AT } from "@/lib/jury/demo-data";
import { DEVICE_COLORS, xFraction, type TraceDevice } from "@/lib/jury/playback";
import { failsafeStage } from "@/lib/jury/timeline";
import { keyframes } from "@/lib/simulation/series";
import { cn } from "@/lib/utils/cn";
import { fmtT } from "@/lib/utils/format";

const FROM = -BUFFER_SECONDS;
const TO = 10;

const LANES: { device: TraceDevice; label: string }[] = [
  { device: "helmet", label: "Helmet" },
  { device: "bike", label: "Bike module" },
  { device: "phone", label: "Phone" },
];

/** Event time (s) of the buffer's write head during this step. */
function writeHead(ms: number): number {
  return keyframes(ms / 1000, [
    [0, -1.5],
    [1.5, 0],
    [3.5, HELMET_LOST_AT],
    [5.5, HELMET_LOST_AT],
    [10, TO],
  ]);
}

function BufferTimeline({ ms }: { ms: number }) {
  const head = writeHead(ms);
  const zero = xFraction(0, FROM, TO) * 100;
  return (
    <div>
      <ul className="space-y-3">
        {LANES.map((l) => {
          const helmet = l.device === "helmet";
          const end = helmet ? Math.min(head, HELMET_LOST_AT) : head;
          const lost = helmet && head > HELMET_LOST_AT;
          return (
            <li key={l.device} className="grid grid-cols-[84px_minmax(0,1fr)] items-center gap-3">
              <span className="text-xs font-semibold text-navy">{l.label}</span>
              <span className="relative block h-4 overflow-hidden rounded-full bg-line-soft" aria-hidden>
                <span
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ width: `${xFraction(end, FROM, TO) * 100}%`, background: DEVICE_COLORS[l.device] }}
                />
                {lost && (
                  <span
                    className="absolute inset-y-0 bg-[repeating-linear-gradient(135deg,var(--color-crit-line)_0_4px,transparent_4px_8px)]"
                    style={{ left: `${xFraction(HELMET_LOST_AT, FROM, TO) * 100}%`, width: `${(xFraction(head, FROM, TO) - xFraction(HELMET_LOST_AT, FROM, TO)) * 100}%` }}
                  />
                )}
              </span>
              <span className="sr-only">
                {lost ? `Recorded until ${fmtT(HELMET_LOST_AT)}, then link lost` : `Recording, now at ${fmtT(Math.round(head * 10) / 10)}`}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="relative ml-[96px] mt-2 h-4 text-[11px] font-semibold text-muted tabular" aria-hidden>
        <span className="absolute left-0">{fmtT(FROM)}</span>
        <span className="absolute -translate-x-1/2 text-crit" style={{ left: `${zero}%` }}>
          Impact
        </span>
        <span className="absolute right-0 hidden sm:inline">{fmtT(TO)}</span>
      </div>
    </div>
  );
}

/** Step 8 — helmet connection lost → phone + bike continue the response. */
export function FailsafeStep({ ms }: { ms: number }) {
  const stage = failsafeStage(ms);
  const lost = stage >= 2;
  return (
    <PhoneStage
      stepId="failsafe"
      phoneLabel="Rider's phone: device links"
      phone={
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-2">
            <Kicker>Device links</Kicker>
            <Badge tone={lost ? "critical" : "success"}>{lost ? "Helmet offline" : "All linked"}</Badge>
          </div>
          <FailSafeSequence compact stage={stage} />
          <p className={cn("rounded-2xl px-3.5 py-3 text-sm font-semibold", stage >= 3 ? "bg-ok-bg text-ok" : "bg-surface text-muted")}>
            {stage >= 3 ? "Response continues on phone + bike." : "Watching device links…"}
          </p>
        </div>
      }
      panel={
        <div className="space-y-4">
          <Card className="p-5">
            <CardHeader
              kicker="Rolling pre-crash buffer on the phone"
              title={`The last ${BUFFER_SECONDS} seconds were already saved`}
              action={<Badge tone={stage >= 3 ? "success" : "info"}>{stage >= 3 ? "Buffer secured" : "Recording"}</Badge>}
            />
            <div className="mt-5">
              <BufferTimeline ms={ms} />
            </div>
          </Card>
          <Card className="p-5">
            <ul className="space-y-2.5 text-sm leading-relaxed text-body">
              <li>
                <b className="text-navy">Before impact:</b> the phone continuously stores the last {BUFFER_SECONDS} s from
                helmet, bike and phone.
              </li>
              <li>
                <b className="text-navy">At impact:</b> the helmet’s impact reading reached the phone before its link dropped
                at {fmtT(HELMET_LOST_AT)}.
              </li>
              <li>
                <b className="text-navy">After impact:</b> speed loss, bike rotation, phone deceleration and rider movement
                finish the verification — no helmet needed.
              </li>
            </ul>
            <p className="mt-4 flex items-start gap-2.5 rounded-2xl bg-navy px-4 py-3 text-sm font-semibold text-white">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
              The helmet does not need to survive the crash for RYVORA to respond.
            </p>
          </Card>
        </div>
      }
    />
  );
}

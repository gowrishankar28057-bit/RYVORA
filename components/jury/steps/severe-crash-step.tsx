import { ArrowRight } from "lucide-react";
import { PhoneStage } from "@/components/jury/stage";
import { EnginePanel, EvidenceStrip, SyncTraces } from "@/components/jury/sync-traces";
import { RideHud } from "@/components/ride/ride-hud";
import { VerdictCard } from "@/components/safety/crash-confidence-panel";
import { Badge, Card, CardHeader } from "@/components/ui/primitives";
import { CRASH_ASSESSMENT, CRASH_SERIES, HELMET_LOST_AT } from "@/lib/jury/demo-data";
import { crashSnapshot, streamUntil } from "@/lib/jury/playback";
import { analysisFrame, SEVERE_CRASH_TIMING } from "@/lib/jury/timeline";

const FROM = -8;
const TO = 3;
/** 2 s of 20 Hz samples on the HUD sparklines. */
const HUD_POINTS = 40;
/** Ride time on the HUD clock when the replay window opens. */
const RIDE_CLOCK_AT_FROM = 312;

function hudMessage(cursor: number): string {
  if (cursor > HELMET_LOST_AT) return "Impact on all devices — helmet link lost, verifying…";
  if (cursor >= -1.2) return "Bike rotation and rapid deceleration detected…";
  if (cursor >= -4) return "Hard braking — watching all devices.";
  return "RYVORA is monitoring your ride.";
}

function rateLabel(rate: number): string {
  if (rate === 0) return "Replay complete";
  if (rate < 1) return `Slow motion ${rate.toFixed(2)}×`;
  return `Replay ${rate.toFixed(rate % 1 ? 1 : 0)}×`;
}

/** Step 5 — every device agrees: severe crash. */
export function SevereCrashStep({ ms }: { ms: number }) {
  const f = analysisFrame(ms, SEVERE_CRASH_TIMING);
  const phone =
    f.phase === "verdict" ? (
      <div className="space-y-3 p-3">
        <VerdictCard assessment={CRASH_ASSESSMENT} compact />
        <p className="flex items-center gap-2 rounded-2xl bg-surface px-3.5 py-3 text-sm font-semibold text-navy">
          <ArrowRight className="size-4 shrink-0 text-brand" aria-hidden />
          Next: ask the rider before escalating.
        </p>
      </div>
    ) : (
      <div className="p-3">
        <RideHud
          compact
          snapshot={crashSnapshot(CRASH_SERIES, f.cursor)}
          durationSec={RIDE_CLOCK_AT_FROM + Math.max(0, f.cursor - FROM)}
          streams={{
            helmet: streamUntil(CRASH_SERIES, f.cursor, "helmetAccelG", HUD_POINTS),
            bike: streamUntil(CRASH_SERIES, f.cursor, "bikeAccelG", HUD_POINTS),
            phone: streamUntil(CRASH_SERIES, f.cursor, "phoneAccelG", HUD_POINTS),
          }}
          message={f.phase === "verify" ? "Verifying across helmet, bike and phone…" : hudMessage(f.cursor)}
        />
      </div>
    );

  return (
    <PhoneStage
      stepId="severe-crash"
      phone={phone}
      panel={
        f.phase === "stream" ? (
          <Card className="p-5">
            <CardHeader
              kicker="Synchronized replay · simulated sensor data"
              title="Speed, helmet, bike, rotation, phone"
              action={<Badge tone={f.rate > 0 && f.rate < 1 ? "dark" : "info"}>{rateLabel(f.rate)}</Badge>}
            />
            <div className="mt-4">
              <SyncTraces series={CRASH_SERIES} from={FROM} to={TO} cursor={f.cursor} />
            </div>
          </Card>
        ) : (
          <Card className="space-y-5 p-5 motion-safe:animate-fade-up">
            <CardHeader kicker="Event window" title="All devices changed in the same second." />
            <EvidenceStrip series={CRASH_SERIES} from={FROM} to={TO} />
            <EnginePanel assessment={CRASH_ASSESSMENT} frame={f} />
          </Card>
        )
      }
    />
  );
}

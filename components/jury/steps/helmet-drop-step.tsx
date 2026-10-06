import { Loader2, Motorbike, Smartphone } from "lucide-react";
import { HelmetIcon } from "@/components/brand/icons";
import { Kicker, PhoneStage } from "@/components/jury/stage";
import { EnginePanel, EvidenceStrip, SyncTraces } from "@/components/jury/sync-traces";
import { VerdictCard } from "@/components/safety/crash-confidence-panel";
import { Sparkline } from "@/components/sensors/sparkline";
import { Badge, Card, CardHeader } from "@/components/ui/primitives";
import { DROP_ASSESSMENT, DROP_SERIES } from "@/lib/jury/demo-data";
import { DEVICE_COLORS, peakOf, sampleAt, sliceBetween, streamUntil, type ChannelKey, type TraceDevice } from "@/lib/jury/playback";
import { analysisFrame, HELMET_DROP_TIMING, type AnalysisFrame } from "@/lib/jury/timeline";
import { cn } from "@/lib/utils/cn";
import { fmt } from "@/lib/utils/format";

const FROM = -4;
const TO = 2;
/** 3 s of 20 Hz samples on the phone sparklines. */
const PHONE_POINTS = 60;

const MONITOR: { device: TraceDevice; label: string; key: ChannelKey; max: number; icon: React.ReactNode }[] = [
  { device: "helmet", label: "Helmet", key: "helmetAccelG", max: 70, icon: <HelmetIcon className="size-4" /> },
  { device: "bike", label: "Bike module", key: "bikeAccelG", max: 7, icon: <Motorbike className="size-4" aria-hidden /> },
  { device: "phone", label: "Phone", key: "phoneAccelG", max: 4, icon: <Smartphone className="size-4" aria-hidden /> },
];

function DropPhone({ f }: { f: AnalysisFrame }) {
  const now = sampleAt(DROP_SERIES, f.cursor);
  const helmetPeak = peakOf(sliceBetween(DROP_SERIES, FROM, f.cursor), "helmetAccelG");
  return (
    <div className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Kicker>Bike parked</Kicker>
          <p className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-navy tabular">
            {fmt(now?.speedKmh, 0)} <span className="text-sm font-semibold text-muted">km/h</span>
          </p>
        </div>
        <Badge tone="neutral">Helmet not worn</Badge>
      </div>
      {f.impacted && f.phase !== "verdict" && (
        <p className="flex items-center gap-2 rounded-2xl border border-warn-line bg-warn-bg px-3 py-2.5 text-sm font-semibold text-warn">
          <Loader2 className="size-4 shrink-0 motion-safe:animate-spin" aria-hidden />
          Helmet impact {fmt(helmetPeak, 0)} g — cross-checking bike and phone…
        </p>
      )}
      {f.phase === "verdict" && <VerdictCard assessment={DROP_ASSESSMENT} compact />}
      <ul className="space-y-2">
        {MONITOR.map((m) => {
          const value = now?.[m.key] ?? null;
          const spiking = m.device === "helmet" && value !== null && value > 5;
          return (
            <li key={m.device} className={cn("rounded-2xl border px-3 py-2", spiking ? "border-warn-line bg-warn-bg" : "border-line-soft bg-white")}>
              <div className="flex items-center justify-between text-xs font-semibold text-navy">
                <span className="flex items-center gap-1.5">
                  {m.icon}
                  {m.label}
                </span>
                <span className="tabular">{value === null ? "Unavailable" : `${fmt(value, 2)} g`}</span>
              </div>
              <Sparkline
                values={streamUntil(DROP_SERIES, f.cursor, m.key, PHONE_POINTS)}
                min={0}
                max={m.max}
                stroke={DEVICE_COLORS[m.device]}
                label={`${m.label} acceleration`}
                className="mt-1 h-9"
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Step 4 — helmet impact alone is not a crash. */
export function HelmetDropStep({ ms }: { ms: number }) {
  const f = analysisFrame(ms, HELMET_DROP_TIMING);
  return (
    <PhoneStage
      stepId="helmet-drop"
      phone={<DropPhone f={f} />}
      panel={
        f.phase === "stream" ? (
          <Card className="p-5">
            <CardHeader
              kicker="Synchronized replay · same scales as a real crash"
              title="Only the helmet moves"
              action={<Badge tone="info">Real time</Badge>}
            />
            <div className="mt-4">
              <SyncTraces series={DROP_SERIES} from={FROM} to={TO} cursor={f.cursor} />
            </div>
          </Card>
        ) : (
          <Card className="space-y-5 p-5 motion-safe:animate-fade-up">
            <CardHeader kicker="Event window" title="One device spiked. The others stayed calm." />
            <EvidenceStrip series={DROP_SERIES} from={FROM} to={TO} />
            <EnginePanel assessment={DROP_ASSESSMENT} frame={f} />
          </Card>
        )
      }
    />
  );
}

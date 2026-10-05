import { Clock, MapPin, Motorbike, Smartphone } from "lucide-react";
import { HelmetIcon } from "@/components/brand/icons";
import { SensorCharts } from "@/components/reconstruction/sensor-charts";
import { EventTimeline } from "@/components/safety/event-timeline";
import { VerdictCard } from "@/components/safety/crash-confidence-panel";
import { Card, CardHeader, SimLabel } from "@/components/ui/primitives";
import { INCIDENT } from "@/data/rider";
import { assessEvent } from "@/lib/engine/crash-confidence";
import { SCENARIO_MAP } from "@/lib/simulation/scenarios";
import { downsample } from "@/lib/simulation/series";
import { fmtDateTime } from "@/lib/utils/format";

export function ReconstructionView({ compact = false }: { compact?: boolean }) {
  const s = SCENARIO_MAP["severe-crash"];
  const a = assessEvent(s.input);
  const data = downsample(s.series(), 2);
  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <VerdictCard assessment={a} compact={compact} />
        <Card className="p-5">
          <CardHeader kicker={INCIDENT.id} title="Incident summary" action={<SimLabel>Simulated incident</SimLabel>} />
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm lg:grid-cols-4">
            <div><dt className="flex items-center gap-1 text-xs text-muted"><Clock className="size-3.5" />Timestamp</dt><dd className="font-bold text-navy">{fmtDateTime(INCIDENT.occurredAt)} IST</dd></div>
            <div><dt className="flex items-center gap-1 text-xs text-muted"><MapPin className="size-3.5" />Approx. location</dt><dd className="font-bold text-navy">{INCIDENT.location.label}</dd></div>
            <div><dt className="text-xs text-muted">Classification</dt><dd className="font-bold text-crit">Severe crash</dd></div>
            <div><dt className="text-xs text-muted">Device status</dt><dd className="flex flex-wrap gap-2 font-semibold text-navy"><span className="flex items-center gap-1 text-crit"><HelmetIcon className="size-3.5" />lost T+0.1</span><span className="flex items-center gap-1 text-ok"><Motorbike className="size-3.5" />ok</span><span className="flex items-center gap-1 text-ok"><Smartphone className="size-3.5" />ok</span></dd></div>
          </dl>
        </Card>
      </div>
      <Card className="p-5"><CardHeader kicker="Digital black box" title="Understand the seconds that mattered." /><div className="mt-4"><EventTimeline entries={s.timeline} horizontal /></div></Card>
      <SensorCharts data={data} />
      <Card className="p-5">
        <CardHeader kicker="AI explanation" title="Why RYVORA raised confidence" />
        <p className="mt-2 text-sm text-body">Crash confidence increased because a helmet impact, rapid motorcycle deceleration, bike rotation and phone movement occurred within the same event window.</p>
        <ul className="mt-3 space-y-1 text-sm text-body">{a.reasons.map((r) => <li key={r}>• {r}</li>)}</ul>
        <p className="mt-3 text-xs text-muted">Automated, rule-based summary of simulated sensor data. Not a medical, legal or insurance determination.</p>
      </Card>
    </div>
  );
}

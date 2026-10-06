import { cn } from "@/lib/utils/cn";
import { AiExplanation, SignalContributionTable } from "./incident-analysis";
import { DeviceStatusCard, IncidentHeader } from "./incident-header";
import { buildIncident, tableRows } from "./incident-model";
import { IncidentWorkspace } from "./incident-workspace";

/** Fully deterministic, so it is derived once per module instance. */
const RECON_INCIDENT = buildIncident();
const TABLE_ROWS = tableRows(RECON_INCIDENT);

/**
 * Desktop crash-reconstruction dashboard (SIMULATED incident).
 * Mobile: everything stacks. `lg`+: richer two-column chart grid. `xl`+: 12-column layout.
 * `compact` trims chrome so it fits the jury demo's laptop frame.
 */
export function ReconstructionView({ compact = false }: { compact?: boolean }) {
  const incident = RECON_INCIDENT;
  const gap = compact ? "gap-4" : "gap-4 sm:gap-5";
  return (
    <div className={cn("grid min-w-0 grid-cols-1", gap)}>
      <div className={cn("grid min-w-0 grid-cols-1 xl:grid-cols-12", gap)}>
        <IncidentHeader incident={incident} compact={compact} className="min-w-0 xl:col-span-8" />
        <DeviceStatusCard devices={incident.devices} className="min-w-0 xl:col-span-4" />
      </div>

      <IncidentWorkspace
        timeline={incident.timeline}
        samples={incident.samples}
        markers={incident.markers}
        tableRows={TABLE_ROWS}
        helmetLinkLostT={incident.helmetLinkLostT}
        bufferSeconds={incident.bufferSeconds}
        compact={compact}
      />

      <div className={cn("grid min-w-0 grid-cols-1 xl:grid-cols-12", gap)}>
        <SignalContributionTable assessment={incident.assessment} classLabel={incident.classLabel} className="min-w-0 xl:col-span-7" />
        <AiExplanation
          explanation={incident.explanation}
          severe={incident.assessment.eventClass === "SEVERE_CRASH"}
          className="min-w-0 xl:col-span-5"
        />
      </div>
    </div>
  );
}

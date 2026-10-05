import { Badge, type Tone } from "@/components/ui/primitives";
import type { EventClass, RiskLevel } from "@/lib/types/events";

const RISK: Record<RiskLevel, { tone: Tone; label: string }> = {
  none: { tone: "success", label: "No risk" },
  low: { tone: "info", label: "Low risk" },
  medium: { tone: "warning", label: "Medium risk" },
  high: { tone: "critical", label: "High risk" },
};

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  const r = RISK[risk];
  return <Badge tone={r.tone}>{r.label}</Badge>;
}

export const CLASS_TONE: Record<EventClass, Tone> = {
  NORMAL: "success",
  POTHOLE: "info",
  HARD_BRAKING: "info",
  HELMET_DROP: "success",
  BIKE_FALL: "warning",
  MINOR_INCIDENT: "warning",
  SEVERE_CRASH: "critical",
};

export function ClassBadge({ eventClass }: { eventClass: EventClass }) {
  return <Badge tone={CLASS_TONE[eventClass]}>{eventClass.replace("_", " ")}</Badge>;
}

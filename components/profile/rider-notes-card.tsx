import { NotebookPen } from "lucide-react";
import { Badge, Card, CardHeader } from "@/components/ui/primitives";
import { RIDER } from "@/data/rider";

/** Rider-entered notes that would travel with an incident package. Not a medical record. */
export function RiderNotesCard() {
  const items = RIDER.noteItems;
  return (
    <Card className="p-5">
      <CardHeader kicker="Incident package" title="Rider notes" action={<Badge tone="neutral">Rider-entered</Badge>} />
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{RIDER.notes || "No notes added."}</p>
      ) : (
        <dl className="mt-3 divide-y divide-line-soft rounded-2xl border border-line-soft">
          {items.map((n) => (
            <div key={n.label} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 px-3.5 py-3 text-sm">
              <dt className="text-muted">{n.label}</dt>
              <dd className="font-semibold text-navy">{n.value || "—"}</dd>
            </div>
          ))}
        </dl>
      )}
      <p className="mt-3 flex gap-2 text-xs leading-relaxed text-muted">
        <NotebookPen className="mt-0.5 size-4 shrink-0" aria-hidden />
        Rider-entered, not a medical record. RYVORA does not verify this information or provide medical diagnosis.
      </p>
    </Card>
  );
}

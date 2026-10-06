import { Info } from "lucide-react";
import { Badge, Card, CardHeader, SimLabel } from "@/components/ui/primitives";
import { RIDER } from "@/data/rider";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/** Last visible digits of an already-masked number, for screen readers. */
function lastDigits(phone: string) {
  return phone.match(/(\d+)\s*$/)?.[1] ?? null;
}

/** DEMO emergency contacts with masked numbers. Nothing is ever sent from the prototype. */
export function EmergencyContactsCard() {
  const contacts = [...RIDER.contacts].sort((a, b) => Number(b.primary) - Number(a.primary));
  return (
    <Card className="p-5">
      <CardHeader kicker="Emergency" title="Emergency contacts" action={<SimLabel>Demo data</SimLabel>} />
      {contacts.length === 0 ? (
        <p className="mt-3 rounded-2xl bg-surface p-4 text-sm text-muted">No emergency contacts added.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {contacts.map((c) => {
            const last = lastDigits(c.phone);
            return (
              <li key={c.name} className="flex items-center gap-3 rounded-2xl border border-line-soft bg-white p-3">
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-sm font-bold text-brand-600"
                  aria-hidden
                >
                  {initials(c.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-semibold text-navy">{c.name}</span>
                    {c.primary && <Badge tone="info">Primary</Badge>}
                  </p>
                  <p className="text-xs text-muted">
                    {c.relation} ·{" "}
                    <span className="tabular" aria-hidden>
                      {c.phone}
                    </span>
                    <span className="sr-only">{last ? `masked number ending in ${last.split("").join(" ")}` : "masked number"}</span>
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 flex gap-2 rounded-2xl bg-surface p-3 text-xs leading-relaxed text-body">
        <Info className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
        Contacts are only notified in the real product; this demo never sends messages.
      </p>
    </Card>
  );
}

import { CalendarDays, Cpu, MapPin, Motorbike } from "lucide-react";
import { HelmetIcon } from "@/components/brand/icons";
import { Card } from "@/components/ui/primitives";
import { RIDER } from "@/data/rider";

/** Rider identity, equipment and lifetime stats. */
export function RiderIdentityCard() {
  const equipment = [
    { label: "Motorcycle", value: RIDER.motorcycle, Icon: Motorbike },
    { label: "Helmet", value: RIDER.helmet, Icon: HelmetIcon },
    { label: "Bike module", value: RIDER.bikeModule, Icon: Cpu },
  ];
  const stats = [
    { label: "Rides", value: RIDER.stats.rides.toLocaleString("en-IN") },
    { label: "Distance", value: RIDER.stats.distanceKm.toLocaleString("en-IN"), unit: "km" },
    { label: "Safe streak", value: String(RIDER.stats.safeStreakDays), unit: "days" },
  ];

  return (
    <Card className="overflow-hidden">
      <div className="bg-grid border-b border-line bg-brand-50/60 p-5">
        <div className="flex items-center gap-4">
          <span
            className="grid size-16 shrink-0 place-items-center rounded-2xl bg-navy font-[family-name:var(--font-display)] text-xl font-extrabold text-white shadow-[var(--shadow-lift)]"
            aria-hidden
          >
            {RIDER.initials}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-extrabold">{RIDER.name}</h2>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-body">
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="size-3.5 text-muted" aria-hidden />
                Member since {RIDER.memberSince}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5 text-muted" aria-hidden />
                {RIDER.homeCity}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="p-5">
        <dl className="space-y-2.5">
          {equipment.map(({ label, value, Icon }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface text-navy">
                <Icon className="size-[18px]" aria-hidden />
              </span>
              <div className="min-w-0">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</dt>
                <dd className="truncate text-sm font-semibold text-navy">{value}</dd>
              </div>
            </div>
          ))}
        </dl>

        <dl className="mt-5 grid grid-cols-3 gap-2.5" aria-label="Lifetime stats">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-surface p-3">
              <dt className="text-[11px] leading-tight text-muted">{s.label}</dt>
              <dd className="mt-1 font-[family-name:var(--font-display)] text-lg font-extrabold leading-none text-navy tabular">
                {s.value}
                {s.unit && <span className="ml-1 text-xs font-semibold text-muted">{s.unit}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Card>
  );
}

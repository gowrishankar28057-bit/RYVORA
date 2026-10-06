import { useId } from "react";
import { AlertTriangle, Battery, BatteryFull, BatteryLow, BatteryMedium, Info, OctagonAlert } from "lucide-react";
import { Badge, Card, SimLabel, StatusDot, type Tone } from "@/components/ui/primitives";
import { cn } from "@/lib/utils/cn";

/** Tones a diagnostic value can take. `neutral` = unavailable / not applicable. */
export type HealthTone = Extract<Tone, "success" | "info" | "warning" | "critical" | "neutral">;

export interface HealthRow {
  label: string;
  value: string;
  tone: HealthTone;
  /** Secondary line under the value, e.g. a quality descriptor. */
  hint?: string;
}

export interface HealthStatus {
  tone: HealthTone;
  label: string;
}

export const LOW_BATTERY_PCT = 20;

const VALUE_TEXT: Record<HealthTone, string> = {
  success: "text-navy",
  info: "text-brand-600",
  warning: "text-warn",
  critical: "text-crit",
  neutral: "text-muted",
};

function HealthRowItem({ row }: { row: HealthRow }) {
  const showDot = row.tone === "success" || row.tone === "warning" || row.tone === "critical";
  return (
    <div className="flex min-h-11 items-start justify-between gap-3 border-b border-line-soft py-2.5 last:border-b-0">
      <dt className="pt-px text-sm text-muted">{row.label}</dt>
      <dd className="min-w-0 text-right">
        <span className={cn("inline-flex items-center gap-1.5 text-sm font-bold tabular", VALUE_TEXT[row.tone])}>
          {showDot && <StatusDot tone={row.tone} />}
          {row.value}
        </span>
        {row.hint && <span className="block text-xs text-muted">{row.hint}</span>}
      </dd>
    </div>
  );
}

/** Battery level with a bar; warns below {@link LOW_BATTERY_PCT}. Renders "Unavailable" for null. */
export function BatteryBar({ pct, label = "Battery", className }: { pct: number | null; label?: string; className?: string }) {
  const known = pct !== null && Number.isFinite(pct);
  const value = known ? Math.round(Math.min(100, Math.max(0, pct))) : 0;
  const low = known && value < LOW_BATTERY_PCT;
  const Icon = !known ? Battery : low ? BatteryLow : value >= 80 ? BatteryFull : BatteryMedium;
  return (
    <div className={cn("rounded-2xl border border-line-soft bg-surface px-3.5 py-3", low && "border-warn-line bg-warn-bg", className)}>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="flex items-center gap-1.5 font-semibold text-navy">
          <Icon className={cn("size-4", low ? "text-warn" : "text-muted")} aria-hidden />
          {label}
        </span>
        <span className={cn("font-bold tabular", low ? "text-warn" : known ? "text-navy" : "text-muted")}>
          {known ? `${value} %` : "Unavailable"}
        </span>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-line-soft"
        {...(known
          ? { role: "meter", "aria-label": label, "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": value, "aria-valuetext": `${value} percent${low ? ", low" : ""}` }
          : { "aria-hidden": true })}
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-500", low ? "bg-[#f79009]" : "bg-brand")}
          style={{ width: `${value}%` }}
        />
      </div>
      {low && <p className="mt-1.5 text-xs font-semibold text-warn">Low battery — charge before your next ride.</p>}
    </div>
  );
}

const WARNING_STYLE = {
  critical: { box: "border-crit-line bg-crit-bg", title: "text-crit", Icon: OctagonAlert },
  warning: { box: "border-warn-line bg-warn-bg", title: "text-warn", Icon: AlertTriangle },
  info: { box: "border-brand-100 bg-brand-50", title: "text-brand-600", Icon: Info },
} as const;

/** Inline diagnostic message for the card's warning slot. */
export function HealthWarning({
  tone,
  title,
  children,
}: {
  tone: keyof typeof WARNING_STYLE;
  title: string;
  children?: React.ReactNode;
}) {
  const { box, title: titleColor, Icon } = WARNING_STYLE[tone];
  return (
    <div className={cn("flex gap-2.5 rounded-2xl border px-3.5 py-3", box)}>
      <Icon className={cn("mt-0.5 size-4 shrink-0", titleColor)} aria-hidden />
      <div className="min-w-0 text-sm">
        <p className={cn("font-extrabold tracking-wide", titleColor)}>{title}</p>
        {children && <div className="mt-0.5 leading-snug text-navy">{children}</div>}
      </div>
    </div>
  );
}

/**
 * Diagnostic card for one hardware module: header with overall status,
 * optional warnings and battery bar, then label/value rows.
 */
export function DeviceHealthCard({
  title,
  subtitle,
  icon,
  status,
  rows,
  battery,
  warnings,
  footer,
  simulated = true,
  columns = 1,
  className,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  status: HealthStatus;
  rows: HealthRow[];
  battery?: { pct: number | null; label?: string };
  /** Slot for {@link HealthWarning}s. */
  warnings?: React.ReactNode;
  footer?: React.ReactNode;
  simulated?: boolean;
  /** Two-column rows from `sm` up, for cards that span the grid. */
  columns?: 1 | 2;
  className?: string;
}) {
  const titleId = useId();
  return (
    <Card aria-labelledby={titleId} className={cn("flex min-w-0 flex-col p-4 sm:p-5", className)}>
      <header className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand-50 text-navy" aria-hidden>
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="text-base font-bold leading-tight">
            {title}
          </h2>
          {subtitle && <p className="mt-0.5 truncate text-xs text-muted">{subtitle}</p>}
        </div>
        <Badge tone={status.tone} className="mt-0.5">
          <StatusDot tone={status.tone} />
          {status.label}
        </Badge>
      </header>

      {warnings && <div className="mt-4 space-y-2">{warnings}</div>}
      {battery && <BatteryBar pct={battery.pct} label={battery.label} className="mt-4" />}

      <dl className={cn("mt-2", columns === 2 && "sm:grid sm:grid-cols-2 sm:gap-x-8 sm:[&>div:nth-last-child(2):nth-child(odd)]:border-b-0")}>
        {rows.map((row) => (
          <HealthRowItem key={row.label} row={row} />
        ))}
      </dl>

      {(footer || simulated) && (
        <footer className="mt-auto flex items-center justify-between gap-2 border-t border-line-soft pt-3 text-xs text-muted">
          <span className="min-w-0 truncate">{footer}</span>
          {simulated && <SimLabel />}
        </footer>
      )}
    </Card>
  );
}

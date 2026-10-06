import { Cpu, Motorbike, Smartphone } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { HelmetIcon } from "@/components/brand/icons";
import type { TimelineEntry } from "@/lib/types/events";
import { cn } from "@/lib/utils/cn";
import { fmtT } from "@/lib/utils/format";

type EntryTone = NonNullable<TimelineEntry["tone"]>;
type EntryDevice = NonNullable<TimelineEntry["device"]>;

const DEVICE_NAME: Record<EntryDevice, string> = { helmet: "Helmet", bike: "Bike", phone: "Phone", system: "System" };

function DeviceIcon({ device, className }: { device: EntryDevice; className: string }) {
  switch (device) {
    case "helmet":
      return <HelmetIcon className={className} />;
    case "bike":
      return <Motorbike className={className} aria-hidden />;
    case "phone":
      return <Smartphone className={className} aria-hidden />;
    default:
      return <Cpu className={className} aria-hidden />;
  }
}

/** Soft marker per tone; the primary event (T = 0) gets the solid variant. */
const MARKER: Record<EntryTone, { soft: string; solid: string; time: string }> = {
  neutral: { soft: "border-line bg-white text-muted", solid: "border-navy bg-navy text-white ring-brand-50", time: "text-muted" },
  info: { soft: "border-brand-100 bg-brand-50 text-brand-600", solid: "border-brand-600 bg-brand-600 text-white ring-brand-50", time: "text-brand-600" },
  success: { soft: "border-ok-line bg-ok-bg text-ok", solid: "border-ok bg-ok text-white ring-ok-bg", time: "text-ok" },
  warning: { soft: "border-warn-line bg-warn-bg text-warn", solid: "border-warn bg-warn text-white ring-warn-bg", time: "text-warn" },
  critical: { soft: "border-crit-line bg-crit-bg text-crit", solid: "border-crit-strong bg-crit-strong text-white ring-crit-bg", time: "text-crit" },
};

function fmtGap(seconds: number): string {
  const v = Math.round(Math.abs(seconds) * 10) / 10;
  return `+${Number.isInteger(v) ? v.toFixed(0) : v.toFixed(1)} s`;
}

/**
 * Digital black-box timeline.
 *
 * Vertical rail on mobile (and whenever `horizontal` is false). With `horizontal`, it becomes an
 * evenly spaced track from `lg` up, so the dense cluster around impact stays readable; the real
 * gap between events is printed on each segment. Rendered as an ordered list.
 *
 * `activeIndex` highlights one entry (e.g. synced to a chart cursor): earlier entries read as
 * reached, later ones are dimmed. `-1` means the cursor is before the first entry.
 */
export function EventTimeline({
  entries,
  horizontal = false,
  activeIndex,
  compact = false,
  label = "Event timeline",
  className,
}: {
  entries: TimelineEntry[];
  horizontal?: boolean;
  activeIndex?: number | null;
  compact?: boolean;
  label?: string;
  className?: string;
}) {
  if (entries.length === 0) {
    return <p className="rounded-2xl border border-dashed border-line bg-surface px-4 py-3 text-sm text-muted">No timeline events recorded.</p>;
  }

  const h = horizontal;
  const tracking = activeIndex !== undefined && activeIndex !== null;
  const style = { "--tl-cols": String(entries.length) } as CSSProperties;

  return (
    <ol
      aria-label={label}
      style={style}
      className={cn(h && "lg:grid lg:grid-cols-[repeat(var(--tl-cols),minmax(0,1fr))]", className)}
    >
      {entries.map((e, i) => {
        const tone = MARKER[e.tone ?? "neutral"];
        const device = e.device ?? "system";
        const primary = e.t === 0;
        const active = tracking && i === activeIndex;
        const reached = !tracking || i <= (activeIndex ?? 0);
        const next = entries[i + 1];
        const segmentDone = tracking && next !== undefined && i + 1 <= (activeIndex ?? -1);

        let connector: ReactNode = null;
        if (next) {
          connector = (
            <>
              <span
                aria-hidden
                className={cn(
                  "absolute w-px transition-colors",
                  compact ? "left-[13.5px] top-7" : "left-[17.5px] top-9",
                  "bottom-0",
                  h && (compact ? "lg:left-1/2 lg:top-[13.5px]" : "lg:left-1/2 lg:top-[17.5px]"),
                  h && "lg:bottom-auto lg:h-px lg:w-full",
                  segmentDone ? "bg-brand" : "bg-line",
                )}
              />
              {h && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-full hidden -translate-x-1/2 rounded-full bg-white px-1.5 text-[10px] font-semibold leading-4 text-muted tabular lg:block",
                    compact ? "top-[5.5px]" : "top-[9.5px]",
                  )}
                >
                  {fmtGap(next.t - e.t)}
                </span>
              )}
            </>
          );
        }

        return (
          <li
            key={`${e.t}-${e.title}`}
            aria-current={active ? "step" : undefined}
            className={cn(
              "relative grid gap-x-3 transition-opacity duration-200",
              compact ? "grid-cols-[28px_minmax(0,1fr)] pb-3.5" : "grid-cols-[36px_minmax(0,1fr)] pb-5",
              "last:pb-0",
              h && "lg:flex lg:flex-col lg:items-center lg:px-2 lg:pb-0 lg:text-center",
              !reached && "opacity-45",
            )}
          >
            {connector}
            <span
              aria-hidden
              className={cn(
                "relative z-10 grid place-items-center rounded-full border transition-shadow",
                compact ? "size-7" : "size-9",
                primary ? cn(tone.solid, "ring-4") : tone.soft,
                active && !primary && "ring-4 ring-brand-100",
                active && primary && "shadow-[0_0_0_7px_var(--color-brand-100)]",
              )}
            >
              <DeviceIcon device={device} className={compact ? "size-3.5" : "size-4"} />
            </span>
            <div className={cn("min-w-0", compact ? "pt-0.5" : "pt-1", h && (compact ? "lg:mt-2 lg:pt-0" : "lg:mt-3 lg:pt-0"))}>
              <p
                className={cn(
                  "flex flex-wrap items-baseline gap-x-1.5 text-[11px] font-bold uppercase tracking-wider tabular",
                  h && "lg:justify-center",
                )}
              >
                <span className={primary || e.tone === "critical" ? tone.time : "text-navy"}>{fmtT(e.t)}</span>
                <span className={cn("font-semibold text-muted", h && "lg:sr-only")}>· {DEVICE_NAME[device]}</span>
              </p>
              <p className={cn("font-bold leading-snug text-navy", compact ? "text-[13px]" : "text-sm", h && "lg:text-[13px]", active && "text-brand-600")}>{e.title}</p>
              {e.detail && <p className={cn("leading-snug text-muted", compact ? "text-[11px]" : "text-xs", h && "lg:mt-0.5")}>{e.detail}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

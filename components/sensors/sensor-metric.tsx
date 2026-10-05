import { cn } from "@/lib/utils/cn";
import { DASH } from "@/lib/utils/format";

export function SensorMetric({
  label,
  value,
  unit,
  hint,
  icon,
  tone = "default",
  className,
  children,
}: {
  label: string;
  value: string | number | null;
  unit?: string;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "default" | "dark";
  className?: string;
  children?: React.ReactNode;
}) {
  const unavailable = value === null || value === DASH;
  return (
    <div
      className={cn(
        "rounded-2xl border p-3.5",
        tone === "dark" ? "border-white/10 bg-white/5" : "border-line bg-white",
        className,
      )}
    >
      <div className={cn("flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em]", tone === "dark" ? "text-white/60" : "text-muted")}>
        {icon}
        {label}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span
          className={cn(
            "font-[family-name:var(--font-display)] text-xl font-extrabold tabular",
            tone === "dark" ? "text-white" : "text-navy",
            unavailable && "text-base font-semibold opacity-70",
          )}
        >
          {unavailable ? "Unavailable" : value}
        </span>
        {!unavailable && unit && <span className={cn("text-xs font-semibold", tone === "dark" ? "text-white/60" : "text-muted")}>{unit}</span>}
      </div>
      {hint && <div className={cn("mt-0.5 text-xs", tone === "dark" ? "text-white/55" : "text-muted")}>{hint}</div>}
      {children}
    </div>
  );
}

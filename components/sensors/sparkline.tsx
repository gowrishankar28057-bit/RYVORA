import { cn } from "@/lib/utils/cn";

/** Lightweight SVG sparkline for live streams (cheaper than a chart library at 8 Hz). */
export function Sparkline({
  values,
  min,
  max,
  className,
  stroke = "var(--color-brand)",
  fill = true,
  label,
}: {
  values: (number | null)[];
  min?: number;
  max?: number;
  className?: string;
  stroke?: string;
  fill?: boolean;
  label: string;
}) {
  const w = 200;
  const h = 56;
  const clean = values.map((v) => (v === null || Number.isNaN(v) ? null : v));
  const nums = clean.filter((v): v is number => v !== null);
  if (nums.length < 2) {
    return (
      <div className={cn("grid h-14 place-items-center rounded-xl bg-surface text-xs text-muted", className)} role="img" aria-label={`${label}: no data`}>
        No data
      </div>
    );
  }
  const lo = min ?? Math.min(...nums);
  const hi = Math.max(max ?? Math.max(...nums), lo + 1e-6);
  const step = w / Math.max(1, clean.length - 1);
  let d = "";
  let pen = false;
  clean.forEach((v, i) => {
    if (v === null) {
      pen = false;
      return;
    }
    const x = i * step;
    const y = h - 4 - ((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * (h - 8);
    d += `${pen ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
    pen = true;
  });
  const area = fill && !clean.includes(null) ? `${d}L${w},${h}L0,${h}Z` : null;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={cn("h-14 w-full", className)} role="img" aria-label={label}>
      {area && <path d={area} fill={stroke} opacity={0.08} />}
      <path d={d} fill="none" stroke={stroke} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

export const DASH = "—";

export function fmt(value: number | null | undefined, digits = 0, unit = ""): string {
  if (value === null || value === undefined || Number.isNaN(value)) return DASH;
  const s = value.toFixed(digits);
  return unit ? `${s} ${unit}` : s;
}

export function fmtDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function fmtT(t: number): string {
  if (t === 0) return "T = 0";
  const abs = Math.abs(t);
  const v = Number.isInteger(abs) ? abs.toFixed(0) : abs.toFixed(1);
  return `T ${t < 0 ? "−" : "+"} ${v} s`;
}

export function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  });
}

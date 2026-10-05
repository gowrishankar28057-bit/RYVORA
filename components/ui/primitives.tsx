import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success" | "dark";
type Size = "sm" | "md" | "lg" | "xl";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-navy-700 shadow-[0_8px_20px_-10px_rgb(22_119_255/0.7)]",
  secondary: "bg-white text-navy border border-line hover:border-brand hover:bg-brand-50",
  ghost: "text-navy hover:bg-brand-50",
  danger: "bg-crit-strong text-white hover:bg-crit",
  success: "bg-ok text-white hover:brightness-110",
  dark: "bg-navy text-white hover:bg-navy-800",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm rounded-xl gap-1.5",
  md: "h-11 px-5 text-[15px] rounded-xl gap-2",
  lg: "h-13 px-6 text-base rounded-2xl gap-2",
  xl: "h-16 px-8 text-lg rounded-2xl gap-3 tracking-wide",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex select-none items-center justify-center font-semibold font-[family-name:var(--font-display)] transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export function Button({
  variant,
  size,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button type="button" className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  href,
  variant,
  size,
  className,
  children,
  ...rest
}: { href: string; variant?: Variant; size?: Size; className?: string; children: React.ReactNode } & Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
>) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}

export function Card({
  className,
  as: Tag = "section",
  ...props
}: React.HTMLAttributes<HTMLElement> & { as?: "section" | "div" | "article" | "li" }) {
  return (
    <Tag
      className={cn("rounded-3xl border border-line bg-white shadow-[var(--shadow-card)]", className)}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  kicker,
  action,
  className,
}: {
  title: React.ReactNode;
  kicker?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        {kicker && <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{kicker}</p>}
        <h2 className="text-base font-bold text-navy">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export type Tone = "neutral" | "info" | "success" | "warning" | "critical" | "dark";

const BADGE_TONES: Record<Tone, string> = {
  neutral: "bg-surface text-body border-line",
  info: "bg-brand-50 text-brand-600 border-brand-100",
  success: "bg-ok-bg text-ok border-ok-line",
  warning: "bg-warn-bg text-warn border-warn-line",
  critical: "bg-crit-bg text-crit border-crit-line",
  dark: "bg-navy text-white border-navy",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em]",
        BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const DOT_TONES: Record<Tone, string> = {
  neutral: "bg-muted",
  info: "bg-brand",
  success: "bg-[#12b76a]",
  warning: "bg-[#f79009]",
  critical: "bg-crit-strong",
  dark: "bg-navy",
};

export function StatusDot({ tone = "success", pulse = false, className }: { tone?: Tone; pulse?: boolean; className?: string }) {
  return (
    <span className={cn("relative inline-flex size-2.5 shrink-0", className)} aria-hidden>
      {pulse && <span className={cn("absolute inset-0 rounded-full animate-pulse-ring", DOT_TONES[tone])} />}
      <span className={cn("relative inline-flex size-2.5 rounded-full", DOT_TONES[tone])} />
    </span>
  );
}

/** Small label for anything that represents simulated hardware or emergency services. */
export function SimLabel({ children = "Simulated", className }: { children?: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-dashed border-brand/50 bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-600",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ConfidenceRing({
  value,
  size = 120,
  stroke = 10,
  tone = "info",
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  tone?: Tone;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  const color =
    tone === "critical" ? "var(--color-crit-strong)" : tone === "success" ? "#12b76a" : tone === "warning" ? "#f79009" : "var(--color-brand)";
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line-soft)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 700ms cubic-bezier(.2,.7,.3,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-[family-name:var(--font-display)] text-[1.6em] font-extrabold leading-none text-navy tabular" style={{ fontSize: size / 4.2 }}>
            {Math.round(pct * 100)}%
          </div>
          {label && <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</div>}
        </div>
      </div>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  id: string;
}) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 py-1.5">
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-sm font-semibold text-navy">{label}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full border transition-colors",
          checked ? "border-brand bg-brand" : "border-line bg-line-soft",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-[22px] rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}

export function PageHeader({
  kicker,
  title,
  description,
  action,
}: {
  kicker?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-4 lg:mb-7">
      <div className="min-w-0 max-w-2xl">
        {kicker && <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">{kicker}</p>}
        <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 text-[15px] leading-relaxed text-body">{description}</p>}
      </div>
      {action}
    </header>
  );
}

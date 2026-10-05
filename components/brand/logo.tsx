import { cn } from "@/lib/utils/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="9" fill="#071A52" />
      <path d="M16 6.5 25 10.5v6c0 5.4-3.8 9.2-9 10.4-5.2-1.2-9-5-9-10.4v-6l9-4Z" fill="none" stroke="#1677FF" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 16.5l3 3 5.5-6.5" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className, invert = false }: { className?: string; invert?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span
        className={cn(
          "font-[family-name:var(--font-display)] text-[17px] font-extrabold tracking-[0.18em]",
          invert ? "text-white" : "text-navy",
        )}
      >
        RYVORA
      </span>
    </span>
  );
}

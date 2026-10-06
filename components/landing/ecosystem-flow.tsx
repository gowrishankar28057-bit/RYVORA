import { BrainCircuit, Motorbike, Smartphone, type LucideIcon } from "lucide-react";
import { HelmetIcon } from "@/components/brand/icons";
import { cn } from "@/lib/utils/cn";

const NODES: { title: string; role: string; icon: LucideIcon | typeof HelmetIcon; accent?: boolean }[] = [
  { title: "Smart Helmet", role: "Wear, buckle and impact sensing", icon: HelmetIcon },
  { title: "Bike Module", role: "Speed, rotation and motion", icon: Motorbike },
  { title: "Smartphone", role: "Rolling pre-crash buffer and GPS", icon: Smartphone },
  { title: "Safety Intelligence", role: "Crash confidence engine", icon: BrainCircuit, accent: true },
];

/** Line + arrowhead between nodes: vertical on mobile, horizontal on desktop. */
function Connector() {
  return (
    <span
      aria-hidden
      className="relative mx-auto flex h-9 w-4 justify-center lg:absolute lg:left-full lg:top-1/2 lg:h-4 lg:w-10 lg:-translate-y-1/2 lg:items-center"
    >
      <span className="h-full w-px bg-linear-to-b from-line to-brand/60 lg:h-px lg:w-full lg:bg-linear-to-r" />
      <span className="absolute bottom-0 size-1.5 rounded-full bg-brand lg:bottom-auto lg:right-0" />
    </span>
  );
}

/** Helmet → Bike → Smartphone → Safety Intelligence. */
export function EcosystemFlow({ className }: { className?: string }) {
  return (
    <div className={className}>
      <p id="ecosystem-title" className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted">
        One connected safety system
      </p>
      <ol aria-labelledby="ecosystem-title" className="mx-auto mt-6 grid max-w-md lg:max-w-none lg:grid-cols-4 lg:gap-10">
        {NODES.map((n, i) => (
          <li key={n.title} className="relative">
            <div
              className={cn(
                "flex h-full items-center gap-4 rounded-2xl border p-4 lg:flex-col lg:items-start lg:gap-5 lg:p-5",
                n.accent ? "border-navy bg-navy shadow-[var(--shadow-lift)]" : "border-line bg-white shadow-[var(--shadow-card)]",
              )}
            >
              <span
                className={cn(
                  "grid size-11 shrink-0 place-items-center rounded-xl",
                  n.accent ? "bg-white/10 text-white" : "bg-brand-50 text-brand-600",
                )}
              >
                <n.icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className={cn("block text-[11px] font-semibold tabular", n.accent ? "text-white/60" : "text-muted")}>
                  0{i + 1}
                </span>
                <span className={cn("block font-[family-name:var(--font-display)] text-[15px] font-bold", n.accent ? "text-white" : "text-navy")}>
                  {n.title}
                </span>
                <span className={cn("mt-0.5 block text-sm", n.accent ? "text-white/75" : "text-body")}>{n.role}</span>
              </span>
            </div>
            {i < NODES.length - 1 && <Connector />}
          </li>
        ))}
      </ol>
    </div>
  );
}

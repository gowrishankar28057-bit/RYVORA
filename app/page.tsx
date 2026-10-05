import Link from "next/link";
import { ArrowRight, BrainCircuit, Motorbike, Presentation, ShieldCheck, Siren, Smartphone, ScanSearch } from "lucide-react";
import { HelmetIcon } from "@/components/brand/icons";
import { Logo } from "@/components/brand/logo";
import { buttonClass } from "@/components/ui/primitives";

const FLOW = [
  { label: "Smart Helmet", icon: HelmetIcon },
  { label: "Bike Module", icon: Motorbike },
  { label: "Smartphone", icon: Smartphone },
  { label: "Safety Intelligence", icon: BrainCircuit },
];
const PILLARS = [
  { t: "Prevent", d: "Verify helmet and safety conditions before riding.", icon: ShieldCheck },
  { t: "Verify", d: "Use multiple sensor sources to distinguish genuine crashes from false triggers.", icon: ScanSearch },
  { t: "Respond", d: "Escalate emergencies when the rider cannot respond.", icon: Siren },
];

export default function Landing() {
  return (
    <div className="min-h-dvh bg-white">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <Link href="/jury-demo" className={buttonClass("secondary", "sm")}><Presentation className="size-4" />Jury Demo</Link>
      </header>
      <main id="main">
        <section className="bg-grid">
          <div className="mx-auto max-w-6xl px-4 pb-16 pt-14 text-center sm:px-6 sm:pt-24">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">AI-powered rider safety ecosystem</p>
            <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-extrabold leading-[1.05] sm:text-6xl">Intelligence that protects every ride.</h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-body">Helmet. Bike. Phone.<br />One intelligent safety system.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/dashboard" className={buttonClass("primary", "lg")}>Explore RYVORA <ArrowRight className="size-5" /></Link>
              <Link href="/jury-demo" className={buttonClass("secondary", "lg")}>Jury Demo</Link>
            </div>
            <ol className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4" aria-label="RYVORA ecosystem">
              {FLOW.map((f, i) => (
                <li key={f.label} className="relative flex flex-col items-center gap-3 rounded-3xl border border-line bg-white p-5 shadow-[var(--shadow-card)]">
                  <span className={i === 3 ? "grid size-12 place-items-center rounded-2xl bg-navy text-white" : "grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"}><f.icon className="size-6" /></span>
                  <span className="text-sm font-bold text-navy">{f.label}</span>
                  {i < 3 && <ArrowRight className="absolute -right-3 top-1/2 hidden size-5 -translate-y-1/2 text-brand sm:block" aria-hidden />}
                </li>
              ))}
            </ol>
          </div>
        </section>
        <section className="mx-auto grid max-w-6xl gap-4 px-4 py-16 sm:grid-cols-3 sm:px-6">
          {PILLARS.map((p) => (
            <article key={p.t} className="rounded-3xl border border-line p-6">
              <p.icon className="size-7 text-brand" aria-hidden />
              <h2 className="mt-4 text-xl font-extrabold">{p.t}</h2>
              <p className="mt-2 text-body">{p.d}</p>
            </article>
          ))}
        </section>
        <section className="bg-navy">
          <div className="mx-auto max-w-6xl px-4 py-14 text-center sm:px-6">
            <p className="font-[family-name:var(--font-display)] text-2xl font-extrabold text-white sm:text-3xl">Existing systems detect impact. RYVORA verifies the accident.</p>
            <p className="mt-3 text-white/70">A dropped helmet is not a crash. Three devices. One verified decision.</p>
          </div>
        </section>
      </main>
      <footer className="mx-auto max-w-6xl px-4 py-8 text-xs text-muted sm:px-6">Prototype. Hardware data is simulated; emergency communication is demonstrated, not performed. No medical diagnosis.</footer>
    </div>
  );
}

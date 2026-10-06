import { ScanSearch, ShieldCheck, Siren } from "lucide-react";

const PILLARS = [
  { title: "Prevent", moment: "Before the ride", text: "Verify helmet and safety conditions before riding.", icon: ShieldCheck },
  { title: "Verify", moment: "At the moment of impact", text: "Use multiple sensor sources to distinguish genuine crashes from false triggers.", icon: ScanSearch },
  { title: "Respond", moment: "When it matters", text: "Escalate emergencies when the rider cannot respond.", icon: Siren },
];

export function Pillars() {
  return (
    <section id="how-it-works" aria-labelledby="pillars-title" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">How it works</p>
          <h2 id="pillars-title" className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">
            Prevent. Verify. Respond.
          </h2>
          <p className="mt-3 text-body">Three moments where RYVORA acts, from the pre-ride check to the response after an impact.</p>
        </div>
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {PILLARS.map((p, i) => (
            <li key={p.title} className="rounded-3xl border border-line bg-white p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between">
                <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                  <p.icon className="size-6" aria-hidden />
                </span>
                <span className="text-xs font-semibold text-muted tabular">0{i + 1}</span>
              </div>
              <h3 className="mt-6 text-xl font-extrabold">{p.title}</h3>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{p.moment}</p>
              <p className="mt-3 leading-relaxed text-body">{p.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

import Link from "next/link";
import { ArrowRight, Presentation } from "lucide-react";
import { buttonClass } from "@/components/ui/primitives";

export function StatementBand() {
  return (
    <section aria-labelledby="statement-title" className="bg-navy">
      <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:py-24">
        {/* Spans carry the colour: the global heading rule would otherwise paint the h2 navy. */}
        <h2 id="statement-title" className="mx-auto max-w-3xl text-balance text-3xl font-extrabold leading-tight sm:text-5xl">
          <span className="text-white/65">Existing systems detect impact.</span> <span className="text-white">RYVORA verifies the accident.</span>
        </h2>
        <p className="mt-5 text-white/70">Multiple devices. One verified decision.</p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/dashboard" className={buttonClass("primary", "lg")}>
            Explore RYVORA
            <ArrowRight className="size-5" aria-hidden />
          </Link>
          <Link
            href="/jury-demo"
            className={buttonClass("secondary", "lg", "border-white/25 bg-transparent text-white hover:border-white/60 hover:bg-white/10")}
          >
            <Presentation className="size-5" aria-hidden />
            Jury Demo
          </Link>
        </div>
      </div>
    </section>
  );
}

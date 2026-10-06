import Link from "next/link";
import { ArrowRight, Presentation } from "lucide-react";
import { buttonClass } from "@/components/ui/primitives";
import { EcosystemFlow } from "./ecosystem-flow";
import { VerificationCard } from "./verification-card";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden">
      {/* Subtle grid that fades out towards the content. */}
      <div
        aria-hidden
        className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_90%_70%_at_50%_0%,#000_35%,transparent_100%)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-[560px] bg-[radial-gradient(ellipse_60%_55%_at_50%_0%,rgb(22_119_255/0.09),transparent)]"
      />

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-20 lg:pb-24 lg:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
          <div className="text-center lg:text-left">
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-navy shadow-[var(--shadow-card)]">
              <span className="size-1.5 rounded-full bg-brand" aria-hidden />
              RYVORA · AI rider-safety ecosystem
            </p>
            <h1
              id="hero-title"
              className="mx-auto mt-6 max-w-2xl text-balance text-[2.5rem] font-extrabold leading-[1.04] sm:text-6xl lg:mx-0 lg:text-[4.25rem]"
            >
              Intelligence that protects every ride.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-body sm:text-xl lg:mx-0">
              <span className="font-semibold text-navy">Helmet. Bike. Phone.</span>{" "}
              <span className="block sm:inline">One intelligent safety system.</span>
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link href="/dashboard" className={buttonClass("primary", "lg")}>
                Explore RYVORA
                <ArrowRight className="size-5" aria-hidden />
              </Link>
              <Link href="/jury-demo" className={buttonClass("secondary", "lg")}>
                <Presentation className="size-5" aria-hidden />
                Jury Demo
              </Link>
            </div>
            <p className="mt-6 text-xs text-muted">Working prototype · hardware data is simulated</p>
          </div>

          <VerificationCard />
        </div>

        <EcosystemFlow className="mt-16 lg:mt-24" />
      </div>
    </section>
  );
}

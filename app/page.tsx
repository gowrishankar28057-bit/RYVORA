import { FailSafeBand } from "@/components/landing/failsafe-band";
import { Hero } from "@/components/landing/hero";
import { ImpactComparison } from "@/components/landing/impact-comparison";
import { Pillars } from "@/components/landing/pillars";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { StatementBand } from "@/components/landing/statement-band";

/** Landing page. Server-rendered only: no charts, no client components. */
export default function Landing() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-white">
      <SiteHeader />
      <main id="main">
        <Hero />
        <Pillars />
        <ImpactComparison />
        <FailSafeBand />
        <StatementBand />
      </main>
      <SiteFooter />
    </div>
  );
}

import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { ReconstructionView } from "@/components/reconstruction/reconstruction-view";
import { ButtonLink, PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Crash reconstruction",
  description: "Digital black box and synchronized sensor reconstruction of a simulated incident.",
};

export default function ReconstructionPage() {
  return (
    <>
      <PageHeader
        kicker="Respond · Investigate"
        title="Crash reconstruction"
        description="Synchronized helmet, bike and phone data from the phone's rolling pre-crash buffer — built for review on a laptop. Simulated incident."
        action={
          <ButtonLink href="/history" variant="secondary" size="md">
            <ArrowLeft className="size-4" aria-hidden />
            Ride history
          </ButtonLink>
        }
      />
      <ReconstructionView />
    </>
  );
}

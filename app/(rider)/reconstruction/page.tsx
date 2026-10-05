import type { Metadata } from "next";
import { ReconstructionView } from "@/components/reconstruction/reconstruction-view";
import { PageHeader } from "@/components/ui/primitives";
export const metadata: Metadata = { title: "Crash reconstruction" };
export default function ReconstructionPage() {
  return (<><PageHeader kicker="Respond · Investigate" title="Crash reconstruction" description="Synchronized helmet, bike and phone data from the phone's rolling pre-crash buffer." /><ReconstructionView /></>);
}

import type { Metadata } from "next";
import { JuryDemo } from "@/components/jury/jury-demo";

export const metadata: Metadata = {
  title: "Jury demo",
  description:
    "RYVORA in two minutes: pre-ride checks, helmet drop versus a real crash, rider check, simulated emergency workflow, helmet fail-safe and crash reconstruction. All hardware data is simulated.",
};

export default function JuryDemoPage() {
  return <JuryDemo />;
}

import type { Metadata } from "next";
import { SafetyLab } from "@/components/safety/safety-lab";

export const metadata: Metadata = {
  title: "Safety lab",
  description: "Impact does not always mean accident. See how RYVORA verifies a crash across helmet, bike and phone (simulated data).",
};

export default function SafetyPage() {
  return <SafetyLab />;
}

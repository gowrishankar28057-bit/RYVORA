import type { Metadata } from "next";
import { PrecheckFlow } from "@/components/precheck/precheck-flow";

export const metadata: Metadata = { title: "Pre-ride safety check" };

export default function PrecheckPage() {
  return <PrecheckFlow />;
}

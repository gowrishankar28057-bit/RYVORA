import type { Metadata } from "next";
import { JuryDemo } from "@/components/jury/jury-demo";
export const metadata: Metadata = { title: "Jury demo" };
export default function JuryDemoPage() { return <JuryDemo />; }

import type { Metadata } from "next";
import { SafetyLab } from "@/components/safety/safety-lab";
export const metadata: Metadata = { title: "Crash confidence engine" };
export default function SafetyPage() { return <SafetyLab />; }

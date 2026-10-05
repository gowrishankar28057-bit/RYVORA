import type { Metadata } from "next";
import { HardwareHealth } from "@/components/sensors/hardware-health";
export const metadata: Metadata = { title: "Hardware health" };
export default function HealthPage() { return <HardwareHealth />; }

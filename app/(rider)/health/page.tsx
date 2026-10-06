import type { Metadata } from "next";
import { HardwareHealth } from "@/components/sensors/hardware-health";

export const metadata: Metadata = {
  title: "Hardware health",
  description: "Diagnostics for the RYVORA helmet, bike module and phone — link, battery, IMU and sensor self-tests (simulated hardware).",
};

export default function HealthPage() {
  return <HardwareHealth />;
}

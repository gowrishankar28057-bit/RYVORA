import type { Metadata } from "next";
import { LiveRide } from "@/components/ride/live-ride";

export const metadata: Metadata = { title: "Live ride" };

export default function RidePage() {
  return <LiveRide />;
}

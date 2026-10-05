import type { Metadata } from "next";
import { HomeDashboard } from "@/components/dashboard/home-dashboard";

export const metadata: Metadata = { title: "Home" };

export default function DashboardPage() {
  return <HomeDashboard />;
}

import { ResponsiveShell } from "@/components/shell/responsive-shell";
import { TelemetryProvider } from "@/lib/telemetry/telemetry-provider";

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  return (
    <TelemetryProvider>
      <ResponsiveShell>{children}</ResponsiveShell>
    </TelemetryProvider>
  );
}

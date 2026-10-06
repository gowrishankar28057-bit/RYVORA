"use client";

import { Check, Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/primitives";
import { cn } from "@/lib/utils/cn";
import { buildIncident, buildIncidentPackage, RECON_SCENARIO_ID } from "./incident-model";

type Status = { kind: "idle" } | { kind: "done"; file: string } | { kind: "error" };

/**
 * Builds the incident package on click (never during render / SSR) and saves it as JSON
 * via a Blob + object URL. The package is marked `simulated: true`.
 */
export function DownloadPackageButton({
  scenarioId = RECON_SCENARIO_ID,
  size = "md",
  className,
}: {
  scenarioId?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  function download() {
    try {
      const incident = buildIncident(scenarioId);
      const pkg = buildIncidentPackage(incident, new Date().toISOString());
      const file = `${incident.id}-simulated.json`;
      const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus({ kind: "done", file });
    } catch {
      setStatus({ kind: "error" });
    }
  }

  return (
    <div className={cn("flex flex-col items-stretch gap-1 sm:items-end", className)}>
      <Button variant="secondary" size={size} onClick={download} className="h-auto min-h-11 w-full whitespace-normal px-4 py-2.5 text-sm sm:w-auto">
        {status.kind === "done" ? <Check className="size-4 shrink-0 text-ok" aria-hidden /> : <Download className="size-4 shrink-0" aria-hidden />}
        Download incident package (JSON)
      </Button>
      <p className="min-h-4 text-[11px] text-muted sm:text-right" role="status" aria-live="polite">
        {status.kind === "done" && `Saved ${status.file}`}
        {status.kind === "error" && "Download unavailable in this browser."}
      </p>
    </div>
  );
}

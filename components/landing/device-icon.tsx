import { Motorbike, Smartphone } from "lucide-react";
import { HelmetIcon } from "@/components/brand/icons";
import type { KeySignalDevice } from "@/lib/engine/key-signals";

export const DEVICE_NAMES: Record<KeySignalDevice, string> = {
  helmet: "Smart helmet",
  bike: "Bike module",
  phone: "Smartphone",
};

/** Decorative icon for the device a signal comes from. */
export function DeviceIcon({ device, className = "size-4" }: { device: KeySignalDevice; className?: string }) {
  if (device === "helmet") return <HelmetIcon className={className} />;
  if (device === "bike") return <Motorbike className={className} aria-hidden />;
  return <Smartphone className={className} aria-hidden />;
}

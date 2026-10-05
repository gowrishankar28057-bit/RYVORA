import { Activity, FileSearch, History, House, Presentation, ShieldCheck, Stethoscope, UserRound, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Shown in the mobile bottom bar. */
  mobile?: boolean;
  match?: string[];
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: House, mobile: true, match: ["/dashboard", "/precheck"] },
  { href: "/ride", label: "Ride", icon: Activity, mobile: true },
  { href: "/safety", label: "Safety", icon: ShieldCheck, mobile: true },
  { href: "/reconstruction", label: "Black Box", icon: FileSearch },
  { href: "/health", label: "Hardware", icon: Stethoscope },
  { href: "/history", label: "History", icon: History, mobile: true },
  { href: "/profile", label: "Profile", icon: UserRound, mobile: true },
];

export const JURY_ITEM: NavItem = { href: "/jury-demo", label: "Jury Demo", icon: Presentation };

export function isActive(pathname: string, item: NavItem) {
  const prefixes = item.match ?? [item.href];
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

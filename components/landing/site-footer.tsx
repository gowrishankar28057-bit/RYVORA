import Link from "next/link";
import { Logo } from "@/components/brand/logo";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/safety", label: "Safety lab" },
  { href: "/reconstruction", label: "Black box" },
  { href: "/jury-demo", label: "Jury demo" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line-soft bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xl">
          <Logo />
          <p className="mt-4 text-xs leading-relaxed text-muted">
            RYVORA is a hackathon prototype. All helmet, motorcycle and phone sensor data shown here is simulated. Emergency communication is a
            demonstrated workflow: this app does not contact emergency services or hospitals, does not control the motorcycle and does not provide
            a medical diagnosis.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-body hover:text-navy">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}

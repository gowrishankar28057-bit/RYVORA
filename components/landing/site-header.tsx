import Link from "next/link";
import { Presentation } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { buttonClass } from "@/components/ui/primitives";

const ANCHORS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#verification", label: "Verification" },
  { href: "#fail-safe", label: "Fail-safe" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line-soft bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" aria-label="RYVORA home" className="shrink-0">
          <Logo />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1">
          <ul className="hidden items-center md:flex">
            {ANCHORS.map((a) => (
              <li key={a.href}>
                <a href={a.href} className="inline-flex h-11 items-center rounded-lg px-3 text-sm font-semibold text-body transition-colors hover:text-navy">
                  {a.label}
                </a>
              </li>
            ))}
          </ul>
          <Link href="/jury-demo" className={buttonClass("secondary", "md", "px-4 md:ml-2")}>
            <Presentation className="size-4" aria-hidden />
            Jury Demo
          </Link>
        </nav>
      </div>
    </header>
  );
}

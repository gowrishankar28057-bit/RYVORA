import Link from "next/link";
import { buttonClass } from "@/components/ui/primitives";
export default function NotFound() {
  return <main id="main" className="grid min-h-dvh place-items-center p-6 text-center"><div><h1 className="text-3xl font-extrabold">Page not found</h1><Link href="/dashboard" className={buttonClass("primary", "md", "mt-6")}>Go to dashboard</Link></div></main>;
}

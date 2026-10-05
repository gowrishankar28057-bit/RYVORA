import type { SVGProps } from "react";

/** Motorcycle helmet icon drawn in the Lucide style (24×24, 2px stroke). */
export function HelmetIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "size-6"}
      aria-hidden
      {...props}
    >
      <path d="M3 15.5C3 9.7 7 5 12.4 5 17.6 5 21 9 21 13.6V17a2 2 0 0 1-2 2H8.5A5.5 5.5 0 0 1 3 15.5Z" />
      <path d="M21 12h-6.5a2 2 0 0 0-2 2v1.5a1.5 1.5 0 0 0 1.5 1.5H21" />
      <path d="M8 19v1.5" />
    </svg>
  );
}

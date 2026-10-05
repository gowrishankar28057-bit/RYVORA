import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "RYVORA — Intelligence that protects every ride",
    template: "%s · RYVORA",
  },
  description:
    "RYVORA connects a smart helmet, a motorcycle sensor module and your phone to verify real crashes, reject false triggers and respond when the rider cannot.",
  applicationName: "RYVORA",
  openGraph: {
    title: "RYVORA — Intelligence that protects every ride",
    description: "Helmet. Bike. Phone. One intelligent safety system.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#071A52",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable} antialiased`}>
      <body className="min-h-dvh bg-white">
        <a
          href="#main"
          className="sr-only z-[100] rounded-lg bg-navy px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}

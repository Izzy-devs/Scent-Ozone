import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BRAND } from "@/lib/brand";
import { SITE_URL } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${BRAND} | Arabian and Designer Perfumes in Nigeria`, template: `%s | ${BRAND}` },
  description: `Shop Arabian perfumes, designer fragrances and more from ${BRAND}. Order online and pay in naira.`,
  openGraph: { type: "website", siteName: BRAND, locale: "en_NG" },
};
export const viewport: Viewport = { themeColor: "#063b32", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./toolbar.css";
import { SITE_URL } from "@/lib/config/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Gaia", template: "%s — Gaia" },
  description: "Explore the stars above you. Astronomy meets astrology.",
  openGraph: {
    type: "website",
    siteName: "Gaia",
    title: "Gaia",
    description: "An interactive look-up chart of the sky from wherever you stand: 793 Hipparcos stars, 88 constellations, the planets, and the same sky read through astrology.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Gaia night-sky dome chart" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gaia",
    description: "Walk outside, look up, and know what you are looking at.",
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gaia",
  },
  applicationName: "Gaia",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#07090f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>{children}</body>
    </html>
  );
}

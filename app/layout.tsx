import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Night Sky — California",
  description: "What bright stars are above you right now, and where to look.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

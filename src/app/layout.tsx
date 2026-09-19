import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

// Display type. Fraunces is variable on more than weight: the SOFT axis
// rounds its terminals, which is what keeps big headings from reading as
// severe inside the hard outlines this design uses. Asking for the axis
// here is what makes `font-variation-settings: "SOFT" 50` in globals.css
// do anything at all.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT"],
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

// Used for the small numeric labels — module numbers, counts, durations.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Absolute base for the canonical and Open Graph URLs each page builds.
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    // Page titles read "Course title — Olive Institute".
    template: `%s — ${SITE_NAME}`,
  },
  description: "Self-paced courses from Olive Institute",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${geist.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body">{children}</body>
    </html>
  );
}

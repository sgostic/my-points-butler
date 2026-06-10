import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import { AnalyticsProvider } from "@/lib/analytics";
import { getSiteUrl } from "@/lib/supabase/config";
import "./globals.css";

// Warm, editorial single-typeface system (matches the points-guide vibe).
// Inter is exposed under all three CSS variables the components consume.
const jakarta = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const bricolage = Inter({
  variable: "--font-head",
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "700", "800"],
});

const spaceGrotesk = Inter({
  variable: "--font-num",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "My Points Butler — Use now or save?",
  description:
    "Your personal miles concierge. Compare today's award cost against the cheapest window ahead — so you spend points on the right trip.",
  openGraph: {
    title: "My Points Butler — Use now or save?",
    description:
      "Your personal miles concierge. Compare today's award cost against the cheapest window ahead — so you spend points on the right trip.",
    images: [
      {
        url: "/images/sunny-beach.webp",
        alt: "Sunny beach destination preview for My Points Butler.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "My Points Butler — Use now or save?",
    description:
      "Your personal miles concierge. Compare today's award cost against the cheapest window ahead — so you spend points on the right trip.",
    images: ["/images/sunny-beach.webp"],
  },
  icons: {
    icon: "/icon",
    shortcut: "/icon",
    apple: "/icon",
  },
};

export const viewport: Viewport = {
  themeColor: "#F9EFE9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${jakarta.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* useSearchParams in the provider requires a Suspense boundary (Next 16). */}
        <Suspense fallback={null}>
          <AnalyticsProvider>{children}</AnalyticsProvider>
        </Suspense>
      </body>
    </html>
  );
}

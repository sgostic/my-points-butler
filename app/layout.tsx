import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Suspense } from "react";
import Script from "next/script";
import { AnalyticsProvider } from "@/lib/analytics";
import { META_PIXEL_ID } from "@/lib/meta-pixel";
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
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('set', 'autoConfig', false, '${META_PIXEL_ID}');
          fbq('init', '${META_PIXEL_ID}');
          fbq('track', 'PageView');`}
        </Script>
        <noscript>
          {/* Standard Meta Pixel no-JS fallback — a 1x1 tracking pixel, not a
              content image, so next/image does not apply. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            alt=""
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          />
        </noscript>
      </body>
      <GoogleAnalytics gaId="G-YP29V4JV9B" />
    </html>
  );
}

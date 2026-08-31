import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./../styles/globals.css";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { site } from "@/lib/seo";
import Providers from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "CoverlyAI — AI Cover Letter Generator",
    template: "%s | CoverlyAI",
  },
  description: site.description,
  alternates: { canonical: site.url },
  openGraph: {
    title: "CoverlyAI — AI Cover Letter Generator",
    description: site.description,
    url: site.url,
    siteName: "CoverlyAI",
    images: ["/og-image.png"],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: site.twitter,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
      </head>

      <body className={`${inter.className} min-h-[100svh] antialiased text-white`}>
        {/* --- Global space background --- */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-20"
          style={{
            background:
              "radial-gradient(1200px 600px at 10% 10%, rgba(90,0,180,0.25), transparent 65%), radial-gradient(1000px 500px at 90% 20%, rgba(0,160,255,0.22), transparent 60%), radial-gradient(900px 600px at 40% 90%, rgba(0,255,200,0.18), transparent 60%), linear-gradient(180deg, #070917 0%, #0a0f2a 45%, #0b0e1f 100%)",
          }}
        />
        <div className="pointer-events-none fixed -top-40 -left-40 h-[38rem] w-[38rem] -z-10 rounded-full blur-3xl opacity-40 [background:radial-gradient(circle_at_center,rgba(124,58,237,0.7),transparent_60%)] motion-safe:animate-[blob_18s_infinite]" />
        <div className="pointer-events-none fixed -bottom-40 -right-40 h-[42rem] w-[42rem] -z-10 rounded-full blur-3xl opacity-40 [background:radial-gradient(circle_at_center,rgba(56,189,248,0.7),transparent_60%)] motion-safe:animate-[blob_22s_infinite_reverse]" />
        <div className="pointer-events-none fixed top-1/2 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 -z-10 rounded-full blur-3xl opacity-30 [background:radial-gradient(circle_at_center,rgba(34,197,94,0.6),transparent_60%)] motion-safe:animate-[blob_26s_infinite]" />
        <div
          aria-hidden
          className="fixed inset-0 -z-10"
          style={{
            backgroundImage:
              "radial-gradient(2px 2px at 10% 20%, rgba(255,255,255,0.35) 50%, transparent 51%), radial-gradient(1px 1px at 30% 70%, rgba(255,255,255,0.25) 50%, transparent 51%), radial-gradient(1.5px 1.5px at 80% 30%, rgba(255,255,255,0.3) 50%, transparent 51%), radial-gradient(1px 1px at 60% 40%, rgba(255,255,255,0.25) 50%, transparent 51%)",
          }}
        />

        <Providers>
          <Navbar />
          <main className="min-h-[calc(100svh-8rem)]">{children}</main>
          <Footer />
        </Providers>

        {/* JSON-LD for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "CoverlyAI",
              applicationCategory: "BusinessApplication",
              offers: { "@type": "AggregateOffer", lowPrice: "0", highPrice: "19.99", priceCurrency: "USD" },
            }),
          }}
        />
      </body>
    </html>
  );
}

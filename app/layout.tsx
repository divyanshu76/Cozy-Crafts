import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";

import { ToastProvider } from "@/components/ui/toast";
import { eagleLake } from "@/lib/fonts";
import { StorefrontChrome } from "@/components/layout/storefront-chrome";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz", "SOFT"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.cozycrafts.shop"),
  title: {
    template: "%s | Cozy Craft",
    default: "Cozy Craft | Handmade Gifts, Keychains & Bouquets",
  },
  description:
    "Discover Cozy Craft's collection of handcrafted gifts, personalized keychains, and beautiful artificial bouquets. Little things, made with love in India.",
  keywords: ["handmade gifts", "personalized keychains", "artificial bouquets", "Cozy Craft", "custom gifts India"],
  authors: [{ name: "Cozy Craft" }],
  creator: "Cozy Craft",
  publisher: "Cozy Craft",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Cozy Craft | Handmade Gifts & Keychains",
    description: "Discover Cozy Craft's collection of handcrafted gifts, personalized keychains, and beautiful artificial bouquets. Little things, made with love.",
    url: "https://www.cozycrafts.shop",
    siteName: "Cozy Craft",
    images: [
      {
        url: "https://www.cozycrafts.shop/assets/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Cozy Craft - Handmade Gifts",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cozy Craft | Handmade Gifts",
    description: "Handcrafted gifts, tiny treasures and thoughtful details.",
    images: ["https://www.cozycrafts.shop/assets/og-image.jpg"],
  },
  alternates: {
    canonical: "/",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Cozy Craft",
  url: "https://www.cozycrafts.shop",
  logo: "https://www.cozycrafts.shop/assets/logo.png",
  description: "Handcrafted gifts, tiny treasures and thoughtful details — made to bring a little more joy to everyday moments.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Mirzapur",
    addressRegion: "Uttar Pradesh",
    postalCode: "231001",
    addressCountry: "IN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className={`${fraunces.variable} ${manrope.variable} ${eagleLake.variable} antialiased min-h-screen flex flex-col`}>
        <ToastProvider>
          <StorefrontChrome>
            {children}
          </StorefrontChrome>
        </ToastProvider>
      </body>
    </html>
  );
}

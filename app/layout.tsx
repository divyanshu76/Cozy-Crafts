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
  title: "Cozy Craft | Little Things, Made With Love",
  description: "Handcrafted gifts, tiny treasures and thoughtful details — made to bring a little more joy to everyday moments.",
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

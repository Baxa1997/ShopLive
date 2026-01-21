import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ShopsReady | Ultimate Shopify Product Importer & E-commerce Tools",
  description: "Convert PDFs and images into Shopify-ready CSV files instantly. ShopsReady is the #1 tool for Shopify merchants to automate product listing and catalog management.",
  keywords: ["Shopify product importer", "PDF to Shopify CSV", "AI e-commerce tools", "ShopsReady", "automated product listings"],
  authors: [{ name: "ShopsReady Team" }],
  metadataBase: new URL("https://shopsready.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "ShopsReady | Shopify Product Importer",
    description: "The fastest way to import products to Shopify. Convert any document to CSV in seconds.",
    url: "https://shopsready.com",
    siteName: "ShopsReady",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShopsReady | Shopify Tools",
    description: "Transform your Shopify store with automation.",
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
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
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9753691394615647"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9753691394615647"
     crossorigin="anonymous"></script>
      </head>
      <body
        className={`${outfit.variable} ${inter.variable} font-sans antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>

        <title>ShopsReady | AI PDF to Shopify CSV & Amazon FBA Flat File Generator</title>
        <meta name="description" content="Stop manual data entry. Convert supplier PDFs to Shopify CSV and Amazon FBA listings instantly. Optimized for Rufus AI, A+ Content, and multi-channel SKU sync." />
        
        <meta name="keywords" content="Shopify product importer, Amazon FBA flat file generator, PDF to Shopify CSV converter, bulk product listing tool, automate shopify catalog, amazon inventory loader automation, dropshipping supplier pdf converter, convert catalog to csv, amazon rufus seo tool, multi-channel product sync, wholesale pdf to shopify, ecommerce data mapping tool, automated product descriptions, FBA inventory loader tool, shopsready, amazon fba, fba, amazon, shops ready, shopsready.com" />
        <meta name="author" content="ShopsReady Team" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://shopsready.com" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://shopsready.com/" />
        <meta property="og:title" content="ShopsReady | Ultimate E-commerce Catalog Automation" />
        <meta property="og:description" content="Transform supplier PDFs into professional Shopify and Amazon listings in seconds. The #1 tool for high-volume merchants." />
        <meta property="og:site_name" content="ShopsReady" />
        <meta property="og:image" content="https://shopsready.com/og-image.png" />
        <meta property="og:locale" content="en_US" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://shopsready.com/" />
        <meta name="twitter:title" content="ShopsReady | PDF to E-commerce Listing Engine" />
        <meta name="twitter:description" content="Automate your product launches. From PDF to Shopify and Amazon in 60 seconds." />
        <meta name="twitter:image" content="https://shopsready.com/og-image.png" />

        <link rel="icon" href="/icon.png" />
        <link rel="apple-touch-icon" href="/icon.png" />

        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9753691394615647"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${outfit.variable} ${inter.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
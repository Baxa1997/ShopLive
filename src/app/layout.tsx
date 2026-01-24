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

        <title>ShopsReady | PDF to CSV & Shopify CSV Generator</title>
        <meta name="description" content="ShopsReady: The fastest way to CSV generate for Shopify and Amazon. Use our AI PDF to CSV tool to automate your e-commerce onboarding in seconds." />
        <meta name="keywords" content="ShopsReady, PDF to CSV, Shopify CSV generator, CSV generate, Amazon inventory" />
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
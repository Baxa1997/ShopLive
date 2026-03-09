import Script from 'next/script';
import type React from 'react';

export const metadata = {
  title: 'Blog | ShopsReady — E-commerce Insights & Guides',
  description:
    'Expert tips on Shopify, Amazon, product data management, and scaling your e-commerce business. Free guides and tutorials from the ShopsReady team.',
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* AdSense script — only loads on blog pages (content-rich pages) */}
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9753691394615647"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      {children}
    </>
  );
}

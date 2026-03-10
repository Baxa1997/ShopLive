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
  return <>{children}</>;
}

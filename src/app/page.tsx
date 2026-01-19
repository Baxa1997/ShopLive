'use client';

import LandingHero from '@/components/LandingHero';
import ShopifyStats from '@/components/ShopifyStats';
import PartnersSection from '@/components/PartnersSection';
import FeaturesSection from '@/components/FeaturesSection';
import ExamplesSection from '@/components/ExamplesSection';
import AmazonExampleSection from '@/components/AmazonExampleSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import SiteFooter from '@/components/SiteFooter';
import LiveBackground from '@/components/LiveBackground';

export default function Home() {
  return (
    <div className="min-h-screen">
      <LiveBackground />
      <LandingHero />
      <ShopifyStats />
      <PartnersSection />
      <FeaturesSection />
      <AmazonExampleSection />
      <ExamplesSection />
      <TestimonialsSection />
      <SiteFooter />
    </div>
  );
}

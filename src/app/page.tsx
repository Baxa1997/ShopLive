'use client';

import LandingHero from '@/components/LandingHero';
import PartnersSection from '@/components/PartnersSection';
import FeaturesSection from '@/components/FeaturesSection';
import ExamplesSection from '@/components/ExamplesSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import SiteFooter from '@/components/SiteFooter';
import LiveBackground from '@/components/LiveBackground';

export default function Home() {
  return (
    <div className="min-h-screen">
      <LiveBackground />
      <LandingHero />
      <PartnersSection />
      <FeaturesSection />
      <ExamplesSection />
      <TestimonialsSection />
      <SiteFooter />
    </div>
  );
}

import ToolSearch from '@/components/ToolSearch';
import SiteFooter from '@/components/SiteFooter';
import LiveBackground from '@/components/LiveBackground';
import { Suspense } from 'react';

export default function SearchPage() {
  return (
    <div className="min-h-screen flex flex-col relative">
      <LiveBackground />
      <main className="flex-grow">
        <Suspense fallback={<div>Loading...</div>}>
          <ToolSearch />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}

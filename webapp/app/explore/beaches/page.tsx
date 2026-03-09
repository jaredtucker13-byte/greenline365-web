import type { Metadata } from 'next';
import Breadcrumbs from '@/app/components/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Best Beaches in Florida — Sun, Sand & Coastal Adventures | GreenLine365',
  description: 'Explore Florida\'s best beaches. From St. Pete Beach to Key West — find the perfect coastal destination with local tips and nearby businesses.',
};

export default function BeachesPage() {
  return (
    <div data-theme="explore" className="min-h-screen bg-[#0A0A0A]">
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <Breadcrumbs items={[{ label: 'Explore', href: '/explore/dining' }, { label: 'Best Beaches' }]} />
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-light text-white tracking-tight mt-8 mb-4">
            Best <span className="text-gradient-gold font-semibold">Beaches</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl font-body leading-relaxed">
            Sun, sand, and coastal adventures — discover Florida&apos;s top beaches and the businesses that make them special.
          </p>
        </div>
      </section>

      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.02] p-12 text-center">
            <p className="text-white/30 text-sm uppercase tracking-widest mb-3">Coming Soon</p>
            <p className="text-white/50 max-w-md mx-auto">
              Beach guides with nearby dining, water sports, rentals, and local tips from Florida residents.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

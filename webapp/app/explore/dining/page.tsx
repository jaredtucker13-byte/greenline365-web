import type { Metadata } from 'next';
import Breadcrumbs from '@/app/components/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Quick Eats — Restaurants, Cafes & Food Trucks | GreenLine365',
  description: 'Discover the best restaurants, cafes, food trucks, and dining spots across Florida. Real reviews from locals on GreenLine365.',
};

export default function DiningPage() {
  return (
    <div data-theme="explore" className="min-h-screen bg-[#0A0A0A]">
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <Breadcrumbs items={[{ label: 'Explore', href: '/explore/dining' }, { label: 'Quick Eats' }]} />
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-light text-white tracking-tight mt-8 mb-4">
            Quick <span className="text-gradient-gold font-semibold">Eats</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl font-body leading-relaxed">
            From food trucks to fine dining — discover Florida&apos;s best restaurants, cafes, and hidden gems.
          </p>
        </div>
      </section>

      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.02] p-12 text-center">
            <p className="text-white/30 text-sm uppercase tracking-widest mb-3">Coming Soon</p>
            <p className="text-white/50 max-w-md mx-auto">
              Browse dining spots by cuisine, location, and vibe — with real ratings from Florida foodies.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

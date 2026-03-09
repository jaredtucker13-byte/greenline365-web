import type { Metadata } from 'next';
import Breadcrumbs from '@/app/components/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Suggest a Spot — Recommend a Local Business | GreenLine365',
  description: 'Know a great local business in Florida that should be on GreenLine365? Suggest it and help your community discover trusted local pros.',
};

export default function SuggestSpotPage() {
  return (
    <div data-theme="community" className="min-h-screen bg-[#0A0A0A]">
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <Breadcrumbs items={[{ label: 'Community Hub', href: '/community/claim' }, { label: 'Suggest a Spot' }]} />
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-light text-white tracking-tight mt-8 mb-4">
            Suggest a <span className="text-gradient-gold font-semibold">Spot</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl font-body leading-relaxed">
            Know a great local business? Recommend it to the GreenLine365 community and help your neighbors find trusted pros.
          </p>
        </div>
      </section>

      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.02] p-12 text-center">
            <p className="text-white/30 text-sm uppercase tracking-widest mb-3">Coming Soon</p>
            <p className="text-white/50 max-w-md mx-auto">
              A simple form to recommend local businesses you love. Help build Florida&apos;s most trusted directory.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

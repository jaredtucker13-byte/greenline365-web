import type { Metadata } from 'next';
import Breadcrumbs from '@/app/components/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Our Story — The People Behind GreenLine365',
  description: 'The personal story behind GreenLine365. Learn about the team, the vision, and why we\'re passionate about connecting Florida communities with trusted local businesses.',
};

export default function OurStoryPage() {
  return (
    <div data-theme="services" className="min-h-screen bg-[#0A0A0A]">
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <Breadcrumbs items={[{ label: 'Why GreenLine?', href: '/why-greenline' }, { label: 'Our Story' }]} />
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-light text-white tracking-tight mt-8 mb-4">
            Our <span className="text-gradient-gold font-semibold">Story</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl font-body leading-relaxed">
            The personal background behind GreenLine365 — who we are and why we built this.
          </p>
        </div>
      </section>

      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.02] p-12 text-center">
            <p className="text-white/30 text-sm uppercase tracking-widest mb-3">Coming Soon</p>
            <p className="text-white/50 max-w-md mx-auto">
              Our founding story, the team behind the platform, and our vision for Florida&apos;s local economy.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

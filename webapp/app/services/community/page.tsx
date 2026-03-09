import type { Metadata } from 'next';
import Breadcrumbs from '@/app/components/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Community Resources — Education, Childcare & Pet Services | GreenLine365',
  description: 'Find community resources in Florida. Schools, tutoring, daycare, pet services, and more — all verified on GreenLine365.',
};

export default function CommunityResourcesPage() {
  return (
    <div data-theme="services" className="min-h-screen bg-[#0A0A0A]">
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <Breadcrumbs items={[{ label: 'Services', href: '/services/home' }, { label: 'Community Resources' }]} />
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-light text-white tracking-tight mt-8 mb-4">
            Community <span className="text-gradient-gold font-semibold">Resources</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl font-body leading-relaxed">
            Education, childcare, and pet services for Florida families — trusted providers in your neighborhood.
          </p>
        </div>
      </section>

      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.02] p-12 text-center">
            <p className="text-white/30 text-sm uppercase tracking-widest mb-3">Coming Soon</p>
            <p className="text-white/50 max-w-md mx-auto">
              Preschools, tutoring centers, pet groomers, veterinarians, and community services across Florida.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

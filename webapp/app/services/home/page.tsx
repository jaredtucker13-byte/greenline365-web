import type { Metadata } from 'next';
import Breadcrumbs from '@/app/components/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Home Services — HVAC, Plumbing, Electrical & More | GreenLine365',
  description: 'Find trusted home service professionals in Florida. HVAC, plumbing, electrical, roofing, pest control, and every trade you need — all verified on GreenLine365.',
};

export default function HomeServicesPage() {
  return (
    <div data-theme="services" className="min-h-screen bg-[#0A0A0A]">
      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <Breadcrumbs items={[{ label: 'Services', href: '/services/home' }, { label: 'Home Services' }]} />
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-light text-white tracking-tight mt-8 mb-4">
            Home <span className="text-gradient-gold font-semibold">Services</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl font-body leading-relaxed">
            HVAC, Plumbing, Electrical, Roofing, Pest Control and every trade your Florida home needs — all verified and reviewed by your neighbors.
          </p>
        </div>
      </section>

      {/* Placeholder Content */}
      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.02] p-12 text-center">
            <p className="text-white/30 text-sm uppercase tracking-widest mb-3">Coming Soon</p>
            <p className="text-white/50 max-w-md mx-auto">
              Full home services directory with category filters, verified pros, and real reviews from Florida homeowners.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

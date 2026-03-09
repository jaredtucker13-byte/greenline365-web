import type { Metadata } from 'next';
import Breadcrumbs from '@/app/components/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Professional Experts — Legal, Financial & Consulting | GreenLine365',
  description: 'Connect with verified professional service providers in Florida. Attorneys, accountants, financial advisors, insurance agents, and consultants on GreenLine365.',
};

export default function ProfessionalServicesPage() {
  return (
    <div data-theme="services" className="min-h-screen bg-[#0A0A0A]">
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <Breadcrumbs items={[{ label: 'Services', href: '/services/home' }, { label: 'Professional Experts' }]} />
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-light text-white tracking-tight mt-8 mb-4">
            Professional <span className="text-gradient-gold font-semibold">Experts</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl font-body leading-relaxed">
            Legal, financial, and consulting professionals you can trust — verified and reviewed by Florida residents.
          </p>
        </div>
      </section>

      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.02] p-12 text-center">
            <p className="text-white/30 text-sm uppercase tracking-widest mb-3">Coming Soon</p>
            <p className="text-white/50 max-w-md mx-auto">
              Browse attorneys, accountants, financial advisors, insurance agents, and more across Florida.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

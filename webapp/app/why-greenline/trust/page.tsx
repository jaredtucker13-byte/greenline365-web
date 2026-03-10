import type { Metadata } from 'next';
import Breadcrumbs from '@/app/components/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Trust & Verification — How GreenLine365 Ensures Quality',
  description: 'Learn how GreenLine365 verifies every listing. Our trust process includes business verification, real reviews, and continuous quality monitoring.',
};

export default function TrustVerificationPage() {
  return (
    <div data-theme="services" className="min-h-screen bg-[#0A0A0A]">
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <Breadcrumbs items={[{ label: 'Why GreenLine?', href: '/why-greenline' }, { label: 'Trust & Verification' }]} />
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-light text-white tracking-tight mt-8 mb-4">
            Trust & <span className="text-gradient-gold font-semibold">Verification</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl font-body leading-relaxed">
            How we verify every listing and maintain the integrity of Florida&apos;s most trusted business directory.
          </p>
        </div>
      </section>

      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.02] p-12 text-center">
            <p className="text-white/30 text-sm uppercase tracking-widest mb-3">Coming Soon</p>
            <p className="text-white/50 max-w-md mx-auto">
              Our verification process, trust scoring methodology, and commitment to real reviews from real people.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

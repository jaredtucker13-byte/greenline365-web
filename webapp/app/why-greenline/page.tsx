import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/app/components/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Why GreenLine365 — Our Mission to Connect Florida Communities',
  description: 'GreenLine365 exists to connect Florida communities with trusted local businesses. Learn about our mission, verification process, and commitment to transparency.',
};

export default function WhyGreenlinePage() {
  return (
    <div data-theme="services" className="min-h-screen bg-[#0A0A0A]">
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <Breadcrumbs items={[{ label: 'Why GreenLine?' }]} />
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-light text-white tracking-tight mt-8 mb-4">
            Why <span className="text-gradient-gold font-semibold">GreenLine365</span>?
          </h1>
          <p className="text-lg text-white/50 max-w-2xl font-body leading-relaxed">
            We&apos;re building the most trusted local business directory in Florida — one verified listing at a time.
          </p>
        </div>
      </section>

      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/why-greenline/story"
            className="group rounded-[32px] border border-white/10 bg-white/[0.02] p-8 hover:bg-white/5 hover:border-gold/20 transition-all duration-300"
          >
            <span className="text-2xl mb-3 block">📖</span>
            <h3 className="text-xl font-heading font-semibold text-white group-hover:text-gold transition-colors duration-300 mb-2">Our Story</h3>
            <p className="text-sm text-white/40">The personal background behind GreenLine365 and why we care about local businesses.</p>
          </Link>
          <Link
            href="/why-greenline/trust"
            className="group rounded-[32px] border border-white/10 bg-white/[0.02] p-8 hover:bg-white/5 hover:border-gold/20 transition-all duration-300"
          >
            <span className="text-2xl mb-3 block">🛡️</span>
            <h3 className="text-xl font-heading font-semibold text-white group-hover:text-gold transition-colors duration-300 mb-2">Trust & Verification</h3>
            <p className="text-sm text-white/40">How we verify every listing and maintain the integrity of our directory.</p>
          </Link>
        </div>
      </section>
    </div>
  );
}

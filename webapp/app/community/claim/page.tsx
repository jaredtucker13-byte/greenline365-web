import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/app/components/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Claim Your Listing — Own Your Business Page | GreenLine365',
  description: 'Claim and manage your business listing on GreenLine365. Update your info, respond to reviews, and connect with local customers across Florida.',
};

export default function ClaimListingPage() {
  return (
    <div data-theme="community" className="min-h-screen bg-[#0A0A0A]">
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <Breadcrumbs items={[{ label: 'Community Hub', href: '/community/claim' }, { label: 'Claim Your Listing' }]} />
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-light text-white tracking-tight mt-8 mb-4">
            Claim Your <span className="text-gradient-gold font-semibold">Listing</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl font-body leading-relaxed">
            Own and manage your business page on GreenLine365 — update your info, respond to feedback, and grow your reputation.
          </p>
        </div>
      </section>

      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.02] p-12 text-center">
            <p className="text-white/30 text-sm uppercase tracking-widest mb-3">Get Started</p>
            <p className="text-white/50 max-w-md mx-auto mb-6">
              Search for your business below to begin the claim process. Free for all Florida businesses.
            </p>
            <Link
              href="/register-business"
              className="inline-block px-6 py-3 text-sm font-semibold rounded-full bg-gradient-to-r from-gold to-gold-300 text-black hover:shadow-lg hover:shadow-gold/20 transition-all duration-300"
            >
              Register or Claim Your Business
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

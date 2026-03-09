import type { Metadata } from 'next';
import Breadcrumbs from '@/app/components/Breadcrumbs';

export const metadata: Metadata = {
  title: 'FAQ — Common Questions About GreenLine365',
  description: 'Frequently asked questions about GreenLine365. Learn how to list your business, claim a listing, leave reviews, and more.',
};

export default function FAQPage() {
  return (
    <div data-theme="community" className="min-h-screen bg-[#0A0A0A]">
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <Breadcrumbs items={[{ label: 'Community Hub', href: '/community/claim' }, { label: 'FAQ' }]} />
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-light text-white tracking-tight mt-8 mb-4">
            Frequently Asked <span className="text-gradient-gold font-semibold">Questions</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl font-body leading-relaxed">
            Everything you need to know about GreenLine365, listing your business, and using the directory.
          </p>
        </div>
      </section>

      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.02] p-12 text-center">
            <p className="text-white/30 text-sm uppercase tracking-widest mb-3">Coming Soon</p>
            <p className="text-white/50 max-w-md mx-auto">
              Detailed answers about how GreenLine365 works, business listings, reviews, and verification.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

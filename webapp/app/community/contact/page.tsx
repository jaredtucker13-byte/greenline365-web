import type { Metadata } from 'next';
import Breadcrumbs from '@/app/components/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Contact Us — Get in Touch with GreenLine365',
  description: 'Have a question or need help? Contact the GreenLine365 team. We\'re here to help with listings, verification, partnerships, and more.',
};

export default function ContactPage() {
  return (
    <div data-theme="community" className="min-h-screen bg-[#0A0A0A]">
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <Breadcrumbs items={[{ label: 'Community Hub', href: '/community/claim' }, { label: 'Contact Us' }]} />
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-light text-white tracking-tight mt-8 mb-4">
            Contact <span className="text-gradient-gold font-semibold">Us</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl font-body leading-relaxed">
            Have a question, need help, or want to partner with us? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.02] p-12 text-center">
            <p className="text-white/30 text-sm uppercase tracking-widest mb-3">Coming Soon</p>
            <p className="text-white/50 max-w-md mx-auto">
              Contact form, support email, and partnership inquiries. We typically respond within 24 hours.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

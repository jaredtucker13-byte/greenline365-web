import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import JsonLd from '@/app/components/JsonLd';

export const metadata: Metadata = {
  title: 'Why GreenLine365 — Our Mission to Connect Florida Communities',
  description:
    'GreenLine365 exists to connect Florida communities with trusted local businesses. Learn about our mission, verification process, and commitment to transparency.',
  openGraph: {
    title: 'Why GreenLine365 — Our Mission to Connect Florida Communities',
    description:
      'GreenLine365 exists to connect Florida communities with trusted local businesses.',
    url: 'https://greenline365.com/why-greenline',
  },
  alternates: { canonical: 'https://greenline365.com/why-greenline' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'Why GreenLine365',
  description:
    'GreenLine365 exists to connect Florida communities with trusted local businesses.',
  url: 'https://greenline365.com/why-greenline',
  mainEntity: {
    '@type': 'Organization',
    name: 'GreenLine365',
    description:
      'Florida\'s most trusted local business directory — connecting communities with verified businesses.',
    url: 'https://greenline365.com',
    areaServed: {
      '@type': 'State',
      name: 'Florida',
    },
  },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://greenline365.com' },
      { '@type': 'ListItem', position: 2, name: 'Why GreenLine365?' },
    ],
  },
};

const valueProps = [
  {
    icon: '🛡️',
    title: 'Verified Listings',
    desc: 'Every business goes through our verification process. No fake profiles, no paid placements disguised as organic results.',
  },
  {
    icon: '💬',
    title: 'Real Reviews',
    desc: 'Reviews from actual customers, not bots. Our trust scoring system rewards transparency and penalizes gaming.',
  },
  {
    icon: '📍',
    title: 'Hyper-Local Focus',
    desc: 'Built exclusively for Florida communities. We know every neighborhood, coast, and Key because we live here too.',
  },
  {
    icon: '🤝',
    title: 'Community-Driven',
    desc: 'Suggest a spot, claim your listing, or leave a review. GreenLine365 grows because of people like you.',
  },
];

const trustSignals = [
  { stat: '100%', label: 'Verified Listings' },
  { stat: 'Real', label: 'Customer Reviews' },
  { stat: 'Free', label: 'Basic Listing' },
  { stat: '24hr', label: 'Response Time' },
];

export default function WhyGreenlinePage() {
  return (
    <div data-theme="services" className="min-h-screen bg-[#0A0A0A]">
      <JsonLd data={jsonLd} />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <Breadcrumbs items={[{ label: 'Why GreenLine?' }]} />
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-light text-white tracking-tight mt-8 mb-4">
            Why <span className="text-gradient-gold font-semibold">GreenLine365</span>?
          </h1>
          <p className="text-lg text-white/50 max-w-2xl font-body leading-relaxed">
            We&apos;re building the most trusted local business directory in Florida — one verified
            listing at a time.
          </p>
        </div>
      </section>

      {/* Mission statement */}
      <section className="pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-[32px] border border-gold/20 bg-white/[0.02] p-8 md:p-12">
            <p className="text-xs font-heading font-semibold uppercase tracking-[0.25em] text-gold/60 mb-4">
              Our Mission
            </p>
            <p className="text-xl md:text-2xl font-heading font-light text-white/90 leading-relaxed">
              To become the trusted bridge between Florida communities and the local businesses that
              serve them — through verification, transparency, and real human connection.
            </p>
          </div>
        </div>
      </section>

      {/* Trust signals bar */}
      <section className="pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trustSignals.map((signal) => (
              <div
                key={signal.label}
                className="rounded-[20px] border border-white/10 bg-white/[0.02] p-6 text-center transition-all duration-300 hover:scale-[1.02] hover:border-gold/30"
              >
                <p className="text-2xl font-heading font-bold text-gradient-gold mb-1">
                  {signal.stat}
                </p>
                <p className="text-xs text-white/40 uppercase tracking-wider">{signal.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value propositions */}
      <section className="pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-heading font-light text-white mb-8">
            What Sets Us <span className="text-gradient-gold font-semibold">Apart</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {valueProps.map((prop) => (
              <div
                key={prop.title}
                className="group rounded-[24px] border border-white/10 bg-white/[0.02] p-8 transition-all duration-300 hover:scale-[1.02] hover:border-gold/20 hover:bg-white/[0.04]"
              >
                <span className="text-2xl mb-4 block">{prop.icon}</span>
                <h3 className="text-lg font-heading font-semibold text-white group-hover:text-gold transition-colors duration-300 mb-2">
                  {prop.title}
                </h3>
                <p className="text-sm text-white/50 leading-relaxed">{prop.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sub-page links */}
      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/why-greenline/story"
            className="group rounded-[32px] border border-white/10 bg-white/[0.02] p-8 transition-all duration-300 hover:scale-[1.02] hover:bg-white/5 hover:border-gold/20"
          >
            <span className="text-2xl mb-3 block">📖</span>
            <h3 className="text-xl font-heading font-semibold text-white group-hover:text-gold transition-colors duration-300 mb-2">
              Our Story
            </h3>
            <p className="text-sm text-white/40">
              The personal background behind GreenLine365 and why we care about local businesses.
            </p>
          </Link>
          <Link
            href="/why-greenline/trust"
            className="group rounded-[32px] border border-white/10 bg-white/[0.02] p-8 transition-all duration-300 hover:scale-[1.02] hover:bg-white/5 hover:border-gold/20"
          >
            <span className="text-2xl mb-3 block">🛡️</span>
            <h3 className="text-xl font-heading font-semibold text-white group-hover:text-gold transition-colors duration-300 mb-2">
              Trust & Verification
            </h3>
            <p className="text-sm text-white/40">
              How we verify every listing and maintain the integrity of our directory.
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}

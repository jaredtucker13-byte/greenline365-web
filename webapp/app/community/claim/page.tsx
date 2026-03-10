'use client';

import { useState } from 'react';
import Link from 'next/link';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import JsonLd from '@/app/components/JsonLd';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Claim Your Listing — GreenLine365',
  description:
    'Claim and manage your business listing on GreenLine365. Update your info, respond to reviews, and connect with local customers.',
  url: 'https://greenline365.com/community/claim',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://greenline365.com' },
      { '@type': 'ListItem', position: 2, name: 'Community', item: 'https://greenline365.com/community/claim' },
      { '@type': 'ListItem', position: 3, name: 'Claim Your Listing' },
    ],
  },
};

const benefits = [
  { icon: '✏️', title: 'Update Your Info', desc: 'Keep your hours, photos, and contact info accurate.' },
  { icon: '💬', title: 'Respond to Reviews', desc: 'Engage with customers and build your reputation.' },
  { icon: '📊', title: 'Track Performance', desc: 'See how many people find and view your listing.' },
  { icon: '⭐', title: 'Boost Visibility', desc: 'Verified listings rank higher in directory results.' },
];

export default function ClaimListingPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div data-theme="community" className="min-h-screen bg-[#0A0A0A]">
      <JsonLd data={jsonLd} />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <Breadcrumbs
            items={[
              { label: 'Community', href: '/community/claim' },
              { label: 'Claim Your Listing' },
            ]}
          />
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-light text-white tracking-tight mt-8 mb-4">
            Claim Your <span className="text-gradient-gold font-semibold">Listing</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl font-body leading-relaxed">
            Own and manage your business page on GreenLine365 — update your info, respond to
            feedback, and grow your reputation.
          </p>
        </div>
      </section>

      {/* Search form */}
      <section className="pb-12 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.02] p-8">
            <h2 className="text-lg font-heading font-semibold text-white mb-4 text-center">
              Find Your Business
            </h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by business name..."
                className="flex-1 px-5 py-3 rounded-full bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-gold/40 transition-colors duration-300"
              />
              <Link
                href={searchQuery ? `/directory?search=${encodeURIComponent(searchQuery)}` : '/directory'}
                className="px-6 py-3 text-sm font-semibold rounded-full bg-gradient-to-r from-gold to-gold-300 text-black hover:shadow-lg hover:shadow-gold/20 transition-all duration-300 whitespace-nowrap"
              >
                Search
              </Link>
            </div>
            <p className="text-xs text-white/30 text-center mt-3">
              Can&apos;t find your business?{' '}
              <Link href="/register-business" className="text-gold/60 hover:text-gold transition-colors duration-300">
                Register it here
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Benefits grid */}
      <section className="pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-heading font-light text-white mb-6 text-center">
            Why <span className="text-gradient-gold font-semibold">Claim</span> Your Listing?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="rounded-[24px] border border-white/10 bg-white/[0.02] p-6 text-center transition-all duration-300 hover:scale-[1.02] hover:border-gold/30 hover:bg-white/[0.04]"
              >
                <span className="text-2xl mb-3 block">{b.icon}</span>
                <h3 className="text-sm font-heading font-semibold text-white mb-1">{b.title}</h3>
                <p className="text-xs text-white/40">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="rounded-[32px] border border-gold/20 bg-white/[0.02] p-10">
            <h2 className="text-xl font-heading font-semibold text-white mb-3">
              Ready to Take Control?
            </h2>
            <p className="text-sm text-white/50 mb-6 max-w-md mx-auto">
              Claiming is free for all Florida businesses. Get started in under 2 minutes.
            </p>
            <Link
              href="/register-business"
              className="inline-block px-8 py-3 text-sm font-semibold rounded-full bg-gradient-to-r from-gold to-gold-300 text-black hover:shadow-lg hover:shadow-gold/20 transition-all duration-300"
            >
              Register or Claim Your Business
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

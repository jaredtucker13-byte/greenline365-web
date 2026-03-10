'use client';

import { useState, type FormEvent } from 'react';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import JsonLd from '@/app/components/JsonLd';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Suggest a Spot — GreenLine365',
  description:
    'Know a great local business in Florida? Suggest it and help your community discover trusted local pros.',
  url: 'https://greenline365.com/community/suggest',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://greenline365.com' },
      { '@type': 'ListItem', position: 2, name: 'Community', item: 'https://greenline365.com/community/claim' },
      { '@type': 'ListItem', position: 3, name: 'Suggest a Spot' },
    ],
  },
};

const industries = [
  'Home Services',
  'Dining',
  'Professional Services',
  'Health & Wellness',
  'Automotive',
  'Style & Shopping',
  'Education & Childcare',
  'Pets',
  'Marine & Outdoor',
  'Other',
];

export default function SuggestSpotPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch('/api/directory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: data.get('business_name'),
          industry: data.get('industry'),
          city: data.get('city'),
          state: 'FL',
          phone: data.get('phone') || null,
          website: data.get('website') || null,
          description: data.get('description') || null,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      }
    } catch {
      // Silently handle - the form will remain for retry
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div data-theme="community" className="min-h-screen bg-[#0A0A0A]">
      <JsonLd data={jsonLd} />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <Breadcrumbs
            items={[
              { label: 'Community', href: '/community/claim' },
              { label: 'Suggest a Spot' },
            ]}
          />
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-light text-white tracking-tight mt-8 mb-4">
            Suggest a <span className="text-gradient-gold font-semibold">Spot</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl font-body leading-relaxed">
            Know a great local business? Recommend it to the GreenLine365 community and help your
            neighbors find trusted pros.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="pb-24 px-6">
        <div className="max-w-2xl mx-auto">
          {submitted ? (
            <div className="rounded-[32px] border border-gold/20 bg-white/[0.02] p-12 text-center">
              <span className="text-4xl mb-4 block">🎉</span>
              <h2 className="text-xl font-heading font-semibold text-white mb-3">
                Thanks for the Suggestion!
              </h2>
              <p className="text-sm text-white/50 max-w-md mx-auto">
                We&apos;ll review this business and add it to our directory. You&apos;re helping
                build Florida&apos;s most trusted local resource.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-[32px] border border-white/10 bg-white/[0.02] p-8 md:p-10 space-y-5"
            >
              <div>
                <label htmlFor="business_name" className="block text-sm text-white/60 mb-1.5">
                  Business Name *
                </label>
                <input
                  id="business_name"
                  name="business_name"
                  type="text"
                  required
                  placeholder="e.g. Joe's Plumbing"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-gold/40 transition-colors duration-300"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="industry" className="block text-sm text-white/60 mb-1.5">
                    Category *
                  </label>
                  <select
                    id="industry"
                    name="industry"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-gold/40 transition-colors duration-300 appearance-none"
                  >
                    <option value="" className="bg-[#0A0A0A]">Select category...</option>
                    {industries.map((ind) => (
                      <option key={ind} value={ind.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')} className="bg-[#0A0A0A]">
                        {ind}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm text-white/60 mb-1.5">
                    City *
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    required
                    placeholder="e.g. Tampa"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-gold/40 transition-colors duration-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="phone" className="block text-sm text-white/60 mb-1.5">
                    Phone (optional)
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-gold/40 transition-colors duration-300"
                  />
                </div>
                <div>
                  <label htmlFor="website" className="block text-sm text-white/60 mb-1.5">
                    Website (optional)
                  </label>
                  <input
                    id="website"
                    name="website"
                    type="url"
                    placeholder="https://..."
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-gold/40 transition-colors duration-300"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm text-white/60 mb-1.5">
                  Why do you recommend them? (optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  placeholder="Tell us what makes this business great..."
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-gold/40 transition-colors duration-300 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 text-sm font-semibold rounded-full bg-gradient-to-r from-gold to-gold-300 text-black hover:shadow-lg hover:shadow-gold/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Suggest This Business'}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

'use client';

import { useState, type FormEvent } from 'react';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import JsonLd from '@/app/components/JsonLd';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'Contact Us — GreenLine365',
  description:
    'Have a question or need help? Contact the GreenLine365 team.',
  url: 'https://greenline365.com/community/contact',
  mainEntity: {
    '@type': 'Organization',
    name: 'GreenLine365',
    email: 'hello@greenline365.com',
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
      { '@type': 'ListItem', position: 2, name: 'Community', item: 'https://greenline365.com/community/claim' },
      { '@type': 'ListItem', position: 3, name: 'Contact Us' },
    ],
  },
};

const contactOptions = [
  {
    icon: '📧',
    title: 'Email Us',
    desc: 'hello@greenline365.com',
    detail: 'We typically respond within 24 hours.',
  },
  {
    icon: '💬',
    title: 'Live Chat',
    desc: 'Click the chat bubble',
    detail: 'AI-powered chat available 24/7.',
  },
  {
    icon: '🤝',
    title: 'Partnerships',
    desc: 'partnerships@greenline365.com',
    detail: 'For business collaboration inquiries.',
  },
];

const topics = [
  'General Question',
  'Listing Issue',
  'Claim My Business',
  'Report a Problem',
  'Partnership Inquiry',
  'Feature Request',
  'Other',
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    // Simulate form submission - in production this would hit an API endpoint
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSubmitted(true);
    setSubmitting(false);
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
              { label: 'Contact Us' },
            ]}
          />
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-light text-white tracking-tight mt-8 mb-4">
            Contact <span className="text-gradient-gold font-semibold">Us</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl font-body leading-relaxed">
            Have a question, need help, or want to partner with us? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      {/* Contact options */}
      <section className="pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {contactOptions.map((opt) => (
              <div
                key={opt.title}
                className="rounded-[24px] border border-white/10 bg-white/[0.02] p-6 text-center transition-all duration-300 hover:scale-[1.02] hover:border-gold/30 hover:bg-white/[0.04]"
              >
                <span className="text-2xl mb-3 block">{opt.icon}</span>
                <h3 className="text-sm font-heading font-semibold text-white mb-1">{opt.title}</h3>
                <p className="text-xs text-gold/60 mb-1">{opt.desc}</p>
                <p className="text-[10px] text-white/30">{opt.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact form */}
      <section className="pb-24 px-6">
        <div className="max-w-2xl mx-auto">
          {submitted ? (
            <div className="rounded-[32px] border border-gold/20 bg-white/[0.02] p-12 text-center">
              <span className="text-4xl mb-4 block">✉️</span>
              <h2 className="text-xl font-heading font-semibold text-white mb-3">
                Message Sent!
              </h2>
              <p className="text-sm text-white/50 max-w-md mx-auto">
                Thanks for reaching out. We&apos;ll get back to you within 24 hours.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-[32px] border border-white/10 bg-white/[0.02] p-8 md:p-10 space-y-5"
            >
              <h2 className="text-lg font-heading font-semibold text-white text-center mb-2">
                Send Us a Message
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="name" className="block text-sm text-white/60 mb-1.5">
                    Your Name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="Jane Doe"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-gold/40 transition-colors duration-300"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm text-white/60 mb-1.5">
                    Email *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="jane@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-gold/40 transition-colors duration-300"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="topic" className="block text-sm text-white/60 mb-1.5">
                  Topic *
                </label>
                <select
                  id="topic"
                  name="topic"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-gold/40 transition-colors duration-300 appearance-none"
                >
                  <option value="" className="bg-[#0A0A0A]">Select a topic...</option>
                  {topics.map((t) => (
                    <option key={t} value={t} className="bg-[#0A0A0A]">
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm text-white/60 mb-1.5">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  placeholder="How can we help?"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-gold/40 transition-colors duration-300 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 text-sm font-semibold rounded-full bg-gradient-to-r from-gold to-gold-300 text-black hover:shadow-lg hover:shadow-gold/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

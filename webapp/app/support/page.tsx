'use client';

import { useState } from 'react';
import Link from 'next/link';

const FAQ_ITEMS = [
  {
    question: 'How do I claim my business listing?',
    answer:
      'Search for your business in the directory. If your listing shows a "Claim This Listing" button, click it and follow the verification steps. You\'ll need to create a free account or sign in first. Once verified, you can manage your listing through the Business Portal.',
  },
  {
    question: 'What\'s the difference between Free, Pro, and Premium?',
    answer:
      'Free gives you a basic directory presence with your name, address, phone, and hours. Pro ($45/mo) adds a Verified badge, direct call/book buttons, custom photos, and priority search placement. Premium ($89/mo) adds all Google photos, featured homepage placement, AI review responses, analytics, and lead capture.',
  },
  {
    question: 'How do I upgrade my listing?',
    answer:
      'Sign in to your Business Portal and click "Upgrade" in the sidebar navigation. You can choose between Pro and Premium tiers. Payment is handled securely through Stripe with monthly billing — no long-term contracts required.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer:
      'Yes. There are no long-term contracts. You can cancel your subscription at any time from the Business Portal settings. Your listing will revert to the Free tier at the end of your current billing period.',
  },
  {
    question: 'How do reviews work?',
    answer:
      'Anyone can leave a review on a business listing. Business owners on the Premium tier get access to AI-powered review response drafts that match their brand voice. All reviews are visible on the listing detail page.',
  },
  {
    question: 'How do I update my business hours or photos?',
    answer:
      'Sign in to your Business Portal. Use the "Hours" page to set your weekly schedule, and the "Photos" page to manage your gallery images. Pro and Premium tiers can upload custom photos.',
  },
  {
    question: 'I found incorrect information on a listing. How do I fix it?',
    answer:
      'If you\'re the business owner, claim your listing and update it through the portal. If you\'re a visitor, use the contact form below to report the issue and we\'ll investigate.',
  },
  {
    question: 'What areas does GreenLine365 cover?',
    answer:
      'We currently cover businesses across Florida, with destination guides for Key West, Miami, Tampa, Orlando, St. Petersburg, Fort Lauderdale, Jacksonville, and Sarasota. We\'re expanding to new regions regularly.',
  },
];

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('sending');

    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'greenline365help@gmail.com',
          subject: `[Support] ${formData.subject}`,
          html: `
            <p><strong>From:</strong> ${formData.name} (${formData.email})</p>
            <p><strong>Subject:</strong> ${formData.subject}</p>
            <hr />
            <p>${formData.message.replace(/\n/g, '<br />')}</p>
          `,
          text: `From: ${formData.name} (${formData.email})\nSubject: ${formData.subject}\n\n${formData.message}`,
        }),
      });

      if (res.ok) {
        setFormStatus('sent');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setFormStatus('error');
      }
    } catch {
      setFormStatus('error');
    }
  };

  return (
    <main className="min-h-screen bg-obsidian pt-24 pb-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white sm:text-5xl">
            How Can We Help?
          </h1>
          <p className="mt-4 text-lg text-white/60 max-w-2xl mx-auto">
            Find answers to common questions or reach out to our team directly.
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid gap-4 sm:grid-cols-3 mb-16">
          <Link
            href="/portal"
            className="group rounded-xl border border-white/10 bg-white/5 p-6 text-center transition-all hover:border-neon-green-500/30 hover:bg-white/10"
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-neon-green-500/20">
              <svg className="h-6 w-6 text-neon-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-white group-hover:text-neon-green-500">Business Portal</h3>
            <p className="mt-1 text-xs text-white/40">Manage your listing</p>
          </Link>

          <Link
            href="/pricing"
            className="group rounded-xl border border-white/10 bg-white/5 p-6 text-center transition-all hover:border-neon-green-500/30 hover:bg-white/10"
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-neon-green-500/20">
              <svg className="h-6 w-6 text-neon-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-white group-hover:text-neon-green-500">Pricing & Plans</h3>
            <p className="mt-1 text-xs text-white/40">Compare tier features</p>
          </Link>

          <Link
            href="/register-business"
            className="group rounded-xl border border-white/10 bg-white/5 p-6 text-center transition-all hover:border-neon-green-500/30 hover:bg-white/10"
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-neon-green-500/20">
              <svg className="h-6 w-6 text-neon-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-white group-hover:text-neon-green-500">Register Business</h3>
            <p className="mt-1 text-xs text-white/40">Claim your listing</p>
          </Link>
        </div>

        {/* FAQ Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-2">
            {FAQ_ITEMS.map((item, index) => (
              <div
                key={index}
                className="rounded-xl border border-white/10 bg-white/5 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left"
                >
                  <span className="text-sm font-medium text-white pr-4">{item.question}</span>
                  <svg
                    className={`h-5 w-5 shrink-0 text-white/40 transition-transform ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-sm text-white/60 leading-relaxed">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Contact Form */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-2">
            Contact Support
          </h2>
          <p className="text-sm text-white/50 mb-6">
            Can&apos;t find what you need? Send us a message and we&apos;ll get back to you within 24 hours.
          </p>

          {formStatus === 'sent' ? (
            <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-green-400">Message Sent</h3>
              <p className="mt-2 text-sm text-white/50">
                We&apos;ve received your message and will respond within 24 hours.
              </p>
              <button
                onClick={() => setFormStatus('idle')}
                className="mt-4 text-sm text-neon-green-500 hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-neon-green-500 focus:outline-none focus:ring-1 focus:ring-neon-green-500"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-neon-green-500 focus:outline-none focus:ring-1 focus:ring-neon-green-500"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-neon-green-500 focus:outline-none focus:ring-1 focus:ring-neon-green-500"
                  placeholder="What do you need help with?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Message</label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-neon-green-500 focus:outline-none focus:ring-1 focus:ring-neon-green-500"
                  placeholder="Describe your issue or question..."
                />
              </div>

              {formStatus === 'error' && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                  Something went wrong. Please try again or email us directly at{' '}
                  <a href="mailto:greenline365help@gmail.com" className="underline">
                    greenline365help@gmail.com
                  </a>
                </div>
              )}

              <button
                type="submit"
                disabled={formStatus === 'sending'}
                className="rounded-lg bg-neon-green-500 px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-neon-green-400 disabled:opacity-50"
              >
                {formStatus === 'sending' ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </section>

        {/* Direct Contact */}
        <section className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
          <h2 className="text-lg font-semibold text-white mb-2">
            Prefer to reach out directly?
          </h2>
          <p className="text-sm text-white/50 mb-4">
            Email us anytime and we&apos;ll get back to you as soon as possible.
          </p>
          <a
            href="mailto:greenline365help@gmail.com"
            className="inline-flex items-center gap-2 text-neon-green-500 hover:text-neon-green-400 text-sm font-medium"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            greenline365help@gmail.com
          </a>
        </section>
      </div>
    </main>
  );
}

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    tagline: 'Get discovered',
    description: 'Basic directory presence with room to grow.',
    cta: 'List Your Business',
    ctaHref: '/register-business',
    highlight: false,
    features: [
      { text: 'Basic directory listing', included: true },
      { text: 'Business name, address, phone & hours', included: true },
      { text: 'Placeholder image (no custom photos)', included: true },
      { text: 'Basic search visibility', included: true },
      { text: '7 Industry Badges (grayed out)', included: true, note: 'Upgrade to earn' },
      { text: 'Custom photos', included: false },
      { text: 'CTA buttons (Book / Call)', included: false },
      { text: 'Featured placement', included: false },
      { text: 'Analytics dashboard', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 45,
    period: '/mo',
    tagline: 'Get Chosen',
    description: 'When customers compare, you win. Trust signals + direct action buttons.',
    cta: 'Upgrade to Pro',
    ctaHref: '/register-business?tier=pro',
    highlight: false,
    features: [
      { text: 'Everything in Free', included: true },
      { text: '2 custom images (from Google Business)', included: true, note: '1 featured + 1 thumbnail' },
      { text: '"Verified Business" badge', included: true },
      { text: 'Direct CTA button (Book Now / Call Now)', included: true },
      { text: 'Business description & service areas', included: true },
      { text: 'Priority search over free listings', included: true },
      { text: 'Access to Directory Marketplace add-ons', included: true },
      { text: 'Featured homepage placement', included: false },
      { text: 'Full Google photo sync', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 89,
    period: '/mo',
    tagline: 'Get Booked',
    description: 'Your listing doesn\'t just get seen — it generates revenue you can measure.',
    cta: 'Go Premium',
    ctaHref: '/register-business?tier=premium',
    highlight: true,
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'All Google Business photos (auto-synced)', included: true },
      { text: 'Featured Listings on homepage Showcase', included: true },
      { text: 'AI Review Response engine (included)', included: true },
      { text: 'Analytics Pro dashboard (views, clicks, competitors)', included: true },
      { text: 'All earned badges eligible to light up', included: true },
      { text: 'Lead capture forms on your listing', included: true },
      { text: 'Priority support', included: true },
      { text: 'Access to Directory Marketplace add-ons', included: true },
    ],
  },
];

const MARKETPLACE = [
  { name: 'Coupon Engine', price: '$19', unit: '/mo (first 100 redemptions free, $0.30 each after)', desc: 'Create trackable QR coupons. Distributed on your listing and via SMS/email.', comingSoon: false },
  { name: 'Featured Boost', price: '$29', unit: '/week ($99/4 weeks)', desc: 'Temporary homepage spotlight for events, grand openings, or seasonal promotions.', comingSoon: false },
  { name: 'Custom Poll Template', price: '$150', unit: 'per template', desc: 'Industry-specific feedback polls tied to badge earning. Tailored to your business.', comingSoon: false },
  { name: 'QR Feedback Kit', price: '$39', unit: '/mo', desc: 'Branded QR codes + ongoing analytics for collecting reviews at point of service.', comingSoon: true },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative bg-[#0f0f0f] pt-28 pb-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url(/images/hero-directory.png)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f0f0f]/80 to-[#0f0f0f]" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#FF8C00' }}>
            Simple, Transparent Pricing
          </motion.p>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase">Early Access Beta</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl font-bold text-white mb-4" data-testid="pricing-title">
            Your Reputation Starts Here
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg text-white/60 max-w-xl mx-auto">
            Every badge is earned, never bought. Pick the tier that matches your ambition.
          </motion.p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-6xl mx-auto px-6 -mt-10 relative z-10" data-testid="pricing-cards">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TIERS.map((tier, i) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className={`relative rounded-2xl overflow-hidden ${
                tier.highlight
                  ? 'border-2 shadow-xl'
                  : 'border border-zinc-200'
              }`}
              style={tier.highlight ? { borderColor: '#FF8C00', boxShadow: '0 8px 40px rgba(255,140,0,0.15)' } : {}}
              data-testid={`pricing-${tier.id}`}
            >
              {tier.highlight && (
                <div className="text-center py-2 text-xs font-bold text-black tracking-wider" style={{ background: 'linear-gradient(135deg, #FF8C00, #FFB800)' }}>
                  MOST POPULAR
                </div>
              )}
              <div className="p-8 bg-white">
                {/* Header */}
                <h3 className="text-lg font-bold text-[#1a1a1a] mb-1">{tier.name}</h3>
                <p className="text-xs text-zinc-500 mb-4">{tier.tagline}</p>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-2">
                  {tier.price === 0 ? (
                    <span className="text-4xl font-black text-[#1a1a1a]">Free</span>
                  ) : (
                    <>
                      <span className="text-sm text-zinc-400">$</span>
                      <span className="text-4xl font-black text-[#1a1a1a]">{tier.price}</span>
                      <span className="text-sm text-zinc-400">{tier.period}</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-zinc-500 mb-6">{tier.description}</p>

                {/* CTA */}
                <Link
                  href={tier.ctaHref}
                  className={`block w-full text-center py-3 rounded-xl text-sm font-bold transition-all ${
                    tier.highlight
                      ? 'text-black hover:opacity-90'
                      : tier.id === 'free'
                        ? 'text-zinc-700 border border-zinc-300 hover:border-zinc-500'
                        : 'text-white hover:opacity-90'
                  }`}
                  style={
                    tier.highlight
                      ? { background: 'linear-gradient(135deg, #FF8C00, #FFB800)' }
                      : tier.id === 'free'
                        ? {}
                        : { background: '#1a1a1a' }
                  }
                  data-testid={`pricing-cta-${tier.id}`}
                >
                  {tier.cta}
                </Link>

                {/* Features */}
                <div className="mt-6 space-y-3">
                  {tier.features.map((f, fi) => (
                    <div key={fi} className="flex items-start gap-2.5">
                      {f.included ? (
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#10B981' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      )}
                      <div>
                        <span className={`text-xs ${f.included ? 'text-zinc-700' : 'text-zinc-400'}`}>{f.text}</span>
                        {f.note && <span className="text-[10px] text-zinc-400 ml-1">({f.note})</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Ghost Badge Visual */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center" data-testid="badge-visual">
        <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#FF8C00' }}>The Greenline365 Stamp of Approval</p>
        <h2 className="text-3xl font-bold text-[#1a1a1a] mb-4">Badges Are Earned, Never Bought</h2>
        <p className="text-zinc-500 max-w-lg mx-auto mb-10">
          Every business starts with 7 locked badges. As you collect real feedback from real customers, your badges light up — proving your excellence to the world.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {[
            { name: 'Intelligence Verified', color: '#10B981', active: true },
            { name: 'Spotless Pro', color: '#3B82F6', active: true },
            { name: 'Local Vibe Elite', color: '#8B5CF6', active: false },
            { name: 'Master Technician', color: '#F59E0B', active: false },
            { name: 'Safety Certified', color: '#EF4444', active: false },
            { name: 'Service 5-Star', color: '#EC4899', active: false },
            { name: 'Booking Pro', color: '#06B6D4', active: false },
          ].map((badge) => (
            <div
              key={badge.name}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold transition-all ${
                badge.active
                  ? 'text-white shadow-lg'
                  : 'text-zinc-400 border border-zinc-200'
              }`}
              style={badge.active ? { background: badge.color, boxShadow: `0 4px 20px ${badge.color}33` } : { filter: 'grayscale(100%)', opacity: 0.5 }}
              data-testid={`badge-${badge.name.toLowerCase().replace(/\s/g, '-')}`}
            >
              {badge.active ? (
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              )}
              {badge.name}
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-400 mt-6">2 of 7 badges earned — upgrade to Premium to unlock badge earning through customer polls</p>
      </section>

      {/* Directory Marketplace */}
      <section className="bg-[#0f0f0f] py-20" data-testid="marketplace-section">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#FF8C00' }}>Directory Marketplace</p>
            <h2 className="text-3xl font-bold text-white mb-3">Power-Ups for Your Listing</h2>
            <p className="text-zinc-400 max-w-lg mx-auto">
              Available to Pro and Premium members. Supercharge your directory presence with targeted add-ons.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {MARKETPLACE.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`rounded-2xl border p-6 transition-all group ${item.comingSoon ? 'border-zinc-800/50 opacity-60' : 'border-zinc-800 hover:border-orange-500/30'}`}
                style={{ background: 'rgba(255,255,255,0.03)' }}
                data-testid={`marketplace-${item.name.toLowerCase().replace(/\s/g, '-')}`}
              >
                <div className="flex items-baseline justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{item.name}</h3>
                    {item.comingSoon && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20">Coming Soon</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold" style={{ color: '#FF8C00' }}>{item.price}</span>
                    <span className="text-[10px] text-zinc-500 block">{item.unit}</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-xs text-zinc-600 mt-8">
            Marketplace add-ons require an active Pro or Premium subscription. Transaction fees ($0.60/interaction) apply to directory-only listings.
          </p>
        </div>
      </section>

      {/* FAQ / CTA */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">Not sure which tier is right?</h2>
        <p className="text-zinc-500 mb-8">
          Start with Free — your listing goes live immediately with all 7 badges visible. Upgrade anytime as your reputation grows.
        </p>
        <Link
          href="/register-business"
          className="inline-block px-8 py-3.5 rounded-xl text-sm font-bold text-black transition hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #FF8C00, #FFB800)' }}
          data-testid="pricing-bottom-cta"
        >
          Add Your Business — It&apos;s Free
        </Link>
      </section>
    </div>
  );
}

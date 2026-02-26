'use client';

/**
 * GL365 Home Ledger — Landing Page
 * Deep obsidian luxury aesthetic. Gold-only accents.
 * NOT in main nav. Accessible via direct link, footer, or internal CTA.
 *
 * Sections:
 * 1. Hero — Dark luxury with gold shield icon
 * 2. Who It's For — 3-column (Homeowners, Property Managers, Investors)
 * 3. What's Inside — Feature walkthrough (Passport, Filing Cabinet, Incidents, Referral)
 * 4. Trust Bar — AES-256, Privacy, No contracts, Cancel anytime
 * 5. CTA — "Create Your First Property — Free"
 */

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function HomeLedgerPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* ═══════════════════════════════════════════════════════════
          SECTION 1 — HERO
          Deep obsidian with silk texture, gold shield, circuit patterns
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Silk texture layers */}
        <div className="absolute inset-0 silk-texture" />
        <div className="absolute inset-0 circuit-bg opacity-20" />

        {/* Gold ambient glow */}
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(800px circle at 30% 40%, rgba(201,168,76,0.06) 0%, transparent 50%),
            radial-gradient(600px circle at 70% 60%, rgba(201,168,76,0.04) 0%, transparent 50%)
          `
        }} />

        {/* Gold particles */}
        <div className="gold-particles">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="gold-particle" style={{
              left: `${8 + i * 7}%`,
              animationDelay: `${i * 0.6}s`,
              animationDuration: `${4 + i * 0.4}s`,
            }} />
          ))}
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Gold Shield Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mx-auto mb-10 vault-icon-glow"
          >
            <div className="w-28 h-28 mx-auto rounded-2xl flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, #C9A84C 0%, #8A6A1C 40%, #C9A84C 80%, #E8C97A 100%)',
              boxShadow: '0 0 60px rgba(201,168,76,0.3), 0 20px 60px rgba(0,0,0,0.5)',
            }}>
              <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <p className="text-xs font-heading uppercase tracking-[0.3em] mt-4" style={{ color: 'rgba(201,168,76,0.6)' }}>GL365 Home Ledger</p>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-light tracking-tight leading-[1.1] mb-6"
            style={{
              background: 'linear-gradient(135deg, #C9A84C 0%, #E8C97A 40%, #F0DFA0 60%, #C9A84C 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            YOUR HOME&apos;S HERITAGE.<br />DOCUMENTED.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="text-lg sm:text-xl font-body text-white/60 max-w-2xl mx-auto leading-relaxed mb-4"
          >
            The only property file your business will ever need. Documents, contacts, incidents, warranties, contractors — all connected.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1 }}
            className="text-sm font-body text-white/35 max-w-xl mx-auto mb-10"
          >
            Every property you manage or own, organized in one intelligent, military-grade encrypted file.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/waitlist"
              className="px-10 py-4 rounded-full text-sm font-bold uppercase tracking-widest text-black transition-all hover:shadow-gold-lg hover:-translate-y-1"
              style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #E8C97A 100%)', boxShadow: '0 0 30px rgba(201,168,76,0.3)' }}
            >
              Join the Waitlist — Get Early Access
            </Link>
          </motion.div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 2 — WHO IT'S FOR
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="section-divider-gold mx-auto mb-16" />

          <div className="text-center mb-16">
            <p className="text-xs font-heading font-semibold uppercase tracking-[0.25em] mb-4" style={{ color: 'rgba(201,168,76,0.6)' }}>Built For</p>
            <h2 className="text-3xl sm:text-4xl font-heading font-light text-white tracking-tight">
              Who Is the Home Ledger <span className="text-gradient-gold font-semibold">For?</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
                title: 'Homeowners',
                desc: 'Track every repair, warranty, and contractor in one place. Never lose a receipt again.',
              },
              {
                icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
                title: 'Property Managers',
                desc: 'Manage multiple properties without the spreadsheet chaos. Every address has its own file.',
              },
              {
                icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
                title: 'Real Estate Investors',
                desc: 'Know the exact status, health score, and history of every property in your portfolio.',
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="rounded-2xl border border-white/8 p-8 text-center transition-all duration-300 hover:border-[rgba(201,168,76,0.2)] hover:shadow-gold-sm"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-xl flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)' }}>
                  <svg className="w-8 h-8" style={{ color: '#C9A84C' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <h3 className="text-xl font-heading font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-sm text-white/50 font-body leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 3 — WHAT'S INSIDE
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 relative" style={{ background: 'linear-gradient(180deg, #080808, #0A0A0A, #080808)' }}>
        <div className="absolute inset-0 circuit-bg opacity-10" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-heading font-semibold uppercase tracking-[0.25em] mb-4" style={{ color: 'rgba(201,168,76,0.6)' }}>Inside the Vault</p>
            <h2 className="text-3xl sm:text-4xl font-heading font-light text-white tracking-tight mb-4">
              What&apos;s <span className="text-gradient-gold font-semibold">Inside</span>
            </h2>
            <p className="text-white/40 max-w-lg mx-auto font-body text-sm">Four interconnected modules that give you complete property intelligence.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
                title: 'Property Passport',
                desc: 'The master file for each address. Contacts, notes, status, health score — everything about your property in one place.',
                tag: 'Core Module',
              },
              {
                icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
                title: 'Filing Cabinet',
                desc: 'AES-256 encrypted document storage. Receipts, warranties, contracts, tax docs — all organized and private.',
                tag: 'Encrypted',
              },
              {
                icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
                title: 'Incidents',
                desc: 'Damage documentation with photo capture, digital signature collection, and resolution tracking. Every event becomes part of the property record.',
                tag: 'Photo + Signature',
              },
              {
                icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
                title: 'Referral Network',
                desc: 'Your trusted contractor directory. Plumbers, electricians, HVAC — all verified and linked to your properties.',
                tag: 'Verified Pros',
              },
            ].map((module, i) => (
              <motion.div
                key={module.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="rounded-2xl border border-white/8 p-8 relative overflow-hidden transition-all duration-300 hover:border-[rgba(201,168,76,0.2)] hover:-translate-y-1 group"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                {/* Top gold accent line */}
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)' }} />

                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)' }}>
                    <svg className="w-7 h-7" style={{ color: '#C9A84C' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={module.icon} />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-heading font-semibold text-white">{module.title}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-body uppercase tracking-wider" style={{ color: 'rgba(201,168,76,0.7)', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)' }}>{module.tag}</span>
                    </div>
                    <p className="text-sm text-white/45 font-body leading-relaxed">{module.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 4 — TRUST BAR
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="section-divider-gold mx-auto mb-12" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', label: 'AES-256 Encryption', sub: 'Military-Grade' },
              { icon: 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21', label: 'Your Files Are Private', sub: 'GL365 Cannot Access' },
              { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', label: 'No Long-Term Contracts', sub: 'Month-to-Month' },
              { icon: 'M6 18L18 6M6 6l12 12', label: 'Cancel Anytime', sub: 'Zero Penalties' },
            ].map((trust, i) => (
              <motion.div
                key={trust.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-lg flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.1)' }}>
                  <svg className="w-6 h-6" style={{ color: '#C9A84C' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={trust.icon} />
                  </svg>
                </div>
                <p className="text-sm font-heading font-semibold text-white mb-1">{trust.label}</p>
                <p className="text-xs text-white/35 font-body">{trust.sub}</p>
              </motion.div>
            ))}
          </div>
          <div className="section-divider-gold mx-auto mt-12" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 5 — FINAL CTA
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(800px circle at 50% 50%, rgba(201,168,76,0.05) 0%, transparent 50%)'
        }} />

        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-light text-white tracking-tight mb-4">
              Create Your First Property — <span className="text-gradient-gold font-semibold">Free</span>
            </h2>
            <p className="text-white/45 font-body mb-10 text-sm">No credit card required. Takes 2 minutes.</p>

            <Link
              href="/waitlist"
              className="inline-block px-10 py-4 rounded-full text-sm font-bold uppercase tracking-widest text-black transition-all hover:shadow-gold-lg hover:-translate-y-1"
              style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #E8C97A 100%)', boxShadow: '0 0 30px rgba(201,168,76,0.3)' }}
            >
              Get Started
            </Link>

            <p className="text-white/20 text-xs font-body mt-8">
              Questions? <a href="mailto:greenline365help@gmail.com" className="underline hover:text-white/40 transition">greenline365help@gmail.com</a>
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const FEATURES = [
  {
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    title: 'Property Health Score',
    description: 'A real-time health score for your property based on maintenance history, age of systems, and reported incidents.',
  },
  {
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    title: 'Maintenance Timeline',
    description: 'Every repair, inspection, and service call — documented with timestamps, contractors, and costs.',
  },
  {
    icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
    title: 'Asset & Warranty Vault',
    description: 'Track every appliance, system, and fixture with warranty dates, model numbers, and service records.',
  },
  {
    icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    title: 'Behind-the-Walls Photo Vault',
    description: 'Document what\'s behind your walls before they\'re closed up. Plumbing runs, wiring, insulation — all photographed and tagged.',
  },
  {
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    title: 'Incident & Clearance History',
    description: 'Full incident reports with resolution tracking, contractor clearance letters, and compliance documentation.',
  },
  {
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    title: 'Multi-User Access',
    description: 'Share access with your spouse, tenant, property manager, or contractor. Everyone sees what they need.',
  },
];

const STEPS = [
  {
    number: '01',
    title: 'Connect Your Property',
    description: 'We onboard your property with a comprehensive data intake — address, systems, known history, and existing documentation.',
  },
  {
    number: '02',
    title: 'We Build Your Property Passport',
    description: 'Our team creates your digital property profile — a living document that tracks everything about your home.',
  },
  {
    number: '03',
    title: 'Access Intelligence Forever',
    description: 'Every service call, inspection, and incident gets logged. Your property\'s story grows with every interaction.',
  },
];

export default function HomeLedgerClient() {
  return (
    <main className="min-h-screen bg-midnight-950">
      {/* ─── HERO ─── */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-midnight-950 via-midnight-900 to-midnight-950" />
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-radial-gold opacity-5 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-radial-green opacity-5 blur-3xl rounded-full pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-gold border border-gold/20 mb-6">
              <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
              <span className="text-xs font-semibold text-gold tracking-wide">HOME LEDGER</span>
            </span>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-light text-white tracking-tight mb-6">
              The <span className="font-semibold text-gradient-gold">Carfax</span> for Your Home
            </h1>

            <p className="text-lg text-white/50 max-w-2xl mx-auto font-body mb-4">
              Complete property intelligence: maintenance history, behind-the-walls documentation, asset tracking, and incident resolution — all in one place.
            </p>

            <p className="text-sm text-white/30 max-w-xl mx-auto font-body mb-10">
              Know everything about your property. Before you buy, while you own, and when you sell.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/demo-calendar" className="btn-primary px-8 py-3 rounded-full text-sm inline-block">
                Schedule a Demo
              </Link>
              <a href="mailto:greenline365help@gmail.com" className="btn-ghost px-8 py-3 rounded-full text-sm inline-block">
                Talk to Sales
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-20 bg-charcoal-900">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-heading font-semibold uppercase tracking-[0.2em] text-center mb-3 text-gold">How It Works</p>
          <h2 className="text-3xl md:text-4xl font-heading font-light text-white text-center mb-4 tracking-tight">
            Three Steps to <span className="font-semibold text-gradient-gold">Property Intelligence</span>
          </h2>
          <p className="text-white/50 text-center max-w-lg mx-auto mb-14 font-body">
            From onboarding to ongoing intelligence in one streamlined process.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <div className="rounded-2xl p-6 border border-white/10 backdrop-blur-sm h-full" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <span className="text-5xl font-heading font-bold text-gold/10 block mb-4">{step.number}</span>
                  <h3 className="text-lg font-heading font-semibold text-white mb-3">{step.title}</h3>
                  <p className="text-sm text-white/50 font-body leading-relaxed">{step.description}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 text-center">
                    <svg className="w-5 h-5 text-gold/30 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES GRID ─── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-heading font-semibold uppercase tracking-[0.2em] text-center mb-3 text-gold">Capabilities</p>
          <h2 className="text-3xl md:text-4xl font-heading font-light text-white text-center mb-4 tracking-tight">
            Everything About Your <span className="font-semibold text-gradient-gold">Property</span>
          </h2>
          <p className="text-white/50 text-center max-w-lg mx-auto mb-14 font-body">
            A comprehensive digital twin of your property&apos;s history, health, and documentation.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl p-6 border border-white/10 hover:border-gold/20 transition-all duration-300"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-gold/30 bg-gold/10 mb-4">
                  <svg className="w-6 h-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={feature.icon} />
                  </svg>
                </div>
                <h3 className="text-base font-heading font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-white/50 font-body leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── USE CASES ─── */}
      <section className="py-20 bg-charcoal-900">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-heading font-semibold uppercase tracking-[0.2em] text-center mb-3 text-gold">Who It&apos;s For</p>
          <h2 className="text-3xl md:text-4xl font-heading font-light text-white text-center mb-14 tracking-tight">
            Built for <span className="font-semibold text-gradient-gold">Everyone</span> in the Property Ecosystem
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: 'Homeowners',
                description: 'Know your home inside and out. Track maintenance, monitor warranties, and build a complete property history that adds value when you sell.',
                icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
              },
              {
                title: 'Property Managers',
                description: 'Manage multiple properties with full documentation trails. Incident tracking, vendor management, and clearance letter generation — automated.',
                icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
              },
              {
                title: 'Service Contractors',
                description: 'Document your work with photos, notes, and completion records. Build trust with clients through the GL365 verified contractor network.',
                icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
              },
              {
                title: 'Real Estate Agents',
                description: 'Differentiate your listings with a full property passport. Buyers get confidence, sellers get top dollar. Everybody wins.',
                icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
              },
            ].map((useCase, i) => (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl p-6 border border-white/10 flex gap-4"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-gold/30 bg-gold/10 flex-shrink-0">
                  <svg className="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={useCase.icon} />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-heading font-semibold text-white mb-2">{useCase.title}</h3>
                  <p className="text-sm text-white/50 font-body leading-relaxed">{useCase.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TRUST / INTEGRATION ─── */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs font-heading font-semibold uppercase tracking-[0.2em] text-center mb-3 text-gold">Integrated</p>
          <h2 className="text-3xl md:text-4xl font-heading font-light text-white mb-4 tracking-tight">
            Powered by the <span className="font-semibold text-gradient-gold">GL365 Directory</span>
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto mb-12 font-body">
            Home Ledger connects to the GL365 verified business directory. When you need a contractor, we match you with trusted, rated professionals already in the ecosystem.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { value: 'Verified', label: 'Service Providers', desc: 'Every contractor in our network is verified through the GL365 directory' },
              { value: 'Complete', label: 'Documentation', desc: 'Before, during, and after photos for every service interaction' },
              { value: 'Permanent', label: 'Property Record', desc: 'Your property\'s history follows the home — not the homeowner' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl p-6 border border-white/10" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <p className="text-2xl font-heading font-bold text-gold mb-1">{stat.value}</p>
                <p className="text-sm font-heading font-semibold text-white mb-2">{stat.label}</p>
                <p className="text-xs text-white/40 font-body">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 bg-charcoal-900">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-light text-white mb-4 tracking-tight">
            Ready to Know Your <span className="font-semibold text-gradient-gold">Property</span>?
          </h2>
          <p className="text-white/50 font-body mb-8 max-w-xl mx-auto">
            Schedule a personalized demo to see how Home Ledger can transform your property management.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/demo-calendar" className="btn-primary px-8 py-3 rounded-full text-sm inline-block">
              Schedule a Demo
            </Link>
            <a href="mailto:greenline365help@gmail.com" className="btn-ghost px-8 py-3 rounded-full text-sm inline-block">
              Talk to Sales
            </a>
          </div>
          <p className="text-xs text-white/30 mt-6 font-body">
            Home Ledger is part of the GL365 Tactical Command Center. Pricing details provided during your consultation.
          </p>
        </div>
      </section>
    </main>
  );
}

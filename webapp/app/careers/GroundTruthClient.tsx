'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const ROLES = [
  {
    title: 'Certified Field Auditor',
    subtitle: 'Store Ratings',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    color: 'from-gold/20 to-amber-600/20',
    borderColor: 'border-gold/30',
    description: 'Instead of random reviews, our paid teams perform Greenline Professional Audits.',
    duties: [
      { label: 'The Mission', text: 'Walk into businesses with a checklist designed by the Greenline AI-Employee.' },
      { label: 'The Audit', text: 'Check for "Greenline Readiness" — cleanliness, staff knowledge, and the display of the Greenline QR Shield.' },
      { label: 'The Technical Eye', text: 'Audit service-based businesses (HVAC, Plumbing, Electrical) for equipment quality, licensing, and professional "Service Spirit."' },
      { label: 'The Result', text: 'Businesses earn the "Greenline Verified Audit" — the Gold Standard badge that cannot be bought, only earned.' },
    ],
  },
  {
    title: 'Hyper-Local Journalist',
    subtitle: 'The Town Crier',
    icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z',
    color: 'from-blue-500/20 to-cyan-500/20',
    borderColor: 'border-blue-500/30',
    description: 'Local journalism is dying, and we are filling the gap. We are hiring writers to become the Information Hub for their towns.',
    duties: [
      { label: 'Community Intelligence', text: 'Cover local town hall meetings, new real estate developments, and "Home Health Alerts."' },
      { label: 'The Nudge', text: 'Connect local events to property health. When covering local humidity spikes or water main projects, guide citizens to check their Home Ledger scores.' },
      { label: 'The SEO Moat', text: 'Help build the #1 search result for every zip code in the network.' },
    ],
  },
  {
    title: 'Neighborhood Shield',
    subtitle: 'Verification Teams',
    icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
    color: 'from-emerald-500/20 to-green-500/20',
    borderColor: 'border-emerald-500/30',
    description: 'Our paid teams act as the quality enforcement layer for the directory.',
    duties: [
      { label: 'Bad Actor Detection', text: 'We deploy "Mystery Shoppers" to hire contractors who are receiving complaints.' },
      { label: 'The Accountability Twist', text: 'If a contractor fails the audit, they lose their "Greenline Certified" status instantly. We ensure the directory is only filled with the best of the best.' },
    ],
  },
];

export default function GroundTruthClient() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    setMessage('');

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          industry: 'ground-truth-task-force',
          source: 'careers-page',
        }),
      });

      const data = await res.json();

      if (data.alreadyVerified) {
        setMessage('You\'re already on the list. We\'ll be in touch.');
        setSuccess(true);
      } else if (data.requiresVerification) {
        setMessage('Check your email to verify your spot on the list.');
        setSuccess(true);
      } else if (data.error) {
        setMessage(data.error);
      } else {
        setMessage(data.message || 'You\'re on the list.');
        setSuccess(true);
      }
    } catch {
      setMessage('Something went wrong. Please try again.');
    }

    setSubmitting(false);
  }

  return (
    <main className="min-h-screen bg-midnight-950">
      {/* ─── HERO ─── */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-midnight-950 via-midnight-900 to-midnight-950" />
        <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-radial-gold opacity-5 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-radial-green opacity-5 blur-3xl rounded-full pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-gold border border-gold/20 mb-6">
              <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
              <span className="text-xs font-semibold text-gold tracking-wide">COMING SOON</span>
            </span>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-light text-white tracking-tight mb-6">
              The Ground Truth <span className="font-semibold text-gradient-gold">Task Force</span>
            </h1>

            <p className="text-lg text-white/60 max-w-2xl mx-auto font-body mb-4">
              We aren&apos;t replacing the GL365 review system — we are upgrading the world&apos;s integrity.
            </p>

            <p className="text-sm text-white/40 max-w-xl mx-auto font-body">
              Once the GreenLine365 directory reaches its 100-Company Milestone, we will begin hiring the Ground Truth Task Force. This is how we turn a directory into a Local Intelligence Empire.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── THE VISION ─── */}
      <section className="py-16 bg-charcoal-900">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl p-8 md:p-10 border border-gold/20 text-center"
            style={{ background: 'linear-gradient(135deg, rgba(201,169,110,0.05), rgba(201,169,110,0.02))' }}
          >
            <p className="text-xs font-heading font-semibold uppercase tracking-[0.2em] text-gold mb-4">The Shift</p>
            <h2 className="text-2xl md:text-3xl font-heading font-light text-white tracking-tight mb-4">
              From User-Generated Content to <span className="font-semibold text-gradient-gold">Paid Professional Audits</span>
            </h2>
            <p className="text-white/50 font-body max-w-2xl mx-auto leading-relaxed">
              By moving from crowdsourced reviews to paid professional audits, we are creating a level of data integrity that no existing platform can touch. This is a Premium Verification Layer that sits on top of the existing review system — turning the directory into an elite network.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── OPEN ROLES ─── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-heading font-semibold uppercase tracking-[0.2em] text-center mb-3 text-gold">Open Roles in the Empire</p>
          <h2 className="text-3xl md:text-4xl font-heading font-light text-white text-center mb-4 tracking-tight">
            Three Pillars of <span className="font-semibold text-gradient-gold">Ground Truth</span>
          </h2>
          <p className="text-white/50 text-center max-w-lg mx-auto mb-14 font-body">
            Each role is designed to build the Source of Truth for the physical world.
          </p>

          <div className="space-y-8">
            {ROLES.map((role, i) => (
              <motion.div
                key={role.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-2xl border ${role.borderColor} overflow-hidden`}
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                {/* Role header */}
                <div className={`bg-gradient-to-r ${role.color} px-6 md:px-8 py-6 flex items-center gap-4`}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-white/20 bg-midnight-900/50 flex-shrink-0">
                    <svg className="w-6 h-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={role.icon} />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-heading font-semibold text-white">{role.title}</h3>
                    <p className="text-sm text-white/50 font-body">{role.subtitle}</p>
                  </div>
                </div>

                {/* Role body */}
                <div className="px-6 md:px-8 py-6">
                  <p className="text-sm text-white/60 font-body mb-6 leading-relaxed">{role.description}</p>

                  <div className="space-y-4">
                    {role.duties.map((duty) => (
                      <div key={duty.label} className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-gold/60 mt-2 flex-shrink-0" />
                        <div>
                          <span className="text-sm font-heading font-semibold text-gold/80">{duty.label}:</span>
                          <span className="text-sm text-white/50 font-body ml-1">{duty.text}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── THE PROMISE ─── */}
      <section className="py-16 bg-charcoal-900">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
                title: 'Paid Accuracy',
                description: 'By paying for accuracy, we remove the trolls and the fake reviews.',
              },
              {
                icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
                title: 'Official Record',
                description: 'We become the Official Record of the Town. The source of truth for the physical world.',
              },
              {
                icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
                title: 'Gold Standard',
                description: 'The "Greenline Verified Audit" badge cannot be bought — only earned through professional evaluation.',
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl p-6 border border-white/10 text-center"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-gold/30 bg-gold/10 mx-auto mb-4">
                  <svg className="w-6 h-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <h3 className="text-base font-heading font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-white/50 font-body leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── EMAIL SIGNUP ─── */}
      <section className="py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <p className="text-xs font-heading font-semibold uppercase tracking-[0.2em] text-center mb-3 text-gold">Join the Waiting List</p>
          <h2 className="text-3xl md:text-4xl font-heading font-light text-white mb-4 tracking-tight">
            Be First to <span className="font-semibold text-gradient-gold">Join the Force</span>
          </h2>
          <p className="text-white/50 font-body mb-8 max-w-lg mx-auto">
            We are building the Source of Truth for the physical world. Would you like to be notified the moment we hit our milestone and begin hiring?
          </p>

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl p-8 border border-gold/20"
              style={{ background: 'rgba(201,169,110,0.05)' }}
            >
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center border border-gold/30 bg-gold/10">
                <svg className="w-8 h-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg font-heading font-semibold text-white mb-2">You&apos;re on the List</p>
              <p className="text-sm text-white/50 font-body">{message}</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-sm text-white placeholder:text-white/30 font-body focus:outline-none focus:border-gold/40 transition-all"
              />
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary px-6 py-3 rounded-full text-sm font-heading font-semibold whitespace-nowrap disabled:opacity-50"
              >
                {submitting ? 'Joining...' : 'Join the Waitlist'}
              </button>
            </form>
          )}

          {message && !success && (
            <p className="text-sm text-red-400/80 mt-3 font-body">{message}</p>
          )}

          <p className="text-xs text-white/20 mt-6 font-body">
            Ground Truth Newsletter — we&apos;ll notify you when we hit the milestone and begin hiring.
          </p>
        </div>
      </section>

      {/* ─── BACK TO DIRECTORY CTA ─── */}
      <section className="py-12 bg-charcoal-900">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-white/40 font-body text-sm mb-4">In the meantime, explore the directory that started it all.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/" className="btn-primary px-6 py-3 rounded-full text-sm inline-block">
              Explore the Directory
            </Link>
            <Link href="/register-business" className="btn-ghost px-6 py-3 rounded-full text-sm inline-block">
              Add Your Business
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

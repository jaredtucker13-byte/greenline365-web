'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function BookDemoPage() {
  return (
    <div className="pt-24 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl font-heading font-bold text-white mb-3">
            Book a <span className="text-gradient-gold">Demo</span>
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            See how GreenLine365 can transform your local business presence.
            We&apos;ll walk you through the directory, dashboard, and AI tools.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-8 space-y-8"
        >
          {/* What you'll see */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">What we&apos;ll cover</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { title: 'Directory Listing', desc: 'How your business appears to customers' },
                { title: 'Business Dashboard', desc: 'Manage reviews, photos, and analytics' },
                { title: 'AI Content Tools', desc: 'Blog generation, review responses, trend tracking' },
                { title: 'QR Shield System', desc: 'Customer feedback and coupon delivery' },
              ].map((item) => (
                <div key={item.title} className="flex gap-3 p-3 rounded-lg bg-white/5">
                  <div className="w-2 h-2 mt-2 rounded-full bg-gold flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <p className="text-xs text-white/50">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center space-y-4 pt-4 border-t border-white/10">
            <p className="text-white/70 text-sm">
              Ready to see it in action? Reach out and we&apos;ll set up a time that works for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="mailto:greenline365help@gmail.com?subject=Demo%20Request"
                className="btn-primary inline-flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Us for a Demo
              </a>
              <Link
                href="/pricing"
                className="btn-ghost inline-flex items-center justify-center gap-2"
              >
                View Pricing First
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

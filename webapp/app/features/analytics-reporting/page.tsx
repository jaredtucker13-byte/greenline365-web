'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/os';
import SEOBreadcrumbs from '@/app/components/SEOBreadcrumbs';

const METRIC_CARDS = [
  { label: 'Profile Views', value: '2,847', change: '+18%', icon: '👁' },
  { label: 'Click-to-Call', value: '312', change: '+24%', icon: '📞' },
  { label: 'Reviews', value: '47', change: '+8', icon: '⭐' },
  { label: 'Avg Rating', value: '4.7', change: '+0.2', icon: '📊' },
];

const FEATURES = [
  {
    title: 'Real-Time Dashboard',
    description: 'See views, clicks, calls, and reviews update live. No waiting for weekly reports.',
    icon: '📈',
  },
  {
    title: 'Customer Journey Tracking',
    description: 'See how customers find your listing — search, category browse, featured placement, or direct link.',
    icon: '🗺',
  },
  {
    title: 'Review Analytics',
    description: 'AI sentiment analysis on every review. Know your strengths and where to improve at a glance.',
    icon: '💬',
  },
  {
    title: 'Competitor Benchmarking',
    description: 'See how your listing stacks up against others in your category and city.',
    icon: '🏆',
  },
  {
    title: 'Conversion Metrics',
    description: 'Track which visitors click your CTA buttons, call your number, or visit your website.',
    icon: '🎯',
  },
  {
    title: 'Monthly Reports',
    description: 'Automated email reports with your key metrics, trends, and actionable recommendations.',
    icon: '📧',
  },
];

export default function AnalyticsReportingPage() {
  return (
    <>
      <SEOBreadcrumbs
        items={[
          { name: 'Home', url: '/' },
          { name: 'Features', url: '/features' },
          { name: 'Analytics & Reporting' },
        ]}
      />

      <main className="min-h-screen bg-os-dark relative">
        {/* Hero Section */}
        <section className="relative min-h-[70vh] flex items-center overflow-hidden pt-32 pb-20">
          <div className="absolute inset-0 bg-os-dark" />
          <div className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-neon-green-500/10 to-transparent blur-3xl" />

          <div className="relative z-10 w-full max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 glass-green rounded-full border border-neon-green-500/30">
                  <span className="w-2 h-2 bg-neon-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-neon-green-400 font-semibold tracking-wide">BUSINESS INTELLIGENCE</span>
                </div>

                <h1 className="font-display font-bold text-white mb-6" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: '1.1' }}>
                  Know Your <span className="text-neon-green-500">Numbers</span>
                </h1>

                <p className="text-white/70 text-lg mb-8 leading-relaxed">
                  Real-time analytics that show exactly how customers find and engage with your business.
                  Track views, clicks, calls, reviews, and conversions — all in one dashboard.
                </p>

                <div className="flex flex-wrap gap-4 mb-8">
                  <Link href="/register-business?tier=premium">
                    <Button variant="primary" size="lg">
                      Get Analytics Dashboard
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button variant="secondary" size="lg">
                      View Plans
                    </Button>
                  </Link>
                </div>

                <p className="text-white/40 text-sm">
                  Available on Premium tier ($89/mo). Includes all Pro features.
                </p>
              </div>

              {/* Mock Dashboard */}
              <div className="glass p-6 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  <span className="ml-2 text-white/40 text-xs">analytics.greenline365.com</span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {METRIC_CARDS.map((metric) => (
                    <div key={metric.label} className="glass p-3 rounded-lg border border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-white/50">{metric.label}</span>
                        <span className="text-lg">{metric.icon}</span>
                      </div>
                      <div className="text-xl font-bold text-white">{metric.value}</div>
                      <div className="text-xs text-neon-green-400">{metric.change} this month</div>
                    </div>
                  ))}
                </div>

                {/* Mini Chart */}
                <div className="glass p-4 rounded-lg border border-white/5">
                  <div className="text-xs text-white/50 mb-3">Views — Last 7 Days</div>
                  <div className="flex items-end gap-1 h-16">
                    {[40, 55, 45, 70, 65, 80, 90].map((h, i) => (
                      <div key={i} className="flex-1 bg-neon-green-500/30 rounded-t" style={{ height: `${h}%` }}>
                        <div className="w-full bg-neon-green-500 rounded-t" style={{ height: '40%' }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 border-t border-white/5">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <h2 className="font-display text-3xl font-bold text-white text-center mb-4">
              Everything You Need to Grow
            </h2>
            <p className="text-white/60 text-center mb-12 max-w-2xl mx-auto">
              Stop guessing. Start knowing. Our analytics dashboard gives you the data-driven insights
              that turn a listing into a lead machine.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="glass p-6 rounded-xl border border-white/5 hover:border-neon-green-500/30 transition-colors">
                  <div className="text-3xl mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 border-t border-white/5">
          <div className="max-w-[800px] mx-auto px-4 sm:px-6 text-center">
            <h2 className="font-display text-3xl font-bold text-white mb-4">
              Ready to See Your Data?
            </h2>
            <p className="text-white/60 mb-8">
              Upgrade to Premium and get instant access to your analytics dashboard.
              See exactly how customers find and engage with your business.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/register-business?tier=premium">
                <Button variant="primary" size="lg">
                  Start Premium — $89/mo
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

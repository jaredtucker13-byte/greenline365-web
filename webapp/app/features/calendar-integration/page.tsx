'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/os';
import SEOBreadcrumbs from '@/app/components/SEOBreadcrumbs';

const EVENT_TYPES = [
  { color: 'bg-blue-500', label: 'Bookings', count: 3 },
  { color: 'bg-neon-green-500', label: 'Content', count: 5 },
  { color: 'bg-amber-500', label: 'Campaigns', count: 2 },
  { color: 'bg-purple-500', label: 'Newsletters', count: 1 },
  { color: 'bg-pink-500', label: 'Blog Posts', count: 4 },
];

export default function CalendarIntegrationPage() {
  return (
    <>
      <SEOBreadcrumbs
        items={[
          { name: 'Home', url: '/' },
          { name: 'Features', url: '/features' },
          { name: 'Calendar Integration' },
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
                  <span className="text-xs text-neon-green-400 font-semibold tracking-wide">UNIFIED CALENDAR</span>
                </div>

                <h1 className="font-display font-bold text-white mb-6" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: '1.1' }}>
                  One Calendar for <span className="text-neon-green-500">Everything</span>
                </h1>

                <p className="text-white/70 text-lg mb-8 leading-relaxed">
                  Stop switching between apps. See bookings, content schedules, email campaigns, and team availability in a single color-coded calendar with two-way sync.
                </p>

                <div className="flex flex-wrap gap-4 mb-8">
                  <Link href="/services#booking">
                    <Button variant="primary" size="lg">
                      Get Started
                    </Button>
                  </Link>
                  <Link href="/features/automated-scheduling">
                    <Button variant="secondary" size="lg">
                      See Scheduling →
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  {[
                    { value: '5+', label: 'Event Sources' },
                    { value: '2-way', label: 'Calendar Sync' },
                    { value: '1', label: 'Unified View' },
                  ].map((stat, i) => (
                    <div key={i} className="text-center">
                      <div className="text-3xl font-display font-bold text-neon-green-500">{stat.value}</div>
                      <div className="text-sm text-white/50 mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calendar Preview Card */}
              <div className="relative">
                <div className="os-card p-6">
                  <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                    <div className="text-white font-semibold">February 2026</div>
                    <div className="flex gap-1">
                      <button className="px-3 py-1 text-xs bg-neon-green-500/20 text-neon-green-400 rounded-md border border-neon-green-500/30">Month</button>
                      <button className="px-3 py-1 text-xs text-white/40 rounded-md">Week</button>
                    </div>
                  </div>

                  {/* Mini calendar grid */}
                  <div className="grid grid-cols-7 gap-1 text-center mb-4">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                      <div key={i} className="text-white/30 text-xs py-1">{d}</div>
                    ))}
                    {Array.from({ length: 28 }, (_, i) => {
                      const day = i + 1;
                      const hasBlue = [3, 10, 17, 24].includes(day);
                      const hasGreen = [2, 5, 9, 12, 19].includes(day);
                      const hasAmber = [7, 21].includes(day);
                      const hasPurple = [14].includes(day);
                      const hasPink = [4, 11, 18, 25].includes(day);
                      const isToday = day === 19;
                      return (
                        <div
                          key={i}
                          className={`py-1.5 rounded-md text-xs relative ${
                            isToday ? 'bg-neon-green-500/20 text-neon-green-400 font-bold border border-neon-green-500/40' : 'text-white/60'
                          }`}
                        >
                          {day}
                          <div className="flex gap-0.5 justify-center mt-0.5">
                            {hasBlue && <span className="w-1 h-1 rounded-full bg-blue-500" />}
                            {hasGreen && <span className="w-1 h-1 rounded-full bg-neon-green-500" />}
                            {hasAmber && <span className="w-1 h-1 rounded-full bg-amber-500" />}
                            {hasPurple && <span className="w-1 h-1 rounded-full bg-purple-500" />}
                            {hasPink && <span className="w-1 h-1 rounded-full bg-pink-500" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-3 pt-3 border-t border-white/10">
                    {EVENT_TYPES.map((t, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${t.color}`} />
                        <span className="text-white/50 text-xs">{t.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Event Sources */}
        <section className="py-20 relative">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-white mb-3 text-4xl">
                Every Event, <span className="text-neon-green-500">One View</span>
              </h2>
              <p className="text-white/60 max-w-2xl mx-auto text-lg">
                Five distinct event sources automatically flow into your unified calendar
              </p>
            </div>

            <div className="grid md:grid-cols-5 gap-4">
              {[
                { icon: '📅', color: 'border-blue-500/40 bg-blue-500/10', title: 'Bookings', desc: 'Customer appointments and demos' },
                { icon: '📝', color: 'border-neon-green-500/40 bg-neon-green-500/10', title: 'Content', desc: 'Scheduled posts and articles' },
                { icon: '📧', color: 'border-amber-500/40 bg-amber-500/10', title: 'Campaigns', desc: 'Email sequences and blasts' },
                { icon: '📰', color: 'border-purple-500/40 bg-purple-500/10', title: 'Newsletters', desc: 'Recurring newsletter sends' },
                { icon: '✍️', color: 'border-pink-500/40 bg-pink-500/10', title: 'Blog Posts', desc: 'Publishing schedule' },
              ].map((source, i) => (
                <div key={i} className={`os-card p-5 text-center border ${source.color} hover:-translate-y-1 transition-all duration-300`}>
                  <div className="text-2xl mb-3">{source.icon}</div>
                  <h3 className="text-white font-bold text-sm mb-1">{source.title}</h3>
                  <p className="text-white/50 text-xs">{source.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 relative">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-white mb-3 text-4xl">
                Built for <span className="text-neon-green-500">Marketing Teams</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: '🔄',
                  title: 'Two-Way Sync',
                  desc: 'Changes in Google Calendar, Outlook, or Cal.com instantly appear in GreenLine and vice versa. No stale data.',
                },
                {
                  icon: '🎨',
                  title: 'Color-Coded Events',
                  desc: 'Bookings are blue, content is green, campaigns are amber. Instantly see your week at a glance.',
                },
                {
                  icon: '📋',
                  title: 'Drag & Reschedule',
                  desc: 'Move events between days with drag-and-drop. The system updates all connected platforms automatically.',
                },
                {
                  icon: '🔍',
                  title: 'Filter by Type',
                  desc: 'Toggle event types on and off with the legend. Focus on just campaigns, or just bookings, or see everything.',
                },
                {
                  icon: '📱',
                  title: 'Mobile Responsive',
                  desc: 'Full calendar functionality on phones and tablets. Create events, view details, and manage schedules anywhere.',
                },
                {
                  icon: '🔗',
                  title: 'Deep Links',
                  desc: 'Click any calendar event to jump directly to its Campaign Manager, Content Forge, or booking detail page.',
                },
              ].map((feature, i) => (
                <div key={i} className="os-card p-6 hover:-translate-y-1 transition-all duration-300">
                  <div className="icon-glass mx-auto mb-4 text-2xl">{feature.icon}</div>
                  <h3 className="text-white font-bold text-lg mb-2 text-center">{feature.title}</h3>
                  <p className="text-white/70 text-sm leading-relaxed text-center">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 relative">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-white mb-3 text-4xl">
                How Does <span className="text-neon-green-500">Calendar Integration</span> Work?
              </h2>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              {[
                { num: '1', title: 'Connect Accounts', desc: 'Link Google Calendar, Outlook, or Cal.com with one click' },
                { num: '2', title: 'Import Events', desc: 'Existing events are pulled in and color-coded by type' },
                { num: '3', title: 'Create & Schedule', desc: 'Add content, campaigns, or bookings from the calendar view' },
                { num: '4', title: 'Stay Synced', desc: 'Two-way sync keeps everything up to date across all platforms' },
              ].map((step, i) => (
                <div key={i} className="os-card p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-neon-green-500/20 border border-neon-green-500/40 flex items-center justify-center mx-auto mb-4">
                    <span className="text-neon-green-400 font-bold text-lg">{step.num}</span>
                  </div>
                  <h3 className="text-white font-bold mb-2">{step.title}</h3>
                  <p className="text-white/70 text-sm leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 relative">
          <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-white mb-3 text-4xl">
                Common <span className="text-neon-green-500">Questions</span>
              </h2>
            </div>

            <div className="space-y-6">
              {[
                {
                  q: 'Which calendar platforms do you support?',
                  a: 'We integrate with Google Calendar, Microsoft Outlook, Apple Calendar, and Cal.com. Two-way sync means changes in either direction are reflected instantly.',
                },
                {
                  q: 'Can I create events directly from the unified calendar?',
                  a: 'Yes. Click any day to create a new event. Choose the type (booking, content, campaign, etc.) and the system routes it to the correct module automatically.',
                },
                {
                  q: 'What happens to past events?',
                  a: 'Past days switch to review-only mode. You can see what was posted or completed, but you cannot modify historical events. This gives you a clean audit trail.',
                },
                {
                  q: 'Does it work with team calendars?',
                  a: 'Yes. Each team member can connect their personal calendar. The unified view overlays everyone\'s availability so you can spot conflicts before they happen.',
                },
              ].map((faq, i) => (
                <div key={i} className="os-card p-6">
                  <h3 className="text-white font-bold text-lg mb-3">{faq.q}</h3>
                  <p className="text-white/70 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 relative">
          <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
            <div className="os-card p-12 text-center">
              <h2 className="font-display font-bold text-white mb-4 text-3xl">
                Stop Juggling <span className="text-neon-green-500">Five Different Calendars</span>
              </h2>
              <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
                See your entire marketing operation in one view. Bookings, content, campaigns, and more.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/services#booking">
                  <Button variant="primary" size="lg">
                    Book a Demo
                  </Button>
                </Link>
                <Link href="/features/ai-assistant">
                  <Button variant="secondary" size="lg">
                    See AI Assistant →
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

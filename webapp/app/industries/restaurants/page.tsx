'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/os';
import SEOBreadcrumbs from '@/app/components/SEOBreadcrumbs';

export default function RestaurantsPage() {
  return (
    <>
      <SEOBreadcrumbs
        items={[
          { name: 'Home', url: '/' },
          { name: 'Industries', url: '/industries' },
          { name: 'Restaurants' },
        ]}
      />

      <main className="min-h-screen bg-os-dark relative">
        {/* Hero Section */}
        <section className="relative min-h-[70vh] flex items-center overflow-hidden pt-32 pb-20">
          <div className="absolute inset-0 bg-os-dark" />
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-neon-green-500/10 to-transparent blur-3xl" />
          
          <div className="relative z-10 w-full max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 glass-green rounded-full border border-neon-green-500/30">
                  <span className="w-2 h-2 bg-neon-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-neon-green-400 font-semibold tracking-wide">FOR RESTAURANTS</span>
                </div>
                
                <h1 className="font-display font-bold text-white mb-6" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: '1.1' }}>
                  Fill Every Table with <span className="text-neon-green-500">AI Automation</span>
                </h1>
                
                <p className="text-white/70 text-lg mb-8 leading-relaxed">
                  Turn your restaurant into a reservation powerhouse. Automated booking, social media content, and local trend insights designed specifically for restaurants and food service businesses.
                </p>
                
                <div className="flex flex-wrap gap-4 mb-8">
                  <Link href="/#booking">
                    <Button variant="primary" size="lg">
                      Get Started Free
                    </Button>
                  </Link>
                  <Link href="/features/automated-scheduling">
                    <Button variant="secondary" size="lg">
                      See How It Works →
                    </Button>
                  </Link>
                </div>
                
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { value: '+45%', label: 'More Reservations' },
                    { value: '24/7', label: 'Booking Available' },
                    { value: '90%', label: 'No-Show Reduction' }
                  ].map((stat, i) => (
                    <div key={i} className="text-center">
                      <div className="text-3xl font-display font-bold text-neon-green-500">{stat.value}</div>
                      <div className="text-sm text-white/50 mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="relative">
                <div className="os-card p-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                      <div className="icon-glass">
                        <span className="text-xl">🍽️</span>
                      </div>
                      <div>
                        <div className="text-white font-semibold">Restaurant Dashboard</div>
                        <div className="text-white/50 text-sm">Real-time reservations</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="p-3 bg-neon-green-500/10 rounded-lg border border-neon-green-500/30">
                        <div className="text-neon-green-400 text-xs mb-1">✓ New Reservation</div>
                        <div className="text-white font-semibold">Tonight at 7:00 PM - Party of 4</div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="text-white/60 text-xs mb-1">Peak Time Alert</div>
                        <div className="text-white font-semibold">Friday: 86% booked</div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="text-white/60 text-xs mb-1">Local Trend</div>
                        <div className="text-white font-semibold">🔥 "Brunch specials" trending +120%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Restaurant Challenges */}
        <section className="py-20 relative">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-white mb-3 text-4xl">
                Common <span className="text-red-400">Restaurant Challenges</span>
              </h2>
              <p className="text-white/60 text-lg">We understand the unique pressures you face daily</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: '📞', challenge: 'Phone Chaos', desc: 'Constant calls during peak hours disrupt kitchen flow' },
                { icon: '👻', challenge: 'No-Shows', desc: '20-30% of reservations result in empty tables and lost revenue' },
                { icon: '📱', challenge: 'Social Media', desc: 'No time to post consistently or engage with customers' },
                { icon: '💸', challenge: 'Marketing Costs', desc: 'Expensive ads with unclear ROI and poor targeting' }
              ].map((item, i) => (
                <div key={i} className="os-card p-6 text-center">
                  <div className="text-4xl mb-3">{item.icon}</div>
                  <h3 className="text-white font-bold text-lg mb-2">{item.challenge}</h3>
                  <p className="text-white/70 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Solutions */}
        <section className="py-20 relative">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-white mb-3 text-4xl">
                How <span className="text-neon-green-500">GreenLine365</span> Solves This
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  icon: '🤖', 
                  title: 'AI Reservation System', 
                  desc: '24/7 automated booking via website, phone, and social media. AI handles reservations, special requests, and table assignments.',
                  features: ['Instant confirmations', 'Table optimization', 'Waitlist management']
                },
                { 
                  icon: '📸', 
                  title: 'Automated Social Content', 
                  desc: 'Daily posts showcasing your dishes, specials, and events. AI creates captions and posts at optimal times for engagement.',
                  features: ['Food photo posts', 'Daily specials', 'Event promotions']
                },
                { 
                  icon: '🎯', 
                  title: 'Local Trend Intelligence', 
                  desc: 'Know what your community is craving before they search. Weather-based promotions and event-driven marketing.',
                  features: ['Weather triggers', 'Event alerts', 'Competition tracking']
                }
              ].map((solution, i) => (
                <div key={i} className="os-card p-8 hover:-translate-y-1 transition-all duration-300">
                  <div className="icon-glass mb-4 text-2xl">
                    {solution.icon}
                  </div>
                  <h3 className="text-white font-bold text-xl mb-3">{solution.title}</h3>
                  <p className="text-white/70 mb-4 leading-relaxed">{solution.desc}</p>
                  <div className="space-y-2">
                    {solution.features.map((feature, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-neon-green-500 rounded-full" />
                        <span className="text-white/60 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Success Stories */}
        <section className="py-20 relative">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-white mb-3 text-4xl">
                Real Restaurant <span className="text-neon-green-500">Success Stories</span>
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  name: 'Bella Vista Italian',
                  type: 'Fine Dining',
                  problem: 'Lost 15+ reservations daily due to phone lines during dinner rush',
                  solution: 'Implemented AI booking system with SMS confirmations',
                  result: '+45% reservations, 90% reduction in no-shows, saved 12 hours/week'
                },
                {
                  name: 'Sunrise Café',
                  type: 'Brunch Spot',
                  problem: 'No social media presence, inconsistent walk-in traffic',
                  solution: 'Automated daily posts with food photos and weather-based promotions',
                  result: '+200% Instagram followers, +35% weekend traffic, viral brunch posts'
                }
              ].map((story, i) => (
                <div key={i} className="os-card p-8">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-neon-green-500/20 border border-neon-green-500/40 flex items-center justify-center flex-shrink-0">
                      <span className="text-neon-green-400 font-bold text-lg">{i + 1}</span>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-xl">{story.name}</h3>
                      <div className="text-white/50 text-sm">{story.type}</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-red-400/80 text-xs font-semibold mb-1">❌ PROBLEM</div>
                      <p className="text-white/70 text-sm">{story.problem}</p>
                    </div>
                    <div>
                      <div className="text-neon-green-400/80 text-xs font-semibold mb-1">✓ SOLUTION</div>
                      <p className="text-white/70 text-sm">{story.solution}</p>
                    </div>
                    <div className="pt-3 border-t border-white/10">
                      <div className="text-neon-green-400 font-bold">{story.result}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features for Restaurants */}
        <section className="py-20 relative">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-white mb-3 text-4xl">
                Built for <span className="text-neon-green-500">Restaurant Operations</span>
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  title: 'Smart Table Management',
                  desc: 'AI optimizes table assignments based on party size, server availability, and kitchen capacity.',
                  icon: '🪑'
                },
                {
                  title: 'Menu Item Tracking',
                  desc: 'Track which dishes are trending, get suggestions for specials based on seasonal ingredients.',
                  icon: '📋'
                },
                {
                  title: 'Review Response AI',
                  desc: 'Automatically respond to Yelp, Google, and TripAdvisor reviews with personalized messages.',
                  icon: '⭐'
                },
                {
                  title: 'Event Promotion',
                  desc: 'Automatically promote nearby events (concerts, games) with targeted pre-event dining specials.',
                  icon: '🎉'
                },
                {
                  title: 'Allergy & Dietary Notes',
                  desc: 'Save customer preferences and dietary restrictions for repeat guests.',
                  icon: '🥗'
                },
                {
                  title: 'Staff Scheduling Integration',
                  desc: 'Connect with scheduling tools to ensure proper staffing based on reservation volume.',
                  icon: '👨‍🍳'
                }
              ].map((feature, i) => (
                <div key={i} className="os-card p-6 flex gap-4">
                  <div className="icon-glass flex-shrink-0 text-2xl">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg mb-2">{feature.title}</h3>
                    <p className="text-white/70 text-sm leading-relaxed">{feature.desc}</p>
                  </div>
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
                Restaurant <span className="text-neon-green-500">FAQs</span>
              </h2>
            </div>
            
            <div className="space-y-6">
              {[
                {
                  q: 'How does AI booking work for restaurants?',
                  a: 'Customers can book via your website, social media, or phone. The AI checks real-time table availability, handles special requests (allergies, birthdays), and sends automatic confirmations and reminders.'
                },
                {
                  q: 'Can it integrate with my existing POS system?',
                  a: 'Yes! We integrate with Square, Toast, Clover, and 20+ other restaurant POS systems. Reservations sync with your existing setup seamlessly.'
                },
                {
                  q: 'What about walk-in customers?',
                  a: 'The system tracks both reservations and walk-ins. You can add walk-ins manually or let customers join a digital waitlist via QR code.'
                },
                {
                  q: 'How do you reduce no-shows?',
                  a: 'Automated SMS reminders 24 hours and 1 hour before reservations reduce no-shows by 90%. Plus, easy rescheduling links keep tables filled.'
                }
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
                Fill Every Table. <span className="text-neon-green-500">Automatically.</span>
              </h2>
              <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
                Join 200+ restaurants using AI to increase reservations and reduce no-shows.
              </p>
              <Link href="/#booking">
                <Button variant="primary" size="lg">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/os';
import SEOBreadcrumbs from '@/app/components/SEOBreadcrumbs';
import DailyTrendHunter from '@/app/components/DailyTrendHunter';

export default function LocalTrendTrackingPage() {
  return (
    <>
      <SEOBreadcrumbs
        items={[
          { name: 'Home', url: '/' },
          { name: 'Features', url: '/features' },
          { name: 'Local Trend Tracking' },
        ]}
      />

      <main className="min-h-screen bg-os-dark relative">
        {/* Hero Section */}
        <section className="relative min-h-[70vh] flex items-center overflow-hidden pt-32 pb-20">
          <div className="absolute inset-0 bg-os-dark" />
          <div className="absolute bottom-0 left-1/3 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-neon-green-500/10 to-transparent blur-3xl" />
          
          <div className="relative z-10 w-full max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 glass-green rounded-full border border-neon-green-500/30">
                  <span className="w-2 h-2 bg-neon-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-neon-green-400 font-semibold tracking-wide">REAL-TIME INTELLIGENCE</span>
                </div>
                
                <h1 className="font-display font-bold text-white mb-6" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: '1.1' }}>
                  Know What Your <span className="text-neon-green-500">Community</span> Wants
                </h1>
                
                <p className="text-white/70 text-lg mb-8 leading-relaxed">
                  AI-powered local trend tracking finds what people in your area are talking about. Discover content opportunities, seasonal trends, and buying signals before your competitors.
                </p>
                
                <div className="flex flex-wrap gap-4 mb-8">
                  <Link href="/#booking">
                    <Button variant="primary" size="lg">
                      Try Trend Hunter
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button variant="secondary" size="lg">
                      See Plans →
                    </Button>
                  </Link>
                </div>
                
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { value: 'Real-time', label: 'Updates' },
                    { value: '100+', label: 'Daily Trends' },
                    { value: '50+', label: 'Sources' }
                  ].map((stat, i) => (
                    <div key={i} className="text-center">
                      <div className="text-3xl font-display font-bold text-neon-green-500">{stat.value}</div>
                      <div className="text-sm text-white/50 mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="relative">
                <div className="os-card p-6">
                  <DailyTrendHunter trendType="manual" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why It Matters */}
        <section className="py-20 relative">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-white mb-3 text-4xl">
                Why <span className="text-neon-green-500">Local Trends</span> Matter
              </h2>
              <p className="text-white/60 max-w-2xl mx-auto text-lg">
                Your local market is unique. Generic marketing does not work.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { 
                  icon: '📍', 
                  stat: 'Local First', 
                  desc: '72% of consumers search for local businesses online'
                },
                { 
                  icon: '📱', 
                  stat: 'Mobile Search', 
                  desc: '76% of local mobile searches result in purchases'
                },
                { 
                  icon: '⏱️', 
                  stat: 'Time Sensitive', 
                  desc: 'Local trends change daily based on weather, events, news'
                },
                { 
                  icon: '🎯', 
                  stat: 'Higher Intent', 
                  desc: 'Local searchers are 50% more likely to buy same day'
                }
              ].map((item, i) => (
                <div key={i} className="os-card p-6 text-center">
                  <div className="text-4xl mb-3">{item.icon}</div>
                  <div className="text-neon-green-400 font-bold text-lg mb-2">{item.stat}</div>
                  <p className="text-white/70 text-sm leading-relaxed">{item.desc}</p>
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
                How Does <span className="text-neon-green-500">Trend Tracking</span> Work?
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  num: '01', 
                  title: 'AI Scans Your Market', 
                  desc: 'Our AI monitors social media, local news, forums, and search trends in your specific area 24/7.',
                  icon: '🔍'
                },
                { 
                  num: '02', 
                  title: 'Identifies Opportunities', 
                  desc: 'Machine learning detects rising topics, seasonal patterns, and content gaps before they go mainstream.',
                  icon: '💡'
                },
                { 
                  num: '03', 
                  title: 'Delivers Insights', 
                  desc: 'Get daily reports with actionable trends, content ideas, and marketing opportunities specific to your business.',
                  icon: '📨'
                }
              ].map((step, i) => (
                <div key={i} className="os-card p-8 hover:-translate-y-1 transition-all duration-300">
                  <div className="icon-glass mb-4 text-2xl">
                    {step.icon}
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-neon-green-500 text-sm font-bold tracking-wider">{step.num}</span>
                    <h3 className="text-white font-bold text-xl">{step.title}</h3>
                  </div>
                  <p className="text-white/70 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What You Get */}
        <section className="py-20 relative">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-white mb-3 text-4xl">
                What You <span className="text-neon-green-500">Discover</span>
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {[
                { 
                  title: 'Local Events & News', 
                  desc: 'Real-time alerts about festivals, concerts, sports events, and community news you can leverage for marketing.',
                  icon: '🎉',
                  examples: ['Holiday markets', 'Concert announcements', 'Local sports games']
                },
                { 
                  title: 'Weather-Based Opportunities', 
                  desc: 'Seasonal trends and weather patterns that affect buying behavior in your specific location.',
                  icon: '☀️',
                  examples: ['Rain = coffee sales', 'Heat wave = AC services', 'Storm prep rushes']
                },
                { 
                  title: 'Competitive Intelligence', 
                  desc: 'What your local competitors are doing, their promotions, and gaps in their strategy you can exploit.',
                  icon: '🕵️',
                  examples: ['Competitor campaigns', 'Pricing changes', 'Service gaps']
                },
                { 
                  title: 'Search & Social Trends', 
                  desc: 'What people in your area are searching for and talking about on social media platforms.',
                  icon: '📊',
                  examples: ['Rising search terms', 'Viral local posts', 'Community discussions']
                }
              ].map((item, i) => (
                <div key={i} className="os-card p-8">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="icon-glass text-2xl flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-xl mb-2">{item.title}</h3>
                      <p className="text-white/70 mb-4 leading-relaxed">{item.desc}</p>
                      <div className="space-y-2">
                        {item.examples.map((example, j) => (
                          <div key={j} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-neon-green-500 rounded-full" />
                            <span className="text-white/60 text-sm">{example}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-20 relative">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-white mb-3 text-4xl">
                Real <span className="text-neon-green-500">Success Stories</span>
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  business: 'Coffee Shop',
                  trend: 'Rainy weekend forecast',
                  action: 'Promoted cozy indoor seating + hot drinks',
                  result: '+35% weekend sales'
                },
                { 
                  business: 'HVAC Company',
                  trend: 'Heat wave warning',
                  action: 'Emergency AC repair campaign launched 48hr ahead',
                  result: '+120% service calls'
                },
                { 
                  business: 'Restaurant',
                  trend: 'Local concert at nearby venue',
                  action: 'Pre-show dinner special marketed to concert-goers',
                  result: '+50% dinner reservations'
                }
              ].map((story, i) => (
                <div key={i} className="os-card p-6">
                  <div className="w-12 h-12 rounded-full bg-neon-green-500/20 border border-neon-green-500/40 flex items-center justify-center mb-4">
                    <span className="text-neon-green-400 font-bold text-lg">{i + 1}</span>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-3">{story.business}</h3>
                  <div className="space-y-2 mb-4">
                    <div>
                      <div className="text-white/50 text-xs mb-1">Trend Detected</div>
                      <div className="text-white text-sm">{story.trend}</div>
                    </div>
                    <div>
                      <div className="text-white/50 text-xs mb-1">Action Taken</div>
                      <div className="text-white text-sm">{story.action}</div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-white/10">
                    <div className="text-neon-green-400 font-bold text-xl">{story.result}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sources */}
        <section className="py-20 relative">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="font-display font-bold text-white mb-3 text-4xl">
                We Monitor <span className="text-neon-green-500">50+ Data Sources</span>
              </h2>
              <p className="text-white/60 text-lg">Comprehensive coverage of your local market</p>
            </div>
            
            <div className="os-card p-8">
              <div className="grid md:grid-cols-4 gap-6">
                {[
                  { category: 'Social Media', sources: ['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'TikTok'] },
                  { category: 'Local News', sources: ['City newspapers', 'TV stations', 'Radio', 'Community blogs'] },
                  { category: 'Search Trends', sources: ['Google Trends', 'Bing', 'Local queries', 'Mobile searches'] },
                  { category: 'Community', sources: ['Nextdoor', 'Reddit', 'Forums', 'Event platforms'] }
                ].map((group, i) => (
                  <div key={i}>
                    <h3 className="text-white font-bold mb-3 text-lg">{group.category}</h3>
                    <ul className="space-y-2">
                      {group.sources.map((source, j) => (
                        <li key={j} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-neon-green-500 rounded-full" />
                          <span className="text-white/70 text-sm">{source}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
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
                  q: 'How often are trends updated?',
                  a: 'Our AI updates local trends every hour. You get real-time alerts for breaking news and emerging opportunities via dashboard, email, or SMS.'
                },
                {
                  q: 'What makes local trends better than general trends?',
                  a: 'Local trends are hyper-relevant to your specific market. While national trends might not apply to your area, local trends capture what is actually happening in your community right now.'
                },
                {
                  q: 'How do I turn trends into content?',
                  a: 'Each trend comes with actionable content ideas. Our AI suggests blog topics, social posts, and marketing angles you can use immediately.'
                },
                {
                  q: 'Can I track multiple locations?',
                  a: 'Yes! If you have multiple business locations or serve different areas, you can track trends for each location separately with location-specific insights.'
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

        {/* CTA Section */}
        <section className="py-20 relative">
          <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
            <div className="os-card p-12 text-center">
              <h2 className="font-display font-bold text-white mb-4 text-3xl">
                Stop Guessing. Start <span className="text-neon-green-500">Knowing</span>.
              </h2>
              <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
                Join businesses using local trend intelligence to stay ahead of their market.
              </p>
              <Link href="/#booking">
                <Button variant="primary" size="lg">
                  Try Trend Hunter Free
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

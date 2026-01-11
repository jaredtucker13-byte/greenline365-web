'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/os';
import SEOBreadcrumbs from '@/app/components/SEOBreadcrumbs';

export default function RetailPage() {
  return (
    <>
      <SEOBreadcrumbs
        items={[
          { name: 'Home', url: '/' },
          { name: 'Industries', url: '/industries' },
          { name: 'Retail' },
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
                  <span className="text-xs text-neon-green-400 font-semibold tracking-wide">FOR RETAIL STORES</span>
                </div>
                
                <h1 className="font-display font-bold text-white mb-6" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: '1.1' }}>
                  Drive <span className="text-neon-green-500">Foot Traffic</span> with AI
                </h1>
                
                <p className="text-white/70 text-lg mb-8 leading-relaxed">
                  Connect with local shoppers when they are ready to buy. AI-powered marketing automation that turns local trends into in-store sales for retail businesses.
                </p>
                
                <div className="flex flex-wrap gap-4 mb-8">
                  <Link href="/#booking">
                    <Button variant="primary" size="lg">
                      Boost Foot Traffic
                    </Button>
                  </Link>
                  <Link href="/features/local-trend-tracking">
                    <Button variant="secondary" size="lg">
                      See Local Trends →
                    </Button>
                  </Link>
                </div>
                
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { value: '+60%', label: 'Foot Traffic' },
                    { value: '24/7', label: 'Marketing' },
                    { value: '50%', label: 'Lower CAC' }
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
                        <span className="text-xl">🛍️</span>
                      </div>
                      <div>
                        <div className="text-white font-semibold">Retail Insights</div>
                        <div className="text-white/50 text-sm">Real-time local opportunities</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="p-3 bg-neon-green-500/10 rounded-lg border border-neon-green-500/30">
                        <div className="text-neon-green-400 text-xs mb-1">🔥 Trending Now</div>
                        <div className="text-white font-semibold">"Summer clothing" +85% searches</div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="text-white/60 text-xs mb-1">Weather Alert</div>
                        <div className="text-white font-semibold">Heat wave this weekend → Promote AC products</div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="text-white/60 text-xs mb-1">Local Event</div>
                        <div className="text-white font-semibold">Street fair Saturday → 500+ potential customers</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Retail Challenges */}
        <section className="py-20 relative">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-white mb-3 text-4xl">
                The <span className="text-red-400">Retail Reality</span>
              </h2>
              <p className="text-white/60 text-lg">Local retail faces unique challenges in the digital age</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: '🛍️', challenge: 'Amazon Competition', desc: 'Competing with online giants on price and convenience' },
                { icon: '📱', challenge: 'Digital Marketing', desc: 'Expensive ads with poor local targeting and unclear ROI' },
                { icon: '📉', challenge: 'Slow Seasons', desc: 'Unpredictable traffic and cash flow gaps between peaks' },
                { icon: '⏰', challenge: 'Time Crunch', desc: 'No time for social media while managing inventory and staff' }
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
                Turn Local Trends into <span className="text-neon-green-500">Store Traffic</span>
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  icon: '📍', 
                  title: 'Hyper-Local Marketing', 
                  desc: 'Target shoppers within 5 miles of your store with weather-based promotions, local event marketing, and community-focused content.',
                  features: ['Geo-targeted ads', 'Local event campaigns', 'Weather promotions']
                },
                { 
                  icon: '📸', 
                  title: 'Product Showcase Automation', 
                  desc: 'Daily social posts featuring your products, seasonal collections, and in-store exclusives. AI creates engaging captions and schedules posts.',
                  features: ['Product highlights', 'New arrivals posts', 'Sale promotions']
                },
                { 
                  icon: '📈', 
                  title: 'Foot Traffic Intelligence', 
                  desc: 'Know when shoppers are searching for products you carry. Get alerts for trending items and local buying patterns.',
                  features: ['Search trends', 'Seasonal demand', 'Competitor insights']
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
                Real Retail <span className="text-neon-green-500">Results</span>
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  name: 'Coastal Boutique',
                  type: 'Clothing Store',
                  problem: 'Struggled with inconsistent foot traffic and expensive Facebook ads',
                  solution: 'Implemented local trend tracking + automated social posts about weather and events',
                  result: '+60% foot traffic, +85% social engagement, ROI improved 3x'
                },
                {
                  name: 'Urban Home Goods',
                  type: 'Home Decor',
                  problem: 'Losing customers to Amazon, no time for marketing during business hours',
                  solution: 'AI content automation highlighting in-store exclusives and local delivery',
                  result: '+40% sales, 200+ new local customers, featured in local news'
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
                      <div className="text-red-400/80 text-xs font-semibold mb-1">❌ CHALLENGE</div>
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

        {/* Retail-Specific Features */}
        <section className="py-20 relative">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-white mb-3 text-4xl">
                Built for <span className="text-neon-green-500">Retail Success</span>
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  title: 'Seasonal Campaign Automation',
                  desc: 'Pre-scheduled campaigns for holidays, back-to-school, and seasonal transitions. AI adjusts based on local trends.',
                  icon: '🎄'
                },
                {
                  title: 'Product Launch Sequences',
                  desc: 'Automated announcement, teaser, and launch content for new arrivals with countdown posts and exclusive previews.',
                  icon: '🚀'
                },
                {
                  title: 'Customer Review Management',
                  desc: 'Automated responses to Google and Yelp reviews. AI drafts personalized replies for your approval.',
                  icon: '⭐'
                },
                {
                  title: 'Flash Sale Promotions',
                  desc: 'Quick turnaround marketing for clearance events, overstock, and time-sensitive deals.',
                  icon: '⚡'
                },
                {
                  title: 'Local Event Tie-Ins',
                  desc: 'Automatic marketing for nearby festivals, concerts, and community events to capture foot traffic.',
                  icon: '🎉'
                },
                {
                  title: 'Inventory-Based Content',
                  desc: 'Promote items with high stock levels or spotlight limited-quantity products to drive urgency.',
                  icon: '📦'
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
                Retail <span className="text-neon-green-500">Questions</span>
              </h2>
            </div>
            
            <div className="space-y-6">
              {[
                {
                  q: 'How does local trend tracking help my retail store?',
                  a: 'We monitor what people in your area are searching for, upcoming local events, weather patterns, and seasonal trends. You get alerts when there is an opportunity to promote relevant products.'
                },
                {
                  q: 'Can I promote specific products or sales?',
                  a: 'Absolutely! You can schedule product-specific campaigns, flash sales, and seasonal promotions. AI generates the content while you maintain full control over what gets posted.'
                },
                {
                  q: 'What if I sell the same products as Amazon?',
                  a: 'We help you compete on convenience and community. Promote same-day pickup, local delivery, personalized service, and exclusive in-store experiences that online giants cannot match.'
                },
                {
                  q: 'How much time does this save?',
                  a: 'Retail owners save 15-20 hours per week on marketing tasks. Focus on customers and operations while AI handles your digital presence 24/7.'
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
                Compete with Amazon. <span className="text-neon-green-500">Win Locally.</span>
              </h2>
              <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
                Join 150+ local retailers using AI to drive foot traffic and build community.
              </p>
              <Link href="/#booking">
                <Button variant="primary" size="lg">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

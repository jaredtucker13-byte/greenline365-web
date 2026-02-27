'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/os';
import SEOBreadcrumbs from '@/app/components/SEOBreadcrumbs';

export default function AIAssistantPage() {
  return (
    <>
      <SEOBreadcrumbs
        items={[
          { name: 'Home', url: '/' },
          { name: 'Features', url: '/features' },
          { name: 'AI Assistant' },
        ]}
      />

      <main className="min-h-screen bg-os-dark relative">
        {/* Hero Section */}
        <section className="relative min-h-[70vh] flex items-center overflow-hidden pt-32 pb-20">
          <div className="absolute inset-0 bg-os-dark" />
          <div className="absolute top-0 left-1/3 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-neon-green-500/10 to-transparent blur-3xl" />

          <div className="relative z-10 w-full max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 glass-green rounded-full border border-neon-green-500/30">
                  <span className="w-2 h-2 bg-neon-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-neon-green-400 font-semibold tracking-wide">AI ASSISTANT</span>
                </div>

                <h1 className="font-display font-bold text-white mb-6" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: '1.1' }}>
                  Your <span className="text-neon-green-500">24/7 Virtual Employee</span> That Knows Your Business
                </h1>

                <p className="text-white/70 text-lg mb-8 leading-relaxed">
                  An AI assistant trained on your brand, services, and tone of voice. It answers customer questions, qualifies leads, and handles routine tasks around the clock so you can focus on growth.
                </p>

                <div className="flex flex-wrap gap-4 mb-8">
                  <Link href="/services#booking">
                    <Button variant="primary" size="lg">
                      See It In Action
                    </Button>
                  </Link>
                  <Link href="/features/automated-scheduling">
                    <Button variant="secondary" size="lg">
                      Scheduling Feature →
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  {[
                    { value: '24/7', label: 'Always On' },
                    { value: '<2s', label: 'Response Time' },
                    { value: '95%', label: 'Resolution Rate' },
                  ].map((stat, i) => (
                    <div key={i} className="text-center">
                      <div className="text-3xl font-display font-bold text-neon-green-500">{stat.value}</div>
                      <div className="text-sm text-white/50 mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Preview Card */}
              <div className="relative">
                <div className="os-card p-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-white/10 mb-4">
                    <div className="icon-glass">
                      <span className="text-xl">💬</span>
                    </div>
                    <div>
                      <div className="text-white font-semibold">GreenLine Assistant</div>
                      <div className="text-neon-green-400 text-xs flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-neon-green-500 rounded-full" />
                        Online now
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-end">
                      <div className="bg-neon-green-500/20 border border-neon-green-500/30 rounded-xl rounded-br-sm px-4 py-2.5 max-w-[80%]">
                        <p className="text-white text-sm">Do you offer same-day HVAC service?</p>
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-white/5 border border-white/10 rounded-xl rounded-bl-sm px-4 py-2.5 max-w-[80%]">
                        <p className="text-white/80 text-sm">Yes! We offer same-day emergency HVAC service. Our next available slot today is at 2:30 PM. Want me to book it for you?</p>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-neon-green-500/20 border border-neon-green-500/30 rounded-xl rounded-br-sm px-4 py-2.5 max-w-[80%]">
                        <p className="text-white text-sm">Yes please, 2:30 works</p>
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-white/5 border border-white/10 rounded-xl rounded-bl-sm px-4 py-2.5 max-w-[80%]">
                        <p className="text-white/80 text-sm">Done! Booked for today at 2:30 PM. You&apos;ll get a confirmation text shortly. Anything else I can help with?</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                      <span className="text-white/30 text-sm">Type a message...</span>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-neon-green-500 flex items-center justify-center">
                      <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What It Does */}
        <section className="py-20 relative">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-white mb-3 text-4xl">
                What Can the <span className="text-neon-green-500">AI Assistant</span> Do?
              </h2>
              <p className="text-white/60 max-w-2xl mx-auto text-lg">
                Trained on your business data, it handles the work you never have time for
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: '🗣️',
                  title: 'Answer Customer Questions',
                  desc: 'Responds instantly to FAQs about your hours, services, pricing, and policies with accurate, on-brand answers.',
                },
                {
                  icon: '🎯',
                  title: 'Qualify Leads Automatically',
                  desc: 'Asks the right follow-up questions, scores leads by intent and budget, and routes hot prospects to your inbox.',
                },
                {
                  icon: '📝',
                  title: 'Draft Replies & Follow-Ups',
                  desc: 'Generates professional email replies, review responses, and follow-up messages in your brand voice.',
                },
                {
                  icon: '📅',
                  title: 'Book Appointments',
                  desc: 'Checks your calendar, suggests available times, and confirms bookings without any back-and-forth.',
                },
                {
                  icon: '📊',
                  title: 'Surface Insights',
                  desc: 'Summarizes customer sentiment, trending questions, and common pain points so you can improve your service.',
                },
                {
                  icon: '🔗',
                  title: 'Connect Everything',
                  desc: 'Integrates with your CRM, email, calendar, and chat widget. One assistant across every channel.',
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

        {/* How It Learns */}
        <section className="py-20 relative">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-white mb-3 text-4xl">
                How Does It <span className="text-neon-green-500">Know Your Business</span>?
              </h2>
              <p className="text-white/60 max-w-2xl mx-auto text-lg">
                Three layers of intelligence that make it uniquely yours
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  num: '01',
                  title: 'Brand Voice Memory',
                  desc: 'We ingest your website, past content, and brand guidelines so the AI writes and speaks exactly like you.',
                },
                {
                  num: '02',
                  title: 'Knowledge Base',
                  desc: 'Upload your FAQs, service details, pricing, and policies. The assistant references them in every conversation.',
                },
                {
                  num: '03',
                  title: 'Continuous Learning',
                  desc: 'Every customer interaction improves accuracy. Flag incorrect answers and the AI adapts within minutes.',
                },
              ].map((step, i) => (
                <div key={i} className="os-card p-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-neon-green-500/20 border border-neon-green-500/40 flex items-center justify-center mx-auto mb-5">
                    <span className="text-neon-green-400 font-bold text-lg">{step.num}</span>
                  </div>
                  <h3 className="text-white font-bold text-xl mb-3">{step.title}</h3>
                  <p className="text-white/70 leading-relaxed">{step.desc}</p>
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
                Frequently Asked <span className="text-neon-green-500">Questions</span>
              </h2>
            </div>

            <div className="space-y-6">
              {[
                {
                  q: 'How is this different from a regular chatbot?',
                  a: 'Regular chatbots follow scripted decision trees. Our AI assistant understands natural language, learns your specific business context, and generates unique responses for every conversation.',
                },
                {
                  q: 'What if the AI gives a wrong answer?',
                  a: 'You can flag any incorrect response and the AI updates its knowledge immediately. For sensitive topics, you can set guardrails that route conversations to a human.',
                },
                {
                  q: 'Can it handle multiple conversations at once?',
                  a: 'Yes, it handles unlimited simultaneous conversations with zero wait time. Every customer gets an instant, personalized response.',
                },
                {
                  q: 'Does it work on my website and social media?',
                  a: 'The assistant embeds on your website as a chat widget and can also connect to Facebook Messenger, Instagram DMs, and WhatsApp Business.',
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
                Hire an AI Employee That <span className="text-neon-green-500">Never Sleeps</span>
              </h2>
              <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
                Answer every customer, qualify every lead, and never miss an opportunity again.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/services#booking">
                  <Button variant="primary" size="lg">
                    Book a Demo
                  </Button>
                </Link>
                <Link href="/features/ai-content-creation">
                  <Button variant="secondary" size="lg">
                    See Content Creation →
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

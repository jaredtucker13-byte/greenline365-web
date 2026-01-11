'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/os';
import SEOBreadcrumbs from '@/app/components/SEOBreadcrumbs';

export default function AutomatedSchedulingPage() {
  return (
    <>
      <SEOBreadcrumbs
        items={[
          { name: 'Home', url: '/' },
          { name: 'Features', url: '/features' },
          { name: 'Automated Scheduling' },
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
                  <span className="text-xs text-neon-green-400 font-semibold tracking-wide">24/7 BOOKING SYSTEM</span>
                </div>
                
                <h1 className="font-display font-bold text-white mb-6" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: '1.1' }}>
                  Never Miss a <span className="text-neon-green-500">Booking</span> Again
                </h1>
                
                <p className="text-white/70 text-lg mb-8 leading-relaxed">
                  AI-powered automated scheduling that works 24/7. Turn missed calls into booked appointments. Increase lead conversion by 40% with intelligent booking automation.
                </p>
                
                <div className="flex flex-wrap gap-4 mb-8">
                  <Link href="/#booking">
                    <Button variant="primary" size="lg">
                      Book a Demo
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button variant="secondary" size="lg">
                      See Pricing →
                    </Button>
                  </Link>
                </div>
                
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { value: '24/7', label: 'Always Available' },
                    { value: '40%', label: 'More Conversions' },
                    { value: '0', label: 'Missed Calls' }
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
                        <span className="text-xl">📅</span>
                      </div>
                      <div>
                        <div className="text-white font-semibold">Smart Booking Widget</div>
                        <div className="text-white/50 text-sm">AI-powered appointment scheduler</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="text-white/60 text-xs mb-1">Next Available</div>
                        <div className="text-white font-semibold">Today at 2:00 PM</div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="text-white/60 text-xs mb-1">Appointment Type</div>
                        <div className="text-white font-semibold">Strategy Session (30 min)</div>
                      </div>
                      <div className="p-3 bg-neon-green-500/10 rounded-lg border border-neon-green-500/30">
                        <div className="text-neon-green-400 text-xs mb-1">✓ Auto-confirmed</div>
                        <div className="text-white font-semibold">Calendar synced</div>
                      </div>
                    </div>
                    
                    <button className="w-full py-3 bg-neon-green-500 hover:bg-neon-green-600 text-black font-semibold rounded-lg transition-colors">
                      Confirm Booking
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem/Solution */}
        <section className="py-20 relative">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="font-display font-bold text-white mb-6 text-4xl">
                  Stop Losing Revenue to <span className="text-red-400">Missed Calls</span>
                </h2>
                <div className="space-y-4">
                  {[
                    { problem: 'After-hours calls go to voicemail', impact: 'Lost customers' },
                    { problem: 'Manual scheduling takes 10+ minutes', impact: 'Wasted time' },
                    { problem: 'Double bookings and no-shows', impact: 'Lost revenue' },
                    { problem: 'No automated reminders', impact: 'High cancellation rate' }
                  ].map((item, i) => (
                    <div key={i} className="os-card p-4 flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-red-400 text-xl">❌</span>
                      </div>
                      <div>
                        <div className="text-white font-semibold mb-1">{item.problem}</div>
                        <div className="text-red-400/70 text-sm">→ {item.impact}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h2 className="font-display font-bold text-white mb-6 text-4xl">
                  Our AI Handles <span className="text-neon-green-500">Everything</span>
                </h2>
                <div className="space-y-4">
                  {[
                    { solution: '24/7 AI booking agent', benefit: 'Never miss an opportunity' },
                    { solution: 'Instant appointment confirmation', benefit: 'Save 10+ hours/week' },
                    { solution: 'Smart conflict detection', benefit: 'Zero double bookings' },
                    { solution: 'Automated SMS reminders', benefit: '60% fewer no-shows' }
                  ].map((item, i) => (
                    <div key={i} className="os-card p-4 flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-neon-green-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-neon-green-400 text-xl">✓</span>
                      </div>
                      <div>
                        <div className="text-white font-semibold mb-1">{item.solution}</div>
                        <div className="text-neon-green-400/70 text-sm">→ {item.benefit}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 relative">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-white mb-3 text-4xl">
                Everything You Need to <span className="text-neon-green-500">Automate Scheduling</span>
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  icon: '🤖', 
                  title: 'AI Booking Agent', 
                  desc: 'Intelligent chatbot handles appointment requests, answers questions, and confirms bookings automatically.'
                },
                { 
                  icon: '🔄', 
                  title: 'Calendar Sync', 
                  desc: 'Two-way sync with Google Calendar, Outlook, and Apple Calendar. Real-time availability updates.'
                },
                { 
                  icon: '📱', 
                  title: 'SMS Reminders', 
                  desc: 'Automated text reminders sent 24 hours and 1 hour before appointments. Reduce no-shows by 60%.'
                },
                { 
                  icon: '🎯', 
                  title: 'Smart Scheduling', 
                  desc: 'AI recommends optimal appointment times based on your availability and customer preferences.'
                },
                { 
                  icon: '⚡', 
                  title: 'Instant Confirmation', 
                  desc: 'Customers get immediate booking confirmation via email and SMS. No back-and-forth required.'
                },
                { 
                  icon: '📊', 
                  title: 'Analytics Dashboard', 
                  desc: 'Track booking rates, no-show percentages, and peak times. Data-driven insights to optimize operations.'
                }
              ].map((feature, i) => (
                <div key={i} className="os-card p-6 hover:-translate-y-1 transition-all duration-300">
                  <div className="icon-glass mx-auto mb-4 text-2xl">
                    {feature.icon}
                  </div>
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
                How Does <span className="text-neon-green-500">Automated Scheduling</span> Work?
              </h2>
              <p className="text-white/60 max-w-2xl mx-auto text-lg">
                Set it up once, and let AI handle all your bookings forever
              </p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { num: '1', title: 'Connect Calendar', desc: 'Link your Google/Outlook calendar in 30 seconds' },
                { num: '2', title: 'Set Availability', desc: 'Define your working hours and appointment types' },
                { num: '3', title: 'Add Widget', desc: 'Embed booking widget on your website in one click' },
                { num: '4', title: 'Get Bookings', desc: 'AI handles everything 24/7 automatically' }
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

        {/* Use Cases */}
        <section className="py-20 relative">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-white mb-3 text-4xl">
                Perfect for Every <span className="text-neon-green-500">Business Type</span>
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {[
                { 
                  industry: 'Professional Services', 
                  examples: 'Lawyers, Accountants, Consultants',
                  useCase: 'Schedule client consultations, strategy sessions, and follow-ups automatically.'
                },
                { 
                  industry: 'Healthcare', 
                  examples: 'Doctors, Dentists, Therapists',
                  useCase: 'Patient appointment booking with insurance verification and automated reminders.'
                },
                { 
                  industry: 'Home Services', 
                  examples: 'Plumbers, Electricians, Cleaners',
                  useCase: 'On-site service booking with location-based scheduling and route optimization.'
                },
                { 
                  industry: 'Beauty & Wellness', 
                  examples: 'Salons, Spas, Fitness Studios',
                  useCase: 'Class bookings, appointment scheduling, and membership management.'
                }
              ].map((industry, i) => (
                <div key={i} className="os-card p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-neon-green-500/20 flex items-center justify-center">
                      <span className="text-neon-green-400 font-bold">{i + 1}</span>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">{industry.industry}</h3>
                      <div className="text-white/50 text-sm">{industry.examples}</div>
                    </div>
                  </div>
                  <p className="text-white/70 leading-relaxed">{industry.useCase}</p>
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
                  q: 'How does AI booking work?',
                  a: 'Our AI booking agent acts like a virtual receptionist. It understands customer requests, checks your calendar availability, and confirms appointments instantly - all without human intervention.'
                },
                {
                  q: 'Which calendars can I integrate?',
                  a: 'We integrate with Google Calendar, Microsoft Outlook, Apple Calendar, and 50+ other scheduling tools. Two-way sync ensures your availability is always up-to-date.'
                },
                {
                  q: 'What happens if there is a scheduling conflict?',
                  a: 'Our smart conflict detection prevents double bookings. If a time slot becomes unavailable, the AI automatically suggests alternative times to your customer.'
                },
                {
                  q: 'Can customers reschedule or cancel?',
                  a: 'Yes! Customers can easily reschedule or cancel through automated links. You can set custom cancellation policies and buffer times between appointments.'
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
                Stop Losing Revenue to <span className="text-neon-green-500">Missed Opportunities</span>
              </h2>
              <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
                Join 500+ businesses that increased conversions by 40% with automated scheduling.
              </p>
              <Link href="/#booking">
                <Button variant="primary" size="lg">
                  Start Automating Bookings
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

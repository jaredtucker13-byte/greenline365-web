'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import MultiStepBookingForm from '../components/MultiStepBookingForm';
import BookingWidget from '../components/BookingWidget';
import DailyTrendHunter from '../components/DailyTrendHunter';
import HeroSection from '../components/HeroSection';
import PhoneDrawAnimation from '../components/PhoneDrawAnimation';
import NetworkPipeline from '../components/NetworkPipeline';
import { Button, FlipCard } from '@/components/ui/os';
import { GlassCard, OSPanel } from '@/components/ui/os';
import { NeonText } from '@/components/ui/os';
import { useGSAP, gsap, ScrollTrigger, scrollAnimations } from '@/lib/gsap';

export default function ServicesPage() {
  const [showFullForm, setShowFullForm] = useState(false);
  const [showWidget, setShowWidget] = useState(false);
  const pageRef = useRef<HTMLElement>(null);

  // Unified GSAP scroll animations via design system
  useGSAP(() => {
    // Section headers
    scrollAnimations.staggerFadeIn('[data-section-header]');

    // Pain cards
    scrollAnimations.staggerFadeIn('[data-pain-card]');

    // Slide-in pairs (image left, content right)
    gsap.utils.toArray<Element>('[data-slide-left]').forEach((el) => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 80%' },
        x: -60, opacity: 0, duration: 0.8, ease: 'power2.out',
      });
    });
    gsap.utils.toArray<Element>('[data-slide-right]').forEach((el) => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 80%' },
        x: 60, opacity: 0, duration: 0.8, ease: 'power2.out',
      });
    });

    // Parallax glow
    gsap.to('.gsap-parallax', {
      scrollTrigger: { trigger: '.gsap-parallax', start: 'top bottom', end: 'bottom top', scrub: true },
      y: -100, ease: 'none',
    });

  }, []);

  return (
    <main ref={pageRef} className="min-h-screen bg-os-dark relative">
      {/* ═══════════ HERO ═══════════ */}
      <HeroSection />

      {/* ═══════════ THE PROBLEM ═══════════ */}
      <section className="py-20 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <div data-slide-left className="order-2 lg:order-1">
              <GlassCard variant="default" hover={false} className="p-0 overflow-hidden border border-white/10">
                <div className="relative">
                  <Image
                    src="/images/distressed-owners.jpg"
                    alt="Stressed business owners"
                    width={600}
                    height={338}
                    className="w-full aspect-video object-cover"
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAcI/8QAIhAAAgEDAwUBAAAAAAAAAAAAAQIDAAQFBhESEyExQVFh/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAYEQEBAQEBAAAAAAAAAAAAAAABAgADEf/aAAwDAQACEQMRAD8AkOnNT6lzOp7C3mvpXtluY0aIhSrAuAQevvzVyqlaU0/jNN3NxNYWy28s4USMpYl9t9gSST1J6mvlKUzJDHZk/9k="
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-os-dark/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="glass rounded-xl p-3 border border-red-500/30">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-red-400 text-lg">😰</span>
                        <span className="text-white/90 text-sm">Sound familiar?</span>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Content */}
            <div data-slide-right className="order-1 lg:order-2">
              <span className="text-red-400 text-xs font-bold tracking-widest uppercase mb-3 block">The Problem</span>
              <h2 className="font-display font-bold text-white mb-4 text-2xl lg:text-4xl">
                Running a Business Shouldn&apos;t Mean <span className="text-red-400">Running on Empty</span>
              </h2>
              <p className="text-white/60 mb-6 leading-relaxed text-base">
                You didn&apos;t start your business to become a full-time social media manager. Yet here you are, drowning in tasks that steal your time and energy.
              </p>
              <div className="space-y-3">
                {[
                  { emoji: '😰', title: 'Overwhelmed', desc: 'Drowning in to-do lists while competitors steal customers' },
                  { emoji: '📱', title: 'Always On-Call', desc: 'Sacrificing family time to keep the business running' },
                  { emoji: '😓', title: 'No Marketing Time', desc: 'Great at your craft, but who has time for social media?' },
                  { emoji: '💸', title: 'Wasted Ad Spend', desc: 'Throwing money at ads that don\'t convert to real customers' }
                ].map((pain, i) => (
                  <GlassCard key={i} data-pain-card variant="default" hover={false} className="p-4 flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">{pain.emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold text-base">{pain.title}</h4>
                      <p className="text-white/60 text-sm leading-snug">{pain.desc}</p>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES — 3-Column FlipCard Grid (Phase 5) ═══════════ */}
      <section className="py-20 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div data-section-header className="text-center mb-14">
            <h2 className="font-display font-bold text-white mb-3 text-2xl lg:text-4xl">
              Why Choose <NeonText variant="gradient" animate={false}>GreenLine365</NeonText>?
            </h2>
            <p className="text-white/60 max-w-xl mx-auto">Built for modern businesses who demand results</p>
            <p className="text-white/30 text-xs mt-2">Tap any card to learn more</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: '💡', title: 'AI-Powered Insights',
                desc: 'Get intelligent recommendations based on your business goals and market trends.',
                backTitle: 'How AI Insights Work',
                backDesc: 'Our AI analyzes local market data, customer behavior, and seasonal trends to give you actionable recommendations that drive real results.',
                backCta: 'Try the Trend Hunter below',
              },
              {
                icon: '📅', title: 'Smart Scheduling',
                desc: 'Seamlessly integrate with your calendar. Book demos, meetings, and follow-ups.',
                backTitle: 'Never Miss a Booking',
                backDesc: 'Embeddable booking widget that syncs with your calendar, prevents double-bookings, and sends automatic confirmations and reminders.',
                backCta: 'See the widget demo below',
              },
              {
                icon: '⚡', title: 'Always-On System',
                desc: 'Your business runs 24/7 — even when you\'re off the clock.',
                backTitle: '24/7 Automation',
                backDesc: 'AI chat handles customer questions, booking requests happen automatically, and trend alerts keep you ahead of the competition — all while you sleep.',
                backCta: 'Try the AI chat in the corner',
              }
            ].map((feature, i) => (
              <FlipCard
                key={i}
                className="min-h-[240px]"
                front={
                  <div className="p-8">
                    <div className="w-12 h-12 rounded-xl bg-gold/20 border border-gold/30 flex items-center justify-center mb-5 text-2xl">
                      {feature.icon}
                    </div>
                    <h3 className="font-display font-bold text-white mb-3 text-xl">{feature.title}</h3>
                    <p className="text-white/70 leading-relaxed text-sm">{feature.desc}</p>
                    <div className="mt-4 text-gold/40 text-xs flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      Tap to flip
                    </div>
                  </div>
                }
                back={
                  <div className="p-8 flex flex-col justify-center h-full">
                    <h3 className="font-display font-bold text-gold mb-3 text-lg">{feature.backTitle}</h3>
                    <p className="text-white/80 leading-relaxed text-sm mb-4">{feature.backDesc}</p>
                    <p className="text-gold text-xs font-semibold">{feature.backCta}</p>
                  </div>
                }
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS — OSPanel Cards ═══════════ */}
      <section className="py-20 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div data-section-header className="text-center mb-14">
            <h2 className="font-display font-bold text-white mb-3 text-2xl lg:text-4xl">
              How the <span className="text-gold">System</span> Works
            </h2>
            <p className="text-white/60 max-w-xl mx-auto">Four seamless phases that transform your business</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { num: '01', title: 'Discovery & Setup', desc: 'We analyze your business, identify ideal customers, and configure your system.', icon: '🔍' },
              { num: '02', title: 'Local Intelligence', desc: 'Our AI monitors local trends, events, and opportunities relevant to your business.', icon: '📡' },
              { num: '03', title: 'Content & Scheduling', desc: 'Generate captions, hashtags, and schedule your posts from one dashboard.', icon: '🎯' },
              { num: '04', title: 'Growth & Booking', desc: 'Convert interest into booked appointments with AI-powered scheduling.', icon: '📈' }
            ].map((step, i) => (
              <OSPanel key={i} className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-xl bg-gold/20 border border-gold/30 flex items-center justify-center flex-shrink-0 text-2xl">
                  {step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-gold bg-gold/20 px-2.5 py-1 rounded-full border border-gold/30">{step.num}</span>
                  </div>
                  <h3 className="font-display font-bold text-white mb-2 text-lg">{step.title}</h3>
                  <p className="text-white/70 leading-relaxed text-sm">{step.desc}</p>
                </div>
              </OSPanel>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ NETWORK PIPELINE — Data Flow Animation (Phase 5) ═══════════ */}
      <section className="py-20 relative overflow-hidden">
        <div className="circuit-bg absolute inset-0 opacity-20" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div data-section-header className="text-center mb-14">
            <h2 className="font-display font-bold text-white mb-3 text-2xl lg:text-4xl">
              Your Content <span className="text-gold">Pipeline</span>
            </h2>
            <p className="text-white/60 max-w-xl mx-auto">
              From camera roll to customers — watch how GreenLine365 transforms your content into growth
            </p>
          </div>

          <NetworkPipeline />

          <div className="flex justify-center mt-10 gap-8 text-center">
            {[
              { label: 'Input Sources', desc: 'Your photos, videos, reviews' },
              { label: 'AI Engine', desc: 'Processes & optimizes' },
              { label: 'Distribution', desc: 'Reaches your customers' },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                {i > 0 && <div className="w-8 h-px bg-gold/30" />}
                <div>
                  <div className="text-gold text-xs font-bold">{step.label}</div>
                  <div className="text-white/40 text-[10px]">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ TESTIMONIAL ═══════════ */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <GlassCard variant="strong" hover={false} className="p-8 md:p-10 text-center border border-gold/20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center border border-gold/30">
                <span className="text-gold font-bold text-xl">MK</span>
              </div>
              <div className="flex gap-1 justify-center mb-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-gold" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-white/90 text-base leading-relaxed max-w-lg">
                &ldquo;We joined GreenLine365 to get our business discovered by more local customers. The directory puts us right where people are looking.&rdquo;
              </p>
              <div className="text-sm">
                <span className="text-white font-semibold">Early Adopter</span>
                <span className="text-white/50"> · Local Business Owner</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* ═══════════ SOLUTION — Phone Draw Animation + Content (Phase 5) ═══════════ */}
      <section className="py-20 relative">
        <div className="aurora-bg" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Phone SVG Draw Animation */}
            <div data-slide-left className="relative flex justify-center">
              <PhoneDrawAnimation />
            </div>

            {/* Content */}
            <div data-slide-right>
              <span className="text-gold text-xs font-bold tracking-widest uppercase mb-3 block">The Solution</span>
              <h2 className="font-display font-bold text-white mb-4 text-2xl lg:text-4xl">
                Your Phone is Already a <span className="text-gold">Marketing Machine</span>
              </h2>
              <p className="text-white/70 mb-6 leading-relaxed text-base">
                Every photo you take is a potential post. GreenLine365 transforms your daily snapshots into a content engine.
              </p>
              <div className="space-y-3">
                {[
                  { title: 'AI-Powered Captions', desc: 'Upload a photo, get perfect captions in seconds' },
                  { title: 'Smart Hashtags', desc: 'Local + trending tags that get discovered' },
                  { title: 'Built-in Scheduling', desc: 'Queue content from your dashboard' }
                ].map((feature, i) => (
                  <GlassCard key={i} variant="default" hover={false} className="p-4 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-gold/20 border border-gold/30 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold text-sm">{feature.title}</h4>
                      <p className="text-white/60 text-xs">{feature.desc}</p>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ TREND HUNTER DEMO ═══════════ */}
      <section id="trend-demo" className="py-20 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/10 rounded-full blur-3xl gsap-parallax pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div data-slide-left className="text-center lg:text-left">
              <span className="text-gold text-xs font-bold tracking-widest uppercase mb-3 block">Try It Now - FREE</span>
              <h2 className="font-display font-bold text-white mb-4 text-2xl lg:text-4xl">
                See What&apos;s Trending in <span className="text-gold">Your Area</span>
              </h2>
              <p className="text-white/60 mb-6 text-sm leading-relaxed max-w-md mx-auto lg:mx-0">
                Enter your ZIP code and discover local events, trends, and opportunities you can turn into content and customers.
              </p>
              <div className="space-y-2 mb-6 max-w-md mx-auto lg:mx-0">
                {['Real-time local insights', 'Weather-based opportunities', 'Event-driven marketing'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-white/70 text-sm justify-center lg:justify-start">
                    <div className="w-1.5 h-1.5 bg-gold rounded-full" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div data-slide-right>
              <OSPanel className="max-w-md mx-auto lg:mx-0 w-full border border-gold/20">
                <DailyTrendHunter trendType="manual" />
              </OSPanel>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FAQ — GlassCard Grid ═══════════ */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div data-section-header className="text-center mb-14">
            <h2 className="font-display font-bold text-white mb-3 text-2xl lg:text-4xl">
              Frequently Asked <span className="text-gold">Questions</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { q: 'How does GreenLine365 work?', a: 'A local business directory and OS that connects your business with customers through smart scheduling and AI content tools.', bullets: ['AI-powered insights', '24/7 scheduling', 'Local directory'] },
              { q: 'What makes you different?', a: 'Built specifically for local businesses. We combine directory listings with AI tools for content and booking.', bullets: ['Built for local', 'Community-focused', 'All-in-one platform'] },
              { q: 'How quickly can I start?', a: 'Most businesses are listed within 24 hours. Claim your listing and set up booking in minutes.', bullets: ['Quick onboarding', 'Simple setup', 'Same-day listing'] },
              { q: 'What tools are included?', a: 'Directory listing, AI caption generator, booking widget, trend hunter, and AI chat — all in one dashboard.', bullets: ['Booking widget', 'AI captions', 'Trend hunter'] },
              { q: 'Can I try it free?', a: 'Yes! Basic directory listing is free. Try the Trend Hunter and Booking Widget on this page right now.', bullets: ['Free tier', 'Try before buy', 'No credit card'] },
              { q: 'Is there a contract?', a: 'No long-term contracts. Pay monthly and cancel anytime. We don\'t lock you in.', bullets: ['Monthly billing', 'Cancel anytime', 'No commitments'] }
            ].map((faq, i) => (
              <GlassCard key={i} variant="strong" className="p-8">
                <div className="w-10 h-10 rounded-xl bg-gold/20 border border-gold/30 flex items-center justify-center mb-5 mx-auto">
                  <span className="text-gold text-lg font-bold">?</span>
                </div>
                <h3 className="font-display font-bold text-white mb-3 text-center text-base">{faq.q}</h3>
                <p className="text-white/60 mb-4 text-center text-sm leading-relaxed">{faq.a}</p>
                <div className="space-y-2">
                  {faq.bullets.map((b, j) => (
                    <div key={j} className="flex items-center justify-center gap-2 text-white/50 text-xs">
                      <div className="w-1.5 h-1.5 bg-gold rounded-full" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ BOOKING — 50/50 Split ═══════════ */}
      <section className="py-20 relative" id="booking">
        <div className="aurora-bg" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 items-stretch">
            {/* Value Prop */}
            <OSPanel data-slide-left className="flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gold/20 border border-gold/30 flex items-center justify-center">
                    <svg className="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-display font-bold text-white">GreenLine<span className="text-gold">365</span></div>
                    <div className="text-xs text-white/40 uppercase tracking-wider">Business OS</div>
                  </div>
                </div>

                <h2 className="font-display font-bold mb-3 text-xl lg:text-2xl">
                  <span className="text-white block">Stop Losing</span>
                  <span className="text-gold">Revenue.</span>
                </h2>

                <p className="text-white/70 text-sm mb-4 leading-relaxed">
                  Turn missed calls into closed deals with AI-powered scheduling that works 24/7.
                </p>

                <div className="space-y-2 mb-4">
                  {['Never miss a booking again', 'Zero missed calls, 24/7/365', 'Integrates with your workflow'].map((text, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-gold/20 flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-white/80 text-sm">{text}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4 py-3 border-t border-b border-white/10">
                  {[
                    { value: '24/7', label: 'Availability' },
                    { value: 'AI', label: 'Powered' },
                    { value: '2min', label: 'Setup Time' },
                  ].map((s, i) => (
                    <div key={i} className={`text-center ${i === 1 ? 'border-x border-white/10' : ''}`}>
                      <div className="text-lg font-bold text-gold">{s.value}</div>
                      <div className="text-[10px] text-white/50 uppercase">{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  {['No credit card required', 'Free 15-min strategy call', 'Cancel anytime'].map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-white/60">
                      <span className="text-gold">✓</span> {t}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 mt-4">
                <div className="flex items-center gap-1 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-3 h-3 text-gold" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="text-white/50 text-xs ml-1">4.9/5</span>
                </div>
                <p className="text-white/50 text-xs">Be one of our first customers</p>
              </div>
            </OSPanel>

            {/* Booking Form */}
            <GlassCard data-slide-right variant="strong" hover={false} className="p-6">
              <h3 className="text-base font-display font-bold text-white mb-1">Book Your Strategy Session</h3>
              <p className="text-white/60 text-xs mb-3">Quick form - takes 30 seconds</p>
              <MultiStepBookingForm compact={true} />
            </GlassCard>
          </div>
        </div>
      </section>

      {/* ═══════════ PRODUCTS — 50/50 Splits ═══════════ */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div data-section-header className="text-center mb-14">
            <h2 className="font-display font-bold text-white mb-3 text-2xl lg:text-4xl">
              Our <span className="text-gold">Products</span>
            </h2>
            <p className="text-white/60">White-label solutions you can integrate</p>
          </div>

          {/* Product 1 — Booking Widget */}
          <div className="grid lg:grid-cols-2 gap-12 mb-16 items-center">
            <div data-slide-left className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 glass-gold border border-gold/30 rounded-full mb-4">
                <span className="text-xs text-gold font-semibold uppercase">Product #1</span>
              </div>
              <h3 className="text-xl font-display font-bold text-white mb-3">Universal Booking Widget</h3>
              <p className="text-white/70 text-sm mb-4 leading-relaxed">
                Embeddable booking widget for any website. Perfect for seamless scheduling.
              </p>
              <ul className="space-y-2 mb-6">
                {['Customizable colors', 'Conflict prevention', 'White-label for agencies'].map((text, i) => (
                  <li key={i} className="flex items-center gap-2 text-white/80 text-sm justify-center lg:justify-start">
                    <svg className="w-4 h-4 text-gold flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {text}
                  </li>
                ))}
              </ul>
              <Button variant="primary" onClick={() => setShowWidget(true)}>Try the Widget</Button>
            </div>

            <div data-slide-right>
              <OSPanel className="max-w-md mx-auto lg:mx-0 w-full border border-gold/20">
                <h4 className="text-base font-display font-bold text-white mb-4 text-center">Quick Book Demo</h4>
                <BookingWidget source="landing-page-demo" />
              </OSPanel>
            </div>
          </div>

          {/* Product 2 — AI Chat */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div data-slide-left className="order-2 lg:order-1">
              <OSPanel className="max-w-md mx-auto lg:mx-0 w-full border border-purple-500/20">
                <div className="p-4 border-b border-gold/20 bg-black/30 rounded-t-xl -mx-6 -mt-6 mb-4 px-6 pt-4">
                  <div className="text-[10px] tracking-widest uppercase text-gold/80">PROTOCOL: ACTIVE ASSISTANT</div>
                  <div className="text-lg font-bold text-white">Command Center</div>
                </div>
                <div className="space-y-3">
                  <div className="rounded-xl p-3 bg-white/5 border border-white/10 text-sm text-white/90">
                    <div className="font-semibold text-xs">System Online.</div>
                    <div className="text-xs text-white/70">How can I help you today?</div>
                  </div>
                  <div className="flex justify-end">
                    <div className="rounded-xl px-3 py-2 text-xs text-black bg-gold">Tell me about your services</div>
                  </div>
                </div>
              </OSPanel>
            </div>

            <div data-slide-right className="order-1 lg:order-2 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full mb-4">
                <span className="text-xs text-purple-300 font-semibold uppercase">Product #2</span>
              </div>
              <h3 className="text-xl font-display font-bold text-white mb-3">AI Chat Widget</h3>
              <p className="text-white/70 text-sm mb-4 leading-relaxed">
                Intelligent conversational AI that can be embedded on any website.
              </p>
              <ul className="space-y-2 mb-4">
                {['Powered by advanced AI', 'Train on your content', '24/7 automated support'].map((text, i) => (
                  <li key={i} className="flex items-center gap-2 text-white/80 text-sm justify-center lg:justify-start">
                    <svg className="w-4 h-4 text-purple-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {text}
                  </li>
                ))}
              </ul>
              <p className="text-gold text-xs">Try it → Click the chat bubble in the bottom right</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ SUCCESS STORY ═══════════ */}
      <section className="relative min-h-[60vh] flex flex-col overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/packed-house-clean.jpg"
            alt="Packed restaurant - The GreenLine Effect"
            fill
            className="object-cover object-center"
            quality={75}
            loading="lazy"
          />
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-os-dark via-os-dark/60 to-transparent" />
        </div>

        <div className="relative z-10 pt-12 pb-6 px-6">
          <div className="max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 glass-gold rounded-full border border-gold/40 mb-3">
              <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
              <span className="text-xs text-gold font-semibold">THE GREENLINE EFFECT</span>
            </div>

            <h2 className="font-display font-bold text-white mb-3 drop-shadow-lg text-2xl lg:text-4xl">
              From Empty Tables to a <span className="text-gold">Packed House</span>
            </h2>

            <p className="text-white/90 text-sm mb-6 max-w-xl mx-auto drop-shadow-md">
              GreenLine365 turns your camera roll into a marketing engine that fills your seats.
            </p>

            <Button variant="primary" size="lg" onClick={() => setShowFullForm(true)} className="shadow-lg">
              Start Your Success Story
            </Button>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-os-dark to-transparent" />
      </section>

      {/* ═══════════ BIG CTA BAND (Phase 6) — Refined Luxury ═══════════ */}
      <section className="py-24 relative overflow-hidden">
        {/* Subtle warm gradient — no circuit board pattern */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0E18] via-[#0D1220] to-[#0A0E18]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[1px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[1px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
        {/* Restrained ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gold/[0.03] rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <p className="text-gold/50 text-xs tracking-[0.3em] uppercase mb-8 font-medium">The Next Step</p>

          <h2 className="font-display font-bold text-[#F0ECE4] mb-6 text-3xl lg:text-5xl tracking-tight leading-[1.1]">
            Ready to <NeonText variant="gradient" animate={false}>Transform</NeonText> Your Business?
          </h2>
          <p className="text-[#F0ECE4]/40 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
            Join local businesses already using GreenLine365 to automate their marketing, fill their calendar, and grow their revenue.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Link
              href="/waitlist"
              className="btn-primary inline-flex items-center justify-center px-10 py-4 transition-all duration-300"
            >
              Get Started
            </Link>
            <Link
              href="/demo-calendar"
              className="btn-secondary inline-flex items-center justify-center px-10 py-4 transition-all duration-300"
            >
              Book a Demo
            </Link>
          </div>

          <div className="flex justify-center gap-8 text-[#F0ECE4]/30 text-xs tracking-wide">
            {['Free to start', 'No credit card', 'Cancel anytime'].map((text, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <span className="text-gold/50">—</span>
                {text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ MODALS ═══════════ */}
      {showFullForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <GlassCard variant="strong" hover={false} className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto p-6 border border-white/10">
            <button onClick={() => setShowFullForm(false)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-lg font-bold text-white mb-4 text-center">Schedule Your Demo</h2>
            <MultiStepBookingForm />
          </GlassCard>
        </div>
      )}

      {showWidget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-white rounded-xl p-5 shadow-xl">
            <button onClick={() => setShowWidget(false)} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
              <svg className="w-3.5 h-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-base font-bold text-gray-900 mb-3 text-center">Quick Book</h3>
            <BookingWidget source="quick-book-modal" onBookingComplete={() => setTimeout(() => setShowWidget(false), 2000)} />
          </div>
        </div>
      )}
    </main>
  );
}

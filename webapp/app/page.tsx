'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import MultiStepBookingForm from './components/MultiStepBookingForm';
import BookingWidget from './components/BookingWidget';
import DailyTrendHunter from './components/DailyTrendHunter';
import PhoneMockup from './components/PhoneMockup';
import FloatingShapes from './components/FloatingShapes';
import { Button } from '@/components/ui/os';
import { NeonText } from '@/components/ui/os';
import { GlassCard } from '@/components/ui/os';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function HomePage() {
  const [showFullForm, setShowFullForm] = useState(false);
  const [showWidget, setShowWidget] = useState(false);
  
  // GSAP Refs
  const heroRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLElement>(null);
  
  // Hero GSAP Animation
  useEffect(() => {
    if (!heroRef.current) return;
    
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      
      // Hero entrance sequence
      tl.from('[data-hero-badge]', {
        y: -40,
        opacity: 0,
        duration: 0.8,
        delay: 0.2,
      })
      .from('[data-hero-title] span', {
        y: 80,
        opacity: 0,
        duration: 0.9,
        stagger: 0.1,
      }, '-=0.4')
      .from('[data-hero-subtitle]', {
        y: 30,
        opacity: 0,
        duration: 0.7,
      }, '-=0.5')
      .from('[data-hero-cta]', {
        y: 20,
        opacity: 0,
        scale: 0.9,
        duration: 0.5,
      }, '-=0.3')
      .from('[data-hero-image]', {
        x: 100,
        opacity: 0,
        duration: 1,
        ease: 'power2.out',
      }, '-=0.7');
      
    }, heroRef);
    
    return () => ctx.revert();
  }, []);
  
  // Comprehensive scroll-triggered animations for all sections
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Section headers animation
      gsap.utils.toArray('[data-section-header]').forEach((el) => {
        gsap.from(el as Element, {
          scrollTrigger: {
            trigger: el as Element,
            start: 'top 80%',
          },
          y: 50,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
        });
      });

      // Feature cards stagger
      gsap.from('[data-feature-card]', {
        scrollTrigger: {
          trigger: featuresRef.current,
          start: 'top 75%',
        },
        y: 80,
        opacity: 0,
        duration: 0.7,
        stagger: 0.15,
        ease: 'power2.out',
      });

      // Step cards stagger
      gsap.from('[data-step-card]', {
        scrollTrigger: {
          trigger: '[data-step-card]',
          start: 'top 80%',
        },
        x: -60,
        opacity: 0,
        duration: 0.7,
        stagger: 0.15,
        ease: 'power2.out',
      });

      // Progress bars grow animation
      gsap.from('.gsap-progress-bar', {
        scrollTrigger: {
          trigger: '.gsap-progress-bar',
          start: 'top 85%',
        },
        scaleX: 0,
        transformOrigin: 'left',
        duration: 1,
        stagger: 0.2,
        ease: 'power2.out',
      });

      // Testimonial card
      gsap.from('[data-testimonial]', {
        scrollTrigger: {
          trigger: '[data-testimonial]',
          start: 'top 80%',
        },
        y: 60,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      });

      // Pain cards stagger
      gsap.from('[data-pain-card]', {
        scrollTrigger: {
          trigger: '[data-pain-card]',
          start: 'top 80%',
        },
        y: 40,
        opacity: 0,
        duration: 0.6,
        stagger: 0.12,
        ease: 'power2.out',
      });

      // Scroll images and content
      gsap.from('[data-scroll-image]', {
        scrollTrigger: {
          trigger: '[data-scroll-image]',
          start: 'top 75%',
        },
        x: -80,
        opacity: 0,
        duration: 0.9,
        ease: 'power2.out',
      });

      gsap.from('[data-scroll-content]', {
        scrollTrigger: {
          trigger: '[data-scroll-content]',
          start: 'top 75%',
        },
        x: 80,
        opacity: 0,
        duration: 0.9,
        ease: 'power2.out',
      });

      // Solution section
      gsap.from('[data-solution-image]', {
        scrollTrigger: {
          trigger: '[data-solution-image]',
          start: 'top 75%',
        },
        x: -60,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
      });

      gsap.from('[data-solution-content]', {
        scrollTrigger: {
          trigger: '[data-solution-content]',
          start: 'top 75%',
        },
        x: 60,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
      });

      gsap.from('[data-solution-feature]', {
        scrollTrigger: {
          trigger: '[data-solution-feature]',
          start: 'top 85%',
        },
        y: 30,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out',
      });

      gsap.from('[data-floating-badge]', {
        scrollTrigger: {
          trigger: '[data-floating-badge]',
          start: 'top 75%',
        },
        scale: 0.8,
        opacity: 0,
        duration: 0.6,
        delay: 0.3,
        ease: 'back.out(1.7)',
      });

      // Trend Hunter section
      gsap.from('[data-trend-content]', {
        scrollTrigger: {
          trigger: '[data-trend-content]',
          start: 'top 75%',
        },
        x: -50,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
      });

      gsap.from('[data-trend-widget]', {
        scrollTrigger: {
          trigger: '[data-trend-widget]',
          start: 'top 75%',
        },
        x: 50,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
      });

      // FAQ cards stagger
      gsap.from('[data-faq-card]', {
        scrollTrigger: {
          trigger: '[data-faq-card]',
          start: 'top 80%',
        },
        y: 60,
        opacity: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power2.out',
      });

      // Booking section
      gsap.from('[data-booking-left]', {
        scrollTrigger: {
          trigger: '[data-booking-left]',
          start: 'top 75%',
        },
        x: -60,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
      });

      gsap.from('[data-booking-right]', {
        scrollTrigger: {
          trigger: '[data-booking-right]',
          start: 'top 75%',
        },
        x: 60,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
      });

      // Products section
      gsap.from('[data-product-left]', {
        scrollTrigger: {
          trigger: '[data-product-left]',
          start: 'top 75%',
        },
        x: -50,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
      });

      gsap.from('[data-product-right]', {
        scrollTrigger: {
          trigger: '[data-product-right]',
          start: 'top 75%',
        },
        x: 50,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
      });

      gsap.from('[data-product-demo]', {
        scrollTrigger: {
          trigger: '[data-product-demo]',
          start: 'top 80%',
        },
        x: -50,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
      });

      gsap.from('[data-product-info]', {
        scrollTrigger: {
          trigger: '[data-product-info]',
          start: 'top 80%',
        },
        x: 50,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
      });

      // Success section
      gsap.from('[data-success-section]', {
        scrollTrigger: {
          trigger: '[data-success-section]',
          start: 'top 80%',
        },
        y: 50,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
      });

      gsap.from('[data-success-badge]', {
        scrollTrigger: {
          trigger: '[data-success-badge]',
          start: 'top 80%',
        },
        scale: 0.9,
        opacity: 0,
        duration: 0.6,
        ease: 'back.out(1.7)',
      });

      // Background glow animations
      gsap.to('.gsap-glow', {
        scale: 1.2,
        opacity: 0.5,
        duration: 20,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to('.gsap-glow-2', {
        scale: 1.3,
        x: -50,
        duration: 15,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // Floating phone animation
      gsap.to('.gsap-float', {
        y: -15,
        duration: 5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // Parallax effect for background elements
      gsap.to('.gsap-parallax', {
        scrollTrigger: {
          trigger: '.gsap-parallax',
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
        y: -100,
        ease: 'none',
      });

    });
    
    return () => ctx.revert();
  }, []);

  return (
    <main className="min-h-screen bg-os-dark">
      {/* ========== HERO SECTION - 50/50 Split ========== */}
      <section ref={heroRef} className="relative min-h-[90vh] flex items-center overflow-hidden pt-20">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-os-dark" />
        <div 
          className="absolute top-0 left-1/4 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-neon-green-500/5 to-transparent blur-3xl gsap-glow"
        />
        <div 
          className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-gradient-radial from-neon-green-500/10 to-transparent blur-3xl gsap-glow-2"
        />
        
        <div className="relative z-10 w-full max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Column - Text Content */}
            <div>
              <div 
                data-hero-badge
                className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 glass-green rounded-full border border-neon-green-500/30"
              >
                <span 
                  className="w-2 h-2 bg-neon-green-500 rounded-full animate-pulse"
                />
                <span className="text-xs text-neon-green-400 font-semibold tracking-wide">STATUS: ONLINE</span>
              </div>
              
              <h1 data-hero-title className="font-display font-bold mb-4 leading-tight overflow-hidden" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
                <span className="text-white block">The Operating System</span>
                <span className="text-white block">for the</span>
                <span className="text-neon-green-500 block">Local Economy</span>
              </h1>
              
              <p data-hero-subtitle className="text-white/70 mb-6 leading-relaxed max-w-xl" style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)' }}>
                Stop competing with algorithms. Start winning. Start running infrastructure that 
                connects <span className="text-neon-green-500 font-semibold">local life</span> with local commerce.
              </p>
              
              <div data-hero-cta className="flex flex-wrap gap-3 mb-8">
                <Button variant="primary" size="lg" onClick={() => setShowFullForm(true)} data-testid="hero-start-btn">
                  Start Your Engine
                </Button>
                <Button variant="secondary" size="lg" onClick={() => setShowWidget(true)} data-testid="hero-network-btn">
                  See the Network →
                </Button>
              </div>
              
              <div data-hero-stats className="grid grid-cols-3 gap-4">
                {[
                  { value: '500+', label: 'Businesses' },
                  { value: '40%', label: 'More Leads' },
                  { value: '24/7', label: 'Always On' }
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-2xl font-display font-bold text-neon-green-500">{stat.value}</div>
                    <div className="text-xs text-white/50">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Right Column - Phone Mockup */}
            <div
              data-hero-image
              className="relative hidden lg:flex justify-center"
            >
              <div className="absolute inset-0 bg-neon-green-500/10 blur-3xl rounded-full scale-75" />
              <div
                className="relative z-10 gsap-float"
              >
                <div className="relative w-[280px] h-[560px] bg-os-dark-900 rounded-[2.5rem] p-2 border-4 border-white/10">
                  <div className="w-full h-full bg-gradient-to-b from-os-dark to-os-dark-800 rounded-[2rem] overflow-hidden">
                    <div className="px-4 py-2 flex justify-between text-xs text-white/50">
                      <span>9:41</span>
                      <div className="flex gap-1">
                        <div className="w-3 h-3 border border-white/30 rounded-sm" />
                        <div className="w-3 h-3 border border-white/30 rounded-sm" />
                      </div>
                    </div>
                    <div className="px-3 py-4 space-y-3">
                      <div className="glass-strong rounded-xl p-3 border border-neon-green-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-neon-green-500/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-neon-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-white font-semibold text-xs">GreenLine360</div>
                            <div className="text-white/40 text-[10px]">Synced 2 min ago</div>
                          </div>
                        </div>
                      </div>
                      {['Page Reliability', 'Auto Response', 'Local Reach', 'Fundraiser Status'].map((item, i) => (
                        <div key={i} className="glass rounded-lg p-2.5 flex items-center justify-between border border-white/10">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-md bg-neon-green-500/20 flex items-center justify-center`}>
                              <div className="w-1.5 h-1.5 bg-neon-green-500 rounded-full" />
                            </div>
                            <span className="text-white text-xs">{item}</span>
                          </div>
                          <svg className="w-3 h-3 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      ))}
                      <div className="glass-strong rounded-xl p-3 border border-white/10 mt-4">
                        <div className="grid grid-cols-4 gap-1 text-center">
                          {[
                            { label: 'Posts', value: '1.5K' },
                            { label: 'Leads', value: '847', green: true },
                            { label: 'Reach', value: '2.3M' },
                            { label: 'ROI', value: '340%', green: true }
                          ].map((s, i) => (
                            <div key={i}>
                              <div className="text-white/40 text-[9px]">{s.label}</div>
                              <div className={`text-xs font-semibold ${s.green ? 'text-neon-green-500' : 'text-white'}`}>{s.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FEATURES - 3 Column Grid ========== */}
      <section ref={featuresRef} className="py-16" style={{ paddingBlock: 'clamp(3rem, 8vh, 5rem)' }}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div
            data-section-header
            className="text-center mb-10"
          >
            <h2 className="font-display font-bold text-white mb-3" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>
              Why Choose <span className="text-neon-green-500">GreenLine365</span>?
            </h2>
            <p className="text-white/60 max-w-xl mx-auto">Built for modern businesses who demand results</p>
          </div>
          
          {/* 3-Column Feature Grid */}
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {[
              { icon: '💡', title: 'AI-Powered Insights', desc: 'Get intelligent recommendations based on your business goals and market trends.' },
              { icon: '📅', title: 'Smart Scheduling', desc: 'Seamlessly integrate with your calendar. Book demos, meetings, and follow-ups.' },
              { icon: '⚡', title: 'Accountability System', desc: 'Stay on track with daily check-ins and progress tracking.' }
            ].map((feature, i) => (
              <div
                key={i}
                data-feature-card
                className="glass rounded-2xl p-5 border border-white/10 hover:border-neon-green-500/30 transition-colors gsap-hover-lift"
                style={{ maxWidth: '400px', justifySelf: 'center', width: '100%' }}
              >
                <div className="w-11 h-11 bg-neon-green-500/20 rounded-xl flex items-center justify-center mb-4 text-xl">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-display font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS - Numbered Cards ========== */}
      <section className="py-16 relative" style={{ paddingBlock: 'clamp(3rem, 8vh, 5rem)' }}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div
            data-section-header
            className="text-center mb-10"
          >
            <h2 className="font-display font-bold text-white mb-3" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>
              How the <span className="text-neon-green-500">System</span> Works
            </h2>
            <p className="text-white/60 max-w-xl mx-auto">Four seamless phases that transform your business</p>
          </div>
          
          <div className="space-y-4 max-w-3xl mx-auto">
            {[
              { num: '01', title: 'Discovery & Setup', desc: 'We analyze your business, identify ideal customers, and configure your AI-powered system.' },
              { num: '02', title: 'AI Signal Detection', desc: 'Our AI continuously scans social media, forums, and communities for buying signals.' },
              { num: '03', title: 'Smart Engagement', desc: 'Automated, personalized outreach at the perfect moment when intent is highest.' },
              { num: '04', title: 'Growth & Optimization', desc: 'Continuous learning and optimization to maximize your conversion rates.' }
            ].map((step, i) => (
              <div
                key={i}
                data-step-card
                className="glass-strong rounded-2xl p-5 border border-neon-green-500/20 flex gap-5 items-start gsap-hover-lift"
              >
                <div className="flex-shrink-0">
                  <div className="text-3xl font-display font-bold text-neon-green-500/30">{step.num}</div>
                  <div className="w-8 h-8 rounded-lg bg-neon-green-500/20 flex items-center justify-center mt-2">
                    <svg className="w-4 h-4 text-neon-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold text-white mb-1">{step.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{step.desc}</p>
                  <div className="h-1 bg-gradient-to-r from-neon-green-500 to-transparent rounded-full mt-3 w-2/3 gsap-progress-bar" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== TESTIMONIAL - Compact Card ========== */}
      <section className="py-12" style={{ paddingBlock: 'clamp(2rem, 6vh, 4rem)' }}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div
            data-testimonial
            className="glass-strong rounded-2xl p-6 md:p-8 border border-neon-green-500/20 max-w-3xl mx-auto"
          >
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-neon-green-500/20 flex items-center justify-center border border-neon-green-500/30">
                  <span className="text-neon-green-500 font-bold text-xl">MK</span>
                </div>
              </div>
              <div className="text-center md:text-left">
                <div className="flex gap-1 justify-center md:justify-start mb-3">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-neon-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-white/90 text-base leading-relaxed mb-3">
                  &ldquo;GreenLine365 transformed our lead generation. We went from 10 qualified leads per month to over 50.&rdquo;
                </p>
                <div className="text-sm">
                  <span className="text-white font-semibold">Michael K.</span>
                  <span className="text-white/50"> · CEO, TechFlow Solutions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== DISTRESSED OWNERS - 50/50 Split ========== */}
      <section className="py-16" style={{ paddingBlock: 'clamp(3rem, 8vh, 5rem)' }}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left - Image */}
            <div
              data-scroll-image
              className="order-2 lg:order-1"
            >
              <div className="relative rounded-2xl overflow-hidden border border-white/10">
                <Image
                  src="/images/distressed-owners.jpg"
                  alt="Stressed business owners"
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-os-dark/80 via-transparent to-transparent" />
              </div>
            </div>
            
            {/* Right - Content */}
            <div
              data-scroll-content
              className="order-1 lg:order-2"
            >
              <span className="text-neon-green-500 text-xs font-bold tracking-widest uppercase mb-3 block">Sound Familiar?</span>
              <h2 className="font-display font-bold text-white mb-4" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)' }}>
                Running a Business Shouldn&apos;t Mean <span className="text-red-400">Running on Empty</span>
              </h2>
              <div className="space-y-3">
                {[
                  { emoji: '😰', title: 'Overwhelmed', desc: 'Drowning in to-do lists while competitors steal customers' },
                  { emoji: '📱', title: 'Always On-Call', desc: 'Sacrificing family time to keep the business running' },
                  { emoji: '😓', title: 'No Marketing Time', desc: 'Great at your craft, but who has time for social media?' }
                ].map((pain, i) => (
                  <div key={i} data-pain-card className="glass rounded-xl p-4 border border-red-500/20 flex gap-3 items-start">
                    <span className="text-2xl">{pain.emoji}</span>
                    <div>
                      <h4 className="text-white font-semibold text-sm">{pain.title}</h4>
                      <p className="text-white/60 text-xs">{pain.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== SOLUTION - 50/50 Split ========== */}
      <section className="py-16 bg-gradient-to-b from-os-dark to-os-dark-800" style={{ paddingBlock: 'clamp(3rem, 8vh, 5rem)' }}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left - Image */}
            <div
              data-solution-image
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden border border-neon-green-500/30">
                <Image
                  src="/images/barber-selfie.jpg"
                  alt="Client capturing content"
                  width={500}
                  height={500}
                  className="w-full h-auto object-cover"
                />
                <div
                  data-floating-badge
                  className="absolute bottom-3 left-3 glass-green px-3 py-1.5 rounded-full border border-neon-green-500/40"
                >
                  <span className="text-neon-green-400 font-semibold text-xs">📸 Content = Customers</span>
                </div>
              </div>
              <div className="absolute -inset-4 bg-neon-green-500/5 rounded-3xl blur-2xl -z-10" />
            </div>
            
            {/* Right - Content */}
            <div
              data-solution-content
            >
              <span className="text-neon-green-500 text-xs font-bold tracking-widest uppercase mb-3 block">The Solution</span>
              <h2 className="font-display font-bold text-white mb-4" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)' }}>
                Your Phone is Already a <span className="text-neon-green-500">Marketing Machine</span>
              </h2>
              <p className="text-white/70 mb-5 text-sm leading-relaxed">
                Every photo you take is a potential post. GreenLine365 transforms your daily snapshots into a content engine.
              </p>
              <div className="space-y-3">
                {[
                  { title: 'AI-Powered Captions', desc: 'Upload a photo, get perfect captions in seconds' },
                  { title: 'Smart Hashtags', desc: 'Local + trending tags that get discovered' },
                  { title: 'One-Click Scheduling', desc: 'Post to all platforms without leaving your chair' }
                ].map((feature, i) => (
                  <div key={i} data-solution-feature className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-neon-green-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-neon-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold text-sm">{feature.title}</h4>
                      <p className="text-white/60 text-xs">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== TREND HUNTER DEMO - 50/50 Split ========== */}
      <section id="trend-demo" className="py-16 relative" style={{ paddingBlock: 'clamp(3rem, 8vh, 5rem)' }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-green-500/5 rounded-full blur-3xl gsap-parallax" />
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left - Content */}
            <div
              data-trend-content
            >
              <span className="text-neon-green-500 text-xs font-bold tracking-widest uppercase mb-3 block">Try It Now - FREE</span>
              <h2 className="font-display font-bold text-white mb-4" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)' }}>
                See What&apos;s Trending in <span className="text-neon-green-500">Your Area</span>
              </h2>
              <p className="text-white/60 mb-6 text-sm leading-relaxed">
                Enter your ZIP code and discover local events, trends, and opportunities you can turn into content and customers.
              </p>
              <div className="space-y-2 mb-6">
                {['Real-time local insights', 'Weather-based opportunities', 'Event-driven marketing'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-white/70 text-sm">
                    <div className="w-1.5 h-1.5 bg-neon-green-500 rounded-full" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Right - Widget */}
            <div
              data-trend-widget
              className="glass-strong rounded-2xl p-5 border border-neon-green-500/20"
            >
              <DailyTrendHunter trendType="manual" />
            </div>
          </div>
        </div>
      </section>

      {/* ========== FAQ - 3 Column Grid ========== */}
      <section className="py-16" style={{ paddingBlock: 'clamp(3rem, 8vh, 5rem)' }}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div
            data-section-header
            className="text-center mb-10"
          >
            <h2 className="font-display font-bold text-white mb-3" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>
              Frequently Asked <span className="text-neon-green-500">Questions</span>
            </h2>
          </div>
          
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
            {[
              { q: "How does GreenLine365 work?", a: "An AI-powered OS that connects your business with the local economy through automated scheduling and smart marketing.", bullets: ['AI-powered insights', '24/7 automation', 'Lead tracking'] },
              { q: "What makes you different?", a: "Built specifically for local businesses. Our AI understands local markets and optimizes for real-world foot traffic.", bullets: ['Built for local', 'Community-focused', 'Foot traffic optimization'] },
              { q: "How quickly can I start?", a: "Most businesses are fully onboarded within 24 hours. Our AI handles the heavy lifting.", bullets: ['Quick onboarding', 'Simple setup', 'Instant results'] },
              { q: "Do you integrate with my tools?", a: "Yes! We integrate with Google Calendar, Facebook, Instagram, Yelp, and 50+ other platforms.", bullets: ['50+ integrations', 'Universal compatibility', 'One-click sync'] },
              { q: "What's the ROI?", a: "Customers see an average 40% increase in lead conversion within the first 60 days.", bullets: ['40% conversion boost', '60-day ROI', 'First month payback'] },
              { q: "Is there a contract?", a: "No long-term contracts. Pay monthly and cancel anytime. We don't lock you in.", bullets: ['Monthly billing', 'Cancel anytime', 'No commitments'] }
            ].map((faq, i) => (
              <div
                key={i}
                data-faq-card
                className="glass rounded-2xl p-5 border border-white/10 hover:border-neon-green-500/30 transition-colors gsap-hover-lift"
                style={{ maxWidth: '400px', justifySelf: 'center', width: '100%' }}
              >
                <div className="w-9 h-9 bg-neon-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <span className="text-neon-green-500 text-sm">?</span>
                </div>
                <h3 className="text-base font-display font-bold text-white mb-2">{faq.q}</h3>
                <p className="text-white/60 text-xs leading-relaxed mb-3">{faq.a}</p>
                <div className="space-y-1">
                  {faq.bullets.map((b, j) => (
                    <div key={j} className="flex items-center gap-2 text-white/50 text-xs">
                      <div className="w-1 h-1 bg-neon-green-500 rounded-full" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== BOOKING - 50/50 Split ========== */}
      <section className="py-16" style={{ paddingBlock: 'clamp(3rem, 8vh, 5rem)' }} id="booking">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left - Value Prop */}
            <div
              data-booking-left
              className="glass-strong rounded-2xl p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-neon-green-500/20 border border-neon-green-500/50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-neon-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-display font-bold text-white text-sm">GreenLine<span className="text-neon-green-500">365</span></div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wider">Business OS</div>
                  </div>
                </div>
                
                <h2 className="font-display font-bold mb-4" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)' }}>
                  <span className="text-white block">Stop Losing</span>
                  <span className="text-neon-green-500">Revenue.</span>
                </h2>
                
                <p className="text-white/70 text-sm mb-6 leading-relaxed">
                  Turn missed calls into closed deals with AI-powered scheduling that works 24/7.
                </p>
                
                <div className="space-y-2 mb-6">
                  {['Increase lead conversion by 40%', 'Zero missed calls, 24/7/365', 'Integrates with your calendar'].map((text, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-neon-green-500/20 flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-neon-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-white/80 text-sm">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center gap-1 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-neon-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-white/50 text-xs">Trusted by 500+ businesses</p>
              </div>
            </div>
            
            {/* Right - Form */}
            <div
              data-booking-right
              className="glass rounded-2xl p-6"
            >
              <h3 className="text-lg font-display font-bold text-white mb-2">Book Your Strategy Session</h3>
              <p className="text-white/60 text-sm mb-4">Complete our quick form and we&apos;ll schedule a demo.</p>
              <MultiStepBookingForm />
            </div>
          </div>
        </div>
      </section>

      {/* ========== PRODUCTS - 50/50 Splits ========== */}
      <section className="py-16" style={{ paddingBlock: 'clamp(3rem, 8vh, 5rem)' }}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div
            data-section-header
            className="text-center mb-10"
          >
            <h2 className="font-display font-bold text-white mb-3" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>
              Our <span className="text-neon-green-500">Products</span>
            </h2>
            <p className="text-white/60">White-label solutions you can integrate</p>
          </div>

          {/* Product 1 - Booking Widget */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <div
              data-product-left
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 glass-green border border-neon-green-500/30 rounded-full mb-4">
                <span className="text-xs text-neon-green-500 font-semibold uppercase">Product #1</span>
              </div>
              <h3 className="text-xl font-display font-bold text-white mb-3">Universal Booking Widget</h3>
              <p className="text-white/70 text-sm mb-4 leading-relaxed">
                Embeddable booking widget for any website. Perfect for seamless scheduling.
              </p>
              <ul className="space-y-2 mb-4">
                {['Customizable colors', 'Calendar integrations', 'White-label for agencies'].map((text, i) => (
                  <li key={i} className="flex items-center gap-2 text-white/80 text-sm">
                    <svg className="w-4 h-4 text-neon-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {text}
                  </li>
                ))}
              </ul>
              <Button variant="primary" onClick={() => setShowWidget(true)}>Try the Widget</Button>
            </div>
            
            <div
              data-product-right
              className="glass-strong rounded-2xl p-5 border border-neon-green-500/20"
            >
              <h4 className="text-base font-display font-bold text-white mb-4 text-center">Quick Book Demo</h4>
              <BookingWidget source="landing-page-demo" />
            </div>
          </div>

          {/* Product 2 - AI Chat */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div
              data-product-demo
              className="glass-strong rounded-2xl p-5 order-2 lg:order-1"
            >
              <div className="p-4 border-b border-neon-green-500/10 bg-black/30 rounded-t-xl">
                <div className="text-[10px] tracking-widest uppercase text-neon-green-400/80">PROTOCOL: ACTIVE ASSISTANT</div>
                <div className="text-lg font-bold text-white">Command Center</div>
              </div>
              <div className="p-4 space-y-3">
                <div className="rounded-xl p-3 bg-white/5 border border-white/10 text-sm text-white/90">
                  <div className="font-semibold text-xs">System Online.</div>
                  <div className="text-xs text-white/70">How can I help you today?</div>
                </div>
                <div className="flex justify-end">
                  <div className="rounded-xl px-3 py-2 text-xs text-black bg-neon-green-500">Tell me about your services</div>
                </div>
              </div>
            </div>
            
            <div
              data-product-info
              className="order-1 lg:order-2"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full mb-4">
                <span className="text-xs text-purple-300 font-semibold uppercase">Product #2</span>
              </div>
              <h3 className="text-xl font-display font-bold text-white mb-3">AI Chat Widget</h3>
              <p className="text-white/70 text-sm mb-4 leading-relaxed">
                Intelligent conversational AI that can be embedded on any website.
              </p>
              <ul className="space-y-2 mb-4">
                {['Powered by advanced AI', 'Train on your content', '24/7 automated support'].map((text, i) => (
                  <li key={i} className="flex items-center gap-2 text-white/80 text-sm">
                    <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {text}
                  </li>
                ))}
              </ul>
              <p className="text-neon-green-400 text-xs">Try it → Click the chat bubble in the bottom right</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== SUCCESS STORY - Full Width Image at Bottom ========== */}
      <section className="relative min-h-[60vh] flex flex-col overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/packed-house-clean.jpg"
            alt="Packed restaurant - The GreenLine Effect"
            fill
            className="object-cover object-center"
            quality={100}
            priority
          />
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-os-dark via-os-dark/60 to-transparent" />
        </div>

        <div className="relative z-10 pt-12 pb-6 px-4">
          <div className="max-w-[1280px] mx-auto text-center">
            <div data-success-section>
              <div 
                data-success-badge
                className="inline-flex items-center gap-2 px-3 py-1.5 glass-green rounded-full border border-neon-green-500/40 mb-3"
              >
                <span className="w-2 h-2 bg-neon-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-neon-green-400 font-semibold">THE GREENLINE EFFECT</span>
              </div>

              <h2 className="font-display font-bold text-white mb-3 drop-shadow-lg" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                From Empty Tables to a <span className="text-neon-green-500">Packed House</span>
              </h2>

              <p className="text-white/90 text-sm mb-4 max-w-xl mx-auto drop-shadow-md">
                GreenLine365 turns your camera roll into a marketing engine that fills your seats.
              </p>

              <Button variant="primary" size="lg" onClick={() => setShowFullForm(true)} data-testid="success-cta-btn" className="shadow-lg">
                Start Your Success Story
              </Button>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-os-dark to-transparent" />
      </section>

      {/* Modals */}
      {showFullForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto glass-strong border border-white/10 rounded-2xl p-6">
            <button onClick={() => setShowFullForm(false)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-lg font-bold text-white mb-4 text-center">Schedule Your Demo</h2>
            <MultiStepBookingForm />
          </div>
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

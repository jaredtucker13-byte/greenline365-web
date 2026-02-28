'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import PhoneMockup from './PhoneMockup';
import FloatingShapes from './FloatingShapes';
import { NeonText } from '@/components/ui/os';
import { gsap, useGSAP } from '@/lib/gsap';

export default function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);

  // GSAP "system booting up" animation sequence
  useGSAP(() => {
    if (!heroRef.current) return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // System boot sequence
    tl.from('[data-hero-status]', {
      y: -30,
      opacity: 0,
      duration: 0.6,
      delay: 0.3,
    })
    .from('[data-hero-line]', {
      y: 60,
      opacity: 0,
      duration: 0.8,
      stagger: 0.12,
    }, '-=0.3')
    .from('[data-hero-sub]', {
      y: 25,
      opacity: 0,
      duration: 0.6,
    }, '-=0.4')
    .from('[data-hero-cta] > *', {
      y: 15,
      opacity: 0,
      scale: 0.95,
      duration: 0.5,
      stagger: 0.1,
    }, '-=0.3')
    .from('[data-hero-stats] > *', {
      y: 20,
      opacity: 0,
      duration: 0.4,
      stagger: 0.08,
    }, '-=0.3')
    .from('[data-hero-phone]', {
      x: 80,
      opacity: 0,
      duration: 1,
      ease: 'power2.out',
    }, '-=0.8');
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center overflow-hidden pt-20"
    >
      {/* ── Deep Background with Abstract Shapes ── */}
      <div className="absolute inset-0 bg-[#050B18]" />

      {/* Layered radial glows */}
      <motion.div
        className="absolute top-[-10%] left-[15%] w-[700px] h-[700px] rounded-full bg-gradient-to-br from-gold/8 to-transparent blur-[120px]"
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-5%] right-[10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tl from-gold/6 to-transparent blur-[100px]"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      <motion.div
        className="absolute top-[40%] right-[30%] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-gold/4 to-transparent blur-[80px]"
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Abstract arcs and circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large arc */}
        <svg className="absolute top-[10%] right-[-5%] w-[500px] h-[500px] opacity-[0.06]" viewBox="0 0 500 500">
          <circle cx="250" cy="250" r="200" fill="none" stroke="#C9A96E" strokeWidth="1" />
          <circle cx="250" cy="250" r="150" fill="none" stroke="#C9A96E" strokeWidth="0.5" strokeDasharray="8 8" />
        </svg>
        {/* Small orb cluster */}
        <svg className="absolute bottom-[20%] left-[5%] w-[200px] h-[200px] opacity-[0.08]" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="80" fill="none" stroke="#C9A96E" strokeWidth="1" />
          <circle cx="100" cy="100" r="40" fill="none" stroke="#C9A96E" strokeWidth="0.5" />
          <circle cx="100" cy="100" r="4" fill="#C9A96E" />
        </svg>
      </div>

      {/* Floating shapes (parallax) */}
      <FloatingShapes />

      {/* ── Content Grid ── */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── Left: Text Content ── */}
          <div>
            {/* Brand badge */}
            <motion.div
              data-hero-status
              className="mb-8 inline-flex items-center gap-2"
            >
              <span className="text-gold/60 text-sm font-light tracking-[0.15em]">GreenLine365</span>
            </motion.div>

            {/* Headline — editorial uppercase reveal */}
            <h1 className="font-display font-bold mb-4 leading-[1.05] tracking-tight" style={{ fontSize: 'clamp(2.5rem, 5.5vw, 4rem)' }}>
              <span data-hero-line className="block text-[#F0ECE4]">
                THE STANDARD,
              </span>
              <span data-hero-line className="block">
                <NeonText variant="gradient" animate={false}>
                  REDEFINED.
                </NeonText>
              </span>
            </h1>

            {/* Tagline — wide tracking, editorial */}
            <p
              data-hero-sub
              className="text-gold/70 mb-8 text-xs tracking-[0.25em] uppercase font-medium"
            >
              Curated. Verified. Unrivaled.
            </p>

            {/* Sub-copy */}
            <p
              data-hero-sub
              className="text-[#F0ECE4]/50 mb-8 leading-relaxed max-w-lg font-light"
              style={{ fontSize: 'clamp(0.95rem, 1.8vw, 1.1rem)' }}
            >
              The operating system for the local economy. Connecting{' '}
              <span className="text-gold font-normal">local life</span> with
              local commerce — powered by AI, built for the real world.
            </p>

            {/* CTAs */}
            <div data-hero-cta className="flex flex-wrap gap-4 mb-12">
              <Link
                href="/waitlist"
                className="btn-primary inline-flex items-center justify-center px-8 py-3.5 transition-all duration-300"
              >
                Search Directory
              </Link>
              <Link
                href="/demo-calendar"
                className="btn-secondary inline-flex items-center justify-center px-8 py-3.5 transition-all duration-300"
              >
                Book a Demo
              </Link>
            </div>

            {/* Stats row — restrained, editorial */}
            <div data-hero-stats className="flex gap-10 max-w-md">
              {[
                { value: 'AI', label: 'Powered' },
                { value: '24/7', label: 'Always On' },
                { value: '100%', label: 'Local Focus' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-xl font-display font-semibold text-gold">{stat.value}</div>
                  <div className="text-[10px] text-[#F0ECE4]/30 mt-1 tracking-[0.2em] uppercase">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Floating Phone Mockup ── */}
          <div
            data-hero-phone
            className="relative hidden lg:flex justify-center items-center"
          >
            {/* Soft ambient glow behind phone */}
            <div className="absolute inset-0 scale-75">
              <div className="absolute inset-0 bg-gold/15 blur-[80px] rounded-full" />
            </div>
            {/* Float animation on phone */}
            <motion.div
              className="relative z-10"
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <PhoneMockup />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

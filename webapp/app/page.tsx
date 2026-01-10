'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import DailyTrendHunter from './components/DailyTrendHunter';
import { Button } from '@/components/ui/os';

export default function HomePage() {
  const [showTrendDemo, setShowTrendDemo] = useState(false);

  return (
    <main className="min-h-screen bg-os-dark overflow-x-hidden">
      {/* ========== HERO SECTION ========== */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
        {/* Hero Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/hero-packed-house.jpg"
            alt="From empty tables to a packed house - The GreenLine Effect"
            fill
            className="object-cover"
            priority
          />
          {/* Dark Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-os-dark" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge */}
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 glass-green rounded-full border border-neon-green-500/40 mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span className="w-2 h-2 bg-neon-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-neon-green-400 font-semibold">THE GREENLINE EFFECT</span>
            </motion.div>

            {/* Main Headline - matches image */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold text-white mb-6 leading-tight">
              From Empty Tables to a{' '}
              <span className="text-neon-green-500">Packed House</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl lg:text-2xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed">
              GreenLine365 turns your camera roll into a marketing engine that fills your seats and grows your business.
            </p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  const demoSection = document.getElementById('trend-demo');
                  demoSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                data-testid="hero-cta-btn"
                className="text-lg px-8 py-4"
              >
                Start Your Success Story
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{ 
            opacity: { delay: 1.2 },
            y: { duration: 2, repeat: Infinity }
          }}
        >
          <div className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center pt-2">
            <motion.div 
              className="w-1 h-2 bg-neon-green-500 rounded-full"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* ========== THE PROBLEM - DISTRESSED OWNERS ========== */}
      <section className="py-20 lg:py-32 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <span className="text-neon-green-500 text-sm font-bold tracking-widest uppercase mb-4 block">
              Sound Familiar?
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-6">
              Running a Business Shouldn&apos;t Mean{' '}
              <span className="text-red-400">Running on Empty</span>
            </h2>
          </motion.div>

          {/* Distressed Owners Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative rounded-2xl overflow-hidden border border-white/10"
          >
            <Image
              src="/images/distressed-owners.jpg"
              alt="Stressed business owners juggling work and life"
              width={1200}
              height={600}
              className="w-full h-auto object-cover"
            />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-os-dark via-transparent to-transparent" />
          </motion.div>

          {/* Pain Points */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 grid md:grid-cols-3 gap-6"
          >
            <div className="glass p-6 rounded-2xl border border-red-500/20 text-center">
              <div className="text-4xl mb-4">😰</div>
              <h3 className="text-xl font-bold text-white mb-2">Overwhelmed</h3>
              <p className="text-white/60">Drowning in to-do lists while competitors steal your customers</p>
            </div>
            <div className="glass p-6 rounded-2xl border border-red-500/20 text-center">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-bold text-white mb-2">Always On-Call</h3>
              <p className="text-white/60">Sacrificing family time just to keep the business running</p>
            </div>
            <div className="glass p-6 rounded-2xl border border-red-500/20 text-center">
              <div className="text-4xl mb-4">😓</div>
              <h3 className="text-xl font-bold text-white mb-2">No Marketing Time</h3>
              <p className="text-white/60">Great at your craft, but who has time for social media?</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========== THE SOLUTION - BARBER TAKING PHOTO ========== */}
      <section className="py-20 lg:py-32 px-4 relative bg-gradient-to-b from-os-dark to-os-dark-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Image */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden border border-neon-green-500/30">
                <Image
                  src="/images/barber-selfie.jpg"
                  alt="Client capturing their fresh haircut with smartphone"
                  width={600}
                  height={600}
                  className="w-full h-auto object-cover"
                />
                {/* Floating Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  className="absolute bottom-4 left-4 glass-green px-4 py-2 rounded-full border border-neon-green-500/40"
                >
                  <span className="text-neon-green-400 font-semibold text-sm">📸 Content = Customers</span>
                </motion.div>
              </div>
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-neon-green-500/10 rounded-3xl blur-3xl -z-10" />
            </motion.div>

            {/* Right - Content */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <span className="text-neon-green-500 text-sm font-bold tracking-widest uppercase mb-4 block">
                The Solution
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-6">
                Your Phone is Already a{' '}
                <span className="text-neon-green-500">Marketing Machine</span>
              </h2>
              <p className="text-lg text-white/70 mb-8 leading-relaxed">
                Every photo you take is a potential post. Every satisfied customer is a story waiting to be told. GreenLine365 transforms your daily snapshots into a content engine that runs itself.
              </p>

              {/* Feature List */}
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-neon-green-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-neon-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">AI-Powered Captions</h4>
                    <p className="text-white/60 text-sm">Upload a photo, get perfect captions in seconds</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-neon-green-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-neon-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Smart Hashtags</h4>
                    <p className="text-white/60 text-sm">Local + trending tags that actually get discovered</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-neon-green-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-neon-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">One-Click Scheduling</h4>
                    <p className="text-white/60 text-sm">Post to all platforms without leaving your chair</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== LIVE DEMO - TREND HUNTER ========== */}
      <section id="trend-demo" className="py-20 lg:py-32 px-4 relative">
        {/* Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-os-dark-800 via-os-dark to-os-dark" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-neon-green-500/5 rounded-full blur-3xl" />

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <span className="text-neon-green-500 text-sm font-bold tracking-widest uppercase mb-4 block">
              Try It Now - FREE
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-6">
              See What&apos;s Trending in{' '}
              <span className="text-neon-green-500">Your Area</span>
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Enter your ZIP code and discover local events, trends, and opportunities you can turn into content and customers.
            </p>
          </motion.div>

          {/* Trend Hunter Component */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="glass-strong rounded-3xl p-6 md:p-10 border border-neon-green-500/20"
          >
            <DailyTrendHunter trendType="manual" />
          </motion.div>
        </div>
      </section>

      {/* ========== THE RESULT - BARBER SHOP SUCCESS ========== */}
      <section className="py-20 lg:py-32 px-4 relative bg-gradient-to-b from-os-dark to-os-dark-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Content */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="order-2 lg:order-1"
            >
              <span className="text-neon-green-500 text-sm font-bold tracking-widest uppercase mb-4 block">
                The Results
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-6">
                From Struggling to{' '}
                <span className="text-neon-green-500">Fully Booked</span>
              </h2>
              <p className="text-lg text-white/70 mb-8 leading-relaxed">
                Business owners like you are seeing real results. More visibility. More customers. More time with family. All without becoming a marketing expert.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="text-center glass p-4 rounded-xl border border-neon-green-500/20">
                  <div className="text-3xl font-bold text-neon-green-500 mb-1">+180%</div>
                  <div className="text-sm text-white/60">Reservations</div>
                </div>
                <div className="text-center glass p-4 rounded-xl border border-neon-green-500/20">
                  <div className="text-3xl font-bold text-neon-green-500 mb-1">#1</div>
                  <div className="text-sm text-white/60">Local Visibility</div>
                </div>
                <div className="text-center glass p-4 rounded-xl border border-neon-green-500/20">
                  <div className="text-3xl font-bold text-neon-green-500 mb-1">45+</div>
                  <div className="text-sm text-white/60">Waitlist Parties</div>
                </div>
              </div>

              {/* CTA */}
              <Button
                variant="primary"
                size="lg"
                onClick={() => window.location.href = '/pricing'}
                data-testid="results-cta-btn"
              >
                Get Started Today
              </Button>
            </motion.div>

            {/* Right - Image */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="order-1 lg:order-2"
            >
              <div className="relative rounded-2xl overflow-hidden border border-neon-green-500/30">
                <Image
                  src="/images/barber-result.jpg"
                  alt="Professional haircut result - satisfied customer"
                  width={600}
                  height={500}
                  className="w-full h-auto object-cover"
                />
                {/* Success Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  className="absolute top-4 right-4 glass-green px-4 py-2 rounded-full border border-neon-green-500/40"
                >
                  <span className="text-neon-green-400 font-semibold text-sm">✓ GreenLine Client</span>
                </motion.div>
              </div>
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-neon-green-500/10 rounded-3xl blur-3xl -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== FINAL CTA ========== */}
      <section className="py-20 lg:py-32 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-neon-green-500/10 via-os-dark to-os-dark" />
        
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-6">
              Ready to Fill Your{' '}
              <span className="text-neon-green-500">Empty Tables</span>?
            </h2>
            <p className="text-lg text-white/60 mb-8 max-w-2xl mx-auto">
              Join hundreds of local businesses who&apos;ve transformed their marketing with GreenLine365. No contracts. No marketing degree required.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="primary"
                size="lg"
                onClick={() => window.location.href = '/pricing'}
                data-testid="final-cta-primary"
                className="text-lg px-8 py-4"
              >
                Start Free Trial
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => window.location.href = '/about'}
                data-testid="final-cta-secondary"
                className="text-lg px-8 py-4"
              >
                Learn More
              </Button>
            </div>

            {/* Trust Badge */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="mt-12 flex items-center justify-center gap-6 text-white/40 text-sm"
            >
              <span>✓ No credit card required</span>
              <span>✓ Cancel anytime</span>
              <span>✓ 24/7 support</span>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

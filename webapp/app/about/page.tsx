'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/os';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-os-dark pt-24 pb-16">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        
        {/* ========== HERO - Meet Jared ========== */}
        <section className="mb-16">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left - Photo */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden border border-neon-green-500/30">
                <Image
                  src="/images/jared-family.jpg"
                  alt="Jared Tucker with nephews and dog Ajax in Tampa"
                  width={600}
                  height={500}
                  className="w-full h-auto object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-os-dark/90 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white/80 text-sm italic">
                    Family time with my nephews and my loyal friend Ajax. Moments like these remind us of the importance of taking care of the health of our family and loved ones.
                  </p>
                </div>
              </div>
              <div className="absolute -inset-4 bg-neon-green-500/5 rounded-3xl blur-2xl -z-10" />
            </motion.div>
            
            {/* Right - Intro */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-neon-green-500 text-xs font-bold tracking-widest uppercase mb-3 block">Meet the Founder</span>
              <h1 className="font-display font-bold text-white mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>
                I&apos;m <span className="text-neon-green-500">Jared Tucker</span>
              </h1>
              <div className="space-y-4 text-white/70 text-sm leading-relaxed">
                <p>
                  I&apos;m building GreenLine365 right here in <strong className="text-white">Tampa, Florida</strong>. I&apos;m 42 years old, and my background isn&apos;t in tech or Silicon Valley—it&apos;s in the real world.
                </p>
                <p>
                  I&apos;ve spent <strong className="text-neon-green-500">16 years in professional kitchens</strong> and the last five years crawling through attics as an <strong className="text-neon-green-500">HVAC technician</strong>. I know exactly what it feels like to work a 12-hour day and still have a mountain of &quot;to-do&quot; tasks waiting for you at home.
                </p>
              </div>
              
              <div className="mt-6 flex items-center gap-4">
                <div className="glass rounded-xl p-3 border border-white/10 text-center">
                  <div className="text-2xl font-bold text-neon-green-500">16</div>
                  <div className="text-xs text-white/50">Years in Kitchens</div>
                </div>
                <div className="glass rounded-xl p-3 border border-white/10 text-center">
                  <div className="text-2xl font-bold text-neon-green-500">5</div>
                  <div className="text-xs text-white/50">Years HVAC</div>
                </div>
                <div className="glass rounded-xl p-3 border border-white/10 text-center">
                  <div className="text-2xl font-bold text-neon-green-500">42</div>
                  <div className="text-xs text-white/50">Years Young</div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ========== WHERE THE IDEA STARTED ========== */}
        <section className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-strong rounded-2xl p-6 md:p-8 border border-neon-green-500/20"
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">💔</span>
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-white mb-1">Where the Idea Started</h2>
                <p className="text-white/50 text-sm">Born from my own failure</p>
              </div>
            </div>
            
            <div className="space-y-4 text-white/70 text-sm leading-relaxed">
              <p>
                GreenLine365 was born from my own failure. I tried to launch a <strong className="text-white">print-on-demand shop on Etsy</strong>, and while I had no problem creating the products—the canvas art, the mugs, the designs—I hit a wall with everything else.
              </p>
              <p>
                I spent hours writing descriptions, building mockups, and trying to &quot;feed the algorithm&quot; on social media. <strong className="text-red-400">I didn&apos;t fail because my products were bad; I failed because the tedious, repetitive tasks consumed my life.</strong>
              </p>
              <p>
                I realized then that most apps are built for profit and exit strategies, but I wanted to build something for the people actually doing the work.
              </p>
            </div>
          </motion.div>
        </section>

        {/* ========== MY PRODUCTS - The Work That Started It All ========== */}
        <section className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <span className="text-neon-green-500 text-xs font-bold tracking-widest uppercase mb-3 block">The Work That Started It All</span>
            <h2 className="font-display font-bold text-white mb-3" style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>
              These Are My <span className="text-neon-green-500">Actual Products</span>
            </h2>
            <p className="text-white/60 text-sm max-w-2xl mx-auto">
              The canvas art and mugs I created that started this whole journey. I&apos;ve been in the trenches and I understand the grind.
            </p>
          </motion.div>

          {/* Product Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Canvas Art */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <div className="relative rounded-2xl overflow-hidden border border-white/10 group">
                <Image
                  src="/images/city-skyline-art.jpg"
                  alt="City skyline canvas art with light trails"
                  width={500}
                  height={400}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-os-dark via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <span className="glass-green px-3 py-1 rounded-full text-xs text-neon-green-400 font-semibold">Canvas Art</span>
                </div>
              </div>
              <div className="relative rounded-2xl overflow-hidden border border-white/10 group">
                <Image
                  src="/images/heart-balloon-art.jpg"
                  alt="Heart balloon romantic canvas art"
                  width={500}
                  height={400}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-os-dark via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <span className="glass-green px-3 py-1 rounded-full text-xs text-neon-green-400 font-semibold">Canvas Art</span>
                </div>
              </div>
            </motion.div>

            {/* Mugs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <div className="relative rounded-2xl overflow-hidden border border-white/10 group">
                <Image
                  src="/images/mugs-affection.jpg"
                  alt="Verdant Affection and Passionate Foliage mugs"
                  width={500}
                  height={400}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-os-dark via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <span className="glass-green px-3 py-1 rounded-full text-xs text-neon-green-400 font-semibold">Custom Mugs</span>
                </div>
              </div>
              <div className="relative rounded-2xl overflow-hidden border border-white/10 group">
                <Image
                  src="/images/mugs-decaf.jpg"
                  alt="Decaf economy themed mug"
                  width={500}
                  height={400}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-os-dark via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <span className="glass-green px-3 py-1 rounded-full text-xs text-neon-green-400 font-semibold">Custom Mugs</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* The Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-2xl p-6 border border-neon-green-500/30 text-center"
          >
            <p className="text-white/80 text-base leading-relaxed mb-4">
              <span className="text-neon-green-500 font-semibold">Imagine what these could have become</span> if GreenLine365 had existed when I was building them. AI-generated descriptions, smart hashtags, automated posting schedules—all the things that ate up my nights and weekends.
            </p>
            <p className="text-white/60 text-sm">
              That&apos;s exactly why I&apos;m building this—so you don&apos;t have to go through what I did.
            </p>
          </motion.div>
        </section>

        {/* ========== BUILT FOR THE MICRO-BUSINESS ========== */}
        <section className="mb-16">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left - Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-neon-green-500 text-xs font-bold tracking-widest uppercase mb-3 block">Built for You</span>
              <h2 className="font-display font-bold text-white mb-4" style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>
                Built for the <span className="text-neon-green-500">Micro-Business</span>
              </h2>
              <div className="space-y-4 text-white/70 text-sm leading-relaxed">
                <p>
                  I&apos;m building this for the local economy—the <strong className="text-white">barbershops</strong>, the <strong className="text-white">service pros</strong>, and the <strong className="text-white">makers</strong> who are tired of decision-making fatigue.
                </p>
                <p>
                  If you&apos;re a shop owner who hates having to lay off staff during slow seasons, or a creator who just wants their time back, I&apos;m building this for you.
                </p>
                <p className="text-neon-green-500 font-semibold">
                  My goal is to help you win back roughly 15 hours a week by automating the tasks that steal your time.
                </p>
              </div>
            </motion.div>
            
            {/* Right - Features */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <div className="glass rounded-xl p-4 border border-neon-green-500/20 flex gap-4 items-start">
                <div className="w-10 h-10 rounded-lg bg-neon-green-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">📊</span>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm mb-1">Daily Trend Hunter</h4>
                  <p className="text-white/60 text-xs">Handle your social media presence by feeding the algorithm for you.</p>
                </div>
              </div>
              <div className="glass rounded-xl p-4 border border-neon-green-500/20 flex gap-4 items-start">
                <div className="w-10 h-10 rounded-lg bg-neon-green-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">💰</span>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm mb-1">Revenue Tracking</h4>
                  <p className="text-white/60 text-xs">Simple tracking for growth with print-outs ready for taxes.</p>
                </div>
              </div>
              <div className="glass rounded-xl p-4 border border-neon-green-500/20 flex gap-4 items-start">
                <div className="w-10 h-10 rounded-lg bg-neon-green-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🌱</span>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm mb-1">Sustainability</h4>
                  <p className="text-white/60 text-xs">Grow your visibility and revenue while you actually get to live your life.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ========== VISION BEYOND SOFTWARE ========== */}
        <section className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-strong rounded-2xl p-6 md:p-8 border border-neon-green-500/20"
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-neon-green-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🚀</span>
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-white mb-1">A Vision Beyond Software</h2>
                <p className="text-white/50 text-sm">This is just the beginning</p>
              </div>
            </div>
            
            <div className="space-y-4 text-white/70 text-sm leading-relaxed">
              <p>
                This goes way beyond just a simple software platform. While we&apos;re starting here to build revenue and a great team, I have a <strong className="text-neon-green-500">five-year, five-phase plan</strong> that nobody would expect.
              </p>
              <p>
                GreenLine365 will eventually evolve into a <strong className="text-white">massive directory and ecosystem</strong> that serves both businesses and consumers. I&apos;m keeping some details quiet for now to protect these &quot;world-changing&quot; ideas.
              </p>
              <p className="text-neon-green-500 font-semibold">
                This isn&apos;t a project I&apos;m looking to flip—it&apos;s a foundation I&apos;m building to change the game for small businesses everywhere.
              </p>
            </div>
            
            {/* Phase Indicators */}
            <div className="mt-6 flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((phase) => (
                <div key={phase} className="flex-1">
                  <div className={`h-2 rounded-full ${phase === 1 ? 'bg-neon-green-500' : 'bg-white/10'}`} />
                  <p className="text-xs text-white/40 mt-1 text-center">Phase {phase}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ========== COMMITMENT / CTA ========== */}
        <section className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="font-display font-bold text-white mb-4" style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>
              My Commitment to <span className="text-neon-green-500">You</span>
            </h2>
            <p className="text-white/70 text-sm max-w-2xl mx-auto mb-6 leading-relaxed">
              If you&apos;re tired of doing 20 jobs just to keep one business alive, join me on this mission to take our time back. I&apos;ve been in the trenches, and I&apos;m building the tools I wish I had.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/pricing">
                <Button variant="primary" size="lg">
                  Get Started Today
                </Button>
              </Link>
              <Link href="/#trend-demo">
                <Button variant="outline" size="lg">
                  Try the Demo
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* ========== LOCATION / TAMPA PRIDE ========== */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-2xl p-6 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-neon-green-500/20 flex items-center justify-center">
                <span className="text-2xl">📍</span>
              </div>
              <div>
                <p className="text-white font-semibold">Proudly Built in Tampa, Florida</p>
                <p className="text-white/50 text-sm">Supporting local businesses, one feature at a time</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <span>🌴</span>
              <span>Made with ☀️ in the Sunshine State</span>
            </div>
          </motion.div>
        </section>

      </div>
    </main>
  );
}

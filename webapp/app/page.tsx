'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import MultiStepBookingForm from './components/MultiStepBookingForm';
import BookingWidget from './components/BookingWidget';
import { Button } from '@/components/ui/os';
import { NeonText } from '@/components/ui/os';
import { GlassCard } from '@/components/ui/os';

export default function HomePage() {
  const [showFullForm, setShowFullForm] = useState(false);
  const [showWidget, setShowWidget] = useState(false);

  return (
    <main className="min-h-screen">
      {/* Hero Section - Enhanced with MASSIVE Depth */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
        {/* Background - Pure Dark */}
        <div className="absolute inset-0 bg-os-dark" />
        
        {/* LAYER 1 - Deepest Background Shapes */}
        <motion.div 
          className="absolute top-0 left-1/4 w-[1200px] h-[1200px] rounded-full bg-gradient-to-br from-neon-green-500/5 to-transparent blur-3xl"
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, 90, 0],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ 
            duration: 25, 
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
        
        {/* LAYER 2 - Mid Background Orbs */}
        <motion.div 
          className="absolute top-1/3 right-1/4 w-[900px] h-[900px] rounded-full bg-gradient-to-tl from-neon-green-500/8 to-transparent blur-3xl"
          animate={{ 
            scale: [1, 1.4, 1],
            x: [0, -100, 0],
            opacity: [0.4, 0.6, 0.4]
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 3
          }}
        />
        
        {/* LAYER 3 - Floating Grid Lines */}
        <motion.div 
          className="absolute inset-0 circuit-bg opacity-5"
          animate={{ 
            backgroundPosition: ['0px 0px', '40px 40px', '0px 0px']
          }}
          transition={{ 
            duration: 30, 
            repeat: Infinity,
            ease: 'linear'
          }}
        />
        
        {/* LAYER 4 - Main Glow Elements */}
        <motion.div 
          className="absolute top-1/4 left-0 w-[800px] h-[800px] bg-radial-green opacity-20 blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 100, 0],
            y: [0, 50, 0]
          }}
          transition={{ 
            duration: 15, 
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
        
        {/* LAYER 5 - Accent Glow (Changed from teal to amber) */}
        <motion.div 
          className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-gradient-radial from-neon-amber-500/15 via-neon-green-500/10 to-transparent blur-3xl"
          animate={{ 
            scale: [1, 1.3, 1],
            x: [0, -80, 0],
            rotate: [0, 45, 0]
          }}
          transition={{ 
            duration: 12, 
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2
          }}
        />
        
        {/* LAYER 6 - Floating Particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-neon-green-500/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Side - Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Status Badge */}
              <motion.div 
                className="mb-8 inline-flex items-center gap-2 px-4 py-2 glass-green rounded-full border border-neon-green-500/30"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <motion.span 
                  className="w-2 h-2 bg-neon-green-500 rounded-full shadow-neon-green"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-sm text-neon-green-400 font-semibold tracking-wide">
                  STATUS: ONLINE
                </span>
              </motion.div>
              
              {/* Main Headline */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold mb-6 leading-tight">
                <span className="text-white block mb-2">The Operating System</span>
                <span className="text-white block mb-2">for the</span>
                <motion.span 
                  className="block bg-gradient-to-r from-neon-green-400 via-neon-green-500 to-neon-green-400 bg-clip-text text-transparent bg-[length:200%_100%] glow-text"
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                >
                  Local Economy
                </motion.span>
              </h1>
              
              {/* Subheadline */}
              <p className="text-xl md:text-2xl text-white/70 mb-10 leading-relaxed max-w-xl">
                Stop competing with algorithms. Start winning. Start running infrastructure that 
                connects <span className="text-neon-green-500 font-semibold">local life</span> with local commerce.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setShowFullForm(true)}
                >
                  Start Your Engine
                </Button>
                
                {/* Animated Border Button */}
                <motion.button
                  onClick={() => setShowWidget(true)}
                  className="relative px-6 py-3 text-base font-semibold text-white rounded-full overflow-hidden group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Animated Border */}
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, transparent, transparent, #00FF00, transparent, transparent)',
                      backgroundSize: '200% 100%',
                    }}
                    animate={{
                      backgroundPosition: ['200% 0%', '-200% 0%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                  <div className="absolute inset-[2px] bg-os-dark rounded-full" />
                  <span className="relative z-10 flex items-center gap-2">
                    See the Network
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </span>
                </motion.button>
              </div>
              
              {/* Stats Row */}
              <motion.div 
                className="mt-12 grid grid-cols-3 gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <div>
                  <div className="text-3xl font-display font-bold text-neon-green-500 mb-1">500+</div>
                  <div className="text-sm text-white/60">Businesses</div>
                </div>
                <div>
                  <div className="text-3xl font-display font-bold text-neon-green-500 mb-1">40%</div>
                  <div className="text-sm text-white/60">More Leads</div>
                </div>
                <div>
                  <div className="text-3xl font-display font-bold text-neon-green-500 mb-1">24/7</div>
                  <div className="text-sm text-white/60">Always On</div>
                </div>
              </motion.div>
            </motion.div>
            
            {/* Right Side - Phone Mockup */}
            <motion.div
              className="relative hidden lg:block"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              {/* Glow Effect Behind Phone */}
              <div className="absolute inset-0 bg-neon-green-500/20 blur-3xl rounded-full scale-75" />
              
              {/* Phone Mockup Container */}
              <motion.div
                className="relative z-10"
                animate={{ 
                  y: [0, -20, 0],
                }}
                transition={{ 
                  duration: 6, 
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              >
                {/* Phone Frame */}
                <div className="relative mx-auto w-[320px] h-[650px] bg-os-dark-900 rounded-[3rem] p-3 shadow-2xl border-4 border-white/10">
                  {/* Phone Screen */}
                  <div className="w-full h-full bg-gradient-to-b from-os-dark to-os-dark-800 rounded-[2.5rem] overflow-hidden relative">
                    {/* Status Bar */}
                    <div className="px-6 py-3 flex justify-between items-center text-xs text-white/60">
                      <span>9:41</span>
                      <div className="flex gap-1">
                        <div className="w-4 h-4 rounded-sm border border-white/40" />
                        <div className="w-4 h-4 rounded-sm border border-white/40" />
                        <div className="w-4 h-4 rounded-sm border border-white/40" />
                      </div>
                    </div>
                    
                    {/* App Content */}
                    <div className="px-4 py-6 space-y-4">
                      {/* Header */}
                      <div className="glass-strong rounded-2xl p-4 border border-neon-green-500/20">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-neon-green-500/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-neon-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-white font-semibold text-sm">GreenLine360 BACS</div>
                            <div className="text-white/50 text-xs">Last synced 2 min ago</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="space-y-2">
                        <div className="glass rounded-xl p-3 flex items-center justify-between border border-white/10 hover:border-neon-green-500/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-neon-green-500/20 flex items-center justify-center">
                              <div className="w-2 h-2 bg-neon-green-500 rounded-full" />
                            </div>
                            <span className="text-white text-sm font-medium">Page Reliability</span>
                          </div>
                          <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        
                        <div className="glass rounded-xl p-3 flex items-center justify-between border border-white/10">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-neon-teal-500/20 flex items-center justify-center">
                              <div className="w-2 h-2 bg-neon-teal-500 rounded-full" />
                            </div>
                            <span className="text-white text-sm font-medium">Auto Response Qual</span>
                          </div>
                          <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        
                        <div className="glass rounded-xl p-3 flex items-center justify-between border border-white/10">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-neon-amber-500/20 flex items-center justify-center">
                              <div className="w-2 h-2 bg-neon-amber-500 rounded-full" />
                            </div>
                            <span className="text-white text-sm font-medium">Local Reach</span>
                          </div>
                          <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        
                        <div className="glass rounded-xl p-3 flex items-center justify-between border border-white/10">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-neon-green-500/20 flex items-center justify-center">
                              <div className="w-2 h-2 bg-neon-green-500 rounded-full" />
                            </div>
                            <span className="text-white text-sm font-medium">Fundraiser Status</span>
                          </div>
                          <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        
                        <div className="glass rounded-xl p-3 flex items-center justify-between border border-white/10">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                              <div className="w-2 h-2 bg-white/60 rounded-full" />
                            </div>
                            <span className="text-white text-sm font-medium">Confidence Testing</span>
                          </div>
                          <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                      
                      {/* Bottom Stats */}
                      <div className="glass-strong rounded-2xl p-4 mt-4 border border-white/10">
                        <div className="grid grid-cols-4 gap-2 text-center">
                          <div>
                            <div className="text-white/40 text-xs mb-1">Posts</div>
                            <div className="text-white font-semibold">1,55K</div>
                          </div>
                          <div>
                            <div className="text-white/40 text-xs mb-1">Leads</div>
                            <div className="text-neon-green-500 font-semibold">847</div>
                          </div>
                          <div>
                            <div className="text-white/40 text-xs mb-1">Reach</div>
                            <div className="text-white font-semibold">2.3M</div>
                          </div>
                          <div>
                            <div className="text-white/40 text-xs mb-1">ROI</div>
                            <div className="text-neon-green-500 font-semibold">340%</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Phone Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-os-dark-900 rounded-b-2xl" />
                </div>
              </motion.div>
            </motion.div>
          </div>
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
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <motion.div 
              className="w-1 h-2 bg-neon-green-500 rounded-full"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-8 relative">
        {/* Background Circuit Pattern */}
        <div className="absolute inset-0 circuit-bg opacity-5" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              Why Choose <NeonText variant="green" glow>GreenLine365</NeonText>?
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Built for modern businesses who demand results
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <GlassCard variant="default" hover className="p-8 group">
              <motion.div 
                className="w-14 h-14 bg-neon-green-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:shadow-neon-green transition-shadow duration-300"
                whileHover={{ scale: 1.05, rotate: 5 }}
              >
                <svg className="w-7 h-7 text-neon-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </motion.div>
              <h3 className="text-2xl font-display font-bold text-white mb-3">AI-Powered Insights</h3>
              <p className="text-white/70 leading-relaxed">
                Get intelligent recommendations based on your business goals and market trends.
              </p>
            </GlassCard>
            
            <GlassCard variant="default" hover className="p-8 group">
              <motion.div 
                className="w-14 h-14 bg-neon-amber-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:shadow-neon-amber transition-shadow duration-300"
                whileHover={{ scale: 1.05, rotate: -5 }}
              >
                <svg className="w-7 h-7 text-neon-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </motion.div>
              <h3 className="text-2xl font-display font-bold text-white mb-3">Smart Scheduling</h3>
              <p className="text-white/70 leading-relaxed">
                Seamlessly integrate with your calendar. Book demos, meetings, and follow-ups effortlessly.
              </p>
            </GlassCard>
            
            <GlassCard variant="default" hover className="p-8 group">
              <motion.div 
                className="w-14 h-14 bg-neon-green-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:shadow-neon-green transition-shadow duration-300"
                whileHover={{ scale: 1.05, rotate: 5 }}
              >
                <svg className="w-7 h-7 text-neon-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </motion.div>
              <h3 className="text-2xl font-display font-bold text-white mb-3">Accountability System</h3>
              <p className="text-white/70 leading-relaxed">
                Stay on track with daily check-ins and progress tracking that keeps you accountable.
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Q&A Flip Card Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-os-dark to-os-dark-900" />
        <div className="absolute top-0 left-1/2 w-[1000px] h-[1000px] -translate-x-1/2 bg-radial-green opacity-10 blur-3xl" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              Frequently Asked <NeonText variant="green" glow>Questions</NeonText>
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Click or hover on any card to reveal the answer
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                question: "How does GreenLine365 work?",
                answer: "GreenLine365 is an AI-powered operating system that connects your business with the local economy through automated scheduling, reputation management, and smart marketing tools."
              },
              {
                question: "What makes you different?",
                answer: "Unlike generic CRMs, we're built specifically for local businesses. Our AI understands local markets and optimizes for real-world foot traffic and community engagement."
              },
              {
                question: "How quickly can I get started?",
                answer: "Most businesses are fully onboarded within 24 hours. Our AI handles the heavy lifting - you just need to connect your calendar and social accounts."
              },
              {
                question: "Do you integrate with my tools?",
                answer: "Yes! We integrate with Google Calendar, Facebook, Instagram, Yelp, and 50+ other platforms. If you use it, we connect to it."
              },
              {
                question: "What's the ROI?",
                answer: "Our customers see an average 40% increase in lead conversion within the first 60 days. Most pay back their investment in the first month."
              },
              {
                question: "Is there a contract?",
                answer: "No long-term contracts. Pay monthly and cancel anytime. We're confident you'll love it, so we don't lock you in."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flip-card-container h-64"
                style={{ perspective: '1000px' }}
              >
                <motion.div
                  className="flip-card relative w-full h-full"
                  whileHover={{ rotateY: 180 }}
                  transition={{ duration: 0.6 }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Front of Card */}
                  <div 
                    className="flip-card-front absolute inset-0 glass-strong rounded-2xl p-6 flex items-center justify-center border border-neon-green-500/20"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-neon-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-neon-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-display font-bold text-white">
                        {faq.question}
                      </h3>
                    </div>
                  </div>
                  
                  {/* Back of Card */}
                  <div 
                    className="flip-card-back absolute inset-0 glass-green rounded-2xl p-6 flex items-center justify-center border border-neon-green-500/30"
                    style={{ 
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)'
                    }}
                  >
                    <div>
                      <p className="text-white/80 leading-relaxed text-sm">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Calendar Section - Redesigned */}
      <section className="py-24 px-6 relative overflow-hidden" id="booking">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-os-dark via-os-dark-800 to-os-dark" />
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-radial-green opacity-10 blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-radial-teal opacity-10 blur-3xl" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-5 gap-8 items-stretch">
            {/* Left Sidebar - Value Proposition */}
            <div className="lg:col-span-2 glass-strong rounded-2xl p-8 md:p-10 flex flex-col justify-between">
              {/* Logo/Brand Section */}
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-lg bg-neon-green-500/20 border border-neon-green-500/50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-neon-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-display font-bold text-white">
                      <span className="text-white">GreenLine</span>
                      <span className="text-neon-green-500">365</span>
                    </div>
                    <div className="text-xs text-white/40 uppercase tracking-wider">Business OS</div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <span className="text-xs text-neon-green-500 font-semibold tracking-wider uppercase">
                    Automated Sales
                  </span>
                </div>
                
                {/* Main Headline */}
                <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 leading-tight">
                  <span className="text-white block">Stop Losing</span>
                  <NeonText variant="green" glow className="block">
                    Revenue.
                  </NeonText>
                </h2>
                
                <p className="text-white/70 text-lg mb-8 leading-relaxed">
                  Turn missed calls into closed deals with AI-powered scheduling that works 24/7. 
                  Never lose another customer to a busy signal.
                </p>
                
                {/* Feature List */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-neon-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-neon-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-white/80">Increase lead conversion by 40%</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-neon-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-neon-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-white/80">Zero missed calls, 24/7/365</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-neon-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-neon-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-white/80">Integrates with your calendar</span>
                  </div>
                </div>
              </div>
              
              {/* Social Proof */}
              <div className="pt-8 border-t border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-neon-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-white/60 text-sm">Trusted by 500+ businesses</p>
              </div>
            </div>
            
            {/* Right Side - Booking Form */}
            <div className="lg:col-span-3 glass rounded-2xl p-8 md:p-10">
              <div className="mb-8">
                <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-3">
                  Book Your Strategy Session
                </h3>
                <p className="text-white/60">
                  Complete our quick form and we&apos;ll schedule a personalized demo for your business.
                </p>
              </div>
              
              <MultiStepBookingForm />
            </div>
          </div>
        </div>
      </section>

      {/* Products Section - Booking Widget */}
      <section className="py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Our Products</h2>
            <p className="text-gray-300">White-label solutions you can integrate into your own business</p>
          </div>

          {/* Booking Widget Product */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 glass-green border border-neon-green-500/30 rounded-full mb-4">
                <span className="text-xs text-neon-green-500 font-semibold tracking-wider uppercase">Product #1</span>
              </div>
              <h3 className="text-3xl font-display font-bold text-white mb-4">Universal Booking Widget</h3>
              <p className="text-white/70 mb-6 leading-relaxed">
                Our embeddable booking widget can be added to any website. Perfect for businesses 
                that want to offer seamless scheduling to their customers.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-white/80">
                  <svg className="w-5 h-5 text-neon-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Customizable colors to match your brand
                </li>
                <li className="flex items-center gap-3 text-white/80">
                  <svg className="w-5 h-5 text-neon-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Integrates with Google Calendar, Cal.com, and more
                </li>
                <li className="flex items-center gap-3 text-white/80">
                  <svg className="w-5 h-5 text-neon-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Track bookings from multiple sources
                </li>
                <li className="flex items-center gap-3 text-white/80">
                  <svg className="w-5 h-5 text-neon-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  White-label solution for agencies
                </li>
              </ul>
              <Button
                variant="primary"
                onClick={() => setShowWidget(true)}
              >
                Try the Widget
              </Button>
            </div>
            
            <GlassCard variant="strong" className="p-8">
              <h4 className="text-xl font-display font-bold text-white mb-6 text-center">Quick Book Demo</h4>
              <BookingWidget source="landing-page-demo" />
            </GlassCard>
          </div>

          {/* Chat Widget Product */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 shadow-xl">
                <div className="p-5 border-b border-emerald-500/10 bg-black/30 rounded-t-xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[10px] tracking-[0.35em] uppercase font-semibold text-emerald-300/80">
                        PROTOCOL: ACTIVE ASSISTANT
                      </div>
                      <div className="mt-1 text-xl font-black text-white">Command Center</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400/90" />
                      <span className="w-2 h-2 rounded-full bg-emerald-400/50" />
                      <span className="w-2 h-2 rounded-full bg-emerald-400/25" />
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="rounded-2xl p-4 bg-white/5 border border-white/10 text-white/90">
                    <div className="text-sm font-semibold">System Online.</div>
                    <div className="text-sm text-white/80 mt-1">How can I help you today?</div>
                  </div>
                  <div className="flex justify-end">
                    <div className="max-w-[78%] rounded-2xl rounded-br-md px-4 py-3 text-sm text-black bg-emerald-400">
                      Tell me about your services
                    </div>
                  </div>
                  <div className="max-w-[78%] rounded-2xl rounded-bl-md px-4 py-3 text-sm text-white/90 bg-white/5 border border-white/10">
                    We offer AI-powered planning, booking solutions, and 24/7 customer support...
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full mb-4">
                <span className="text-xs text-purple-300 font-semibold">PRODUCT #2</span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">AI Chat Widget</h3>
              <p className="text-gray-300 mb-6">
                Intelligent conversational AI that can be embedded on any website. Provide instant 
                support and capture leads while you sleep.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-gray-200">
                  <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Powered by advanced AI (GPT-4, Claude, etc.)
                </li>
                <li className="flex items-center gap-3 text-gray-200">
                  <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Train on your own content and FAQs
                </li>
                <li className="flex items-center gap-3 text-gray-200">
                  <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Lead capture and CRM integration
                </li>
                <li className="flex items-center gap-3 text-gray-200">
                  <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  24/7 automated customer support
                </li>
              </ul>
              <p className="text-emerald-400 text-sm font-medium">Try it now → Click the chat bubble in the bottom right corner</p>
            </div>
          </div>
        </div>
      </section>

      {/* Full Form Modal */}
      {showFullForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900/95 border border-gray-700 rounded-3xl p-8">
            <button
              onClick={() => setShowFullForm(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Schedule Your Demo</h2>
            <MultiStepBookingForm />
          </div>
        </div>
      )}

      {/* Widget Modal */}
      {showWidget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-xl">
            <button
              onClick={() => setShowWidget(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Quick Book</h3>
            <BookingWidget 
              source="quick-book-modal" 
              onBookingComplete={() => {
                setTimeout(() => setShowWidget(false), 2000);
              }}
            />
          </div>
        </div>
      )}
    </main>
  );
}

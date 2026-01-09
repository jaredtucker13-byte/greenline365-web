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
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center p-8 text-center overflow-hidden">
        {/* Animated Background Elements */}
        <motion.div 
          className="absolute top-1/4 -left-20 w-96 h-96 bg-radial-green opacity-30 blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
        <motion.div 
          className="absolute bottom-1/4 -right-20 w-96 h-96 bg-radial-teal opacity-20 blur-3xl"
          animate={{ 
            scale: [1, 1.3, 1],
            x: [0, -50, 0],
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1
          }}
        />
        
        <div className="relative z-10 max-w-5xl">
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
              Now accepting early access signups
            </span>
          </motion.div>
          
          {/* Main Headline with Animation */}
          <motion.h1 
            className="text-5xl md:text-7xl lg:text-8xl font-display font-bold mb-6 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <span className="text-white block">Your Daily</span>
            <NeonText variant="gradient" glow className="block mt-2">
              AI Planning Partner
            </NeonText>
          </motion.h1>
          
          {/* Subheadline */}
          <motion.p 
            className="text-xl md:text-2xl text-white/70 mb-12 max-w-3xl mx-auto leading-relaxed font-body"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Stop guessing, start growing. GreenLine365 is your AI-assisted planning 
            and accountability partner that helps you <span className="text-neon-green-500 font-semibold">dominate your market</span>.
          </motion.p>
          
          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row justify-center gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            <Button
              variant="primary"
              size="lg"
              onClick={() => setShowFullForm(true)}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              }
            >
              Schedule Your Demo
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setShowWidget(true)}
            >
              Quick Book
            </Button>
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
                className="w-14 h-14 bg-neon-teal-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:shadow-neon-teal transition-shadow duration-300"
                whileHover={{ scale: 1.05, rotate: -5 }}
              >
                <svg className="w-7 h-7 text-neon-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

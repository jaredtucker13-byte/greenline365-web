'use client';

import { motion } from 'framer-motion';

const steps = [
  {
    number: '01',
    title: 'Book Your Demo',
    description: 'Schedule a personalized demo call with our team. We\'ll learn about your business and show you how GreenLine365 can help.',
    icon: '📅',
  },
  {
    number: '02',
    title: 'Get Customized Setup',
    description: 'We configure your Command Center with your branding, industry settings, and connect your existing tools.',
    icon: '⚙️',
  },
  {
    number: '03',
    title: 'Launch & Train',
    description: 'Go live with your AI Companion. Our team provides hands-on training to ensure you get the most out of the platform.',
    icon: '🚀',
  },
  {
    number: '04',
    title: 'Grow & Scale',
    description: 'Watch your business transform with AI-powered insights, automated scheduling, and intelligent lead management.',
    icon: '📈',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="pt-24 py-12">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-white mb-6"
          >
            How <span className="text-emerald-400">GreenLine365</span> Works
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-white/60 max-w-2xl mx-auto"
          >
            From demo to deployment in days, not months. Here's how we transform your business operations.
          </motion.p>
        </div>

        {/* Steps */}
        <div className="space-y-12">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.15 }}
              className={`flex flex-col md:flex-row items-center gap-8 ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
            >
              <div className="flex-1">
                <div className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-white/10 rounded-2xl p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-4xl">{step.icon}</span>
                    <span className="text-emerald-400 font-mono text-sm">STEP {step.number}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-white/60">{step.description}</p>
                </div>
              </div>
              <div className="hidden md:flex w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 items-center justify-center">
                <span className="text-emerald-400 font-bold text-2xl">{step.number}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-16"
        >
          <a
            href="/demo-calendar"
            className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition"
          >
            Get Started Today
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </motion.div>
      </div>
    </div>
  );
}

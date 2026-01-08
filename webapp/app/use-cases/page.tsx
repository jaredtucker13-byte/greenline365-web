'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const useCases = [
  {
    industry: 'Restaurants & Cafes',
    icon: '🍽️',
    color: '#FF6B35',
    challenges: ['Managing reservations', 'Social media consistency', 'Local event promotions'],
    solutions: ['Automated booking system', 'AI content scheduler', 'Local Pulse trend alerts'],
    result: '40% increase in repeat customers',
  },
  {
    industry: 'Auto Dealerships',
    icon: '🚗',
    color: '#00D4FF',
    challenges: ['Lead follow-up delays', 'Inventory updates', 'Service appointment scheduling'],
    solutions: ['Instant lead alerts', 'Automated inventory posts', 'Smart scheduling system'],
    result: '25% faster lead response time',
  },
  {
    industry: 'Medical Spas',
    icon: '💆',
    color: '#E91E8C',
    challenges: ['Appointment no-shows', 'Treatment promotions', 'Client retention'],
    solutions: ['Automated reminders', 'Targeted email campaigns', 'Loyalty tracking'],
    result: '35% reduction in no-shows',
  },
  {
    industry: 'Fitness Centers',
    icon: '💪',
    color: '#FFD700',
    challenges: ['Class scheduling', 'Member engagement', 'Seasonal promotions'],
    solutions: ['Dynamic class calendar', 'Engagement automation', 'Event-based marketing'],
    result: '50% boost in class attendance',
  },
  {
    industry: 'Real Estate',
    icon: '🏠',
    color: '#4A90D9',
    challenges: ['Listing management', 'Open house coordination', 'Client communication'],
    solutions: ['Listing autopilot', 'Event scheduling', 'CRM integration'],
    result: '3x more qualified leads',
  },
  {
    industry: 'Professional Services',
    icon: '💼',
    color: '#9B59B6',
    challenges: ['Client scheduling', 'Content marketing', 'Lead qualification'],
    solutions: ['Smart calendar sync', 'AI content creation', 'Lead scoring'],
    result: '60% time saved on admin tasks',
  },
];

export default function UseCasesPage() {
  return (
    <div className="py-12">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-white mb-6"
          >
            Use Cases by <span className="text-emerald-400">Industry</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-white/60 max-w-2xl mx-auto"
          >
            See how businesses like yours are using GreenLine365 to streamline operations and grow.
          </motion.p>
        </div>

        {/* Use Cases Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((useCase, index) => (
            <motion.div
              key={useCase.industry}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: `${useCase.color}20` }}
                >
                  {useCase.icon}
                </div>
                <h3 className="text-lg font-bold text-white">{useCase.industry}</h3>
              </div>

              <div className="mb-4">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Challenges</p>
                <ul className="space-y-1">
                  {useCase.challenges.map((challenge) => (
                    <li key={challenge} className="text-sm text-white/60 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-red-400" />
                      {challenge}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-4">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Solutions</p>
                <ul className="space-y-1">
                  {useCase.solutions.map((solution) => (
                    <li key={solution} className="text-sm text-white/60 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-emerald-400" />
                      {solution}
                    </li>
                  ))}
                </ul>
              </div>

              <div 
                className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2"
                style={{ color: useCase.color }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="font-semibold text-sm">{useCase.result}</span>
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
          <p className="text-white/60 mb-6">Don't see your industry? We customize for any business.</p>
          <Link
            href="/demo-calendar"
            className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition"
          >
            Book Your Custom Demo
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useEffect, useState } from 'react';

interface StickyPhase {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const phases: StickyPhase[] = [
  {
    number: '01',
    title: 'Discovery & Setup',
    description: 'We analyze your business, identify your ideal customers, and configure your AI-powered system to find opportunities in the dark funnel.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    color: '#00FF00'
  },
  {
    number: '02',
    title: 'AI Signal Detection',
    description: 'Our AI agents continuously scan social media, forums, and online communities to identify high-intent prospects showing buying signals.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    color: '#00FFAA'
  },
  {
    number: '03',
    title: 'Automated Outreach',
    description: 'Smart, personalized messages are sent at the perfect moment when prospects are most receptive, increasing response rates by 40%.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    color: '#00FFD4'
  },
  {
    number: '04',
    title: 'Conversion & Growth',
    description: 'Watch your pipeline fill with qualified leads as our system books meetings, nurtures prospects, and turns conversations into revenue.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    color: '#00FFFF'
  }
];

export default function StickyProcessSection() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-os-dark via-os-dark-900 to-os-dark" />
      
      {/* Animated Grid */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px'
        }}
      />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-display font-bold text-white mb-6">
            How the <span className="text-gradient-green glow-text">System</span> Works
          </h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Four seamless phases that transform your business into a lead-generating machine
          </p>
        </motion.div>
        
        {/* Sticky Cards */}
        <div className="space-y-8">
          {phases.map((phase, index) => (
            <StickyPhaseCard key={index} phase={phase} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StickyPhaseCard({ phase, index }: { phase: StickyPhase; index: number }) {
  const [ref, inView] = useInView({
    threshold: 0.3,
    triggerOnce: true
  });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 80 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: index * 0.2 }}
      className="sticky top-24"
      style={{
        zIndex: 10 + index
      }}
    >
      <div 
        className="glass-strong rounded-[2.5rem] p-8 md:p-12 border border-white/10 relative overflow-hidden group"
        style={{
          transform: `translateY(${index * 20}px)`
        }}
      >
        {/* Glow Effect */}
        <div 
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-700"
          style={{ background: phase.color }}
        />
        
        {/* Content Grid */}
        <div className="grid md:grid-cols-12 gap-8 items-center relative z-10">
          {/* Left: Number & Icon */}
          <div className="md:col-span-3 flex flex-col items-center md:items-start gap-4">
            <motion.div
              className="text-8xl font-display font-black opacity-10"
              style={{ color: phase.color }}
            >
              {phase.number}
            </motion.div>
            <motion.div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ 
                backgroundColor: `${phase.color}20`,
                borderColor: `${phase.color}40`,
                borderWidth: '1px'
              }}
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <div style={{ color: phase.color }}>
                {phase.icon}
              </div>
            </motion.div>
          </div>
          
          {/* Right: Content */}
          <div className="md:col-span-9">
            <h3 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
              {phase.title}
            </h3>
            <p className="text-lg text-white/70 leading-relaxed">
              {phase.description}
            </p>
            
            {/* Decorative Line */}
            <motion.div 
              className="h-1 mt-6 rounded-full"
              style={{ 
                background: `linear-gradient(to right, ${phase.color}, transparent)`
              }}
              initial={{ width: 0 }}
              animate={inView ? { width: '100%' } : {}}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
        </div>
        
        {/* Phase Connection Line */}
        {index < phases.length - 1 && (
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-0.5 h-16 bg-gradient-to-b from-white/20 to-transparent" />
        )}
      </div>
    </motion.div>
  );
}

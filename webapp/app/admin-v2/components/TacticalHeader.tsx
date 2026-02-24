'use client';

/**
 * TacticalHeader Component - Glassmorphism Edition
 * GreenLine365 Admin V2 - Nature Glass Design
 */

import { motion } from 'framer-motion';
import { BusinessSwitcher } from './BusinessSwitcher';
import NotificationBell from '@/app/components/NotificationBell';

interface HeaderProps {
  title: string;
  subtitle: string;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
  viewMode: 'month' | 'week';
  onViewChange: (mode: 'month' | 'week') => void;
}

export default function TacticalHeader({ 
  title, 
  subtitle, 
  onToday, 
  onPrev, 
  onNext, 
  viewMode, 
  onViewChange 
}: HeaderProps) {
  return (
    <header className="h-20 backdrop-blur-2xl bg-black/30 border-b border-white/10 flex items-center justify-between px-8 sticky top-0 z-30">
      {/* Left: Title & Business Switcher */}
      <div className="flex items-center gap-6">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl font-light text-white tracking-tight"
          >
            {title}
          </motion.h1>
          <p className="text-xs tracking-widest text-white/40 font-medium mt-0.5">{subtitle}</p>
        </div>
        
        {/* Business Switcher */}
        <div className="ml-4">
          <BusinessSwitcher />
        </div>
      </div>

      {/* Center: Navigation */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onPrev}
            className="w-10 h-10 rounded-xl backdrop-blur-xl bg-white/[0.08] border border-white/[0.15] hover:bg-white/[0.15] flex items-center justify-center text-white/60 hover:text-white transition-all duration-300"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onNext}
            className="w-10 h-10 rounded-xl backdrop-blur-xl bg-white/[0.08] border border-white/[0.15] hover:bg-white/[0.15] flex items-center justify-center text-white/60 hover:text-white transition-all duration-300"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onToday}
          className="px-5 py-2.5 rounded-xl bg-[#84A98C]/20 border border-[#84A98C]/40 text-[#A7C957] text-sm font-medium hover:bg-[#84A98C]/30 transition-all duration-300 shadow-[0_0_20px_rgba(132,169,140,0.2)]"
        >
          Today
        </motion.button>

        <div className="flex items-center rounded-xl border border-white/[0.15] overflow-hidden backdrop-blur-xl bg-white/[0.05]">
          <button
            onClick={() => onViewChange('month')}
            className={`px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
              viewMode === 'month'
                ? 'bg-[#84A98C] text-white shadow-[0_0_15px_rgba(132,169,140,0.4)]'
                : 'text-white/50 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => onViewChange('week')}
            className={`px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
              viewMode === 'week'
                ? 'bg-[#84A98C] text-white shadow-[0_0_15px_rgba(132,169,140,0.4)]'
                : 'text-white/50 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            Week
          </button>
        </div>
      </div>

      {/* Right: User & Notifications */}
      <div className="flex items-center gap-4">
        <NotificationBell variant="tactical" />

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#84A98C] to-[#52796F] flex items-center justify-center text-white font-semibold text-sm shadow-[0_0_20px_rgba(132,169,140,0.3)]"
        >
          GL
        </motion.button>
      </div>
    </header>
  );
}

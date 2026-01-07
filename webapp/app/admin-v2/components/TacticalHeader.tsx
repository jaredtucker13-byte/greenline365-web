'use client';

/**
 * TacticalHeader Component
 * GreenLine365 Admin V2 - Tactical Multi-Command Center
 * 
 * Features:
 * - Application title with tactical styling
 * - Navigation controls (back/forward, today, view toggle)
 * - User profile and notifications
 */

import { motion } from 'framer-motion';

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
    <header className="h-16 bg-[#1A1A1A]/80 backdrop-blur-xl border-b border-[#39FF14]/20 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left: Title */}
      <div className="flex items-center gap-6">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-lg font-bold text-white tracking-wide"
          >
            {title}
          </motion.h1>
          <p className="text-[10px] tracking-[0.2em] text-[#39FF14]/70 font-mono">{subtitle}</p>
        </div>
      </div>

      {/* Center: Navigation */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onPrev}
            className="w-8 h-8 rounded-lg bg-[#1E262E] border border-[#2D3748] hover:border-[#39FF14]/30 flex items-center justify-center text-gray-400 hover:text-white transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onNext}
            className="w-8 h-8 rounded-lg bg-[#1E262E] border border-[#2D3748] hover:border-[#39FF14]/30 flex items-center justify-center text-gray-400 hover:text-white transition"
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
          className="px-4 py-1.5 rounded-lg bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14] text-sm font-medium hover:bg-[#39FF14]/20 transition"
        >
          Today
        </motion.button>

        <div className="flex items-center rounded-lg border border-[#2D3748] overflow-hidden">
          <button
            onClick={() => onViewChange('month')}
            className={`px-3 py-1.5 text-sm font-medium transition ${
              viewMode === 'month'
                ? 'bg-[#39FF14] text-black'
                : 'bg-[#1E262E] text-gray-400 hover:text-white'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => onViewChange('week')}
            className={`px-3 py-1.5 text-sm font-medium transition ${
              viewMode === 'week'
                ? 'bg-[#39FF14] text-black'
                : 'bg-[#1E262E] text-gray-400 hover:text-white'
            }`}
          >
            Week
          </button>
        </div>
      </div>

      {/* Right: User & Notifications */}
      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="relative w-9 h-9 rounded-lg bg-[#1E262E] border border-[#2D3748] hover:border-[#39FF14]/30 flex items-center justify-center text-gray-400 hover:text-white transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF3B3B] rounded-full text-[10px] text-white flex items-center justify-center font-bold">3</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#39FF14] to-[#0CE293] flex items-center justify-center text-black font-bold text-sm"
        >
          GL
        </motion.button>
      </div>
    </header>
  );
}

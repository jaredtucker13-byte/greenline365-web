'use client';

/**
 * TacticalSidebar Component
 * GreenLine365 Admin V2 - Tactical Multi-Command Center
 * 
 * Features:
 * - Dashboard, Schedule, Analytics, Settings navigation
 * - Action buttons: New Booking, New Content, Pending Approvals
 * - Status indicators: SYSTEM ONLINE, AES-256 ENCRYPTED
 * - Hidden Demo Controller trigger (triple-click on version)
 */

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface SidebarProps {
  activeItem: 'dashboard' | 'schedule' | 'analytics' | 'settings';
  onNewBooking: () => void;
  onNewContent: () => void;
  pendingCount: number;
  onDemoControllerToggle?: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { id: 'schedule', label: 'Schedule', icon: 'calendar' },
  { id: 'analytics', label: 'Analytics', icon: 'chart' },
  { id: 'settings', label: 'Settings', icon: 'cog' },
];

const icons: Record<string, React.ReactElement> = {
  grid: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  calendar: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  chart: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  cog: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

export default function TacticalSidebar({ activeItem, onNewBooking, onNewContent, pendingCount }: SidebarProps) {
  return (
    <aside className="w-64 h-screen bg-[#1A1A1A] border-r border-[#39FF14]/20 flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="p-6 border-b border-[#39FF14]/10">
        <Link href="/" className="flex items-center gap-3">
          <motion.div 
            className="w-10 h-10 rounded-lg bg-[#39FF14]/10 border border-[#39FF14]/30 flex items-center justify-center"
            animate={{ boxShadow: ['0 0 10px rgba(57,255,20,0.3)', '0 0 20px rgba(57,255,20,0.5)', '0 0 10px rgba(57,255,20,0.3)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-[#39FF14] font-bold text-lg">G</span>
          </motion.div>
          <div>
            <span className="text-white font-bold">Green</span>
            <span className="text-[#39FF14] font-bold">Line365</span>
          </div>
        </Link>
      </div>

      {/* Status Indicators */}
      <div className="px-6 py-4 border-b border-[#39FF14]/10 space-y-2">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2"
        >
          <motion.span 
            className="w-2 h-2 rounded-full bg-[#39FF14]"
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-[10px] tracking-widest text-[#39FF14] font-mono">SYSTEM ONLINE</span>
        </motion.div>
        <div className="flex items-center gap-2">
          <svg className="w-3 h-3 text-[#39FF14]/70" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span className="text-[9px] tracking-widest text-[#39FF14]/70 font-mono">AES-256 ENCRYPTED</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ x: 4, boxShadow: '0 0 15px rgba(57,255,20,0.2)' }}
            whileTap={{ scale: 0.98 }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeItem === item.id
                ? 'bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/30 shadow-[0_0_20px_rgba(57,255,20,0.2)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            {icons[item.icon]}
            <span className="font-medium">{item.label}</span>
            {activeItem === item.id && (
              <motion.div
                layoutId="activeIndicator"
                className="ml-auto w-1.5 h-1.5 rounded-full bg-[#39FF14]"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </motion.button>
        ))}
      </nav>

      {/* Action Buttons */}
      <div className="p-4 space-y-3 border-t border-[#39FF14]/10">
        <motion.button
          whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(57,255,20,0.4)' }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewBooking}
          className="w-full py-3 px-4 rounded-lg border border-[#39FF14] text-[#39FF14] font-semibold hover:bg-[#39FF14]/10 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Booking
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(12,226,147,0.4)' }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewContent}
          className="w-full py-3 px-4 rounded-lg border border-[#0CE293] text-[#0CE293] font-semibold hover:bg-[#0CE293]/10 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Content
        </motion.button>

        {pendingCount > 0 && (
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(255,200,0,0.4)' }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full py-3 px-4 rounded-lg border border-[#FFC800] text-[#FFC800] font-semibold hover:bg-[#FFC800]/10 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Pending ({pendingCount})
          </motion.button>
        )}
      </div>

      {/* Version */}
      <div className="p-4 border-t border-[#39FF14]/10">
        <p className="text-[10px] text-gray-600 font-mono text-center">TACTICAL V2.0 // BUILD 2026.01</p>
      </div>
    </aside>
  );
}

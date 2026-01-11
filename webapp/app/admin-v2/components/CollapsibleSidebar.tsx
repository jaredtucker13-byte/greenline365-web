'use client';

/**
 * CollapsibleSidebar Component
 * GreenLine365 Admin V2 - Tactical Multi-Command Center
 * 
 * Features:
 * - Collapsible: Desktop shows icons-only when collapsed (Slack-style)
 * - Mobile: Fully hidden with hamburger toggle
 * - Dashboard, Schedule, Analytics, Settings, Content navigation
 * - Action buttons: New Booking, New Content, Pending Approvals
 * - Status indicators: SYSTEM ONLINE, AES-256 ENCRYPTED
 * - Hidden Demo Controller trigger (triple-click on version)
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface SidebarProps {
  activeItem: 'dashboard' | 'schedule' | 'analytics' | 'settings' | 'content';
  onNewBooking: () => void;
  onNewContent: () => void;
  pendingCount: number;
  onDemoControllerToggle?: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onMobileToggle: () => void;
  isPreviewMode?: boolean;
  onPreviewModeToggle?: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid', href: '/admin-v2' },
  { id: 'schedule', label: 'Schedule', icon: 'calendar', href: '/admin-v2?view=schedule' },
  { id: 'email', label: 'Email', icon: 'mail', href: '/admin-v2/email' },
  { id: 'sms', label: 'SMS', icon: 'phone', href: '/admin-v2/sms' },
  { id: 'analytics', label: 'Analytics', icon: 'chart', href: '/admin-v2?view=analytics' },
  { id: 'content', label: 'Content', icon: 'edit', href: '/admin/content' },
  { id: 'settings', label: 'Settings', icon: 'cog', href: '/admin-v2?view=settings' },
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
  mail: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  chart: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  edit: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  cog: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

export default function CollapsibleSidebar({ 
  activeItem, 
  onNewBooking, 
  onNewContent, 
  pendingCount, 
  onDemoControllerToggle,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onMobileToggle,
  isPreviewMode,
  onPreviewModeToggle,
}: SidebarProps) {
  // Triple-click handler for hidden Demo Controller
  const [clickCount, setClickCount] = useState(0);
  const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null);

  const handleVersionClick = useCallback(() => {
    if (clickTimer) {
      clearTimeout(clickTimer);
    }

    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount >= 3) {
      setClickCount(0);
      onDemoControllerToggle?.();
    } else {
      const timer = setTimeout(() => {
        setClickCount(0);
      }, 500);
      setClickTimer(timer);
    }
  }, [clickCount, clickTimer, onDemoControllerToggle]);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header / Logo */}
      <div className={`p-4 border-b border-[#39FF14]/10 ${isCollapsed ? 'px-2' : ''}`}>
        <div className="flex items-center justify-between">
          <Link href="/" className={`flex items-center gap-2 ${isCollapsed ? 'justify-center w-full' : ''}`}>
            <div className="w-8 h-8 rounded-lg bg-[#39FF14] flex items-center justify-center">
              <span className="text-black font-bold text-sm">G</span>
            </div>
            {!isCollapsed && (
              <span className="text-white font-bold">GreenLine365</span>
            )}
          </Link>
          {/* Desktop collapse toggle */}
          <button
            onClick={onToggleCollapse}
            className={`hidden lg:flex w-6 h-6 rounded items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition ${isCollapsed ? 'absolute right-2 top-4' : ''}`}
          >
            <svg className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition group ${
              activeItem === item.id
                ? 'bg-[#39FF14]/10 text-[#39FF14]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            } ${isCollapsed ? 'justify-center px-2' : ''}`}
            title={isCollapsed ? item.label : undefined}
          >
            <span className={activeItem === item.id ? 'text-[#39FF14]' : 'text-white/50 group-hover:text-white/80'}>
              {icons[item.icon]}
            </span>
            {!isCollapsed && (
              <span className="text-sm font-medium">{item.label}</span>
            )}
          </Link>
        ))}
      </nav>

      {/* Action Buttons */}
      {!isCollapsed && (
        <div className="p-4 border-t border-[#39FF14]/10 space-y-2">
          <button
            onClick={onNewBooking}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#39FF14] text-black rounded-lg font-medium text-sm hover:bg-[#39FF14]/90 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Booking
          </button>
          <button
            onClick={onNewContent}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 text-white rounded-lg font-medium text-sm hover:bg-white/20 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Content
          </button>
          {pendingCount > 0 && (
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500/10 text-amber-400 rounded-lg font-medium text-sm hover:bg-amber-500/20 transition">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Pending ({pendingCount})
            </button>
          )}
          
          {/* Preview Mode Toggle */}
          <button
            onClick={onPreviewModeToggle}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition ${
              isPreviewMode 
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30'
                : 'bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {isPreviewMode ? 'Exit Preview' : 'Preview as Customer'}
          </button>
        </div>
      )}

      {/* Collapsed Action Icons */}
      {isCollapsed && (
        <div className="p-2 border-t border-[#39FF14]/10 space-y-2">
          <button
            onClick={onNewBooking}
            className="w-full flex items-center justify-center p-2.5 bg-[#39FF14] text-black rounded-lg hover:bg-[#39FF14]/90 transition"
            title="New Booking"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={onNewContent}
            className="w-full flex items-center justify-center p-2.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
            title="New Content"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
      )}

      {/* Status Footer */}
      <div className={`p-4 border-t border-[#39FF14]/10 ${isCollapsed ? 'p-2' : ''}`}>
        {!isCollapsed && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse" />
              <span className="text-[10px] text-[#39FF14] font-mono uppercase tracking-wider">System Online</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-3 h-3 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-[10px] text-white/30 font-mono">AES-256 ENCRYPTED</span>
            </div>
          </>
        )}

        {/* Version - Triple click to open Demo Controller */}
        <motion.p 
          onClick={handleVersionClick}
          whileHover={{ color: '#39FF14' }}
          className={`text-[10px] text-gray-600 font-mono text-center cursor-pointer select-none transition-colors mt-3 ${isCollapsed ? 'mt-2' : ''}`}
          title="Triple-click for Demo Mode"
        >
          {isCollapsed ? 'V2.0' : 'TACTICAL V2.0 // BUILD 2026.01'}
        </motion.p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={onMobileToggle}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-lg bg-[#1A1A1A] border border-[#39FF14]/30 flex items-center justify-center text-white"
      >
        {isMobileOpen ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/60 z-40"
            onClick={onMobileToggle}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="lg:hidden fixed left-0 top-0 bottom-0 w-[280px] bg-[#0D0D0D] border-r border-[#39FF14]/10 z-50"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 72 : 280 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="hidden lg:flex flex-col bg-[#0D0D0D] border-r border-[#39FF14]/10 h-screen sticky top-0"
      >
        {sidebarContent}
      </motion.aside>
    </>
  );
}

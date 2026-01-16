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

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBusiness } from '@/lib/business';
import { Lock } from 'lucide-react';
interface SidebarProps {
  activeItem: string; // Dynamic - matches nav item IDs
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
  { id: 'dashboard', label: 'Dashboard', icon: 'grid', href: '/admin-v2', feature: null },
  { id: 'schedule', label: 'Schedule', icon: 'calendar', href: '/admin-v2?view=schedule', feature: 'calendar' },
  { id: 'creative-studio', label: 'Creative Studio', icon: 'sparkles', href: '/admin-v2/creative-studio', feature: 'mockup_generator' },
  { id: 'blog', label: 'Blog', icon: 'edit', href: '/admin-v2/blog-polish', feature: 'blog' },
  { id: 'website-builder', label: 'Website Builder', icon: 'paint', href: '/admin-v2/website-analyzer', feature: 'mockup_generator' },
  { id: 'code-studio', label: 'Code Studio', icon: 'code', href: '/admin-v2/code-studio', feature: 'mockup_generator' },
  { id: 'incidents', label: 'Incidents', icon: 'alert', href: '/admin-v2/incidents', feature: null },
  { id: 'email', label: 'Email', icon: 'mail', href: '/admin-v2/email', feature: 'email' },
  { id: 'sms', label: 'SMS', icon: 'phone', href: '/admin-v2/sms', feature: 'sms' },
  { id: 'crm', label: 'CRM', icon: 'users', href: '/admin-v2/crm-dashboard', feature: 'crm' },
  { id: 'analytics', label: 'Analytics', icon: 'chart', href: '/admin-v2/analytics', feature: 'analytics' },
  { id: 'access-codes', label: 'Access Codes', icon: 'ticket', href: '/admin-v2/access-codes', feature: null, adminOnly: true },
  { id: 'brand-voice', label: 'Brand Voice', icon: 'voice', href: '/admin-v2/brand-voice', feature: 'knowledge_base' },
  { id: 'knowledge', label: 'Knowledge Base', icon: 'database', href: '/admin-v2/knowledge', feature: 'knowledge_base' },
  { id: 'theme-settings', label: 'Theme Settings', icon: 'palette', href: '/admin-v2/theme-settings', feature: null, whiteLabelOnly: true },
  { id: 'audit', label: 'Audit Logs', icon: 'shield', href: '/admin-v2/audit', feature: null, adminOnly: true },
  { id: 'settings', label: 'Settings', icon: 'cog', href: '/admin-v2/settings', feature: null },
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
  phone: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
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
  paint: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
  cog: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  voice: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  ),
  database: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  ticket: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  ),
  shield: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  alert: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  code: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
  sparkles: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  palette: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
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
  const { hasFeature, isAdmin, isWhiteLabel, activeBusiness, userBusinesses, switchBusiness, isSwitchingBusiness } = useBusiness();
  
  // Filter nav items based on features
  const visibleNavItems = useMemo(() => {
    return navItems.filter(item => {
      // Admin-only items
      if ((item as any).adminOnly && !isAdmin()) {
        return false;
      }
      
      // White-label only items
      if ((item as any).whiteLabelOnly && !isWhiteLabel()) {
        return false;
      }
      
      // Feature-gated items
      if ((item as any).feature) {
        return hasFeature((item as any).feature);
      }
      
      // Always show items without feature requirements
      return true;
    });
  }, [hasFeature, isAdmin, isWhiteLabel]);
  
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
      {/* Header / Logo with Business Name */}
      <div className={`p-4 ${isCollapsed ? 'px-2' : ''}`} style={{ borderBottom: '1px solid var(--theme-glass-border)' }}>
        <div className="flex items-center justify-between">
          <Link href="/admin-v2" className={`flex items-center gap-2 ${isCollapsed ? 'justify-center w-full' : ''}`}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: activeBusiness?.is_white_label ? `linear-gradient(135deg, #8B5CF6, #EC4899)` : 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))', boxShadow: '0 0 15px var(--theme-glow)' }}>
              <span className="text-white font-bold text-sm">
                {activeBusiness?.name?.[0] || 'G'}
              </span>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span style={{ color: 'var(--theme-text-primary)' }} className="font-semibold text-sm leading-tight">
                  {activeBusiness?.name || 'GreenLine365'}
                </span>
                {activeBusiness?.is_white_label && (
                  <span className="text-[10px] text-purple-400">White-Label</span>
                )}
              </div>
            )}
          </Link>
        </div>
        
        {/* Business Switcher Dropdown - Only show if multiple businesses and not collapsed */}
        {!isCollapsed && userBusinesses.length > 1 && (
          <div className="mt-3 relative">
            <select
              value={activeBusiness?.id || ''}
              onChange={(e) => {
                if (e.target.value) {
                  switchBusiness(e.target.value);
                }
              }}
              className="w-full px-3 py-2 rounded-lg text-xs appearance-none cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              style={{ 
                background: 'var(--theme-bg-glass)', 
                border: '1px solid var(--theme-glass-border)',
                color: 'var(--theme-text-primary)'
              }}
            >
              {userBusinesses.map((ub) => (
                <option 
                  key={ub.business.id} 
                  value={ub.business.id}
                  style={{ background: '#1A1A1A', color: '#fff' }}
                >
                  {ub.business.name} {ub.business.is_white_label ? '(WL)' : ub.is_primary ? '(Primary)' : ''}
                </option>
              ))}
            </select>
            <svg 
              className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </div>
      
      {/* Collapse Toggle - Placed BELOW the header line */}
      <div className="hidden lg:flex justify-center py-2" style={{ borderBottom: '1px solid var(--theme-glass-border)' }}>
        <button
          onClick={onToggleCollapse}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:bg-white/10 active:scale-95"
          style={{ color: 'var(--theme-text-muted)', background: 'var(--theme-bg-glass)' }}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {visibleNavItems.map((item) => {
          // Use the ID to check active state instead of relying on prop
          const isCurrentActive = activeItem === item.id;
          
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group ${isCollapsed ? 'justify-center px-2' : ''}`}
              style={isCurrentActive ? {
                background: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)',
                color: 'var(--theme-accent)',
                border: '1px solid color-mix(in srgb, var(--theme-primary) 30%, transparent)',
              } : {
                color: 'var(--theme-text-secondary)',
              }}
              title={isCollapsed ? item.label : undefined}
              data-testid={`nav-${item.id}`}
            >
              <span style={{ color: isCurrentActive ? 'var(--theme-accent)' : 'var(--theme-text-muted)' }}>
                {icons[item.icon]}
              </span>
              {!isCollapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Action Buttons */}
      {!isCollapsed && (
        <div className="p-4 space-y-2" style={{ borderTop: '1px solid var(--theme-glass-border)' }}>
          <button
            onClick={onNewBooking}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-xl font-medium text-sm hover:opacity-90 transition"
            style={{ background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))', boxShadow: '0 0 20px var(--theme-glow)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Booking
          </button>
          <button
            onClick={onNewContent}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 backdrop-blur-sm rounded-xl font-medium text-sm transition"
            style={{ background: 'var(--theme-bg-glass)', color: 'var(--theme-text-primary)', border: '1px solid var(--theme-glass-border)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Content
          </button>
          {pendingCount > 0 && (
            <button 
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition"
              style={{ background: 'color-mix(in srgb, var(--theme-warning) 10%, transparent)', color: 'var(--theme-warning)', border: '1px solid color-mix(in srgb, var(--theme-warning) 20%, transparent)' }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--theme-warning)' }} />
              Pending ({pendingCount})
            </button>
          )}
          
          {/* Preview Mode Toggle */}
          <button
            onClick={onPreviewModeToggle}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition"
            style={isPreviewMode ? {
              background: 'color-mix(in srgb, var(--theme-warning) 20%, transparent)',
              color: 'var(--theme-warning)',
              border: '1px solid color-mix(in srgb, var(--theme-warning) 30%, transparent)',
            } : {
              background: 'color-mix(in srgb, #8B5CF6 10%, transparent)',
              color: '#A78BFA',
              border: '1px solid color-mix(in srgb, #8B5CF6 20%, transparent)',
            }}
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
        <div className="p-2 space-y-2" style={{ borderTop: '1px solid var(--theme-glass-border)' }}>
          <button
            onClick={onNewBooking}
            className="w-full flex items-center justify-center p-2.5 text-black rounded-lg hover:opacity-90 transition"
            style={{ background: 'var(--theme-primary)' }}
            title="New Booking"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={onNewContent}
            className="w-full flex items-center justify-center p-2.5 rounded-lg transition"
            style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-primary)' }}
            title="New Content"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
      )}

      {/* Status Footer */}
      <div className={`p-4 ${isCollapsed ? 'p-2' : ''}`} style={{ borderTop: '1px solid var(--theme-glass-border)' }}>
        {!isCollapsed && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--theme-primary)', boxShadow: '0 0 8px var(--theme-glow)' }} />
              <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--theme-accent)' }}>System Online</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-3 h-3" style={{ color: 'var(--theme-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-[10px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>AES-256 ENCRYPTED</span>
            </div>
          </>
        )}

        {/* Version - Triple click to open Demo Controller */}
        <motion.p 
          onClick={handleVersionClick}
          className={`text-[10px] font-medium text-center cursor-pointer select-none transition-colors mt-3 ${isCollapsed ? 'mt-2' : ''}`}
          style={{ color: 'var(--theme-text-muted)' }}
          title="Triple-click for Demo Mode"
        >
          {isCollapsed ? 'V2.0' : 'COMMAND CENTER V2.0'}
        </motion.p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={onMobileToggle}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-glass-border)', color: 'var(--theme-text-primary)' }}
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
            className="lg:hidden fixed left-0 top-0 bottom-0 w-[280px] backdrop-blur-2xl z-50"
            style={{ background: 'var(--theme-bg-primary)', borderRight: '1px solid var(--theme-glass-border)' }}
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
        className="hidden lg:flex flex-col backdrop-blur-2xl h-screen sticky top-0"
        style={{ background: 'var(--theme-bg-primary)', borderRight: '1px solid var(--theme-glass-border)' }}
      >
        {sidebarContent}
      </motion.aside>
    </>
  );
}

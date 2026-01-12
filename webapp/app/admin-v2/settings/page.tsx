'use client';

/**
 * Settings Page - GreenLine365 Admin V2
 * Theme selection and user preferences
 */

import { motion } from 'framer-motion';
import { useTheme, themes } from '../lib/ThemeContext';
import CollapsibleSidebar from '../components/CollapsibleSidebar';
import { useState } from 'react';

export default function SettingsPage() {
  const { currentTheme, setTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div 
      className="min-h-screen flex relative"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=2127&auto=format&fit=crop')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

      {/* Sidebar */}
      <CollapsibleSidebar
        activeItem="settings"
        onNewBooking={() => {}}
        onNewContent={() => {}}
        pendingCount={0}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={mobileMenuOpen}
        onMobileToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      {/* Main Content */}
      <div className="flex-1 min-w-0 relative z-10 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--theme-text-primary)]">Settings</h1>
          <p className="text-[var(--theme-text-secondary)] mt-2">Customize your GreenLine365 experience</p>
        </div>

        {/* Theme Selection Section */}
        <div className="backdrop-blur-2xl bg-[var(--theme-bg-glass)] rounded-3xl border border-[var(--theme-glass-border)] p-8 shadow-[0_8px_32px_0_var(--theme-shadow)]">
          <div className="flex items-center gap-3 mb-6">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))` }}
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--theme-text-primary)]">Theme Templates</h2>
              <p className="text-sm text-[var(--theme-text-muted)]">Choose a visual style for your entire dashboard</p>
            </div>
          </div>

          {/* Theme Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {themes.map((theme) => {
              const isActive = currentTheme.id === theme.id;
              
              return (
                <motion.button
                  key={theme.id}
                  onClick={() => setTheme(theme.id)}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                    isActive 
                      ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/10' 
                      : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  {/* Active Badge */}
                  {isActive && (
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-[var(--theme-primary)] text-black text-xs font-bold">
                      Active
                    </div>
                  )}

                  {/* Theme Preview */}
                  <div 
                    className="w-full h-24 rounded-xl mb-4 border border-white/10"
                    style={{ background: theme.preview }}
                  >
                    {/* Mini UI Preview */}
                    <div className="w-full h-full p-3 flex gap-2">
                      <div 
                        className="w-8 h-full rounded-lg"
                        style={{ background: theme.colors.bgSecondary, border: `1px solid ${theme.colors.glassBorder}` }}
                      />
                      <div className="flex-1 flex flex-col gap-2">
                        <div 
                          className="h-4 rounded"
                          style={{ background: theme.colors.bgSecondary, border: `1px solid ${theme.colors.glassBorder}` }}
                        />
                        <div 
                          className="flex-1 rounded-lg"
                          style={{ background: theme.colors.bgGlass, border: `1px solid ${theme.colors.glassBorder}` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Theme Info */}
                  <h3 className="text-lg font-semibold text-white mb-1">{theme.name}</h3>
                  <p className="text-sm text-white/60">{theme.description}</p>

                  {/* Color Swatches */}
                  <div className="flex gap-2 mt-4">
                    <div 
                      className="w-6 h-6 rounded-full border border-white/20"
                      style={{ background: theme.colors.primary }}
                      title="Primary"
                    />
                    <div 
                      className="w-6 h-6 rounded-full border border-white/20"
                      style={{ background: theme.colors.secondary }}
                      title="Secondary"
                    />
                    <div 
                      className="w-6 h-6 rounded-full border border-white/20"
                      style={{ background: theme.colors.accent }}
                      title="Accent"
                    />
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Info Note */}
          <div className="mt-8 p-4 rounded-xl bg-[var(--theme-primary)]/10 border border-[var(--theme-primary)]/20">
            <div className="flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div>
                <p className="text-[var(--theme-text-primary)] font-medium">Theme affects your entire dashboard</p>
                <p className="text-sm text-[var(--theme-text-muted)] mt-1">
                  Your selected theme will apply to the calendar, Content Forge, sidebar, all panels, and every component you interact with.
                  Your theme preference is saved automatically.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Settings Sections (Future) */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Notification Settings */}
          <div className="backdrop-blur-2xl bg-[var(--theme-bg-glass)] rounded-2xl border border-[var(--theme-glass-border)] p-6 opacity-60">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-white/60">Notifications</h3>
                <p className="text-xs text-white/40">Coming Soon</p>
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div className="backdrop-blur-2xl bg-[var(--theme-bg-glass)] rounded-2xl border border-[var(--theme-glass-border)] p-6 opacity-60">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-white/60">Account</h3>
                <p className="text-xs text-white/40">Coming Soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

/**
 * NotificationBell — Real-time notification bell with dropdown.
 *
 * Reads from the `notifications` table in Supabase.
 * When there are zero notifications, shows a single
 * "getting started" onboarding card so the dashboard
 * never feels empty.
 *
 * Works on both /business-dashboard and /admin-v2.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';

interface Notification {
  id: string;
  title: string;
  body: string | null;
  icon: string;
  category: string;
  severity: string;
  action_url: string | null;
  action_label: string | null;
  read: boolean;
  created_at: string;
}

// Getting-started cards shown when there are zero real notifications
const GETTING_STARTED: Omit<Notification, 'id' | 'created_at'>[] = [
  {
    title: 'Start your first campaign',
    body: 'Create a post or schedule content to start reaching your audience.',
    icon: 'rocket',
    category: 'system',
    severity: 'info',
    action_url: '/admin-v2',
    action_label: 'Open Command Center',
    read: false,
  },
];

// Icon map for category → SVG
function CategoryIcon({ icon, className }: { icon: string; className?: string }) {
  const c = className || 'w-4 h-4';
  switch (icon) {
    case 'rocket':
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.58-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
        </svg>
      );
    case 'user-plus':
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
        </svg>
      );
    case 'calendar-check':
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
        </svg>
      );
    case 'brain':
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
      );
    default:
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
      );
  }
}

const SEVERITY_COLORS: Record<string, string> = {
  info: 'bg-blue-500/20 text-blue-400',
  success: 'bg-emerald-500/20 text-emerald-400',
  warning: 'bg-amber-500/20 text-amber-400',
  critical: 'bg-rose-500/20 text-rose-400',
};

interface NotificationBellProps {
  /** Visual variant to match the dashboard style */
  variant?: 'tactical' | 'gold';
}

export default function NotificationBell({ variant = 'tactical' }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('notifications')
      .select('id, title, body, icon, category, severity, action_url, action_label, read, created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    setNotifications(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Mark all as read
  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;

    await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', unreadIds);

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Determine what to show
  const displayItems: Notification[] = notifications.length > 0
    ? notifications
    : GETTING_STARTED.map((gs, i) => ({
        ...gs,
        id: `gs-${i}`,
        created_at: new Date().toISOString(),
      }));

  const displayCount = notifications.length > 0 ? unreadCount : 1; // Show "1" for getting-started

  // Styles based on variant
  const isTactical = variant === 'tactical';
  const bellBg = isTactical
    ? 'backdrop-blur-xl bg-white/[0.08] border border-white/[0.15] hover:bg-white/[0.15]'
    : 'bg-white/5 border border-white/10 hover:bg-white/10';
  const badgeBg = isTactical
    ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'
    : 'bg-gold shadow-[0_0_10px_rgba(201,169,110,0.5)]';
  const badgeText = isTactical ? 'text-white' : 'text-midnight-900';

  return (
    <div ref={ref} className="relative">
      {/* Bell Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(!open)}
        className={`relative w-10 h-10 rounded-xl ${bellBg} flex items-center justify-center text-white/60 hover:text-white transition-all duration-300`}
        aria-label={`Notifications${displayCount > 0 ? ` (${displayCount} unread)` : ''}`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {displayCount > 0 && (
          <span className={`absolute -top-1 -right-1 w-5 h-5 ${badgeBg} rounded-full text-[10px] ${badgeText} flex items-center justify-center font-bold`}>
            {displayCount > 9 ? '9+' : displayCount}
          </span>
        )}
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-14 w-80 sm:w-96 rounded-2xl border border-white/10 backdrop-blur-2xl bg-[#1a1a1a]/95 shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <span className="text-sm font-semibold text-white">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] uppercase tracking-wider text-white/40 hover:text-white/70 transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Items */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                </div>
              ) : (
                displayItems.map((item) => {
                  const isGettingStarted = item.id.startsWith('gs-');
                  return (
                    <a
                      key={item.id}
                      href={item.action_url || '#'}
                      className={`flex items-start gap-3 px-5 py-4 border-b border-white/5 hover:bg-white/5 transition-colors ${
                        !item.read ? 'bg-white/[0.02]' : ''
                      }`}
                    >
                      <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isGettingStarted
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : SEVERITY_COLORS[item.severity] || 'bg-white/10 text-white/60'
                      }`}>
                        <CategoryIcon icon={item.icon} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium ${!item.read ? 'text-white' : 'text-white/60'}`}>
                            {item.title}
                          </p>
                          {!item.read && !isGettingStarted && (
                            <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        {item.body && (
                          <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{item.body}</p>
                        )}
                        {item.action_label && (
                          <span className="inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400 hover:text-emerald-300">
                            {item.action_label} &rarr;
                          </span>
                        )}
                      </div>
                    </a>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length === 0 && !loading && (
              <div className="px-5 py-3 border-t border-white/5 text-center">
                <p className="text-[10px] uppercase tracking-wider text-white/30">
                  Complete actions above to unlock more features
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

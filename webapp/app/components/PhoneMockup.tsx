'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Notification types
interface Notification {
  id: number;
  type: 'trend' | 'content' | 'lead' | 'booking' | 'insight';
  icon: string;
  title: string;
  subtitle: string;
  time: string;
  color: string;
}

const notifications: Notification[] = [
  { id: 1, type: 'trend', icon: '🔥', title: 'Trending Now', subtitle: 'Local BBQ Festival this weekend', time: 'Just now', color: 'from-orange-500 to-red-500' },
  { id: 2, type: 'content', icon: '✨', title: 'Content Ready', subtitle: '"5 Ways to Boost Reviews" generated', time: '2m ago', color: 'from-purple-500 to-pink-500' },
  { id: 3, type: 'lead', icon: '🎯', title: 'New Lead Captured', subtitle: 'Sarah M. wants a consultation', time: '5m ago', color: 'from-green-500 to-emerald-500' },
  { id: 4, type: 'booking', icon: '📅', title: 'Booking Confirmed', subtitle: 'Mike B. - Strategy Session @ 2pm', time: '12m ago', color: 'from-blue-500 to-cyan-500' },
  { id: 5, type: 'insight', icon: '📈', title: 'Weekly Insight', subtitle: 'Engagement up 43% this week', time: '1h ago', color: 'from-yellow-500 to-orange-500' },
  { id: 6, type: 'trend', icon: '⚡', title: 'Pulse Alert', subtitle: 'High foot traffic detected nearby', time: 'Just now', color: 'from-cyan-500 to-blue-500' },
  { id: 7, type: 'content', icon: '🎬', title: 'Video Script Ready', subtitle: '"Customer Testimonial" generated', time: '3m ago', color: 'from-pink-500 to-rose-500' },
  { id: 8, type: 'lead', icon: '📞', title: 'Voice AI Update', subtitle: 'Susan booked 3 appointments today', time: '15m ago', color: 'from-emerald-500 to-teal-500' },
];

// Dashboard Stats
const dashboardStats = [
  { label: 'Leads Today', value: '12', change: '+3', positive: true },
  { label: 'Content Queued', value: '8', change: '', positive: true },
  { label: 'Engagement', value: '89%', change: '+12%', positive: true },
];

export default function PhoneMockup() {
  const [currentNotifications, setCurrentNotifications] = useState<Notification[]>([]);
  const [notificationIndex, setNotificationIndex] = useState(0);

  // Cycle through notifications
  useEffect(() => {
    const interval = setInterval(() => {
      setNotificationIndex(prev => (prev + 1) % notifications.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Add new notification to stack
  useEffect(() => {
    const newNotification = { ...notifications[notificationIndex], id: Date.now() };
    setCurrentNotifications(prev => [newNotification, ...prev].slice(0, 4));
  }, [notificationIndex]);

  return (
    <div className="relative">
      {/* Phone Frame */}
      <div className="relative w-[280px] h-[580px] bg-gradient-to-b from-gray-900 to-black rounded-[40px] p-2 shadow-2xl shadow-black/50 border border-white/10">
        {/* Inner Screen */}
        <div className="relative w-full h-full bg-os-dark rounded-[32px] overflow-hidden">
          {/* Status Bar */}
          <div className="absolute top-0 inset-x-0 h-7 bg-black/50 backdrop-blur-sm flex items-center justify-between px-6 z-20">
            <span className="text-[10px] text-white/70">9:41</span>
            <div className="flex items-center gap-1">
              <div className="flex gap-0.5">
                <div className="w-1 h-2 bg-white/70 rounded-sm"></div>
                <div className="w-1 h-2.5 bg-white/70 rounded-sm"></div>
                <div className="w-1 h-3 bg-white/70 rounded-sm"></div>
                <div className="w-1 h-3.5 bg-white/50 rounded-sm"></div>
              </div>
              <span className="text-[10px] text-white/70 ml-1">100%</span>
            </div>
          </div>

          {/* Notch */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-30"></div>

          {/* App Content */}
          <div className="pt-10 px-3 h-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] text-white/50 uppercase tracking-wider">Command Center</p>
                <h2 className="text-sm font-bold text-white">Good Morning 👋</h2>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-green-500 to-emerald-600 flex items-center justify-center">
                <span className="text-xs">JT</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {dashboardStats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/5 rounded-xl p-2 border border-white/10"
                >
                  <p className="text-[8px] text-white/50 uppercase">{stat.label}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-white">{stat.value}</span>
                    {stat.change && (
                      <span className={`text-[8px] ${stat.positive ? 'text-neon-green-400' : 'text-red-400'}`}>
                        {stat.change}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Live Notifications */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-white/50 uppercase tracking-wider">Live Activity</p>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-neon-green-500 rounded-full animate-pulse"></span>
                  <span className="text-[8px] text-neon-green-400">LIVE</span>
                </div>
              </div>
              
              <div className="space-y-2 h-[200px] overflow-hidden">
                <AnimatePresence mode="popLayout">
                  {currentNotifications.map((notification, i) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: 50, scale: 0.9 }}
                      animate={{ 
                        opacity: 1 - (i * 0.2), 
                        x: 0, 
                        scale: 1 - (i * 0.02),
                        y: i * 2
                      }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                      className={`relative bg-gradient-to-r ${notification.color} bg-opacity-20 rounded-xl p-2.5 border border-white/10 backdrop-blur-sm`}
                      style={{ zIndex: 10 - i }}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{notification.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-white truncate">{notification.title}</p>
                            <span className="text-[8px] text-white/50">{notification.time}</span>
                          </div>
                          <p className="text-[9px] text-white/70 truncate">{notification.subtitle}</p>
                        </div>
                      </div>
                      {i === 0 && (
                        <motion.div
                          className="absolute inset-0 rounded-xl border-2 border-white/30"
                          initial={{ opacity: 1 }}
                          animate={{ opacity: 0 }}
                          transition={{ duration: 1 }}
                        />
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="absolute bottom-20 left-3 right-3">
              <div className="grid grid-cols-4 gap-2">
                {[
                  { icon: '✏️', label: 'Create' },
                  { icon: '📊', label: 'Analytics' },
                  { icon: '📅', label: 'Schedule' },
                  { icon: '🎯', label: 'Leads' },
                ].map((action, i) => (
                  <motion.div
                    key={action.label}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white/10 rounded-xl p-2 flex flex-col items-center cursor-pointer"
                  >
                    <span className="text-base">{action.icon}</span>
                    <span className="text-[7px] text-white/70 mt-0.5">{action.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Bottom Nav */}
            <div className="absolute bottom-3 left-3 right-3 h-12 bg-black/50 backdrop-blur-xl rounded-2xl flex items-center justify-around px-4 border border-white/10">
              <div className="flex flex-col items-center">
                <svg className="w-5 h-5 text-neon-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                <span className="text-[6px] text-neon-green-400">Home</span>
              </div>
              <div className="flex flex-col items-center opacity-50">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-[6px] text-white/50">Calendar</span>
              </div>
              <div className="flex flex-col items-center opacity-50">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="text-[6px] text-white/50">Alerts</span>
              </div>
              <div className="flex flex-col items-center opacity-50">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-[6px] text-white/50">Profile</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements Around Phone */}
      <motion.div
        animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-4 -right-8 w-16 h-16 bg-gradient-to-br from-neon-green-500/30 to-emerald-500/30 rounded-2xl backdrop-blur-sm border border-neon-green-500/30 flex items-center justify-center"
      >
        <span className="text-2xl">📈</span>
      </motion.div>
      
      <motion.div
        animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute top-20 -left-10 w-14 h-14 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-xl backdrop-blur-sm border border-purple-500/30 flex items-center justify-center"
      >
        <span className="text-xl">🎯</span>
      </motion.div>
      
      <motion.div
        animate={{ y: [0, -8, 0], x: [0, 5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-32 -right-6 w-12 h-12 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-lg backdrop-blur-sm border border-blue-500/30 flex items-center justify-center"
      >
        <span className="text-lg">💬</span>
      </motion.div>

      <motion.div
        animate={{ y: [0, 12, 0], rotate: [0, -3, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        className="absolute bottom-20 -left-8 w-10 h-10 bg-gradient-to-br from-orange-500/30 to-yellow-500/30 rounded-lg backdrop-blur-sm border border-orange-500/30 flex items-center justify-center"
      >
        <span className="text-sm">🔥</span>
      </motion.div>
    </div>
  );
}

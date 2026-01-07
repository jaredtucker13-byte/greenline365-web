'use client';

/**
 * LocalPulse Component - Daily Trend Hunter
 * GreenLine365 Admin V2 - Tactical Multi-Command Center
 * 
 * Hyper-Local Intelligence featuring:
 * - Location-based trend detection
 * - Proactive alerts for local events
 * - AI-powered content suggestions
 * - Auto-fill to Content Forge integration
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import type { LocalTrend } from '../lib/types';

interface LocalPulseProps {
  location: string;
  trends: LocalTrend[];
  onForgeContent: (trend: LocalTrend) => void;
}

export default function LocalPulse({ location, trends, onForgeContent }: LocalPulseProps) {
  const [expandedTrend, setExpandedTrend] = useState<string | null>(null);

  const getTrafficColor = (traffic: string) => {
    switch (traffic) {
      case 'high': return 'text-[#FF3B3B] bg-[#FF3B3B]/20 border-[#FF3B3B]/30';
      case 'medium': return 'text-[#FFC800] bg-[#FFC800]/20 border-[#FFC800]/30';
      case 'low': return 'text-[#39FF14] bg-[#39FF14]/20 border-[#39FF14]/30';
      default: return 'text-gray-400 bg-gray-400/20 border-gray-400/30';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'sports': return '🏈';
      case 'weather': return '⛈️';
      case 'holiday': return '🎉';
      case 'community': return '🏠';
      case 'entertainment': return '🎬';
      case 'food': return '🍔';
      default: return '📍';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1A1A1A] rounded-2xl border border-[#39FF14]/20 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-[#39FF14]/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#39FF14]/20 to-[#0CE293]/20 border border-[#39FF14]/30 flex items-center justify-center">
            <span className="text-xl">📡</span>
          </div>
          <div>
            <h3 className="text-white font-bold">Local Pulse</h3>
            <p className="text-xs text-gray-400">{location}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse" />
          <span className="text-xs text-[#39FF14] font-mono">LIVE</span>
        </div>
      </div>

      {/* Trends List */}
      <div className="max-h-[300px] overflow-y-auto">
        <AnimatePresence>
          {trends.length > 0 ? (
            trends.map((trend, idx) => (
              <motion.div
                key={trend.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 border-b border-[#1E262E] hover:bg-[#39FF14]/5 transition-colors"
              >
                {/* Trend Header */}
                <div 
                  className="flex items-start gap-3 cursor-pointer"
                  onClick={() => setExpandedTrend(expandedTrend === trend.id ? null : trend.id)}
                >
                  <span className="text-2xl">{getCategoryIcon(trend.category)}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-white font-semibold">{trend.title}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getTrafficColor(trend.expected_traffic)}`}>
                        {trend.expected_traffic.toUpperCase()} TRAFFIC
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mt-1">{trend.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(trend.event_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <motion.div
                    animate={{ rotate: expandedTrend === trend.id ? 180 : 0 }}
                    className="text-gray-400"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </motion.div>
                </div>

                {/* Expanded AI Suggestion */}
                <AnimatePresence>
                  {expandedTrend === trend.id && trend.suggested_action && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-[#1E262E]"
                    >
                      <div className="bg-gradient-to-r from-[#8A2BE2]/10 to-[#39FF14]/10 border border-[#8A2BE2]/30 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">🧠</span>
                          <span className="text-sm font-semibold text-[#8A2BE2]">AI Suggestion</span>
                        </div>
                        <p className="text-white text-sm mb-4">"{trend.suggested_action}"</p>
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onForgeContent(trend)}
                            className="flex-1 py-2 px-4 rounded-lg bg-[#39FF14] text-black font-semibold text-sm hover:bg-[#39FF14]/90 transition flex items-center justify-center gap-2"
                          >
                            <span>✅</span> Yes, Forge It
                          </motion.button>
                          <button
                            onClick={() => setExpandedTrend(null)}
                            className="py-2 px-4 rounded-lg border border-[#2D3748] text-gray-400 text-sm hover:text-white transition"
                          >
                            Not Now
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          ) : (
            <div className="p-8 text-center">
              <span className="text-4xl mb-4 block">📰</span>
              <p className="text-gray-400">No local trends detected</p>
              <p className="text-xs text-gray-500 mt-1">Check back later for updates</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

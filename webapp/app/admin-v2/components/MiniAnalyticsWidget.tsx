'use client';

/**
 * MiniAnalyticsWidget Component
 * Compact analytics toggle that cycles through different metrics
 * 
 * Features:
 * - Toggle button to cycle metrics (impressions → clicks → engagement → top posts)
 * - Each metric view clickable to open full Analytics page
 * - Expand icon to jump to full Analytics page
 * - Keyboard shortcut: T to toggle, E to expand
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface MetricData {
  id: string;
  label: string;
  value: string;
  change: string;
  changeType: 'up' | 'down' | 'neutral';
  icon: string;
  subMetrics?: { label: string; value: string }[];
}

const METRICS: MetricData[] = [
  {
    id: 'impressions',
    label: 'Impressions',
    value: '24.5K',
    change: '+12.3%',
    changeType: 'up',
    icon: '👁️',
    subMetrics: [
      { label: 'Organic', value: '18.2K' },
      { label: 'Paid', value: '6.3K' },
    ],
  },
  {
    id: 'clicks',
    label: 'Clicks',
    value: '3,847',
    change: '+8.7%',
    changeType: 'up',
    icon: '🖱️',
    subMetrics: [
      { label: 'CTR', value: '15.7%' },
      { label: 'Avg CPC', value: '$0.42' },
    ],
  },
  {
    id: 'engagement',
    label: 'Engagement',
    value: '2,156',
    change: '-2.1%',
    changeType: 'down',
    icon: '💬',
    subMetrics: [
      { label: 'Comments', value: '847' },
      { label: 'Shares', value: '312' },
    ],
  },
  {
    id: 'top-posts',
    label: 'Top Posts',
    value: '5 trending',
    change: '+3 new',
    changeType: 'up',
    icon: '🏆',
    subMetrics: [
      { label: 'Best: AI Tips', value: '4.2K views' },
      { label: 'Rising: Local SEO', value: '1.8K views' },
    ],
  },
];

interface MiniAnalyticsWidgetProps {
  onExpand?: () => void;
}

export default function MiniAnalyticsWidget({ onExpand }: MiniAnalyticsWidgetProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const currentMetric = METRICS[currentIndex];

  const handleToggle = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % METRICS.length);
  }, []);

  const handleExpand = useCallback(() => {
    if (onExpand) {
      onExpand();
    } else {
      // Navigate to analytics page
      window.location.href = '/admin-v2?view=analytics';
    }
  }, [onExpand]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }
      
      if (e.key === 't' || e.key === 'T') {
        handleToggle();
      } else if (e.key === 'e' || e.key === 'E') {
        handleExpand();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleToggle, handleExpand]);

  return (
    <div 
      className="bg-[#0D0D0D] rounded-xl border border-[#2D3748] overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2D3748]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-400">📊 Quick Analytics</span>
          {/* Metric dots indicator */}
          <div className="flex gap-1">
            {METRICS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === currentIndex ? 'bg-[#39FF14] w-3' : 'bg-gray-600 hover:bg-gray-500'
                }`}
                aria-label={`View ${METRICS[idx].label}`}
              />
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Toggle button */}
          <button
            onClick={handleToggle}
            className="p-1.5 rounded-lg hover:bg-[#1A1A1A] text-gray-400 hover:text-white transition active:scale-95"
            title="Toggle metric (T)"
            aria-label="Toggle metric"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          
          {/* Expand button */}
          <Link
            href="/admin-v2?view=analytics"
            className="p-1.5 rounded-lg hover:bg-[#39FF14]/10 text-gray-400 hover:text-[#39FF14] transition active:scale-95"
            title="View full analytics (E)"
            aria-label="Expand to full analytics"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Metric Content */}
      <Link 
        href={`/admin-v2?view=analytics&metric=${currentMetric.id}`}
        className="block p-3 hover:bg-[#1A1A1A]/50 transition"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMetric.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{currentMetric.icon}</span>
                <span className="text-sm text-white font-medium">{currentMetric.label}</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-white">{currentMetric.value}</span>
                <span className={`text-xs ml-2 ${
                  currentMetric.changeType === 'up' ? 'text-green-400' :
                  currentMetric.changeType === 'down' ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {currentMetric.change}
                </span>
              </div>
            </div>

            {/* Sub-metrics */}
            {currentMetric.subMetrics && (
              <div className="flex gap-4 mt-2">
                {currentMetric.subMetrics.map((sub, idx) => (
                  <div key={idx} className="flex-1">
                    <p className="text-[10px] text-gray-500 uppercase">{sub.label}</p>
                    <p className="text-xs text-white font-medium">{sub.value}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </Link>

      {/* Quick tip (shows on hover) */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 py-1.5 bg-[#1A1A1A] border-t border-[#2D3748]"
          >
            <p className="text-[10px] text-gray-500 text-center">
              <kbd className="px-1 py-0.5 bg-[#2D3748] rounded text-gray-400 mr-1">T</kbd> toggle
              <span className="mx-2">•</span>
              <kbd className="px-1 py-0.5 bg-[#2D3748] rounded text-gray-400 mr-1">E</kbd> expand
              <span className="mx-2">•</span>
              Click for details
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

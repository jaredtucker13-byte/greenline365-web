'use client';

/**
 * AnalyticsWidgets Component
 * GreenLine365 Admin V2 - Tactical Multi-Command Center
 * 
 * Bottom row analytics featuring:
 * 1. Recent Activity - Real-time feed of business actions
 * 2. Team Performance - Bar graph showing efficiency
 * 3. Content Pipeline - Progress bars (Creation, Review, Launch)
 * 4. Booking Trends - Line chart comparing current vs previous weeks
 */

import { motion } from 'framer-motion';
import type { ActivityItem, TeamMetrics, PipelineStage, BookingTrend } from '../lib/types';

interface AnalyticsWidgetsProps {
  activities: ActivityItem[];
  teamMetrics: TeamMetrics[];
  pipeline: PipelineStage[];
  bookingTrends: BookingTrend[];
}

export default function AnalyticsWidgets({ 
  activities, 
  teamMetrics, 
  pipeline, 
  bookingTrends 
}: AnalyticsWidgetsProps) {
  // Guard against empty arrays to prevent NaN values
  const safeTeamMetrics = teamMetrics?.length > 0 ? teamMetrics : [];
  const safeBookingTrends = bookingTrends?.length > 0 ? bookingTrends : [];
  
  const maxMetricValue = safeTeamMetrics.length > 0 
    ? Math.max(...safeTeamMetrics.map(m => m.value), 1) 
    : 1;
  const maxTrendValue = safeBookingTrends.length > 0 
    ? Math.max(...safeBookingTrends.flatMap(t => [t.current, t.previous]), 1) 
    : 1;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#1A1A1A] rounded-2xl border border-[#39FF14]/20 p-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <span className="text-[#39FF14]">⚡</span> Recent Activity
          </h3>
          <button className="text-gray-400 hover:text-white transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-3 max-h-[200px] overflow-y-auto">
          {activities.map((activity, idx) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#39FF14]/5 transition"
            >
              <div className="w-8 h-8 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/30 flex items-center justify-center text-xs text-[#39FF14] font-bold">
                {activity.user.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{activity.action}</p>
                <p className="text-xs text-gray-500">{activity.timestamp}</p>
              </div>
              {activity.metric && (
                <span className="text-xs text-[#39FF14] font-mono">{activity.metric}</span>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* 2. Team Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#1A1A1A] rounded-2xl border border-[#39FF14]/20 p-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <span className="text-[#0CE293]">📊</span> Team Performance
          </h3>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">53.1%</p>
            <p className="text-xs text-gray-500">Avg: 15.5k</p>
          </div>
        </div>
        
        <div className="flex items-end justify-between h-[160px] gap-2 pt-4">
          {safeTeamMetrics.map((metric, idx) => (
            <div key={metric.label} className="flex-1 flex flex-col items-center gap-2">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(metric.value / maxMetricValue) * 100}%` }}
                transition={{ delay: 0.3 + idx * 0.1, type: 'spring', stiffness: 100 }}
                className="w-full rounded-t-lg bg-gradient-to-t from-[#39FF14] to-[#0CE293] relative group"
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition text-xs text-white bg-[#1E262E] px-2 py-1 rounded">
                  {metric.value}
                </div>
              </motion.div>
              <span className="text-xs text-gray-400 font-medium">{metric.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 3. Content Pipeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-[#1A1A1A] rounded-2xl border border-[#39FF14]/20 p-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <span className="text-[#FFC800]">📦</span> Content Pipeline
          </h3>
          <button className="text-gray-400 hover:text-white transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          {pipeline.map((stage, idx) => {
            const colors = [
              { bg: 'bg-[#0CE293]', text: 'text-[#0CE293]' },
              { bg: 'bg-[#FFC800]', text: 'text-[#FFC800]' },
              { bg: 'bg-[#8A2BE2]', text: 'text-[#8A2BE2]' },
            ];
            const color = colors[idx % colors.length];
            
            return (
              <div key={stage.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-300">{stage.name}</span>
                  <span className={`text-sm font-bold ${color.text}`}>{stage.percentage}%</span>
                </div>
                <div className="h-2 bg-[#1E262E] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stage.percentage}%` }}
                    transition={{ delay: 0.4 + idx * 0.1, type: 'spring', stiffness: 80 }}
                    className={`h-full rounded-full ${color.bg}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* 4. Booking Trends */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-[#1A1A1A] rounded-2xl border border-[#39FF14]/20 p-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <span className="text-[#8A2BE2]">📈</span> Booking Trends
          </h3>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#39FF14]" />
              <span className="text-gray-400">This Week</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-500" />
              <span className="text-gray-400">Last Week</span>
            </div>
          </div>
        </div>
        
        {/* Simple Line Chart */}
        <div className="relative h-[160px]">
          <svg className="w-full h-full" viewBox="0 0 300 120" preserveAspectRatio="none">
            {/* Grid lines */}
            {[0, 30, 60, 90, 120].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="300"
                y2={y}
                stroke="#1E262E"
                strokeWidth="1"
              />
            ))}
            
            {/* Previous week line */}
            {safeBookingTrends.length > 1 && (
              <motion.polyline
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
                fill="none"
                stroke="#4A5568"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={safeBookingTrends.map((t, i) => 
                  `${(i / Math.max(safeBookingTrends.length - 1, 1)) * 280 + 10},${120 - (t.previous / maxTrendValue) * 100}`
                ).join(' ')}
              />
            )}
            
            {/* Current week line */}
            {safeBookingTrends.length > 1 && (
              <motion.polyline
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.7, duration: 1 }}
                fill="none"
                stroke="#39FF14"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={safeBookingTrends.map((t, i) => 
                  `${(i / Math.max(safeBookingTrends.length - 1, 1)) * 280 + 10},${120 - (t.current / maxTrendValue) * 100}`
                ).join(' ')}
              />
            )}
            
            {/* Current week dots */}
            {safeBookingTrends.map((t, i) => (
              <motion.circle
                key={i}
                initial={{ opacity: 0, r: 0 }}
                animate={{ opacity: 1, r: 4 }}
                transition={{ delay: 0.9 + i * 0.1 }}
                cx={(i / Math.max(safeBookingTrends.length - 1, 1)) * 280 + 10}
                cy={120 - (t.current / maxTrendValue) * 100}
                fill="#39FF14"
              />
            ))}
          </svg>
          
          {/* X-axis labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-xs text-gray-500">
            {bookingTrends.map((t) => (
              <span key={t.day}>{t.day}</span>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

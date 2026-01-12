'use client';

/**
 * Analytics Page - Real Data Dashboard
 * GreenLine365 Admin V2
 * 
 * Two-sided metrics:
 * 1. Platform value (prove ROI for GreenLine365)
 * 2. Tenant metrics (help their business grow)
 * 3. Pattern discovery (insights they didn't know)
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CollapsibleSidebar from '../components/CollapsibleSidebar';

type DateRange = '7d' | '30d' | '90d' | 'all';

interface OverviewData {
  summary: {
    totalEvents: number;
    totalBlogs: number;
    publishedBlogs: number;
    draftBlogs: number;
    knowledgeChunks: number;
    imagesGenerated: number;
    emailsSent: number;
    smsSent: number;
  };
  breakdown: {
    byCategory: Record<string, number>;
    byType: Record<string, number>;
  };
}

interface PatternData {
  patterns: string[];
  insights: string[];
  stats: {
    totalEvents: number;
    uniqueDays: number;
    topEventTypes: [string, number][];
  };
}

interface TimelineData {
  timeline: Record<string, Array<{
    type: string;
    category: string;
    title: string;
    time: string;
  }>>;
  totalEvents: number;
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Data states
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [patterns, setPatterns] = useState<PatternData | null>(null);
  const [timeline, setTimeline] = useState<TimelineData | null>(null);

  // Fetch data
  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      try {
        const [overviewRes, patternsRes, timelineRes] = await Promise.all([
          fetch(`/api/analytics?range=${dateRange}`),
          fetch('/api/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'patterns', dateRange }),
          }),
          fetch('/api/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'timeline', dateRange }),
          }),
        ]);

        if (overviewRes.ok) setOverview(await overviewRes.json());
        if (patternsRes.ok) setPatterns(await patternsRes.json());
        if (timelineRes.ok) setTimeline(await timelineRes.json());
      } catch (e) {
        console.error('Failed to fetch analytics:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [dateRange]);

  const hasData = overview && overview.summary.totalEvents > 0;

  return (
    <div 
      className="min-h-screen flex relative"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2232&auto=format&fit=crop')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <CollapsibleSidebar
        activeItem="analytics"
        onNewBooking={() => {}}
        onNewContent={() => {}}
        pendingCount={0}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={mobileMenuOpen}
        onMobileToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      <div className="flex-1 min-w-0 relative z-10 p-4 md:p-8 overflow-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Analytics</h1>
            <p className="text-white/60">Real insights from your activity</p>
          </div>
          
          {/* Date Range Selector */}
          <div className="flex gap-2 bg-white/5 rounded-xl p-1">
            {(['7d', '30d', '90d', 'all'] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  dateRange === range
                    ? 'bg-emerald-500 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {range === 'all' ? 'All Time' : range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-white/60">Loading analytics...</div>
          </div>
        ) : !hasData ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-12 text-center max-w-2xl mx-auto"
          >
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-white mb-2">No Activity Yet</h2>
            <p className="text-white/60 mb-6">
              Start using GreenLine365 to see your analytics here. Create blog posts, 
              generate images, send emails - we'll track it all and show you patterns.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a href="/admin-v2/blog-polish" className="px-6 py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600">
                Create a Blog Post
              </a>
              <a href="/admin-v2/brand-voice" className="px-6 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20">
                Set Up Brand Voice
              </a>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Overview Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Activities', value: overview?.summary.totalEvents || 0, icon: '📈', color: 'emerald' },
                { label: 'Blog Posts', value: overview?.summary.totalBlogs || 0, icon: '📝', color: 'blue' },
                { label: 'Images Generated', value: overview?.summary.imagesGenerated || 0, icon: '🖼️', color: 'purple' },
                { label: 'Knowledge Items', value: overview?.summary.knowledgeChunks || 0, icon: '📚', color: 'amber' },
              ].map((metric, i) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{metric.icon}</span>
                    <span className={`text-xs px-2 py-1 rounded-full bg-${metric.color}-500/20 text-${metric.color}-400`}>
                      {dateRange}
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-white">{metric.value.toLocaleString()}</div>
                  <div className="text-sm text-white/50">{metric.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Activity Breakdown & Patterns */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Activity by Type */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4">Activity Breakdown</h3>
                {overview?.breakdown.byType && Object.entries(overview.breakdown.byType).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(overview.breakdown.byType)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 8)
                      .map(([type, count]) => {
                        const percentage = ((count / overview.summary.totalEvents) * 100).toFixed(0);
                        const readableType = type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        return (
                          <div key={type}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-white/80">{readableType}</span>
                              <span className="text-white/50">{count} ({percentage}%)</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-white/40 text-center py-4">No activity breakdown yet</p>
                )}
              </motion.div>

              {/* Discovered Patterns */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4">🔮 Discovered Patterns</h3>
                {patterns?.patterns && patterns.patterns.length > 0 ? (
                  <div className="space-y-3">
                    {patterns.patterns.map((pattern, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                          {i + 1}
                        </div>
                        <span className="text-white/80">{pattern}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/40 text-center py-4">Keep using the platform to discover patterns!</p>
                )}
              </motion.div>
            </div>

            {/* AI Insights */}
            {patterns?.insights && patterns.insights.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="backdrop-blur-xl bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-2xl border border-emerald-500/20 p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4">💡 AI Insights</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {patterns.insights.map((insight, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/5">
                      <p className="text-white/80">{insight}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Activity Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
              {timeline?.timeline && Object.keys(timeline.timeline).length > 0 ? (
                <div className="space-y-6 max-h-96 overflow-y-auto">
                  {Object.entries(timeline.timeline).slice(0, 7).map(([date, events]) => (
                    <div key={date}>
                      <div className="text-sm font-medium text-white/50 mb-2">
                        {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="space-y-2 pl-4 border-l-2 border-white/10">
                        {events.slice(0, 5).map((event, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm">
                            <span className="text-white/40">{event.time}</span>
                            <span className="text-white/80">{event.title || event.type.replace(/_/g, ' ')}</span>
                          </div>
                        ))}
                        {events.length > 5 && (
                          <div className="text-xs text-white/40">+{events.length - 5} more</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/40 text-center py-4">No recent activity</p>
              )}
            </motion.div>

            {/* Your Progress Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">📊 Your Progress</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4">
                  <div className="text-3xl font-bold text-emerald-400">
                    {overview?.summary.totalBlogs || 0}
                  </div>
                  <div className="text-xs text-white/50">Blog posts</div>
                </div>
                <div className="text-center p-4">
                  <div className="text-3xl font-bold text-blue-400">
                    {overview?.summary.imagesGenerated || 0}
                  </div>
                  <div className="text-xs text-white/50">Images created</div>
                </div>
                <div className="text-center p-4">
                  <div className="text-3xl font-bold text-purple-400">
                    {overview?.summary.knowledgeChunks || 0}
                  </div>
                  <div className="text-xs text-white/50">Knowledge items</div>
                </div>
                <div className="text-center p-4">
                  <div className="text-3xl font-bold text-amber-400">
                    {patterns?.stats?.uniqueDays || 0}
                  </div>
                  <div className="text-xs text-white/50">Active days</div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

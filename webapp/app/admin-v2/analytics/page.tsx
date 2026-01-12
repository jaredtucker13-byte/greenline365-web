'use client';

/**
 * Analytics Page - Full Dashboard
 * GreenLine365 Admin V2
 * 
 * Features:
 * - Multi-metric widgets (engagement, impressions, clicks, conversions)
 * - Image performance analytics
 * - Trend sources analysis
 * - Publish frequency tracking
 * - Drafts-to-publish rates
 * - Configurable date range and filters
 * - Export CSV/PDF
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

type DateRange = '7d' | '30d' | '90d' | 'custom';
type ContentType = 'all' | 'blog' | 'social' | 'email';

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [contentType, setContentType] = useState<ContentType>('all');
  const [isExporting, setIsExporting] = useState(false);

  // Mock data
  const overviewMetrics = [
    { label: 'Total Impressions', value: '124.5K', change: '+18.3%', changeType: 'up' as const, icon: '👁️' },
    { label: 'Total Clicks', value: '12,847', change: '+12.7%', changeType: 'up' as const, icon: '🖱️' },
    { label: 'Engagement Rate', value: '8.4%', change: '+2.1%', changeType: 'up' as const, icon: '💬' },
    { label: 'Conversions', value: '847', change: '-5.2%', changeType: 'down' as const, icon: '🎯' },
  ];

  const imageMetrics = {
    withImages: { impressions: 89200, ctr: 12.4 },
    withoutImages: { impressions: 35300, ctr: 4.8 },
    topColors: ['#39FF14', '#0CE293', '#1E262E', '#FFC800'],
    avgAestheticScore: 7.8,
  };

  const trendSources = [
    { source: 'Google Trends', count: 24, percentage: 35 },
    { source: 'Twitter/X', count: 18, percentage: 26 },
    { source: 'Reddit', count: 12, percentage: 17 },
    { source: 'Industry News', count: 15, percentage: 22 },
  ];

  const publishFrequency = [
    { day: 'Mon', posts: 5 },
    { day: 'Tue', posts: 8 },
    { day: 'Wed', posts: 12 },
    { day: 'Thu', posts: 7 },
    { day: 'Fri', posts: 10 },
    { day: 'Sat', posts: 3 },
    { day: 'Sun', posts: 2 },
  ];

  const draftStats = {
    totalDrafts: 23,
    published: 156,
    conversionRate: 87.2,
    avgTimeToPublish: '2.4 days',
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    setIsExporting(true);
    // Simulate export
    await new Promise(resolve => setTimeout(resolve, 1500));
    alert(`${format.toUpperCase()} export started! Check your downloads.`);
    setIsExporting(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/admin-v2" className="text-gray-400 hover:text-white transition">
              ← Back
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-[#39FF14]">📊</span> Analytics Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Track performance across all your content
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="bg-[#1A1A1A] border border-[#2D3748] rounded-lg px-3 py-2 text-sm text-white focus:border-[#39FF14]/50 focus:outline-none"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="custom">Custom range</option>
          </select>

          {/* Content Type */}
          <select
            value={contentType}
            onChange={(e) => setContentType(e.target.value as ContentType)}
            className="bg-[#1A1A1A] border border-[#2D3748] rounded-lg px-3 py-2 text-sm text-white focus:border-[#39FF14]/50 focus:outline-none"
          >
            <option value="all">All Content</option>
            <option value="blog">Blog Posts</option>
            <option value="social">Social Media</option>
            <option value="email">Email</option>
          </select>

          {/* Export */}
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              className="px-4 py-2 bg-[#1A1A1A] border border-[#2D3748] rounded-lg text-sm text-white hover:border-[#39FF14]/50 transition active:scale-95 disabled:opacity-50"
            >
              📄 CSV
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              className="px-4 py-2 bg-[#1A1A1A] border border-[#2D3748] rounded-lg text-sm text-white hover:border-[#39FF14]/50 transition active:scale-95 disabled:opacity-50"
            >
              📑 PDF
            </button>
          </div>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {overviewMetrics.map((metric, idx) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-[#1A1A1A] rounded-xl border border-[#2D3748] p-5 hover:border-[#39FF14]/30 transition"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">{metric.icon}</span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                metric.changeType === 'up' 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {metric.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{metric.value}</p>
            <p className="text-sm text-gray-400">{metric.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Image Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-[#1A1A1A] rounded-xl border border-[#2D3748] p-6"
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            🖼️ Image Performance Analytics
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* CTR Comparison */}
            <div>
              <p className="text-sm text-gray-400 mb-3">Click-Through Rate Comparison</p>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white">Posts with Images</span>
                    <span className="text-[#39FF14] font-bold">{imageMetrics.withImages.ctr}%</span>
                  </div>
                  <div className="h-3 bg-[#2D3748] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${imageMetrics.withImages.ctr * 5}%` }}
                      className="h-full bg-gradient-to-r from-[#39FF14] to-[#0CE293] rounded-full"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white">Posts without Images</span>
                    <span className="text-gray-400 font-bold">{imageMetrics.withoutImages.ctr}%</span>
                  </div>
                  <div className="h-3 bg-[#2D3748] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${imageMetrics.withoutImages.ctr * 5}%` }}
                      className="h-full bg-gray-500 rounded-full"
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                💡 Posts with images get <span className="text-[#39FF14]">2.6x</span> more clicks
              </p>
            </div>

            {/* Color & Aesthetics */}
            <div>
              <p className="text-sm text-gray-400 mb-3">Top Performing Colors</p>
              <div className="flex gap-2 mb-4">
                {imageMetrics.topColors.map((color, idx) => (
                  <div
                    key={idx}
                    className="w-10 h-10 rounded-lg border-2 border-white/20"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <div className="p-3 bg-[#0D0D0D] rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Average Aesthetic Score</p>
                <p className="text-2xl font-bold text-white">
                  {imageMetrics.avgAestheticScore}
                  <span className="text-sm text-gray-400">/10</span>
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Trend Sources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#1A1A1A] rounded-xl border border-[#2D3748] p-6"
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            🔥 Trend Sources
          </h3>
          <div className="space-y-4">
            {trendSources.map((source, idx) => (
              <div key={source.source}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white">{source.source}</span>
                  <span className="text-gray-400">{source.count} posts</span>
                </div>
                <div className="h-2 bg-[#2D3748] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${source.percentage}%` }}
                    transition={{ delay: 0.6 + idx * 0.1 }}
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${['#39FF14', '#0CE293', '#FFC800', '#8A2BE2'][idx]}, transparent)`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Publish Frequency */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-[#1A1A1A] rounded-xl border border-[#2D3748] p-6"
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            📅 Publish Frequency
          </h3>
          <div className="flex items-end justify-between h-32 gap-2">
            {publishFrequency.map((day, idx) => (
              <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(day.posts / 12) * 100}%` }}
                  transition={{ delay: 0.7 + idx * 0.05 }}
                  className="w-full bg-gradient-to-t from-[#39FF14] to-[#0CE293] rounded-t"
                />
                <span className="text-xs text-gray-500">{day.day}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">
            Best day: <span className="text-[#39FF14]">Wednesday</span> (12 posts avg)
          </p>
        </motion.div>

        {/* Draft to Publish Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="lg:col-span-2 bg-[#1A1A1A] rounded-xl border border-[#2D3748] p-6"
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            📝 Drafts to Publish Pipeline
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-[#0D0D0D] rounded-lg text-center">
              <p className="text-3xl font-bold text-amber-400">{draftStats.totalDrafts}</p>
              <p className="text-xs text-gray-500 mt-1">Active Drafts</p>
            </div>
            <div className="p-4 bg-[#0D0D0D] rounded-lg text-center">
              <p className="text-3xl font-bold text-green-400">{draftStats.published}</p>
              <p className="text-xs text-gray-500 mt-1">Published This Month</p>
            </div>
            <div className="p-4 bg-[#0D0D0D] rounded-lg text-center">
              <p className="text-3xl font-bold text-[#39FF14]">{draftStats.conversionRate}%</p>
              <p className="text-xs text-gray-500 mt-1">Publish Rate</p>
            </div>
            <div className="p-4 bg-[#0D0D0D] rounded-lg text-center">
              <p className="text-3xl font-bold text-blue-400">{draftStats.avgTimeToPublish}</p>
              <p className="text-xs text-gray-500 mt-1">Avg Time to Publish</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 flex justify-center gap-4">
        <Link
          href="/admin-v2/blog-polish"
          className="px-6 py-3 bg-[#39FF14]/20 text-[#39FF14] rounded-xl font-medium hover:bg-[#39FF14]/30 transition active:scale-95"
        >
          📝 Create New Content
        </Link>
        <button
          onClick={() => alert('Scheduling reports coming soon!')}
          className="px-6 py-3 bg-[#1A1A1A] border border-[#2D3748] text-white rounded-xl font-medium hover:border-[#39FF14]/50 transition active:scale-95"
        >
          📧 Schedule Reports
        </button>
      </div>
    </div>
  );
}

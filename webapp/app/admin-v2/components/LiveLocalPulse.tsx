'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LiveTrend {
  id: string;
  title: string;
  description: string;
  category: string;
  suggested_action: string;
  expected_traffic: string;
  expires_at: string;
  created_at: string;
}

export default function LiveLocalPulse() {
  const [trends, setTrends] = useState<LiveTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  const fetchLivePulse = async () => {
    try {
      const response = await fetch('/api/receive-trends?type=live_pulse');
      const data = await response.json();
      
      if (data.success) {
        setTrends(data.trends);
      }
    } catch (error) {
      console.error('Failed to fetch live pulse:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLivePulse();
    
    // Refresh every 30 seconds to check for new trends
    const interval = setInterval(fetchLivePulse, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (trends.length === 0) return;

    // Update countdown every second
    const countdownInterval = setInterval(() => {
      const firstTrend = trends[0];
      if (firstTrend && firstTrend.expires_at) {
        const now = new Date().getTime();
        const expiry = new Date(firstTrend.expires_at).getTime();
        const diff = expiry - now;

        if (diff <= 0) {
          setTimeRemaining('Expired');
          fetchLivePulse(); // Fetch new trends
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
        }
      }
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [trends]);

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      weather: '🌤️',
      traffic: '🚗',
      event: '🎉',
      alert: '⚠️',
      sports: '⚽'
    };
    return icons[category] || '⚡';
  };

  if (loading) {
    return (
      <div className="bg-black/40 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/40 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
            <span className="animate-pulse">⚡</span>
            Live Local Pulse
          </h3>
          <p className="text-sm text-gray-400">
            Real-time opportunities (refreshes every 3h)
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 mb-1">Next Update</div>
          <div className="text-sm font-mono text-yellow-400">
            {timeRemaining || 'Calculating...'}
          </div>
        </div>
      </div>

      {/* Live Status Indicator */}
      {trends.length > 0 && (
        <div className="mb-4 flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-green-400 font-medium">LIVE</span>
          <span className="text-gray-500">•</span>
          <span className="text-gray-400">{trends.length} active opportunities</span>
        </div>
      )}

      {/* Trends List */}
      <AnimatePresence mode="wait">
        {trends.length > 0 ? (
          <div className="space-y-3">
            {trends.slice(0, 3).map((trend, index) => (
              <motion.div
                key={trend.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.1 }}
                className="relative bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-4 group hover:border-yellow-500/50 transition-all"
              >
                {/* Urgency Badge */}
                <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  {trend.expected_traffic.toUpperCase()}
                </div>

                <div className="flex items-start gap-3">
                  <div className="text-3xl flex-shrink-0">
                    {getCategoryIcon(trend.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-base mb-2">
                      {trend.title}
                    </h4>
                    <p className="text-sm text-gray-300 mb-3">
                      {trend.description}
                    </p>
                    {trend.suggested_action && (
                      <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-lg p-3">
                        <p className="text-sm text-yellow-200 font-medium">
                          💡 {trend.suggested_action}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <button className="mt-3 w-full py-2 text-sm font-bold bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg transition-all transform hover:scale-105">
                  Create Special Now →
                </button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">😴</div>
            <p className="text-gray-400 text-sm mb-2">
              No live opportunities at the moment
            </p>
            <p className="text-gray-500 text-xs">
              Next scan in {timeRemaining || '3 hours'}
            </p>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Refresh */}
      <button
        onClick={fetchLivePulse}
        className="mt-4 w-full py-2 text-xs font-medium text-gray-400 hover:text-yellow-400 transition-colors flex items-center justify-center gap-2"
      >
        <span className="inline-block animate-spin">🔄</span>
        Check for Updates
      </button>
    </div>
  );
}

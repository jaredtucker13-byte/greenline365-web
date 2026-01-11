'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Trend {
  id: string;
  title: string;
  description: string;
  category: string;
  suggested_action: string;
  expected_traffic: string;
  created_at: string;
}

interface WeeklyTrendBatchProps {
  onCreateContent?: (trend: Trend) => void;
}

export default function WeeklyTrendBatch({ onCreateContent }: WeeklyTrendBatchProps) {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchWeeklyTrends = async () => {
    try {
      const response = await fetch('/api/receive-trends?type=weekly_batch');
      const data = await response.json();
      
      if (data.success) {
        setTrends(data.trends.slice(0, 5)); // Show top 5
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch weekly trends:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyTrends();
  }, []);

  // Smart icon detection based on title/description content
  const getSmartIcon = (category: string, title: string, description: string = '') => {
    const content = `${title} ${description}`.toLowerCase();
    
    // Sports - detect specific sport type
    if (category === 'sports') {
      // American Football (NFL, Super Bowl, etc.)
      if (content.includes('super bowl') || 
          content.includes('nfl') || 
          content.includes('touchdown') ||
          content.includes('quarterback') ||
          content.includes('buccaneers') || 
          content.includes('dolphins') ||
          content.includes('jaguars') ||
          content.includes('american football')) {
        return '🏈';
      }
      // Hockey (NHL, Lightning, etc.)
      if (content.includes('lightning') || 
          content.includes('nhl') || 
          content.includes('hockey') ||
          content.includes('panthers hockey') ||
          content.includes('stanley cup') ||
          content.includes('puck')) {
        return '🏒';
      }
      // Basketball (NBA)
      if (content.includes('nba') || 
          content.includes('basketball') ||
          content.includes('heat') && content.includes('game') ||
          content.includes('magic') && content.includes('game') ||
          content.includes('lakers') ||
          content.includes('celtics')) {
        return '🏀';
      }
      // Baseball (MLB)
      if (content.includes('mlb') || 
          content.includes('baseball') ||
          content.includes('rays') && content.includes('game') ||
          content.includes('marlins') ||
          content.includes('world series')) {
        return '⚾';
      }
      // Soccer (International Football, MLS)
      if (content.includes('soccer') || 
          content.includes('mls') ||
          content.includes('fifa') ||
          content.includes('world cup') ||
          content.includes('premier league') ||
          content.includes('la liga') ||
          content.includes('champions league')) {
        return '⚽';
      }
      // Golf
      if (content.includes('golf') || content.includes('pga')) {
        return '⛳';
      }
      // Tennis
      if (content.includes('tennis') || content.includes('wimbledon')) {
        return '🎾';
      }
      // Default sports icon
      return '🏆';
    }
    
    // Non-sports categories
    const icons: Record<string, string> = {
      community: '🏘️',
      business: '💼',
      entertainment: '🎭',
      weather: '🌤️',
      education: '📚',
      event: '🎉',
      alert: '⚠️'
    };
    return icons[category] || '📌';
  };

  const getTrafficColor = (traffic: string) => {
    switch (traffic) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="bg-black/40 backdrop-blur-xl border border-[#00e676]/20 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/40 backdrop-blur-xl border border-[#00e676]/20 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">
            📅 Weekly Trend Hunter
          </h3>
          <p className="text-sm text-gray-400">
            Your content ideas for this week
          </p>
        </div>
        {lastUpdated && (
          <div className="text-xs text-gray-500">
            Updated: {lastUpdated.toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Trends List */}
      {trends.length > 0 ? (
        <div className="space-y-3">
          {trends.map((trend, index) => (
            <motion.div
              key={trend.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-r from-black/60 to-black/40 border border-[#00e676]/10 rounded-xl p-4 hover:border-[#00e676]/30 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0">
                  {getSmartIcon(trend.category, trend.title, trend.description)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-white text-sm line-clamp-1">
                      {trend.title}
                    </h4>
                    <span className={`text-xs font-semibold uppercase ${getTrafficColor(trend.expected_traffic)}`}>
                      {trend.expected_traffic}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                    {trend.description}
                  </p>
                  {trend.suggested_action && (
                    <div className="bg-[#00e676]/10 border border-[#00e676]/20 rounded-lg p-2 mt-2">
                      <p className="text-xs text-[#00e676] font-medium">
                        💡 {trend.suggested_action}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Action Button */}
              <button 
                onClick={() => onCreateContent?.(trend)}
                className="mt-3 w-full py-2 text-xs font-medium bg-[#00e676]/10 hover:bg-[#00e676]/20 text-[#00e676] rounded-lg transition-all"
              >
                Create Content →
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-400 text-sm">
            No weekly trends yet. Check back Monday!
          </p>
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={fetchWeeklyTrends}
        className="mt-4 w-full py-2 text-xs font-medium text-gray-400 hover:text-[#00e676] transition-colors"
      >
        🔄 Refresh Trends
      </button>
    </div>
  );
}

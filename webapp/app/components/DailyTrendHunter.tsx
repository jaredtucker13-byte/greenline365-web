'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface Trend {
  id?: string;
  title: string;
  description: string;
  location: string;
  event_date: string;
  expected_traffic: 'low' | 'medium' | 'high';
  category: string;
  suggested_action: string;
  expires_at?: string;
}

interface DailyTrendHunterProps {
  userId?: string;
  trendType?: 'live_pulse' | 'weekly_batch' | 'manual';
  onTrendsLoaded?: (trends: Trend[]) => void;
  onCreateContent?: (trend: Trend) => void;
  unlimitedAccess?: boolean; // For logged-in users
}

const MAX_FREE_USES = 3;
const STORAGE_KEY = 'trendHunter_usageCount';

export default function DailyTrendHunter({ 
  userId, 
  trendType = 'manual',
  onTrendsLoaded,
  onCreateContent,
  unlimitedAccess = false
}: DailyTrendHunterProps) {
  const [zipCode, setZipCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [error, setError] = useState('');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [usageCount, setUsageCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  // Load usage count from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined' || unlimitedAccess) return;
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const count = parseInt(stored, 10);
      setUsageCount(count);
      if (count >= MAX_FREE_USES) {
        setIsBlocked(true);
      }
    }
  }, [unlimitedAccess]);

  // Increment usage count
  const incrementUsage = () => {
    if (unlimitedAccess) return;
    
    const newCount = usageCount + 1;
    setUsageCount(newCount);
    localStorage.setItem(STORAGE_KEY, newCount.toString());
    
    if (newCount >= MAX_FREE_USES) {
      setIsBlocked(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if blocked before allowing search
    if (isBlocked && !unlimitedAccess) {
      return;
    }
    
    if (!/^\d{5}$/.test(zipCode)) {
      setError('Please enter a valid 5-digit zip code');
      return;
    }

    setLoading(true);
    setError('');
    setTrends([]);

    try {
      const response = await fetch('/api/daily-trend-hunter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode, userId, trendType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch trends');
      }

      // Increment usage on successful search
      incrementUsage();

      setTrends(data.trends || []);
      setExpiresAt(data.metadata?.expiresAt || null);
      
      if (onTrendsLoaded) {
        onTrendsLoaded(data.trends || []);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to fetch trends. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTrafficColor = (traffic: string) => {
    switch (traffic) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      sports: '⚽',
      community: '🏘️',
      business: '💼',
      entertainment: '🎭',
      weather: '🌤️'
    };
    return icons[category] || '📌';
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      {/* Blocked State - Hard Paywall */}
      {isBlocked && !unlimitedAccess && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <div className="bg-gradient-to-br from-gray-900 to-black border border-[#00e676]/30 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl shadow-[#00e676]/10">
            <div className="w-20 h-20 bg-[#00e676]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🔒</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              Free Trial Complete!
            </h3>
            <p className="text-gray-400 mb-2">
              You've used all <span className="text-[#00e676] font-semibold">3 free searches</span>.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Sign up to unlock unlimited trend hunting and discover local opportunities for your business.
            </p>
            
            <div className="space-y-3">
              <Link
                href="/signup"
                className="block w-full py-4 bg-[#00e676] hover:bg-[#00e676]/90 text-black font-bold rounded-xl transition-all transform hover:scale-105"
              >
                Sign Up Free →
              </Link>
              <Link
                href="/login"
                className="block w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all"
              >
                Already have an account? Sign In
              </Link>
            </div>
            
            <p className="text-gray-600 text-xs mt-6">
              ✨ Unlimited searches • 📊 Save trends • 🎯 Create content
            </p>
          </div>
        </motion.div>
      )}

      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Daily Trend Hunter 🎯
        </h2>
        <p className="text-gray-400 text-base md:text-lg">
          Discover local opportunities and trending topics in your area
        </p>
        
        {/* Usage Counter - Show remaining searches */}
        {!unlimitedAccess && !isBlocked && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
            <span className="text-gray-400 text-sm">Free searches remaining:</span>
            <span className="text-[#00e676] font-bold">{MAX_FREE_USES - usageCount}</span>
            <span className="text-gray-500 text-sm">/ {MAX_FREE_USES}</span>
          </div>
        )}
        
        {unlimitedAccess && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#00e676]/10 border border-[#00e676]/30 rounded-full">
            <span className="text-[#00e676] text-sm font-medium">✨ Unlimited Access</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="text"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
            placeholder="Enter ZIP code (e.g., 10001)"
            className="flex-1 px-6 py-4 bg-black/40 border border-[#00e676]/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#00e676] transition-all disabled:opacity-50"
            disabled={loading || isBlocked}
            maxLength={5}
          />
          <button
            type="submit"
            disabled={loading || zipCode.length !== 5 || isBlocked}
            className="px-8 py-4 bg-[#00e676] hover:bg-[#00e676]/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition-all transform hover:scale-105 active:scale-95"
          >
            {loading ? 'Finding...' : isBlocked ? '🔒 Locked' : 'Hunt Trends'}
          </button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-center max-w-md mx-auto"
          >
            {error}
          </motion.div>
        )}
      </form>

      <AnimatePresence mode="wait">
        {trends.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {trends.map((trend, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-xl border border-[#00e676]/20 rounded-2xl p-6 hover:border-[#00e676]/50 transition-all duration-300 hover:scale-105"
              >
                <div className="absolute -top-3 -right-3 w-12 h-12 bg-[#00e676] rounded-full flex items-center justify-center text-2xl shadow-lg shadow-[#00e676]/20">
                  {getCategoryIcon(trend.category)}
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-semibold uppercase tracking-wide ${getTrafficColor(trend.expected_traffic)}`}>
                    {trend.expected_traffic} traffic
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                  {trend.title}
                </h3>

                <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                  {trend.description}
                </p>

                {trend.suggested_action && (
                  <div className="bg-[#00e676]/10 border border-[#00e676]/20 rounded-xl p-3 mb-4">
                    <p className="text-[#00e676] text-sm font-medium">
                      💡 {trend.suggested_action}
                    </p>
                  </div>
                )}

                <button 
                  onClick={() => onCreateContent?.(trend)}
                  className="mt-4 w-full py-2 bg-[#00e676]/10 hover:bg-[#00e676]/20 border border-[#00e676]/30 text-[#00e676] font-medium rounded-lg transition-all text-sm"
                >
                  Forge Content →
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

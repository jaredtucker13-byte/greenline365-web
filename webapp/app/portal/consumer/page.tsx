'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { supabase, getProfile } from '@/lib/supabase/client';

interface DashboardStats {
  totalRedemptions: number;
  totalVisits: number;
  totalFavorites: number;
}

export default function ConsumerDashboard() {
  const [userName, setUserName] = useState('');
  const [stats, setStats] = useState<DashboardStats>({
    totalRedemptions: 0,
    totalVisits: 0,
    totalFavorites: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const profile = await getProfile(session.user.id);
      setUserName(profile?.full_name || session.user.email || 'there');

      // Load consumer stats
      const [consumerProfile, favorites] = await Promise.all([
        supabase
          .from('consumer_profiles')
          .select('total_redemptions, total_visits')
          .eq('user_id', session.user.id)
          .single(),
        supabase
          .from('consumer_favorites')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', session.user.id),
      ]);

      setStats({
        totalRedemptions: consumerProfile.data?.total_redemptions || 0,
        totalVisits: consumerProfile.data?.total_visits || 0,
        totalFavorites: favorites.count || 0,
      });

      setLoading(false);
    };

    loadDashboard();
  }, []);

  const statCards = [
    { label: 'Deals Redeemed', value: stats.totalRedemptions, icon: '🎟️', color: 'text-gold-400' },
    { label: 'Total Visits', value: stats.totalVisits, icon: '📍', color: 'text-blue-400' },
    { label: 'Favorites', value: stats.totalFavorites, icon: '❤️', color: 'text-red-400' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Welcome back, {userName.split(' ')[0]}!
        </h1>
        <p className="text-white/50 mt-1">Here&apos;s your activity overview</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white/[0.03] border border-white/10 rounded-xl p-4"
          >
            <div className="text-2xl mb-2">{stat.icon}</div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-white/40 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/directory"
            className="flex items-center gap-3 p-4 bg-white/[0.03] border border-white/10 rounded-xl hover:bg-white/[0.06] transition group"
          >
            <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-medium text-sm">Browse Directory</p>
              <p className="text-white/40 text-xs">Discover local businesses</p>
            </div>
          </Link>

          <Link
            href="/portal/consumer/deals"
            className="flex items-center gap-3 p-4 bg-white/[0.03] border border-white/10 rounded-xl hover:bg-white/[0.06] transition group"
          >
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-medium text-sm">My Deals</p>
              <p className="text-white/40 text-xs">View claimed coupons</p>
            </div>
          </Link>

          <Link
            href="/portal/consumer/favorites"
            className="flex items-center gap-3 p-4 bg-white/[0.03] border border-white/10 rounded-xl hover:bg-white/[0.06] transition group"
          >
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-medium text-sm">Favorites</p>
              <p className="text-white/40 text-xs">Your saved businesses</p>
            </div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

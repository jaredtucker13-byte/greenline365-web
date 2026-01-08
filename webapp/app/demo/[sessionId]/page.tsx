'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

// Demo profiles from config (would normally be loaded from database)
const demoProfiles: Record<string, {
  businessName: string;
  city: string;
  primaryColor: string;
  accentColor: string;
  industry: string;
}> = {
  'greenline365': {
    businessName: 'GreenLine365',
    city: 'Tampa, FL',
    primaryColor: '#39FF14',
    accentColor: '#0CE293',
    industry: 'technology',
  },
  'tampa-bay-bakery': {
    businessName: 'Tampa Bay Bakery',
    city: 'Tampa, FL',
    primaryColor: '#FF6B35',
    accentColor: '#F7C59F',
    industry: 'food_beverage',
  },
  'miami-auto-group': {
    businessName: 'Miami Auto Group',
    city: 'Miami, FL',
    primaryColor: '#00D4FF',
    accentColor: '#7B68EE',
    industry: 'automotive',
  },
  'orlando-med-spa': {
    businessName: 'Orlando Med Spa',
    city: 'Orlando, FL',
    primaryColor: '#E91E8C',
    accentColor: '#9B59B6',
    industry: 'healthcare',
  },
  'jacksonville-fitness': {
    businessName: 'Jacksonville Fitness',
    city: 'Jacksonville, FL',
    primaryColor: '#FFD700',
    accentColor: '#FF4500',
    industry: 'fitness',
  },
  'st-pete-realty': {
    businessName: 'St. Pete Realty',
    city: 'St. Petersburg, FL',
    primaryColor: '#4A90D9',
    accentColor: '#2ECC71',
    industry: 'real_estate',
  },
};

export default function DemoSessionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId as string;
  const profileParam = searchParams.get('profile');
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(demoProfiles['greenline365']);
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    async function loadSession() {
      // Try to load from database
      if (sessionId && !sessionId.startsWith('demo-')) {
        const { data, error } = await supabase
          .from('demo_sessions')
          .select('*, demo_profiles(*)')
          .eq('id', sessionId)
          .single();

        if (data && !error) {
          setSessionData(data);
          if (data.demo_profile_id && demoProfiles[data.demo_profile_id]) {
            setProfile(demoProfiles[data.demo_profile_id]);
          }
        }
      } else if (profileParam && demoProfiles[profileParam]) {
        // Use profile from URL param
        setProfile(demoProfiles[profileParam]);
      }

      setLoading(false);
    }

    loadSession();
  }, [sessionId, profileParam]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-white/60">Loading your demo experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#121212' }}>
      {/* Custom themed header */}
      <header 
        className="border-b py-4 px-6"
        style={{ borderColor: `${profile.primaryColor}30` }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-black"
              style={{ backgroundColor: profile.primaryColor }}
            >
              {profile.businessName.charAt(0)}
            </div>
            <div>
              <span className="text-white font-bold">{profile.businessName}</span>
              <p className="text-xs" style={{ color: profile.accentColor }}>{profile.city}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 rounded-full text-xs font-mono" style={{ 
              backgroundColor: `${profile.primaryColor}20`,
              color: profile.primaryColor,
              border: `1px solid ${profile.primaryColor}40`
            }}>
              DEMO MODE
            </span>
            <Link 
              href="/"
              className="text-white/60 hover:text-white text-sm transition"
            >
              Exit Demo
            </Link>
          </div>
        </div>
      </header>

      {/* Demo Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Welcome to Your <span style={{ color: profile.primaryColor }}>{profile.businessName}</span> Demo
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto">
            Experience how GreenLine365 would look and feel customized for your {profile.industry.replace('_', ' ')} business.
          </p>
        </motion.div>

        {/* Demo Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#1A1A1A] rounded-2xl p-6 border"
            style={{ borderColor: `${profile.primaryColor}30` }}
          >
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
              style={{ backgroundColor: `${profile.primaryColor}20` }}
            >
              📅
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Smart Scheduling</h3>
            <p className="text-white/60 text-sm">
              AI-powered booking system that learns your preferences and optimizes your calendar.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#1A1A1A] rounded-2xl p-6 border"
            style={{ borderColor: `${profile.primaryColor}30` }}
          >
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
              style={{ backgroundColor: `${profile.accentColor}20` }}
            >
              📣
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Content Automation</h3>
            <p className="text-white/60 text-sm">
              Schedule posts, generate content ideas, and maintain consistent social presence.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#1A1A1A] rounded-2xl p-6 border"
            style={{ borderColor: `${profile.primaryColor}30` }}
          >
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
              style={{ backgroundColor: `${profile.primaryColor}20` }}
            >
              📊
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Local Intelligence</h3>
            <p className="text-white/60 text-sm">
              Real-time insights on local events and trends relevant to {profile.city}.
            </p>
          </motion.div>
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] rounded-2xl p-8 border"
          style={{ borderColor: `${profile.primaryColor}30` }}
        >
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-white/60 mb-6 max-w-lg mx-auto">
            Join businesses across Florida who are already using GreenLine365 to streamline their operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/admin-v2"
              className="px-8 py-4 rounded-xl font-bold transition text-black"
              style={{ backgroundColor: profile.primaryColor }}
            >
              Explore Command Center
            </Link>
            <Link
              href="/waitlist"
              className="px-8 py-4 rounded-xl font-semibold border transition text-white hover:bg-white/5"
              style={{ borderColor: `${profile.primaryColor}50` }}
            >
              Join Waitlist
            </Link>
          </div>
        </motion.div>

        {/* Session Info (for debugging) */}
        {sessionData && (
          <div className="mt-8 p-4 bg-white/5 rounded-xl text-xs font-mono text-white/40">
            <p>Session ID: {sessionId}</p>
            <p>Profile: {sessionData.demo_profile_id}</p>
            <p>Created: {new Date(sessionData.created_at).toLocaleString()}</p>
          </div>
        )}
      </main>
    </div>
  );
}

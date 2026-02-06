'use client';

/**
 * Commander Dashboard - Property Intelligence HQ
 * The central command for the Property-First system.
 * Shows active properties, recent calls, emergency alerts, and quick stats.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useBusiness } from '@/lib/business';
import CollapsibleSidebar from '../components/CollapsibleSidebar';
import { PageHeader } from '../components/PageHeader';

interface PropertySummary {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  full_address: string;
  contacts: { id: string; first_name: string; last_name: string }[];
  assets: { id: string; asset_type: string }[];
  created_at: string;
}

interface RecentInteraction {
  id: string;
  type: string;
  summary: string;
  sentiment_score: number;
  property_id: string;
  created_at: string;
  property?: { full_address: string };
}

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } }
};

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export default function CommanderDashboard() {
  const router = useRouter();
  const { activeBusiness } = useBusiness();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [interactions, setInteractions] = useState<RecentInteraction[]>([]);
  const [stats, setStats] = useState({ totalProperties: 0, totalContacts: 0, totalAssets: 0, avgHealth: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeBusiness?.id) return;
    loadData();
  }, [activeBusiness?.id]);

  async function loadData() {
    if (!activeBusiness?.id) return;
    setLoading(true);

    const [propRes, interRes] = await Promise.all([
      supabase
        .from('properties')
        .select('id, address_line1, city, state, zip_code, full_address, created_at, contacts(id, first_name, last_name), assets(id, asset_type)')
        .eq('tenant_id', activeBusiness.id)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('interactions')
        .select('id, interaction_type, summary, sentiment_score, property_id, created_at')
        .eq('tenant_id', activeBusiness.id)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const props = propRes.data || [];
    setProperties(props);
    setInteractions(interRes.data || []);

    const totalContacts = props.reduce((sum: number, p: any) => sum + (p.contacts?.length || 0), 0);
    const totalAssets = props.reduce((sum: number, p: any) => sum + (p.assets?.length || 0), 0);

    setStats({
      totalProperties: props.length,
      totalContacts,
      totalAssets,
      avgHealth: props.length > 0 ? 78 : 0, // Placeholder until health scores are calculated
    });
    setLoading(false);
  }

  const kpiCards = [
    { label: 'Active Properties', value: stats.totalProperties, icon: 'home', color: '#39FF14' },
    { label: 'Linked Contacts', value: stats.totalContacts, icon: 'users', color: '#0CE293' },
    { label: 'Tracked Assets', value: stats.totalAssets, icon: 'wrench', color: '#00D4FF' },
    { label: 'Avg Health Score', value: `${stats.avgHealth}%`, icon: 'heart', color: stats.avgHealth >= 70 ? '#39FF14' : stats.avgHealth >= 40 ? '#FFB800' : '#FF4444' },
  ];

  return (
    <div className="min-h-screen flex relative" style={{ background: '#0A0A0A' }}>
      <CollapsibleSidebar
        activeItem="commander"
        onNewBooking={() => {}}
        onNewContent={() => {}}
        pendingCount={0}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={mobileMenuOpen}
        onMobileToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      <div className="flex-1 min-w-0 relative z-10 p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #39FF14, #0CE293)', boxShadow: '0 0 20px rgba(57,255,20,0.3)' }}>
              <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white" data-testid="commander-title">Commander</h1>
              <p className="text-sm text-zinc-500">Property Intelligence HQ</p>
            </div>
          </div>
        </div>

        {/* KPI Strip */}
        <motion.div variants={stagger} initial="initial" animate="animate" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpiCards.map((kpi) => (
            <motion.div
              key={kpi.label}
              variants={fadeUp}
              className="backdrop-blur-xl rounded-2xl p-5 border"
              style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
              data-testid={`kpi-${kpi.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">{kpi.label}</p>
              <p className="text-3xl font-bold" style={{ color: kpi.color }}>{loading ? '--' : kpi.value}</p>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Properties List */}
          <div className="lg:col-span-2 backdrop-blur-xl rounded-2xl border p-6" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">Properties</h2>
              <Link
                href="/admin-v2/property-passport"
                className="text-xs px-3 py-1.5 rounded-lg transition"
                style={{ background: 'rgba(57,255,20,0.1)', color: '#39FF14', border: '1px solid rgba(57,255,20,0.2)' }}
                data-testid="view-all-properties"
              >
                View All
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-12 h-12 mx-auto mb-3 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <p className="text-zinc-500 text-sm">No properties yet</p>
                <p className="text-zinc-600 text-xs mt-1">Properties are created when calls come in or manually added</p>
              </div>
            ) : (
              <div className="space-y-2">
                {properties.slice(0, 8).map((prop) => (
                  <Link
                    key={prop.id}
                    href={`/admin-v2/property-passport?id=${prop.id}`}
                    className="flex items-center gap-4 p-3 rounded-xl transition hover:bg-white/5 group"
                    data-testid={`property-row-${prop.id}`}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(57,255,20,0.1)' }}>
                      <svg className="w-5 h-5" style={{ color: '#39FF14' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{prop.full_address || `${prop.address_line1}, ${prop.city}`}</p>
                      <p className="text-xs text-zinc-500">
                        {prop.contacts?.length || 0} contacts, {prop.assets?.length || 0} assets
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Recent Activity + Quick Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="backdrop-blur-xl rounded-2xl border p-5" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <h3 className="text-sm font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  href="/admin-v2/property-passport"
                  className="flex items-center gap-3 p-3 rounded-xl transition hover:bg-white/5"
                  data-testid="quick-action-passport"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,212,255,0.1)' }}>
                    <svg className="w-4 h-4" style={{ color: '#00D4FF' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <span className="text-sm text-zinc-300">Property Passports</span>
                </Link>
                <Link
                  href="/admin-v2/filing-cabinet"
                  className="flex items-center gap-3 p-3 rounded-xl transition hover:bg-white/5"
                  data-testid="quick-action-cabinet"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,184,0,0.1)' }}>
                    <svg className="w-4 h-4" style={{ color: '#FFB800' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </div>
                  <span className="text-sm text-zinc-300">Filing Cabinet</span>
                </Link>
                <Link
                  href="/admin-v2?view=schedule"
                  className="flex items-center gap-3 p-3 rounded-xl transition hover:bg-white/5"
                  data-testid="quick-action-schedule"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.1)' }}>
                    <svg className="w-4 h-4" style={{ color: '#8B5CF6' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-sm text-zinc-300">Schedule</span>
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="backdrop-blur-xl rounded-2xl border p-5" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <h3 className="text-sm font-semibold text-white mb-4">Recent Activity</h3>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
                  ))}
                </div>
              ) : interactions.length === 0 ? (
                <p className="text-zinc-600 text-xs text-center py-6">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {interactions.slice(0, 5).map((int) => (
                    <div key={int.id} className="flex items-start gap-3" data-testid={`activity-${int.id}`}>
                      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{
                        background: int.sentiment_score > 0.5 ? '#39FF14' : int.sentiment_score > 0 ? '#FFB800' : '#FF4444'
                      }} />
                      <div className="min-w-0">
                        <p className="text-xs text-zinc-300 truncate">{int.summary || int.type}</p>
                        <p className="text-[10px] text-zinc-600">{new Date(int.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Emergency Alert Feed (Placeholder) */}
            <div className="backdrop-blur-xl rounded-2xl border p-5" style={{ background: 'rgba(255,68,68,0.03)', borderColor: 'rgba(255,68,68,0.1)' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <h3 className="text-sm font-semibold text-red-400">Emergency Alerts</h3>
              </div>
              <p className="text-zinc-600 text-xs text-center py-4">No active alerts</p>
              <p className="text-zinc-700 text-[10px] text-center">Alerts trigger when emergency keywords are detected mid-call</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

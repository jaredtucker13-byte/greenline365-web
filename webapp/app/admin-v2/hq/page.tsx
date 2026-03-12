'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface DashboardData {
  kpis: {
    totalBusinesses: number;
    activeBusinesses: number;
    totalUsers: number;
    adminUsers: number;
    totalBookings: number;
    totalLeads: number;
    totalWaitlist: number;
    totalNewsletter: number;
    newBusinesses30d: number;
  };
  tierBreakdown: Record<string, number>;
  recentBusinesses: Array<{
    id: string;
    name: string;
    slug: string;
    tier: string;
    is_active: boolean;
    created_at: string;
  }>;
  recentWaitlist: Array<{
    id: string;
    email: string;
    company: string | null;
    status: string;
    created_at: string;
  }>;
}

export default function HQDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/hq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dashboard' }),
      });
      if (!res.ok) throw new Error('Failed to load dashboard');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-white/5 rounded-lg" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-28 bg-white/5 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-red-400">
          <p className="font-medium">Failed to load dashboard</p>
          <p className="text-sm mt-1 text-red-400/60">{error}</p>
          <button onClick={fetchData} className="mt-3 px-4 py-2 bg-red-500/20 rounded-lg text-sm hover:bg-red-500/30 transition">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { kpis, tierBreakdown, recentBusinesses, recentWaitlist } = data;

  const tierLabels: Record<string, string> = { tier1: 'Starter', tier2: 'Pro', tier3: 'Enterprise' };
  const tierColors: Record<string, string> = { tier1: '#60A5FA', tier2: '#A78BFA', tier3: '#34D399' };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Platform Dashboard</h1>
          <p className="text-sm text-white/40 mt-1">Greenline365 HQ &mdash; real-time platform overview</p>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white/60 text-sm hover:bg-white/[0.1] transition"
        >
          Refresh
        </button>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard label="Total Tenants" value={kpis.totalBusinesses} accent="#34D399" icon={BuildingIcon} />
        <KPICard label="Active Tenants" value={kpis.activeBusinesses} accent="#34D399" icon={CheckIcon} />
        <KPICard label="Total Users" value={kpis.totalUsers} accent="#60A5FA" icon={UsersIcon} />
        <KPICard label="Admin Users" value={kpis.adminUsers} accent="#F59E0B" icon={ShieldIcon} />
      </div>

      {/* Secondary KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard label="Total Bookings" value={kpis.totalBookings} accent="#A78BFA" icon={CalendarIcon} />
        <KPICard label="CRM Leads" value={kpis.totalLeads} accent="#F472B6" icon={TargetIcon} />
        <KPICard label="Waitlist" value={kpis.totalWaitlist} accent="#FB923C" icon={ClockIcon} />
        <KPICard label="Newsletter Subs" value={kpis.totalNewsletter} accent="#2DD4BF" icon={MailIcon} />
      </div>

      {/* Middle Row: Tier Breakdown + Recent Signups */}
      <div className="grid grid-cols-3 gap-6">
        {/* Tier Breakdown */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
          <h3 className="text-sm font-medium text-white/60 mb-5">Tier Distribution</h3>
          <div className="space-y-4">
            {(Object.entries(tierBreakdown) as [string, number][]).map(([tier, count]) => {
              const total = kpis.totalBusinesses || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={tier}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-white/80 font-medium">{tierLabels[tier] || tier}</span>
                    <span className="text-xs text-white/40">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: tierColors[tier] || '#60A5FA' }}
                    />
                  </div>
                </div>
              );
            })}
            {Object.keys(tierBreakdown).length === 0 && (
              <p className="text-white/30 text-sm">No tenants yet</p>
            )}
          </div>
          <div className="mt-5 pt-4 border-t border-white/[0.06]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40">New (30d)</span>
              <span className="text-sm font-semibold text-gold-400">+{kpis.newBusinesses30d}</span>
            </div>
          </div>
        </div>

        {/* Recent Businesses */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-white/60">Recent Tenants</h3>
            <Link href="/admin-v2/hq/tenants" className="text-xs text-gold-400 hover:text-gold-300 transition">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentBusinesses.map((b: DashboardData['recentBusinesses'][0]) => (
              <div key={b.id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: tierColors[b.tier] + '30', border: `1px solid ${tierColors[b.tier]}40` }}
                  >
                    {b.name[0]}
                  </div>
                  <div>
                    <p className="text-sm text-white/80 font-medium">{b.name}</p>
                    <p className="text-[11px] text-white/30">{b.slug} &middot; {tierLabels[b.tier]}</p>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${b.is_active ? 'bg-gold-500/15 text-gold-400' : 'bg-red-500/15 text-red-400'}`}>
                  {b.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
            {recentBusinesses.length === 0 && (
              <p className="text-white/30 text-sm">No tenants yet</p>
            )}
          </div>
        </div>

        {/* Recent Waitlist */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-white/60">Recent Waitlist</h3>
            <span className="text-xs text-white/30">{kpis.totalWaitlist} total</span>
          </div>
          <div className="space-y-3">
            {recentWaitlist.map((w: DashboardData['recentWaitlist'][0]) => (
              <div key={w.id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                <div>
                  <p className="text-sm text-white/80 font-medium">{w.email}</p>
                  <p className="text-[11px] text-white/30">{w.company || 'No company'} &middot; {new Date(w.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  w.status === 'approved' ? 'bg-gold-500/15 text-gold-400'
                  : w.status === 'invited' ? 'bg-blue-500/15 text-blue-400'
                  : 'bg-amber-500/15 text-amber-400'
                }`}>
                  {w.status}
                </span>
              </div>
            ))}
            {recentWaitlist.length === 0 && (
              <p className="text-white/30 text-sm">No waitlist entries</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Listings Management', href: '/admin-v2/hq/listings', color: '#C9A84C' },
          { label: 'Manage Tenants', href: '/admin-v2/hq/tenants', color: '#34D399' },
          { label: 'User Management', href: '/admin-v2/hq/users', color: '#60A5FA' },
          { label: 'Billing Overview', href: '/admin-v2/hq/billing', color: '#A78BFA' },
          { label: 'Platform Analytics', href: '/admin-v2/hq/analytics', color: '#F472B6' },
          { label: 'System Health', href: '/admin-v2/hq/system', color: '#FB923C' },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.06] transition-all duration-200"
          >
            <div className="w-2 h-2 rounded-full mb-3" style={{ backgroundColor: link.color, boxShadow: `0 0 10px ${link.color}40` }} />
            <p className="text-sm font-medium text-white/70 group-hover:text-white/90 transition">{link.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── KPI Card Component ──────────────────────────────────────────────────────

function KPICard({ label, value, accent, icon: Icon }: {
  label: string;
  value: number;
  accent: string;
  icon: React.ComponentType<{ color: string }>;
}) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 relative overflow-hidden group hover:bg-white/[0.05] transition-all duration-200">
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.03] -translate-y-1/2 translate-x-1/2" style={{ backgroundColor: accent }} />
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: accent + '15', border: `1px solid ${accent}20` }}>
          <Icon color={accent} />
        </div>
      </div>
      <p className="text-2xl font-semibold text-white tracking-tight">{value.toLocaleString()}</p>
      <p className="text-xs text-white/40 mt-1">{label}</p>
    </div>
  );
}

// ─── Inline Icon Components ──────────────────────────────────────────────────

function BuildingIcon({ color }: { color: string }) {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function UsersIcon({ color }: { color: string }) {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function ShieldIcon({ color }: { color: string }) {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function CalendarIcon({ color }: { color: string }) {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function TargetIcon({ color }: { color: string }) {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.5}>
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function ClockIcon({ color }: { color: string }) {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function MailIcon({ color }: { color: string }) {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface DirectoryListing {
  id: string;
  business_name: string;
  slug: string;
  industry: string;
  phone: string | null;
  website: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  tier: string;
  is_claimed: boolean;
  is_published: boolean;
  cover_image_url: string | null;
  trust_score: number;
  avg_feedback_rating: number;
  total_feedback_count: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface ListingsData {
  listings: DirectoryListing[];
  total: number;
  page: number;
  totalPages: number;
  kpis: {
    totalListings: number;
    claimed: number;
    published: number;
    premium: number;
  };
}

export default function HQListingsManagement() {
  const [data, setData] = useState<ListingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [claimFilter, setClaimFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/hq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'listings',
          search: search || undefined,
          claimStatus: claimFilter || undefined,
          status: statusFilter || undefined,
          page,
        }),
      });
      if (!res.ok) throw new Error('Failed to load listings');
      const json = await res.json();
      setData(json);
    } catch {
      // Silent fail — UI shows empty state
    } finally {
      setLoading(false);
    }
  }, [search, claimFilter, statusFilter, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const togglePublished = async (listing: DirectoryListing) => {
    setTogglingId(listing.id);
    await fetch('/api/admin/hq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'listing-toggle-status',
        listingId: listing.id,
        is_published: !listing.is_published,
      }),
    });
    await fetchData();
    setTogglingId(null);
  };

  const toggleVerified = async (listing: DirectoryListing) => {
    setTogglingId(listing.id);
    await fetch('/api/admin/hq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'listing-toggle-verified',
        listingId: listing.id,
        is_claimed: !listing.is_claimed,
      }),
    });
    await fetchData();
    setTogglingId(null);
  };

  const kpis = data?.kpis;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Listings Management</h1>
          <p className="text-sm text-white/40 mt-1">Directory listings &mdash; manage status, verification, and health</p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchData(); }}
          className="px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white/60 text-sm hover:bg-white/[0.1] transition"
        >
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-4 gap-4">
          <KPICard label="Total Listings" value={kpis.totalListings} accent="#60A5FA" />
          <KPICard label="Claimed (Verified)" value={kpis.claimed} accent="#34D399" />
          <KPICard label="Published" value={kpis.published} accent="#A78BFA" />
          <KPICard label="Premium Tier" value={kpis.premium} accent="#F59E0B" />
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search by Business Name or Domain..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-gold-400/30"
          />
        </div>
        <select
          value={claimFilter}
          onChange={(e) => { setClaimFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white/70 focus:outline-none appearance-none cursor-pointer"
        >
          <option value="">All Claims</option>
          <option value="claimed">Claimed</option>
          <option value="unclaimed">Unclaimed</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white/70 focus:outline-none appearance-none cursor-pointer"
        >
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-5 h-5 border-2 border-gold-400/30 border-t-gold-400 rounded-full animate-spin mx-auto" />
            <p className="text-white/30 text-sm mt-3">Loading listings...</p>
          </div>
        ) : !data?.listings?.length ? (
          <div className="p-12 text-center">
            <p className="text-white/30 text-sm">No listings found</p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_140px] gap-4 px-5 py-3 border-b border-white/[0.06] text-[10px] text-white/30 font-semibold uppercase tracking-wider">
              <span>Business</span>
              <span>Domain</span>
              <span>Revenue</span>
              <span>Verification</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>

            {/* Table Rows */}
            {data.listings.map((listing) => {
              const domain = listing.website ? listing.website.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '') : '—';
              const hasAI = listing.metadata?.ai_widget_active;
              const hasLedger = listing.metadata?.home_ledger_enabled;
              const isPremium = listing.tier === 'premium';
              const isPro = listing.tier === 'pro';
              const isToggling = togglingId === listing.id;

              return (
                <div
                  key={listing.id}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_140px] gap-4 px-5 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.02] transition items-center"
                >
                  {/* Business Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {listing.cover_image_url ? (
                        <img src={listing.cover_image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-white/30">{listing.business_name[0]}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white/80 font-medium truncate">{listing.business_name}</p>
                      <p className="text-[11px] text-white/30 truncate">
                        {listing.city}{listing.state ? `, ${listing.state}` : ''} &middot; {listing.industry.replace(/-/g, ' ')}
                      </p>
                    </div>
                  </div>

                  {/* Domain */}
                  <div className="min-w-0">
                    {listing.website ? (
                      <a href={listing.website.startsWith('http') ? listing.website : `https://${listing.website}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400/80 hover:text-blue-400 truncate block transition">
                        {domain}
                      </a>
                    ) : (
                      <span className="text-xs text-white/20">—</span>
                    )}
                  </div>

                  {/* Revenue Status Badges */}
                  <div className="flex flex-wrap gap-1">
                    {isPremium && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/20">Premium</span>
                    )}
                    {isPro && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-500/15 text-blue-400 border border-blue-500/20">Pro</span>
                    )}
                    {hasAI && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-purple-500/15 text-purple-400 border border-purple-500/20" title="AI Widget Active">AI</span>
                    )}
                    {hasLedger && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" title="Home Ledger Enabled">Ledger</span>
                    )}
                    {!isPremium && !isPro && !hasAI && !hasLedger && (
                      <span className="text-[10px] text-white/20">Free</span>
                    )}
                  </div>

                  {/* Verification Toggle */}
                  <div>
                    <button
                      onClick={() => toggleVerified(listing)}
                      disabled={isToggling}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold transition cursor-pointer ${
                        listing.is_claimed
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25'
                          : 'bg-white/[0.04] text-white/30 border border-white/[0.08] hover:bg-white/[0.08]'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${listing.is_claimed ? 'bg-emerald-400' : 'bg-white/20'}`} />
                      {listing.is_claimed ? 'Verified' : 'Unverified'}
                    </button>
                  </div>

                  {/* Status Toggle */}
                  <div>
                    <button
                      onClick={() => togglePublished(listing)}
                      disabled={isToggling}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold transition cursor-pointer ${
                        listing.is_published
                          ? 'bg-gold-500/15 text-gold-400 border border-gold-500/20 hover:bg-gold-500/25'
                          : 'bg-red-500/10 text-red-400/60 border border-red-500/15 hover:bg-red-500/20'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${listing.is_published ? 'bg-gold-400' : 'bg-red-400/60'}`} />
                      {listing.is_published ? 'Published' : 'Draft'}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1.5">
                    <Link
                      href={`/listing/${listing.slug}`}
                      target="_blank"
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-white/40 border border-white/[0.08] hover:bg-white/[0.06] hover:text-white/60 transition"
                      title="View Live"
                    >
                      View
                    </Link>
                    <Link
                      href={`/portal/listing?id=${listing.id}`}
                      target="_blank"
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-gold-400/70 border border-gold-500/15 hover:bg-gold-500/10 hover:text-gold-400 transition"
                      title="Manage Content / Login as Tenant"
                    >
                      Manage
                    </Link>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/30">
            Showing {((data.page - 1) * 25) + 1}–{Math.min(data.page * 25, data.total)} of {data.total}
          </p>
          <div className="flex gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-xs text-white/50 border border-white/[0.08] hover:bg-white/[0.06] disabled:opacity-30 transition"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages}
              className="px-3 py-1.5 rounded-lg text-xs text-white/50 border border-white/[0.08] hover:bg-white/[0.06] disabled:opacity-30 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KPICard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 relative overflow-hidden group hover:bg-white/[0.05] transition-all duration-200">
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.03] -translate-y-1/2 translate-x-1/2" style={{ backgroundColor: accent }} />
      <p className="text-2xl font-semibold text-white tracking-tight">{value.toLocaleString()}</p>
      <p className="text-xs text-white/40 mt-1">{label}</p>
    </div>
  );
}

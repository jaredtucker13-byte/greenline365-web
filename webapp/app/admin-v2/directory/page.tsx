'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { POLL_TEMPLATES, getTemplatesForIndustry, type PollTemplate } from '@/lib/poll-templates';

// ─── TYPES ───

interface Listing {
  id: string;
  business_name: string;
  slug: string;
  industry: string;
  city: string | null;
  state: string | null;
  tier: string;
  is_claimed: boolean;
  is_published: boolean;
  trust_score: number;
  avg_feedback_rating: number;
  total_feedback_count: number;
  cover_image_url: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

interface DirectoryStats {
  total: number;
  claimed: number;
  unclaimed: number;
  free: number;
  pro: number;
  premium: number;
}

interface Badge {
  id: string;
  badge_type: string;
  badge_label: string;
  badge_color: string;
  is_active: boolean;
  earned_at: string;
}

interface Review {
  id: string;
  rating: number;
  feedback_text: string;
  submitter_name: string;
  is_red_flag: boolean;
  red_flag_type: string | null;
  created_at: string;
}

// ─── BADGE OPTIONS ───

const BADGE_OPTIONS = [
  { type: 'intelligence_verified', label: 'Intelligence Verified', color: '#C9A84C', icon: 'shield' },
  { type: 'spotless_pro', label: 'Spotless Pro', color: '#3B82F6', icon: 'sparkles' },
  { type: 'local_vibe_elite', label: 'Local Vibe Elite', color: '#8B5CF6', icon: 'music' },
  { type: 'master_technician', label: 'Master Technician', color: '#F59E0B', icon: 'wrench' },
  { type: 'safety_certified', label: 'Safety Certified', color: '#EF4444', icon: 'shield' },
  { type: 'service_5star', label: 'Service 5-Star', color: '#EC4899', icon: 'star' },
  { type: 'booking_pro', label: 'Booking Pro', color: '#06B6D4', icon: 'calendar' },
  { type: 'community_favorite', label: 'Community Favorite', color: '#10B981', icon: 'heart' },
];

const TIER_COLORS: Record<string, string> = {
  free: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
  pro: 'text-green-400 bg-green-500/10 border-green-500/20',
  premium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
};

// ─── MAIN COMPONENT ───

export default function AdminDirectoryPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<DirectoryStats>({ total: 0, claimed: 0, unclaimed: 0, free: 0, pro: 0, premium: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState('');
  const [filterClaimed, setFilterClaimed] = useState('');
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(0);

  // Detail panel state
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailBadges, setDetailBadges] = useState<Badge[]>([]);
  const [detailReviews, setDetailReviews] = useState<Review[]>([]);
  const [detailPolls, setDetailPolls] = useState<any[]>([]);

  // Edit state
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Badge award modal
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(BADGE_OPTIONS[0]);

  // Poll create modal
  const [showPollModal, setShowPollModal] = useState(false);

  const PAGE_SIZE = 50;

  const loadListings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filterTier) params.set('tier', filterTier);
    if (filterClaimed) params.set('claimed', filterClaimed);
    params.set('limit', String(PAGE_SIZE));
    params.set('offset', String(page * PAGE_SIZE));

    const res = await fetch(`/api/admin/directory?${params}`);
    if (res.ok) {
      const data = await res.json();
      setListings(data.listings || []);
      setTotalResults(data.total || 0);
      setStats(data.stats || stats);
    }
    setLoading(false);
  }, [search, filterTier, filterClaimed, page]);

  useEffect(() => { loadListings(); }, [loadListings]);

  const loadDetail = async (listing: Listing) => {
    setSelectedListing(listing);
    setDetailLoading(true);
    setEditForm({
      business_name: listing.business_name,
      tier: listing.tier,
      industry: listing.industry,
      city: listing.city || '',
      state: listing.state || '',
      phone: listing.phone || '',
      email: listing.email || '',
      is_published: listing.is_published,
      is_claimed: listing.is_claimed,
    });

    const res = await fetch(`/api/admin/directory?id=${listing.id}`);
    if (res.ok) {
      const data = await res.json();
      setDetailBadges(data.listing?.directory_badges || []);
      setDetailReviews(data.reviews || []);
      setDetailPolls(data.polls || []);
      // Update with full data
      setSelectedListing(data.listing);
    }
    setDetailLoading(false);
  };

  const saveListing = async () => {
    if (!selectedListing) return;
    setSaving(true);
    setActionMessage(null);

    const res = await fetch('/api/admin/directory', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selectedListing.id, ...editForm }),
    });

    if (res.ok) {
      setActionMessage({ type: 'success', text: 'Listing updated.' });
      loadListings();
      // Refresh detail
      const updated = await res.json();
      if (updated.listing) setSelectedListing(updated.listing);
    } else {
      const err = await res.json();
      setActionMessage({ type: 'error', text: err.error || 'Update failed.' });
    }
    setSaving(false);
    setTimeout(() => setActionMessage(null), 3000);
  };

  const awardBadge = async () => {
    if (!selectedListing) return;
    const res = await fetch('/api/admin/directory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'award_badge',
        listing_id: selectedListing.id,
        badge_type: selectedBadge.type,
        badge_label: selectedBadge.label,
        badge_color: selectedBadge.color,
        badge_icon: selectedBadge.icon,
      }),
    });
    if (res.ok) {
      setActionMessage({ type: 'success', text: `Badge "${selectedBadge.label}" awarded.` });
      setShowBadgeModal(false);
      loadDetail(selectedListing);
    } else {
      setActionMessage({ type: 'error', text: 'Failed to award badge.' });
    }
    setTimeout(() => setActionMessage(null), 3000);
  };

  const revokeBadge = async (badgeId: string) => {
    const res = await fetch('/api/admin/directory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'revoke_badge', badge_id: badgeId, reason: 'Admin revoked' }),
    });
    if (res.ok && selectedListing) {
      setActionMessage({ type: 'success', text: 'Badge revoked.' });
      loadDetail(selectedListing);
    }
    setTimeout(() => setActionMessage(null), 3000);
  };

  const createPoll = async (template: PollTemplate) => {
    if (!selectedListing) return;
    const res = await fetch('/api/admin/directory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_poll',
        listing_id: selectedListing.id,
        title: template.name,
        questions: template.questions,
      }),
    });
    if (res.ok) {
      setActionMessage({ type: 'success', text: `Poll "${template.name}" created.` });
      setShowPollModal(false);
      loadDetail(selectedListing);
    }
    setTimeout(() => setActionMessage(null), 3000);
  };

  const deleteReview = async (reviewId: string) => {
    const res = await fetch('/api/admin/directory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_review', review_id: reviewId }),
    });
    if (res.ok && selectedListing) {
      setActionMessage({ type: 'success', text: 'Review deleted.' });
      loadDetail(selectedListing);
    }
    setTimeout(() => setActionMessage(null), 3000);
  };

  const flagReview = async (reviewId: string) => {
    const res = await fetch('/api/admin/directory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'flag_review', review_id: reviewId }),
    });
    if (res.ok && selectedListing) {
      setActionMessage({ type: 'success', text: 'Review flagged.' });
      loadDetail(selectedListing);
    }
    setTimeout(() => setActionMessage(null), 3000);
  };

  const unpublishListing = async (id: string) => {
    const res = await fetch(`/api/admin/directory?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setActionMessage({ type: 'success', text: 'Listing unpublished.' });
      setSelectedListing(null);
      loadListings();
    }
    setTimeout(() => setActionMessage(null), 3000);
  };

  const inputClass = 'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#39FF14]/50 focus:outline-none focus:ring-1 focus:ring-[#39FF14]/50';

  return (
    <div className="min-h-screen p-6" style={{ color: 'var(--theme-text-primary, #fff)' }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Directory Manager</h1>
        <p className="text-sm text-white/50 mt-1">Browse, edit, and manage all directory listings.</p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-white' },
          { label: 'Claimed', value: stats.claimed, color: 'text-green-400' },
          { label: 'Unclaimed', value: stats.unclaimed, color: 'text-yellow-400' },
          { label: 'Free', value: stats.free, color: 'text-gray-400' },
          { label: 'Pro', value: stats.pro, color: 'text-green-400' },
          { label: 'Premium', value: stats.premium, color: 'text-amber-400' },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-xl border border-white/10 p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <span className="text-[10px] text-white/40 uppercase tracking-wider block">{kpi.label}</span>
            <span className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search name, city, industry..."
          className={`${inputClass} max-w-xs`}
        />
        <select
          value={filterTier}
          onChange={e => { setFilterTier(e.target.value); setPage(0); }}
          className={`${inputClass} max-w-[140px]`}
        >
          <option value="">All Tiers</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="premium">Premium</option>
        </select>
        <select
          value={filterClaimed}
          onChange={e => { setFilterClaimed(e.target.value); setPage(0); }}
          className={`${inputClass} max-w-[160px]`}
        >
          <option value="">All Listings</option>
          <option value="true">Claimed Only</option>
          <option value="false">Unclaimed Only</option>
        </select>
        <span className="flex items-center text-xs text-white/30 ml-auto">
          {totalResults} results
        </span>
      </div>

      {/* Action message */}
      <AnimatePresence>
        {actionMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mb-4 rounded-lg px-4 py-3 text-sm ${
              actionMessage.type === 'success'
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}
          >
            {actionMessage.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-6">
        {/* Listings Table */}
        <div className={`flex-1 min-w-0 ${selectedListing ? 'max-w-[55%]' : ''}`}>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-[#39FF14]/30 border-t-[#39FF14] rounded-full animate-spin" />
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-20 text-white/30 text-sm">No listings found.</div>
          ) : (
            <div className="space-y-1">
              {listings.map(listing => (
                <button
                  key={listing.id}
                  onClick={() => loadDetail(listing)}
                  className={`w-full text-left rounded-xl border p-4 transition-all hover:border-[#39FF14]/30 ${
                    selectedListing?.id === listing.id
                      ? 'border-[#39FF14]/40 bg-[#39FF14]/5'
                      : 'border-white/5 hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {listing.cover_image_url ? (
                        <img src={listing.cover_image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-white/20">{listing.business_name[0]}</span>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white truncate">{listing.business_name}</span>
                        <span className={`text-[10px] font-semibold uppercase rounded-full px-2 py-0.5 border ${TIER_COLORS[listing.tier] || TIER_COLORS.free}`}>
                          {listing.tier}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px] text-white/40">{listing.industry?.replace(/-/g, ' ')}</span>
                        {listing.city && <span className="text-[11px] text-white/30">{listing.city}, {listing.state}</span>}
                      </div>
                    </div>
                    {/* Status indicators */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {listing.is_claimed && (
                        <span className="w-2 h-2 rounded-full bg-green-400" title="Claimed" />
                      )}
                      {!listing.is_published && (
                        <span className="text-[10px] text-red-400 bg-red-500/10 rounded-full px-2 py-0.5">Hidden</span>
                      )}
                      {listing.avg_feedback_rating > 0 && (
                        <span className="text-[11px] text-amber-400">{listing.avg_feedback_rating.toFixed(1)}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}

              {/* Pagination */}
              {totalResults > PAGE_SIZE && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3 py-1.5 rounded-lg text-xs text-white/40 border border-white/10 hover:bg-white/5 disabled:opacity-30"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-white/30">
                    Page {page + 1} of {Math.ceil(totalResults / PAGE_SIZE)}
                  </span>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={(page + 1) * PAGE_SIZE >= totalResults}
                    className="px-3 py-1.5 rounded-lg text-xs text-white/40 border border-white/10 hover:bg-white/5 disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedListing && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-[45%] flex-shrink-0 rounded-2xl border border-white/10 overflow-hidden sticky top-6 max-h-[calc(100vh-120px)] overflow-y-auto"
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              {detailLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-5 h-5 border-2 border-[#39FF14]/30 border-t-[#39FF14] rounded-full animate-spin" />
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {/* Detail Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-white">{selectedListing.business_name}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-semibold uppercase rounded-full px-2 py-0.5 border ${TIER_COLORS[selectedListing.tier] || TIER_COLORS.free}`}>
                          {selectedListing.tier}
                        </span>
                        {selectedListing.is_claimed && <span className="text-[10px] text-green-400">Claimed</span>}
                        {!selectedListing.is_published && <span className="text-[10px] text-red-400">Unpublished</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/listing/${selectedListing.slug}`}
                        target="_blank"
                        className="px-3 py-1.5 rounded-lg text-xs text-white/50 border border-white/10 hover:bg-white/5 transition"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => setSelectedListing(null)}
                        className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* ─── EDIT FORM ─── */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Edit Listing</h3>
                    <div className="grid gap-3 grid-cols-2">
                      <div className="col-span-2">
                        <label className="text-[10px] text-white/40 block mb-1">Business Name</label>
                        <input className={inputClass} value={editForm.business_name || ''} onChange={e => setEditForm({ ...editForm, business_name: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/40 block mb-1">Tier</label>
                        <select className={inputClass} value={editForm.tier || 'free'} onChange={e => setEditForm({ ...editForm, tier: e.target.value })}>
                          <option value="free">Free</option>
                          <option value="pro">Pro</option>
                          <option value="premium">Premium</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-white/40 block mb-1">Industry</label>
                        <input className={inputClass} value={editForm.industry || ''} onChange={e => setEditForm({ ...editForm, industry: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/40 block mb-1">City</label>
                        <input className={inputClass} value={editForm.city || ''} onChange={e => setEditForm({ ...editForm, city: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/40 block mb-1">Phone</label>
                        <input className={inputClass} value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                      </div>
                      <div className="col-span-2 flex items-center gap-4">
                        <label className="flex items-center gap-2 text-xs text-white/50 cursor-pointer">
                          <input type="checkbox" checked={editForm.is_published ?? true} onChange={e => setEditForm({ ...editForm, is_published: e.target.checked })} className="rounded" />
                          Published
                        </label>
                        <label className="flex items-center gap-2 text-xs text-white/50 cursor-pointer">
                          <input type="checkbox" checked={editForm.is_claimed ?? false} onChange={e => setEditForm({ ...editForm, is_claimed: e.target.checked })} className="rounded" />
                          Claimed
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={saveListing}
                        disabled={saving}
                        className="px-4 py-2 rounded-lg text-xs font-semibold text-black bg-[#39FF14] hover:bg-[#39FF14]/90 disabled:opacity-50 transition"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={() => unpublishListing(selectedListing.id)}
                        className="px-4 py-2 rounded-lg text-xs text-red-400 border border-red-500/20 hover:bg-red-500/10 transition"
                      >
                        Unpublish
                      </button>
                    </div>
                  </div>

                  {/* ─── BADGES ─── */}
                  <div className="pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Badges</h3>
                      <button
                        onClick={() => setShowBadgeModal(true)}
                        className="text-[10px] text-[#39FF14] hover:text-[#39FF14]/80 transition"
                      >
                        + Award Badge
                      </button>
                    </div>
                    {detailBadges.filter(b => b.is_active).length === 0 ? (
                      <p className="text-xs text-white/20">No active badges.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {detailBadges.filter(b => b.is_active).map(badge => (
                          <div key={badge.id} className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold border" style={{ color: badge.badge_color, borderColor: `${badge.badge_color}33`, background: `${badge.badge_color}10` }}>
                            {badge.badge_label}
                            <button onClick={() => revokeBadge(badge.id)} className="ml-1 opacity-50 hover:opacity-100 transition" title="Revoke">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Badge award modal */}
                    {showBadgeModal && (
                      <div className="mt-3 p-3 rounded-xl border border-white/10 bg-white/[0.02]">
                        <p className="text-xs text-white/50 mb-2">Select badge to award:</p>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {BADGE_OPTIONS.map(b => (
                            <button
                              key={b.type}
                              onClick={() => setSelectedBadge(b)}
                              className={`text-left p-2 rounded-lg border text-[10px] font-semibold transition ${
                                selectedBadge.type === b.type ? 'border-[#39FF14]/30 bg-[#39FF14]/5' : 'border-white/5 hover:bg-white/5'
                              }`}
                              style={{ color: b.color }}
                            >
                              {b.label}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={awardBadge} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-black bg-[#39FF14]">Award</button>
                          <button onClick={() => setShowBadgeModal(false)} className="px-3 py-1.5 rounded-lg text-xs text-white/40 border border-white/10">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ─── POLLS ─── */}
                  <div className="pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Polls</h3>
                      <button
                        onClick={() => setShowPollModal(!showPollModal)}
                        className="text-[10px] text-[#39FF14] hover:text-[#39FF14]/80 transition"
                      >
                        + Create Poll
                      </button>
                    </div>
                    {detailPolls.length === 0 ? (
                      <p className="text-xs text-white/20">No polls.</p>
                    ) : (
                      <div className="space-y-2">
                        {detailPolls.map((poll: any) => (
                          <div key={poll.id} className="rounded-lg border border-white/5 p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-white">{poll.title}</span>
                              <span className="text-[10px] text-white/30">{poll.responses?.length || 0} responses</span>
                            </div>
                            <span className={`text-[10px] mt-1 inline-block ${poll.is_active ? 'text-green-400' : 'text-white/30'}`}>
                              {poll.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Poll create from template */}
                    {showPollModal && (
                      <div className="mt-3 p-3 rounded-xl border border-white/10 bg-white/[0.02]">
                        <p className="text-xs text-white/50 mb-2">Choose template:</p>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {(selectedListing.industry ? getTemplatesForIndustry(selectedListing.industry) : POLL_TEMPLATES).map(t => (
                            <button
                              key={t.id}
                              onClick={() => createPoll(t)}
                              className="w-full text-left p-2 rounded-lg border border-white/5 hover:border-[#39FF14]/20 hover:bg-white/5 transition"
                            >
                              <span className="text-xs font-semibold text-white">{t.name}</span>
                              <span className="text-[10px] text-white/30 block">{t.questions.length} questions</span>
                            </button>
                          ))}
                        </div>
                        <button onClick={() => setShowPollModal(false)} className="mt-2 px-3 py-1.5 rounded-lg text-xs text-white/40 border border-white/10">Cancel</button>
                      </div>
                    )}
                  </div>

                  {/* ─── REVIEWS ─── */}
                  <div className="pt-4 border-t border-white/5">
                    <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
                      Reviews ({detailReviews.length})
                    </h3>
                    {detailReviews.length === 0 ? (
                      <p className="text-xs text-white/20">No reviews.</p>
                    ) : (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {detailReviews.map(review => (
                          <div key={review.id} className={`rounded-lg border p-3 ${review.is_red_flag ? 'border-red-500/30 bg-red-500/5' : 'border-white/5'}`}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <div className="flex gap-0.5">
                                  {[1, 2, 3, 4, 5].map(s => (
                                    <svg key={s} className="w-3 h-3" fill={s <= review.rating ? '#C9A84C' : 'none'} stroke={s <= review.rating ? '#C9A84C' : '#555'} strokeWidth={1.5} viewBox="0 0 24 24">
                                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                  ))}
                                </div>
                                <span className="text-[10px] text-white/30">{review.submitter_name || 'Anonymous'}</span>
                              </div>
                              <div className="flex gap-1">
                                {!review.is_red_flag && (
                                  <button onClick={() => flagReview(review.id)} className="text-[10px] text-yellow-400/50 hover:text-yellow-400 transition" title="Flag">Flag</button>
                                )}
                                <button onClick={() => deleteReview(review.id)} className="text-[10px] text-red-400/50 hover:text-red-400 transition" title="Delete">Delete</button>
                              </div>
                            </div>
                            <p className="text-xs text-white/50 leading-relaxed">{review.feedback_text}</p>
                            {review.is_red_flag && (
                              <span className="text-[10px] text-red-400 mt-1 block">Flagged: {review.red_flag_type || 'inappropriate'}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

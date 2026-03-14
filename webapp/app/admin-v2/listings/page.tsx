/**
 * Listings Management — Admin Command Center
 *
 * Full CRUD list view with search, filter, sort, pagination, bulk actions,
 * status badges, and publish/unpublish workflow.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CollapsibleSidebar from '../components/CollapsibleSidebar';
import { DIRECTORY_CATEGORIES } from '@/lib/directory-config';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Listing {
  id: string;
  business_name: string;
  slug: string;
  industry: string;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  tier: string;
  is_published: boolean;
  is_claimed: boolean;
  claimed_by: string | null;
  cover_image_url: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  avg_feedback_rating: number;
  total_feedback_count: number;
  trust_score: number;
  created_at: string;
  updated_at: string;
  status: string;
  metadata: Record<string, unknown> | null;
}

interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  published: { label: 'Published', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  draft: { label: 'Draft', color: 'text-white/50', bg: 'bg-white/5 border-white/10' },
  pending_review: { label: 'Pending Review', color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' },
  unpublished: { label: 'Unpublished', color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/30' },
  archived: { label: 'Archived', color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30' },
};

const TIER_CONFIG: Record<string, { label: string; color: string }> = {
  free: { label: 'Free', color: 'text-white/40' },
  pro: { label: 'Pro', color: 'text-blue-400' },
  premium: { label: 'Premium', color: 'text-[#C9A84C]' },
};

const SORT_OPTIONS = [
  { value: 'updated_at', label: 'Last Updated' },
  { value: 'created_at', label: 'Date Created' },
  { value: 'business_name', label: 'Business Name' },
  { value: 'city', label: 'City' },
  { value: 'avg_feedback_rating', label: 'Rating' },
  { value: 'trust_score', label: 'Trust Score' },
];

const stagger = { animate: { transition: { staggerChildren: 0.03 } } };
const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function ListingsManagement() {
  const router = useRouter();

  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data state
  const [listings, setListings] = useState<Listing[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, per_page: 20, total: 0, total_pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [tier, setTier] = useState('');
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // Selection & bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null); // listing id or 'bulk'

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch listings
  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchDebounced) params.set('search', searchDebounced);
      if (category) params.set('category', category);
      if (status) params.set('status', status);
      if (tier) params.set('tier', tier);
      params.set('sort', sortBy);
      params.set('dir', sortDir);
      params.set('page', String(page));
      params.set('per_page', '20');

      const res = await fetch(`/api/admin/listings?${params}`);
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to load listings');

      const data = await res.json();
      setListings(data.listings);
      setPagination(data.pagination);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [searchDebounced, category, status, tier, sortBy, sortDir, page]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  // Show toast
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Toggle select
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === listings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(listings.map(l => l.id)));
    }
  };

  // Bulk action
  const executeBulkAction = async (action: string) => {
    if (selectedIds.size === 0) return;
    setBulkActionLoading(true);
    try {
      const res = await fetch('/api/admin/listings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds), action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk action failed');
      showToast(`${action}: ${data.processed} listings updated`);
      setSelectedIds(new Set());
      setShowDeleteConfirm(null);
      fetchListings();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed', 'error');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Single delete
  const deleteListing = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/listings?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Delete failed');
      showToast('Listing archived');
      setShowDeleteConfirm(null);
      fetchListings();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed', 'error');
    }
  };

  // Quick status toggle
  const togglePublish = async (listing: Listing) => {
    const newStatus = listing.status === 'published' ? 'unpublished' : 'published';
    try {
      const res = await fetch(`/api/admin/listings/${listing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', new_status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed');
      }
      showToast(`Listing ${newStatus}`);
      fetchListings();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed', 'error');
    }
  };

  // Stats
  const stats = {
    total: pagination.total,
    published: listings.filter(l => l.status === 'published').length,
    draft: listings.filter(l => l.status === 'draft').length,
    pending: listings.filter(l => l.status === 'pending_review').length,
  };

  return (
    <div
      className="min-h-screen flex relative"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

      <CollapsibleSidebar
        activeItem="listings"
        onNewBooking={() => {}}
        onNewContent={() => {}}
        pendingCount={0}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={mobileMenuOpen}
        onMobileToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      <div className="flex-1 min-w-0 relative z-10 p-4 sm:p-6 lg:p-8 overflow-auto">
        {/* ─── HEADER ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-heading">Listings Management</h1>
            <p className="text-sm text-white/40 mt-1">
              {pagination.total} listing{pagination.total !== 1 ? 's' : ''} total
            </p>
          </div>
          <Link
            href="/admin-v2/listings/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold font-heading text-[#0A0A0A] transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C97A)', boxShadow: '0 0 20px rgba(201,168,76,0.25)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            New Listing
          </Link>
        </div>

        {/* ─── KPI STRIP ─── */}
        <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6" variants={stagger} initial="initial" animate="animate">
          {[
            { label: 'Total', value: stats.total, icon: '📋' },
            { label: 'Published', value: stats.published, icon: '🟢' },
            { label: 'Drafts', value: stats.draft, icon: '📝' },
            { label: 'Pending', value: stats.pending, icon: '⏳' },
          ].map(kpi => (
            <motion.div
              key={kpi.label}
              variants={fadeUp}
              className="backdrop-blur-2xl rounded-xl border border-white/10 p-4"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{kpi.icon}</span>
                <span className="text-xs text-white/40 font-body uppercase tracking-wider">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold text-white font-heading">{kpi.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ─── FILTERS BAR ─── */}
        <div className="backdrop-blur-2xl rounded-2xl border border-white/10 p-4 mb-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
              <input
                type="text"
                placeholder="Search by name, city, email, phone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/50 focus:ring-1 focus:ring-[#C9A84C]/30 transition-all"
              />
            </div>

            {/* Category */}
            <select
              value={category}
              onChange={e => { setCategory(e.target.value); setPage(1); }}
              className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#C9A84C]/50 transition-all appearance-none cursor-pointer min-w-[140px]"
            >
              <option value="">All Categories</option>
              {DIRECTORY_CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>

            {/* Status */}
            <select
              value={status}
              onChange={e => { setStatus(e.target.value); setPage(1); }}
              className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#C9A84C]/50 transition-all appearance-none cursor-pointer min-w-[130px]"
            >
              <option value="">All Statuses</option>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>

            {/* Tier */}
            <select
              value={tier}
              onChange={e => { setTier(e.target.value); setPage(1); }}
              className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#C9A84C]/50 transition-all appearance-none cursor-pointer min-w-[100px]"
            >
              <option value="">All Tiers</option>
              {Object.entries(TIER_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>

            {/* Sort */}
            <div className="flex gap-1">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="px-3 py-2.5 rounded-l-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#C9A84C]/50 transition-all appearance-none cursor-pointer"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2.5 rounded-r-xl bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all"
                title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortDir === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {/* ─── BULK ACTIONS BAR ─── */}
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl border border-[#C9A84C]/30"
              style={{ background: 'rgba(201,168,76,0.08)' }}
            >
              <span className="text-sm text-[#C9A84C] font-semibold font-heading">
                {selectedIds.size} selected
              </span>
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => executeBulkAction('publish')}
                  disabled={bulkActionLoading}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all disabled:opacity-50"
                >
                  Publish
                </button>
                <button
                  onClick={() => executeBulkAction('unpublish')}
                  disabled={bulkActionLoading}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/30 hover:bg-orange-500/25 transition-all disabled:opacity-50"
                >
                  Unpublish
                </button>
                <button
                  onClick={() => executeBulkAction('set_pending_review')}
                  disabled={bulkActionLoading}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-all disabled:opacity-50"
                >
                  Set Pending
                </button>
                <button
                  onClick={() => setShowDeleteConfirm('bulk')}
                  disabled={bulkActionLoading}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-all disabled:opacity-50"
                >
                  Archive
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white transition-all"
                >
                  Clear
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── LISTINGS TABLE ─── */}
        <div className="backdrop-blur-2xl rounded-2xl border border-white/10 overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {/* Table Header */}
          <div className="hidden lg:grid grid-cols-[40px_1fr_120px_100px_100px_100px_100px_120px] gap-3 px-4 py-3 border-b border-white/5 text-xs text-white/40 font-heading uppercase tracking-wider">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedIds.size === listings.length && listings.length > 0}
                onChange={toggleSelectAll}
                className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 accent-[#C9A84C] cursor-pointer"
              />
            </div>
            <div>Business</div>
            <div>Category</div>
            <div>Status</div>
            <div>Tier</div>
            <div>Rating</div>
            <div>Updated</div>
            <div className="text-right">Actions</div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="py-16 text-center">
              <div className="inline-block w-6 h-6 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin" />
              <p className="text-sm text-white/40 mt-3">Loading listings...</p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="py-16 text-center">
              <p className="text-sm text-red-400">{error}</p>
              <button onClick={fetchListings} className="mt-2 text-xs text-[#C9A84C] hover:underline">Retry</button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && listings.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-lg text-white/20 mb-2">No listings found</p>
              <p className="text-sm text-white/30 mb-4">
                {search || category || status || tier ? 'Try adjusting your filters' : 'Create your first listing to get started'}
              </p>
              {!search && !category && !status && !tier && (
                <Link
                  href="/admin-v2/listings/new"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-[#C9A84C] border border-[#C9A84C]/30 hover:bg-[#C9A84C]/10 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  Create Listing
                </Link>
              )}
            </div>
          )}

          {/* Rows */}
          {!loading && !error && (
            <motion.div variants={stagger} initial="initial" animate="animate">
              {listings.map(listing => {
                const statusCfg = STATUS_CONFIG[listing.status] || STATUS_CONFIG.draft;
                const tierCfg = TIER_CONFIG[listing.tier] || TIER_CONFIG.free;
                const categoryLabel = DIRECTORY_CATEGORIES.find(c => c.id === listing.industry)?.label || listing.industry;

                return (
                  <motion.div
                    key={listing.id}
                    variants={fadeUp}
                    className="grid grid-cols-1 lg:grid-cols-[40px_1fr_120px_100px_100px_100px_100px_120px] gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/[0.03] transition-colors group items-center"
                  >
                    {/* Checkbox */}
                    <div className="hidden lg:flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(listing.id)}
                        onChange={() => toggleSelect(listing.id)}
                        className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 accent-[#C9A84C] cursor-pointer"
                      />
                    </div>

                    {/* Business info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                        {listing.cover_image_url ? (
                          <img src={listing.cover_image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center">
                            <span className="text-xs text-white/20 font-bold">{listing.business_name[0]}</span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/admin-v2/listings/${listing.id}`}
                          className="text-sm font-semibold text-white hover:text-[#C9A84C] transition-colors truncate block font-heading"
                        >
                          {listing.business_name}
                        </Link>
                        <p className="text-xs text-white/30 truncate">
                          {[listing.city, listing.state].filter(Boolean).join(', ') || 'No location'}
                        </p>
                      </div>
                    </div>

                    {/* Category */}
                    <div className="hidden lg:block">
                      <span className="text-xs text-white/50">{categoryLabel}</span>
                    </div>

                    {/* Status */}
                    <div>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusCfg.bg} ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Tier */}
                    <div className="hidden lg:block">
                      <span className={`text-xs font-semibold ${tierCfg.color}`}>{tierCfg.label}</span>
                    </div>

                    {/* Rating */}
                    <div className="hidden lg:flex items-center gap-1">
                      {listing.avg_feedback_rating > 0 ? (
                        <>
                          <svg className="w-3 h-3 text-[#C9A84C]" fill="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                          <span className="text-xs text-white/60">{listing.avg_feedback_rating.toFixed(1)}</span>
                          <span className="text-[10px] text-white/25">({listing.total_feedback_count})</span>
                        </>
                      ) : (
                        <span className="text-xs text-white/20">--</span>
                      )}
                    </div>

                    {/* Updated */}
                    <div className="hidden lg:block">
                      <span className="text-xs text-white/30">
                        {new Date(listing.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1">
                      {/* Publish toggle */}
                      <button
                        onClick={() => togglePublish(listing)}
                        className={`p-1.5 rounded-lg transition-all ${
                          listing.status === 'published'
                            ? 'text-emerald-400 hover:bg-emerald-500/10'
                            : 'text-white/30 hover:bg-white/5 hover:text-white/60'
                        }`}
                        title={listing.status === 'published' ? 'Unpublish' : 'Publish'}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          {listing.status === 'published' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                          )}
                        </svg>
                      </button>

                      {/* Edit */}
                      <Link
                        href={`/admin-v2/listings/${listing.id}`}
                        className="p-1.5 rounded-lg text-white/30 hover:text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-all"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                      </Link>

                      {/* View on site */}
                      {listing.status === 'published' && listing.slug && (
                        <a
                          href={`/listing/${listing.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
                          title="View on site"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                        </a>
                      )}

                      {/* Delete */}
                      <button
                        onClick={() => setShowDeleteConfirm(listing.id)}
                        className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                        title="Archive"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                      </button>
                    </div>

                    {/* Mobile category + tier row */}
                    <div className="flex items-center gap-2 lg:hidden col-span-full -mt-1">
                      <span className="text-[10px] text-white/30">{categoryLabel}</span>
                      <span className="text-white/10">·</span>
                      <span className={`text-[10px] font-semibold ${tierCfg.color}`}>{tierCfg.label}</span>
                      {listing.avg_feedback_rating > 0 && (
                        <>
                          <span className="text-white/10">·</span>
                          <span className="text-[10px] text-[#C9A84C]">★ {listing.avg_feedback_rating.toFixed(1)}</span>
                        </>
                      )}
                      <input
                        type="checkbox"
                        checked={selectedIds.has(listing.id)}
                        onChange={() => toggleSelect(listing.id)}
                        className="ml-auto w-3.5 h-3.5 rounded border-white/20 bg-white/5 accent-[#C9A84C] cursor-pointer"
                      />
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* ─── PAGINATION ─── */}
          {!loading && pagination.total_pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
              <p className="text-xs text-white/30">
                Showing {(page - 1) * pagination.per_page + 1}–{Math.min(page * pagination.per_page, pagination.total)} of {pagination.total}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                  let pageNum: number;
                  if (pagination.total_pages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= pagination.total_pages - 2) {
                    pageNum = pagination.total_pages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                        page === pageNum
                          ? 'bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/30'
                          : 'text-white/40 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(pagination.total_pages, p + 1))}
                  disabled={page === pagination.total_pages}
                  className="px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── DELETE CONFIRMATION MODAL ─── */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(null)}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm rounded-2xl border border-white/10 p-6"
              style={{ background: 'rgba(20,20,20,0.98)' }}
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white font-heading mb-2">
                {showDeleteConfirm === 'bulk' ? `Archive ${selectedIds.size} listings?` : 'Archive this listing?'}
              </h3>
              <p className="text-sm text-white/50 mb-6">
                Archived listings are hidden from the directory but can be restored later.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 rounded-xl text-sm text-white/60 border border-white/10 hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (showDeleteConfirm === 'bulk') {
                      executeBulkAction('archive');
                    } else {
                      deleteListing(showDeleteConfirm);
                    }
                  }}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all"
                >
                  Archive
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── TOAST ─── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border text-sm font-medium backdrop-blur-xl ${
              toast.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/15 border-red-500/30 text-red-400'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

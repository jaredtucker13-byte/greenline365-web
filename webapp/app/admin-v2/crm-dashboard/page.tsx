/**
 * CRM Dashboard - Phase 1 MVP
 * 
 * Features:
 * - KPI Strip with 4 key metrics + trends
 * - Lead table with inline status change
 * - Detail Rail with full info + activity
 * - Quick Add modal for manual lead creation
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface Lead {
  id: string;
  user_id?: string;
  email: string;
  name?: string;
  phone?: string;
  company?: string;
  status: string;
  source: string;
  value?: number;
  first_contact_at?: string;
  last_contact_at?: string;
  converted_at?: string;
  lost_at?: string;
  lost_reason?: string;
  tags: string[];
  notes?: string;
  assigned_to?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface Stats {
  [key: string]: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  new: { label: 'New', color: 'text-blue-400', bgColor: 'bg-blue-500/20', icon: '🆕' },
  pending: { label: 'Pending', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', icon: '⏳' },
  verified: { label: 'Verified', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', icon: '✓' },
  contacted: { label: 'Contacted', color: 'text-purple-400', bgColor: 'bg-purple-500/20', icon: '📞' },
  qualified: { label: 'Qualified', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20', icon: '⭐' },
  converted: { label: 'Converted', color: 'text-green-400', bgColor: 'bg-green-500/20', icon: '🎉' },
  lost: { label: 'Lost', color: 'text-red-400', bgColor: 'bg-red-500/20', icon: '✗' },
  archived: { label: 'Archived', color: 'text-gray-500', bgColor: 'bg-gray-600/20', icon: '📦' },
};

const SOURCE_OPTIONS = [
  { value: 'website', label: 'Website' },
  { value: 'waitlist', label: 'Waitlist' },
  { value: 'ai_call', label: 'AI Call' },
  { value: 'referral', label: 'Referral' },
  { value: 'ad', label: 'Ad Campaign' },
  { value: 'partner', label: 'Partner' },
  { value: 'event', label: 'Event' },
  { value: 'manual', label: 'Manual Entry' },
];

export default function CRMDashboard() {
  // Data state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // UI state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch leads
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        sortBy,
        sortOrder,
      });
      
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (sourceFilter) params.set('source', sourceFilter);
      
      const response = await fetch(`/api/crm/leads?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setLeads(data.leads || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setStats(data.stats || {});
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, sourceFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Update lead status
  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    setActionLoading(true);
    try {
      const response = await fetch('/api/crm/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, status: newStatus }),
      });
      
      if (response.ok) {
        fetchLeads();
        if (selectedLead?.id === leadId) {
          setSelectedLead({ ...selectedLead, status: newStatus });
        }
      }
    } catch (err) {
      console.error('Failed to update lead:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk update
  const bulkUpdateStatus = async (newStatus: string) => {
    if (selectedLeads.length === 0) return;
    
    setActionLoading(true);
    try {
      await Promise.all(
        selectedLeads.map(id =>
          fetch('/api/crm/leads', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: newStatus }),
          })
        )
      );
      setSelectedLeads([]);
      fetchLeads();
    } catch (err) {
      console.error('Failed to bulk update:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Calculate KPIs
  const totalLeads = Object.values(stats).reduce((a, b) => a + b, 0);
  const verifiedCount = (stats.verified || 0) + (stats.contacted || 0) + (stats.qualified || 0) + (stats.converted || 0);
  const convertedCount = stats.converted || 0;
  const totalRevenue = leads.filter(l => l.status === 'converted').reduce((sum, l) => sum + (l.value || 0), 0);
  
  const verificationRate = totalLeads > 0 ? ((verifiedCount / totalLeads) * 100) : 0;
  const conversionRate = verifiedCount > 0 ? ((convertedCount / verifiedCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a]" data-testid="crm-dashboard">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin-v2" className="text-white/50 hover:text-white transition">
                ← Command Center
              </Link>
              <div className="h-6 w-px bg-white/20" />
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-2xl">👥</span> CRM Dashboard
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Global Search */}
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search leads..."
                  className="w-64 pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-[#39FF14] outline-none"
                  data-testid="search-input"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">🔍</span>
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg border transition ${
                  showFilters ? 'border-[#39FF14] text-[#39FF14]' : 'border-white/10 text-white/60 hover:text-white'
                }`}
                data-testid="filter-toggle"
              >
                Filters {showFilters ? '▲' : '▼'}
              </button>
              
              <button
                onClick={() => setShowAddLead(true)}
                className="px-4 py-2 rounded-lg bg-[#39FF14] text-black font-medium hover:bg-[#32E012] transition flex items-center gap-2"
                data-testid="add-lead-btn"
              >
                <span className="text-lg">+</span> Add Lead
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* KPI Strip - 4 Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" data-testid="kpi-strip">
          {/* Total Leads */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20"
          >
            <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-lg">
              👥
            </div>
            <div className="text-blue-400/60 text-sm font-medium mb-1">Total Leads</div>
            <div className="text-3xl font-bold text-white mb-2">{totalLeads}</div>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-emerald-400">↑ {stats.new || 0} new</span>
              <span className="text-white/30">today</span>
            </div>
            {/* Mini sparkline placeholder */}
            <div className="absolute bottom-0 left-0 right-0 h-12 opacity-30">
              <svg viewBox="0 0 100 30" className="w-full h-full">
                <path d="M0,25 Q10,20 20,22 T40,18 T60,15 T80,10 T100,5" fill="none" stroke="#3B82F6" strokeWidth="2"/>
              </svg>
            </div>
          </motion.div>

          {/* Verified */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20"
          >
            <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-lg">
              ✓
            </div>
            <div className="text-emerald-400/60 text-sm font-medium mb-1">Verified</div>
            <div className="text-3xl font-bold text-white mb-2">{verifiedCount}</div>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-emerald-400">{verificationRate.toFixed(1)}%</span>
              <span className="text-white/30">rate</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-12 opacity-30">
              <svg viewBox="0 0 100 30" className="w-full h-full">
                <path d="M0,20 Q15,18 30,15 T50,12 T70,10 T100,8" fill="none" stroke="#10B981" strokeWidth="2"/>
              </svg>
            </div>
          </motion.div>

          {/* Converted */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20"
          >
            <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-lg">
              🎉
            </div>
            <div className="text-purple-400/60 text-sm font-medium mb-1">Converted</div>
            <div className="text-3xl font-bold text-white mb-2">{convertedCount}</div>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-purple-400">{conversionRate.toFixed(1)}%</span>
              <span className="text-white/30">conversion</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-12 opacity-30">
              <svg viewBox="0 0 100 30" className="w-full h-full">
                <path d="M0,22 Q20,20 40,18 T60,14 T80,10 T100,6" fill="none" stroke="#A855F7" strokeWidth="2"/>
              </svg>
            </div>
          </motion.div>

          {/* Revenue */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20"
          >
            <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-lg">
              💰
            </div>
            <div className="text-amber-400/60 text-sm font-medium mb-1">Revenue</div>
            <div className="text-3xl font-bold text-white mb-2">
              ${totalRevenue.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-amber-400">${convertedCount > 0 ? Math.round(totalRevenue / convertedCount).toLocaleString() : 0}</span>
              <span className="text-white/30">avg deal</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-12 opacity-30">
              <svg viewBox="0 0 100 30" className="w-full h-full">
                <path d="M0,25 Q25,22 50,15 T75,10 T100,5" fill="none" stroke="#F59E0B" strokeWidth="2"/>
              </svg>
            </div>
          </motion.div>
        </div>

        {/* Status Quick Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-lg text-sm transition ${
              !statusFilter 
                ? 'bg-white/10 text-white border border-white/20' 
                : 'bg-white/5 text-white/50 border border-transparent hover:text-white'
            }`}
          >
            All ({totalLeads})
          </button>
          {Object.entries(STATUS_CONFIG).map(([status, config]) => (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
              className={`px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-1.5 ${
                statusFilter === status 
                  ? `${config.bgColor} ${config.color} border border-current` 
                  : 'bg-white/5 text-white/50 border border-transparent hover:text-white'
              }`}
            >
              <span>{config.icon}</span>
              <span>{config.label}</span>
              <span className="opacity-60">({stats[status] || 0})</span>
            </button>
          ))}
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="p-5 rounded-xl bg-white/5 border border-white/10 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Source</label>
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#39FF14] outline-none"
                  >
                    <option value="">All Sources</option>
                    {SOURCE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#39FF14] outline-none"
                  >
                    <option value="created_at">Date Created</option>
                    <option value="updated_at">Last Updated</option>
                    <option value="name">Name</option>
                    <option value="value">Value</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Order</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#39FF14] outline-none"
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearch('');
                      setStatusFilter('');
                      setSourceFilter('');
                      setSortBy('created_at');
                      setSortOrder('desc');
                    }}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 text-white/60 hover:text-white transition"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bulk Actions */}
        <AnimatePresence>
          {selectedLeads.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-4"
            >
              <div className="p-4 rounded-xl bg-[#39FF14]/10 border border-[#39FF14]/30 flex items-center justify-between">
                <span className="text-[#39FF14] font-medium">{selectedLeads.length} leads selected</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => bulkUpdateStatus('verified')}
                    disabled={actionLoading}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm hover:bg-emerald-500/30 disabled:opacity-50"
                  >
                    ✓ Verify
                  </button>
                  <button
                    onClick={() => bulkUpdateStatus('contacted')}
                    disabled={actionLoading}
                    className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 text-sm hover:bg-purple-500/30 disabled:opacity-50"
                  >
                    📞 Contacted
                  </button>
                  <button
                    onClick={() => bulkUpdateStatus('archived')}
                    disabled={actionLoading}
                    className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 disabled:opacity-50"
                  >
                    📦 Archive
                  </button>
                  <button
                    onClick={() => setSelectedLeads([])}
                    className="px-3 py-1.5 rounded-lg bg-white/10 text-white/60 text-sm hover:bg-white/20"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lead Table */}
        <div className="rounded-xl border border-white/10 overflow-hidden" data-testid="leads-table">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedLeads.length === leads.length && leads.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedLeads(leads.map(l => l.id));
                      } else {
                        setSelectedLeads([]);
                      }
                    }}
                    className="rounded border-white/30"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Contact</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Company</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Source</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Value</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Created</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-white/60">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="w-8 h-8 border-2 border-[#39FF14]/30 border-t-[#39FF14] rounded-full animate-spin mx-auto" />
                    <div className="text-white/40 mt-3">Loading leads...</div>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="text-4xl mb-3">📭</div>
                    <div className="text-white/40 mb-4">No leads found</div>
                    <button
                      onClick={() => setShowAddLead(true)}
                      className="px-4 py-2 rounded-lg bg-[#39FF14] text-black font-medium hover:bg-[#32E012] transition"
                    >
                      + Add Your First Lead
                    </button>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-white/5 cursor-pointer transition group"
                    onClick={() => setSelectedLead(lead)}
                    data-testid={`lead-row-${lead.id}`}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedLeads.includes(lead.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLeads([...selectedLeads, lead.id]);
                          } else {
                            setSelectedLeads(selectedLeads.filter(id => id !== lead.id));
                          }
                        }}
                        className="rounded border-white/30"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#39FF14]/20 to-emerald-500/20 flex items-center justify-center text-[#39FF14] font-medium text-sm">
                          {(lead.name || lead.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-white font-medium group-hover:text-[#39FF14] transition">
                            {lead.name || '—'}
                          </div>
                          <div className="text-white/40 text-sm">{lead.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-white/80">{lead.company || '—'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[lead.status]?.bgColor || 'bg-gray-500/20'} ${STATUS_CONFIG[lead.status]?.color || 'text-gray-400'}`}>
                        <span>{STATUS_CONFIG[lead.status]?.icon}</span>
                        {STATUS_CONFIG[lead.status]?.label || lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/60 text-sm capitalize">{lead.source || '—'}</td>
                    <td className="px-4 py-3">
                      {lead.value ? (
                        <span className="text-emerald-400 font-medium">${lead.value.toLocaleString()}</span>
                      ) : (
                        <span className="text-white/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white/40 text-sm">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={lead.status}
                        onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                        className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-[#39FF14] outline-none cursor-pointer"
                      >
                        {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                          <option key={value} value={value}>{config.label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 px-2">
            <div className="text-white/40 text-sm">
              Showing {((page - 1) * 50) + 1} - {Math.min(page * 50, total)} of {total}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg bg-white/5 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              <span className="px-3 py-1.5 text-white/60">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg bg-white/5 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Lead Detail Rail */}
      <AnimatePresence>
        {selectedLead && (
          <DetailRail
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
            onStatusChange={(status) => updateLeadStatus(selectedLead.id, status)}
            statusConfig={STATUS_CONFIG}
          />
        )}
      </AnimatePresence>

      {/* Add Lead Modal */}
      <AnimatePresence>
        {showAddLead && (
          <AddLeadModal
            onClose={() => setShowAddLead(false)}
            onSuccess={() => {
              setShowAddLead(false);
              fetchLeads();
            }}
            sourceOptions={SOURCE_OPTIONS}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// DETAIL RAIL COMPONENT
// ==========================================
function DetailRail({ 
  lead, 
  onClose, 
  onStatusChange,
  statusConfig 
}: { 
  lead: Lead;
  onClose: () => void;
  onStatusChange: (status: string) => void;
  statusConfig: typeof STATUS_CONFIG;
}) {
  const [activeTab, setActiveTab] = useState<'details' | 'activity' | 'notes'>('details');
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const saveNote = async () => {
    if (!note.trim()) return;
    setSavingNote(true);
    try {
      await fetch('/api/crm/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: lead.id, 
          notes: lead.notes ? `${lead.notes}\n\n---\n${new Date().toLocaleString()}:\n${note}` : note 
        }),
      });
      setNote('');
      // Refresh would happen via parent
    } catch (err) {
      console.error('Failed to save note:', err);
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-[#0a0a0a] border-l border-white/10 z-50 flex flex-col"
        data-testid="detail-rail"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#39FF14]/20 to-emerald-500/20 flex items-center justify-center text-[#39FF14] font-bold text-lg">
                {(lead.name || lead.email)[0].toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{lead.name || 'Unnamed Lead'}</h2>
                <p className="text-white/50 text-sm">{lead.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition"
            >
              ✕
            </button>
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-2">
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="flex-1 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-center text-sm font-medium hover:bg-emerald-500/30 transition"
              >
                📞 Call
              </a>
            )}
            <a
              href={`mailto:${lead.email}`}
              className="flex-1 py-2 rounded-lg bg-blue-500/20 text-blue-400 text-center text-sm font-medium hover:bg-blue-500/30 transition"
            >
              ✉️ Email
            </a>
            <button className="flex-1 py-2 rounded-lg bg-purple-500/20 text-purple-400 text-sm font-medium hover:bg-purple-500/30 transition">
              📅 Task
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {(['details', 'activity', 'notes'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium transition capitalize ${
                activeTab === tab
                  ? 'text-[#39FF14] border-b-2 border-[#39FF14]'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Status */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Status</label>
                <select
                  value={lead.status}
                  onChange={(e) => onStatusChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#39FF14] outline-none"
                >
                  {Object.entries(statusConfig).map(([value, config]) => (
                    <option key={value} value={value}>{config.icon} {config.label}</option>
                  ))}
                </select>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="text-sm font-medium text-white/60 mb-3">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                    <span className="text-lg">✉️</span>
                    <div>
                      <div className="text-white/40 text-xs">Email</div>
                      <a href={`mailto:${lead.email}`} className="text-white hover:text-[#39FF14]">{lead.email}</a>
                    </div>
                  </div>
                  {lead.phone && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                      <span className="text-lg">📱</span>
                      <div>
                        <div className="text-white/40 text-xs">Phone</div>
                        <a href={`tel:${lead.phone}`} className="text-white hover:text-[#39FF14]">{lead.phone}</a>
                      </div>
                    </div>
                  )}
                  {lead.company && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                      <span className="text-lg">🏢</span>
                      <div>
                        <div className="text-white/40 text-xs">Company</div>
                        <div className="text-white">{lead.company}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Value & Source */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-white/5">
                  <div className="text-white/40 text-xs mb-1">Value</div>
                  <div className="text-xl font-bold text-emerald-400">
                    {lead.value ? `$${lead.value.toLocaleString()}` : '—'}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-white/5">
                  <div className="text-white/40 text-xs mb-1">Source</div>
                  <div className="text-white capitalize">{lead.source || '—'}</div>
                </div>
              </div>

              {/* Tags */}
              {lead.tags && lead.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-white/60 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {lead.tags.map((tag, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-[#39FF14]/20 text-[#39FF14] text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div>
                <h3 className="text-sm font-medium text-white/60 mb-3">Timeline</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between p-2 rounded bg-white/5">
                    <span className="text-white/50">Created</span>
                    <span className="text-white">{new Date(lead.created_at).toLocaleString()}</span>
                  </div>
                  {lead.first_contact_at && (
                    <div className="flex justify-between p-2 rounded bg-white/5">
                      <span className="text-white/50">First Contact</span>
                      <span className="text-white">{new Date(lead.first_contact_at).toLocaleString()}</span>
                    </div>
                  )}
                  {lead.last_contact_at && (
                    <div className="flex justify-between p-2 rounded bg-white/5">
                      <span className="text-white/50">Last Contact</span>
                      <span className="text-white">{new Date(lead.last_contact_at).toLocaleString()}</span>
                    </div>
                  )}
                  {lead.converted_at && (
                    <div className="flex justify-between p-2 rounded bg-emerald-500/10">
                      <span className="text-emerald-400">Converted</span>
                      <span className="text-emerald-400">{new Date(lead.converted_at).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              <div className="text-center py-8 text-white/40">
                <div className="text-4xl mb-3">📋</div>
                <p>Activity tracking coming soon</p>
                <p className="text-sm mt-1">Call logs, emails, and interactions will appear here</p>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              {/* Add Note */}
              <div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-[#39FF14] outline-none resize-none"
                />
                <button
                  onClick={saveNote}
                  disabled={!note.trim() || savingNote}
                  className="mt-2 px-4 py-2 rounded-lg bg-[#39FF14] text-black font-medium hover:bg-[#32E012] disabled:opacity-50 transition"
                >
                  {savingNote ? 'Saving...' : 'Add Note'}
                </button>
              </div>

              {/* Existing Notes */}
              {lead.notes ? (
                <div className="p-4 rounded-lg bg-white/5 whitespace-pre-wrap text-white/80">
                  {lead.notes}
                </div>
              ) : (
                <div className="text-center py-8 text-white/40">
                  <div className="text-4xl mb-3">📝</div>
                  <p>No notes yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ==========================================
// ADD LEAD MODAL COMPONENT
// ==========================================
function AddLeadModal({
  onClose,
  onSuccess,
  sourceOptions,
}: {
  onClose: () => void;
  onSuccess: () => void;
  sourceOptions: { value: string; label: string }[];
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: 'manual',
    value: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          value: formData.value ? parseFloat(formData.value) : null,
          status: 'new',
          tags: [],
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create lead');
      }
    } catch (err) {
      setError('Failed to create lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 max-h-[90vh] overflow-y-auto" data-testid="add-lead-modal">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Add New Lead</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#39FF14] outline-none"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#39FF14] outline-none"
                  placeholder="john@example.com"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#39FF14] outline-none"
                  placeholder="+1 555-0123"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#39FF14] outline-none"
                  placeholder="Acme Inc"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Source</label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#39FF14] outline-none"
                >
                  {sourceOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Deal Value ($)</label>
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#39FF14] outline-none"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-white/60 mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#39FF14] outline-none resize-none"
                placeholder="Add any initial notes..."
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-lg bg-[#39FF14] text-black font-medium hover:bg-[#32E012] disabled:opacity-50 transition"
              >
                {loading ? 'Creating...' : 'Create Lead'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
}

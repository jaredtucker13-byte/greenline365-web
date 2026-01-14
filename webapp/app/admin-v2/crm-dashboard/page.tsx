/**
 * CRM Dashboard
 * 
 * Features:
 * - Lead list with filtering, sorting, search
 * - Status counts and conversion funnel
 * - Quick actions: change status, add tags, send email
 * - Lead detail drawer with activity timeline
 * - Bulk actions
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

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  new: { label: 'New', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  pending: { label: 'Pending', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  verified: { label: 'Verified', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  contacted: { label: 'Contacted', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  qualified: { label: 'Qualified', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  converted: { label: 'Converted', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  lost: { label: 'Lost', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  archived: { label: 'Archived', color: 'text-gray-500', bgColor: 'bg-gray-600/20' },
};

// Removed PRIORITY_CONFIG since priority column doesn't exist

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
  const [priorityFilter, setPriorityFilter] = useState('');
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
      if (priorityFilter) params.set('priority', priorityFilter);
      
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
  }, [page, search, statusFilter, sourceFilter, priorityFilter, sortBy, sortOrder]);

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
          setSelectedLead({ ...selectedLead, status: newStatus as Lead['status'] });
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

  // Delete/archive lead
  const archiveLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to archive this lead?')) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`/api/crm/leads?id=${leadId}&action=archive`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchLeads();
        setSelectedLead(null);
      }
    } catch (err) {
      console.error('Failed to archive lead:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Calculate funnel stats
  const funnelStats = {
    total: Object.values(stats).reduce((a, b) => a + b, 0),
    verified: (stats.verified || 0) + (stats.invited || 0) + (stats.onboarded || 0) + (stats.converted || 0),
    converted: stats.converted || 0,
  };
  
  const verificationRate = funnelStats.total > 0 ? ((funnelStats.verified / funnelStats.total) * 100).toFixed(1) : '0';
  const conversionRate = funnelStats.verified > 0 ? ((funnelStats.converted / funnelStats.verified) * 100).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin-v2" className="text-white/50 hover:text-white transition">
                ← Back
              </Link>
              <div className="h-6 w-px bg-white/20" />
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-2xl">👥</span> CRM Dashboard
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg border transition ${
                  showFilters ? 'border-cyan-500 text-cyan-400' : 'border-white/10 text-white/60 hover:text-white'
                }`}
              >
                Filters
              </button>
              <button
                onClick={() => setShowAddLead(true)}
                className="px-4 py-2 rounded-lg bg-emerald-500 text-black font-medium hover:bg-emerald-400 transition"
              >
                + Add Lead
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          {Object.entries(STATUS_CONFIG).slice(0, 6).map(([status, config]) => (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
              className={`p-4 rounded-xl border transition-all ${
                statusFilter === status
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <div className={`text-2xl font-bold ${config.color}`}>
                {stats[status] || 0}
              </div>
              <div className="text-white/50 text-sm">{config.label}</div>
            </button>
          ))}
        </div>

        {/* Funnel Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30">
            <div className="text-3xl font-bold text-white mb-1">{funnelStats.total}</div>
            <div className="text-blue-400">Total Leads</div>
          </div>
          <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30">
            <div className="text-3xl font-bold text-white mb-1">{verificationRate}%</div>
            <div className="text-emerald-400">Verification Rate</div>
          </div>
          <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30">
            <div className="text-3xl font-bold text-white mb-1">{conversionRate}%</div>
            <div className="text-purple-400">Conversion Rate</div>
          </div>
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
              <div className="p-6 rounded-xl bg-white/5 border border-white/10 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Search</label>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Email, name, company..."
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-cyan-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-cyan-500 outline-none"
                  >
                    <option value="">All Statuses</option>
                    {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                      <option key={value} value={value}>{config.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Source</label>
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-cyan-500 outline-none"
                  >
                    <option value="">All Sources</option>
                    <option value="website">Website</option>
                    <option value="waitlist">Waitlist</option>
                    <option value="partner">Partner</option>
                    <option value="event">Event</option>
                    <option value="ad">Ad Campaign</option>
                    <option value="referral">Referral</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Priority</label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-cyan-500 outline-none"
                  >
                    <option value="">All Priorities</option>
                    {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
                      <option key={value} value={value}>{config.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bulk Actions */}
        {selectedLeads.length > 0 && (
          <div className="mb-4 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between">
            <span className="text-cyan-400">{selectedLeads.length} leads selected</span>
            <div className="flex gap-2">
              <button
                onClick={() => bulkUpdateStatus('verified')}
                disabled={actionLoading}
                className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm hover:bg-emerald-500/30 disabled:opacity-50"
              >
                Mark Verified
              </button>
              <button
                onClick={() => bulkUpdateStatus('invited')}
                disabled={actionLoading}
                className="px-3 py-1 rounded-lg bg-purple-500/20 text-purple-400 text-sm hover:bg-purple-500/30 disabled:opacity-50"
              >
                Send Invite
              </button>
              <button
                onClick={() => bulkUpdateStatus('archived')}
                disabled={actionLoading}
                className="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 disabled:opacity-50"
              >
                Archive
              </button>
              <button
                onClick={() => setSelectedLeads([])}
                className="px-3 py-1 rounded-lg bg-white/10 text-white/60 text-sm hover:bg-white/20"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Leads Table */}
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
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
                      <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-white/40">
                      No leads found
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="hover:bg-white/5 cursor-pointer transition"
                      onClick={() => setSelectedLead(lead)}
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
                        <div className="text-white font-medium">{lead.name || '—'}</div>
                        <div className="text-white/50 text-sm">{lead.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-white">{lead.company || '—'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${STATUS_CONFIG[lead.status]?.bgColor || 'bg-gray-500/20'} ${STATUS_CONFIG[lead.status]?.color || 'text-gray-400'}`}>
                          {STATUS_CONFIG[lead.status]?.label || lead.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/60 text-sm capitalize">{lead.source || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="text-emerald-400 font-medium">
                          {lead.value ? `$${lead.value.toLocaleString()}` : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/50 text-sm">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={lead.status}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                          className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-cyan-500 outline-none"
                        >
                          {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                            <option key={value} value={value}>{config.label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
                )}}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 bg-white/5 border-t border-white/10 flex items-center justify-between">
              <div className="text-white/50 text-sm">
                Showing {((page - 1) * 50) + 1} - {Math.min(page * 50, total)} of {total}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded-lg bg-white/10 text-white disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded-lg bg-white/10 text-white disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Lead Detail Drawer */}
      <AnimatePresence>
        {selectedLead && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setSelectedLead(null)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-[#0a0a0a] border-l border-white/10 z-50 overflow-y-auto"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedLead.name || 'Unnamed Lead'}</h2>
                    <p className="text-white/50">{selectedLead.email}</p>
                  </div>
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
                  >
                    ✕
                  </button>
                </div>

                {/* Status & Priority */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <label className="block text-sm text-white/60 mb-2">Status</label>
                    <select
                      value={selectedLead.status}
                      onChange={(e) => updateLeadStatus(selectedLead.id, e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                    >
                      {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                        <option key={value} value={value}>{config.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-white/60 mb-2">Lead Score</label>
                    <div className={`px-4 py-2 rounded-lg bg-white/5 border border-white/10 font-bold ${
                      selectedLead.lead_score >= 50 ? 'text-emerald-400' : 'text-white'
                    }`}>
                      {selectedLead.lead_score} points
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-white/60 mb-3">Contact Information</h3>
                  <div className="space-y-3">
                    {selectedLead.phone && (
                      <div className="flex items-center gap-3">
                        <span className="text-white/40">📱</span>
                        <span className="text-white">{selectedLead.phone}</span>
                      </div>
                    )}
                    {selectedLead.company && (
                      <div className="flex items-center gap-3">
                        <span className="text-white/40">🏢</span>
                        <span className="text-white">{selectedLead.company}</span>
                      </div>
                    )}
                    {selectedLead.role && (
                      <div className="flex items-center gap-3">
                        <span className="text-white/40">💼</span>
                        <span className="text-white">{selectedLead.role}</span>
                      </div>
                    )}
                    {selectedLead.country && (
                      <div className="flex items-center gap-3">
                        <span className="text-white/40">🌍</span>
                        <span className="text-white">{selectedLead.country}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Source & Interest */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-white/60 mb-3">Source & Interest</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-white/5">
                      <div className="text-white/50 text-xs mb-1">Source</div>
                      <div className="text-white capitalize">{selectedLead.source}</div>
                    </div>
                    {selectedLead.interest_type && (
                      <div className="p-3 rounded-lg bg-white/5">
                        <div className="text-white/50 text-xs mb-1">Interest</div>
                        <div className="text-white capitalize">{selectedLead.interest_type}</div>
                      </div>
                    )}
                    {selectedLead.desired_plan && (
                      <div className="p-3 rounded-lg bg-white/5">
                        <div className="text-white/50 text-xs mb-1">Desired Plan</div>
                        <div className="text-white capitalize">{selectedLead.desired_plan}</div>
                      </div>
                    )}
                    {selectedLead.company_size && (
                      <div className="p-3 rounded-lg bg-white/5">
                        <div className="text-white/50 text-xs mb-1">Company Size</div>
                        <div className="text-white capitalize">{selectedLead.company_size}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Verification Info */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-white/60 mb-3">Verification</h3>
                  <div className="p-4 rounded-lg bg-white/5 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white/50">Attempts</span>
                      <span className="text-white">{selectedLead.verification_attempts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Verified</span>
                      <span className={selectedLead.verified_at ? 'text-emerald-400' : 'text-white/40'}>
                        {selectedLead.verified_at ? new Date(selectedLead.verified_at).toLocaleString() : 'Not yet'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {selectedLead.tags && selectedLead.tags.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-white/60 mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedLead.tags.map((tag, i) => (
                        <span key={i} className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedLead.notes && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-white/60 mb-3">Notes</h3>
                    <p className="text-white/80 p-4 rounded-lg bg-white/5">{selectedLead.notes}</p>
                  </div>
                )}

                {/* Timestamps */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-white/60 mb-3">Timeline</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/50">Created</span>
                      <span className="text-white">{new Date(selectedLead.created_at).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Updated</span>
                      <span className="text-white">{new Date(selectedLead.updated_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => archiveLead(selectedLead.id)}
                    disabled={actionLoading}
                    className="flex-1 py-3 rounded-lg bg-red-500/20 text-red-400 font-medium hover:bg-red-500/30 disabled:opacity-50"
                  >
                    Archive
                  </button>
                  <a
                    href={`mailto:${selectedLead.email}`}
                    className="flex-1 py-3 rounded-lg bg-cyan-500/20 text-cyan-400 font-medium hover:bg-cyan-500/30 text-center"
                  >
                    Send Email
                  </a>
                </div>
              </div>
            </motion.div>
          </>
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
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Add Lead Modal Component
function AddLeadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    company: '',
    role: '',
    source: 'manual',
    interestType: '',
    priority: 'medium',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-bold text-white mb-6">Add New Lead</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm text-white/60 mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Role</label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Source</label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                >
                  <option value="manual">Manual Entry</option>
                  <option value="website">Website</option>
                  <option value="waitlist">Waitlist</option>
                  <option value="partner">Partner</option>
                  <option value="event">Event</option>
                  <option value="referral">Referral</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-white/60 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white resize-none"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-lg bg-white/5 text-white/70 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.email}
                className="flex-1 py-3 rounded-lg bg-emerald-500 text-black font-medium hover:bg-emerald-400 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Add Lead'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
}

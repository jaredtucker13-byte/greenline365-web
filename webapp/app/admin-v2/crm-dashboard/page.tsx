/**
 * CRM Dashboard - Consolidated Hub & Spoke Architecture
 * 
 * This is the main CRM "spoke" page featuring:
 * - KPI Strip (powered by analyticsApi)
 * - Lead Table (powered by coreApi)
 * - Detail Rail for record interactions
 * - Quick Add modal
 * - Drill-through to analytics
 * 
 * Data Flow:
 * - KPIs: analyticsApi.getCrmKPIs() -> KPICard components
 * - Records: coreApi.listLeads() -> DataTable
 * - Actions: coreApi.createLead(), coreApi.updateLead()
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { KPICard, FunnelChart, TimeSeriesChart, DataTable, type Column } from '../components/shared';
import { PageHeader } from '../components/PageHeader';

// ============================================
// TYPES
// ============================================

interface Lead {
  id: string;
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
  tags: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface CrmKPIs {
  totalLeads: number;
  newLeads: number;
  verifiedLeads: number;
  convertedLeads: number;
  lostLeads: number;
  verificationRate: number;
  conversionRate: number;
  totalRevenue: number;
  avgDealValue: number;
  pipelineValue: number;
}

interface AnalyticsMeta {
  source: string;
  lastProcessedAt: string;
  cacheTtlSec: number;
}

// ============================================
// CONSTANTS
// ============================================

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

type DateRange = '7d' | '30d' | '90d' | 'all';

// ============================================
// MAIN COMPONENT
// ============================================

export default function CRMDashboard() {
  // KPI State (from analyticsApi)
  const [kpis, setKpis] = useState<CrmKPIs | null>(null);
  const [kpiMeta, setKpiMeta] = useState<AnalyticsMeta | null>(null);
  const [kpiLoading, setKpiLoading] = useState(true);
  
  // Lead State (from coreApi)
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filter State
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // UI State
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // ============================================
  // DATA FETCHING
  // ============================================

  // Fetch KPIs from Analytics API
  const fetchKPIs = useCallback(async () => {
    setKpiLoading(true);
    try {
      const response = await fetch(`/api/analytics/crm?type=kpis&range=${dateRange}`);
      const result = await response.json();
      
      if (response.ok) {
        setKpis(result.data);
        setKpiMeta(result.meta);
      }
    } catch (err) {
      console.error('Failed to fetch KPIs:', err);
    } finally {
      setKpiLoading(false);
    }
  }, [dateRange]);

  // Fetch Leads from Core API
  const fetchLeads = useCallback(async () => {
    setLeadsLoading(true);
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
      setLeadsLoading(false);
    }
  }, [page, search, statusFilter, sourceFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchKPIs();
  }, [fetchKPIs]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // ============================================
  // ACTIONS
  // ============================================

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
        fetchKPIs(); // Refresh KPIs after status change
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
      fetchKPIs();
    } catch (err) {
      console.error('Failed to bulk update:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================
  // TABLE COLUMNS
  // ============================================

  const columns: Column<Lead>[] = [
    {
      key: 'contact',
      header: 'Contact',
      render: (lead) => (
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
      ),
    },
    {
      key: 'company',
      header: 'Company',
      render: (lead) => <span className="text-white/80">{lead.company || '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (lead) => {
        const config = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
            <span>{config.icon}</span>
            {config.label}
          </span>
        );
      },
    },
    {
      key: 'source',
      header: 'Source',
      render: (lead) => <span className="text-white/60 text-sm capitalize">{lead.source || '—'}</span>,
    },
    {
      key: 'value',
      header: 'Value',
      render: (lead) => (
        lead.value ? (
          <span className="text-emerald-400 font-medium">${lead.value.toLocaleString()}</span>
        ) : (
          <span className="text-white/30">—</span>
        )
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      render: (lead) => (
        <span className="text-white/40 text-sm">
          {new Date(lead.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (lead) => (
        <select
          value={lead.status}
          onChange={(e) => {
            e.stopPropagation();
            updateLeadStatus(lead.id, e.target.value);
          }}
          onClick={(e) => e.stopPropagation()}
          className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-[#39FF14] outline-none cursor-pointer"
        >
          {Object.entries(STATUS_CONFIG).map(([value, config]) => (
            <option key={value} value={value}>{config.label}</option>
          ))}
        </select>
      ),
    },
  ];

  // Calculate total from stats
  const totalLeads = Object.values(stats).reduce((a, b) => a + b, 0);

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
              {kpiMeta && (
                <div className="flex items-center gap-1 text-xs text-white/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Updated {new Date(kpiMeta.lastProcessedAt).toLocaleTimeString()}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {/* Date Range Selector */}
              <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                {(['7d', '30d', '90d', 'all'] as DateRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                      dateRange === range
                        ? 'bg-[#39FF14] text-black'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {range === 'all' ? 'All' : range}
                  </button>
                ))}
              </div>
              
              {/* Search */}
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
        {/* KPI Strip - Using Shared Components */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6" data-testid="kpi-strip">
          <KPICard
            title="Total Leads"
            value={kpis?.totalLeads ?? totalLeads}
            icon="👥"
            color="blue"
            trend={kpis?.newLeads ? { value: `${kpis.newLeads} new`, direction: 'up', label: 'today' } : undefined}
            sparkline={[10, 15, 12, 18, 22, 25, 30]}
            meta={kpiMeta || undefined}
            delay={0}
            testId="kpi-total-leads"
          />
          <KPICard
            title="Verified"
            value={kpis?.verifiedLeads ?? stats.verified ?? 0}
            icon="✓"
            color="emerald"
            trend={kpis ? { value: `${kpis.verificationRate}%`, direction: 'up', label: 'rate' } : undefined}
            sparkline={[5, 8, 10, 12, 15, 18, 20]}
            delay={0.1}
            testId="kpi-verified"
          />
          <KPICard
            title="Converted"
            value={kpis?.convertedLeads ?? stats.converted ?? 0}
            icon="🎉"
            color="purple"
            trend={kpis ? { value: `${kpis.conversionRate}%`, direction: 'up', label: 'conversion' } : undefined}
            sparkline={[2, 3, 5, 4, 6, 8, 10]}
            delay={0.2}
            testId="kpi-converted"
          />
          <KPICard
            title="Revenue"
            value={kpis ? `$${kpis.totalRevenue.toLocaleString()}` : '$0'}
            icon="💰"
            color="amber"
            trend={kpis?.avgDealValue ? { value: `$${kpis.avgDealValue.toLocaleString()}`, direction: 'neutral', label: 'avg deal' } : undefined}
            sparkline={[100, 200, 150, 300, 400, 350, 500]}
            delay={0.3}
            testId="kpi-revenue"
          />
          <KPICard
            title="Pipeline"
            value={kpis ? `$${kpis.pipelineValue.toLocaleString()}` : '$0'}
            icon="📊"
            color="cyan"
            onDrill={() => console.log('Drill to pipeline view')}
            delay={0.4}
            testId="kpi-pipeline"
          />
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

        {/* Lead Table - Using Shared DataTable */}
        <DataTable
          data={leads}
          columns={columns}
          keyField="id"
          selectable
          selectedIds={selectedLeads}
          onSelectionChange={setSelectedLeads}
          onRowClick={setSelectedLead}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={(key) => {
            if (sortBy === key) {
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
            } else {
              setSortBy(key);
              setSortOrder('desc');
            }
          }}
          loading={leadsLoading}
          emptyMessage="No leads found"
          emptyIcon="📭"
          testId="leads-table"
        />

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
              fetchKPIs();
            }}
            sourceOptions={SOURCE_OPTIONS}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// DETAIL RAIL COMPONENT
// ============================================

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

// ============================================
// ADD LEAD MODAL COMPONENT
// ============================================

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

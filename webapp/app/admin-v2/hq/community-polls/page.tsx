'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface PollOption {
  id: string;
  poll_id: string;
  business_id: string;
  business_name: string;
  business_image: string | null;
  vote_count: number;
}

interface Poll {
  id: string;
  title: string;
  description: string | null;
  category: string;
  destination_slug: string | null;
  status: 'draft' | 'active' | 'closed';
  created_at: string;
  closes_at: string | null;
  options: PollOption[];
  options_count: number;
  total_votes: number;
}

interface KPIs {
  totalActive: number;
  totalVotesCast: number;
  mostPopularTitle: string;
}

interface FormData {
  title: string;
  description: string;
  category: string;
  destination_slug: string;
  status: 'draft' | 'active' | 'closed';
  closes_at: string;
  options: { business_name: string; business_image: string }[];
}

// ─── Constants ──────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'services', label: 'Home Services' },
  { id: 'automotive', label: 'Automotive' },
  { id: 'marine-outdoor', label: 'Marine & Outdoor' },
  { id: 'dining', label: 'Dining' },
  { id: 'health-wellness', label: 'Health & Wellness' },
  { id: 'style-shopping', label: 'Style & Shopping' },
  { id: 'nightlife', label: 'Nightlife' },
  { id: 'convenience-grocery', label: 'Convenience & Grocery' },
  { id: 'emergency-services', label: 'Emergency Services' },
  { id: 'family-entertainment', label: 'Family Entertainment' },
  { id: 'hotels-lodging', label: 'Hotels & Lodging' },
  { id: 'professional-services', label: 'Professional Services' },
  { id: 'education', label: 'Education & Childcare' },
  { id: 'pets', label: 'Pets' },
  { id: 'plumbing', label: 'Plumbing' },
  { id: 'hvac', label: 'HVAC' },
  { id: 'roofing', label: 'Roofing' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'lawn-care', label: 'Lawn Care' },
];

const DESTINATIONS = [
  { slug: 'tampa', label: 'Tampa' },
  { slug: 'st-pete-beach', label: 'St. Pete Beach' },
  { slug: 'daytona-beach', label: 'Daytona Beach' },
  { slug: 'daytona', label: 'Daytona' },
  { slug: 'key-west', label: 'Key West' },
  { slug: 'sarasota', label: 'Sarasota' },
  { slug: 'ybor-city', label: 'Ybor City' },
  { slug: 'orlando', label: 'Orlando' },
  { slug: 'miami', label: 'Miami' },
  { slug: 'jacksonville', label: 'Jacksonville' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  draft: { bg: 'bg-white/[0.06]', text: 'text-white/50', border: 'border-white/10' },
  active: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  closed: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/20' },
};

const emptyForm: FormData = {
  title: '',
  description: '',
  category: '',
  destination_slug: '',
  status: 'draft',
  closes_at: '',
  options: [{ business_name: '', business_image: '' }],
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function CommunityPollsAdmin() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [kpis, setKpis] = useState<KPIs>({ totalActive: 0, totalVotesCast: 0, mostPopularTitle: '—' });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingPollId, setEditingPollId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  // Results view
  const [viewingResults, setViewingResults] = useState<Poll | null>(null);

  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Clear votes confirm
  const [clearingVotesId, setClearingVotesId] = useState<string | null>(null);

  // ─── Data Fetching ──────────────────────────────────────────────────────

  const fetchPolls = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/hq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'polls',
          search: search || undefined,
          status: statusFilter || undefined,
          page,
        }),
      });
      const json = await res.json();
      setPolls(json.polls || []);
      setTotal(json.total || 0);
      setTotalPages(json.totalPages || 1);
      setKpis(json.kpis || { totalActive: 0, totalVotesCast: 0, mostPopularTitle: '—' });
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => { fetchPolls(); }, [fetchPolls]);

  // ─── Actions ────────────────────────────────────────────────────────────

  const hqApi = async (action: string, params: any) => {
    const res = await fetch('/api/admin/hq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...params }),
    });
    return res.json();
  };

  const handleCreate = () => {
    setEditingPollId(null);
    setForm({ ...emptyForm, options: [{ business_name: '', business_image: '' }] });
    setShowForm(true);
  };

  const handleEdit = (poll: Poll) => {
    setEditingPollId(poll.id);
    setForm({
      title: poll.title,
      description: poll.description || '',
      category: poll.category,
      destination_slug: poll.destination_slug || '',
      status: poll.status,
      closes_at: poll.closes_at ? poll.closes_at.split('T')[0] : '',
      options: poll.options.map(o => ({
        business_name: o.business_name,
        business_image: o.business_image || '',
      })),
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.category) return;
    setSaving(true);

    try {
      if (editingPollId) {
        // Update poll metadata
        await hqApi('poll-update', {
          pollId: editingPollId,
          updates: {
            title: form.title,
            description: form.description || null,
            category: form.category,
            destination_slug: form.destination_slug || null,
            status: form.status,
            closes_at: form.closes_at ? new Date(form.closes_at).toISOString() : null,
          },
        });
      } else {
        // Create new poll with options
        await hqApi('poll-create', {
          title: form.title,
          description: form.description || null,
          category: form.category,
          destination_slug: form.destination_slug || null,
          status: form.status,
          closes_at: form.closes_at ? new Date(form.closes_at).toISOString() : null,
          options: form.options
            .filter(o => o.business_name.trim())
            .map(o => ({ business_name: o.business_name, business_image: o.business_image || null })),
        });
      }

      setShowForm(false);
      setEditingPollId(null);
      fetchPolls();
    } catch {
      // error handling
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (pollId: string) => {
    await hqApi('poll-duplicate', { pollId });
    fetchPolls();
  };

  const handleDelete = async (pollId: string) => {
    await hqApi('poll-delete', { pollId });
    setDeletingId(null);
    fetchPolls();
  };

  const handleAddOption = async (pollId: string, name: string) => {
    if (!name.trim()) return;
    await hqApi('poll-option-add', { pollId, business_name: name });
    fetchPolls();
  };

  const handleRemoveOption = async (optionId: string) => {
    await hqApi('poll-option-remove', { optionId });
    fetchPolls();
    if (viewingResults) {
      const updated = polls.find(p => p.id === viewingResults.id);
      if (updated) setViewingResults({ ...updated, options: updated.options.filter(o => o.id !== optionId) });
    }
  };

  const handleClearVotes = async (pollId: string) => {
    await hqApi('poll-clear-votes', { pollId });
    setClearingVotesId(null);
    fetchPolls();
    if (viewingResults && viewingResults.id === pollId) {
      setViewingResults({
        ...viewingResults,
        total_votes: 0,
        options: viewingResults.options.map(o => ({ ...o, vote_count: 0 })),
      });
    }
  };

  const handleToggleStatus = async (poll: Poll) => {
    const newStatus = poll.status === 'active' ? 'closed' : 'active';
    await hqApi('poll-update', { pollId: poll.id, updates: { status: newStatus } });
    fetchPolls();
    if (viewingResults && viewingResults.id === poll.id) {
      setViewingResults({ ...viewingResults, status: newStatus });
    }
  };

  const exportCSV = (poll: Poll) => {
    const header = 'Rank,Business Name,Votes,Percentage\n';
    const rows = poll.options.map((opt, idx) => {
      const pct = poll.total_votes > 0 ? Math.round((opt.vote_count / poll.total_votes) * 100) : 0;
      return `${idx + 1},"${opt.business_name}",${opt.vote_count},${pct}%`;
    }).join('\n');
    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `poll-results-${poll.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Form Option Helpers ────────────────────────────────────────────────

  const addFormOption = () => {
    setForm(prev => ({ ...prev, options: [...prev.options, { business_name: '', business_image: '' }] }));
  };

  const removeFormOption = (index: number) => {
    setForm(prev => ({ ...prev, options: prev.options.filter((_, i) => i !== index) }));
  };

  const updateFormOption = (index: number, field: 'business_name' | 'business_image', value: string) => {
    setForm(prev => ({
      ...prev,
      options: prev.options.map((o, i) => i === index ? { ...o, [field]: value } : o),
    }));
  };

  const moveFormOption = (from: number, to: number) => {
    if (to < 0 || to >= form.options.length) return;
    setForm(prev => {
      const options = [...prev.options];
      const [moved] = options.splice(from, 1);
      options.splice(to, 0, moved);
      return { ...prev, options };
    });
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Community Polls</h1>
          <p className="text-sm text-white/40 mt-1">Create and manage &ldquo;Best of&rdquo; polls for the directory</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchPolls}
            className="px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white/60 text-sm hover:bg-white/[0.1] transition"
          >
            Refresh
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-gold-500/20 border border-gold-500/30 rounded-lg text-gold-400 text-sm font-medium hover:bg-gold-500/30 transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Create New Poll
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 relative overflow-hidden group hover:bg-white/[0.05] transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.03] -translate-y-1/2 translate-x-1/2 bg-emerald-400" />
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-500/15 border border-emerald-500/20 mb-3">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-2xl font-semibold text-white tracking-tight">{kpis.totalActive}</p>
          <p className="text-xs text-white/40 mt-1">Active Polls</p>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 relative overflow-hidden group hover:bg-white/[0.05] transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.03] -translate-y-1/2 translate-x-1/2 bg-blue-400" />
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-500/15 border border-blue-500/20 mb-3">
            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <p className="text-2xl font-semibold text-white tracking-tight">{kpis.totalVotesCast.toLocaleString()}</p>
          <p className="text-xs text-white/40 mt-1">Total Votes Cast</p>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 relative overflow-hidden group hover:bg-white/[0.05] transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.03] -translate-y-1/2 translate-x-1/2 bg-gold-400" />
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gold-500/15 border border-gold-500/20 mb-3">
            <svg className="w-4 h-4 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-white tracking-tight truncate">{kpis.mostPopularTitle}</p>
          <p className="text-xs text-white/40 mt-1">Most Popular Poll</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 max-w-sm px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-gold-500/40"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white/70 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
        </select>
        <span className="text-sm text-white/30 ml-auto">{total} poll{total !== 1 ? 's' : ''}</span>
      </div>

      {/* Polls Table */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Title</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Status</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Category</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Votes</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Options</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Created</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Closes</th>
              <th className="text-right px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} className="border-b border-white/[0.04]">
                  <td colSpan={8} className="px-5 py-4"><div className="h-5 bg-white/[0.04] rounded animate-pulse" /></td>
                </tr>
              ))
            ) : polls.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-white/30 text-sm">
                  No polls found. <button onClick={handleCreate} className="text-gold-400 hover:underline">Create your first poll</button>
                </td>
              </tr>
            ) : polls.map((poll) => {
              const sc = STATUS_COLORS[poll.status];
              return (
                <tr key={poll.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition">
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-sm text-white/90 font-medium">{poll.title}</p>
                      {poll.destination_slug && (
                        <p className="text-[11px] text-white/30 mt-0.5">
                          {DESTINATIONS.find(d => d.slug === poll.destination_slug)?.label || poll.destination_slug}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium border ${sc.bg} ${sc.text} ${sc.border}`}>
                      {poll.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-white/60">
                      {CATEGORIES.find(c => c.id === poll.category)?.label || poll.category}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-white/80 font-medium">{poll.total_votes.toLocaleString()}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-white/60">{poll.options_count}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-white/40">{new Date(poll.created_at).toLocaleDateString()}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-white/40">
                      {poll.closes_at ? new Date(poll.closes_at).toLocaleDateString() : '—'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleEdit(poll)}
                        className="px-2.5 py-1.5 bg-white/[0.06] border border-white/[0.08] rounded-lg text-[11px] text-white/60 hover:bg-white/[0.1] transition"
                        title="Edit"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setViewingResults(poll)}
                        className="px-2.5 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[11px] text-blue-400 hover:bg-blue-500/20 transition"
                        title="View Results"
                      >
                        Results
                      </button>
                      <button
                        onClick={() => handleDuplicate(poll.id)}
                        className="px-2.5 py-1.5 bg-white/[0.06] border border-white/[0.08] rounded-lg text-[11px] text-white/60 hover:bg-white/[0.1] transition"
                        title="Duplicate"
                      >
                        Dup
                      </button>
                      <button
                        onClick={() => setDeletingId(poll.id)}
                        className="px-2.5 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-[11px] text-red-400 hover:bg-red-500/20 transition"
                        title="Delete"
                      >
                        Del
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/30">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 bg-white/[0.06] border border-white/[0.08] rounded-lg text-xs text-white/60 disabled:opacity-30 hover:bg-white/[0.1] transition"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 bg-white/[0.06] border border-white/[0.08] rounded-lg text-xs text-white/60 disabled:opacity-30 hover:bg-white/[0.1] transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          CREATE / EDIT POLL MODAL
          ═══════════════════════════════════════════════════════════════════════ */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0D1117] border border-white/[0.08] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-[#0D1117] border-b border-white/[0.06] px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold text-white">
                {editingPollId ? 'Edit Poll' : 'Create New Poll'}
              </h2>
              <button
                onClick={() => { setShowForm(false); setEditingPollId(null); }}
                className="text-white/40 hover:text-white/60 transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder='e.g. "Best Plumber in Tampa"'
                  className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/25 focus:outline-none focus:border-gold-500/40"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the poll..."
                  rows={2}
                  className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/25 focus:outline-none focus:border-gold-500/40 resize-none"
                />
              </div>

              {/* Category + Destination Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white/70 focus:outline-none focus:border-gold-500/40"
                  >
                    <option value="">Select category...</option>
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">
                    Destination <span className="text-white/20">(optional)</span>
                  </label>
                  <select
                    value={form.destination_slug}
                    onChange={(e) => setForm(prev => ({ ...prev, destination_slug: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white/70 focus:outline-none focus:border-gold-500/40"
                  >
                    <option value="">All Florida (no specific city)</option>
                    {DESTINATIONS.map(d => (
                      <option key={d.slug} value={d.slug}>{d.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status + Closes At Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">Status</label>
                  <div className="flex gap-2">
                    {(['draft', 'active', 'closed'] as const).map(s => {
                      const sc = STATUS_COLORS[s];
                      const selected = form.status === s;
                      return (
                        <button
                          key={s}
                          onClick={() => setForm(prev => ({ ...prev, status: s }))}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium border transition ${
                            selected
                              ? `${sc.bg} ${sc.text} ${sc.border}`
                              : 'bg-white/[0.02] text-white/30 border-white/[0.06] hover:bg-white/[0.04]'
                          }`}
                        >
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">
                    Closes At <span className="text-white/20">(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={form.closes_at}
                    onChange={(e) => setForm(prev => ({ ...prev, closes_at: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white/70 focus:outline-none focus:border-gold-500/40"
                  />
                </div>
              </div>

              {/* Options Section */}
              {!editingPollId && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">
                      Poll Options (Businesses)
                    </label>
                    <button
                      onClick={addFormOption}
                      className="text-[11px] text-gold-400 hover:text-gold-300 font-medium transition flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Add Option
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form.options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2 group">
                        {/* Drag handles */}
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => moveFormOption(idx, idx - 1)}
                            disabled={idx === 0}
                            className="text-white/20 hover:text-white/50 disabled:opacity-20 transition"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => moveFormOption(idx, idx + 1)}
                            disabled={idx === form.options.length - 1}
                            className="text-white/20 hover:text-white/50 disabled:opacity-20 transition"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>

                        <span className="text-[11px] text-white/20 w-5 text-center flex-shrink-0">{idx + 1}</span>

                        <input
                          type="text"
                          value={opt.business_name}
                          onChange={(e) => updateFormOption(idx, 'business_name', e.target.value)}
                          placeholder="Business name..."
                          className="flex-1 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/25 focus:outline-none focus:border-gold-500/40"
                        />
                        <input
                          type="text"
                          value={opt.business_image}
                          onChange={(e) => updateFormOption(idx, 'business_image', e.target.value)}
                          placeholder="Image URL (optional)"
                          className="w-48 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/25 focus:outline-none focus:border-gold-500/40"
                        />
                        <button
                          onClick={() => removeFormOption(idx)}
                          disabled={form.options.length <= 1}
                          className="p-1.5 text-white/20 hover:text-red-400 disabled:opacity-20 transition"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-[#0D1117] border-t border-white/[0.06] px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => { setShowForm(false); setEditingPollId(null); }}
                className="px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white/60 text-sm hover:bg-white/[0.1] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.title || !form.category}
                className="px-6 py-2 bg-gold-500/20 border border-gold-500/30 rounded-lg text-gold-400 text-sm font-medium hover:bg-gold-500/30 disabled:opacity-40 transition"
              >
                {saving ? 'Saving...' : editingPollId ? 'Save Changes' : 'Create Poll'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          VIEW RESULTS MODAL
          ═══════════════════════════════════════════════════════════════════════ */}
      {viewingResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0D1117] border border-white/[0.08] rounded-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-[#0D1117] border-b border-white/[0.06] px-6 py-4 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-white">{viewingResults.title}</h2>
                    {(() => {
                      const sc = STATUS_COLORS[viewingResults.status];
                      return (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${sc.bg} ${sc.text} ${sc.border}`}>
                          {viewingResults.status}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">
                    {viewingResults.total_votes} total votes &middot; {viewingResults.options_count} options
                  </p>
                </div>
                <button
                  onClick={() => setViewingResults(null)}
                  className="text-white/40 hover:text-white/60 transition"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Action bar */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => handleToggleStatus(viewingResults)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition ${
                    viewingResults.status === 'active'
                      ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                  }`}
                >
                  {viewingResults.status === 'active' ? 'Close Poll' : 'Reopen Poll'}
                </button>
                <button
                  onClick={() => setClearingVotesId(viewingResults.id)}
                  className="px-3 py-1.5 bg-white/[0.06] border border-white/[0.08] rounded-lg text-[11px] text-white/50 hover:bg-white/[0.1] transition"
                >
                  Clear All Votes
                </button>
                <button
                  onClick={() => exportCSV(viewingResults)}
                  className="px-3 py-1.5 bg-white/[0.06] border border-white/[0.08] rounded-lg text-[11px] text-white/50 hover:bg-white/[0.1] transition flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </button>
              </div>
            </div>

            <div className="p-6 space-y-3">
              {viewingResults.options.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-8">No options yet</p>
              ) : (
                viewingResults.options.map((opt, idx) => {
                  const pct = viewingResults.total_votes > 0
                    ? Math.round((opt.vote_count / viewingResults.total_votes) * 100)
                    : 0;
                  const isLeader = idx === 0 && opt.vote_count > 0;

                  return (
                    <div
                      key={opt.id}
                      className={`relative rounded-xl border overflow-hidden ${
                        isLeader ? 'border-gold-500/25 bg-gold-500/[0.04]' : 'border-white/[0.06] bg-white/[0.02]'
                      }`}
                    >
                      {/* Progress bar */}
                      <div
                        className="absolute inset-y-0 left-0 transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: isLeader
                            ? 'linear-gradient(90deg, rgba(201,169,78,0.12), rgba(201,169,78,0.04))'
                            : 'linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
                        }}
                      />

                      <div className="relative flex items-center gap-4 px-5 py-3.5">
                        {/* Rank */}
                        <span className={`text-sm font-bold w-6 text-center ${isLeader ? 'text-gold-400' : 'text-white/25'}`}>
                          #{idx + 1}
                        </span>

                        {/* Avatar */}
                        {opt.business_image ? (
                          <img
                            src={opt.business_image}
                            alt={opt.business_name}
                            className="w-9 h-9 rounded-lg object-cover border border-white/10 flex-shrink-0"
                          />
                        ) : (
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                            isLeader ? 'bg-gold-500/15 border-gold-500/20' : 'bg-white/[0.06] border-white/[0.08]'
                          }`}>
                            <span className={`text-xs font-bold ${isLeader ? 'text-gold-400' : 'text-white/40'}`}>
                              {opt.business_name[0]}
                            </span>
                          </div>
                        )}

                        {/* Name + votes */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isLeader ? 'text-white' : 'text-white/80'}`}>
                            {opt.business_name}
                          </p>
                          <p className="text-[11px] text-white/30">{opt.vote_count} vote{opt.vote_count !== 1 ? 's' : ''}</p>
                        </div>

                        {/* Percentage */}
                        <span className={`text-sm font-semibold flex-shrink-0 ${isLeader ? 'text-gold-400' : 'text-white/50'}`}>
                          {pct}%
                        </span>

                        {/* Remove option */}
                        <button
                          onClick={() => handleRemoveOption(opt.id)}
                          className="p-1 text-white/15 hover:text-red-400 transition flex-shrink-0"
                          title="Remove option"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Add option inline */}
              <AddOptionInline
                onAdd={(name) => {
                  handleAddOption(viewingResults.id, name);
                  // Re-fetch to update the results view
                  setTimeout(() => {
                    fetchPolls();
                    // We'll close and reopen to refresh
                  }, 500);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          DELETE CONFIRMATION MODAL
          ═══════════════════════════════════════════════════════════════════════ */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0D1117] border border-white/[0.08] rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">Delete Poll?</h3>
            <p className="text-sm text-white/50 mb-6">
              This will permanently delete the poll, all its options, and all votes. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white/60 text-sm hover:bg-white/[0.1] transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm font-medium hover:bg-red-500/30 transition"
              >
                Delete Poll
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ═══════════════════════════════════════════════════════════════════════
          CLEAR VOTES CONFIRMATION MODAL
          ═══════════════════════════════════════════════════════════════════════ */}
      {clearingVotesId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0D1117] border border-white/[0.08] rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">Clear All Votes?</h3>
            <p className="text-sm text-white/50 mb-6">
              This will reset all vote counts to zero and delete all voter records for this poll. This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setClearingVotesId(null)}
                className="px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white/60 text-sm hover:bg-white/[0.1] transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleClearVotes(clearingVotesId)}
                className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm font-medium hover:bg-red-500/30 transition"
              >
                Clear All Votes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Add Option Inline Component ────────────────────────────────────────────

function AddOptionInline({ onAdd }: { onAdd: (name: string) => void }) {
  const [name, setName] = useState('');
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full py-3 border border-dashed border-white/[0.08] rounded-xl text-xs text-white/30 hover:text-white/50 hover:border-white/15 transition flex items-center justify-center gap-2"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add Business Option
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 p-3 border border-white/[0.08] rounded-xl bg-white/[0.02]">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Business name..."
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter' && name.trim()) {
            onAdd(name.trim());
            setName('');
          }
          if (e.key === 'Escape') {
            setExpanded(false);
            setName('');
          }
        }}
        className="flex-1 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/25 focus:outline-none focus:border-gold-500/40"
      />
      <button
        onClick={() => {
          if (name.trim()) {
            onAdd(name.trim());
            setName('');
          }
        }}
        disabled={!name.trim()}
        className="px-3 py-2 bg-gold-500/20 border border-gold-500/30 rounded-lg text-gold-400 text-xs font-medium hover:bg-gold-500/30 disabled:opacity-40 transition"
      >
        Add
      </button>
      <button
        onClick={() => { setExpanded(false); setName(''); }}
        className="p-2 text-white/30 hover:text-white/50 transition"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

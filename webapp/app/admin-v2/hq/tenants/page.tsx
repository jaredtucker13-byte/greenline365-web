'use client';

import { useState, useEffect, useCallback } from 'react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  tier: string;
  industry: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  is_active: boolean;
  is_white_label?: boolean;
  created_at: string;
  updated_at: string;
  settings: any;
  user_businesses: Array<{ user_id: string; role: string; is_primary: boolean }>;
}

const tierLabels: Record<string, string> = { tier1: 'Starter', tier2: 'Pro', tier3: 'Enterprise' };
const tierColors: Record<string, string> = { tier1: '#60A5FA', tier2: '#A78BFA', tier3: '#34D399' };

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingTier, setEditingTier] = useState<{ id: string; tier: string } | null>(null);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/hq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'tenants',
          search: search || undefined,
          tier: tierFilter || undefined,
          status: statusFilter || undefined,
          page,
        }),
      });
      const json = await res.json();
      setTenants(json.tenants || []);
      setTotal(json.total || 0);
      setTotalPages(json.totalPages || 1);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [search, tierFilter, statusFilter, page]);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  const handleToggleActive = async (tenant: Tenant) => {
    await fetch('/api/admin/hq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'tenant-toggle',
        businessId: tenant.id,
        is_active: !tenant.is_active,
      }),
    });
    fetchTenants();
  };

  const handleTierChange = async (tenantId: string, newTier: string) => {
    const tierSettings: Record<string, any> = {
      tier1: {
        features: {
          content_forge: true, mockup_generator: true, social_posting: true,
          crm: false, analytics: false, knowledge_base: false, blog: false,
          email: false, sms: false, bookings: false, ai_receptionist: false, calendar: false,
        },
      },
      tier2: {
        features: {
          content_forge: true, mockup_generator: true, social_posting: true,
          crm: true, analytics: true, knowledge_base: true, blog: true,
          email: false, sms: false, bookings: false, ai_receptionist: false, calendar: false,
        },
      },
      tier3: {
        features: {
          content_forge: true, mockup_generator: true, social_posting: true,
          crm: true, analytics: true, knowledge_base: true, blog: true,
          email: true, sms: true, bookings: true, ai_receptionist: true, calendar: true,
        },
      },
    };

    await fetch('/api/admin/hq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'tenant-update',
        businessId: tenantId,
        updates: { tier: newTier, settings: tierSettings[newTier] },
      }),
    });
    setEditingTier(null);
    fetchTenants();
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Tenants</h1>
          <p className="text-sm text-white/40 mt-1">{total} registered businesses</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search name, slug, or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 max-w-sm px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/40"
        />
        <select
          value={tierFilter}
          onChange={(e) => { setTierFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white/70 focus:outline-none"
        >
          <option value="">All Tiers</option>
          <option value="tier1">Starter</option>
          <option value="tier2">Pro</option>
          <option value="tier3">Enterprise</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white/70 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Business</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Tier</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Members</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Status</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Created</th>
              <th className="text-right px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-white/[0.04]">
                  <td colSpan={6} className="px-5 py-4"><div className="h-5 bg-white/[0.04] rounded animate-pulse" /></td>
                </tr>
              ))
            ) : tenants.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-white/30 text-sm">No tenants found</td>
              </tr>
            ) : tenants.map((t) => (
              <tr key={t.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: tierColors[t.tier] + '25', border: `1px solid ${tierColors[t.tier]}35` }}
                    >
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="text-sm text-white/90 font-medium">{t.name}</p>
                      <p className="text-[11px] text-white/30">{t.slug} {t.industry ? `\u00b7 ${t.industry}` : ''}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  {editingTier?.id === t.id ? (
                    <select
                      value={editingTier.tier}
                      onChange={(e) => handleTierChange(t.id, e.target.value)}
                      onBlur={() => setEditingTier(null)}
                      autoFocus
                      className="px-2 py-1 bg-white/[0.08] border border-white/[0.15] rounded text-xs text-white focus:outline-none"
                    >
                      <option value="tier1">Starter</option>
                      <option value="tier2">Pro</option>
                      <option value="tier3">Enterprise</option>
                    </select>
                  ) : (
                    <button
                      onClick={() => setEditingTier({ id: t.id, tier: t.tier })}
                      className="text-xs px-2.5 py-1 rounded-full font-medium hover:opacity-80 transition"
                      style={{ backgroundColor: tierColors[t.tier] + '20', color: tierColors[t.tier], border: `1px solid ${tierColors[t.tier]}30` }}
                    >
                      {tierLabels[t.tier]}
                    </button>
                  )}
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm text-white/60">{t.user_businesses?.length || 0}</span>
                </td>
                <td className="px-5 py-4">
                  <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${t.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                    {t.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm text-white/40">{new Date(t.created_at).toLocaleDateString()}</span>
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                      className="px-3 py-1.5 bg-white/[0.06] border border-white/[0.08] rounded-lg text-[11px] text-white/60 hover:bg-white/[0.1] transition"
                    >
                      {expandedId === t.id ? 'Close' : 'Details'}
                    </button>
                    <button
                      onClick={() => handleToggleActive(t)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition ${
                        t.is_active
                          ? 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20'
                          : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                      }`}
                    >
                      {t.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expanded Detail Panel */}
      {expandedId && (() => {
        const tenant = tenants.find((t) => t.id === expandedId);
        if (!tenant) return null;
        const features = tenant.settings?.features || {};
        return (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{tenant.name} &mdash; Details</h3>
              <button onClick={() => setExpandedId(null)} className="text-white/40 hover:text-white/60">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-[11px] text-white/40 uppercase tracking-wider mb-1">Email</p>
                <p className="text-sm text-white/80">{tenant.email || 'Not set'}</p>
              </div>
              <div>
                <p className="text-[11px] text-white/40 uppercase tracking-wider mb-1">Phone</p>
                <p className="text-sm text-white/80">{tenant.phone || 'Not set'}</p>
              </div>
              <div>
                <p className="text-[11px] text-white/40 uppercase tracking-wider mb-1">Website</p>
                <p className="text-sm text-white/80">{tenant.website || 'Not set'}</p>
              </div>
              <div>
                <p className="text-[11px] text-white/40 uppercase tracking-wider mb-1">Industry</p>
                <p className="text-sm text-white/80">{tenant.industry || 'Not set'}</p>
              </div>
            </div>

            <div>
              <p className="text-[11px] text-white/40 uppercase tracking-wider mb-2">Enabled Features</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(features).map(([key, enabled]) => (
                  <span
                    key={key}
                    className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${
                      enabled
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                        : 'bg-white/[0.04] text-white/20 border border-white/[0.06]'
                    }`}
                  >
                    {key.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] text-white/40 uppercase tracking-wider mb-2">Members ({tenant.user_businesses?.length || 0})</p>
              <div className="flex flex-wrap gap-2">
                {(tenant.user_businesses || []).map((m, i) => (
                  <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.06] text-white/50 border border-white/[0.08]">
                    {m.user_id.slice(0, 8)}... &middot; {m.role}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

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
    </div>
  );
}

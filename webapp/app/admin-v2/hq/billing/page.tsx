'use client';

import { useState, useEffect, useCallback } from 'react';

interface Subscription {
  id: string;
  account_id: string;
  listing_id: string | null;
  status: string;
  billing_cycle: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  trial_ends_at: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  plan: {
    id: string;
    slug: string;
    product_type: string;
    name: string;
    price_monthly_cents: number;
    price_annual_cents: number;
  } | null;
}

interface BillingData {
  subscriptions: Subscription[];
  total: number;
  page: number;
  totalPages: number;
  summary: {
    mrr: number;
    totalSubscriptions: number;
    activeSubscriptions: number;
    statusBreakdown: Record<string, number>;
  };
}

const statusColors: Record<string, string> = {
  active: '#34D399',
  trialing: '#60A5FA',
  past_due: '#FB923C',
  canceled: '#EF4444',
  incomplete: '#F59E0B',
};

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/hq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'billing', page }),
      });
      const json = await res.json();
      setData(json);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const summary = data?.summary;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Billing & Subscriptions</h1>
        <p className="text-sm text-white/40 mt-1">Platform revenue and subscription overview</p>
      </div>

      {/* Revenue KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <p className="text-xs text-white/40 mb-1">Monthly Recurring Revenue</p>
          <p className="text-2xl font-semibold text-emerald-400">
            ${((summary?.mrr || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <p className="text-xs text-white/40 mb-1">Total Subscriptions</p>
          <p className="text-2xl font-semibold text-white">{summary?.totalSubscriptions || 0}</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <p className="text-xs text-white/40 mb-1">Active Subscriptions</p>
          <p className="text-2xl font-semibold text-blue-400">{summary?.activeSubscriptions || 0}</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <p className="text-xs text-white/40 mb-1">Status Breakdown</p>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {summary?.statusBreakdown && Object.entries(summary.statusBreakdown).map(([status, count]) => (
              <span
                key={status}
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: (statusColors[status] || '#666') + '15',
                  color: statusColors[status] || '#999',
                  border: `1px solid ${statusColors[status] || '#666'}25`,
                }}
              >
                {status}: {count}
              </span>
            ))}
            {(!summary?.statusBreakdown || Object.keys(summary.statusBreakdown).length === 0) && (
              <span className="text-[11px] text-white/20">No subscriptions</span>
            )}
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Plan</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Account</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Status</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Billing</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Period End</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Stripe ID</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-white/[0.04]">
                  <td colSpan={6} className="px-5 py-4"><div className="h-5 bg-white/[0.04] rounded animate-pulse" /></td>
                </tr>
              ))
            ) : !data?.subscriptions || data.subscriptions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-white/30 text-sm">
                  No subscriptions found. Revenue will appear here once tenants subscribe.
                </td>
              </tr>
            ) : data.subscriptions.map((s: Subscription) => (
              <tr key={s.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition">
                <td className="px-5 py-4">
                  <p className="text-sm text-white/90 font-medium">{s.plan?.name || 'Unknown Plan'}</p>
                  <p className="text-[11px] text-white/30">{s.plan?.product_type || ''}</p>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm text-white/50 font-mono">{s.account_id.slice(0, 8)}...</span>
                </td>
                <td className="px-5 py-4">
                  <span
                    className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                    style={{
                      backgroundColor: (statusColors[s.status] || '#666') + '15',
                      color: statusColors[s.status] || '#999',
                      border: `1px solid ${statusColors[s.status] || '#666'}25`,
                    }}
                  >
                    {s.status}
                    {s.cancel_at_period_end ? ' (canceling)' : ''}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm text-white/50 capitalize">{s.billing_cycle}</span>
                  <p className="text-[11px] text-white/30">
                    ${((s.billing_cycle === 'annual'
                      ? (s.plan?.price_annual_cents || 0)
                      : (s.plan?.price_monthly_cents || 0)) / 100).toFixed(2)}/{s.billing_cycle === 'annual' ? 'yr' : 'mo'}
                  </p>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm text-white/40">
                    {s.current_period_end ? new Date(s.current_period_end).toLocaleDateString() : '-'}
                  </span>
                </td>
                <td className="px-5 py-4">
                  {s.stripe_subscription_id ? (
                    <span className="text-[11px] text-white/30 font-mono">{s.stripe_subscription_id.slice(0, 16)}...</span>
                  ) : (
                    <span className="text-[11px] text-white/20">No Stripe ID</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/30">Page {page} of {data.totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 bg-white/[0.06] border border-white/[0.08] rounded-lg text-xs text-white/60 disabled:opacity-30 hover:bg-white/[0.1] transition"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(data.totalPages, page + 1))}
              disabled={page === data.totalPages}
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

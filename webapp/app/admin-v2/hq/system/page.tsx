'use client';

import { useState, useEffect, useCallback } from 'react';

interface SystemData {
  auditLogs: Array<{
    id: string;
    action: string;
    details: any;
    user_id: string | null;
    created_at: string;
  }>;
  totalLogs: number;
  page: number;
  totalPages: number;
  tableCounts: Record<string, number>;
}

const tableLabels: Record<string, string> = {
  businesses: 'Businesses (Tenants)',
  profiles: 'User Profiles',
  bookings: 'Bookings',
  crm_leads: 'CRM Leads',
  content_schedule: 'Scheduled Content',
  waitlist_submissions: 'Waitlist',
  newsletter_subscriptions: 'Newsletter Subs',
};

const tableColors: Record<string, string> = {
  businesses: '#34D399',
  profiles: '#60A5FA',
  bookings: '#A78BFA',
  crm_leads: '#F472B6',
  content_schedule: '#FB923C',
  waitlist_submissions: '#FBBF24',
  newsletter_subscriptions: '#2DD4BF',
};

export default function SystemPage() {
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/hq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'system', page }),
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

  const totalRows = data?.tableCounts
    ? (Object.values(data.tableCounts) as number[]).reduce((a: number, b: number) => a + b, 0)
    : 0;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">System Health</h1>
          <p className="text-sm text-white/40 mt-1">Database overview and audit trail</p>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white/60 text-sm hover:bg-white/[0.1] transition"
        >
          Refresh
        </button>
      </div>

      {/* Database Table Counts */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-medium text-white/60">Database Tables</h3>
          <span className="text-xs text-white/30">{totalRows.toLocaleString()} total rows</span>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-8 bg-white/[0.04] rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {data?.tableCounts && (Object.entries(data.tableCounts) as [string, number][])
              .sort(([, a], [, b]) => b - a)
              .map(([table, count]) => {
                const maxCount = Math.max(...(Object.values(data.tableCounts) as number[]), 1);
                const pct = (count / maxCount) * 100;
                const color = tableColors[table] || '#60A5FA';
                return (
                  <div key={table}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white/70">{tableLabels[table] || table}</span>
                      <span className="text-xs font-mono text-white/40">{count.toLocaleString()} rows</span>
                    </div>
                    <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.max(pct, 1)}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Platform Status Indicators */}
      <div className="grid grid-cols-3 gap-4">
        <StatusCard label="Supabase" status="operational" detail="Database & Auth" />
        <StatusCard label="Stripe" status="operational" detail="Payments & Billing" />
        <StatusCard label="Vercel" status="operational" detail="Hosting & Edge" />
      </div>

      {/* Audit Logs */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h3 className="text-sm font-medium text-white/60">Activity Log</h3>
          <span className="text-xs text-white/30">{data?.totalLogs || 0} entries</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Action</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">User ID</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Details</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-white/[0.04]">
                  <td colSpan={4} className="px-5 py-4"><div className="h-5 bg-white/[0.04] rounded animate-pulse" /></td>
                </tr>
              ))
            ) : !data?.auditLogs || data.auditLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-white/30 text-sm">No audit log entries yet</td>
              </tr>
            ) : data.auditLogs.map((log: SystemData['auditLogs'][0]) => (
              <tr key={log.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition">
                <td className="px-5 py-3">
                  <span className="text-sm text-white/80 font-medium">{log.action}</span>
                </td>
                <td className="px-5 py-3">
                  <span className="text-sm text-white/40 font-mono">
                    {log.user_id ? `${log.user_id.slice(0, 8)}...` : 'System'}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className="text-[11px] text-white/30 font-mono max-w-xs truncate block">
                    {log.details ? JSON.stringify(log.details).slice(0, 60) : '-'}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className="text-sm text-white/40">{new Date(log.created_at).toLocaleString()}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Audit Log Pagination */}
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

// ─── Status Card ─────────────────────────────────────────────────────────────

function StatusCard({ label, status, detail }: {
  label: string;
  status: 'operational' | 'degraded' | 'down';
  detail: string;
}) {
  const statusConfig = {
    operational: { color: '#34D399', bg: '#34D39915', border: '#34D39920', label: 'Operational' },
    degraded: { color: '#FB923C', bg: '#FB923C15', border: '#FB923C20', label: 'Degraded' },
    down: { color: '#EF4444', bg: '#EF444415', border: '#EF444420', label: 'Down' },
  };
  const cfg = statusConfig[status];

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-white/80">{label}</p>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: cfg.color, boxShadow: `0 0 6px ${cfg.color}60` }} />
          <span className="text-[10px] font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
        </div>
      </div>
      <p className="text-[11px] text-white/30">{detail}</p>
    </div>
  );
}

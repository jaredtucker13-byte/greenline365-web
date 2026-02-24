'use client';

import { useState, useEffect, useCallback } from 'react';

interface AnalyticsData {
  signupsByDay: Record<string, number>;
  bookingsByDay: Record<string, number>;
  leadsByDay: Record<string, number>;
  waitlistByDay: Record<string, number>;
  leadSources: Record<string, number>;
  totals: {
    newBusinesses: number;
    newBookings: number;
    newLeads: number;
    newWaitlist: number;
  };
  period: { since: string; until: string };
}

const ranges = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: 'all', label: 'All Time' },
];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/hq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analytics', range }),
      });
      const json = await res.json();
      setData(json);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Platform Analytics</h1>
          <p className="text-sm text-white/40 mt-1">Growth metrics and pipeline intelligence</p>
        </div>
        <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-lg p-1">
          {ranges.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                range === r.value
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-4 gap-4">
        <TotalCard label="New Businesses" value={data?.totals.newBusinesses || 0} color="#34D399" loading={loading} />
        <TotalCard label="New Bookings" value={data?.totals.newBookings || 0} color="#60A5FA" loading={loading} />
        <TotalCard label="New Leads" value={data?.totals.newLeads || 0} color="#F472B6" loading={loading} />
        <TotalCard label="Waitlist Signups" value={data?.totals.newWaitlist || 0} color="#FB923C" loading={loading} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-6">
        <BarChart
          title="Business Signups"
          data={data?.signupsByDay || {}}
          color="#34D399"
          loading={loading}
        />
        <BarChart
          title="Bookings"
          data={data?.bookingsByDay || {}}
          color="#60A5FA"
          loading={loading}
        />
        <BarChart
          title="CRM Leads"
          data={data?.leadsByDay || {}}
          color="#F472B6"
          loading={loading}
        />
        <BarChart
          title="Waitlist"
          data={data?.waitlistByDay || {}}
          color="#FB923C"
          loading={loading}
        />
      </div>

      {/* Lead Sources */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
        <h3 className="text-sm font-medium text-white/60 mb-4">Lead Sources</h3>
        {loading ? (
          <div className="h-20 bg-white/[0.04] rounded animate-pulse" />
        ) : (
          <div className="space-y-3">
            {data?.leadSources && Object.entries(data.leadSources).length > 0 ? (
              (Object.entries(data.leadSources) as [string, number][])
                .sort(([, a], [, b]) => b - a)
                .map(([source, count]) => {
                  const totalLeads = data.totals.newLeads || 1;
                  const pct = Math.round((count / totalLeads) * 100);
                  return (
                    <div key={source}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-white/70 capitalize">{source}</span>
                        <span className="text-xs text-white/40">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
            ) : (
              <p className="text-white/30 text-sm">No lead source data for this period</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Total Card ──────────────────────────────────────────────────────────────

function TotalCard({ label, value, color, loading }: {
  label: string;
  value: number;
  color: string;
  loading: boolean;
}) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
      {loading ? (
        <div className="space-y-2">
          <div className="h-4 w-20 bg-white/[0.04] rounded animate-pulse" />
          <div className="h-8 w-16 bg-white/[0.04] rounded animate-pulse" />
        </div>
      ) : (
        <>
          <p className="text-xs text-white/40 mb-1">{label}</p>
          <p className="text-2xl font-semibold" style={{ color }}>{value.toLocaleString()}</p>
        </>
      )}
    </div>
  );
}

// ─── Bar Chart ───────────────────────────────────────────────────────────────

function BarChart({ title, data, color, loading }: {
  title: string;
  data: Record<string, number>;
  color: string;
  loading: boolean;
}) {
  const entries = Object.entries(data).sort(([a], [b]) => a.localeCompare(b));
  const maxVal = Math.max(...entries.map(([, v]) => v), 1);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);

  // Only show last 14 bars max for readability
  const displayEntries = entries.slice(-14);

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white/60">{title}</h3>
        <span className="text-xs font-medium" style={{ color }}>{total} total</span>
      </div>
      {loading ? (
        <div className="h-32 bg-white/[0.04] rounded animate-pulse" />
      ) : displayEntries.length === 0 ? (
        <div className="h-32 flex items-center justify-center">
          <p className="text-sm text-white/20">No data for this period</p>
        </div>
      ) : (
        <div className="flex items-end gap-1 h-32">
          {displayEntries.map(([day, count]) => {
            const height = (count / maxVal) * 100;
            const dateLabel = day.slice(5); // MM-DD
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-1 group">
                <span className="text-[9px] text-white/30 opacity-0 group-hover:opacity-100 transition">
                  {count}
                </span>
                <div
                  className="w-full rounded-t transition-all duration-300 group-hover:opacity-80"
                  style={{
                    height: `${Math.max(height, 2)}%`,
                    backgroundColor: color + '60',
                    border: `1px solid ${color}30`,
                  }}
                />
                <span className="text-[8px] text-white/20 -rotate-45 origin-top-left mt-1 whitespace-nowrap">
                  {dateLabel}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

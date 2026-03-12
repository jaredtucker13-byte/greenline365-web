'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePortalContext } from '@/lib/hooks/usePortalContext';
import StatsCard from '@/components/portal/StatsCard';
import UpgradeCTA from '@/components/portal/UpgradeCTA';

interface BasicStats {
  views_30d: number;
  clicks_30d: number;
  reviews_count: number;
  avg_rating: number;
  trust_score: number;
}

interface AdvancedStats {
  daily_views: Record<string, number>;
  daily_clicks: Record<string, number>;
  top_referrers: Array<{ source: string; count: number }>;
  click_through_rate: number;
}

/** Fill missing days in a date-keyed record so charts show continuous data */
function fillDays(data: Record<string, number>, days: number): Array<{ date: string; label: string; value: number }> {
  const result: Array<{ date: string; label: string; value: number }> = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const key = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    result.push({ date: key, label, value: data[key] || 0 });
  }
  return result;
}

/** Pure CSS bar chart component */
function BarChart({
  data,
  color = 'gold',
  height = 160,
}: {
  data: Array<{ date: string; label: string; value: number }>;
  color?: 'gold' | 'teal';
  height?: number;
}) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const barColor = color === 'gold' ? 'bg-gold-500' : 'bg-neon-teal-500';
  const barColorMuted = color === 'gold' ? 'bg-gold-500/40' : 'bg-neon-teal-500/40';

  return (
    <div className="relative">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 flex h-full flex-col justify-between pr-2 text-right" style={{ height }}>
        <span className="text-[10px] text-white/30">{maxVal}</span>
        <span className="text-[10px] text-white/30">{Math.round(maxVal / 2)}</span>
        <span className="text-[10px] text-white/30">0</span>
      </div>

      {/* Chart area */}
      <div className="ml-8">
        <div className="flex items-end gap-[2px]" style={{ height }}>
          {data.map((d, i) => {
            const pct = (d.value / maxVal) * 100;
            return (
              <div
                key={d.date}
                className="group relative flex-1 cursor-pointer"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div
                  className={`w-full rounded-t transition-all duration-200 ${
                    hoveredIdx === i ? barColor : barColorMuted
                  }`}
                  style={{ height: `${pct}%`, minHeight: d.value > 0 ? '2px' : '0' }}
                />
                {/* Tooltip */}
                {hoveredIdx === i && (
                  <div className="absolute -top-10 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-os-dark-900 border border-white/10 px-2.5 py-1 text-xs shadow-lg">
                    <span className="font-medium text-white">{d.value}</span>
                    <span className="text-white/40 ml-1">{d.label}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* X-axis labels — show every 5th */}
        <div className="mt-1 flex">
          {data.map((d, i) => (
            <div key={d.date} className="flex-1 text-center">
              {i % 5 === 0 ? (
                <span className="text-[10px] text-white/30">{d.label.split(' ')[1]}</span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Referrer bar with proportional width */
function ReferrerBar({ source, count, maxCount }: { source: string; count: number; maxCount: number }) {
  const pct = (count / maxCount) * 100;
  return (
    <li className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/60 truncate max-w-[200px]">{source}</span>
        <span className="font-medium text-white tabular-nums">{count}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gold-500/60 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </li>
  );
}

export default function StatsPage() {
  const { activeListing } = usePortalContext();
  const [basic, setBasic] = useState<BasicStats | null>(null);
  const [advanced, setAdvanced] = useState<AdvancedStats | null>(null);
  const [hasAdvanced, setHasAdvanced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState<'views' | 'clicks' | 'both'>('both');

  useEffect(() => {
    if (!activeListing) return;

    setLoading(true);
    fetch(`/api/portal/stats?listing_id=${activeListing.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setBasic(data.basic);
          setAdvanced(data.advanced);
          setHasAdvanced(data.has_advanced);
        }
        setLoading(false);
      });
  }, [activeListing]);

  const viewsData = useMemo(
    () => (advanced ? fillDays(advanced.daily_views, 30) : []),
    [advanced]
  );
  const clicksData = useMemo(
    () => (advanced ? fillDays(advanced.daily_clicks, 30) : []),
    [advanced]
  );

  if (!activeListing) {
    return <p className="text-white/50">No listing found.</p>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Listing Stats</h1>
        <p className="mt-1 text-sm text-white/50">
          Track how your listing performs in the directory.
        </p>
      </div>

      {/* Basic stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <StatsCard
          label="Views (30 days)"
          value={basic?.views_30d ?? 0}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
        />
        <StatsCard
          label="Clicks (30 days)"
          value={basic?.clicks_30d ?? 0}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
          }
        />
        <StatsCard
          label="Reviews"
          value={basic?.reviews_count ?? 0}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          }
        />
        <StatsCard
          label="Avg Rating"
          value={basic?.avg_rating ? basic.avg_rating.toFixed(1) : '—'}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
        />
        <StatsCard
          label="Trust Score"
          value={basic?.trust_score ?? 0}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
        />
      </div>

      {/* Advanced stats */}
      {hasAdvanced && advanced ? (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-white">Advanced Analytics</h2>

          {/* CTR + Summary row */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <span className="text-xs text-white/50">Click-Through Rate</span>
              <p className="mt-1 text-3xl font-bold text-gold-500">
                {advanced.click_through_rate}%
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <span className="text-xs text-white/50">Avg Daily Views</span>
              <p className="mt-1 text-3xl font-bold text-white">
                {viewsData.length > 0
                  ? (viewsData.reduce((s, d) => s + d.value, 0) / viewsData.length).toFixed(1)
                  : '0'}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <span className="text-xs text-white/50">Avg Daily Clicks</span>
              <p className="mt-1 text-3xl font-bold text-white">
                {clicksData.length > 0
                  ? (clicksData.reduce((s, d) => s + d.value, 0) / clicksData.length).toFixed(1)
                  : '0'}
              </p>
            </div>
          </div>

          {/* Chart toggle + Views chart */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-white/70">Traffic (30 days)</h3>
              <div className="flex gap-1 rounded-lg bg-white/5 p-0.5">
                {(['views', 'clicks', 'both'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setChartView(v)}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                      chartView === v
                        ? 'bg-gold-500 text-black'
                        : 'text-white/50 hover:text-white'
                    }`}
                  >
                    {v === 'both' ? 'Both' : v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {(chartView === 'views' || chartView === 'both') && (
              <div className={chartView === 'both' ? 'mb-6' : ''}>
                {chartView === 'both' && (
                  <div className="mb-2 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-gold-500" />
                    <span className="text-xs text-white/50">Views</span>
                  </div>
                )}
                <BarChart data={viewsData} color="gold" />
              </div>
            )}

            {(chartView === 'clicks' || chartView === 'both') && (
              <div>
                {chartView === 'both' && (
                  <div className="mb-2 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-neon-teal-500" />
                    <span className="text-xs text-white/50">Clicks</span>
                  </div>
                )}
                <BarChart data={clicksData} color="teal" />
              </div>
            )}
          </div>

          {/* Top Referrers */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h3 className="mb-4 text-sm font-medium text-white/70">Top Referrers</h3>
            {advanced.top_referrers.length > 0 ? (
              <ul className="space-y-3">
                {advanced.top_referrers.map((ref) => (
                  <ReferrerBar
                    key={ref.source}
                    source={ref.source}
                    count={ref.count}
                    maxCount={advanced.top_referrers[0].count}
                  />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-white/40">No referrer data yet.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="pointer-events-none space-y-4 opacity-30 blur-[3px]">
            <div className="grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <div className="h-4 w-24 rounded bg-white/10" />
                  <div className="mt-2 h-8 w-16 rounded bg-white/10" />
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="h-6 w-48 rounded bg-white/10" />
              <div className="mt-4 flex h-40 items-end gap-1">
                {Array.from({ length: 30 }, (_, i) => (
                  <div key={i} className="flex-1">
                    <div
                      className="w-full rounded-t bg-white/10"
                      style={{ height: `${20 + Math.random() * 60}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="h-6 w-32 rounded bg-white/10" />
              <div className="mt-4 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between">
                      <div className="h-4 w-24 rounded bg-white/10" />
                      <div className="h-4 w-8 rounded bg-white/10" />
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <UpgradeCTA
            feature="Detailed Analytics"
            description="Upgrade for daily traffic charts, click-through rates, and referrer insights."
            variant="overlay"
          />
        </div>
      )}
    </div>
  );
}

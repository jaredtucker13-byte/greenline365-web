'use client';

import { useState, useEffect } from 'react';
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

export default function StatsPage() {
  const { activeListing } = usePortalContext();
  const [basic, setBasic] = useState<BasicStats | null>(null);
  const [advanced, setAdvanced] = useState<AdvancedStats | null>(null);
  const [hasAdvanced, setHasAdvanced] = useState(false);
  const [loading, setLoading] = useState(true);

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

          {/* CTR */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/50">Click-Through Rate</span>
              <span className="text-2xl font-bold text-gold-500">
                {advanced.click_through_rate}%
              </span>
            </div>
          </div>

          {/* Views chart (simple bar representation) */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h3 className="mb-4 text-sm font-medium text-white/70">Views Over Time (30 days)</h3>
            <div className="flex h-32 items-end gap-1">
              {Object.entries(advanced.daily_views).map(([day, count]) => {
                const maxCount = Math.max(...Object.values(advanced.daily_views), 1);
                const height = (count / maxCount) * 100;
                return (
                  <div
                    key={day}
                    className="group relative flex-1"
                    title={`${day}: ${count} views`}
                  >
                    <div
                      className="w-full rounded-t bg-gold-500/60 transition-colors group-hover:bg-gold-500"
                      style={{ height: `${height}%`, minHeight: count > 0 ? '2px' : '0' }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Referrers */}
          {advanced.top_referrers.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h3 className="mb-4 text-sm font-medium text-white/70">Top Referrers</h3>
              <ul className="space-y-2">
                {advanced.top_referrers.map((ref) => (
                  <li key={ref.source} className="flex items-center justify-between text-sm">
                    <span className="text-white/60">{ref.source}</span>
                    <span className="font-medium text-white">{ref.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          <div className="pointer-events-none space-y-4 opacity-30 blur-[3px]">
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="h-6 w-48 rounded bg-white/10" />
              <div className="mt-4 h-32 rounded bg-white/5" />
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="h-6 w-32 rounded bg-white/10" />
              <div className="mt-4 space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 w-24 rounded bg-white/10" />
                    <div className="h-4 w-8 rounded bg-white/10" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <UpgradeCTA
            feature="Detailed Analytics"
            description="Upgrade for views over time, click-through rates, and top referrers."
            variant="overlay"
          />
        </div>
      )}
    </div>
  );
}

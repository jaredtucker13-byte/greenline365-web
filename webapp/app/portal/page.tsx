'use client';

import { useEffect, useState } from 'react';
import { usePortalContext } from '@/lib/hooks/usePortalContext';
import StatsCard from '@/components/portal/StatsCard';
import OnboardingChecklist from '@/components/portal/OnboardingChecklist';
import UpgradeCTA from '@/components/portal/UpgradeCTA';
import Link from 'next/link';

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  href: string;
  proOnly?: boolean;
}

interface BasicStats {
  views_30d: number;
  clicks_30d: number;
  reviews_count: number;
  avg_rating: number;
}

export default function PortalDashboard() {
  const { activeListing, directorySubscription, commandCenterSubscription } =
    usePortalContext();
  const [stats, setStats] = useState<BasicStats | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [isPro, setIsPro] = useState(false);

  const isFree = !directorySubscription;

  useEffect(() => {
    if (!activeListing) return;

    // Fetch stats and onboarding in parallel
    Promise.all([
      fetch(`/api/portal/stats?listing_id=${activeListing.id}`).then((r) =>
        r.ok ? r.json() : null
      ),
      fetch(`/api/portal/onboarding?listing_id=${activeListing.id}`).then((r) =>
        r.ok ? r.json() : null
      ),
    ]).then(([statsData, onboardingData]) => {
      if (statsData) setStats(statsData.basic);
      if (onboardingData) {
        setChecklist(onboardingData.checklist);
        setIsPro(onboardingData.isPro);
      }
    });
  }, [activeListing]);

  if (!activeListing) {
    return (
      <div className="text-center py-20">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
          <svg className="h-8 w-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-white">No Listing Found</h2>
        <p className="mt-2 text-sm text-white/50">
          You haven&apos;t claimed a business listing yet. Search for your business in the directory to claim it.
        </p>
        <Link
          href="/directory"
          className="mt-4 inline-flex items-center rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-black"
        >
          Find Your Business
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome, {activeListing.business_name}
        </h1>
        <p className="mt-1 text-sm text-white/50">
          Manage your listing, photos, and more from your portal.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatsCard
          label="Views this month"
          value={stats?.views_30d ?? '—'}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
        />
        <StatsCard
          label="Clicks this month"
          value={stats?.clicks_30d ?? '—'}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
          }
        />
        <StatsCard
          label="Reviews"
          value={stats?.reviews_count ?? '—'}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
        />
        <StatsCard
          label="Avg Rating"
          value={stats?.avg_rating ? stats.avg_rating.toFixed(1) : '—'}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Onboarding checklist */}
      {checklist.length > 0 && (
        <OnboardingChecklist items={checklist} isPro={isPro} />
      )}

      {/* Upgrade CTA for free tier */}
      {isFree && (
        <UpgradeCTA
          feature="Directory Pro"
          description="Unlock extended descriptions, menu editor, priority placement, and up to 20 photos."
        />
      )}

      {/* Command Center promo */}
      {!commandCenterSubscription && (
        <div className="rounded-xl border border-neon-teal-500/20 bg-neon-teal-500/5 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neon-teal-500/20">
              <svg className="h-5 w-5 text-neon-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-white">
                Supercharge with Command Center
              </h3>
              <p className="mt-1 text-xs text-white/50">
                AI-powered bookings, automated campaigns, calendar sync, and intelligent review responses.
              </p>
              <Link
                href="/portal/upgrade"
                className="mt-3 inline-flex items-center rounded-lg bg-neon-teal-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-neon-teal-400"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

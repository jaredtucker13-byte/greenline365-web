'use client';

import { useEffect, useState } from 'react';
import { usePortalContext } from '@/lib/hooks/usePortalContext';
import StatsCard from '@/components/portal/StatsCard';
import OnboardingChecklist from '@/components/portal/OnboardingChecklist';
import UpgradeCTA from '@/components/portal/UpgradeCTA';
import Link from 'next/link';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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

interface ActivityItem {
  id: string;
  description: string;
  created_at: string;
  type?: string;
}

interface Notification {
  id: string;
  type: 'warning' | 'action' | 'info' | 'success';
  title: string;
  message: string;
  action_label?: string;
  action_href?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatPrice(cents: number, cycle: string): string {
  const dollars = (cents / 100).toFixed(2);
  return `$${dollars}/${cycle === 'annual' ? 'yr' : 'mo'}`;
}

/* ------------------------------------------------------------------ */
/*  Quick-action definitions                                           */
/* ------------------------------------------------------------------ */

const quickActions = [
  {
    label: 'Edit Listing',
    href: '/portal/listing',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    label: 'Upload Photos',
    href: '/portal/photos',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: 'Update Hours',
    href: '/portal/hours',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: 'View Reviews',
    href: '/portal/reviews',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  {
    label: 'View Stats',
    href: '/portal/stats',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    label: 'Manage Team',
    href: '/portal/team',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  Notification icon helper                                           */
/* ------------------------------------------------------------------ */

function notificationIcon(type: Notification['type']) {
  switch (type) {
    case 'warning':
      return (
        <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    case 'action':
      return (
        <svg className="h-5 w-5 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case 'success':
      return (
        <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return (
        <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

const notificationStyles: Record<Notification['type'], string> = {
  warning: 'border-yellow-500/20 bg-yellow-500/5',
  action: 'border-gold-500/20 bg-gold-500/5',
  info: 'border-blue-500/20 bg-blue-500/5',
  success: 'border-green-500/20 bg-green-500/5',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PortalDashboard() {
  const {
    activeListing,
    directorySubscription,
    commandCenterSubscription,
  } = usePortalContext();

  const [stats, setStats] = useState<BasicStats | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [isPro, setIsPro] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const isFree = !directorySubscription;

  /* ---- data fetching ---- */
  useEffect(() => {
    if (!activeListing) return;

    setLoading(true);

    Promise.all([
      fetch(`/api/portal/stats?listing_id=${activeListing.id}`).then((r) =>
        r.ok ? r.json() : null
      ),
      fetch(`/api/portal/onboarding?listing_id=${activeListing.id}`).then((r) =>
        r.ok ? r.json() : null
      ),
      fetch(`/api/portal/activity?listing_id=${activeListing.id}`).then((r) =>
        r.ok ? r.json() : null
      ),
      fetch('/api/portal/notifications').then((r) =>
        r.ok ? r.json() : null
      ),
    ]).then(([statsData, onboardingData, activityData, notificationsData]) => {
      if (statsData) setStats(statsData.basic);
      if (onboardingData) {
        setChecklist(onboardingData.checklist);
        setIsPro(onboardingData.isPro);
      }
      if (activityData?.activities) setActivities(activityData.activities.slice(0, 10));
      if (notificationsData?.notifications) setNotifications(notificationsData.notifications);
      setLoading(false);
    });
  }, [activeListing]);

  /* ---- no-listing empty state ---- */
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

  /* ---- listing status badge ---- */
  const statusBadge = (() => {
    if (activeListing.is_published) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400 ring-1 ring-green-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
          Published
        </span>
      );
    }
    if (activeListing.slug) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-400 ring-1 ring-yellow-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
          Draft
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-white/40 ring-1 ring-white/10">
        <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
        Unpublished
      </span>
    );
  })();

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  /* ---- subscription helpers ---- */
  const plan = directorySubscription?.plan;
  const priceField =
    directorySubscription?.billing_cycle === 'annual'
      ? plan?.price_annual_cents
      : plan?.price_monthly_cents;

  return (
    <div className="space-y-8">
      {/* =============== 1. Welcome Header =============== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {activeListing.business_name}
          </h1>
          <p className="mt-1 text-sm text-white/50">{today}</p>
        </div>
        <div className="flex items-center gap-3">
          {statusBadge}
          {activeListing.is_published && activeListing.slug && (
            <Link
              href={`/listing/${activeListing.slug}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/10"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Live Listing
            </Link>
          )}
        </div>
      </div>

      {/* =============== 2. KPI Strip =============== */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatsCard
          label="Views (30d)"
          value={stats?.views_30d ?? '—'}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
        />
        <StatsCard
          label="Clicks (30d)"
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

      {/* =============== 3. Quick Actions Grid =============== */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/40">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 transition hover:bg-white/10"
            >
              <span className="text-white/50 transition group-hover:text-gold-500">
                {action.icon}
              </span>
              <span className="text-sm font-medium text-white/70 transition group-hover:text-white">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* =============== 4. Two-Column Layout =============== */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* ---- Left column: Activity Feed ---- */}
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/40">
              Recent Activity
            </h2>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-gold-500" />
              </div>
            ) : activities.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-white/30">No recent activity</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {activities.map((activity) => (
                  <li key={activity.id} className="flex items-start gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold-500/60" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white/70">{activity.description}</p>
                      <p className="mt-0.5 text-xs text-white/30">
                        {timeAgo(activity.created_at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ---- Right column: Subscription + Notifications ---- */}
        <div className="space-y-6 lg:col-span-2">
          {/* Subscription Status Widget */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/40">
              Subscription
            </h2>
            {directorySubscription && plan ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-base font-semibold text-white">{plan.name}</span>
                    <span className="ml-2 inline-flex rounded-full bg-gold-500/10 px-2 py-0.5 text-xs font-medium text-gold-500 ring-1 ring-gold-500/20">
                      {activeListing.tier}
                    </span>
                  </div>
                  <span className="text-xs font-medium uppercase text-white/30">
                    {directorySubscription.status}
                  </span>
                </div>

                {priceField != null && (
                  <p className="text-sm text-white/50">
                    {formatPrice(priceField, directorySubscription.billing_cycle)}{' '}
                    <span className="text-white/30">
                      &middot; billed {directorySubscription.billing_cycle}
                    </span>
                  </p>
                )}

                {directorySubscription.current_period_end && (
                  <p className="text-xs text-white/40">
                    Next billing date:{' '}
                    {formatDate(directorySubscription.current_period_end)}
                  </p>
                )}

                {directorySubscription.cancel_at_period_end && directorySubscription.current_period_end && (
                  <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2">
                    <p className="text-xs font-medium text-yellow-400">
                      Your plan will end on{' '}
                      {formatDate(directorySubscription.current_period_end)}
                    </p>
                  </div>
                )}

                <Link
                  href="/portal/billing"
                  className="inline-flex w-full items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10"
                >
                  Manage Plan
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-white/50">You are on the free plan.</p>
                <Link
                  href="/portal/upgrade"
                  className="inline-flex w-full items-center justify-center rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-gold-400"
                >
                  Upgrade
                </Link>
              </div>
            )}
          </div>

          {/* Notifications / Alerts */}
          {notifications.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">
                Notifications
              </h2>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`rounded-xl border p-4 ${notificationStyles[n.type]}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 shrink-0">{notificationIcon(n.type)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white">{n.title}</p>
                      <p className="mt-0.5 text-xs text-white/50">{n.message}</p>
                      {n.action_label && n.action_href && (
                        <Link
                          href={n.action_href}
                          className="mt-2 inline-flex text-xs font-medium text-gold-500 transition hover:text-gold-400"
                        >
                          {n.action_label} &rarr;
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* =============== 5. Onboarding Checklist =============== */}
      {checklist.length > 0 && (
        <OnboardingChecklist items={checklist} isPro={isPro} />
      )}

      {/* =============== 6. Upgrade CTA (free tier) =============== */}
      {isFree && (
        <UpgradeCTA
          feature="Directory Pro"
          description="Unlock extended descriptions, menu editor, priority placement, and up to 20 photos."
        />
      )}

      {/* =============== 7. Command Center Promo =============== */}
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

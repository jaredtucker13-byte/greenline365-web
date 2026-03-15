'use client';

import { useState, useEffect } from 'react';
import { usePortalContext } from '@/lib/hooks/usePortalContext';
import TierBadge from '@/components/portal/TierBadge';
import Link from 'next/link';

interface BillingRecord {
  id: string;
  amount_cents: number;
  currency: string;
  status: string;
  description: string;
  created_at: string;
}

const formatPrice = (cents: number) =>
  `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const PLAN_FEATURES: Record<string, { label: string; tiers: string[] }[]> = {
  all: [
    { label: 'Basic listing in directory', tiers: ['free', 'directory_pro', 'directory_premium'] },
    { label: 'Up to 3 photos', tiers: ['free', 'directory_pro', 'directory_premium'] },
    { label: '140-character description', tiers: ['free'] },
    { label: 'Extended description (unlimited)', tiers: ['directory_pro', 'directory_premium'] },
    { label: 'Up to 20 photos', tiers: ['directory_pro', 'directory_premium'] },
    { label: 'Menu editor', tiers: ['directory_pro', 'directory_premium'] },
    { label: 'Advanced analytics', tiers: ['directory_pro', 'directory_premium'] },
    { label: 'Priority placement in search', tiers: ['directory_pro', 'directory_premium'] },
    { label: 'Video embed', tiers: ['directory_premium'] },
    { label: 'Service areas', tiers: ['directory_premium'] },
    { label: 'Premium badge', tiers: ['directory_premium'] },
  ],
};

function CheckIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-emerald-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-white/25"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { className: string; label: string }> = {
    active: { className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Active' },
    trialing: { className: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Trialing' },
    past_due: { className: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Past Due' },
    canceled: { className: 'bg-white/10 text-white/50 border-white/20', label: 'Canceled' },
    paid: { className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Paid' },
    pending: { className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Pending' },
    failed: { className: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Failed' },
    refunded: { className: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Refunded' },
  };

  const c = config[status] || { className: 'bg-white/10 text-white/50 border-white/20', label: status };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${c.className}`}
    >
      {c.label}
    </span>
  );
}

export default function BillingPage() {
  const { directorySubscription } = usePortalContext();

  const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([]);
  const [billingLoading, setBillingLoading] = useState(true);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const isFree = !directorySubscription;
  const planSlug = directorySubscription?.plan?.slug || 'free';
  const planName = directorySubscription?.plan?.name || 'Free';
  const billingCycle = directorySubscription?.billing_cycle || 'monthly';
  const status = directorySubscription?.status || 'active';
  const cancelAtPeriodEnd = directorySubscription?.cancel_at_period_end || false;
  const periodEnd = directorySubscription?.current_period_end || null;

  const priceDisplay = isFree
    ? '$0'
    : billingCycle === 'annual'
      ? `${formatPrice(directorySubscription.plan.price_annual_cents)}/yr`
      : `${formatPrice(directorySubscription.plan.price_monthly_cents)}/mo`;

  // Determine tier key for feature matching
  const tierKey = isFree ? 'free' : planSlug;

  useEffect(() => {
    setBillingLoading(true);
    setBillingError(null);
    fetch('/api/portal/billing')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load billing history');
        return r.json();
      })
      .then((data) => {
        setBillingHistory(data.records || data || []);
      })
      .catch((err) => {
        setBillingError(err.message);
      })
      .finally(() => {
        setBillingLoading(false);
      });
  }, []);

  const openStripePortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ return_url: window.location.href }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-white">Billing &amp; Subscription</h1>
        <p className="mt-1 text-sm text-white/50">
          Manage your plan, view invoices, and update payment details.
        </p>
      </div>

      {/* ── Current Plan Card ── */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        {isFree ? (
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-white">Free Plan</h2>
                <TierBadge tier="free" size="md" />
              </div>
              <p className="mt-1 text-sm text-white/50">
                You&apos;re on the Free plan. Upgrade to unlock more features for your listing.
              </p>
            </div>
            <Link
              href="/portal/upgrade"
              className="inline-flex items-center rounded-lg bg-gold-500 px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gold-400"
            >
              Upgrade
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-white">{planName}</h2>
                  <TierBadge tier={planSlug} size="md" />
                  <StatusBadge status={status} />
                </div>
                <p className="mt-2 text-3xl font-bold text-white">
                  {priceDisplay}
                </p>
                {periodEnd && (
                  <p className="mt-1 text-sm text-white/50">
                    Next billing date: {formatDate(periodEnd)}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/portal/upgrade"
                  className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
                >
                  Change Plan
                </Link>
                <button
                  onClick={openStripePortal}
                  disabled={portalLoading}
                  className="inline-flex items-center rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-gold-400 disabled:opacity-50"
                >
                  {portalLoading ? (
                    <>
                      <svg
                        className="mr-2 h-4 w-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Opening...
                    </>
                  ) : (
                    'Manage in Stripe'
                  )}
                </button>
              </div>
            </div>

            {/* Cancel at period end warning */}
            {cancelAtPeriodEnd && (
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3">
                <div className="flex items-start gap-3">
                  <svg
                    className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <p className="text-sm text-yellow-200">
                    Your plan will end on{' '}
                    <span className="font-semibold">{formatDate(periodEnd)}</span>.
                    You&apos;ll be downgraded to Free.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Plan Features Summary ── */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold text-white">
          What&apos;s included in your plan
        </h3>
        <ul className="mt-4 space-y-3">
          {PLAN_FEATURES.all.map((feature) => {
            const included = feature.tiers.includes(tierKey);
            return (
              <li key={feature.label} className="flex items-center gap-3">
                {included ? <CheckIcon /> : <LockIcon />}
                <span
                  className={
                    included ? 'text-sm text-white/70' : 'text-sm text-white/30'
                  }
                >
                  {feature.label}
                </span>
              </li>
            );
          })}
        </ul>
        {isFree && (
          <div className="mt-6">
            <Link
              href="/portal/upgrade"
              className="inline-flex items-center text-sm font-medium text-gold-500 transition-colors hover:text-gold-400"
            >
              Unlock all features
              <svg
                className="ml-1 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        )}
      </div>

      {/* ── Billing History ── */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold text-white">Billing History</h3>

        {billingLoading ? (
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-lg bg-white/5"
              />
            ))}
          </div>
        ) : billingError ? (
          <div className="mt-6 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
            <p className="text-sm text-red-400">{billingError}</p>
          </div>
        ) : billingHistory.length === 0 ? (
          <div className="mt-6 flex flex-col items-center py-8">
            <svg
              className="h-10 w-10 text-white/20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
              />
            </svg>
            <p className="mt-3 text-sm text-white/40">No billing history yet</p>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {/* Table header — hidden on mobile */}
            <div className="hidden grid-cols-[1fr_2fr_auto_auto] gap-4 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/40 sm:grid">
              <span>Date</span>
              <span>Description</span>
              <span>Amount</span>
              <span>Status</span>
            </div>

            {billingHistory.map((record) => (
              <div
                key={record.id}
                className="grid grid-cols-1 gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 sm:grid-cols-[1fr_2fr_auto_auto] sm:items-center sm:gap-4"
              >
                <span className="text-sm text-white/50">
                  {formatDate(record.created_at)}
                </span>
                <span className="text-sm text-white/70">{record.description}</span>
                <span className="text-sm font-medium text-white">
                  {formatPrice(record.amount_cents)}{' '}
                  <span className="text-white/30 uppercase">
                    {record.currency}
                  </span>
                </span>
                <StatusBadge status={record.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Payment Method ── */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Payment Method</h3>
            <p className="mt-1 text-sm text-white/50">
              Your payment details are managed securely through Stripe.
            </p>
          </div>
          <button
            onClick={openStripePortal}
            disabled={portalLoading}
            className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            {portalLoading ? (
              <>
                <svg
                  className="mr-2 h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Opening...
              </>
            ) : (
              'Update Payment Method'
            )}
          </button>
        </div>
      </div>

      {/* ── Subscription Actions ── */}
      {!isFree && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          {!showCancelConfirm ? (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="text-sm text-white/40 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white/60"
            >
              Need to cancel your subscription?
            </button>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-4">
                <h4 className="text-sm font-semibold text-red-400">
                  Are you sure you want to cancel?
                </h4>
                <p className="mt-2 text-sm text-white/50">
                  Your plan will remain active until{' '}
                  <span className="font-medium text-white/70">
                    {formatDate(periodEnd)}
                  </span>
                  . After that, you&apos;ll be downgraded to Free and lose access to
                  Pro features.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={openStripePortal}
                  disabled={portalLoading}
                  className="inline-flex items-center rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                >
                  {portalLoading ? 'Opening...' : 'Cancel Subscription'}
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10"
                >
                  Keep My Plan
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

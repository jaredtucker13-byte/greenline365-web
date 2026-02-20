'use client';

import { useState } from 'react';

interface PlanData {
  id: string;
  slug: string;
  name: string;
  product_type: string;
  price_monthly_cents: number;
  price_annual_cents: number;
  features: Record<string, unknown>;
  overrides: Record<string, string | boolean | number>;
}

interface PlanComparisonTableProps {
  plans: PlanData[];
  currentPlanSlug: string | null;
  onSubscribe: (planId: string, billingCycle: 'monthly' | 'annual') => void;
  isLoading?: boolean;
}

const FEATURE_LABELS: Record<string, string> = {
  photos_max: 'Photos',
  description_long: 'Extended Description',
  menu_editor: 'Menu Editor',
  priority_placement: 'Priority Placement',
  verified_badge: 'Verified Badge',
  custom_branding: 'Custom Branding',
  analytics_basic: 'Basic Analytics',
  analytics_advanced: 'Advanced Analytics',
  team_members_max: 'Team Members',
  booking_engine: 'Booking Engine',
  calendar_sync: 'Calendar Sync',
  ai_automation: 'AI Automation',
  ai_review_reply: 'AI Review Reply',
  content_manager: 'Content Manager',
  integrations_hub: 'Integrations Hub',
};

function formatFeatureValue(value: string | boolean | number): string {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return value === 0 ? 'No' : String(value);
  return value;
}

export default function PlanComparisonTable({
  plans,
  currentPlanSlug,
  onSubscribe,
  isLoading,
}: PlanComparisonTableProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const featureSlugs = Object.keys(FEATURE_LABELS);

  return (
    <div>
      {/* Billing toggle */}
      <div className="mb-8 flex items-center justify-center gap-3">
        <button
          onClick={() => setBillingCycle('monthly')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            billingCycle === 'monthly'
              ? 'bg-neon-green-500 text-black'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle('annual')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            billingCycle === 'annual'
              ? 'bg-neon-green-500 text-black'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Annual
          <span className="ml-1.5 rounded bg-neon-green-500/20 px-1.5 py-0.5 text-[10px] text-neon-green-500">
            Save 17%
          </span>
        </button>
      </div>

      {/* Plans grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const isCurrent = plan.slug === currentPlanSlug;
          const price =
            billingCycle === 'monthly'
              ? plan.price_monthly_cents
              : Math.round(plan.price_annual_cents / 12);
          const isFree = plan.price_monthly_cents === 0;

          return (
            <div
              key={plan.id}
              className={`rounded-xl border p-6 ${
                isCurrent
                  ? 'border-neon-green-500/40 bg-neon-green-500/5'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <h3 className="text-lg font-bold text-white">{plan.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">
                  {isFree ? 'Free' : `$${(price / 100).toFixed(0)}`}
                </span>
                {!isFree && (
                  <span className="text-sm text-white/40">/mo</span>
                )}
              </div>
              {billingCycle === 'annual' && !isFree && (
                <p className="mt-1 text-xs text-white/40">
                  ${(plan.price_annual_cents / 100).toFixed(0)}/year
                </p>
              )}

              <div className="my-6">
                {isCurrent ? (
                  <span className="block w-full rounded-lg border border-neon-green-500/40 py-2 text-center text-sm font-medium text-neon-green-500">
                    Current Plan
                  </span>
                ) : isFree ? (
                  <span className="block w-full rounded-lg border border-white/20 py-2 text-center text-sm font-medium text-white/40">
                    Free
                  </span>
                ) : (
                  <button
                    onClick={() => onSubscribe(plan.id, billingCycle)}
                    disabled={isLoading}
                    className="block w-full rounded-lg bg-neon-green-500 py-2 text-center text-sm font-semibold text-black transition-colors hover:bg-neon-green-400 disabled:opacity-50"
                  >
                    {isLoading ? 'Loading...' : 'Subscribe'}
                  </button>
                )}
              </div>

              {/* Features list */}
              <ul className="space-y-2.5">
                {featureSlugs.map((slug) => {
                  const value = plan.overrides[slug];
                  if (value === undefined) return null;
                  const enabled =
                    value === true || (typeof value === 'number' && value > 0);

                  return (
                    <li key={slug} className="flex items-center gap-2 text-xs">
                      {enabled ? (
                        <svg
                          className="h-4 w-4 shrink-0 text-neon-green-500"
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
                      ) : (
                        <svg
                          className="h-4 w-4 shrink-0 text-white/20"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      )}
                      <span
                        className={enabled ? 'text-white/80' : 'text-white/30'}
                      >
                        {FEATURE_LABELS[slug]}
                        {typeof value === 'number' && value > 0
                          ? ` (${value})`
                          : ''}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

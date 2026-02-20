'use client';

import { useState, useEffect } from 'react';
import { usePortalContext } from '@/lib/hooks/usePortalContext';
import PlanComparisonTable from '@/components/portal/PlanComparisonTable';

interface PlanWithOverrides {
  id: string;
  slug: string;
  name: string;
  product_type: string;
  price_monthly_cents: number;
  price_annual_cents: number;
  features: Record<string, unknown>;
  overrides: Record<string, string | boolean | number>;
}

const FAQ_ITEMS = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. You can cancel your subscription at any time from the Settings page or Stripe portal. Your access continues until the end of your billing period.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes! All paid plans include a 14-day free trial. No credit card required to start.',
  },
  {
    q: 'What happens if I downgrade?',
    a: 'Your data is preserved. Pro-only features (menu editor, advanced analytics, etc.) will be locked until you upgrade again.',
  },
  {
    q: 'Can I switch between monthly and annual?',
    a: 'Yes. You can change your billing cycle through the Stripe customer portal. Annual plans save about 17%.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit and debit cards through Stripe, including Visa, Mastercard, Amex, and Discover.',
  },
];

export default function UpgradePage() {
  const { directorySubscription, activeListing } = usePortalContext();
  const [plans, setPlans] = useState<PlanWithOverrides[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const currentPlanSlug = directorySubscription?.plan?.slug || 'free';

  useEffect(() => {
    fetch('/api/plans')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.plans) {
          // Transform plan data with overrides
          const transformed = data.plans.map(
            (p: {
              id: string;
              slug: string;
              name: string;
              product_type: string;
              price_monthly_cents: number;
              price_annual_cents: number;
              features: Record<string, unknown>;
              plan_feature_overrides: Array<{
                value: string;
                feature_flag: { slug: string; value_type: string };
              }>;
            }) => {
              const overrides: Record<string, string | boolean | number> = {};
              for (const o of p.plan_feature_overrides || []) {
                const flag = o.feature_flag;
                if (flag.value_type === 'boolean') {
                  overrides[flag.slug] = o.value === 'true';
                } else if (flag.value_type === 'integer') {
                  overrides[flag.slug] = parseInt(o.value, 10);
                } else {
                  overrides[flag.slug] = o.value;
                }
              }
              return {
                id: p.id,
                slug: p.slug,
                name: p.name,
                product_type: p.product_type,
                price_monthly_cents: p.price_monthly_cents,
                price_annual_cents: p.price_annual_cents,
                features: p.features,
                overrides,
              };
            }
          );
          setPlans(transformed);
        }
        setLoading(false);
      });
  }, []);

  const handleSubscribe = async (
    planId: string,
    billingCycle: 'monthly' | 'annual'
  ) => {
    setCheckoutLoading(true);

    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan_id: planId,
        billing_cycle: billingCycle,
        listing_id: activeListing?.id,
        success_url: `${window.location.origin}/portal?upgraded=true`,
        cancel_url: `${window.location.origin}/portal/upgrade`,
      }),
    });

    const data = await res.json();
    setCheckoutLoading(false);

    if (data.url) {
      window.location.href = data.url;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-green-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">Choose Your Plan</h1>
        <p className="mt-2 text-white/50">
          Upgrade to unlock more features and grow your business.
        </p>
      </div>

      <PlanComparisonTable
        plans={plans}
        currentPlanSlug={currentPlanSlug}
        onSubscribe={handleSubscribe}
        isLoading={checkoutLoading}
      />

      {/* FAQ */}
      <div className="mx-auto max-w-2xl">
        <h2 className="mb-6 text-center text-xl font-bold text-white">
          Frequently Asked Questions
        </h2>
        <div className="space-y-2">
          {FAQ_ITEMS.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-white/10 bg-white/5"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-sm font-medium text-white">{item.q}</span>
                <svg
                  className={`h-4 w-4 shrink-0 text-white/40 transition-transform ${
                    openFaq === idx ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {openFaq === idx && (
                <div className="border-t border-white/5 px-5 py-4">
                  <p className="text-sm text-white/50">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

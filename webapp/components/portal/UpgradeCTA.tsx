'use client';

import Link from 'next/link';

interface UpgradeCTAProps {
  feature: string;
  description?: string;
  variant?: 'inline' | 'card' | 'overlay';
}

export default function UpgradeCTA({
  feature,
  description,
  variant = 'card',
}: UpgradeCTAProps) {
  if (variant === 'inline') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-white/40">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <Link href="/portal/upgrade" className="underline hover:text-gold-500">
          Upgrade to unlock
        </Link>
      </span>
    );
  }

  if (variant === 'overlay') {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-os-dark-900/80 backdrop-blur-sm">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gold-500/20">
            <svg
              className="h-6 w-6 text-gold-500"
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
          </div>
          <p className="mb-1 text-sm font-semibold text-white">Upgrade to Pro</p>
          <p className="mb-4 text-xs text-white/50">
            {description || `Unlock ${feature} with a Pro subscription`}
          </p>
          <Link
            href="/portal/upgrade"
            className="inline-flex items-center rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-gold-400"
          >
            Upgrade Now
          </Link>
        </div>
      </div>
    );
  }

  // Default: card variant
  return (
    <div className="rounded-xl border border-gold-500/20 bg-gold-500/5 p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold-500/20">
          <svg
            className="h-5 w-5 text-gold-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">
            Unlock {feature}
          </h3>
          <p className="mt-1 text-xs text-white/50">
            {description ||
              `Upgrade to Pro to access ${feature} and more powerful features.`}
          </p>
          <Link
            href="/portal/upgrade"
            className="mt-3 inline-flex items-center rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-gold-400"
          >
            Upgrade to Pro
          </Link>
        </div>
      </div>
    </div>
  );
}

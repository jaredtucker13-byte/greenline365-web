'use client';

import { useState, useEffect } from 'react';
import { usePortalContext } from '@/lib/hooks/usePortalContext';
import Link from 'next/link';

export default function MyListingsPage() {
  const { listings, activeListing, setActiveListingId, directorySubscription, refresh, isLoading } =
    usePortalContext();

  const [publishLoading, setPublishLoading] = useState<string | null>(null);

  const togglePublish = async (listingId: string, currentlyPublished: boolean) => {
    setPublishLoading(listingId);
    try {
      const res = await fetch('/api/portal/listing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId, is_published: !currentlyPublished }),
      });
      if (res.ok) {
        await refresh();
      }
    } catch {
      // silently handle — user sees the state hasn't changed
    } finally {
      setPublishLoading(null);
    }
  };

  const getStatusBadge = (listing: (typeof listings)[0]) => {
    if (listing.is_published) {
      return (
        <span className="inline-flex items-center rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-medium text-green-400">
          Published
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-yellow-500/20 px-2.5 py-0.5 text-xs font-medium text-yellow-400">
        Draft
      </span>
    );
  };

  const getTierBadge = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'premium':
        return (
          <span className="inline-flex items-center rounded-full bg-gradient-to-r from-gold-500/20 to-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-gold-400">
            Premium
          </span>
        );
      case 'pro':
        return (
          <span className="inline-flex items-center rounded-full bg-gold-500/20 px-2.5 py-0.5 text-xs font-medium text-gold-400">
            Pro
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/50">
            Free
          </span>
        );
    }
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: fullStars }, (_, i) => (
          <svg key={`full-${i}`} className="h-3.5 w-3.5 text-gold-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        {hasHalf && (
          <svg className="h-3.5 w-3.5 text-gold-500" viewBox="0 0 20 20">
            <defs>
              <linearGradient id="halfStar">
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <path
              fill="url(#halfStar)"
              stroke="currentColor"
              strokeWidth="0.5"
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
        )}
        {Array.from({ length: emptyStars }, (_, i) => (
          <svg key={`empty-${i}`} className="h-3.5 w-3.5 text-white/20" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 animate-pulse rounded-lg bg-white/10" />
            <div className="mt-2 h-4 w-72 animate-pulse rounded bg-white/5" />
          </div>
          <div className="h-10 w-40 animate-pulse rounded-lg bg-white/10" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/5">
              <div className="h-40 animate-pulse rounded-t-xl bg-white/5" />
              <div className="space-y-3 p-5">
                <div className="h-5 w-3/4 animate-pulse rounded bg-white/10" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-white/5" />
                <div className="flex gap-2">
                  <div className="h-6 w-16 animate-pulse rounded-full bg-white/5" />
                  <div className="h-6 w-12 animate-pulse rounded-full bg-white/5" />
                </div>
                <div className="h-4 w-full animate-pulse rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (listings.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">My Listings</h1>
          <p className="mt-1 text-sm text-white/50">Manage your business listings in the directory.</p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 py-20 text-center">
          {/* Placeholder illustration */}
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/5">
            <svg className="h-12 w-12 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white">You don&apos;t have any listings yet</h2>
          <p className="mt-2 max-w-sm text-sm text-white/50">
            Claim or create a listing to start managing your business presence in the GreenLine365 directory.
          </p>
          <Link
            href="/directory"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gold-500 px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gold-400"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Find Your Business
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Listings</h1>
          <p className="mt-1 text-sm text-white/50">
            Manage your business listings in the directory.
          </p>
        </div>

        {directorySubscription && (
          <div className="group relative">
            <button
              disabled
              className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2.5 text-sm font-medium text-white/40 cursor-not-allowed"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Listing
            </button>
            <div className="pointer-events-none absolute right-0 top-full z-10 mt-2 whitespace-nowrap rounded-lg border border-white/10 bg-os-dark-900 px-3 py-1.5 text-xs text-white/60 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              Coming soon
            </div>
          </div>
        )}
      </div>

      {/* Listing Switcher (when multiple listings) */}
      {listings.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {listings.map((listing) => (
            <button
              key={listing.id}
              onClick={() => setActiveListingId(listing.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeListing?.id === listing.id
                  ? 'bg-gold-500 text-black'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {listing.business_name}
            </button>
          ))}
        </div>
      )}

      {/* Listings Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing) => (
          <div
            key={listing.id}
            className={`group overflow-hidden rounded-xl border transition-all ${
              activeListing?.id === listing.id
                ? 'border-gold-500/30 bg-white/[0.07]'
                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]'
            }`}
          >
            {/* Cover image */}
            {listing.cover_image_url ? (
              <div className="relative h-40 w-full overflow-hidden">
                <img
                  src={listing.cover_image_url}
                  alt={listing.business_name}
                  className="h-40 w-full object-cover rounded-t-xl transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
            ) : (
              <div className="relative h-40 w-full rounded-t-xl bg-gradient-to-br from-gold-500/10 via-white/5 to-emerald-500/10">
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="h-12 w-12 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
            )}

            {/* Card body */}
            <div className="space-y-4 p-5">
              {/* Business name + location */}
              <div>
                <h3 className="text-lg font-bold text-white truncate">{listing.business_name}</h3>
                {(listing.city || listing.state) && (
                  <p className="mt-0.5 text-sm text-white/50">
                    {[listing.city, listing.state].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {getStatusBadge(listing)}
                {getTierBadge(listing.tier)}
              </div>

              {/* Quick stats */}
              <div className="flex items-center gap-4 text-sm text-white/50">
                {/* Trust Score */}
                <div className="flex items-center gap-1.5" title="Trust Score">
                  <svg className="h-4 w-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  <span className="tabular-nums">{listing.trust_score}</span>
                </div>

                {/* Reviews count */}
                <div className="flex items-center gap-1.5" title="Reviews">
                  <svg className="h-4 w-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <span className="tabular-nums">{listing.total_feedback_count}</span>
                </div>

                {/* Rating */}
                {listing.avg_feedback_rating > 0 && (
                  <div className="flex items-center gap-1.5" title="Average Rating">
                    {renderStars(listing.avg_feedback_rating)}
                    <span className="tabular-nums text-white/70">{listing.avg_feedback_rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-white/5" />

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Edit */}
                <Link
                  href="/portal/listing"
                  onClick={() => setActiveListingId(listing.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit
                </Link>

                {/* View Live */}
                {listing.is_published && listing.slug && (
                  <a
                    href={`/listing/${listing.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    View Live
                  </a>
                )}

                {/* Publish / Unpublish toggle */}
                <button
                  onClick={() => togglePublish(listing.id, listing.is_published)}
                  disabled={publishLoading === listing.id}
                  className={`inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed ${
                    listing.is_published
                      ? 'text-yellow-400 hover:text-yellow-300'
                      : 'text-green-400 hover:text-green-300'
                  }`}
                >
                  {publishLoading === listing.id ? (
                    <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : listing.is_published ? (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                  {publishLoading === listing.id
                    ? 'Updating...'
                    : listing.is_published
                      ? 'Unpublish'
                      : 'Publish'}
                </button>

                {/* Stats */}
                <Link
                  href="/portal/stats"
                  onClick={() => setActiveListingId(listing.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  Stats
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

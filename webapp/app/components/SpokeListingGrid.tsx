'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Listing {
  id: string;
  business_name: string;
  slug: string;
  industry: string;
  subcategories: string[];
  description?: string;
  city?: string;
  state?: string;
  cover_image_url?: string;
  logo_url?: string;
  tier: string;
  is_claimed?: boolean;
  trust_score: number;
  avg_feedback_rating: number;
  total_feedback_count: number;
  directory_badges: { id: string; badge_type: string; badge_label: string; badge_color: string }[];
}

interface SpokeListingGridProps {
  industry: string;
  subcategory?: string;
  limit?: number;
  emptyTitle?: string;
  emptyDescription?: string;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          width={12}
          height={12}
          viewBox="0 0 24 24"
          fill={s <= Math.round(rating) ? '#C9A84C' : 'none'}
          stroke={s <= Math.round(rating) ? '#C9A84C' : '#555'}
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      ))}
    </div>
  );
}

export default function SpokeListingGrid({
  industry,
  subcategory,
  limit = 12,
  emptyTitle = 'Coming Soon',
  emptyDescription = 'Listings for this category are being added. Check back soon!',
}: SpokeListingGridProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [subcategories, setSubcategories] = useState<string[]>([]);

  useEffect(() => {
    const params = new URLSearchParams({ industry, limit: String(limit) });
    fetch(`/api/directory?${params}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Listing[]) => {
        const list = Array.isArray(data) ? data : [];
        setListings(list);

        // Extract unique subcategories from listings
        const subs = new Set<string>();
        list.forEach((l) => l.subcategories?.forEach((s) => subs.add(s)));
        if (subs.size > 1) {
          setSubcategories(['All', ...Array.from(subs).sort()]);
        }
      })
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, [industry, limit]);

  const filtered =
    activeFilter === 'All'
      ? listings
      : listings.filter((l) => l.subcategories?.includes(activeFilter));

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[24px] border border-white/10 bg-white/[0.02] h-[280px] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="rounded-[32px] border border-white/10 bg-white/[0.02] p-12 text-center">
        <p className="text-white/30 text-sm uppercase tracking-widest mb-3">{emptyTitle}</p>
        <p className="text-white/50 max-w-md mx-auto">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Subcategory filters */}
      {subcategories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {subcategories.map((sub) => (
            <button
              key={sub}
              onClick={() => setActiveFilter(sub)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                activeFilter === sub
                  ? 'bg-gradient-to-r from-gold to-gold-300 text-black'
                  : 'border border-white/10 text-white/50 hover:border-gold/30 hover:text-white/80'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      {/* Listing grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((listing) => (
          <Link
            key={listing.id}
            href={`/listing/${listing.slug}`}
            className="group rounded-[24px] border border-white/10 bg-white/[0.02] overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:border-gold/30 hover:bg-white/[0.04] hover:shadow-lg hover:shadow-gold/5 focus-within:scale-[1.02] focus-within:border-gold/30"
          >
            {/* Cover image */}
            <div className="relative h-40 overflow-hidden">
              <SpokeImage src={listing.cover_image_url} name={listing.business_name} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/80 via-transparent to-transparent" />

              {/* Badges */}
              {listing.directory_badges?.length > 0 && (
                <div className="absolute top-3 left-3 flex gap-1.5">
                  {listing.directory_badges.slice(0, 2).map((badge) => (
                    <span
                      key={badge.id}
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                      style={{
                        backgroundColor: `${badge.badge_color}20`,
                        color: badge.badge_color,
                        border: `1px solid ${badge.badge_color}40`,
                      }}
                    >
                      {badge.badge_label}
                    </span>
                  ))}
                </div>
              )}

              {/* Tier badge */}
              {listing.tier !== 'free' && (
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-gold/20 text-gold border border-gold/30">
                    {listing.tier}
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-5">
              <h3 className="text-base font-heading font-semibold text-white group-hover:text-gold transition-colors duration-300 mb-1 line-clamp-1">
                {listing.business_name}
              </h3>

              {listing.city && (
                <p className="text-xs text-white/40 mb-2">
                  {listing.city}
                  {listing.state ? `, ${listing.state}` : ''}
                </p>
              )}

              {listing.description && (
                <p className="text-xs text-white/50 leading-relaxed line-clamp-2 mb-3">
                  {listing.description}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Stars rating={listing.avg_feedback_rating} />
                  {listing.total_feedback_count > 0 && (
                    <span className="text-[10px] text-white/30">
                      ({listing.total_feedback_count})
                    </span>
                  )}
                </div>
                {listing.is_claimed && (
                  <span className="text-[10px] text-gold/60 font-medium">Verified</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SpokeImage({ src, name }: { src: string | null | undefined; name: string }) {
  const [error, setError] = useState(false);
  if (src && !error) {
    return (
      <Image
        src={src}
        alt={name}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        onError={() => setError(true)}
      />
    );
  }
  return (
    <div className="w-full h-full bg-gradient-to-br from-white/[0.03] to-white/[0.01] flex items-center justify-center">
      <span className="text-white/20 text-3xl font-heading">{name[0]}</span>
    </div>
  );
}

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { getPlaceholderImage, getCategoryFallback } from '@/lib/directory-config';

interface BoostedListing {
  id: string;
  business_name: string;
  slug: string;
  industry: string;
  city?: string;
  state?: string;
  cover_image_url?: string;
  tier: string;
  avg_feedback_rating: number;
  is_sponsored: boolean;
}

interface BoostedShowcaseProps {
  className?: string;
  showSponsoredLabel?: boolean;
  maxSlots?: number;
}

function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} width={size} height={size} viewBox="0 0 24 24" fill={s <= Math.round(rating) ? '#C9A96E' : 'none'} stroke={s <= Math.round(rating) ? '#C9A96E' : '#555'} strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
    </div>
  );
}

export default function BoostedShowcase({ className = '', showSponsoredLabel = true, maxSlots = 12 }: BoostedShowcaseProps) {
  const [slots, setSlots] = useState<BoostedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch(`/api/directory/addons/featured?limit=${maxSlots}&backfill=true`)
      .then(r => r.json())
      .then(data => {
        setSlots(data.slots || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [maxSlots]);

  const startAutoScroll = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!scrollRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      if (scrollLeft + clientWidth >= scrollWidth - 10) {
        scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        scrollRef.current.scrollBy({ left: 280, behavior: 'smooth' });
      }
    }, 3000);
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (slots.length > 0) startAutoScroll();
    return () => stopAutoScroll();
  }, [slots, startAutoScroll, stopAutoScroll]);

  const scrollBy = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = direction === 'left' ? -280 : 280;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className={`flex gap-4 overflow-hidden ${className}`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-64 h-48 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (slots.length === 0) return null;

  return (
    <div
      className={`relative group ${className}`}
      onMouseEnter={stopAutoScroll}
      onMouseLeave={startAutoScroll}
    >
      {/* Left arrow */}
      <button
        onClick={() => scrollBy('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-midnight-900/80 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:border-gold/40 hover:bg-gold/10"
        aria-label="Scroll left"
      >
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {slots.map((listing) => (
          <Link
            key={listing.id}
            href={`/listing/${listing.slug}`}
            className="flex-shrink-0 w-64 rounded-xl overflow-hidden border border-white/10 hover:border-gold/30 transition-all duration-300 snap-start group/card bg-midnight-900/50 hover:bg-midnight-900/80"
            data-testid={`boosted-card-${listing.slug}`}
          >
            {/* Image */}
            <div className="relative h-36 overflow-hidden">
              <img
                src={listing.cover_image_url || getPlaceholderImage(listing.industry)}
                alt={listing.business_name}
                className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                onError={(e) => { e.currentTarget.style.display = 'none'; (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.removeProperty('display'); }}
              />
              {(() => { const fb = getCategoryFallback(listing.industry); return (
                <div className="w-full h-full flex items-center justify-center" style={{ display: 'none', background: fb.gradient }}>
                  <span className="text-3xl">{fb.icon}</span>
                </div>
              ); })()}
              <div className="absolute inset-0 bg-gradient-to-t from-midnight-900/80 to-transparent" />

              {/* Sponsored badge */}
              {showSponsoredLabel && listing.is_sponsored && (
                <span
                  className="absolute top-2 right-2 text-[9px] px-2 py-0.5 rounded-full font-heading font-semibold uppercase tracking-wider bg-gold/90 text-midnight-900"
                  data-testid="boosted-sponsored-badge"
                >
                  Sponsored
                </span>
              )}
            </div>

            {/* Info */}
            <div className="p-3">
              <h3 className="text-sm font-heading font-semibold text-white truncate group-hover/card:text-gold transition-colors duration-300">
                {listing.business_name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                {listing.city && (
                  <span className="text-xs text-white/40 font-body">{listing.city}{listing.state ? `, ${listing.state}` : ''}</span>
                )}
              </div>
              {listing.avg_feedback_rating > 0 && (
                <div className="mt-1.5">
                  <Stars rating={listing.avg_feedback_rating} size={11} />
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Right arrow */}
      <button
        onClick={() => scrollBy('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-midnight-900/80 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:border-gold/40 hover:bg-gold/10"
        aria-label="Scroll right"
      >
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

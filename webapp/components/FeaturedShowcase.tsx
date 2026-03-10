'use client';

/**
 * FeaturedShowcase — Dynamic Right-to-Left Carousel
 *
 * Replaces static "fake" stats with a premium scrolling showcase
 * for paid featured listings ($29/month).
 *
 * Specs:
 * - Right → Left animation
 * - Entrance: 1.2s ease-in to center
 * - Dwell: 7 seconds (reading time for insights & stats)
 * - Exit: 1.0s ease-out to left
 * - Pause on hover
 * - Manual gold chevron navigation
 * - Gold progress bar (fills over 7s)
 * - Dynamic counts from Supabase (no fake numbers)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { getPlaceholderImage, getCategoryFallback, getFallbackDescription } from '@/lib/directory-config';

interface FeaturedListing {
  id: string;
  business_name: string;
  slug: string;
  industry: string;
  city?: string;
  state?: string;
  cover_image_url?: string;
  logo_url?: string;
  tier: string;
  avg_feedback_rating: number;
  total_feedback_count: number;
  voted_by_count?: number;
  verified_since_date?: string;
  is_claimed?: boolean;
  is_sponsored?: boolean;
  description?: string;
  trust_score?: number;
  category_count?: number;
}

interface FeaturedShowcaseProps {
  className?: string;
  maxSlots?: number;
}

const DWELL_TIME = 7000;    // 7 seconds
const ENTER_TIME = 1.2;     // 1.2s entrance
const EXIT_TIME = 1.0;      // 1.0s exit
const PROGRESS_TICK = 50;   // progress bar update interval

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} width={size} height={size} viewBox="0 0 24 24" fill={s <= Math.round(rating) ? '#C9A84C' : 'none'} stroke={s <= Math.round(rating) ? '#C9A84C' : '#555'} strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
    </div>
  );
}

function formatIndustryLabel(industry: string): string {
  return industry
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export default function FeaturedShowcase({ className = '', maxSlots = 12 }: FeaturedShowcaseProps) {
  const [listings, setListings] = useState<FeaturedListing[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState(1); // 1 = forward (R-to-L), -1 = backward
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef(0);

  // Fetch featured listings
  useEffect(() => {
    fetch(`/api/directory/addons/featured?limit=${maxSlots}&backfill=true`)
      .then(r => r.json())
      .then(data => {
        const slots = data.slots || data || [];
        if (Array.isArray(slots)) setListings(slots);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [maxSlots]);

  // Auto-advance timer with progress tracking
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    progressRef.current = 0;
    setProgress(0);

    timerRef.current = setInterval(() => {
      if (!paused) {
        progressRef.current += PROGRESS_TICK;
        setProgress(progressRef.current / DWELL_TIME);

        if (progressRef.current >= DWELL_TIME) {
          setDirection(1);
          setActiveIndex(prev => (prev + 1) % listings.length);
          progressRef.current = 0;
          setProgress(0);
        }
      }
    }, PROGRESS_TICK);
  }, [paused, listings.length]);

  useEffect(() => {
    if (listings.length > 1) startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [listings.length, startTimer]);

  // Reset progress on index change
  useEffect(() => {
    progressRef.current = 0;
    setProgress(0);
  }, [activeIndex]);

  const goNext = () => {
    setDirection(1);
    setActiveIndex(prev => (prev + 1) % listings.length);
  };

  const goPrev = () => {
    setDirection(-1);
    setActiveIndex(prev => (prev - 1 + listings.length) % listings.length);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className={`max-w-4xl mx-auto ${className}`}>
        <div className="h-64 rounded-2xl bg-white/[0.03] animate-pulse" />
      </div>
    );
  }

  if (listings.length === 0) return null;

  const current = listings[activeIndex];

  // R-to-L animation variants
  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 400 : -400,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -400 : 400,
      opacity: 0,
      scale: 0.95,
    }),
  };

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      data-testid="featured-showcase"
    >
      {/* Section Header */}
      <div className="text-center mb-8">
        <p className="text-xs font-heading font-semibold uppercase tracking-[0.25em] mb-3" style={{ color: '#C9A84C' }}>
          Featured Businesses
        </p>
        <h2 className="text-3xl md:text-4xl font-heading font-light text-white tracking-tight mb-3">
          The <span className="text-gradient-gold font-semibold">Gold Standard</span>
        </h2>
        <p className="text-white/50 text-sm font-body max-w-lg mx-auto">
          Premium businesses committed to exceptional service.
        </p>
      </div>

      {/* Carousel Container */}
      <div className="relative max-w-4xl mx-auto overflow-hidden rounded-2xl" style={{ minHeight: 320 }}>
        {/* Left Chevron */}
        <button
          onClick={goPrev}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 group-hover:opacity-70 transition-all duration-300"
          style={{
            background: 'rgba(201, 168, 76, 0.15)',
            border: '1px solid rgba(201, 168, 76, 0.3)',
            opacity: paused ? 0.9 : 0,
          }}
          aria-label="Previous"
          data-testid="showcase-prev"
        >
          <svg className="w-5 h-5" style={{ color: '#C9A84C' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Right Chevron */}
        <button
          onClick={goNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 group-hover:opacity-70 transition-all duration-300"
          style={{
            background: 'rgba(201, 168, 76, 0.15)',
            border: '1px solid rgba(201, 168, 76, 0.3)',
            opacity: paused ? 0.9 : 0,
          }}
          aria-label="Next"
          data-testid="showcase-next"
        >
          <svg className="w-5 h-5" style={{ color: '#C9A84C' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Card */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 120, damping: 20, duration: direction > 0 ? ENTER_TIME : EXIT_TIME },
              opacity: { duration: 0.4 },
              scale: { duration: 0.4 },
            }}
            className="relative"
          >
            <Link href={`/listing/${current.slug}`} className="block" data-testid={`showcase-card-${current.slug}`}>
              <div
                className="flex flex-col md:flex-row rounded-2xl overflow-hidden border transition-all duration-500"
                style={{
                  background: 'linear-gradient(135deg, rgba(15,15,15,0.95) 0%, rgba(25,20,10,0.95) 100%)',
                  borderColor: 'rgba(201, 168, 76, 0.2)',
                  boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 60px rgba(201,168,76,0.06)',
                }}
              >
                {/* Image Side */}
                <div className="relative w-full md:w-2/5 h-48 md:h-auto overflow-hidden" style={{ minHeight: 280 }}>
                  <img
                    src={current.cover_image_url || current.logo_url || getPlaceholderImage(current.industry)}
                    alt={current.business_name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.removeProperty('display'); }}
                  />
                  {(() => { const fb = getCategoryFallback(current.industry); return (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: fb.gradient, display: 'none' }}>
                      <span className="text-6xl">{fb.icon}</span>
                    </div>
                  ); })()}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0f0f0f]/80 hidden md:block" />

                  {/* Tier Badge */}
                  {current.tier !== 'free' && (
                    <span
                      className="absolute top-4 left-4 text-[10px] px-3 py-1 rounded-full font-heading font-semibold uppercase tracking-wider text-black"
                      style={{
                        background: current.tier === 'dominator' || current.tier === 'authority'
                          ? 'linear-gradient(135deg, #C9A84C, #E8C97A)'
                          : 'linear-gradient(135deg, #A8A9AD, #C0C0C0)',
                      }}
                    >
                      {current.tier === 'dominator' ? 'Premier' : current.tier === 'authority' ? 'Authority' : 'Pro'}
                    </span>
                  )}

                  {current.is_sponsored && (
                    <span className="absolute top-4 right-4 text-[9px] px-2.5 py-0.5 rounded-full font-heading font-semibold uppercase tracking-wider" style={{ background: 'rgba(201,168,76,0.9)', color: '#0a0a0a' }}>
                      Featured
                    </span>
                  )}
                </div>

                {/* Content Side */}
                <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
                  {/* Category & Location */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-heading uppercase tracking-wider" style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.2)' }}>
                        {formatIndustryLabel(current.industry)}
                      </span>
                      {current.city && (
                        <span className="text-[11px] text-white/40 font-body flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                          </svg>
                          {current.city}{current.state ? `, ${current.state}` : ''}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl md:text-2xl font-heading font-semibold text-white mb-2 tracking-tight">
                      {current.business_name}
                    </h3>

                    <p className="text-sm text-white/50 font-body leading-relaxed mb-4 line-clamp-2">
                      {current.description || getFallbackDescription(current.business_name, current.industry, current.city)}
                    </p>
                  </div>

                  {/* Stats Row — REAL data only */}
                  <div className="flex items-center gap-6 mt-4 pt-4" style={{ borderTop: '1px solid rgba(201,168,76,0.1)' }}>
                    {/* Rating */}
                    {current.avg_feedback_rating > 0 && (
                      <div className="flex items-center gap-2">
                        <Stars rating={current.avg_feedback_rating} size={14} />
                        <span className="text-xs text-white/50 font-body">
                          ({current.total_feedback_count || 0})
                        </span>
                      </div>
                    )}

                    {/* Trust Score */}
                    {current.trust_score != null && current.trust_score > 0 && (
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" style={{ color: '#C9A84C' }} fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span className="text-xs font-body" style={{ color: '#C9A84C' }}>
                          Trust {current.trust_score}
                        </span>
                      </div>
                    )}

                    {/* Verified Since */}
                    {current.verified_since_date && (
                      <span className="text-[11px] text-white/30 font-body">
                        Verified since {new Date(current.verified_since_date).getFullYear()}
                      </span>
                    )}

                    {/* Votes */}
                    {(current.voted_by_count ?? 0) > 0 && (
                      <span className="text-[11px] text-white/30 font-body">
                        {current.voted_by_count} votes
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </AnimatePresence>

        {/* Gold Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/5 z-30">
          <div
            className="h-full transition-none"
            style={{
              width: `${progress * 100}%`,
              background: 'linear-gradient(90deg, #C9A84C, #E8C97A)',
              transition: paused ? 'none' : `width ${PROGRESS_TICK}ms linear`,
            }}
            data-testid="showcase-progress-bar"
          />
        </div>
      </div>

      {/* Dot Indicators */}
      {listings.length > 1 && (
        <div className="flex justify-center gap-2 mt-5">
          {listings.map((_, i) => (
            <button
              key={i}
              onClick={() => { setDirection(i > activeIndex ? 1 : -1); setActiveIndex(i); }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === activeIndex ? 'w-6 scale-100' : 'scale-75 opacity-40'
              }`}
              style={{
                background: i === activeIndex
                  ? 'linear-gradient(90deg, #C9A84C, #E8C97A)'
                  : 'rgba(255,255,255,0.3)',
              }}
              aria-label={`Go to slide ${i + 1}`}
              data-testid={`showcase-dot-${i}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

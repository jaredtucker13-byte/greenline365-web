'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface ListingInfo {
  id: string;
  business_name: string;
  slug: string;
  industry: string;
  city?: string;
  state?: string;
  cover_image_url?: string;
  tier: string;
  avg_feedback_rating: number;
  total_feedback_count: number;
  phone?: string;
}

interface LoopStop {
  id: string;
  stop_order: number;
  custom_name?: string;
  custom_description?: string;
  custom_image_url?: string;
  duration_minutes?: number;
  transition_note?: string;
  listing?: ListingInfo;
}

interface Loop {
  id: string;
  name: string;
  slug: string;
  loop_type: string;
  destination_slug: string;
  description?: string;
  cover_image_url?: string;
  duration_estimate?: string;
  vibe?: string;
  difficulty?: string;
  is_sponsored: boolean;
  stops: LoopStop[];
  stops_count: number;
}

interface RelatedLoop {
  id: string;
  name: string;
  slug: string;
  loop_type: string;
  destination_slug: string;
  cover_image_url?: string;
  duration_estimate?: string;
  vibe?: string;
  short_description?: string;
}

const DESTINATIONS: Record<string, string> = {
  'st-pete-beach': 'St. Pete Beach',
  'key-west': 'Key West',
  'sarasota': 'Sarasota',
  'ybor-city': 'Ybor City',
  'daytona': 'Daytona Beach',
  'orlando': 'Orlando',
  'miami': 'Miami',
  'jacksonville': 'Jacksonville',
};

const TYPE_COLORS: Record<string, string> = {
  'date-night': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'entertainment': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'family': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'foodie': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'adventure': 'bg-green-500/20 text-green-300 border-green-500/30',
  'nightlife': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  'wellness': 'bg-teal-500/20 text-teal-300 border-teal-500/30',
};

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

export default function LoopDetailClient({ slug }: { slug: string }) {
  const [loop, setLoop] = useState<Loop | null>(null);
  const [related, setRelated] = useState<RelatedLoop[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/loops/${slug}`)
      .then(r => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then(data => {
        setLoop(data.loop);
        setRelated(data.related || []);
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <main className="min-h-screen bg-midnight-950 pt-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="h-64 rounded-2xl bg-white/5 animate-pulse mb-8" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (notFound || !loop) {
    return (
      <main className="min-h-screen bg-midnight-950 pt-32 text-center">
        <h1 className="text-3xl font-heading text-white mb-4">Loop Not Found</h1>
        <p className="text-white/50 font-body mb-8">This experience doesn&apos;t exist or has been removed.</p>
        <Link href="/loops" className="btn-primary px-6 py-2 rounded-full text-sm inline-block">Browse All Loops</Link>
      </main>
    );
  }

  const destLabel = DESTINATIONS[loop.destination_slug] || loop.destination_slug;

  return (
    <main className="min-h-screen bg-midnight-950" data-testid="loop-detail">
      {/* ─── HERO ─── */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        {loop.cover_image_url && (
          <div className="absolute inset-0">
            <img src={loop.cover_image_url} alt={loop.name} className="w-full h-full object-cover opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-b from-midnight-950/60 via-midnight-950/80 to-midnight-950" />
          </div>
        )}
        {!loop.cover_image_url && <div className="absolute inset-0 bg-gradient-to-b from-midnight-900 to-midnight-950" />}

        <div className="relative max-w-4xl mx-auto px-6">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-white/40 font-body mb-8">
            <Link href="/" className="hover:text-gold transition">Directory</Link>
            <span>/</span>
            <Link href="/loops" className="hover:text-gold transition">Experiences</Link>
            <span>/</span>
            <span className="text-white/60">{loop.name}</span>
          </nav>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Type badge */}
            <span className={`inline-block text-[10px] px-2.5 py-1 rounded-full font-heading font-semibold uppercase tracking-wider border mb-4 ${TYPE_COLORS[loop.loop_type] || 'bg-gold/20 text-gold border-gold/30'}`}>
              {loop.loop_type.replace('-', ' ')}
            </span>

            <h1 className="text-4xl md:text-5xl font-heading font-light text-white tracking-tight mb-4">
              {loop.name}
            </h1>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/50 font-body mb-6">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gold/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <Link href={`/destination/${loop.destination_slug}`} className="hover:text-gold transition">{destLabel}</Link>
              </span>
              {loop.duration_estimate && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-gold/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {loop.duration_estimate}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gold/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {loop.stops_count} stop{loop.stops_count !== 1 ? 's' : ''}
              </span>
              {loop.vibe && (
                <span className="text-gold/70">{loop.vibe}</span>
              )}
              {loop.difficulty && (
                <span className="capitalize text-white/40">{loop.difficulty}</span>
              )}
            </div>

            {loop.description && (
              <p className="text-white/60 font-body max-w-2xl leading-relaxed">{loop.description}</p>
            )}
          </motion.div>
        </div>
      </section>

      {/* ─── ITINERARY TIMELINE ─── */}
      <section className="max-w-4xl mx-auto px-6 py-12" data-testid="loop-timeline">
        <h2 className="text-2xl font-heading font-light text-white mb-8 tracking-tight">
          Your <span className="font-semibold text-gradient-gold">Itinerary</span>
        </h2>

        <div className="space-y-0">
          {loop.stops.map((stop, i) => {
            const name = stop.custom_name || stop.listing?.business_name || `Stop ${stop.stop_order}`;
            const image = stop.custom_image_url || stop.listing?.cover_image_url;
            const description = stop.custom_description;

            return (
              <div key={stop.id} data-testid={`loop-stop-${stop.stop_order}`}>
                {/* Stop card */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-6 group"
                >
                  {/* Timeline connector */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-10 h-10 rounded-full border-2 border-gold/40 bg-gold/10 flex items-center justify-center text-sm font-heading font-bold text-gold">
                      {stop.stop_order}
                    </div>
                    {i < loop.stops.length - 1 && (
                      <div className="w-px flex-1 bg-gradient-to-b from-gold/30 to-transparent min-h-[20px]" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-8">
                    <div className="rounded-xl border border-white/10 overflow-hidden hover:border-gold/20 transition-all duration-300 bg-midnight-900/50">
                      <div className="flex flex-col sm:flex-row">
                        {/* Image */}
                        {image && (
                          <div className="sm:w-48 h-32 sm:h-auto flex-shrink-0 overflow-hidden">
                            <img src={image} alt={name} className="w-full h-full object-cover" />
                          </div>
                        )}

                        {/* Info */}
                        <div className="p-5 flex-1">
                          <h3 className="text-lg font-heading font-semibold text-white mb-1">{name}</h3>

                          {stop.listing && (
                            <div className="flex items-center gap-3 mb-2">
                              {stop.listing.city && (
                                <span className="text-xs text-white/40 font-body">
                                  {stop.listing.city}{stop.listing.state ? `, ${stop.listing.state}` : ''}
                                </span>
                              )}
                              {stop.listing.avg_feedback_rating > 0 && (
                                <Stars rating={stop.listing.avg_feedback_rating} size={11} />
                              )}
                            </div>
                          )}

                          {description && (
                            <p className="text-sm text-white/50 font-body leading-relaxed mb-3">{description}</p>
                          )}

                          <div className="flex items-center gap-4">
                            {stop.duration_minutes && (
                              <span className="text-xs text-white/40 font-body flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                ~{stop.duration_minutes} min
                              </span>
                            )}
                            {stop.listing && (
                              <Link
                                href={`/listing/${stop.listing.slug}`}
                                className="text-xs text-gold/70 hover:text-gold transition font-heading font-semibold uppercase tracking-wider"
                              >
                                View Business &rarr;
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Transition note */}
                    {stop.transition_note && i < loop.stops.length - 1 && (
                      <div className="mt-3 ml-4 flex items-center gap-2 text-xs text-white/30 font-body italic">
                        <svg className="w-3.5 h-3.5 text-gold/40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        {stop.transition_note}
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── LOOP INFO SIDEBAR (mobile: section) ─── */}
      <section className="max-w-4xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Duration', value: loop.duration_estimate || 'Flexible', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
            { label: 'Stops', value: `${loop.stops_count} stops`, icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
            { label: 'Vibe', value: loop.vibe || 'Mixed', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
            { label: 'Difficulty', value: loop.difficulty ? loop.difficulty.charAt(0).toUpperCase() + loop.difficulty.slice(1) : 'Easy', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
          ].map(info => (
            <div key={info.label} className="text-center p-4 rounded-xl border border-white/10 bg-midnight-900/50">
              <svg className="w-5 h-5 text-gold/60 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={info.icon} />
              </svg>
              <p className="text-xs text-white/40 font-body uppercase tracking-wider">{info.label}</p>
              <p className="text-sm font-heading font-semibold text-white mt-1">{info.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── RELATED LOOPS ─── */}
      {related.length > 0 && (
        <section className="bg-charcoal-900 py-16">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-2xl font-heading font-light text-white mb-8 text-center tracking-tight">
              More <span className="font-semibold text-gradient-gold">Experiences</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map(r => (
                <Link
                  key={r.id}
                  href={`/loops/${r.slug}`}
                  className="rounded-xl overflow-hidden border border-white/10 hover:border-gold/30 transition-all duration-300 group bg-midnight-900/50"
                >
                  <div className="relative h-36 overflow-hidden">
                    {r.cover_image_url ? (
                      <img src={r.cover_image_url} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gold/10 via-midnight-800 to-midnight-900" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-midnight-900/80 to-transparent" />
                    <span className={`absolute top-2 left-2 text-[9px] px-2 py-0.5 rounded-full font-heading font-semibold uppercase tracking-wider border ${TYPE_COLORS[r.loop_type] || 'bg-gold/20 text-gold border-gold/30'}`}>
                      {r.loop_type.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-heading font-semibold text-white group-hover:text-gold transition-colors duration-300">{r.name}</h3>
                    <p className="text-xs text-white/40 font-body mt-1">
                      {DESTINATIONS[r.destination_slug] || r.destination_slug}
                      {r.duration_estimate ? ` · ${r.duration_estimate}` : ''}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── CROSS-DIMENSIONAL CTAs ─── */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={`/destination/${loop.destination_slug}`}
            className="btn-ghost px-6 py-3 rounded-full text-sm text-center"
          >
            Explore more in {destLabel}
          </Link>
          <Link
            href="/loops"
            className="btn-primary px-6 py-3 rounded-full text-sm text-center"
          >
            See All Experiences
          </Link>
        </div>
      </section>
    </main>
  );
}

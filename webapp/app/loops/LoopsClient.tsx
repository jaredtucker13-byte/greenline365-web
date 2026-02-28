'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import BoostedShowcase from '@/components/BoostedShowcase';

interface Loop {
  id: string;
  name: string;
  slug: string;
  loop_type: string;
  destination_slug: string;
  description?: string;
  short_description?: string;
  cover_image_url?: string;
  duration_estimate?: string;
  vibe?: string;
  difficulty?: string;
  stops_count: number;
}

const LOOP_TYPES = [
  { id: '', label: 'All' },
  { id: 'date-night', label: 'Date Night' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'family', label: 'Family' },
  { id: 'foodie', label: 'Foodie' },
  { id: 'adventure', label: 'Adventure' },
  { id: 'nightlife', label: 'Nightlife' },
  { id: 'wellness', label: 'Wellness' },
];

const DESTINATIONS = [
  { slug: '', label: 'All Destinations' },
  { slug: 'st-pete-beach', label: 'St. Pete Beach' },
  { slug: 'key-west', label: 'Key West' },
  { slug: 'sarasota', label: 'Sarasota' },
  { slug: 'ybor-city', label: 'Ybor City' },
  { slug: 'daytona', label: 'Daytona Beach' },
  { slug: 'orlando', label: 'Orlando' },
  { slug: 'miami', label: 'Miami' },
  { slug: 'jacksonville', label: 'Jacksonville' },
];

const TYPE_COLORS: Record<string, string> = {
  'date-night': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'entertainment': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'family': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'foodie': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'adventure': 'bg-green-500/20 text-green-300 border-green-500/30',
  'nightlife': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  'wellness': 'bg-teal-500/20 text-teal-300 border-teal-500/30',
};

export default function LoopsClient() {
  const [loops, setLoops] = useState<Loop[]>([]);
  const [activeType, setActiveType] = useState('');
  const [activeDestination, setActiveDestination] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLoops();
  }, [activeType, activeDestination]);

  async function loadLoops() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeType) params.set('type', activeType);
      if (activeDestination) params.set('destination', activeDestination);
      params.set('limit', '50');

      const res = await fetch(`/api/loops?${params.toString()}`);
      const data = await res.json();
      setLoops(data.loops || []);
    } catch {
      setLoops([]);
    }
    setLoading(false);
  }

  const destLabel = (slug: string) => DESTINATIONS.find(d => d.slug === slug)?.label || slug;

  return (
    <main className="min-h-screen bg-midnight-950" data-testid="loops-landing">
      {/* ─── HERO ─── */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-midnight-950 via-midnight-900 to-midnight-950" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-radial-gold opacity-10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-gold border border-gold/20 mb-6">
              <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
              <span className="text-xs font-semibold text-gold tracking-wide">EXPERIENCES</span>
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-light text-white tracking-tight mb-4">
              Discover Local <span className="font-semibold text-gradient-gold">Experiences</span>
            </h1>
            <p className="text-lg text-white/50 max-w-2xl mx-auto font-body mb-10">
              Curated itineraries featuring the best of Florida. From romantic date nights to family adventures.
            </p>
          </motion.div>

          {/* Type filter chips */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {LOOP_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => setActiveType(type.id)}
                className={`px-4 py-2 rounded-full text-sm font-heading font-medium transition-all duration-300 border ${
                  activeType === type.id
                    ? 'bg-gold/20 text-gold border-gold/40'
                    : 'bg-white/5 text-white/60 border-white/10 hover:border-gold/30 hover:text-gold'
                }`}
                data-testid={`loop-type-chip-${type.id || 'all'}`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Destination filter */}
          <select
            value={activeDestination}
            onChange={(e) => setActiveDestination(e.target.value)}
            className="bg-white/5 text-white/70 border border-white/10 rounded-full px-4 py-2 text-sm font-body appearance-none cursor-pointer hover:border-gold/30 transition-all"
          >
            {DESTINATIONS.map(dest => (
              <option key={dest.slug} value={dest.slug} className="bg-midnight-900">{dest.label}</option>
            ))}
          </select>
        </div>
      </section>

      {/* ─── BOOSTED SHOWCASE ─── */}
      <section className="py-16 bg-midnight-900" data-testid="loops-boosted-section">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-xs font-heading font-semibold uppercase tracking-[0.2em] text-center mb-3 text-gold">Spotlight</p>
          <h2 className="text-3xl md:text-4xl font-heading font-light text-white text-center mb-3 tracking-tight">
            Featured <span className="font-semibold text-gradient-gold">Businesses</span>
          </h2>
          <p className="text-white/50 text-center max-w-lg mx-auto mb-10 font-body">Businesses in the spotlight this week.</p>
          <BoostedShowcase />
          <p className="text-silver/50 text-xs mt-6 text-center font-body">
            Want your business here? <Link href="/register-business" className="underline hover:text-gold transition text-gold/70">Get featured for $29/week</Link>
          </p>
        </div>
      </section>

      {/* ─── LOOP CARDS GRID ─── */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <p className="text-xs font-heading font-semibold uppercase tracking-[0.2em] text-center mb-3 text-gold">Curated Itineraries</p>
        <h2 className="text-3xl md:text-4xl font-heading font-light text-white text-center mb-3 tracking-tight">
          Browse <span className="font-semibold text-gradient-gold">Loops</span>
        </h2>
        <p className="text-white/50 text-center max-w-lg mx-auto mb-12 font-body">
          {activeType || activeDestination
            ? `Showing ${activeType ? LOOP_TYPES.find(t => t.id === activeType)?.label : ''} ${activeDestination ? `in ${destLabel(activeDestination)}` : ''} loops`
            : 'All curated experiences across Florida'}
        </p>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white/5 animate-pulse h-72" />
            ))}
          </div>
        ) : loops.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/40 font-body text-lg mb-4">No loops found{activeType || activeDestination ? ' for these filters' : ' yet'}.</p>
            <p className="text-white/30 font-body text-sm">Check back soon — we&apos;re curating new experiences every week.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loops.map((loop, i) => (
              <motion.div
                key={loop.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/loops/${loop.slug}`}
                  className="block rounded-2xl overflow-hidden border border-white/10 hover:border-gold/30 transition-all duration-300 group bg-midnight-900/50 hover:bg-midnight-900/80"
                  data-testid={`loop-card-${loop.slug}`}
                >
                  {/* Cover */}
                  <div className="relative h-48 overflow-hidden">
                    {loop.cover_image_url ? (
                      <img src={loop.cover_image_url} alt={loop.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gold/10 via-midnight-800 to-midnight-900 flex items-center justify-center">
                        <svg className="w-12 h-12 text-gold/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-midnight-900/80 to-transparent" />

                    {/* Type badge */}
                    <span className={`absolute top-3 left-3 text-[10px] px-2.5 py-1 rounded-full font-heading font-semibold uppercase tracking-wider border ${TYPE_COLORS[loop.loop_type] || 'bg-gold/20 text-gold border-gold/30'}`}>
                      {loop.loop_type.replace('-', ' ')}
                    </span>

                    {/* Stops count */}
                    <span className="absolute bottom-3 right-3 text-xs text-white/70 bg-midnight-900/70 px-2 py-1 rounded-full font-body">
                      {loop.stops_count} stop{loop.stops_count !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <h3 className="text-lg font-heading font-semibold text-white group-hover:text-gold transition-colors duration-300 mb-1">
                      {loop.name}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-white/40 font-body mb-3">
                      <span>{destLabel(loop.destination_slug)}</span>
                      {loop.duration_estimate && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-white/20" />
                          <span>{loop.duration_estimate}</span>
                        </>
                      )}
                      {loop.vibe && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-white/20" />
                          <span>{loop.vibe}</span>
                        </>
                      )}
                    </div>
                    {loop.short_description && (
                      <p className="text-sm text-white/50 font-body line-clamp-2">{loop.short_description}</p>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* ─── EXPLORE BY DESTINATION ─── */}
      <section className="bg-charcoal-900 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-xs font-heading font-semibold uppercase tracking-[0.2em] text-center mb-3 text-gold">Explore By Destination</p>
          <h2 className="text-3xl md:text-4xl font-heading font-light text-white text-center mb-3 tracking-tight">
            Pick Your <span className="font-semibold text-gradient-gold">Destination</span>
          </h2>
          <p className="text-white/50 text-center max-w-lg mx-auto mb-12 font-body">Find curated experiences in your favorite Florida spots.</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {DESTINATIONS.filter(d => d.slug).map((dest, i) => (
              <motion.div
                key={dest.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <button
                  onClick={() => {
                    setActiveDestination(dest.slug);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full rounded-xl p-6 text-center border border-white/10 hover:border-gold/30 transition-all duration-300 group bg-midnight-900/50 hover:bg-midnight-900/80"
                >
                  <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center border border-gold/30 bg-gold/10 group-hover:bg-gold/20 transition-all duration-300">
                    <svg className="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-heading font-semibold text-white group-hover:text-gold transition-colors duration-300">{dest.label}</h3>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-heading font-light text-white mb-4 tracking-tight">
            Have a Local Business?
          </h2>
          <p className="text-white/50 font-body mb-8">Get your business featured in curated loops and reach customers who are ready to explore.</p>
          <Link href="/register-business" className="btn-primary px-8 py-3 rounded-full text-sm inline-block">
            Add Your Business
          </Link>
        </div>
      </section>
    </main>
  );
}

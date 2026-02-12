'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface Listing {
  id: string;
  business_name: string;
  slug: string;
  industry: string;
  subcategories: string[];
  description?: string;
  city?: string;
  state?: string;
  phone?: string;
  website?: string;
  cover_image_url?: string;
  gallery_images?: string[];
  tier: string;
  trust_score: number;
  avg_feedback_rating: number;
  total_feedback_count: number;
  tags?: string[];
  metadata?: Record<string, any>;
  directory_badges: { id: string; badge_type: string; badge_label: string; badge_color: string }[];
}

// ─── Destination Config ───
const DESTINATIONS: Record<string, {
  label: string;
  tagline: string;
  heroGradient: string;
  lat: number;
  lng: number;
}> = {
  'st-pete-beach':  { label: 'St. Pete Beach',  tagline: "Florida's Sunshine City",             heroGradient: 'from-sky-900/80 via-blue-900/60 to-midnight-900', lat: 27.7253, lng: -82.7412 },
  'key-west':       { label: 'Key West',         tagline: 'Close to Perfect, Far from Normal',   heroGradient: 'from-teal-900/80 via-emerald-900/60 to-midnight-900', lat: 24.5551, lng: -81.7800 },
  'sarasota':       { label: 'Sarasota',         tagline: 'Where Arts Meet the Gulf',            heroGradient: 'from-indigo-900/80 via-purple-900/60 to-midnight-900', lat: 27.3364, lng: -82.5307 },
  'ybor-city':      { label: 'Ybor City',        tagline: "Tampa's Historic Latin Quarter",      heroGradient: 'from-red-900/80 via-orange-900/60 to-midnight-900', lat: 27.9617, lng: -82.4369 },
  'daytona':        { label: 'Daytona Beach',    tagline: "World's Most Famous Beach",           heroGradient: 'from-amber-900/80 via-yellow-900/60 to-midnight-900', lat: 29.2108, lng: -81.0228 },
  'orlando':        { label: 'Orlando',          tagline: 'The City Beautiful',                  heroGradient: 'from-violet-900/80 via-fuchsia-900/60 to-midnight-900', lat: 28.5383, lng: -81.3792 },
  'miami':          { label: 'Miami',            tagline: 'Neon Nights & Coastal Luxury',        heroGradient: 'from-cyan-900/80 via-blue-900/60 to-midnight-900', lat: 25.7617, lng: -80.1918 },
  'jacksonville':   { label: 'Jacksonville',     tagline: 'Gridiron Grit & Riverfront Views',    heroGradient: 'from-slate-900/80 via-stone-900/60 to-midnight-900', lat: 30.3322, lng: -81.6557 },
};

// ─── Tourism Sections ───
const SECTIONS = [
  { id: 'stay',               label: 'Stay',                 icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'eat-drink',          label: 'Eat & Drink',          icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z' },
  { id: 'quick-eats',         label: 'Quick Eats',           icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { id: 'things-to-do',       label: 'Things To Do',         icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
  { id: 'beaches-nature',     label: 'Beaches & Nature',     icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064' },
  { id: 'family-fun',         label: 'Family Fun',           icon: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'shopping',           label: 'Shopping',             icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
  { id: 'everyday-essentials', label: 'Essentials',          icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { id: 'nightlife',          label: 'Nightlife',            icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z' },
  { id: 'getting-around',     label: 'Getting Around',       icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
];

function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} width={size} height={size} viewBox="0 0 24 24" fill={s <= Math.round(rating) ? '#C9A96E' : 'none'} stroke={s <= Math.round(rating) ? '#C9A96E' : '#555'} strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
    </div>
  );
}

export default function DestinationGuideClient({ slug }: { slug: string }) {
  const [listings, setListings] = useState<Record<string, Listing[]>>({});
  const [activeSection, setActiveSection] = useState('stay');
  const [loading, setLoading] = useState(true);
  const [allCount, setAllCount] = useState(0);

  const dest = DESTINATIONS[slug];

  useEffect(() => {
    if (!dest) return;
    loadGuideData();
  }, [slug]);

  async function loadGuideData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/directory/guide?destination=${slug}`);
      const data = await res.json();

      if (data.sections) {
        setListings(data.sections);
        setAllCount(data.totalCount || 0);

        // Auto-select first section with data
        const firstWithData = SECTIONS.find(s => (data.sections[s.id] || []).length > 0);
        if (firstWithData) setActiveSection(firstWithData.id);
      }
    } catch {
      setListings({});
      setAllCount(0);
    }
    setLoading(false);
  }

  if (!dest) {
    return (
      <div className="min-h-screen bg-midnight-900 flex items-center justify-center" data-testid="destination-not-found">
        <div className="text-center">
          <h1 className="text-3xl font-heading font-light text-white mb-4">Destination Not Found</h1>
          <p className="text-silver mb-8 font-body">This destination guide doesn&apos;t exist yet.</p>
          <Link href="/" className="btn-primary px-6 py-3 rounded-xl text-sm" data-testid="back-home-btn">Back to Directory</Link>
        </div>
      </div>
    );
  }

  const currentListings = listings[activeSection] || [];
  const currentSection = SECTIONS.find(s => s.id === activeSection);

  return (
    <div className="min-h-screen bg-midnight-900" data-testid="destination-guide">
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden" style={{ minHeight: '50vh' }} data-testid="destination-hero">
        <div className={`absolute inset-0 bg-gradient-to-b ${dest.heroGradient}`} />
        <div className="absolute inset-0 bg-gradient-to-r from-midnight-900/60 via-transparent to-midnight-900/60" />

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #C9A96E 0%, transparent 70%)' }} />
        <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #C9A96E 0%, transparent 70%)' }} />

        <div className="relative max-w-6xl mx-auto px-6 flex flex-col justify-center" style={{ minHeight: '50vh' }}>
          {/* Breadcrumb */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-silver/50 hover:text-gold transition font-body mb-8" data-testid="breadcrumb-home">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Directory
            </Link>
          </motion.div>

          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/20 backdrop-blur-sm mb-6 w-fit"
            style={{ background: 'rgba(201, 169, 110, 0.08)' }}>
            <span className="w-2 h-2 rounded-full bg-greenline animate-pulse" />
            <span className="text-xs font-medium text-white/80 tracking-widest font-heading uppercase">Destination Guide</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-heading font-light text-white leading-[1.05] mb-4 tracking-tight"
            data-testid="destination-title">
            {dest.label}
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="text-lg text-white/50 max-w-xl mb-6 font-body" data-testid="destination-tagline">
            {dest.tagline}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="flex items-center gap-4">
            <span className="text-sm text-gold font-heading font-semibold" data-testid="destination-count">
              {loading ? '...' : `${allCount} businesses`}
            </span>
            <span className="w-1 h-1 rounded-full bg-silver/30" />
            <span className="text-sm text-silver/50 font-body">Florida</span>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-midnight-900 to-transparent" />
      </section>

      {/* ─── Section Nav (Horizontal Tabs) ─── */}
      <section className="sticky top-0 z-30 bg-midnight-900/95 backdrop-blur-xl border-b border-white/5" data-testid="section-nav">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex overflow-x-auto gap-1 py-3 scrollbar-hide">
            {SECTIONS.map(section => {
              const count = (listings[section.id] || []).length;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-300 font-body ${
                    activeSection === section.id
                      ? 'bg-gold/15 text-gold border border-gold/30'
                      : count > 0
                        ? 'text-white/50 border border-white/10 hover:text-white/70 hover:border-white/20'
                        : 'text-white/20 border border-white/5 opacity-60'
                  }`}
                  data-testid={`section-tab-${section.id}`}
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={section.icon} />
                  </svg>
                  {section.label}
                  {count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      activeSection === section.id ? 'bg-gold/20 text-gold' : 'bg-white/5 text-white/30'
                    }`}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Section Content ─── */}
      <section className="max-w-6xl mx-auto px-6 py-10" data-testid="section-content">
        <AnimatePresence mode="wait">
          <motion.div key={activeSection} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center glass-gold">
                <svg className="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={currentSection?.icon || ''} />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-heading font-semibold text-white" data-testid="section-title">{currentSection?.label}</h2>
                <p className="text-xs text-silver/50 font-body">{currentListings.length} options in {dest.label}</p>
              </div>
            </div>

            {/* Listings Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="h-72 rounded-2xl animate-pulse bg-charcoal-800/30" />
                ))}
              </div>
            ) : currentListings.length === 0 ? (
              <div className="text-center py-16" data-testid="section-empty">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center glass-gold">
                  <svg className="w-10 h-10 text-gold/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={currentSection?.icon || ''} />
                  </svg>
                </div>
                <h3 className="text-xl font-heading font-light text-white mb-2">Coming Soon</h3>
                <p className="text-sm text-silver/50 font-body max-w-md mx-auto mb-6">
                  We&apos;re curating the best {currentSection?.label?.toLowerCase()} options in {dest.label}. Check back soon!
                </p>
                <Link href="/register-business" className="btn-primary px-6 py-3 rounded-xl text-sm" data-testid="register-from-empty">
                  Add Your Business
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {currentListings.map((l, i) => (
                  <GuideListingCard key={l.id} listing={l} index={i} />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      {/* ─── All Destinations CTA ─── */}
      <section className="border-t border-white/5 py-16" data-testid="other-destinations">
        <div className="max-w-6xl mx-auto px-6">
          <h3 className="text-lg font-heading font-semibold text-white mb-6 text-center">Explore More Destinations</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(DESTINATIONS).filter(([key]) => key !== slug).map(([key, d]) => (
              <Link key={key} href={`/destination/${key}`}
                className="rounded-xl p-4 border border-white/5 hover:border-gold/20 transition-all duration-300 text-center group"
                style={{ background: 'rgba(255,255,255,0.02)' }}
                data-testid={`dest-link-${key}`}>
                <span className="text-sm font-heading font-semibold text-white/70 group-hover:text-gold transition-colors">{d.label}</span>
                <span className="block text-[10px] text-silver/40 mt-1 font-body">FL</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Guide Listing Card ───
function GuideListingCard({ listing: l, index: i }: { listing: Listing; index: number }) {
  const googleRating = l.metadata?.google_rating;
  const googleReviewCount = l.metadata?.google_review_count;
  const googleMapsUrl = l.metadata?.google_maps_url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.04 }}
      className="rounded-2xl overflow-hidden border border-white/5 hover:border-gold/20 transition-all duration-500 group"
      style={{ background: 'rgba(255,255,255,0.02)' }}
      data-testid={`guide-listing-${l.slug}`}
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        {l.cover_image_url ? (
          <img src={l.cover_image_url} alt={l.business_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-midnight-800 to-charcoal-800">
            <span className="text-4xl font-heading font-light text-white/10">{l.business_name[0]}</span>
          </div>
        )}
        {/* Google Rating Badge */}
        {googleRating && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg backdrop-blur-md text-xs font-semibold"
            style={{ background: 'rgba(13,27,42,0.8)', color: '#C9A96E' }}>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            {googleRating.toFixed(1)}
          </div>
        )}
        {/* Tier badge */}
        {l.tier !== 'free' && (
          <span className="absolute top-3 left-3 text-[10px] px-2 py-0.5 rounded-full font-heading font-semibold uppercase tracking-wider text-midnight-900"
            style={{ background: l.tier === 'premium' ? 'linear-gradient(135deg, #C9A96E, #E6D8B5)' : 'linear-gradient(135deg, #A8A9AD, #C0C0C0)' }}>
            {l.tier === 'premium' ? 'Premier' : 'Pro'}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-heading font-semibold text-sm text-gold truncate mb-1" data-testid={`guide-name-${l.slug}`}>{l.business_name}</h3>

        {l.city && (
          <p className="text-[11px] text-silver/50 flex items-center gap-1 mb-1.5 font-body">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {l.city}, {l.state}
          </p>
        )}

        {l.description && <p className="text-xs text-white/35 line-clamp-2 mb-3 font-body">{l.description}</p>}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto">
          {l.phone && (
            <a href={`tel:${l.phone}`} className="btn-ghost text-xs px-3 py-1.5 rounded-full flex items-center gap-1" data-testid={`guide-call-${l.slug}`}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call
            </a>
          )}
          {l.website && (
            <a href={l.website} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs px-3 py-1.5 rounded-full flex items-center gap-1" data-testid={`guide-web-${l.slug}`}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Visit
            </a>
          )}
          {googleMapsUrl && (
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="ml-auto text-[10px] text-silver/40 hover:text-gold transition font-body" data-testid={`guide-maps-${l.slug}`}>
              Google Maps
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

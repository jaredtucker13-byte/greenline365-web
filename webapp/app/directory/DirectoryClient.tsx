'use client';

/**
 * GL365 Global Directory - Visual-First Public Business Search
 * Homepage of the application — directory-first lead generation.
 * Sections: Hero, Category Mosaic, Featured Listings, Value Prop, Testimonials, Listing Grid
 */

import { useState, useEffect, useCallback } from 'react';
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
  zip_code?: string;
  logo_url?: string;
  cover_image_url?: string;
  tier: string;
  trust_score: number;
  avg_feedback_rating: number;
  total_feedback_count: number;
  phone?: string;
  business_hours?: Record<string, any>;
  directory_badges: { id: string; badge_type: string; badge_label: string; badge_color: string }[];
}

const CATEGORIES = [
  { id: 'family-entertainment', label: 'Family Entertainment', sub: 'Kayak rentals, zoos, mini-golf & more', img: '/images/categories/family-entertainment.png' },
  { id: 'destinations', label: 'Destinations', sub: 'Hotels, resorts & vacation rentals', img: '/images/categories/destinations.png' },
  { id: 'services', label: 'Services', sub: 'HVAC, Plumbing, Electrical & Roofing', img: '/images/categories/services.png' },
  { id: 'dining', label: 'Dining', sub: 'Cafes, casual & fine dining', img: '/images/categories/dining.png' },
  { id: 'nightlife', label: 'Nightlife', sub: 'Bars, pubs, clubs & lounges', img: '/images/categories/nightlife.png' },
  { id: 'style-shopping', label: 'Style & Shopping', sub: 'Boutiques, salons & specialty retail', img: '/images/categories/style-shopping.png' },
  { id: 'health-wellness', label: 'Health & Wellness', sub: 'Gyms, spas, clinics & wellness centers', img: '/images/categories/health-wellness.png' },
];

const FILTER_SPECIALTIES = ['All Specialties', 'Residential', 'Commercial', 'Emergency', 'Maintenance'];
const FILTER_PRICE = ['All Price Ranges', '$', '$$', '$$$', '$$$$'];

const TESTIMONIALS = [
  { name: 'Marcus Johnson', role: 'HVAC Business Owner', rating: 5, text: 'Since listing on GL365, our bookings increased 40%. The verified badge gives customers instant trust — they know we\'re the real deal.' },
  { name: 'Sarah Chen', role: 'Homeowner, Tampa FL', rating: 5, text: 'I found a certified plumber through the directory in minutes. The Property Passport showed me exactly what work had been done on my home before I even called.' },
  { name: 'David Rodriguez', role: 'Bakery Owner', rating: 5, text: 'The AI built our profile in seconds from our website. Now we get foot traffic from people searching the directory. Best marketing investment we\'ve made.' },
];

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} width={size} height={size} viewBox="0 0 24 24" fill={s <= Math.round(rating) ? '#FF8C00' : 'none'} stroke={s <= Math.round(rating) ? '#FF8C00' : '#555'} strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
    </div>
  );
}

export default function DirectoryPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [specialty, setSpecialty] = useState('All Specialties');
  const [priceRange, setPriceRange] = useState('All Price Ranges');
  const [showListings, setShowListings] = useState(false);
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  const loadListings = useCallback(async (industry?: string, searchText?: string) => {
    setLoading(true);
    setShowListings(true);
    const params = new URLSearchParams({ limit: '24' });
    if (industry) params.set('industry', industry);
    if (searchText) params.set('search', searchText);
    const res = await fetch(`/api/directory?${params}`);
    const data = await res.json();
    setListings(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  // Load featured listings on mount
  useEffect(() => {
    async function loadFeatured() {
      try {
        const res = await fetch('/api/directory?limit=6');
        const data = await res.json();
        setFeaturedListings(Array.isArray(data) ? data.slice(0, 6) : []);
      } catch {
        setFeaturedListings([]);
      }
    }
    loadFeatured();
  }, []);

  function handleCategoryClick(id: string) {
    setActiveCategory(id);
    loadListings(id);
  }

  function handleSearch() {
    loadListings(activeCategory || undefined, search || undefined);
  }

  // Testimonial auto-rotate
  useEffect(() => {
    const t = setInterval(() => setTestimonialIdx(i => (i + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-white" data-testid="directory-page">
      {!showListings ? (
        <>
          {/* ======== HERO ======== */}
          <section className="relative overflow-hidden pt-16" style={{ minHeight: '85vh' }} data-testid="directory-hero">
            {/* Nano Banana AI Hero Backdrop */}
            <div className="absolute inset-0">
              <img src="/images/hero-directory.png" alt="Vibrant local business community" className="w-full h-full object-cover" />
            </div>
            {/* Gradient overlays for text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/70 via-[#0a0a0a]/40 to-[#0a0a0a]/90" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/50 via-transparent to-[#0a0a0a]/50" />
            {/* Subtle animated grain overlay */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

            <div className="relative max-w-5xl mx-auto px-6 flex flex-col items-center justify-center" style={{ minHeight: '75vh' }}>
              {/* Trust indicator */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-sm mb-6"
                style={{ background: 'rgba(255,140,0,0.1)' }}
              >
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-medium text-white/80 tracking-wide">LIVE DIRECTORY</span>
                <span className="text-xs text-white/40">|</span>
                <span className="text-xs text-white/60">Trusted by local businesses</span>
              </motion.div>

              {/* Main headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-5xl sm:text-6xl lg:text-7xl font-black text-white text-center leading-[1.05] mb-5"
                data-testid="directory-title"
              >
                Your City&apos;s Best,{' '}
                <span className="relative inline-block">
                  <span style={{ color: '#FF8C00' }}>Verified</span>
                  <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none"><path d="M1 5.5Q50 1 100 5T199 3" stroke="#FF8C00" strokeWidth="2" strokeLinecap="round" opacity="0.6" /></svg>
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.6 }}
                className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto text-center mb-10 leading-relaxed"
              >
                Find <span style={{ color: '#FF8C00', fontWeight: 600 }}>trusted</span> home services, dining, nightlife, and more — every badge is earned through <span style={{ color: '#FF8C00', fontWeight: 600 }}>real work</span>.
              </motion.p>

              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="w-full max-w-2xl"
              >
                <div className="flex flex-col sm:flex-row gap-3 p-2 rounded-2xl backdrop-blur-xl border border-white/10" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <div className="flex-1 relative">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input
                      type="text" placeholder="Search businesses, trades, services..."
                      value={search} onChange={e => setSearch(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      className="w-full pl-12 pr-4 py-4 rounded-xl text-sm bg-transparent text-white placeholder-white/40 focus:outline-none"
                      data-testid="hero-search"
                    />
                  </div>
                  <button onClick={handleSearch} className="px-8 py-4 rounded-xl text-sm font-bold text-black transition-all hover:scale-[1.02] hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #FF8C00, #FFB800)' }} data-testid="hero-search-btn">
                    Search Directory
                  </button>
                </div>

                {/* Quick category chips */}
                <div className="flex flex-wrap justify-center gap-2 mt-5">
                  {CATEGORIES.slice(0, 5).map((cat, i) => (
                    <motion.button
                      key={cat.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + i * 0.07 }}
                      onClick={() => handleCategoryClick(cat.id)}
                      className="px-4 py-1.5 rounded-full text-xs font-medium text-white/60 border border-white/10 hover:border-orange-500/50 hover:text-orange-300 hover:shadow-[0_0_12px_rgba(255,140,0,0.15)] transition-all duration-300 backdrop-blur-sm"
                      style={{ background: 'rgba(255,255,255,0.05)' }}
                      data-testid={`hero-chip-${cat.id}`}
                    >
                      {cat.label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Bottom fade to white */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
          </section>

          {/* ======== CATEGORY MOSAIC ======== */}
          <section id="categories" className="max-w-7xl mx-auto px-6 py-16" data-testid="categories-section">
            <p className="text-sm font-semibold uppercase tracking-widest text-center mb-2" style={{ color: '#FF8C00' }}>Find Your Trade</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a1a] text-center mb-3">
              Browse{' '}
              <span className="relative inline-block">
                <span style={{ color: '#FF8C00' }}>Categories</span>
                <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none"><path d="M1 5.5Q50 1 100 5T199 3" stroke="#FF8C00" strokeWidth="2" strokeLinecap="round" opacity="0.4" /></svg>
              </span>
            </h2>
            <p className="text-zinc-500 text-center max-w-lg mx-auto mb-10">
              From local home services to your favorite neighborhood spots. Your next trusted pro is just a click away.
            </p>

            {/* Mosaic Grid - 7 categories */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {/* Large "Services" card (core moat) */}
              <div
                className="col-span-2 row-span-2 relative rounded-2xl overflow-hidden cursor-pointer group hover:shadow-[0_0_30px_rgba(255,140,0,0.12)] transition-shadow duration-500"
                style={{ minHeight: 340 }}
                onClick={() => handleCategoryClick(CATEGORIES[2].id)}
                data-testid={`cat-${CATEGORIES[2].id}`}
              >
                <img src={CATEGORIES[2].img} alt={CATEGORIES[2].label} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent group-hover:from-black/90 transition-all duration-500" />
                <div className="absolute bottom-5 left-5">
                  <span className="text-white text-2xl font-bold block">{CATEGORIES[2].label}</span>
                  <span className="text-zinc-300 text-xs">{CATEGORIES[2].sub}</span>
                </div>
                <span className="absolute top-3 right-3 text-[10px] px-2 py-1 rounded-full bg-green-500/90 text-white font-bold uppercase tracking-wider">Core</span>
              </div>
              {/* Top row: Family Entertainment, Destinations */}
              {[CATEGORIES[0], CATEGORIES[1]].map(cat => (
                <div
                  key={cat.id}
                  className="relative rounded-2xl overflow-hidden cursor-pointer group"
                  style={{ minHeight: 160 }}
                  onClick={() => handleCategoryClick(cat.id)}
                  data-testid={`cat-${cat.id}`}
                >
                  <img src={cat.img} alt={cat.label} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <span className="text-white text-sm md:text-base font-bold block">{cat.label}</span>
                    <span className="text-zinc-300 text-[10px] hidden md:block">{cat.sub}</span>
                  </div>
                </div>
              ))}
              {/* Second row: Dining, Nightlife */}
              {[CATEGORIES[3], CATEGORIES[4]].map(cat => (
                <div
                  key={cat.id}
                  className="relative rounded-2xl overflow-hidden cursor-pointer group"
                  style={{ minHeight: 160 }}
                  onClick={() => handleCategoryClick(cat.id)}
                  data-testid={`cat-${cat.id}`}
                >
                  <img src={cat.img} alt={cat.label} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <span className="text-white text-sm md:text-base font-bold block">{cat.label}</span>
                    <span className="text-zinc-300 text-[10px] hidden md:block">{cat.sub}</span>
                  </div>
                </div>
              ))}
              {/* Bottom row: Style & Shopping, Health & Wellness (span full width) */}
              {[CATEGORIES[5], CATEGORIES[6]].map(cat => (
                <div
                  key={cat.id}
                  className="col-span-2 relative rounded-2xl overflow-hidden cursor-pointer group"
                  style={{ minHeight: 180 }}
                  onClick={() => handleCategoryClick(cat.id)}
                  data-testid={`cat-${cat.id}`}
                >
                  <img src={cat.img} alt={cat.label} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <span className="text-white text-lg md:text-xl font-bold block">{cat.label}</span>
                    <span className="text-zinc-300 text-xs">{cat.sub}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <button onClick={() => loadListings()} className="px-6 py-3 rounded-full text-sm font-semibold text-white" style={{ background: '#FF8C00' }} data-testid="all-categories-btn">
                All Categories
              </button>
            </div>
          </section>

          {/* ======== FEATURED LISTINGS ======== */}
          <section className="bg-[#1a1a1a] py-16" data-testid="featured-listings-section">
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex items-center justify-center gap-3 mb-2">
                <svg className="w-6 h-6" style={{ color: '#FF8C00' }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: '#FF8C00' }}>Showcase</p>
                <svg className="w-6 h-6" style={{ color: '#FF8C00' }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-3">Featured Listings</h2>
              <p className="text-zinc-400 text-center max-w-lg mx-auto mb-10">
                Top-rated businesses handpicked for exceptional service and verified trust scores.
              </p>

              {featuredListings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredListings.map((l, i) => (
                    <motion.div
                      key={l.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-orange-500/40 transition-all group cursor-pointer"
                      data-testid={`featured-${l.slug}`}
                    >
                      {/* Featured Badge */}
                      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-black" style={{ background: 'linear-gradient(135deg, #FF8C00, #FFB800)' }}>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                        FEATURED
                      </div>

                      {/* Cover Image */}
                      <div className="relative h-44 overflow-hidden">
                        {l.cover_image_url || l.logo_url ? (
                          <img src={l.cover_image_url || l.logo_url!} alt={l.business_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a1a1a, #333)' }}>
                            <span className="text-5xl font-bold text-white/10">{l.business_name[0]}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-white truncate">{l.business_name}</h3>
                            <p className="text-xs text-zinc-500 capitalize">{l.industry.replace('_', ' ')}</p>
                          </div>
                          {l.avg_feedback_rating > 0 && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold text-black ml-2 flex-shrink-0" style={{ background: '#FF8C00' }}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                              {l.avg_feedback_rating.toFixed(1)}
                            </div>
                          )}
                        </div>

                        {l.city && (
                          <p className="text-xs text-zinc-500 flex items-center gap-1 mb-2">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            {l.city}, {l.state}
                          </p>
                        )}

                        {l.description && <p className="text-xs text-zinc-400 line-clamp-2 mb-4">{l.description}</p>}

                        {/* Badges */}
                        {l.directory_badges && l.directory_badges.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {l.directory_badges.slice(0, 3).map((b: any) => (
                              <span key={b.id} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium text-white" style={{ background: b.badge_color + '33', border: `1px solid ${b.badge_color}55` }}>
                                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                {b.badge_label}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <button className="flex-1 text-xs font-semibold px-4 py-2 rounded-full text-black transition hover:opacity-90" style={{ background: '#FF8C00' }} data-testid={`featured-view-${l.slug}`}>
                            View Profile
                          </button>
                          {l.phone && (
                            <a href={`tel:${l.phone}`} className="w-9 h-9 rounded-full border border-zinc-700 flex items-center justify-center hover:border-orange-500/50 transition" data-testid={`featured-call-${l.slug}`}>
                              <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-72 rounded-2xl bg-zinc-800/50 animate-pulse" />
                  ))}
                </div>
              )}

              <div className="text-center mt-10">
                <button onClick={() => loadListings()} className="px-8 py-3 rounded-full text-sm font-semibold text-black" style={{ background: '#FF8C00' }} data-testid="view-all-listings-btn">
                  View All Listings
                </button>
                <p className="text-zinc-500 text-xs mt-3">Want your business featured here? <Link href="/pricing" className="underline hover:text-white transition" style={{ color: '#FF8C00' }}>Upgrade your listing</Link></p>
              </div>
            </div>
          </section>

          {/* ======== VALUE PROPOSITION ======== */}
          <section className="bg-[#fafafa] py-16" data-testid="value-prop-section">
            <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-[#1a1a1a] mb-4">A Trusted Resource for Finding Local Pros</h2>
                <p className="text-zinc-500 mb-8 leading-relaxed">
                  Whether you need emergency plumbing, a master electrician, or the best barber in town — our directory connects you with verified, accountable businesses. Every badge is earned through real work and real feedback.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'Verified Pros' },
                    { icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', label: 'Transparent Ratings' },
                    { icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', label: 'Easy Navigation' },
                    { icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z', label: 'Direct Contact' },
                  ].map(f => (
                    <div key={f.label} className="flex items-center gap-3">
                      <svg className="w-6 h-6 flex-shrink-0" style={{ color: '#FF8C00' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                      </svg>
                      <span className="text-sm font-medium text-[#1a1a1a]">{f.label}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => loadListings()} className="mt-8 px-6 py-3 rounded-full text-sm font-semibold text-white" style={{ background: '#FF8C00' }} data-testid="find-business-btn">
                  Find a Business
                </button>
              </div>
              <div className="relative rounded-2xl overflow-hidden" style={{ minHeight: 350 }}>
                <img src="/images/hero-directory-alt.png" alt="Trusted local businesses" className="w-full h-full object-cover rounded-2xl" />
              </div>
            </div>
          </section>

          {/* ======== TESTIMONIALS ======== */}
          <section id="testimonials" className="relative py-16 overflow-hidden" data-testid="testimonials-section">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url(/images/hero-directory-alt.png)', backgroundSize: 'cover' }} />
            <div className="absolute inset-0 bg-[#1a1a1a]/90" />
            <div className="relative max-w-4xl mx-auto px-6 text-center">
              <h2 className="text-3xl font-bold text-white mb-2">Success Stories</h2>
              <p className="text-zinc-400 mb-10">Hear from business owners and customers who found their perfect match.</p>

              <AnimatePresence mode="wait">
                <motion.div
                  key={testimonialIdx}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.4 }}
                  className="bg-white rounded-2xl p-8 max-w-lg mx-auto shadow-xl"
                >
                  <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center text-xl font-bold text-white" style={{ background: '#FF8C00' }}>
                    {TESTIMONIALS[testimonialIdx].name[0]}
                  </div>
                  <h3 className="text-lg font-bold text-[#1a1a1a]">{TESTIMONIALS[testimonialIdx].name}</h3>
                  <p className="text-sm text-zinc-500 mb-3">{TESTIMONIALS[testimonialIdx].role}</p>
                  <div className="flex justify-center mb-4"><Stars rating={TESTIMONIALS[testimonialIdx].rating} size={18} /></div>
                  <p className="text-sm text-zinc-600 leading-relaxed italic">&ldquo;{TESTIMONIALS[testimonialIdx].text}&rdquo;</p>
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-center gap-2 mt-6">
                {TESTIMONIALS.map((_, i) => (
                  <button key={i} onClick={() => setTestimonialIdx(i)}
                    className={`w-2.5 h-2.5 rounded-full transition ${i === testimonialIdx ? 'scale-110' : 'opacity-40'}`}
                    style={{ background: i === testimonialIdx ? '#FF8C00' : '#fff' }}
                    data-testid={`testimonial-dot-${i}`}
                  />
                ))}
              </div>
            </div>
          </section>
        </>
      ) : (
        /* ======== LISTINGS VIEW ======== */
        <div data-testid="listings-view">
          {/* Category Header with Image */}
          <section className="relative bg-[#0f0f0f] pt-20 pb-10 overflow-hidden">
            {activeCategory && CATEGORIES.find(c => c.id === activeCategory) && (
              <div className="absolute inset-0 opacity-25">
                <img src={CATEGORIES.find(c => c.id === activeCategory)!.img} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0f0f0f]/60 via-[#0f0f0f]/80 to-[#0f0f0f]" />

            <div className="relative max-w-7xl mx-auto px-6">
              {/* Back button */}
              <button onClick={() => setShowListings(false)} className="text-sm text-white/50 hover:text-white mb-6 flex items-center gap-2 transition" data-testid="back-to-explore-btn">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back to Directory
              </button>

              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {activeCategory ? CATEGORIES.find(c => c.id === activeCategory)?.label || 'All Businesses' : 'All Businesses'}
              </h2>
              <p className="text-white/50 text-sm mb-8">
                {activeCategory ? CATEGORIES.find(c => c.id === activeCategory)?.sub : 'Browse verified businesses across all categories'}
              </p>

              {/* Search + Filters - Glass morphism */}
              <div className="rounded-2xl p-4 backdrop-blur-xl border border-white/10" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="flex flex-col sm:flex-row gap-3 mb-3">
                  <div className="flex-1 relative">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input type="text" placeholder="Search businesses, trades, services..." value={search} onChange={e => setSearch(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      className="w-full pl-11 pr-4 py-3 rounded-xl text-sm bg-white/5 text-white placeholder-white/30 border border-white/10 focus:outline-none focus:border-orange-500/40" data-testid="list-search" />
                  </div>
                  <button onClick={handleSearch} className="px-8 py-3 rounded-xl text-sm font-bold text-black transition hover:opacity-90" style={{ background: 'linear-gradient(135deg, #FF8C00, #FFB800)' }}>Search</button>
                </div>
                {/* Filter chips */}
                <div className="flex flex-wrap gap-2">
                  <select value={specialty} onChange={e => setSpecialty(e.target.value)}
                    className="px-4 py-2 rounded-lg text-xs font-medium bg-white/5 text-white/70 border border-white/10 focus:outline-none focus:border-orange-500/30 appearance-none cursor-pointer" data-testid="filter-specialty"
                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='rgba(255,255,255,0.4)' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '32px' }}>
                    {FILTER_SPECIALTIES.map(s => <option key={s} className="bg-[#1a1a1a] text-white">{s}</option>)}
                  </select>
                  <select value={activeCategory || 'All Categories'} onChange={e => { const v = e.target.value; setActiveCategory(v === 'All Categories' ? '' : v); loadListings(v === 'All Categories' ? undefined : v); }}
                    className="px-4 py-2 rounded-lg text-xs font-medium bg-white/5 text-white/70 border border-white/10 focus:outline-none focus:border-orange-500/30 appearance-none cursor-pointer" data-testid="filter-category"
                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='rgba(255,255,255,0.4)' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '32px' }}>
                    <option className="bg-[#1a1a1a] text-white">All Categories</option>
                    {CATEGORIES.map(c => <option key={c.id} value={c.id} className="bg-[#1a1a1a] text-white">{c.label}</option>)}
                  </select>
                  <select value={priceRange} onChange={e => setPriceRange(e.target.value)}
                    className="px-4 py-2 rounded-lg text-xs font-medium bg-white/5 text-white/70 border border-white/10 focus:outline-none focus:border-orange-500/30 appearance-none cursor-pointer" data-testid="filter-price"
                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='rgba(255,255,255,0.4)' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '32px' }}>
                    {FILTER_PRICE.map(p => <option key={p} className="bg-[#1a1a1a] text-white">{p}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Listing Results */}
          <section className="max-w-7xl mx-auto px-6 py-10">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-64 rounded-2xl animate-pulse bg-zinc-100" />)}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-16" data-testid="no-results">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(255,140,0,0.1), rgba(255,184,0,0.1))' }}>
                <svg className="w-12 h-12" style={{ color: '#FF8C00' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-zinc-800 mb-3">
                {search ? 'No results found' : 'Be the first in this category'}
              </h3>
              <p className="text-sm text-zinc-500 max-w-md mx-auto mb-8">
                {search
                  ? `No businesses matched "${search}". Try a different search term or browse categories.`
                  : 'This category is waiting for its first verified business. Register yours and stand out from day one.'}
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link href="/register-business" className="px-6 py-3 rounded-xl text-sm font-bold text-black" style={{ background: 'linear-gradient(135deg, #FF8C00, #FFB800)' }} data-testid="register-from-empty">
                  Add Your Business
                </Link>
                <button onClick={() => { setSearch(''); setActiveCategory(''); loadListings(); }} className="px-6 py-3 rounded-xl text-sm font-medium text-zinc-600 border border-zinc-200 hover:border-zinc-400 transition">
                  Browse All
                </button>
              </div>
            </div>
          ) : (() => {
            const SECTION_MAP: Record<string, { label: string; color: string; industries: string[] }> = {
              'family-entertainment': { label: 'Family Entertainment', color: '#FFB800', industries: ['family-entertainment', 'entertainment', 'recreation'] },
              'destinations': { label: 'Destinations', color: '#00D4FF', industries: ['destinations', 'hotel', 'resort', 'lodging'] },
              'services': { label: 'Services', color: '#10B981', industries: ['services', 'hvac', 'plumbing', 'electrical', 'roofing'] },
              'dining': { label: 'Dining', color: '#FF8C00', industries: ['dining', 'restaurant', 'cafe', 'bakery'] },
              'nightlife': { label: 'Nightlife', color: '#8B5CF6', industries: ['nightlife', 'bar', 'pub', 'club'] },
              'style-shopping': { label: 'Style & Shopping', color: '#EC4899', industries: ['style-shopping', 'boutique', 'salon', 'barbershop', 'retail'] },
              'health-wellness': { label: 'Health & Wellness', color: '#10B981', industries: ['health-wellness', 'gym', 'spa', 'dental', 'wellness'] },
            };

            if (activeCategory) {
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {listings.map((l, i) => <ListingCard key={l.id} listing={l} index={i} />)}
                </div>
              );
            }

            const sections = Object.entries(SECTION_MAP).map(([key, sec]) => {
              const items = listings.filter(l => sec.industries.includes(l.industry));
              return { key, ...sec, items };
            }).filter(s => s.items.length > 0);

            return (
              <div className="space-y-12">
                {sections.map(sec => (
                  <div key={sec.key}>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-[#1a1a1a] flex items-center gap-2">
                        <span className="w-1.5 h-6 rounded-full" style={{ background: sec.color }} />
                        {sec.label}
                      </h2>
                      <span className="text-xs text-zinc-400">{sec.items.length} businesses</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                      {sec.items.slice(0, 8).map((l, i) => <ListingCard key={l.id} listing={l} index={i} />)}
                    </div>
                    {sec.items.length > 8 && (
                      <button onClick={() => { setActiveCategory(sec.items[0].industry); loadListings(sec.items[0].industry); }}
                        className="mt-4 text-sm font-medium transition hover:underline" style={{ color: sec.color }}>
                        View all {sec.items.length} {sec.label.toLowerCase()} →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
          </section>
        </div>
      )}
    </div>
  );
}

function ListingCard({ listing: l, index: i }: { listing: Listing; index: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
      className="rounded-2xl overflow-hidden border border-zinc-100 bg-white shadow-sm hover:shadow-lg transition group cursor-pointer"
      data-testid={`listing-${l.slug}`}>
      <div className="relative h-40 overflow-hidden bg-zinc-100">
        {l.cover_image_url || l.logo_url ? (
          <img src={l.cover_image_url || l.logo_url!} alt={l.business_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a1a1a, #333)' }}>
            <span className="text-4xl font-bold text-white/20">{l.business_name[0]}</span>
          </div>
        )}
        <span className="absolute top-3 left-3 text-[10px] px-2 py-1 rounded-full bg-black/60 text-white capitalize backdrop-blur-sm">{l.industry.replace('_', ' ')}</span>
        {l.directory_badges && l.directory_badges.length > 0 && (
          <div className="absolute top-3 right-3 flex gap-1">
            {l.directory_badges.slice(0, 2).map((b: any) => (
              <span key={b.id} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: b.badge_color }}>
                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold truncate mb-1" style={{ color: '#FF8C00' }}>{l.business_name}</h3>
        {l.city && <p className="text-xs text-zinc-500 flex items-center gap-1 mb-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          {l.city}, {l.state}
        </p>}
        {l.description && <p className="text-xs text-zinc-400 line-clamp-2 mb-3">{l.description}</p>}
        <div className="flex items-center justify-between">
          <button className="text-xs font-semibold px-3 py-1.5 rounded-full border transition hover:bg-orange-50" style={{ color: '#FF8C00', borderColor: '#FF8C00' }} data-testid={`view-details-${l.slug}`}>View Details</button>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold text-white" style={{ background: '#FF8C00' }}>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
            {l.avg_feedback_rating > 0 ? `${l.avg_feedback_rating.toFixed(1)}/5` : 'New'}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

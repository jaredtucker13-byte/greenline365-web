'use client';

/**
 * GL365 Directory — "Bentley Standard" Luxury UI
 * Homepage of the application — directory-first lead generation.
 * Sections: Hero, Category Mosaic, Premier Partners, Property Intelligence, Recently Added, Value Prop, Testimonials
 */

import { useState, useEffect, useCallback, useRef } from 'react';
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
  gallery_images?: string[];
  tier: string;
  is_claimed?: boolean;
  has_property_intelligence?: boolean;
  search_weight?: number;
  total_photos_available?: number;
  trust_score: number;
  avg_feedback_rating: number;
  total_feedback_count: number;
  phone?: string;
  business_hours?: Record<string, any>;
  directory_badges: { id: string; badge_type: string; badge_label: string; badge_color: string }[];
}

const CATEGORIES = [
  { id: 'family-entertainment', label: 'Family Entertainment', sub: 'Kayak rentals, zoos, mini-golf & more', icon: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', img: '/images/categories/family-entertainment.png' },
  { id: 'destinations', label: 'Destinations', sub: 'Hotels, resorts & vacation rentals', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064', img: '/images/categories/destinations.png' },
  { id: 'services', label: 'Services', sub: 'HVAC, Plumbing, Electrical & Roofing', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', img: '/images/categories/services.png' },
  { id: 'dining', label: 'Dining', sub: 'Cafes, casual & fine dining', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z', img: '/images/categories/dining.png' },
  { id: 'nightlife', label: 'Nightlife', sub: 'Bars, pubs, clubs & lounges', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', img: '/images/categories/nightlife.png' },
  { id: 'style-shopping', label: 'Style & Shopping', sub: 'Boutiques, salons & specialty retail', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z', img: '/images/categories/style-shopping.png' },
  { id: 'health-wellness', label: 'Health & Wellness', sub: 'Gyms, spas, clinics & wellness centers', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', img: '/images/categories/health-wellness.png' },
];

const FILTER_SPECIALTIES = ['All Specialties', 'Residential', 'Commercial', 'Emergency', 'Maintenance'];

const TESTIMONIALS = [
  { name: 'Marcus Johnson', role: 'HVAC Business Owner', rating: 5, text: 'Since listing on GL365, our bookings increased 40%. The verified badge gives customers instant trust — they know we\'re the real deal.' },
  { name: 'Sarah Chen', role: 'Homeowner, Tampa FL', rating: 5, text: 'I found a certified plumber through the directory in minutes. The Property Passport showed me exactly what work had been done on my home before I even called.' },
  { name: 'David Rodriguez', role: 'Bakery Owner', rating: 5, text: 'The AI built our profile in seconds from our website. Now we get foot traffic from people searching the directory. Best marketing investment we\'ve made.' },
];

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
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

/** Property Intelligence Badge — Metallic Shield */
function PropertyIntelBadge({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = { sm: 'px-2 py-0.5 text-[10px]', md: 'px-3 py-1 text-xs', lg: 'px-4 py-1.5 text-sm' };
  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full ${sizeMap[size]} badge-shimmer`}
      style={{ background: 'linear-gradient(135deg, #5B8A72, #7BAF95, #5B8A72)', backgroundSize: '200% auto', color: '#fff' }}
      data-testid="property-intel-badge"
    >
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
      Property Intelligence
    </span>
  );
}

export default function DirectoryPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [specialty, setSpecialty] = useState('All Specialties');
  const [priceRange, setPriceRange] = useState('All');
  const [showListings, setShowListings] = useState(false);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [specialtyDropdownOpen, setSpecialtyDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadListings = useCallback(async (industry?: string, searchText?: string) => {
    setLoading(true);
    setShowListings(true);
    const params = new URLSearchParams({ limit: '50' });
    if (industry) params.set('industry', industry);
    if (searchText) params.set('search', searchText);
    const res = await fetch(`/api/directory?${params}`);
    const data = await res.json();
    setListings(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    async function loadFeatured() {
      try {
        const res = await fetch('/api/directory?limit=12');
        const data = await res.json();
        setFeaturedListings(Array.isArray(data) ? data : []);
      } catch { setFeaturedListings([]); }
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

  useEffect(() => {
    const t = setInterval(() => setTestimonialIdx(i => (i + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(t);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCategoryDropdownOpen(false);
        setSpecialtyDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Segment featured listings
  const premierPartners = featuredListings.filter(l => l.tier === 'premium' || (l.has_property_intelligence));
  const intelVerified = featuredListings.filter(l => l.has_property_intelligence && l.tier !== 'premium');
  const recentlyAdded = featuredListings.filter(l => !l.has_property_intelligence && l.tier === 'free');

  return (
    <div className="min-h-screen bg-midnight-900" data-testid="directory-page">
      {!showListings ? (
        <>
          {/* ======== HERO ======== */}
          <section className="relative overflow-hidden pt-16" style={{ minHeight: '85vh' }} data-testid="directory-hero">
            <div className="absolute inset-0">
              <img src="/images/hero-directory.png" alt="Vibrant local business community" className="w-full h-full object-cover" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-midnight-900/80 via-midnight-900/50 to-midnight-900" />
            <div className="absolute inset-0 bg-gradient-to-r from-midnight-900/60 via-transparent to-midnight-900/60" />
            {/* Subtle grain overlay */}
            <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

            <div className="relative max-w-5xl mx-auto px-6 flex flex-col items-center justify-center" style={{ minHeight: '75vh' }}>
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/20 backdrop-blur-sm mb-6"
                style={{ background: 'rgba(201, 169, 110, 0.08)' }}>
                <span className="w-2 h-2 rounded-full bg-greenline animate-pulse" />
                <span className="text-xs font-medium text-white/80 tracking-widest font-heading uppercase">Live Directory</span>
                <span className="text-xs text-white/30">|</span>
                <span className="text-xs text-white/50">Trusted by local businesses</span>
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
                className="text-5xl sm:text-6xl lg:text-7xl font-heading font-light text-white text-center leading-[1.05] mb-5 tracking-tight"
                data-testid="directory-title">
                Your City&apos;s Best,{' '}
                <span className="font-semibold text-gradient-gold">Verified</span>
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.6 }}
                className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto text-center mb-10 leading-relaxed font-body">
                Find <span className="text-gold font-medium">trusted</span> home services, dining, nightlife, and more — every badge is earned through <span className="text-gold font-medium">real work</span>.
              </motion.p>

              {/* Search Bar — Glassmorphism */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.6 }} className="w-full max-w-2xl">
                <div className="flex flex-col sm:flex-row gap-3 p-2 rounded-2xl backdrop-blur-xl border border-white/10" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="flex-1 relative">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-silver" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input type="text" placeholder="Search businesses, trades, services..." value={search} onChange={e => setSearch(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      className="w-full pl-12 pr-4 py-4 rounded-xl text-sm bg-transparent text-white placeholder-white/30 focus:outline-none font-body"
                      data-testid="hero-search" />
                  </div>
                  <button onClick={handleSearch} className="btn-primary px-8 py-4 rounded-xl text-sm" data-testid="hero-search-btn">
                    Search Directory
                  </button>
                </div>

                <div className="flex flex-wrap justify-center gap-2 mt-5">
                  {CATEGORIES.slice(0, 5).map((cat, i) => (
                    <motion.button key={cat.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + i * 0.07 }}
                      onClick={() => handleCategoryClick(cat.id)}
                      className="px-4 py-1.5 rounded-full text-xs font-medium text-white/50 border border-white/10 hover:border-gold/40 hover:text-gold transition-all duration-300 backdrop-blur-sm font-body"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                      data-testid={`hero-chip-${cat.id}`}>
                      {cat.label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-midnight-900 to-transparent" />
          </section>

          {/* ======== CATEGORY MOSAIC ======== */}
          <section id="categories" className="max-w-7xl mx-auto px-6 py-20" data-testid="categories-section">
            <p className="text-xs font-heading font-semibold uppercase tracking-[0.2em] text-center mb-3 text-gold">Find Your Trade</p>
            <h2 className="text-3xl md:text-4xl font-heading font-light text-white text-center mb-3 tracking-tight">
              Browse <span className="font-semibold text-gradient-gold">Categories</span>
            </h2>
            <p className="text-silver text-center max-w-lg mx-auto mb-12 font-body">
              From local home services to your favorite neighborhood spots.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Large "Services" card */}
              <div className="col-span-2 row-span-2 relative rounded-2xl overflow-hidden cursor-pointer group hover:shadow-gold-glow transition-all duration-500"
                style={{ minHeight: 340 }} onClick={() => handleCategoryClick(CATEGORIES[2].id)} data-testid={`cat-${CATEGORIES[2].id}`}>
                <img src={CATEGORIES[2].img} alt={CATEGORIES[2].label} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                <div className="absolute inset-0 bg-gradient-to-t from-midnight-900/90 via-midnight-900/40 to-transparent group-hover:from-midnight-900/95 transition-all duration-500" />
                <div className="absolute bottom-5 left-5">
                  <span className="text-white text-2xl font-heading font-semibold block tracking-tight">{CATEGORIES[2].label}</span>
                  <span className="text-silver text-xs font-body">{CATEGORIES[2].sub}</span>
                </div>
                <span className="absolute top-3 right-3 text-[10px] px-2.5 py-1 rounded-full font-heading font-semibold uppercase tracking-wider" style={{ background: 'rgba(91, 138, 114, 0.9)', color: '#fff' }}>Core</span>
              </div>
              {[CATEGORIES[0], CATEGORIES[1]].map(cat => (
                <div key={cat.id} className="relative rounded-2xl overflow-hidden cursor-pointer group hover:shadow-gold-glow transition-all duration-500"
                  style={{ minHeight: 160 }} onClick={() => handleCategoryClick(cat.id)} data-testid={`cat-${cat.id}`}>
                  <img src={cat.img} alt={cat.label} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                  <div className="absolute inset-0 bg-gradient-to-t from-midnight-900/85 via-midnight-900/30 to-transparent group-hover:from-midnight-900/95 transition-all duration-500" />
                  <div className="absolute bottom-3 left-3">
                    <span className="text-white text-sm md:text-base font-heading font-semibold block">{cat.label}</span>
                    <span className="text-silver/70 text-[10px] hidden md:block font-body">{cat.sub}</span>
                  </div>
                </div>
              ))}
              {[CATEGORIES[3], CATEGORIES[4]].map(cat => (
                <div key={cat.id} className="relative rounded-2xl overflow-hidden cursor-pointer group hover:shadow-gold-glow transition-all duration-500"
                  style={{ minHeight: 160 }} onClick={() => handleCategoryClick(cat.id)} data-testid={`cat-${cat.id}`}>
                  <img src={cat.img} alt={cat.label} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                  <div className="absolute inset-0 bg-gradient-to-t from-midnight-900/85 via-midnight-900/30 to-transparent group-hover:from-midnight-900/95 transition-all duration-500" />
                  <div className="absolute bottom-3 left-3">
                    <span className="text-white text-sm md:text-base font-heading font-semibold block">{cat.label}</span>
                    <span className="text-silver/70 text-[10px] hidden md:block font-body">{cat.sub}</span>
                  </div>
                </div>
              ))}
              {[CATEGORIES[5], CATEGORIES[6]].map(cat => (
                <div key={cat.id} className="col-span-2 relative rounded-2xl overflow-hidden cursor-pointer group hover:shadow-gold-glow transition-all duration-500"
                  style={{ minHeight: 180 }} onClick={() => handleCategoryClick(cat.id)} data-testid={`cat-${cat.id}`}>
                  <img src={cat.img} alt={cat.label} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                  <div className="absolute inset-0 bg-gradient-to-t from-midnight-900/85 via-midnight-900/30 to-transparent group-hover:from-midnight-900/95 transition-all duration-500" />
                  <div className="absolute bottom-4 left-4">
                    <span className="text-white text-lg md:text-xl font-heading font-semibold block tracking-tight">{cat.label}</span>
                    <span className="text-silver/70 text-xs font-body">{cat.sub}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-10">
              <button onClick={() => loadListings()} className="btn-primary px-8 py-3 rounded-full text-sm" data-testid="all-categories-btn">
                All Categories
              </button>
            </div>
          </section>

          {/* ======== FEATURED LISTINGS — Sectioned ======== */}
          <section className="bg-charcoal-900 py-20" data-testid="featured-listings-section">
            <div className="max-w-7xl mx-auto px-6">
              <p className="text-xs font-heading font-semibold uppercase tracking-[0.2em] text-center mb-3 text-gold">Showcase</p>
              <h2 className="text-3xl md:text-4xl font-heading font-light text-white text-center mb-3 tracking-tight">
                Featured <span className="font-semibold text-gradient-gold">Listings</span>
              </h2>
              <p className="text-silver text-center max-w-lg mx-auto mb-12 font-body">
                Top-rated businesses handpicked for exceptional service and verified trust.
              </p>

              {featuredListings.length > 0 ? (
                <div className="space-y-16">
                  {/* Premier Partners — Large hero cards */}
                  {premierPartners.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-8 rounded-full bg-gold" />
                        <h3 className="text-lg font-heading font-semibold text-white tracking-tight">Premier Partners</h3>
                        <div className="flex-1 h-px bg-white/5" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {premierPartners.slice(0, 4).map((l, i) => <FeaturedCard key={l.id} listing={l} index={i} large />)}
                      </div>
                    </div>
                  )}

                  {/* Property Intelligence Verified — Dedicated row */}
                  {intelVerified.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-8 rounded-full bg-greenline" />
                        <h3 className="text-lg font-heading font-semibold text-white tracking-tight">Property Intelligence Verified</h3>
                        <PropertyIntelBadge size="sm" />
                        <div className="flex-1 h-px bg-white/5" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {intelVerified.slice(0, 6).map((l, i) => <FeaturedCard key={l.id} listing={l} index={i} />)}
                      </div>
                    </div>
                  )}

                  {/* Recently Added */}
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-1 h-8 rounded-full bg-silver" />
                      <h3 className="text-lg font-heading font-semibold text-white tracking-tight">Recently Added</h3>
                      <div className="flex-1 h-px bg-white/5" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {(recentlyAdded.length > 0 ? recentlyAdded : featuredListings).slice(0, 6).map((l, i) => (
                        <FeaturedCard key={l.id} listing={l} index={i} />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1,2,3].map(i => <div key={i} className="h-72 rounded-2xl bg-charcoal-800/50 animate-pulse" />)}
                </div>
              )}

              <div className="text-center mt-12">
                <button onClick={() => loadListings()} className="btn-primary px-8 py-3 rounded-full text-sm" data-testid="view-all-listings-btn">
                  View All Listings
                </button>
                <p className="text-silver/50 text-xs mt-3 font-body">Want your business featured? <Link href="/pricing" className="underline hover:text-gold transition text-gold/70">Upgrade your listing</Link></p>
              </div>
            </div>
          </section>

          {/* ======== VALUE PROPOSITION ======== */}
          <section className="bg-midnight-900 py-20" data-testid="value-prop-section">
            <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl font-heading font-light text-white mb-4 tracking-tight">A <span className="font-semibold text-gradient-gold">Trusted</span> Resource for Finding Local Pros</h2>
                <p className="text-silver mb-10 leading-relaxed font-body">
                  Whether you need emergency plumbing, a master electrician, or the best barber in town — our directory connects you with verified, accountable businesses.
                </p>
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'Verified Pros' },
                    { icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', label: 'Transparent Ratings' },
                    { icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', label: 'Easy Navigation' },
                    { icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z', label: 'Direct Contact' },
                  ].map(f => (
                    <div key={f.label} className="flex items-center gap-3 group/feat cursor-default">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover/feat:scale-110 transition-transform duration-300 glass-gold">
                        <svg className="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-white/80 group-hover/feat:text-gold transition-colors duration-300 font-body">{f.label}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => loadListings()} className="mt-10 btn-primary px-8 py-3 rounded-full text-sm" data-testid="find-business-btn">
                  Find a Business
                </button>
              </div>
              <div className="relative rounded-2xl overflow-hidden border border-white/5" style={{ minHeight: 350 }}>
                <img src="/images/hero-directory-alt.png" alt="Trusted local businesses" className="w-full h-full object-cover rounded-2xl" />
              </div>
            </div>
          </section>

          {/* ======== TESTIMONIALS ======== */}
          <section id="testimonials" className="relative py-20 overflow-hidden" data-testid="testimonials-section">
            <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'url(/images/hero-directory-alt.png)', backgroundSize: 'cover' }} />
            <div className="absolute inset-0 bg-charcoal-900/95" />
            <div className="relative max-w-4xl mx-auto px-6 text-center">
              <h2 className="text-3xl font-heading font-light text-white mb-2 tracking-tight">
                Success <span className="font-semibold text-gradient-gold">Stories</span>
              </h2>
              <p className="text-silver mb-12 font-body">Hear from business owners and customers who found their perfect match.</p>

              <AnimatePresence mode="wait">
                <motion.div key={testimonialIdx} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.4 }}
                  className="rounded-2xl p-8 max-w-lg mx-auto border border-white/10 backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center text-xl font-heading font-semibold text-midnight-900" style={{ background: 'linear-gradient(135deg, #C9A96E, #E6D8B5)' }}>
                    {TESTIMONIALS[testimonialIdx].name[0]}
                  </div>
                  <h3 className="text-lg font-heading font-semibold text-white">{TESTIMONIALS[testimonialIdx].name}</h3>
                  <p className="text-sm text-silver mb-3 font-body">{TESTIMONIALS[testimonialIdx].role}</p>
                  <div className="flex justify-center mb-4"><Stars rating={TESTIMONIALS[testimonialIdx].rating} size={18} /></div>
                  <p className="text-sm text-white/60 leading-relaxed italic font-body">&ldquo;{TESTIMONIALS[testimonialIdx].text}&rdquo;</p>
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-center gap-2 mt-6">
                {TESTIMONIALS.map((_, i) => (
                  <button key={i} onClick={() => setTestimonialIdx(i)}
                    className={`w-2.5 h-2.5 rounded-full transition ${i === testimonialIdx ? 'scale-110 bg-gold' : 'opacity-40 bg-silver'}`}
                    data-testid={`testimonial-dot-${i}`} />
                ))}
              </div>
            </div>
          </section>
        </>
      ) : (
        /* ======== LISTINGS VIEW ======== */
        <div data-testid="listings-view">
          <section className="relative bg-midnight-950 pt-20 pb-10 overflow-hidden">
            {activeCategory && CATEGORIES.find(c => c.id === activeCategory) && (
              <div className="absolute inset-0 opacity-20">
                <img src={CATEGORIES.find(c => c.id === activeCategory)!.img} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-midnight-950/60 via-midnight-950/80 to-midnight-950" />

            <div className="relative max-w-7xl mx-auto px-6">
              <button onClick={() => setShowListings(false)} className="text-sm text-silver/50 hover:text-white mb-6 flex items-center gap-2 transition font-body" data-testid="back-to-explore-btn">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back to Directory
              </button>

              <h2 className="text-3xl md:text-4xl font-heading font-light text-white mb-2 tracking-tight">
                {activeCategory ? CATEGORIES.find(c => c.id === activeCategory)?.label || 'All Businesses' : 'All Businesses'}
              </h2>
              <p className="text-silver/50 text-sm mb-8 font-body">
                {activeCategory ? CATEGORIES.find(c => c.id === activeCategory)?.sub : 'Browse verified businesses across all categories'}
              </p>

              {/* Search + Mega-Menu Filters */}
              <div ref={dropdownRef} className="rounded-2xl p-4 backdrop-blur-xl border border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="flex flex-col sm:flex-row gap-3 mb-3">
                  <div className="flex-1 relative">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-silver" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input type="text" placeholder="Search businesses, trades, services..." value={search} onChange={e => setSearch(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      className="w-full pl-11 pr-4 py-3 rounded-xl text-sm bg-white/5 text-white placeholder-white/25 border border-white/10 focus:outline-none focus:border-gold/30 font-body" data-testid="list-search" />
                  </div>
                  <button onClick={handleSearch} className="btn-primary px-8 py-3 rounded-xl text-sm">Search</button>
                </div>

                {/* Filter row — Mega-menu dropdowns + Price toggles */}
                <div className="flex flex-wrap gap-3 items-center">
                  {/* Category Mega-Menu */}
                  <div className="relative">
                    <button onClick={() => { setCategoryDropdownOpen(!categoryDropdownOpen); setSpecialtyDropdownOpen(false); }}
                      className="px-4 py-2 rounded-xl text-xs font-medium text-white/60 border border-white/10 hover:border-gold/30 transition flex items-center gap-2 font-body"
                      style={{ background: 'rgba(255,255,255,0.04)' }} data-testid="filter-category">
                      <svg className="w-3.5 h-3.5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" /></svg>
                      {activeCategory ? CATEGORIES.find(c => c.id === activeCategory)?.label : 'All Categories'}
                      <svg className={`w-3 h-3 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    <AnimatePresence>
                      {categoryDropdownOpen && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
                          className="absolute top-full left-0 mt-2 w-72 rounded-2xl border border-white/10 backdrop-blur-2xl shadow-glass z-50 overflow-hidden"
                          style={{ background: 'rgba(28, 28, 30, 0.95)' }}>
                          <div className="p-2">
                            <button onClick={() => { setActiveCategory(''); loadListings(); setCategoryDropdownOpen(false); }}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition font-body ${!activeCategory ? 'bg-gold/10 text-gold' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                              All Categories
                              {!activeCategory && <svg className="w-4 h-4 ml-auto text-greenline" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>}
                            </button>
                            {CATEGORIES.map(cat => (
                              <button key={cat.id} onClick={() => { setActiveCategory(cat.id); loadListings(cat.id); setCategoryDropdownOpen(false); }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition font-body ${activeCategory === cat.id ? 'bg-gold/10 text-gold' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={cat.icon} /></svg>
                                {cat.label}
                                {activeCategory === cat.id && <svg className="w-4 h-4 ml-auto text-greenline" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Specialty Mega-Menu */}
                  <div className="relative">
                    <button onClick={() => { setSpecialtyDropdownOpen(!specialtyDropdownOpen); setCategoryDropdownOpen(false); }}
                      className="px-4 py-2 rounded-xl text-xs font-medium text-white/60 border border-white/10 hover:border-gold/30 transition flex items-center gap-2 font-body"
                      style={{ background: 'rgba(255,255,255,0.04)' }} data-testid="filter-specialty">
                      <svg className="w-3.5 h-3.5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                      {specialty}
                      <svg className={`w-3 h-3 transition-transform ${specialtyDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    <AnimatePresence>
                      {specialtyDropdownOpen && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
                          className="absolute top-full left-0 mt-2 w-56 rounded-2xl border border-white/10 backdrop-blur-2xl shadow-glass z-50 overflow-hidden"
                          style={{ background: 'rgba(28, 28, 30, 0.95)' }}>
                          <div className="p-2">
                            {FILTER_SPECIALTIES.map(s => (
                              <button key={s} onClick={() => { setSpecialty(s); setSpecialtyDropdownOpen(false); }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition font-body ${specialty === s ? 'bg-gold/10 text-gold' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
                                {s}
                                {specialty === s && <svg className="w-4 h-4 ml-auto text-greenline" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Price Range — Toggle Buttons */}
                  <div className="flex rounded-xl border border-white/10 overflow-hidden" data-testid="filter-price">
                    {['All', '$', '$$', '$$$'].map(p => (
                      <button key={p} onClick={() => setPriceRange(p)}
                        className={`px-3 py-2 text-xs font-medium transition font-body ${priceRange === p ? 'bg-gold/15 text-gold border-gold/30' : 'text-white/40 hover:text-white/60 hover:bg-white/5'}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Listing Results */}
          <section className="max-w-7xl mx-auto px-6 py-10">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-64 rounded-2xl animate-pulse bg-charcoal-800/30" />)}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-16" data-testid="no-results">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center glass-gold">
                <svg className="w-12 h-12 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-2xl font-heading font-light text-white mb-3">{search ? 'No results found' : 'Be the first in this category'}</h3>
              <p className="text-sm text-silver max-w-md mx-auto mb-8 font-body">
                {search ? `No businesses matched "${search}". Try a different search term.` : 'This category is waiting for its first verified business.'}
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link href="/register-business" className="btn-primary px-6 py-3 rounded-xl text-sm" data-testid="register-from-empty">Add Your Business</Link>
                <button onClick={() => { setSearch(''); setActiveCategory(''); loadListings(); }} className="btn-ghost px-6 py-3 rounded-xl text-sm">Browse All</button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {listings.map((l, i) => <ListingCard key={l.id} listing={l} index={i} />)}
            </div>
          )}
          </section>
        </div>
      )}
    </div>
  );
}

function FeaturedCard({ listing: l, index: i, large }: { listing: Listing; index: number; large?: boolean }) {
  const hasIntel = l.has_property_intelligence;
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
      className={`relative rounded-2xl overflow-hidden border transition-all duration-500 group cursor-pointer ${hasIntel ? 'border-greenline/30 shadow-intel-glow hover:border-greenline/50' : 'border-white/5 hover:border-gold/30 hover:shadow-gold-glow'}`}
      style={{ background: 'rgba(255,255,255,0.03)' }}
      data-testid={`featured-${l.slug}`}>
      {/* Tier Badge */}
      {l.tier !== 'free' && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-heading font-semibold uppercase tracking-wider text-midnight-900"
          style={{ background: l.tier === 'premium' ? 'linear-gradient(135deg, #C9A96E, #E6D8B5)' : 'linear-gradient(135deg, #A8A9AD, #C0C0C0)' }}>
          {l.tier === 'premium' ? 'Premier' : 'Pro'}
        </div>
      )}
      {hasIntel && (
        <div className="absolute top-3 right-3 z-10"><PropertyIntelBadge /></div>
      )}

      {/* Cover Image */}
      <div className={`relative overflow-hidden ${large ? 'h-56' : 'h-44'}`}>
        {l.cover_image_url || l.logo_url ? (
          <img src={l.cover_image_url || l.logo_url!} alt={l.business_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-midnight-800 to-charcoal-800">
            <span className="text-5xl font-heading font-light text-white/10">{l.business_name[0]}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900 via-transparent to-transparent" />
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-heading font-semibold text-white truncate">{l.business_name}</h3>
            <p className="text-xs text-silver/60 capitalize font-body">{l.industry.replace(/-/g, ' ')}</p>
          </div>
          {l.avg_feedback_rating > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ml-2 flex-shrink-0"
              style={{ background: 'rgba(201, 169, 110, 0.15)', color: '#C9A96E' }}>
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
              {l.avg_feedback_rating.toFixed(1)}
            </div>
          )}
        </div>

        {l.city && (
          <p className="text-[11px] text-silver/50 flex items-center gap-1 mb-2 font-body">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {l.city}, {l.state}
          </p>
        )}
        {l.description && <p className="text-xs text-white/40 line-clamp-2 mb-4 font-body">{l.description}</p>}

        <div className="flex items-center gap-2">
          <button className="btn-ghost flex-1 text-xs px-4 py-2 rounded-full" data-testid={`featured-view-${l.slug}`}>View Profile</button>
          {l.phone && (
            <a href={`tel:${l.phone}`} className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center hover:border-gold/40 transition" data-testid={`featured-call-${l.slug}`}>
              <svg className="w-4 h-4 text-silver" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ListingCard({ listing: l, index: i }: { listing: Listing; index: number }) {
  const hasIntel = l.has_property_intelligence;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
      className={`rounded-2xl overflow-hidden border transition-all duration-500 group cursor-pointer ${hasIntel ? 'border-greenline/20 shadow-intel-glow hover:border-greenline/40' : 'border-white/5 hover:border-gold/20 hover:shadow-gold-glow'}`}
      style={{ background: 'rgba(255,255,255,0.02)' }}
      data-testid={`listing-${l.slug}`}>
      <div className="relative h-40 overflow-hidden">
        {l.cover_image_url || l.logo_url ? (
          <img src={l.cover_image_url || l.logo_url!} alt={l.business_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-midnight-800 to-charcoal-800">
            <span className="text-4xl font-heading font-light text-white/10">{l.business_name[0]}</span>
          </div>
        )}
        <span className="absolute top-3 left-3 text-[10px] px-2 py-1 rounded-full backdrop-blur-sm capitalize font-body" style={{ background: 'rgba(13, 27, 42, 0.7)', color: 'rgba(255,255,255,0.6)' }}>{l.industry.replace(/-/g, ' ')}</span>
        {hasIntel && <div className="absolute top-3 right-3"><PropertyIntelBadge /></div>}
      </div>
      <div className="p-4">
        <h3 className="font-heading font-semibold text-sm truncate mb-1 text-gold">{l.business_name}</h3>
        {l.city && <p className="text-[11px] text-silver/50 flex items-center gap-1 mb-1 font-body">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          {l.city}, {l.state}
        </p>}
        {l.description && <p className="text-xs text-white/35 line-clamp-2 mb-3 font-body">{l.description}</p>}
        <div className="flex items-center justify-between">
          <button className="btn-ghost text-xs px-3 py-1.5 rounded-full" data-testid={`view-details-${l.slug}`}>View Details</button>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(201, 169, 110, 0.12)', color: '#C9A96E' }}>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
            {l.avg_feedback_rating > 0 ? `${l.avg_feedback_rating.toFixed(1)}` : 'New'}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

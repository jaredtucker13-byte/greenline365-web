'use client';

/**
 * GL365 Directory — "Bentley Standard" with Subcategory Browse
 * 9 top-level categories, each with subcategory pill-tab filtering.
 * Listings grouped by subcategory, featured/weighted to top.
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
  directory_badges: { id: string; badge_type: string; badge_label: string; badge_color: string }[];
  distance?: number | null;
  metadata?: Record<string, any>;
}

// ─── Category & Subcategory Map ────────────────────────────────────
const CATEGORIES = [
  { id: 'services', label: 'Services', sub: 'HVAC, Plumbing, Electrical & More', img: '/images/categories/services.png',
    subcategories: ['All', 'HVAC', 'Plumbing', 'Electrical', 'Roofing', 'General Contractors', 'Landscaping', 'Pest Control', 'Cleaning'] },
  { id: 'dining', label: 'Dining', sub: 'Cafes, casual & fine dining', img: '/images/categories/dining.png',
    subcategories: ['All', 'Fine Dining', 'Casual', 'Cafes & Bakeries', 'Food Trucks', 'Seafood'] },
  { id: 'health-wellness', label: 'Health & Wellness', sub: 'Dental, clinics, gyms & spas', img: '/images/categories/health-wellness.png',
    subcategories: ['All', 'Dental Offices', 'Medical Clinics', 'Gyms & Fitness', 'Spas', 'Mental Health', 'Chiropractic'] },
  { id: 'style-shopping', label: 'Style & Shopping', sub: 'Boutiques, salons & retail', img: '/images/categories/style-shopping.png',
    subcategories: ['All', 'Barbershops', 'Hair Salons', 'Boutiques', 'Jewelry', 'Specialty Retail'] },
  { id: 'nightlife', label: 'Nightlife', sub: 'Bars, clubs & live music', img: '/images/categories/nightlife.png',
    subcategories: ['All', 'Bars & Pubs', 'Clubs', 'Cigar Lounges', 'Wine Bars', 'Live Music'] },
  { id: 'family-entertainment', label: 'Family Entertainment', sub: 'Theme parks, racing & fun', img: '/images/categories/family-entertainment.png',
    subcategories: ['All', 'Theme Parks', 'Bowling', 'Mini-Golf', 'Go-Karts & Racing', 'Arcades', 'Water Parks', 'Movie Theaters'] },
  { id: 'destinations', label: 'Destinations', sub: 'Tourist attractions & experiences', img: 'https://static.prod-images.emergentagent.com/jobs/b5fc704f-5976-4877-a35c-beeb0ec1a989/images/29e93c3535729786b87cb3a6b9e6704d67060ce6c3c8e63eb2c2645463cc9cb1.png',
    subcategories: ['All', 'Museums', 'Parks', 'Tourist Attractions', 'Beaches', 'Historic Sites', 'Nature Trails'] },
  { id: 'hotels-lodging', label: 'Hotels & Lodging', sub: 'Hotels, resorts & vacation rentals', img: '/images/categories/destinations.png',
    subcategories: ['All', 'Hotels', 'Resorts', 'Vacation Rentals', 'B&Bs'] },
  { id: 'professional-services', label: 'Professional Services', sub: 'Lawyers, accountants & advisors', img: 'https://static.prod-images.emergentagent.com/jobs/b5fc704f-5976-4877-a35c-beeb0ec1a989/images/2c684194c3673f42b840849471a761dd0f4fcbb3004807729e893f5dc2dc9dab.png',
    subcategories: ['All', 'Lawyers', 'Accountants', 'Insurance', 'Real Estate', 'Financial Advisors', 'Marketing Agencies'] },
];

const TESTIMONIALS = [
  { name: 'Marcus Johnson', role: 'HVAC Business Owner', rating: 5, text: 'Since listing on GL365, our bookings increased 40%. The verified badge gives customers instant trust — they know we\'re the real deal.' },
  { name: 'Sarah Chen', role: 'Homeowner, Tampa FL', rating: 5, text: 'I found a certified plumber through the directory in minutes. The trust scores showed me exactly who to call.' },
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

function PropertyIntelBadge() {
  return (
    <span className="inline-flex items-center gap-1 font-semibold rounded-full px-2 py-0.5 text-[10px] badge-shimmer"
      style={{ background: 'linear-gradient(135deg, #5B8A72, #7BAF95, #5B8A72)', backgroundSize: '200% auto', color: '#fff' }}
      data-testid="property-intel-badge">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
      Property Intelligence
    </span>
  );
}

// ─── Main Component ────────────────────────────────────────────────
export default function DirectoryPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [activeSubcategory, setActiveSubcategory] = useState('All');
  const [showListings, setShowListings] = useState(false);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [stats, setStats] = useState({ totalBusinesses: 0, totalDestinations: 0, totalCategories: 0 });
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationCity, setLocationCity] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'nearest' | 'highest' | 'lowest' | 'most-reviews'>('nearest');
  const [maxDistance, setMaxDistance] = useState<number>(0);

  // Restore state from URL on mount (breadcrumb support)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category');
    const q = params.get('q');
    if (cat) {
      setActiveCategory(cat);
      setShowListings(true);
    }
    if (q) setSearch(q);
  }, []);

  // Persist category/search to URL when they change (without full navigation)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (activeCategory) params.set('category', activeCategory);
    if (search) params.set('q', search);
    const newUrl = params.toString() ? `/?${params.toString()}` : '/';
    window.history.replaceState({}, '', newUrl);
  }, [activeCategory, search]);

  // Request geolocation on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, []);

  const loadListings = useCallback(async (industry?: string, searchText?: string) => {
    setLoading(true);
    setShowListings(true);
    setActiveSubcategory('All');
    const params = new URLSearchParams({ limit: '200' });
    if (industry) params.set('industry', industry);
    if (searchText) params.set('search', searchText);
    if (cityFilter) params.set('city', cityFilter);
    if (userLocation && !cityFilter) {
      params.set('lat', String(userLocation.lat));
      params.set('lng', String(userLocation.lng));
    }
    const res = await fetch(`/api/directory?${params}`);
    const data = await res.json();
    const items = Array.isArray(data) ? data : [];
    setListings(items);
    // Extract unique cities for the filter
    const cities = [...new Set(items.map((l: Listing) => l.city).filter(Boolean))] as string[];
    setAvailableCities(cities.sort());
    setLoading(false);
  }, [userLocation, cityFilter]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/directory?limit=12');
        const data = await res.json();
        setFeaturedListings(Array.isArray(data) ? data : []);
      } catch { setFeaturedListings([]); }
    })();
    (async () => {
      try {
        const res = await fetch('/api/directory/stats');
        const data = await res.json();
        setStats(data);
      } catch {}
    })();
  }, []);

  function handleCategoryClick(id: string) {
    setActiveCategory(id);
    // Map category IDs to the industry slugs used in the database
    const industryMap: Record<string, string> = {
      'services': 'services',
      'dining': 'dining',
      'health-wellness': 'health-wellness',
      'style-shopping': 'style-shopping',
      'nightlife': 'nightlife',
      'family-entertainment': 'family-entertainment',
      'destinations': 'destinations',
      'hotels-lodging': 'destinations', // shares data for now
      'professional-services': 'services', // shares data for now
    };
    loadListings(industryMap[id] || id);
  }

  function handleSearch() {
    loadListings(activeCategory || undefined, search || undefined);
  }

  useEffect(() => {
    const t = setInterval(() => setTestimonialIdx(i => (i + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(t);
  }, []);

  const currentCat = CATEGORIES.find(c => c.id === activeCategory);
  const subcategories = currentCat?.subcategories || ['All'];

  // Filter listings by subcategory (simple keyword match on business_name, description, industry)
  const filteredListings = (() => {
    // Step 1: Subcategory filter
    let result = activeSubcategory === 'All'
      ? listings
      : listings.filter(l => {
          const sub = activeSubcategory.toLowerCase();
          const name = (l.business_name || '').toLowerCase();
          const desc = (l.description || '').toLowerCase();
          const ind = (l.industry || '').toLowerCase();
          const subs = (l.subcategories || []).map(s => s.toLowerCase());
          return name.includes(sub) || desc.includes(sub) || ind.includes(sub) || subs.some(s => s.includes(sub));
        });

    // Step 2: Distance radius filter
    if (maxDistance > 0 && userLocation) {
      result = result.filter(l => l.distance != null && l.distance <= maxDistance);
    }

    // Step 3: Sort
    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'highest':
          return (b.avg_feedback_rating || b.metadata?.google_rating || 0) - (a.avg_feedback_rating || a.metadata?.google_rating || 0);
        case 'lowest':
          return (a.avg_feedback_rating || a.metadata?.google_rating || 0) - (b.avg_feedback_rating || b.metadata?.google_rating || 0);
        case 'most-reviews':
          return (b.metadata?.google_review_count || b.total_feedback_count || 0) - (a.metadata?.google_review_count || a.total_feedback_count || 0);
        case 'nearest':
        default:
          if (a.distance != null && b.distance != null) return a.distance - b.distance;
          if (a.distance != null) return -1;
          if (b.distance != null) return 1;
          return 0;
      }
    });
  })();

  // Section featured listings into tiers
  const premierPartners = featuredListings.filter(l => l.tier === 'premium' || l.has_property_intelligence);
  const recentListings = featuredListings.filter(l => !l.has_property_intelligence || l.tier === 'free');

  return (
    <div className="min-h-screen bg-midnight-900" data-testid="directory-page">
      {!showListings ? (
        <>
          {/* ─── HERO ─── */}
          <section className="relative overflow-hidden pt-16" style={{ minHeight: '85vh' }} data-testid="directory-hero">
            <div className="absolute inset-0">
              <img src="/images/hero-directory.png" alt="GreenLine365 business directory — discover local businesses across dining, services, nightlife and more" className="w-full h-full object-cover" />
            </div>
            {/* Darkened overlays for text legibility (WCAG fix) */}
            <div className="absolute inset-0 bg-gradient-to-b from-midnight-900/95 via-midnight-900/85 to-midnight-900" />
            <div className="absolute inset-0 bg-midnight-900/40" />

            <div className="relative max-w-5xl mx-auto px-6 flex flex-col items-center justify-center" style={{ minHeight: '75vh' }}>
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/30 backdrop-blur-sm mb-8"
                style={{ background: 'rgba(201, 169, 110, 0.12)' }}>
                <span className="w-2 h-2 rounded-full bg-greenline animate-pulse" />
                <span className="text-xs font-semibold text-gold/90 tracking-widest font-heading uppercase">Live Directory</span>
              </motion.div>

              {/* Benefit-focused headline */}
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-heading font-light text-white text-center leading-[1.15] mb-6 tracking-tight"
                data-testid="directory-title">
                Find <span className="font-semibold text-gradient-gold">Verified Local Pros</span>
                <br className="hidden sm:block" />
                <span className="text-white/90"> You Can Actually Trust</span>
              </motion.h1>

              {/* Value prop - now prominent */}
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                className="text-base md:text-lg text-white/80 max-w-2xl mx-auto text-center mb-10 leading-relaxed font-body">
                Every business in our directory is real, verified, and accountable. We reject listings that don't meet the standard — so you don't have to guess.
              </motion.p>

              {/* Search Bar — clear primary CTA */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="w-full max-w-2xl">
                <div className="flex flex-col sm:flex-row gap-3 p-2 rounded-2xl backdrop-blur-xl border border-white/15" style={{ background: 'rgba(255,255,255,0.10)' }}>
                  <div className="flex-1 relative">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input type="text" placeholder="Search businesses, trades, services..." value={search} onChange={e => setSearch(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      className="w-full pl-12 pr-4 py-4 rounded-xl text-sm bg-transparent text-white placeholder-white/50 focus:outline-none font-body"
                      data-testid="hero-search" />
                  </div>
                  <button onClick={handleSearch}
                    className="px-10 py-4 rounded-xl text-sm font-bold font-heading tracking-wide text-midnight-900 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #C9A96E 0%, #E6D8B5 50%, #C9A96E 100%)', boxShadow: '0 0 30px rgba(201,169,110,0.6), 0 4px 16px rgba(0,0,0,0.4)' }}
                    data-testid="hero-search-btn">
                    Search Directory
                  </button>
                </div>
                <div className="flex flex-wrap justify-center gap-2 mt-5">
                  {CATEGORIES.slice(0, 6).map((cat, i) => (
                    <motion.button key={cat.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + i * 0.06 }}
                      onClick={() => handleCategoryClick(cat.id)}
                      className="px-4 py-1.5 rounded-full text-xs font-medium text-white/70 border border-white/20 hover:border-gold/50 hover:text-gold hover:bg-gold/5 transition-all duration-300 backdrop-blur-sm font-body"
                      data-testid={`hero-chip-${cat.id}`}>
                      {cat.label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* ─── TRUST COUNTER BAR (larger, higher contrast) ─── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                className="mt-14 flex items-center gap-8 sm:gap-12 px-8 py-5 rounded-2xl border border-white/10 backdrop-blur-sm"
                style={{ background: 'rgba(255,255,255,0.05)' }}
                data-testid="trust-counter-bar"
              >
                {[
                  { value: stats.totalBusinesses, label: 'Verified Businesses', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
                  { value: stats.totalDestinations, label: 'Destinations', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
                  { value: stats.totalCategories, label: 'Categories', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
                ].map((stat, i) => (
                  <div key={stat.label} className="flex items-center gap-3 group" data-testid={`trust-stat-${i}`}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-gold/30 bg-gold/10">
                      <svg className="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                      </svg>
                    </div>
                    <div>
                      <span className="block text-2xl font-heading font-bold text-white">{stat.value > 0 ? `${stat.value}+` : '...'}</span>
                      <span className="block text-xs text-white/60 uppercase tracking-wider font-heading">{stat.label}</span>
                    </div>
                    {i < 2 && <div className="hidden sm:block w-px h-10 bg-white/15 ml-4 sm:ml-6" />}
                  </div>
                ))}
              </motion.div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-midnight-900 to-transparent" />
          </section>

          {/* ─── BROWSE BY CATEGORY ─── */}
          <section id="categories" className="max-w-7xl mx-auto px-6 py-20" data-testid="categories-section">
            <p className="text-xs font-heading font-semibold uppercase tracking-[0.2em] text-center mb-3 text-gold">Browse By Category</p>
            <h2 className="text-3xl md:text-4xl font-heading font-light text-white text-center mb-3 tracking-tight">
              Explore <span className="font-semibold text-gradient-gold">Categories</span>
            </h2>
            <p className="text-white/50 text-center max-w-lg mx-auto mb-12 font-body">From home services to nightlife — find exactly what you need.</p>

            {/* 9-Category Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {CATEGORIES.map((cat, i) => (
                <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className={`relative rounded-2xl overflow-hidden cursor-pointer group hover:shadow-gold-glow transition-all duration-500 ${i === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
                  style={{ minHeight: i === 0 ? 320 : 180 }}
                  onClick={() => handleCategoryClick(cat.id)} data-testid={`cat-${cat.id}`}>
                  <img src={cat.img} alt={`${cat.label} — ${cat.sub}`} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-midnight-900/90 via-midnight-900/40 to-transparent group-hover:from-midnight-900/95 transition-all duration-500" />
                  <div className="absolute bottom-4 left-4">
                    <span className={`text-white font-heading font-semibold block tracking-tight ${i === 0 ? 'text-2xl' : 'text-base'}`}>{cat.label}</span>
                    <span className="text-silver/70 text-xs font-body">{cat.sub}</span>
                  </div>
                  {i === 0 && <span className="absolute top-3 right-3 text-[10px] px-2.5 py-1 rounded-full font-heading font-semibold uppercase tracking-wider" style={{ background: 'rgba(91,138,114,0.9)', color: '#fff' }}>Core</span>}
                </motion.div>
              ))}
            </div>
          </section>

          {/* ─── FEATURED LISTINGS ─── */}
          <section className="bg-charcoal-900 py-20" data-testid="featured-listings-section">
            <div className="max-w-7xl mx-auto px-6">
              <p className="text-xs font-heading font-semibold uppercase tracking-[0.2em] text-center mb-3 text-gold">Showcase</p>
              <h2 className="text-3xl md:text-4xl font-heading font-light text-white text-center mb-3 tracking-tight">
                Featured <span className="font-semibold text-gradient-gold">Listings</span>
              </h2>
              <p className="text-white/50 text-center max-w-lg mx-auto mb-12 font-body">Top-rated businesses handpicked for exceptional service.</p>

              {featuredListings.length > 0 ? (
                <div className="space-y-14">
                  {premierPartners.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-8 rounded-full bg-gold" />
                        <h3 className="text-lg font-heading font-semibold text-white">Premier Partners</h3>
                        <div className="flex-1 h-px bg-white/5" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {premierPartners.slice(0, 4).map((l, i) => <ListingCard key={l.id} listing={l} index={i} />)}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-1 h-8 rounded-full bg-silver" />
                      <h3 className="text-lg font-heading font-semibold text-white">Recently Added</h3>
                      <div className="flex-1 h-px bg-white/5" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {(recentListings.length > 0 ? recentListings : featuredListings).slice(0, 6).map((l, i) => <ListingCard key={l.id} listing={l} index={i} />)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1,2,3].map(i => <div key={i} className="h-72 rounded-2xl bg-charcoal-800/50 animate-pulse" />)}
                </div>
              )}

              <div className="text-center mt-12">
                <button onClick={() => loadListings()} className="btn-primary px-8 py-3 rounded-full text-sm" data-testid="view-all-listings-btn">View All Listings</button>
                <p className="text-silver/50 text-xs mt-3 font-body">Want your business featured? <Link href="/register-business" className="underline hover:text-gold transition text-gold/70">Upgrade your listing</Link></p>
              </div>
            </div>
          </section>

          {/* ─── DESTINATION GUIDES — BENTLEY STANDARD 8-CARD GRID ─── */}
          <section className="section-gradient-blue-gold py-24 bg-gold-accent-top" data-testid="destination-guides-section">
            {/* Section Divider Top */}
            <div className="section-divider-gold max-w-5xl mx-auto mb-16" />

            <div className="max-w-7xl mx-auto px-6">
              {/* Section Header */}
              <div className="text-center mb-14 corner-filigree py-8 px-4">
                <p className="text-xs font-heading font-semibold uppercase tracking-[0.25em] mb-4 text-gold/70">Curated Travel Guides</p>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-light text-white tracking-tight mb-4">
                  Explore <span className="font-semibold text-gradient-gold">Destinations</span>
                </h2>
                <p className="text-sm text-white/50 max-w-lg mx-auto font-body leading-relaxed">
                  Your personal concierge to Florida&apos;s finest — where to stay, dine, explore, and unwind.
                </p>
              </div>

              {/* 8-Card Grid: 4 columns, 2 rows */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
                {[
                  { slug: 'st-pete-beach',  label: 'St. Pete Beach',  tagline: "Florida's Sunshine City",            image: 'https://static.prod-images.emergentagent.com/jobs/2e119e5c-5e48-4af9-82e4-b66cfaef75d6/images/9f172c3ec8da33810bf5add7045d45d50c2a74434222d8de43496ad9db498e6a.png' },
                  { slug: 'key-west',       label: 'Key West',         tagline: 'Close to Perfect, Far from Normal', image: 'https://static.prod-images.emergentagent.com/jobs/2e119e5c-5e48-4af9-82e4-b66cfaef75d6/images/b6b16b8cb4d3ffcf8519f33cf4b55a5bab86a4fe22034d203f002c4c56c417ae.png' },
                  { slug: 'sarasota',       label: 'Sarasota',         tagline: 'Where Arts Meet the Gulf',          image: 'https://static.prod-images.emergentagent.com/jobs/2e119e5c-5e48-4af9-82e4-b66cfaef75d6/images/bcf15606c765a234387200867704b62f95d72f13b52b57617bd1e1810147c927.png' },
                  { slug: 'daytona',        label: 'Daytona Beach',    tagline: "World's Most Famous Beach",         image: 'https://static.prod-images.emergentagent.com/jobs/2e119e5c-5e48-4af9-82e4-b66cfaef75d6/images/3b8b96e8031137b53c6837161306bded80db78b6f40ed95d30571e38c37eb6d9.png' },
                  { slug: 'ybor-city',      label: 'Ybor City',        tagline: "Tampa's Historic Latin Quarter",    image: 'https://static.prod-images.emergentagent.com/jobs/2e119e5c-5e48-4af9-82e4-b66cfaef75d6/images/c7604a02b5c81fa3394e0179f29ec3cccc68231efa06b8aacae7704b37277e97.png' },
                  { slug: 'orlando',        label: 'Orlando',          tagline: 'The City Beautiful',                image: 'https://static.prod-images.emergentagent.com/jobs/2e119e5c-5e48-4af9-82e4-b66cfaef75d6/images/5cc70d6507deeac4bf77f056c8f676e444f65bec8a857795608ebeaafd9af536.png' },
                  { slug: 'miami',          label: 'Miami',            tagline: 'Neon Nights & Coastal Luxury',      image: 'https://static.prod-images.emergentagent.com/jobs/2e119e5c-5e48-4af9-82e4-b66cfaef75d6/images/d771f9ed035f4fcd5df359e8bb0dd78ec2b6e5a9d6446dbd07377a903fa3945f.png' },
                  { slug: 'jacksonville',   label: 'Jacksonville',     tagline: 'Gridiron Grit & Riverfront Views',  image: 'https://static.prod-images.emergentagent.com/jobs/2e119e5c-5e48-4af9-82e4-b66cfaef75d6/images/3044a5e13c46207922e088bcb878b0ded80dcf0c9ca1d9c15c08586ac85cd2e3.png' },
                ].map((d, i) => (
                  <motion.div
                    key={d.slug}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.07, duration: 0.5 }}
                  >
                    <Link href={`/destination/${d.slug}`} className="block dest-card-frame group" data-testid={`dest-card-${d.slug}`}>
                      <div className="dest-card-inner">
                        {/* Image */}
                        <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
                          <img
                            src={d.image}
                            alt={`${d.label} destination guide — ${d.tagline}`}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            loading="lazy"
                          />
                        </div>
                        {/* Text Label Bar */}
                        <div className="dest-glass-label px-4 py-3">
                          <h3 className="text-sm sm:text-base font-heading font-bold text-white tracking-tight leading-tight">{d.label}</h3>
                          <p className="text-[10px] sm:text-xs text-gold/60 font-body mt-0.5">{d.tagline}</p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Section Divider Bottom */}
            <div className="section-divider-gold max-w-5xl mx-auto mt-16" />
          </section>

          {/* ─── VALUE PROPOSITION ─── */}
          <section className="bg-midnight-900 py-20" data-testid="value-prop-section">
            <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl font-heading font-light text-white mb-4 tracking-tight">A <span className="font-semibold text-gradient-gold">Trusted</span> Resource for Finding Local Pros</h2>
                <p className="text-white/55 mb-10 leading-relaxed font-body">Whether you need emergency plumbing, a master electrician, or the best barber in town — our directory connects you with verified, accountable businesses.</p>
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'Verified Pros' },
                    { icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', label: 'Transparent Ratings' },
                    { icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', label: 'Easy Navigation' },
                    { icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z', label: 'Direct Contact' },
                  ].map(f => (
                    <div key={f.label} className="flex items-center gap-3 group/feat cursor-default">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover/feat:scale-110 transition-transform duration-300 glass-gold">
                        <svg className="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={f.icon} /></svg>
                      </div>
                      <span className="text-sm font-medium text-white/80 group-hover/feat:text-gold transition-colors duration-300 font-body">{f.label}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => loadListings()} className="mt-10 btn-primary px-8 py-3 rounded-full text-sm" data-testid="find-business-btn">Find a Business</button>
              </div>
              <div className="relative">
                <img src="/images/hero-directory-alt.png" alt="GreenLine365 connects you with trusted, verified local businesses" className="w-full rounded-2xl object-cover" style={{ maxHeight: 400 }} />
              </div>
            </div>
          </section>

          {/* ─── TESTIMONIALS ─── */}
          <section className="relative py-20 overflow-hidden" data-testid="testimonials-section">
            <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'url(/images/hero-directory-alt.png)', backgroundSize: 'cover' }} />
            <div className="absolute inset-0 bg-charcoal-900/95" />
            <div className="relative max-w-4xl mx-auto px-6 text-center">
              <h2 className="text-3xl font-heading font-light text-white mb-2 tracking-tight">Success <span className="font-semibold text-gradient-gold">Stories</span></h2>
              <p className="text-white/50 mb-12 font-body">Hear from business owners and customers.</p>
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
                  <button key={i} onClick={() => setTestimonialIdx(i)} className={`w-2.5 h-2.5 rounded-full transition ${i === testimonialIdx ? 'scale-110 bg-gold' : 'opacity-40 bg-silver'}`} data-testid={`testimonial-dot-${i}`} />
                ))}
              </div>
            </div>
          </section>
        </>
      ) : (
        /* ─── CATEGORY BROWSE VIEW ─── */
        <div data-testid="listings-view">
          {/* Category Header */}
          <section className="relative bg-midnight-950 pt-20 pb-8 overflow-hidden">
            {currentCat && (
              <div className="absolute inset-0 opacity-20">
                <img src={currentCat.img} alt={`${currentCat.label} category background`} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-midnight-950/60 via-midnight-950/80 to-midnight-950" />

            <div className="relative max-w-7xl mx-auto px-6">
              <button onClick={() => { setShowListings(false); setActiveCategory(''); }} className="text-sm text-silver/50 hover:text-white mb-6 flex items-center gap-2 transition font-body" data-testid="back-to-explore-btn">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back to Directory
              </button>

              <h2 className="text-3xl md:text-4xl font-heading font-light text-white mb-2 tracking-tight">
                {currentCat?.label || 'All Businesses'}
              </h2>
              <p className="text-silver/50 text-sm mb-6 font-body">{currentCat?.sub || 'Browse verified businesses across all categories'}</p>

              {/* Search */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="flex-1 relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-silver" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input type="text" placeholder="Search within category..." value={search} onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-11 pr-4 py-3 rounded-xl text-sm bg-white/5 text-white placeholder-white/25 border border-white/10 focus:outline-none focus:border-gold/30 font-body" data-testid="list-search" />
                </div>
                <button onClick={handleSearch} className="btn-primary px-8 py-3 rounded-xl text-sm">Search</button>
              </div>

              {/* Filters Row — Location, Sort, Distance */}
              <div className="flex flex-wrap items-center gap-2 mb-4" data-testid="location-filter">
                {/* City filter */}
                <select
                  value={cityFilter}
                  onChange={e => { setCityFilter(e.target.value); }}
                  className="px-3 py-2 rounded-lg text-xs bg-white/5 text-white border border-white/10 focus:outline-none focus:border-gold/30 font-body appearance-none cursor-pointer"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23888\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: '28px' }}
                  data-testid="city-filter-select"
                >
                  <option value="">All Locations</option>
                  {availableCities.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                {/* Sort by */}
                <div className="flex items-center gap-1 border border-white/10 rounded-lg overflow-hidden" data-testid="sort-filter">
                  {[
                    { id: 'nearest' as const, label: 'Nearest', icon: true },
                    { id: 'highest' as const, label: 'Top Rated', icon: false },
                    { id: 'most-reviews' as const, label: 'Most Reviews', icon: false },
                  ].map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSortBy(s.id)}
                      className={`px-3 py-2 text-[11px] font-medium transition-all font-body ${
                        sortBy === s.id
                          ? 'bg-gold/15 text-gold'
                          : 'text-white/35 hover:text-white/55'
                      }`}
                      data-testid={`sort-${s.id}`}
                    >
                      {s.id === 'nearest' && userLocation && (
                        <svg className="w-3 h-3 inline mr-1 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                      )}
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Distance radius — only show when geolocation is active */}
                {userLocation && (
                  <select
                    value={maxDistance}
                    onChange={e => setMaxDistance(Number(e.target.value))}
                    className="px-3 py-2 rounded-lg text-xs bg-white/5 text-white border border-white/10 focus:outline-none focus:border-gold/30 font-body appearance-none cursor-pointer"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23888\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: '28px' }}
                    data-testid="distance-filter"
                  >
                    <option value={0}>Any Distance</option>
                    <option value={1}>Within 1 mile</option>
                    <option value={5}>Within 5 miles</option>
                    <option value={10}>Within 10 miles</option>
                    <option value={25}>Within 25 miles</option>
                    <option value={50}>Within 50 miles</option>
                  </select>
                )}

                {/* Active filter indicators */}
                {(cityFilter || maxDistance > 0) && (
                  <button
                    onClick={() => { setCityFilter(''); setMaxDistance(0); setSortBy('nearest'); }}
                    className="text-[10px] text-white/40 hover:text-gold transition font-body"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              {/* Subcategory Pill Tabs */}
              <div className="flex flex-wrap gap-2" data-testid="subcategory-tabs">
                {subcategories.map(sub => (
                  <button key={sub} onClick={() => setActiveSubcategory(sub)}
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 font-body ${
                      activeSubcategory === sub
                        ? 'bg-gold/15 text-gold border border-gold/30'
                        : 'text-white/40 border border-white/10 hover:text-white/70 hover:border-white/20'
                    }`}
                    data-testid={`subtab-${sub.toLowerCase().replace(/\s+/g, '-')}`}>
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Listing Results */}
          <section className="max-w-7xl mx-auto px-6 py-10">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-64 rounded-2xl animate-pulse bg-charcoal-800/30" />)}
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="text-center py-16" data-testid="no-results">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center glass-gold">
                  <svg className="w-12 h-12 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-heading font-light text-white mb-3">{search ? 'No results found' : 'Coming soon'}</h3>
                <p className="text-sm text-silver max-w-md mx-auto mb-8 font-body">
                  {search ? `No businesses matched "${search}".` : `No listings in "${activeSubcategory}" yet. Be the first!`}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Link href="/register-business" className="btn-primary px-6 py-3 rounded-xl text-sm" data-testid="register-from-empty">Add Your Business</Link>
                  <button onClick={() => setActiveSubcategory('All')} className="btn-ghost px-6 py-3 rounded-xl text-sm">Show All</button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-silver/40 text-xs mb-4 font-body">{filteredListings.length} businesses found</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {filteredListings.map((l, i) => <ListingCard key={l.id} listing={l} index={i} />)}
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

// ─── Listing Card ──────────────────────────────────────────────────
function ListingCard({ listing: l, index: i }: { listing: Listing; index: number }) {
  const hasIntel = l.has_property_intelligence;
  return (
    <Link href={`/listing/${l.slug}`}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
        className={`rounded-2xl overflow-hidden border transition-all duration-500 group cursor-pointer ${hasIntel ? 'border-greenline/20 shadow-intel-glow hover:border-greenline/40' : 'border-white/5 hover:border-gold/20 hover:shadow-gold-glow'}`}
        style={{ background: 'rgba(255,255,255,0.02)' }}
        data-testid={`listing-${l.slug}`}>
        <div className="relative h-40 overflow-hidden">
          {l.cover_image_url || l.logo_url ? (
            <img src={l.cover_image_url || l.logo_url!} alt={`${l.business_name} — ${l.industry.replace(/-/g, ' ')} in ${l.city || 'Florida'}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-midnight-800 to-charcoal-800">
              <span className="text-4xl font-heading font-light text-white/10">{l.business_name[0]}</span>
            </div>
          )}
          <span className="absolute top-3 left-3 text-[10px] px-2 py-1 rounded-full backdrop-blur-sm capitalize font-body" style={{ background: 'rgba(13,27,42,0.7)', color: 'rgba(255,255,255,0.6)' }}>{l.industry.replace(/-/g, ' ')}</span>
          {hasIntel && <div className="absolute top-3 right-3"><PropertyIntelBadge /></div>}
          {l.tier !== 'free' && !hasIntel && (
            <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full font-heading font-semibold uppercase tracking-wider text-midnight-900"
              style={{ background: l.tier === 'premium' ? 'linear-gradient(135deg, #C9A96E, #E6D8B5)' : 'linear-gradient(135deg, #A8A9AD, #C0C0C0)' }}>
              {l.tier === 'premium' ? 'Premier' : 'Pro'}
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-heading font-semibold text-sm truncate mb-1 text-gold">{l.business_name}</h3>
          {l.city && <p className="text-[11px] text-silver/50 flex items-center gap-1 mb-1 font-body">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {l.city}, {l.state}
            {l.distance != null && <span className="text-gold/60 ml-1">({l.distance} mi)</span>}
          </p>}
          {l.description && <p className="text-xs text-white/35 line-clamp-2 mb-3 font-body">{l.description}</p>}
          <div className="flex items-center justify-between">
            <span className="btn-ghost text-xs px-3 py-1.5 rounded-full" data-testid={`view-details-${l.slug}`}>View Details</span>
            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(201,169,110,0.12)', color: '#C9A96E' }}>
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
              {l.avg_feedback_rating > 0 ? l.avg_feedback_rating.toFixed(1) : 'New'}
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

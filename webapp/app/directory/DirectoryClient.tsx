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
  { id: 'hvac', label: 'HVAC', img: 'https://images.unsplash.com/photo-1758798157512-f0a864c696c9?w=600&h=400&fit=crop&q=80' },
  { id: 'plumbing', label: 'Plumbing', img: 'https://images.unsplash.com/photo-1542632867-261e4be41c7c?w=600&h=400&fit=crop&q=80' },
  { id: 'roofing', label: 'Roofing', img: 'https://images.unsplash.com/photo-1553169507-38833977274b?w=600&h=400&fit=crop&q=80' },
  { id: 'electrical', label: 'Electrical', img: 'https://images.unsplash.com/photo-1754620906571-9ba64bd3ffb4?w=600&h=400&fit=crop&q=80' },
  { id: 'barbershop', label: 'Barbers', img: 'https://images.unsplash.com/photo-1547648946-2b1fd7eab923?w=600&h=400&fit=crop&q=80' },
  { id: 'bakery', label: 'Bakeries', img: 'https://images.unsplash.com/photo-1571157577110-493b325fdd3d?w=600&h=400&fit=crop&q=80' },
  { id: 'gym', label: 'Fitness', img: 'https://images.unsplash.com/photo-1734189605012-f03d97a4d98f?w=600&h=400&fit=crop&q=80' },
  { id: 'restaurant', label: 'Dining', img: 'https://images.unsplash.com/photo-1767778080869-4b82b5924c3a?w=600&h=400&fit=crop&q=80' },
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
          <section className="relative bg-[#1a1a1a] overflow-hidden pt-20" data-testid="directory-hero">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1767778080869-4b82b5924c3a?w=1920&q=60)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
            <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a]/80 via-[#1a1a1a]/90 to-[#1a1a1a]" />
            <div className="relative max-w-4xl mx-auto px-6 py-20 text-center">
              <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#FF8C00' }}>Find Your Pro</p>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4" data-testid="directory-title">
                Services Without Borders
              </h1>
              <p className="text-base md:text-lg text-zinc-400 max-w-2xl mx-auto mb-10">
                From trusted HVAC techs to the best local bakeries. Every badge is earned through real service, never bought.
              </p>
              {/* Search Bar */}
              <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
                <input
                  type="text" placeholder="Search businesses, trades, names..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="flex-1 px-5 py-3.5 rounded-full text-sm bg-white/10 text-white placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-orange-500/50"
                  data-testid="hero-search"
                />
                <button onClick={handleSearch} className="px-8 py-3.5 rounded-full text-sm font-semibold text-black" style={{ background: '#FF8C00' }} data-testid="hero-search-btn">
                  Search
                </button>
              </div>
            </div>
          </section>

          {/* ======== CATEGORY MOSAIC ======== */}
          <section id="categories" className="max-w-7xl mx-auto px-6 py-16" data-testid="categories-section">
            <p className="text-sm font-semibold uppercase tracking-widest text-center mb-2" style={{ color: '#FF8C00' }}>Find Your Trade</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a1a] text-center mb-3">Browse Categories</h2>
            <p className="text-zinc-500 text-center max-w-lg mx-auto mb-10">
              From local home services to your favorite neighborhood spots. Your next trusted pro is just a click away.
            </p>

            {/* Mosaic Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {/* Large card */}
              <div
                className="col-span-2 row-span-2 relative rounded-2xl overflow-hidden cursor-pointer group"
                style={{ minHeight: 340 }}
                onClick={() => handleCategoryClick(CATEGORIES[0].id)}
                data-testid={`cat-${CATEGORIES[0].id}`}
              >
                <img src={CATEGORIES[0].img} alt={CATEGORIES[0].label} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <span className="absolute bottom-5 left-5 text-white text-2xl font-bold">{CATEGORIES[0].label}</span>
              </div>
              {/* Smaller cards */}
              {CATEGORIES.slice(1).map(cat => (
                <div
                  key={cat.id}
                  className="relative rounded-2xl overflow-hidden cursor-pointer group"
                  style={{ minHeight: 160 }}
                  onClick={() => handleCategoryClick(cat.id)}
                  data-testid={`cat-${cat.id}`}
                >
                  <img src={cat.img} alt={cat.label} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <span className="absolute bottom-3 left-3 text-white text-sm md:text-base font-bold">{cat.label}</span>
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
                <img src="https://images.unsplash.com/photo-1767778080869-4b82b5924c3a?w=700&q=75" alt="Trusted local businesses" className="w-full h-full object-cover rounded-2xl" />
              </div>
            </div>
          </section>

          {/* ======== TESTIMONIALS ======== */}
          <section id="testimonials" className="relative py-16 overflow-hidden" data-testid="testimonials-section">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1547648946-2b1fd7eab923?w=1920&q=40)', backgroundSize: 'cover' }} />
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
        <section className="max-w-7xl mx-auto px-6 py-8" data-testid="listings-view">
          {/* Search + Filters */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input type="text" placeholder="Search businesses..." value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="flex-1 px-4 py-3 rounded-lg text-sm border border-zinc-200 focus:outline-none focus:border-orange-400" data-testid="list-search" />
              <button onClick={handleSearch} className="px-6 py-3 rounded-lg text-sm font-semibold text-white" style={{ background: '#FF8C00' }}>Search</button>
            </div>
            {/* 3-Filter Row */}
            <div className="grid grid-cols-3 gap-3">
              <select value={specialty} onChange={e => setSpecialty(e.target.value)} className="px-3 py-2.5 rounded-lg text-sm border border-zinc-200 focus:outline-none" data-testid="filter-specialty">
                {FILTER_SPECIALTIES.map(s => <option key={s}>{s}</option>)}
              </select>
              <select value={activeCategory || 'All Categories'} onChange={e => { const v = e.target.value; setActiveCategory(v === 'All Categories' ? '' : v); loadListings(v === 'All Categories' ? undefined : v); }}
                className="px-3 py-2.5 rounded-lg text-sm border border-zinc-200 focus:outline-none" data-testid="filter-category">
                <option>All Categories</option>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              <select value={priceRange} onChange={e => setPriceRange(e.target.value)} className="px-3 py-2.5 rounded-lg text-sm border border-zinc-200 focus:outline-none" data-testid="filter-price">
                {FILTER_PRICE.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Back button */}
          <button onClick={() => setShowListings(false)} className="text-sm text-zinc-500 hover:text-zinc-800 mb-6 flex items-center gap-1" data-testid="back-to-explore-btn">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Explore
          </button>

          {/* Listing Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-64 rounded-2xl animate-pulse bg-zinc-100" />)}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-20" data-testid="no-results">
              <svg className="w-16 h-16 mx-auto mb-4 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              <h3 className="text-xl font-bold text-zinc-800 mb-2">No businesses found</h3>
              <p className="text-sm text-zinc-500">{search ? 'Try a different search term' : 'Be the first to add your business to the directory'}</p>
            </div>
          ) : (() => {
            const SECTION_MAP: Record<string, { label: string; color: string; industries: string[] }> = {
              services: { label: 'Home Services', color: '#39FF14', industries: ['electrical', 'plumbing', 'hvac'] },
              dining: { label: 'Dining & Food', color: '#FF8C00', industries: ['restaurant', 'bakery'] },
              style: { label: 'Style & Grooming', color: '#8B5CF6', industries: ['barbershop'] },
              fitness: { label: 'Fitness & Wellness', color: '#00D4FF', industries: ['gym', 'spa'] },
              professional: { label: 'Professional Services', color: '#EC4899', industries: ['general'] },
              retail: { label: 'Shopping & Retail', color: '#FFB800', industries: ['boutique'] },
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

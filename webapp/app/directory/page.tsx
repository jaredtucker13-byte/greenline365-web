'use client';

/**
 * GL365 Global Directory - Public Business Search
 * Zero-auth public page. Searchable by industry, city, zip.
 * Shows earned badges, ratings, and trust scores.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Listing {
  id: string;
  business_name: string;
  slug: string;
  industry: string;
  description?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  logo_url?: string;
  tier: string;
  trust_score: number;
  avg_feedback_rating: number;
  total_feedback_count: number;
  directory_badges: { id: string; badge_type: string; badge_label: string; badge_color: string; is_active: boolean }[];
}

const INDUSTRIES = [
  { value: 'all', label: 'All', icon: 'M4 6h16M4 12h16M4 18h16' },
  { value: 'hvac', label: 'HVAC', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { value: 'plumbing', label: 'Plumbing', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
  { value: 'roofing', label: 'Roofing', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { value: 'electrical', label: 'Electrical', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { value: 'barbershop', label: 'Barbers', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { value: 'restaurant', label: 'Restaurants', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z' },
  { value: 'gym', label: 'Gyms', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
];

const TIER_LABELS: Record<string, { label: string; color: string }> = {
  free: { label: '', color: '' },
  growth: { label: 'Growth', color: '#00D4FF' },
  authority: { label: 'Authority', color: '#8B5CF6' },
  dominator: { label: 'Dominator', color: '#FFB800' },
};

function StarDisplay({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} className="w-3.5 h-3.5" fill={s <= Math.round(rating) ? '#FFB800' : 'none'} stroke={s <= Math.round(rating) ? '#FFB800' : '#333'} viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
      <span className="text-xs text-zinc-500 ml-1">({count})</span>
    </div>
  );
}

export default function DirectoryPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('all');
  const [city, setCity] = useState('');

  useEffect(() => { loadListings(); }, [industry]);

  async function loadListings() {
    setLoading(true);
    const params = new URLSearchParams({ limit: '24' });
    if (industry !== 'all') params.set('industry', industry);
    if (search) params.set('search', search);
    if (city) params.set('city', city);

    const res = await fetch(`/api/directory?${params}`);
    const data = await res.json();
    setListings(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function handleSearch() { loadListings(); }

  return (
    <div className="min-h-screen" style={{ background: '#080808' }}>
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(57,255,20,0.06) 0%, transparent 60%)' }} />
        <div className="max-w-6xl mx-auto px-6 pt-12 pb-10 relative">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #39FF14, #0CE293)' }}>
              <span className="text-black font-bold text-sm">G</span>
            </div>
            <span className="text-white font-semibold">GreenLine<span style={{ color: '#39FF14' }}>365</span></span>
          </Link>

          <h1 className="text-3xl lg:text-5xl font-bold text-white mb-3" data-testid="directory-title">
            Find Trusted Pros
          </h1>
          <p className="text-base lg:text-lg text-zinc-400 mb-8 max-w-lg">
            Every badge is earned, never bought. Real service. Real accountability.
          </p>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text" placeholder="Search businesses..." value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                data-testid="directory-search"
              />
            </div>
            <input
              type="text" placeholder="City or ZIP" value={city}
              onChange={e => setCity(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="w-full sm:w-40 px-4 py-3 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              data-testid="directory-city"
            />
            <button onClick={handleSearch}
              className="px-6 py-3 rounded-xl text-sm font-medium text-black"
              style={{ background: 'linear-gradient(135deg, #39FF14, #0CE293)' }}
              data-testid="directory-search-btn"
            >Search</button>
          </div>
        </div>
      </div>

      {/* Industry Filters */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex gap-2 overflow-x-auto pb-4 -mx-1 px-1">
          {INDUSTRIES.map(ind => (
            <button key={ind.value} onClick={() => setIndustry(ind.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition ${industry === ind.value ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              style={industry === ind.value ? { background: 'rgba(57,255,20,0.1)', color: '#39FF14', border: '1px solid rgba(57,255,20,0.2)' } : { border: '1px solid rgba(255,255,255,0.06)' }}
              data-testid={`industry-${ind.value}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={ind.icon} /></svg>
              {ind.label}
            </button>
          ))}
        </div>
      </div>

      {/* Listings Grid */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-52 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />)}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 mx-auto mb-4 text-zinc-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            <h3 className="text-lg font-medium text-zinc-400 mb-2">No businesses found</h3>
            <p className="text-sm text-zinc-600">{search || city ? 'Try a different search' : 'Be the first to add your business'}</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map((listing, i) => {
              const tierInfo = TIER_LABELS[listing.tier];
              return (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="backdrop-blur-xl rounded-2xl border overflow-hidden transition hover:border-green-500/15 group cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
                  data-testid={`listing-${listing.slug}`}
                >
                  {/* Header */}
                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      {listing.logo_url ? (
                        <img src={listing.logo_url} alt="" className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(57,255,20,0.08)' }}>
                          <span className="text-lg font-bold" style={{ color: '#39FF14' }}>{listing.business_name[0]}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-white truncate">{listing.business_name}</h3>
                          {tierInfo.label && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: `${tierInfo.color}15`, color: tierInfo.color }}>
                              {tierInfo.label}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 capitalize">{listing.industry.replace('_', ' ')}</p>
                        {listing.city && <p className="text-[10px] text-zinc-600">{listing.city}, {listing.state}</p>}
                      </div>
                    </div>

                    {listing.description && (
                      <p className="text-xs text-zinc-500 line-clamp-2 mb-3">{listing.description}</p>
                    )}

                    {/* Badges */}
                    {listing.directory_badges.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {listing.directory_badges.map(badge => (
                          <span key={badge.id} className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"
                            style={{ background: `${badge.badge_color}15`, color: badge.badge_color, border: `1px solid ${badge.badge_color}30` }}>
                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            {badge.badge_label}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Rating */}
                    <StarDisplay rating={listing.avg_feedback_rating} count={listing.total_feedback_count} />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { CategoryMeta, CityMeta } from '@/lib/directory-config';
import { getPlaceholderImage } from '@/lib/directory-config';

interface Listing {
  id: string;
  business_name: string;
  slug: string;
  industry: string;
  subcategories: string[];
  description: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  cover_image_url: string | null;
  tier: string;
  is_claimed: boolean;
  avg_feedback_rating: number;
  total_feedback_count: number;
  tags: string[];
  metadata: Record<string, any>;
  directory_badges: { id: string; badge_type: string; badge_label: string; badge_color: string }[];
}

function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} width={size} height={size} fill={s <= Math.round(rating) ? '#C9A84C' : 'none'} stroke={s <= Math.round(rating) ? '#C9A84C' : '#555'} strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
    </div>
  );
}

export default function CityCategoryClient({
  category, city, allCities, allCategories,
}: {
  category: CategoryMeta;
  city: CityMeta;
  allCities: CityMeta[];
  allCategories: CategoryMeta[];
}) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSub, setActiveSub] = useState<string>('All');
  const placeholder = getPlaceholderImage(category.id);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/directory?industry=${category.id}&city=${encodeURIComponent(city.label.replace(' Beach', '').replace('Ybor City', 'Tampa'))}&limit=48`)
      .then(r => r.json())
      .then((data: Listing[]) => {
        setListings(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [category.id, city.label]);

  const filtered = activeSub === 'All'
    ? listings
    : listings.filter(l =>
        l.subcategories?.some(s => s.toLowerCase().includes(activeSub.toLowerCase())) ||
        l.business_name.toLowerCase().includes(activeSub.toLowerCase()) ||
        (l.description || '').toLowerCase().includes(activeSub.toLowerCase())
      );

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-20 pb-16">

      {/* ═══════════════════════════════════════════════════════════
          HERO — Category + City
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={placeholder} alt="" className="w-full h-full object-cover opacity-15" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/60 via-[#0A0A0A]/80 to-[#0A0A0A]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-20">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs font-body text-white/30 mb-8">
            <Link href="/" className="hover:text-white/50 transition-colors">Directory</Link>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            <Link href={`/directory/${category.id}`} className="hover:text-white/50 transition-colors">{category.label}</Link>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            <span className="text-gold/70">{city.label}</span>
          </nav>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-heading font-bold uppercase tracking-wider text-gold/70 border border-gold/20 bg-gold/5">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                {city.label}
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-heading font-semibold uppercase tracking-wider text-white/40 border border-white/10">
                {category.tagline}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white tracking-tight mb-4">
              {category.label} in {city.label}
            </h1>
            <p className="text-base text-white/50 font-body leading-relaxed max-w-3xl mb-2">
              {city.description} Browse the best {category.label.toLowerCase()} businesses verified on GreenLine365.
            </p>
            {listings.length > 0 && !loading && (
              <p className="text-sm text-white/30 font-body">{listings.length} business{listings.length !== 1 ? 'es' : ''} found</p>
            )}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SUBCATEGORY PILLS + OTHER CITY LINKS
      ═══════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-6 relative z-10">
        <div className="rounded-2xl border border-white/10 p-4 sm:p-5 backdrop-blur-xl" style={{ background: 'rgba(10,10,10,0.92)' }}>
          {/* Subcategory pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {['All', ...category.subcategories].map(sub => (
              <button
                key={sub}
                onClick={() => setActiveSub(sub)}
                className={`px-3.5 py-2 rounded-lg text-xs font-heading font-medium transition-all ${
                  activeSub === sub
                    ? 'bg-gold/15 text-gold border border-gold/25'
                    : 'text-white/40 hover:text-white/60 border border-white/10 hover:border-white/20'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          {/* Other cities for this category */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pt-3 border-t border-white/5">
            <span className="text-[10px] text-white/25 font-heading uppercase tracking-wider flex-shrink-0 mr-1">Other Cities</span>
            {allCities.filter(c => c.slug !== city.slug).map(c => (
              <Link
                key={c.slug}
                href={`/directory/${category.id}/${c.slug}`}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-body text-white/40 border border-white/8 hover:border-gold/25 hover:text-gold/70 hover:bg-gold/5 transition-all"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          LISTING GRID
      ═══════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            <span className="text-white/40 text-sm font-body ml-3">Loading {category.label.toLowerCase()} in {city.label}...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.01)' }}>
            <svg className="w-12 h-12 text-white/10 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <p className="text-white/30 font-body mb-2">No {activeSub !== 'All' ? activeSub.toLowerCase() : category.label.toLowerCase()} businesses found in {city.label} yet.</p>
            <p className="text-white/20 text-xs font-body mb-6">We&apos;re actively expanding in this area.</p>
            <Link href={`/directory/${category.id}`} className="px-5 py-2.5 rounded-xl text-xs font-semibold font-heading text-gold border border-gold/30 hover:bg-gold/5 transition-all">
              View All {category.label}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((listing, i) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
              >
                <Link
                  href={`/listing/${listing.slug}`}
                  className="group block rounded-2xl border border-white/8 overflow-hidden hover:border-gold/25 transition-all duration-300"
                  style={{ background: 'rgba(255,255,255,0.02)' }}
                >
                  <div className="relative h-44 overflow-hidden">
                    {listing.cover_image_url ? (
                      <img src={listing.cover_image_url} alt={listing.business_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #111 0%, #1a1a1a 100%)' }}>
                        <span className="text-4xl font-heading font-light text-white/10">{listing.business_name[0]}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/80 to-transparent pointer-events-none" />
                    {listing.tier !== 'free' && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-heading font-bold uppercase tracking-wider" style={{ background: listing.tier === 'premium' ? 'linear-gradient(135deg, #C9A84C, #E8C97A)' : 'linear-gradient(135deg, #3B82F6, #60A5FA)', color: '#0D1B2A' }}>
                        {listing.tier === 'premium' ? 'Premier' : 'Pro'}
                      </span>
                    )}
                    {listing.avg_feedback_rating > 0 && (
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold backdrop-blur-sm" style={{ background: 'rgba(201,168,76,0.9)', color: '#1a1a1a' }}>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                        {listing.avg_feedback_rating.toFixed(1)}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-sm font-heading font-semibold text-white group-hover:text-gold transition-colors truncate">{listing.business_name}</h3>
                      {listing.is_claimed && listing.tier !== 'free' && (
                        <svg className="w-4 h-4 text-greenline flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                      )}
                    </div>
                    {listing.phone && (
                      <p className="text-[11px] text-gold/50 font-body mb-1">{listing.phone}</p>
                    )}
                    {listing.description && (
                      <p className="text-xs text-white/40 font-body line-clamp-2 leading-relaxed">{listing.description}</p>
                    )}
                    {listing.subcategories?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {listing.subcategories.slice(0, 3).map((sub, j) => (
                          <span key={j} className="px-2 py-0.5 rounded-full text-[9px] text-white/30 border border-white/8 font-body">{sub}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          BOTTOM — Other Categories in This City
      ═══════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#C9A84C] to-[#E8C97A]" />
          <h3 className="text-sm font-heading font-semibold text-white/60 uppercase tracking-wider">More in {city.label}</h3>
          <div className="flex-1 h-px bg-white/5" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {allCategories.filter(c => c.id !== category.id).slice(0, 6).map(cat => (
            <Link
              key={cat.id}
              href={`/directory/${cat.id}/${city.slug}`}
              className="rounded-xl border border-white/8 p-4 text-center hover:border-gold/25 hover:bg-gold/5 transition-all group"
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              <p className="text-xs font-heading font-semibold text-white/60 group-hover:text-gold transition-colors">{cat.label}</p>
              <p className="text-[10px] text-white/25 font-body mt-1">in {city.label}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          CTA — Claim Your Listing
      ═══════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-12">
        <div className="rounded-2xl border border-gold/15 p-8 sm:p-12 text-center" style={{ background: 'rgba(201,168,76,0.04)' }}>
          <h2 className="text-xl sm:text-2xl font-heading font-bold text-white mb-2">Own a {category.label.toLowerCase()} business in {city.label}?</h2>
          <p className="text-sm text-white/40 font-body mb-6 max-w-lg mx-auto">
            Claim your free listing on GreenLine365 to reach more local customers and unlock premium visibility.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/" className="px-6 py-3 rounded-xl text-sm font-heading font-bold text-[#0A0A0A] transition-all hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C97A)', boxShadow: '0 0 16px rgba(201,168,76,0.25)' }}>
              List Your Business
            </Link>
            <Link href={`/directory/${category.id}`} className="px-6 py-3 rounded-xl text-sm font-heading font-semibold text-white border border-white/15 hover:border-gold/30 hover:bg-gold/5 transition-all">
              All {category.label}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

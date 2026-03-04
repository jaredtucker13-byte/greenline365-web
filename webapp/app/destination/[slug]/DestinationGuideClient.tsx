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
  is_mobile_business?: boolean;
  service_radius_miles?: number | null;
}

// ─── Destination Config — Region/State Architecture ───
// Organized by state > region for clean multi-state expansion
const DESTINATIONS: Record<string, {
  label: string;
  tagline: string;
  state: string;
  stateAbbr: string;
  region: string;
  lat: number;
  lng: number;
}> = {
  'st-pete-beach':  { label: 'St. Pete Beach',  tagline: "Florida's Sunshine City",             state: 'Florida', stateAbbr: 'FL', region: 'Tampa Bay',    lat: 27.7253, lng: -82.7412 },
  'key-west':       { label: 'Key West',         tagline: 'Close to Perfect, Far from Normal',   state: 'Florida', stateAbbr: 'FL', region: 'Florida Keys', lat: 24.5551, lng: -81.7800 },
  'sarasota':       { label: 'Sarasota',         tagline: 'Where Arts Meet the Gulf',            state: 'Florida', stateAbbr: 'FL', region: 'Gulf Coast',   lat: 27.3364, lng: -82.5307 },
  'ybor-city':      { label: 'Ybor City',        tagline: "Tampa's Historic Latin Quarter",      state: 'Florida', stateAbbr: 'FL', region: 'Tampa Bay',    lat: 27.9617, lng: -82.4369 },
  'daytona':        { label: 'Daytona Beach',    tagline: "World's Most Famous Beach",           state: 'Florida', stateAbbr: 'FL', region: 'East Coast',   lat: 29.2108, lng: -81.0228 },
  'orlando':        { label: 'Orlando',          tagline: 'The City Beautiful',                  state: 'Florida', stateAbbr: 'FL', region: 'Central FL',   lat: 28.5383, lng: -81.3792 },
  'miami':          { label: 'Miami',            tagline: 'Neon Nights & Coastal Luxury',        state: 'Florida', stateAbbr: 'FL', region: 'South FL',     lat: 25.7617, lng: -80.1918 },
  'jacksonville':   { label: 'Jacksonville',     tagline: 'Gridiron Grit & Riverfront Views',    state: 'Florida', stateAbbr: 'FL', region: 'North FL',     lat: 30.3322, lng: -81.6557 },
};

// Hero background images per destination (placeholder Unsplash photos)
const DESTINATION_HERO_IMAGES: Record<string, string> = {
  'st-pete-beach':  'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=1920&q=80&auto=format',
  'key-west':       'https://images.unsplash.com/photo-1580548834828-36c1c0a3d787?w=1920&q=80&auto=format',
  'sarasota':       'https://images.unsplash.com/photo-1568572933382-74d440642117?w=1920&q=80&auto=format',
  'ybor-city':      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1920&q=80&auto=format',
  'daytona':        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80&auto=format',
  'orlando':        'https://images.unsplash.com/photo-1575089976121-8ed7b2a54265?w=1920&q=80&auto=format',
  'miami':          'https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?w=1920&q=80&auto=format',
  'jacksonville':   'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1920&q=80&auto=format',
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

// ─── Industry Categories (same as main directory) ───
const INDUSTRY_LABELS: Record<string, string> = {
  'dining': 'Dining',
  'health-wellness': 'Health & Wellness',
  'style-shopping': 'Style & Shopping',
  'nightlife': 'Nightlife',
  'family-entertainment': 'Family Entertainment',
  'destinations': 'Destinations',
  'hotels-lodging': 'Hotels & Lodging',
  'professional-services': 'Professional Services',
  'automotive': 'Automotive',
  'marine-outdoor': 'Marine & Dock Services',
  'education': 'Education & Childcare',
  'pets': 'Pets',
  'mobile-services': 'Mobile Services',
};

const INDUSTRY_ICONS: Record<string, string> = {
  'services': 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  'dining': 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z',
  'health-wellness': 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  'style-shopping': 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
  'nightlife': 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z',
  'family-entertainment': 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  'destinations': 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064',
  'hotels-lodging': 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  'professional-services': 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
};

function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} width={size} height={size} viewBox="0 0 24 24" fill={s <= Math.round(rating) ? '#C9A84C' : 'none'} stroke={s <= Math.round(rating) ? '#C9A84C' : '#555'} strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
    </div>
  );
}

export default function DestinationGuideClient({ slug }: { slug: string }) {
  const [listings, setListings] = useState<Record<string, Listing[]>>({});
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [topRated, setTopRated] = useState<Listing[]>([]);
  const [industryCounts, setIndustryCounts] = useState<Record<string, number>>({});
  const [cities, setCities] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState('stay');
  const [activeView, setActiveView] = useState<'explore' | 'browse'>('explore');
  const [loading, setLoading] = useState(true);
  const [allCount, setAllCount] = useState(0);
  const [claimedCount, setClaimedCount] = useState(0);
  // Public Resource Hub state
  const [tips, setTips] = useState<{ id: string; tip_text: string; tip_category: string; upvotes: number }[]>([]);
  const [weather, setWeather] = useState<{ temp?: number; condition?: string; humidity?: number; uv_index?: number; wind_speed?: number; icon?: string } | null>(null);
  const [resources, setResources] = useState<{ id: string; title: string; file_url: string; file_type: string; download_count: number; description?: string; is_featured?: boolean }[]>([]);

  const dest = DESTINATIONS[slug];

  useEffect(() => {
    if (!dest) return;
    loadGuideData();
    // Load public resource hub data
    loadInsiderTips();
    loadWeather();
    loadResources();
  }, [slug]);

  async function loadGuideData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/directory/guide?destination=${slug}`);
      const data = await res.json();

      if (data.sections) {
        setListings(data.sections);
        setAllCount(data.totalCount || 0);
        setFeatured(data.featured || []);
        setTopRated(data.topRated || []);
        setIndustryCounts(data.industryCounts || {});
        setCities(data.cities || []);
        setClaimedCount(data.claimedCount || 0);

        const firstWithData = SECTIONS.find(s => (data.sections[s.id] || []).length > 0);
        if (firstWithData) setActiveSection(firstWithData.id);
      }
    } catch {
      setListings({});
      setAllCount(0);
    }
    setLoading(false);
  }

  // ─── Insider Tips ───
  async function loadInsiderTips() {
    try {
      const res = await fetch(`/api/destination/tips?slug=${slug}`);
      if (res.ok) {
        const data = await res.json();
        setTips(data.tips || data || []);
      }
    } catch { /* tips are optional */ }
  }

  // ─── Live Weather ───
  async function loadWeather() {
    if (!dest) return;
    try {
      const res = await fetch(`/api/destination/weather?lat=${dest.lat}&lng=${dest.lng}`);
      if (res.ok) {
        const data = await res.json();
        setWeather(data);
      }
    } catch { /* weather is optional */ }
  }

  // ─── Resource Downloads ───
  async function loadResources() {
    try {
      const res = await fetch(`/api/destination/resources?slug=${slug}`);
      if (res.ok) {
        const data = await res.json();
        setResources(data.resources || data || []);
      }
    } catch { /* resources are optional */ }
  }

  const handleDownload = async (resourceId: string, fileUrl: string) => {
    // Track download
    try {
      await fetch('/api/destination/resources/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId }),
      });
    } catch { /* tracking is best-effort */ }
    // Open file
    window.open(fileUrl, '_blank');
    // Update local count
    setResources(prev => prev.map(r => r.id === resourceId ? { ...r, download_count: r.download_count + 1 } : r));
  };

  // Group destinations by region for the footer nav
  const destinationsByRegion = Object.entries(DESTINATIONS).reduce<Record<string, { slug: string; label: string }[]>>((acc, [key, d]) => {
    if (key === slug) return acc;
    if (!acc[d.region]) acc[d.region] = [];
    acc[d.region].push({ slug: key, label: d.label });
    return acc;
  }, {});

  if (!dest) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center" data-testid="destination-not-found">
        <div className="text-center">
          <h1 className="text-3xl font-heading font-light text-white mb-4">Destination Not Found</h1>
          <p className="text-white/40 mb-8 font-body">This destination guide doesn&apos;t exist yet.</p>
          <Link href="/" className="btn-primary px-6 py-3 rounded-xl text-sm" data-testid="back-home-btn">Back to Directory</Link>
        </div>
      </div>
    );
  }

  const currentListings = listings[activeSection] || [];
  const currentSection = SECTIONS.find(s => s.id === activeSection);
  const totalIndustryCount = Object.values(industryCounts).reduce((sum, c) => sum + c, 0);
  const activeIndustries = Object.entries(industryCounts).filter(([, count]) => count > 0);

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-20" data-testid="destination-guide">
      {/* ─── Cinematic Hero with Background Image ─── */}
      <section className="relative overflow-hidden" style={{ minHeight: '60vh' }} data-testid="destination-hero">
        {/* Hero background image */}
        {DESTINATION_HERO_IMAGES[slug] && (
          <div className="absolute inset-0">
            <img
              src={DESTINATION_HERO_IMAGES[slug]}
              alt={`${dest.label} skyline`}
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
        )}
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/70 via-[#0A0A0A]/60 to-[#0A0A0A]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/80 via-transparent to-[#0A0A0A]/80" />

        {/* Gold light trails */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-0 w-full h-[1px] opacity-10" style={{ background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)' }} />
          <div className="absolute top-2/3 left-0 w-full h-[1px] opacity-5" style={{ background: 'linear-gradient(90deg, transparent, #C9A84C 30%, transparent 70%)' }} />
        </div>

        {/* Gold ambient glow */}
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, #C9A84C 0%, transparent 70%)' }} />
        <div className="absolute bottom-10 right-1/4 w-64 h-64 rounded-full opacity-[0.03]" style={{ background: 'radial-gradient(circle, #C9A84C 0%, transparent 70%)' }} />

        <div className="relative max-w-6xl mx-auto px-6 flex flex-col justify-center" style={{ minHeight: '60vh' }}>
          {/* Breadcrumb */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-gold transition font-body mb-8" data-testid="breadcrumb-home">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Directory
            </Link>
          </motion.div>

          {/* Region Badge */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#C9A84C]/20 backdrop-blur-sm mb-6 w-fit"
            style={{ background: 'rgba(201, 168, 76, 0.06)' }}>
            <span className="w-2 h-2 rounded-full bg-[#C9A84C] animate-pulse" />
            <span className="text-xs font-medium text-white/80 tracking-widest font-heading uppercase">{dest.region} &middot; {dest.stateAbbr}</span>
          </motion.div>

          {/* Title */}
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-heading font-light text-white leading-[1.05] mb-4 tracking-tight"
            data-testid="destination-title">
            {dest.label}
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="text-lg text-white/40 max-w-xl mb-8 font-body" data-testid="destination-tagline">
            {dest.tagline}
          </motion.p>

          {/* Stats Row — hide any stat that is zero */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="flex flex-wrap items-center gap-6">
            {!loading && allCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-heading font-semibold text-[#C9A84C]" data-testid="destination-count">
                  {allCount}
                </span>
                <span className="text-sm text-white/30 font-body">businesses</span>
              </div>
            )}
            {!loading && activeIndustries.length > 0 && (
              <>
                {allCount > 0 && <span className="w-1 h-1 rounded-full bg-white/10" />}
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-heading font-semibold text-white/70">
                    {activeIndustries.length}
                  </span>
                  <span className="text-sm text-white/30 font-body">categories</span>
                </div>
              </>
            )}
            {!loading && claimedCount > 0 && (
              <>
                <span className="w-1 h-1 rounded-full bg-white/10" />
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-heading font-semibold text-white/70">
                    {claimedCount}
                  </span>
                  <span className="text-sm text-white/30 font-body">verified</span>
                </div>
              </>
            )}
            {cities.length > 1 && (
              <>
                <span className="w-1 h-1 rounded-full bg-white/10" />
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-heading font-semibold text-white/70">
                    {cities.length}
                  </span>
                  <span className="text-sm text-white/30 font-body">neighborhoods</span>
                </div>
              </>
            )}
            {loading && <span className="text-2xl font-heading text-white/20">—</span>}
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
      </section>

      {/* ─── View Toggle ─── */}
      <section className="max-w-6xl mx-auto px-6 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('explore')}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium font-body transition-all duration-300 ${
              activeView === 'explore'
                ? 'bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/30'
                : 'text-white/40 border border-white/5 hover:text-white/60 hover:border-white/10'
            }`}
          >
            Explore
          </button>
          <button
            onClick={() => setActiveView('browse')}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium font-body transition-all duration-300 ${
              activeView === 'browse'
                ? 'bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/30'
                : 'text-white/40 border border-white/5 hover:text-white/60 hover:border-white/10'
            }`}
          >
            Browse by Category
          </button>
        </div>
      </section>

      {activeView === 'explore' ? (
        <>
          {/* ─── Featured Businesses ─── */}
          {!loading && featured.length > 0 && (
            <section className="max-w-6xl mx-auto px-6 py-10" data-testid="featured-section">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(201, 168, 76, 0.1)', border: '1px solid rgba(201, 168, 76, 0.2)' }}>
                  <svg className="w-5 h-5 text-[#C9A84C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-heading font-semibold text-white">Featured in {dest.label}</h2>
                  <p className="text-xs text-white/30 font-body">Verified businesses with the highest trust scores</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {featured.map((l, i) => (
                  <GuideListingCard key={l.id} listing={l} index={i} isFeatured />
                ))}
              </div>
            </section>
          )}

          {/* ─── Top Rated ─── */}
          {!loading && topRated.length > 0 && (
            <section className="max-w-6xl mx-auto px-6 py-10 border-t border-white/5" data-testid="top-rated-section">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(201, 168, 76, 0.1)', border: '1px solid rgba(201, 168, 76, 0.2)' }}>
                  <svg className="w-5 h-5 text-[#C9A84C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-heading font-semibold text-white">Top Rated in {dest.label}</h2>
                  <p className="text-xs text-white/30 font-body">Highest-rated businesses based on reviews</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {topRated.map((l, i) => (
                  <GuideListingCard key={l.id} listing={l} index={i} />
                ))}
              </div>
            </section>
          )}

          {/* ─── PUBLIC RESOURCE HUB ─── */}

          {/* Live Weather Widget */}
          {weather && (
            <section className="max-w-6xl mx-auto px-6 py-10 border-t border-white/5" data-testid="weather-section">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(201, 168, 76, 0.1)', border: '1px solid rgba(201, 168, 76, 0.2)' }}>
                  <svg className="w-5 h-5 text-[#C9A84C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-heading font-semibold text-white">Current Conditions</h2>
                  <p className="text-xs text-white/30 font-body">Live weather for {dest.label}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {weather.temp != null && (
                  <div className="rounded-xl p-4 border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider font-body mb-1">Temperature</p>
                    <p className="text-2xl font-heading font-bold text-white">{weather.temp}&deg;F</p>
                    {weather.condition && <p className="text-xs text-white/50 font-body mt-1">{weather.condition}</p>}
                  </div>
                )}
                {weather.humidity != null && (
                  <div className="rounded-xl p-4 border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider font-body mb-1">Humidity</p>
                    <p className="text-2xl font-heading font-bold text-white">{weather.humidity}%</p>
                  </div>
                )}
                {weather.uv_index != null && (
                  <div className="rounded-xl p-4 border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider font-body mb-1">UV Index</p>
                    <p className="text-2xl font-heading font-bold text-white">{weather.uv_index}</p>
                    <p className="text-xs text-white/50 font-body mt-1">{weather.uv_index <= 2 ? 'Low' : weather.uv_index <= 5 ? 'Moderate' : weather.uv_index <= 7 ? 'High' : 'Very High'}</p>
                  </div>
                )}
                {weather.wind_speed != null && (
                  <div className="rounded-xl p-4 border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider font-body mb-1">Wind Speed</p>
                    <p className="text-2xl font-heading font-bold text-white">{weather.wind_speed} mph</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Insider Tips */}
          {tips.length > 0 && (
            <section className="max-w-6xl mx-auto px-6 py-10 border-t border-white/5" data-testid="insider-tips-section">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(201, 168, 76, 0.1)', border: '1px solid rgba(201, 168, 76, 0.2)' }}>
                  <svg className="w-5 h-5 text-[#C9A84C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-heading font-semibold text-white">Local Secrets</h2>
                  <p className="text-xs text-white/30 font-body">Insider tips from people who know {dest.label}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tips.map(tip => (
                  <div key={tip.id} className="rounded-xl p-5 border border-[#C9A84C]/10 group hover:border-[#C9A84C]/25 transition-all" style={{ background: 'rgba(201,168,76,0.03)' }}>
                    <div className="flex items-start gap-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-heading font-semibold shrink-0 mt-0.5" style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.2)' }}>
                        {tip.tip_category}
                      </span>
                      <p className="text-sm text-white/70 font-body leading-relaxed">{tip.tip_text}</p>
                    </div>
                    {tip.upvotes > 0 && (
                      <p className="text-[10px] text-white/30 mt-3 text-right font-body">{tip.upvotes} found this helpful</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Resource Downloads */}
          {resources.length > 0 && (
            <section className="max-w-6xl mx-auto px-6 py-10 border-t border-white/5" data-testid="resources-section">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(201, 168, 76, 0.1)', border: '1px solid rgba(201, 168, 76, 0.2)' }}>
                  <svg className="w-5 h-5 text-[#C9A84C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-heading font-semibold text-white">Maps &amp; Resources</h2>
                  <p className="text-xs text-white/30 font-body">Downloadable guides, trail maps, and more</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {resources.map(res => {
                  const typeIcons: Record<string, string> = { pdf: 'PDF', gpx: 'GPX', jpg: 'IMG', png: 'IMG' };
                  return (
                    <button
                      key={res.id}
                      onClick={() => handleDownload(res.id, res.file_url)}
                      className="text-left rounded-xl p-5 border border-white/10 hover:border-[#C9A84C]/30 transition-all group"
                      style={{ background: 'rgba(255,255,255,0.02)' }}
                      data-testid={`resource-${res.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-[10px] px-2 py-1 rounded-lg font-heading font-bold uppercase tracking-wider shrink-0" style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.2)' }}>
                          {typeIcons[res.file_type] || res.file_type.toUpperCase()}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-heading font-semibold text-white group-hover:text-[#C9A84C] transition truncate">{res.title}</h4>
                          {res.description && <p className="text-xs text-white/40 font-body mt-1 line-clamp-2">{res.description}</p>}
                          <p className="text-[10px] text-white/30 font-body mt-2">{res.download_count} downloads</p>
                        </div>
                        <svg className="w-5 h-5 text-white/20 group-hover:text-[#C9A84C] transition shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* ─── Voted Best — Coming Soon ─── */}
          <section className="max-w-6xl mx-auto px-6 py-12 border-t border-white/5" data-testid="voted-best-section">
            <div className="relative rounded-2xl overflow-hidden border border-[#C9A84C]/10" style={{ background: 'rgba(201, 168, 76, 0.03)' }}>
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-0 w-full h-[1px] opacity-5" style={{ background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)' }} />
              </div>

              <div className="relative p-8 sm:p-12 text-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#C9A84C]/20 mb-6" style={{ background: 'rgba(201, 168, 76, 0.08)' }}>
                    <span className="text-xs font-heading font-semibold text-[#C9A84C] tracking-widest uppercase">Coming Soon</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-heading font-light text-white mb-4">
                    Voted Best in <span className="text-[#C9A84C]">{dest.label}</span>
                  </h3>
                  <p className="text-white/40 font-body max-w-lg mx-auto mb-6 text-sm leading-relaxed">
                    Real rankings from real people. GL365 polls will let you vote for the best businesses
                    in {dest.label} — Best Plumber, Best Restaurant, Best Salon, and more.
                    No fake reviews. No pay-to-win. Just your vote.
                  </p>

                  <div className="flex flex-wrap justify-center gap-3">
                    {['Best Restaurant', 'Best Beach Bar', 'Best Hotel', 'Best Attraction'].map(badge => (
                      <span key={badge} className="px-4 py-2 rounded-full text-xs font-heading font-semibold border border-[#C9A84C]/15 text-[#C9A84C]/60" style={{ background: 'rgba(201, 168, 76, 0.05)' }}>
                        {badge}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* ─── Category Overview Grid ─── */}
          {!loading && activeIndustries.length > 0 && (
            <section className="max-w-6xl mx-auto px-6 py-10 border-t border-white/5" data-testid="category-overview">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-heading font-semibold text-white">Browse by Category</h2>
                  <p className="text-xs text-white/30 font-body mt-1">{totalIndustryCount} businesses across {activeIndustries.length} categories in {dest.label}</p>
                </div>
                <button
                  onClick={() => setActiveView('browse')}
                  className="text-sm text-[#C9A84C] font-body hover:text-[#E8C97A] transition"
                >
                  View All &rarr;
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {activeIndustries.map(([id, count], i) => (
                  <motion.button
                    key={id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setActiveView('browse')}
                    className="rounded-xl p-5 text-left border border-white/5 hover:border-[#C9A84C]/20 transition-all duration-300 group"
                    style={{ background: 'rgba(255,255,255,0.02)' }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: 'rgba(201, 168, 76, 0.08)' }}>
                      <svg className="w-4 h-4 text-[#C9A84C]/70 group-hover:text-[#C9A84C] transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={INDUSTRY_ICONS[id] || INDUSTRY_ICONS['services']} />
                      </svg>
                    </div>
                    <span className="block text-sm font-heading font-semibold text-white/80 group-hover:text-white transition mb-1">
                      {INDUSTRY_LABELS[id] || id}
                    </span>
                    <span className="block text-xs text-white/30 font-body">{count} {count === 1 ? 'business' : 'businesses'}</span>
                  </motion.button>
                ))}
              </div>
            </section>
          )}

          {/* ─── Tourism Section Tabs ─── */}
          <section className="border-t border-white/5">
            <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/5" data-testid="section-nav">
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
                            ? 'bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/30'
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
                            activeSection === section.id ? 'bg-[#C9A84C]/20 text-[#C9A84C]' : 'bg-white/5 text-white/30'
                          }`}>{count}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Section Content */}
            <div className="max-w-6xl mx-auto px-6 py-10" data-testid="section-content">
              <AnimatePresence mode="wait">
                <motion.div key={activeSection} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(201, 168, 76, 0.1)', border: '1px solid rgba(201, 168, 76, 0.2)' }}>
                      <svg className="w-5 h-5 text-[#C9A84C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={currentSection?.icon || ''} />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-heading font-semibold text-white" data-testid="section-title">{currentSection?.label}</h2>
                      <p className="text-xs text-white/30 font-body">{currentListings.length} options in {dest.label}</p>
                    </div>
                  </div>

                  {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {[1,2,3,4,5,6].map(i => (
                        <div key={i} className="h-72 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
                      ))}
                    </div>
                  ) : currentListings.length === 0 ? (
                    <div className="text-center py-16" data-testid="section-empty">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(201, 168, 76, 0.08)', border: '1px solid rgba(201, 168, 76, 0.15)' }}>
                        <svg className="w-10 h-10 text-[#C9A84C]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={currentSection?.icon || ''} />
                        </svg>
                      </div>
                      <h3 className="text-xl font-heading font-light text-white mb-2">Coming Soon</h3>
                      <p className="text-sm text-white/30 font-body max-w-md mx-auto mb-6">
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
            </div>
          </section>
        </>
      ) : (
        /* ─── Browse by Industry Category View ─── */
        <section className="max-w-6xl mx-auto px-6 py-10" data-testid="browse-view">
          <div className="mb-8">
            <h2 className="text-2xl font-heading font-light text-white mb-2">All Categories in {dest.label}</h2>
            <p className="text-sm text-white/30 font-body">{totalIndustryCount} businesses across {activeIndustries.length} categories</p>
          </div>

          {activeIndustries.length === 0 && !loading ? (
            <div className="text-center py-16">
              <h3 className="text-xl font-heading font-light text-white mb-2">No businesses yet</h3>
              <p className="text-sm text-white/30 font-body max-w-md mx-auto mb-6">
                Be the first to list your business in {dest.label}.
              </p>
              <Link href="/register-business" className="btn-primary px-6 py-3 rounded-xl text-sm">
                Add Your Business
              </Link>
            </div>
          ) : (
            <div className="space-y-12">
              {activeIndustries.map(([industryId, count]) => {
                // Get all listings in this destination for this industry
                const industryListings = Object.values(listings)
                  .flat()
                  .filter(l => l.industry === industryId)
                  .sort((a, b) => (b.trust_score || 0) - (a.trust_score || 0));

                // Deduplicate by ID
                const seen = new Set<string>();
                const unique = industryListings.filter(l => {
                  if (seen.has(l.id)) return false;
                  seen.add(l.id);
                  return true;
                });

                if (unique.length === 0) return null;

                return (
                  <div key={industryId}>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(201, 168, 76, 0.08)' }}>
                        <svg className="w-4 h-4 text-[#C9A84C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={INDUSTRY_ICONS[industryId] || INDUSTRY_ICONS['services']} />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-heading font-semibold text-white">{INDUSTRY_LABELS[industryId] || industryId}</h3>
                        <p className="text-xs text-white/30 font-body">{unique.length} in {dest.label}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {unique.slice(0, 6).map((l, i) => (
                        <GuideListingCard key={l.id} listing={l} index={i} />
                      ))}
                    </div>
                    {unique.length > 6 && (
                      <p className="text-sm text-[#C9A84C]/60 font-body mt-4">
                        + {unique.length - 6} more {INDUSTRY_LABELS[industryId]?.toLowerCase() || industryId} businesses
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ─── Add Your Business CTA ─── */}
      <section className="border-t border-white/5 py-16" data-testid="add-business-cta">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h3 className="text-2xl font-heading font-light text-white mb-4">
            Own a business in <span className="text-[#C9A84C]">{dest.label}</span>?
          </h3>
          <p className="text-white/40 font-body max-w-md mx-auto mb-8 text-sm">
            Get discovered by locals and visitors. Join the GL365 verified directory — free to start, no contracts.
          </p>
          <Link href="/register-business" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-heading font-semibold text-black transition-all duration-300 hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C97A)' }}>
            Add Your Business — Free
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ─── Experience Loops ─── */}
      <DestinationLoops destinationSlug={slug} destinationLabel={dest.label} />

      {/* ─── All Destinations CTA ─── */}
      {/* ─── Explore More Destinations ─── */}
      <section className="border-t border-white/5 py-16" data-testid="other-destinations">
        <div className="max-w-6xl mx-auto px-6">
          <h3 className="text-lg font-heading font-semibold text-white mb-8 text-center">Explore More Destinations</h3>

          {Object.keys(destinationsByRegion).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(destinationsByRegion).map(([region, dests]) => (
                <div key={region}>
                  <h4 className="text-xs font-heading font-semibold text-[#C9A84C]/60 tracking-widest uppercase mb-3">{region}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {dests.map(d => (
                      <Link key={d.slug} href={`/destination/${d.slug}`}
                        className="rounded-xl p-4 border border-white/5 hover:border-[#C9A84C]/20 transition-all duration-300 text-center group"
                        style={{ background: 'rgba(255,255,255,0.02)' }}
                        data-testid={`dest-link-${d.slug}`}>
                        <span className="text-sm font-heading font-semibold text-white/70 group-hover:text-[#C9A84C] transition-colors">{d.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-white/30 text-sm font-body">More destinations coming soon.</p>
          )}
        </div>
      </section>
    </div>
  );
}

// ─── Guide Listing Card ───
function MobileBadge({ radius }: { radius?: number | null }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-heading font-semibold uppercase tracking-wider"
      style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: '#fff' }}
      data-testid="mobile-badge">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
      We Come to You{radius ? ` · ${radius}mi` : ''}
    </span>
  );
}

function GuideListingCard({ listing: l, index: i, isFeatured }: { listing: Listing; index: number; isFeatured?: boolean }) {
  const googleRating = l.metadata?.google_rating;
  const isMobile = l.is_mobile_business || l.industry === 'mobile-services';
  const googleReviewCount = l.metadata?.google_review_count;
  const googleMapsUrl = l.metadata?.google_maps_url;

  return (
    <Link href={`/listing/${l.slug}`}>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.04 }}
        className={`rounded-2xl overflow-hidden border hover:shadow-lg transition-all duration-500 group cursor-pointer ${
          isFeatured
            ? 'border-[#C9A84C]/20 hover:border-[#C9A84C]/40'
            : 'border-white/5 hover:border-[#C9A84C]/20'
        }`}
        style={{ background: isFeatured ? 'rgba(201, 168, 76, 0.03)' : 'rgba(255,255,255,0.02)' }}
        data-testid={`guide-listing-${l.slug}`}
      >
      {/* Image with fallback for broken URLs */}
      <div className="relative h-44 overflow-hidden">
        {l.cover_image_url ? (
          <img src={l.cover_image_url} alt={l.business_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}
        <div className={`w-full h-full items-center justify-center ${l.cover_image_url ? 'hidden' : 'flex'}`} style={{ background: 'linear-gradient(135deg, #111111, #1A1A1A)' }}>
          <span className="text-4xl font-heading font-light text-white/10">{l.business_name[0]}</span>
        </div>

        {/* Google Rating Badge */}
        {googleRating && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg backdrop-blur-md text-xs font-semibold"
            style={{ background: 'rgba(10,10,10,0.8)', color: '#C9A84C' }}>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            {googleRating.toFixed(1)}
          </div>
        )}

        {/* Tier badge */}
        {l.tier !== 'free' && (
          <span className="absolute top-3 left-3 text-[10px] px-2 py-0.5 rounded-full font-heading font-semibold uppercase tracking-wider text-[#0A0A0A]"
            style={{ background: l.tier === 'premium' ? 'linear-gradient(135deg, #C9A84C, #E8C97A)' : 'linear-gradient(135deg, #A8A9AD, #C0C0C0)' }}>
            {l.tier === 'premium' ? 'Premier' : 'Pro'}
          </span>
        )}

        {/* Featured indicator */}
        {isFeatured && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded-lg backdrop-blur-md text-[10px] font-heading font-semibold tracking-wider uppercase"
            style={{ background: 'rgba(201, 168, 76, 0.2)', color: '#C9A84C', border: '1px solid rgba(201, 168, 76, 0.3)' }}>
            Featured
          </div>
        )}
        {/* Mobile business badge */}
        {isMobile && !isFeatured && (
          <div className="absolute bottom-3 left-3">
            <MobileBadge radius={l.service_radius_miles} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-heading font-semibold text-sm text-[#C9A84C] truncate mb-1" data-testid={`guide-name-${l.slug}`}>{l.business_name}</h3>

        {l.city && (
          <p className="text-[11px] text-white/30 flex items-center gap-1 mb-1.5 font-body">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {l.city}, {l.state}
          </p>
        )}

        {l.description && <p className="text-xs text-white/25 line-clamp-2 mb-3 font-body">{l.description}</p>}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto">
          {l.phone && (
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `tel:${l.phone}`; }} className="btn-ghost text-xs px-3 py-1.5 rounded-full flex items-center gap-1" data-testid={`guide-call-${l.slug}`}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call
            </button>
          )}
          {l.website && (
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(l.website!, '_blank'); }} className="btn-ghost text-xs px-3 py-1.5 rounded-full flex items-center gap-1" data-testid={`guide-web-${l.slug}`}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Visit
            </button>
          )}
          {googleMapsUrl && (
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(googleMapsUrl, '_blank'); }} className="ml-auto text-[10px] text-white/25 hover:text-[#C9A84C] transition font-body" data-testid={`guide-maps-${l.slug}`}>
              Google Maps
            </button>
          )}
        </div>
      </div>
      </motion.div>
    </Link>
  );
}

// ─── Destination Loops Section ───
function DestinationLoops({ destinationSlug, destinationLabel }: { destinationSlug: string; destinationLabel: string }) {
  const [loops, setLoops] = useState<{ id: string; name: string; slug: string; loop_type: string; cover_image_url?: string; duration_estimate?: string; vibe?: string; short_description?: string; stops_count: number }[]>([]);

  useEffect(() => {
    fetch(`/api/loops?destination=${destinationSlug}&limit=4`)
      .then(r => r.json())
      .then(data => setLoops(data.loops || []))
      .catch(() => {});
  }, [destinationSlug]);

  if (loops.length === 0) return null;

  const TYPE_COLORS: Record<string, string> = {
    'date-night': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    'entertainment': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    'family': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'foodie': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    'adventure': 'bg-green-500/20 text-green-300 border-green-500/30',
    'nightlife': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    'wellness': 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  };

  return (
    <section className="border-t border-white/5 py-16" data-testid="destination-loops">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-heading font-semibold uppercase tracking-[0.2em] text-gold mb-1">Experiences</p>
            <h3 className="text-xl font-heading font-light text-white tracking-tight">
              Curated Loops in <span className="font-semibold text-gradient-gold">{destinationLabel}</span>
            </h3>
          </div>
          <Link href={`/loops?destination=${destinationSlug}`} className="text-xs text-gold/70 hover:text-gold transition font-heading font-semibold uppercase tracking-wider">
            View All &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loops.map(loop => (
            <Link
              key={loop.id}
              href={`/loops/${loop.slug}`}
              className="rounded-xl overflow-hidden border border-white/10 hover:border-gold/20 transition-all duration-300 group"
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              <div className="relative h-32 overflow-hidden">
                {loop.cover_image_url ? (
                  <img src={loop.cover_image_url} alt={loop.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gold/10 via-midnight-800 to-midnight-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-midnight-900/80 to-transparent" />
                <span className={`absolute top-2 left-2 text-[9px] px-2 py-0.5 rounded-full font-heading font-semibold uppercase tracking-wider border ${TYPE_COLORS[loop.loop_type] || 'bg-gold/20 text-gold border-gold/30'}`}>
                  {loop.loop_type.replace('-', ' ')}
                </span>
              </div>
              <div className="p-3">
                <h4 className="text-sm font-heading font-semibold text-white group-hover:text-gold transition-colors truncate">{loop.name}</h4>
                <p className="text-xs text-white/40 font-body mt-1">
                  {loop.stops_count} stop{loop.stops_count !== 1 ? 's' : ''}
                  {loop.duration_estimate ? ` · ${loop.duration_estimate}` : ''}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

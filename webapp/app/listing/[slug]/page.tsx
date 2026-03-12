'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Listing {
  id: string;
  business_name: string;
  slug: string;
  industry: string;
  subcategories: string[];
  description: string | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  cover_image_url: string | null;
  gallery_images: string[];
  tier: string;
  is_claimed: boolean;
  has_property_intelligence: boolean;
  trust_score: number;
  avg_feedback_rating: number;
  total_feedback_count: number;
  total_photos_available: number;
  tags: string[];
  metadata: Record<string, any>;
  directory_badges: { id: string; badge_type: string; badge_label: string; badge_color: string }[];
  related: RelatedListing[];
  business_hours: Record<string, any> | null;
  menu: { id: string; name: string; items: { id: string; name: string; description: string; price: string }[] }[] | null;
}

interface RelatedListing {
  id: string;
  business_name: string;
  slug: string;
  industry: string;
  city: string;
  state: string;
  cover_image_url: string | null;
  tier: string;
  avg_feedback_rating: number;
  metadata: Record<string, any>;
}

interface NormalizedDayHours { open: string; close: string; closed: boolean; display?: string }

const LONG_TO_SHORT: Record<string, string> = {
  monday: 'mon', tuesday: 'tue', wednesday: 'wed', thursday: 'thu',
  friday: 'fri', saturday: 'sat', sunday: 'sun',
};

/**
 * Parse a scraped hours string like "Monday: 8:00 AM – 6:00 PM" or "Monday: Closed"
 * into a structured { open, close, closed } object.
 */
function parseHoursString(raw: string): NormalizedDayHours {
  // Strip day prefix "Monday: " if present
  const cleaned = raw.replace(/^\w+:\s*/, '').trim();
  if (/closed/i.test(cleaned)) return { open: '', close: '', closed: true, display: 'Closed' };

  // Match patterns like "8:00 AM – 6:00 PM", "4:00 – 10:00 PM", "12:00 PM – 5:00 AM"
  // Also handles split shifts like "9:00 AM – 1:30 PM, 2:00 – 8:00 PM" — use full range
  const timePattern = /(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*[–\-]\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/gi;
  const matches = [...cleaned.matchAll(timePattern)];
  if (matches.length === 0) return { open: '', close: '', closed: false, display: cleaned || '—' };

  const openStr = matches[0][1].trim();
  const closeStr = matches[matches.length - 1][2].trim();
  return { open: openStr, close: closeStr, closed: false, display: cleaned };
}

/**
 * Normalize business_hours from any DB format into { mon: { open, close, closed, display }, ... }
 *
 * Handles:
 *  1. Structured objects: { "mon": { "open": "09:00", "close": "17:00", "closed": false } }
 *  2. String per full-day key: { "monday": "Monday: 8:00 AM – 6:00 PM" }
 *  3. Array in a single key: { "hours": ["Monday: 8:00 AM – 5:00 PM", ...] }
 */
function normalizeBusinessHours(raw: Record<string, any> | null): Record<string, NormalizedDayHours> | null {
  if (!raw || Object.keys(raw).length === 0) return null;

  const result: Record<string, NormalizedDayHours> = {};

  // Format 3: Array stored under a key (e.g. "hours" or any key whose value is an array of strings)
  for (const val of Object.values(raw)) {
    if (Array.isArray(val)) {
      for (const entry of val) {
        if (typeof entry !== 'string') continue;
        const dayMatch = entry.match(/^(\w+):/i);
        if (!dayMatch) continue;
        const shortKey = LONG_TO_SHORT[dayMatch[1].toLowerCase()] || dayMatch[1].toLowerCase().slice(0, 3);
        result[shortKey] = parseHoursString(entry);
      }
      if (Object.keys(result).length > 0) return result;
    }
  }

  for (const [key, val] of Object.entries(raw)) {
    const shortKey = LONG_TO_SHORT[key.toLowerCase()] || key.toLowerCase().slice(0, 3);

    // Format 1: Already structured
    if (val && typeof val === 'object' && !Array.isArray(val) && ('open' in val || 'close' in val || 'closed' in val)) {
      result[shortKey] = {
        open: val.open || '',
        close: val.close || '',
        closed: !!val.closed,
        display: val.closed ? 'Closed' : (val.open && val.close ? `${val.open} — ${val.close}` : '—'),
      };
      continue;
    }

    // Format 2: String value
    if (typeof val === 'string') {
      result[shortKey] = parseHoursString(val);
      continue;
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

/** Compute whether the business is currently open based on normalized hours */
function getOpenStatus(hours: Record<string, NormalizedDayHours> | null): { isOpen: boolean; label: string } | null {
  if (!hours || Object.keys(hours).length === 0) return null;
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const now = new Date();
  const dayKey = days[now.getDay()];
  const today = hours[dayKey];
  if (!today) return null;
  if (today.closed) return { isOpen: false, label: 'Closed Today' };
  if (!today.open || !today.close) return null;

  const parseTime = (t: string): number => {
    const match = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return -1;
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const period = match[3]?.toUpperCase();
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  };

  const openMin = parseTime(today.open);
  const closeMin = parseTime(today.close);
  if (openMin < 0 || closeMin < 0) return null;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const isOpen = closeMin > openMin ? (nowMin >= openMin && nowMin < closeMin) : (nowMin >= openMin || nowMin < closeMin);
  return { isOpen, label: isOpen ? 'Open Now' : 'Closed' };
}

function ensureProtocol(url: string): string {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
}

function cleanPhone(phone: string): string {
  if (!phone) return phone;
  return phone.replace(/[^\d+]/g, '');
}

function cleanDomain(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
}

/** Star rating component */
function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} className="flex-shrink-0" width={size} height={size} fill={s <= Math.round(rating) ? '#C9A84C' : 'none'} stroke={s <= Math.round(rating) ? '#C9A84C' : '#555'} strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
    </div>
  );
}

/** Section divider with gold accent */
function SectionDivider({ title, id }: { title: string; id?: string }) {
  return (
    <div id={id} className="flex items-center gap-4 scroll-mt-28">
      <div className="w-1 h-6 rounded-full bg-gradient-to-b from-[#C9A84C] to-[#E8C97A]" />
      <h2 className="text-lg font-heading font-semibold text-white tracking-tight">{title}</h2>
      <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
    </div>
  );
}

export default function ListingDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [showClaimInfo, setShowClaimInfo] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState({ total: 0, average_rating: 0 });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ reviewer_name: '', rating: 5, text: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewSort, setReviewSort] = useState<'newest' | 'highest' | 'lowest'>('newest');
  const [featuredLoops, setFeaturedLoops] = useState<{ id: string; name: string; slug: string; loop_type: string }[]>([]);
  const [showCallModal, setShowCallModal] = useState(false);
  const [phoneCopied, setPhoneCopied] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());
  const router = useRouter();
  const sectionsRef = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const res = await fetch(`/api/directory/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setListing(data);
        fetch('/api/directory/addons/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listing_id: data.id, event_type: 'view' }),
        }).catch(() => {});
        fetch(`/api/directory/reviews?listing_id=${data.id}`)
          .then(r => r.json())
          .then(d => { setReviews(d.reviews || []); setReviewStats({ total: d.total, average_rating: d.average_rating }); })
          .catch(() => {});
        fetch(`/api/loops?listing_id=${data.id}&limit=5`)
          .then(r => r.json())
          .then(d => setFeaturedLoops(d.loops || []))
          .catch(() => {});
      }
      setLoading(false);
    })();
  }, [slug]);

  const handleImgError = (url: string) => {
    setBrokenImages(prev => new Set(prev).add(url));
  };

  const ImageOrPlaceholder = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
    if (brokenImages.has(src)) {
      return (
        <div className={`bg-gradient-to-br from-[#111111] to-[#1a1a1a] flex items-center justify-center ${className || ''}`}>
          <span className="text-4xl font-heading font-light text-white/10">{alt?.[0] || '?'}</span>
        </div>
      );
    }
    return <img src={src} alt={alt} className={className} onError={() => handleImgError(src)} />;
  };

  const trackEvent = (eventType: string) => {
    if (!listing) return;
    fetch('/api/directory/addons/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: listing.id, event_type: eventType }),
    }).catch(() => {});
  };

  const submitReview = async () => {
    if (!listing) return;
    if (!reviewForm.reviewer_name.trim()) { setReviewMessage('Please enter your name.'); return; }
    if (reviewForm.text.trim().length < 10) { setReviewMessage('Please share more detail — reviews need at least 10 characters explaining your experience.'); return; }
    setSubmittingReview(true);
    setReviewMessage('');
    const res = await fetch('/api/directory/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: listing.id, ...reviewForm }),
    });
    if (res.ok) {
      setReviewMessage('Review submitted! Thank you for your feedback.');
      setShowReviewForm(false);
      setReviewForm({ reviewer_name: '', rating: 5, text: '' });
      const r = await fetch(`/api/directory/reviews?listing_id=${listing.id}`);
      const d = await r.json();
      setReviews(d.reviews || []);
      setReviewStats({ total: d.total, average_rating: d.average_rating });
    } else {
      setReviewMessage('Failed to submit review. Please try again.');
    }
    setSubmittingReview(false);
    setTimeout(() => setReviewMessage(''), 4000);
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center pt-20">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          <span className="text-white/50 font-body text-sm">Loading listing...</span>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center pt-20">
        <div className="text-center">
          <h1 className="text-2xl font-heading font-light text-white mb-3">Listing Not Found</h1>
          <p className="text-white/50 font-body mb-6">This business doesn&apos;t exist in our directory.</p>
          <Link href="/" className="btn-primary px-6 py-3 rounded-xl text-sm">Back to Directory</Link>
        </div>
      </div>
    );
  }

  const photos = listing.gallery_images || [];
  const allPhotos = listing.cover_image_url ? [listing.cover_image_url, ...photos] : photos;
  const googleRating = listing.metadata?.google_rating;
  const googleReviews = listing.metadata?.google_review_count;
  const googleMapsUrl = listing.metadata?.google_maps_url;
  const businessHours = normalizeBusinessHours(listing.business_hours);
  const openStatus = getOpenStatus(businessHours);
  const menuSections = listing.menu as { id: string; name: string; items: { id: string; name: string; description: string; price: string }[] }[] | null;
  const hasHours = businessHours && Object.keys(businessHours).length > 0 && Object.values(businessHours).some((h) => h.closed || h.open || h.display);
  const hasMenu = menuSections && menuSections.length > 0;
  const serviceAreas = listing.tier !== 'free' && listing.metadata?.service_areas && Array.isArray(listing.metadata.service_areas) ? listing.metadata.service_areas as string[] : [];

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-20 pb-16" data-testid="listing-detail-page">

      {/* ═══════════════════════════════════════════════════════════════
          HERO — Photo Mosaic + Business Identity
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative">
        {/* Photo Mosaic Grid */}
        <div className="relative h-72 sm:h-80 md:h-[420px] overflow-hidden">
          {allPhotos.length >= 3 ? (
            <div className="grid grid-cols-4 grid-rows-2 gap-1 h-full">
              <div className="col-span-2 row-span-2 relative overflow-hidden cursor-pointer group" onClick={() => setShowAllPhotos(true)}>
                <ImageOrPlaceholder src={allPhotos[0]} alt={listing.business_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              {allPhotos.slice(1, 5).map((p, i) => (
                <div key={i} className="relative overflow-hidden cursor-pointer group" onClick={() => { setActivePhoto(i + 1); setShowAllPhotos(true); }}>
                  <ImageOrPlaceholder src={p} alt={listing.business_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {i === 3 && allPhotos.length > 5 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white font-heading font-bold text-lg">+{allPhotos.length - 5}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : listing.cover_image_url && !brokenImages.has(listing.cover_image_url) ? (
            <img src={listing.cover_image_url} alt={`${listing.business_name} — ${listing.industry.replace(/-/g, ' ')} in ${listing.city}, ${listing.state}`} className="w-full h-full object-cover" onError={() => handleImgError(listing.cover_image_url!)} />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#111111] to-[#1a1a1a] flex items-center justify-center">
              <span className="text-8xl font-heading font-light text-white/10">{listing.business_name[0]}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-[#0A0A0A]/30 pointer-events-none" />

          {/* Nav overlay */}
          <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
            <button onClick={() => { if (window.history.length > 1 && document.referrer.includes(window.location.host)) { router.back(); } else { router.push('/'); } }} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-sm text-sm text-white/70 hover:text-white border border-white/10 hover:border-white/20 transition-all font-body" style={{ background: 'rgba(10,10,10,0.7)' }} data-testid="back-button">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back
            </button>
            <Link href="/" className="inline-flex items-center gap-1 px-3 py-2 rounded-lg backdrop-blur-sm text-sm text-white/40 hover:text-white border border-white/5 hover:border-white/15 transition-all font-body" style={{ background: 'rgba(10,10,10,0.5)' }} data-testid="back-to-directory">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              Directory
            </Link>
          </div>

          {/* Tier badge */}
          {listing.tier !== 'free' && (
            <div className="absolute top-4 right-4 z-10">
              <span className="px-3 py-1.5 rounded-full text-xs font-heading font-bold uppercase tracking-wider" style={{ background: listing.tier === 'premium' ? 'linear-gradient(135deg, #C9A84C, #E8C97A)' : 'linear-gradient(135deg, #3B82F6, #60A5FA)', color: '#0D1B2A' }}>
                {listing.tier === 'premium' ? 'Premier' : 'Pro'}
              </span>
            </div>
          )}

          {/* Photo count button */}
          {allPhotos.length > 1 && (
            <button onClick={() => setShowAllPhotos(true)} className="absolute bottom-4 right-4 z-10 inline-flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-sm text-sm text-white/80 border border-white/20 hover:border-white/40 transition-all font-body" style={{ background: 'rgba(10,10,10,0.7)' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
              {allPhotos.length} photos
            </button>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          BUSINESS IDENTITY — Name, Rating, Status, Action Buttons
      ═══════════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 p-6 sm:p-8 backdrop-blur-xl"
          style={{ background: 'rgba(10,10,10,0.92)' }}
          data-testid="listing-header"
        >
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Left — Name + Meta */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-[10px] px-2.5 py-1 rounded-full font-heading font-semibold uppercase tracking-wider text-gold/70 border border-gold/20 bg-gold/5">
                  {listing.industry.replace(/-/g, ' ')}
                </span>
                {listing.tier !== 'free' && listing.is_claimed && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-heading font-bold uppercase tracking-wider bg-greenline/15 text-greenline border border-greenline/20" data-testid="verified-badge">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    Verified
                  </span>
                )}
                {openStatus && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-heading font-bold uppercase tracking-wider ${openStatus.isOpen ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/15 text-red-400 border border-red-500/20'}`} data-testid="open-status-badge">
                    <span className={`w-1.5 h-1.5 rounded-full ${openStatus.isOpen ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    {openStatus.label}
                  </span>
                )}
                {listing.has_property_intelligence && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-heading font-bold uppercase tracking-wider" style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.1))', color: '#E8C97A', border: '1px solid rgba(201,168,76,0.3)' }} data-testid="pi-badge">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    Property Intel
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-white mb-2" data-testid="listing-name">
                {listing.business_name}
              </h1>

              {/* Location + subcategories line */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/50 font-body">
                {listing.city && (
                  <span>{listing.city}, {listing.state}</span>
                )}
                {listing.subcategories?.length > 0 && (
                  <span className="text-white/30">·</span>
                )}
                {listing.subcategories?.length > 0 && (
                  <span className="text-white/40">{listing.subcategories.slice(0, 3).join(' · ')}</span>
                )}
              </div>

              {/* Service areas */}
              {serviceAreas.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                  <span className="text-[10px] text-white/30 font-heading uppercase tracking-wider mr-1">Serves</span>
                  {serviceAreas.map((area: string) => (
                    <span key={area} className="inline-block px-2 py-0.5 rounded-full text-[10px] font-heading text-white/60 border border-white/10 bg-white/5">{area}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Right — Rating Block */}
            <div className="flex-shrink-0">
              {(googleRating || reviewStats.average_rating > 0) && (
                <div className="flex items-center gap-4 p-4 rounded-xl border border-gold/15 bg-gold/5">
                  <div className="text-center">
                    <span className="text-3xl font-heading font-bold text-white block">{googleRating || reviewStats.average_rating.toFixed(1)}</span>
                    <Stars rating={googleRating || reviewStats.average_rating} size={16} />
                  </div>
                  <div className="border-l border-gold/15 pl-4">
                    {googleReviews && <p className="text-xs text-white/50 font-body">{googleReviews.toLocaleString()} Google</p>}
                    {reviewStats.total > 0 && <p className="text-xs text-white/50 font-body">{reviewStats.total} GL365</p>}
                    <p className="text-[10px] text-white/25 font-body mt-0.5">reviews</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Action Buttons Row ── */}
          <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-white/5">
            {(listing.address_line1 || listing.city) && (
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent([listing.address_line1, listing.city, listing.state, listing.zip_code].filter(Boolean).join(', '))}`} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('map')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-heading font-semibold text-white border border-white/15 hover:border-gold/30 hover:bg-gold/5 transition-all">
                <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>
                Directions
              </a>
            )}
            <button onClick={() => { if (navigator.share) { navigator.share({ title: listing.business_name, url: window.location.href }); } else { navigator.clipboard.writeText(window.location.href); } }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-heading font-semibold text-white border border-white/15 hover:border-gold/30 hover:bg-gold/5 transition-all">
              <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>
              Share
            </button>
          </div>
        </motion.div>

        {/* ── Section Navigation Bar ── */}
        <div className="mt-6 flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { id: 'overview', label: 'Overview' },
            ...(allPhotos.length > 0 ? [{ id: 'photos', label: 'Photos' }] : []),
            { id: 'reviews', label: 'Reviews' },
            ...(hasHours ? [{ id: 'hours', label: 'Hours' }] : []),
            ...(hasMenu ? [{ id: 'menu', label: 'Menu' }] : []),
            { id: 'location', label: 'Location' },
          ].map(nav => (
            <button
              key={nav.id}
              onClick={() => scrollToSection(nav.id)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-sm font-heading font-medium transition-all ${
                activeSection === nav.id
                  ? 'bg-gold/15 text-gold border border-gold/25'
                  : 'text-white/40 hover:text-white/60 border border-transparent hover:border-white/10'
              }`}
            >
              {nav.label}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════
            MAIN CONTENT — Two Column Layout
        ═══════════════════════════════════════════════════════════ */}
        <div className="grid lg:grid-cols-3 gap-8 mt-8">
          {/* ── LEFT COLUMN — Main Content ── */}
          <div className="lg:col-span-2 space-y-8">

            {/* ─── OVERVIEW / ABOUT ─── */}
            <motion.div
              id="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="scroll-mt-28"
            >
              <SectionDivider title="About" />
              <div className="mt-4 rounded-2xl border border-white/8 p-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
                {listing.description ? (
                  <p className="text-sm sm:text-base text-white/65 font-body leading-relaxed">{listing.description}</p>
                ) : (
                  <div className="text-sm text-white/40 font-body">
                    <p>This business hasn&apos;t added a description yet.</p>
                    {!listing.is_claimed && (
                      <p className="mt-2">
                        Are you the owner?{' '}
                        <button onClick={() => setShowClaimInfo(true)} className="text-gold hover:text-gold-300 underline underline-offset-2 font-medium transition-colors">
                          Claim this listing
                        </button>{' '}
                        to add your business details.
                      </p>
                    )}
                  </div>
                )}

              </div>
            </motion.div>

            {/* ─── SERVICES & CATEGORIES ─── */}
            {listing.subcategories?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <SectionDivider title="Services & Specialties" />
                <div className="flex flex-wrap gap-2 mt-4">
                  {listing.subcategories.map((sub, i) => (
                    <span key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white/60 border border-white/10 hover:border-gold/20 hover:bg-gold/5 transition-all font-body">
                      <svg className="w-3.5 h-3.5 text-gold/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {sub}
                    </span>
                  ))}
                  {listing.tags?.length > 0 && listing.tags.map((tag, i) => (
                    <span key={`tag-${i}`} className="px-3 py-2 rounded-xl text-xs text-white/40 border border-white/5 font-body">{tag}</span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ─── DIRECTORY BADGES ─── */}
            {listing.directory_badges?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
                <SectionDivider title="Achievements & Badges" />
                <div className="flex flex-wrap gap-3 mt-4">
                  {listing.directory_badges.map(badge => (
                    <div key={badge.id} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border font-heading text-sm font-semibold" style={{ borderColor: `${badge.badge_color}30`, background: `${badge.badge_color}10`, color: badge.badge_color }}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm7 14l5.196-3L12 8.804 6.804 14 12 17z" /></svg>
                      {badge.badge_label}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ─── FEATURED VIDEO — Premium only ─── */}
            {listing.tier === 'premium' && listing.is_claimed && listing.metadata?.video_url && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <SectionDivider title="Featured Video" />
                <div className="mt-4 rounded-2xl border border-gold/20 overflow-hidden" style={{ background: 'rgba(201,168,76,0.04)' }} data-testid="featured-video">
                  <div className="relative aspect-video">
                    {listing.metadata.video_url.includes('youtube.com') || listing.metadata.video_url.includes('youtu.be') ? (
                      <iframe src={listing.metadata.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={`${listing.business_name} video`} />
                    ) : listing.metadata.video_url.includes('vimeo.com') ? (
                      <iframe src={listing.metadata.video_url.replace('vimeo.com/', 'player.vimeo.com/video/')} className="w-full h-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title={`${listing.business_name} video`} />
                    ) : (
                      <video src={listing.metadata.video_url} controls className="w-full h-full object-cover" poster={listing.cover_image_url || undefined}>Your browser does not support the video tag.</video>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── PHOTO GALLERY ─── */}
            {allPhotos.length > 0 && (
              <motion.div id="photos" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="scroll-mt-28">
                <SectionDivider title={`Photos (${allPhotos.length})`} />
                <div className="mt-4 rounded-2xl border border-white/10 overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }} data-testid="photo-gallery">
                  <div className="relative aspect-video">
                    <img src={allPhotos[activePhoto]} alt={`${listing.business_name} photo ${activePhoto + 1}`} className="w-full h-full object-cover" />
                    {allPhotos.length > 1 && (
                      <>
                        <button onClick={() => setActivePhoto(p => p > 0 ? p - 1 : allPhotos.length - 1)} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white border border-white/20 hover:border-white/40 transition-all" style={{ background: 'rgba(10,10,10,0.7)' }}>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <button onClick={() => setActivePhoto(p => p < allPhotos.length - 1 ? p + 1 : 0)} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white border border-white/20 hover:border-white/40 transition-all" style={{ background: 'rgba(10,10,10,0.7)' }}>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                        </button>
                      </>
                    )}
                    <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-xs font-heading font-semibold text-white/80 backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.6)' }}>
                      {activePhoto + 1} / {allPhotos.length}
                    </div>
                  </div>
                  {allPhotos.length > 1 && (
                    <div className="flex gap-2 p-3 overflow-x-auto">
                      {allPhotos.map((photo, i) => (
                        <button key={i} onClick={() => setActivePhoto(i)} className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${i === activePhoto ? 'border-gold' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                          <img src={photo} alt={`${listing.business_name} photo ${i + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ─── BUSINESS HOURS ─── */}
            {hasHours && businessHours && (
              <motion.div id="hours" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="scroll-mt-28">
                <SectionDivider title="Business Hours" />
                <div className="mt-4 rounded-2xl border border-white/10 p-5" style={{ background: 'rgba(255,255,255,0.03)' }} data-testid="business-hours">
                  <div className="space-y-1">
                    {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(day => {
                      const h = businessHours[day];
                      const dayNames: Record<string, string> = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };
                      const todayKey = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase().slice(0, 3);
                      const isToday = day === todayKey;
                      return (
                        <div key={day} className={`flex items-center justify-between py-2.5 px-4 rounded-lg ${isToday ? 'bg-[rgba(201,168,76,0.08)] border border-[rgba(201,168,76,0.15)]' : ''}`}>
                          <span className={`text-sm font-body ${isToday ? 'text-[#C9A84C] font-semibold' : 'text-white/60'}`}>
                            {dayNames[day]}
                            {isToday && <span className="ml-2 text-[10px] text-[#C9A84C]/60 uppercase">Today</span>}
                          </span>
                          {h?.closed ? (
                            <span className="text-sm text-white/30 font-body">Closed</span>
                          ) : h?.display ? (
                            <span className={`text-sm font-body ${isToday ? 'text-white font-medium' : 'text-white/60'}`}>{h.display}</span>
                          ) : (
                            <span className="text-sm text-white/20 font-body">—</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── MENU / PRICING ─── */}
            {hasMenu && menuSections && (
              <motion.div id="menu" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="scroll-mt-28">
                <SectionDivider title="Menu & Pricing" />
                <div className="mt-4 rounded-2xl border border-white/10 p-6" style={{ background: 'rgba(255,255,255,0.03)' }} data-testid="menu-section">
                  <div className="space-y-8">
                    {menuSections.map(section => (
                      <div key={section.id}>
                        <h4 className="text-base font-heading font-semibold text-[#C9A84C] mb-4 pb-2 border-b border-[rgba(201,168,76,0.15)]">{section.name}</h4>
                        <div className="space-y-3">
                          {section.items?.map(item => (
                            <div key={item.id} className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-body text-white font-medium">{item.name}</span>
                                {item.description && <p className="text-xs text-white/40 font-body mt-0.5">{item.description}</p>}
                              </div>
                              {item.price && <span className="text-sm font-heading font-semibold text-[#C9A84C] flex-shrink-0">${item.price}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── REVIEWS ─── */}
            <motion.div id="reviews" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="scroll-mt-28">
              <SectionDivider title="Reviews" />
              <div className="mt-4 rounded-2xl border border-white/10 p-6" style={{ background: 'rgba(255,255,255,0.03)' }} data-testid="gl365-reviews-section">
                {/* Write review + sort controls */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    {[
                      { id: 'newest' as const, label: 'Newest' },
                      { id: 'highest' as const, label: 'Highest' },
                      { id: 'lowest' as const, label: 'Lowest' },
                    ].map(s => (
                      <button key={s.id} onClick={() => setReviewSort(s.id)} className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all font-body ${reviewSort === s.id ? 'bg-gold/15 text-gold border border-gold/25' : 'text-white/35 border border-white/10 hover:text-white/50 hover:border-white/20'}`} data-testid={`sort-${s.id}`}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setShowReviewForm(!showReviewForm)} className="px-4 py-2 rounded-lg text-xs font-semibold text-gold border border-gold/30 hover:bg-gold/5 transition-all font-heading" data-testid="write-review-btn">
                    Write a Review
                  </button>
                </div>

                {/* Rating Summary */}
                {reviewStats.total > 0 && (() => {
                  const ratingCounts = [5,4,3,2,1].map(star => ({ star, count: reviews.filter(r => r.rating === star).length }));
                  const maxCount = Math.max(...ratingCounts.map(r => r.count), 1);
                  return (
                    <div className="flex gap-6 mb-6 pb-6 border-b border-white/5">
                      <div className="text-center flex-shrink-0" data-testid="rating-summary">
                        <span className="text-4xl font-heading font-bold text-white block">{reviewStats.average_rating}</span>
                        <Stars rating={reviewStats.average_rating} size={14} />
                        <span className="text-[10px] text-white/30 font-body mt-1 block">{reviewStats.total} review{reviewStats.total !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        {ratingCounts.map(({ star, count }) => (
                          <div key={star} className="flex items-center gap-2" data-testid={`rating-bar-${star}`}>
                            <span className="text-[11px] text-white/40 font-body w-3 text-right">{star}</span>
                            <svg className="w-3 h-3 flex-shrink-0" fill="#C9A84C" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                            <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                              <div className="h-full rounded-full bg-gold/70 transition-all duration-500" style={{ width: `${(count / maxCount) * 100}%` }} />
                            </div>
                            <span className="text-[10px] text-white/25 font-body w-6 text-right">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Review message */}
                {reviewMessage && (
                  <div className={`mb-4 px-3 py-2 rounded-lg text-xs font-body ${reviewMessage.includes('Thank') ? 'bg-greenline/10 text-greenline border border-greenline/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>{reviewMessage}</div>
                )}

                {/* Review Form */}
                {showReviewForm && (
                  <div className="mb-6 p-4 rounded-xl border border-gold/10 bg-[#0A0A0A]/50 space-y-3" data-testid="review-form">
                    <input value={reviewForm.reviewer_name} onChange={e => setReviewForm({ ...reviewForm, reviewer_name: e.target.value })} placeholder="Your name" className="w-full px-4 py-3 rounded-xl text-sm bg-white/5 text-white border border-white/10 focus:outline-none focus:border-gold/30 font-body placeholder-white/30" data-testid="review-name-input" />
                    <div>
                      <label className="text-xs text-white/40 font-heading uppercase tracking-wider mb-1 block">Rating</label>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(s => (
                          <button key={s} onClick={() => setReviewForm({ ...reviewForm, rating: s })} className="p-1" data-testid={`star-${s}`}>
                            <svg className="w-7 h-7 transition-colors" fill={s <= reviewForm.rating ? '#C9A84C' : 'none'} stroke={s <= reviewForm.rating ? '#C9A84C' : '#555'} strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea value={reviewForm.text} onChange={e => setReviewForm({ ...reviewForm, text: e.target.value })} placeholder="Share your experience (at least 10 characters)..." rows={3} className="w-full px-4 py-3 rounded-xl text-sm bg-white/5 text-white border border-white/10 focus:outline-none focus:border-gold/30 font-body resize-none placeholder-white/30" data-testid="review-text-input" />
                    <div className="flex gap-2">
                      <button onClick={submitReview} disabled={submittingReview} className="px-5 py-2.5 rounded-xl text-xs font-bold font-heading text-[#0A0A0A] transition-all active:scale-95 hover:scale-[1.03] disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C97A)', boxShadow: '0 0 16px rgba(201,168,76,0.3)' }} data-testid="submit-review-btn">
                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                      </button>
                      <button onClick={() => setShowReviewForm(false)} className="px-4 py-2.5 text-xs text-white/40 hover:text-white/60 transition font-body">Cancel</button>
                    </div>
                  </div>
                )}

                {/* Reviews List */}
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {[...reviews].sort((a, b) => { if (reviewSort === 'highest') return b.rating - a.rating; if (reviewSort === 'lowest') return a.rating - b.rating; return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); }).map((review) => (
                      <div key={review.id} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-9 h-9 rounded-full bg-gold/10 flex items-center justify-center text-xs font-heading font-bold text-gold">{review.reviewer_name[0]?.toUpperCase()}</div>
                          <div>
                            <span className="text-sm font-heading font-semibold text-white block">{review.reviewer_name}</span>
                            <div className="flex items-center gap-2">
                              <Stars rating={review.rating} size={12} />
                              <span className="text-[10px] text-white/20 font-body">{new Date(review.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-white/60 font-body leading-relaxed pl-12">{review.text}</p>
                        {review.response && (
                          <div className="mt-3 ml-12 pl-3 border-l-2 border-gold/20">
                            <p className="text-[10px] text-gold/50 font-heading uppercase tracking-wider mb-1">Business Response</p>
                            <p className="text-xs text-white/50 font-body leading-relaxed">{review.response.text}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-white/30 font-body text-center py-8">No GL365 reviews yet. Be the first to share your experience!</p>
                )}
              </div>
            </motion.div>

            {/* ─── CLAIM THIS LISTING ─── */}
            {!listing.is_claimed && (listing as any).is_claimable !== false && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} data-testid="claim-section">
                <div className="rounded-2xl border border-gold/15 p-6" style={{ background: 'rgba(201,168,76,0.04)' }}>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl border border-gold/20 bg-gold/5 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-gold/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-heading font-semibold text-white mb-1">Is this your business?</h3>
                      <p className="text-xs text-white/40 font-body leading-relaxed mb-3">Claim this listing to update your information, add photos, respond to reviews, and unlock premium features.</p>
                      {showClaimInfo ? (
                        <div className="p-4 rounded-xl border border-gold/10 bg-[#0A0A0A]/50 space-y-2">
                          <p className="text-xs text-white/60 font-body">Email us to claim this listing:</p>
                          <a href={`mailto:greenline365help@gmail.com?subject=Claim%20Listing%3A%20${encodeURIComponent(listing.business_name)}&body=I%20would%20like%20to%20claim%20the%20listing%20for%20${encodeURIComponent(listing.business_name)}%20(${listing.city}%2C%20${listing.state}).%0A%0AMy%20name%3A%20%0AMy%20role%20at%20the%20business%3A%20`} className="inline-flex items-center gap-2 text-gold hover:text-gold-300 text-sm font-medium transition-colors" data-testid="claim-email-link">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                            greenline365help@gmail.com
                          </a>
                        </div>
                      ) : (
                        <button onClick={() => setShowClaimInfo(true)} className="px-4 py-2 rounded-lg text-xs font-semibold text-gold border border-gold/30 hover:bg-gold/5 transition-all font-heading" data-testid="claim-this-btn">Claim This Listing</button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── FEATURED IN LOOPS ─── */}
            {featuredLoops.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} data-testid="featured-in-loops">
                <SectionDivider title={`Featured in ${featuredLoops.length} Experience${featuredLoops.length !== 1 ? 's' : ''}`} />
                <div className="flex flex-wrap gap-2 mt-4">
                  {featuredLoops.map(loop => (
                    <Link key={loop.id} href={`/loops/${loop.slug}`} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gold/20 bg-gold/5 hover:bg-gold/10 hover:border-gold/40 transition-all duration-300 group">
                      <svg className="w-3.5 h-3.5 text-gold/60 group-hover:text-gold transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                      <span className="text-xs font-heading font-medium text-gold/80 group-hover:text-gold transition-colors">{loop.name}</span>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ─── SIMILAR BUSINESSES ─── */}
            {listing.related?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} data-testid="related-listings">
                <SectionDivider title={`Similar Businesses${listing.city ? ` in ${listing.city}` : ''}`} />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                  {listing.related.slice(0, 4).map((r) => (
                    <Link key={r.id} href={`/listing/${r.slug}`} className="rounded-xl border border-white/5 overflow-hidden hover:border-[rgba(201,168,76,0.25)] hover:scale-[1.02] transition-all duration-300 ease-out group" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div className="relative h-28 overflow-hidden">
                        {r.cover_image_url ? (
                          <ImageOrPlaceholder src={r.cover_image_url} alt={r.business_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#111111] to-[#1a1a1a] flex items-center justify-center"><span className="text-2xl font-heading font-light text-white/10">{r.business_name[0]}</span></div>
                        )}
                        {r.avg_feedback_rating > 0 && (
                          <span className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(201,168,76,0.9)', color: '#1a1a1a' }}>
                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                            {r.avg_feedback_rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-heading font-semibold text-gold truncate">{r.business_name}</p>
                        <p className="text-[10px] text-white/35 font-body mt-0.5">{r.city}{r.state ? `, ${r.state}` : ''}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}

          </div>

          {/* ── RIGHT SIDEBAR — Contact & Map ── */}
          <div className="space-y-6">
            <motion.div
              id="location"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-white/10 overflow-hidden sticky top-24 scroll-mt-28"
              style={{ background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(16px)' }}
              data-testid="contact-card"
            >
              {/* Map at top of sidebar */}
              {(listing.address_line1 || listing.city) && (
                <div data-testid="listing-map">
                  <div className="aspect-[4/3] w-full">
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&q=${encodeURIComponent([listing.business_name, listing.address_line1, listing.city, listing.state, listing.zip_code].filter(Boolean).join(', '))}`}
                      title={`Map showing ${listing.business_name} location`}
                    />
                  </div>
                  {listing.address_line1 && (
                    <div className="px-5 py-3 border-b border-white/5">
                      <p className="text-xs text-white/50 font-body">{listing.address_line1}, {listing.city}, {listing.state} {listing.zip_code}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Contact details */}
              <div className="p-5 space-y-3">
                <h3 className="text-sm font-heading font-semibold text-white uppercase tracking-wider mb-4">Contact</h3>

                {/* CTA — Call Now */}
                {listing.phone && (
                  <button onClick={() => { setShowCallModal(true); trackEvent('call'); }} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold font-heading text-[#0A0A0A] transition-all hover:scale-[1.02] cursor-pointer" style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C97A)', boxShadow: '0 0 16px rgba(201,168,76,0.3)' }} data-testid="sidebar-call-now">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    Call Now
                  </button>
                )}

                {/* Contact rows */}
                {listing.phone && (
                  <button onClick={() => { setShowCallModal(true); trackEvent('call'); }} className="flex items-center gap-3 w-full p-3 rounded-xl border border-white/10 hover:border-gold/30 hover:bg-gold/5 transition-all group text-left cursor-pointer" data-testid="contact-phone">
                    <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    </div>
                    <div>
                      <span className="text-xs text-white/40 font-body block">Phone</span>
                      <span className="text-sm text-white font-medium font-body group-hover:text-gold transition-colors">{listing.phone}</span>
                    </div>
                  </button>
                )}

                {listing.website && (
                  <a href={ensureProtocol(listing.website)} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('website')} className="flex items-center gap-3 w-full p-3 rounded-xl border border-white/10 hover:border-gold/30 hover:bg-gold/5 transition-all group" data-testid="contact-website">
                    <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3" /></svg>
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs text-white/40 font-body block">Website</span>
                      <span className="text-sm text-white font-medium font-body group-hover:text-gold transition-colors truncate block">{cleanDomain(listing.website)}</span>
                    </div>
                  </a>
                )}

                {listing.email && (
                  <a href={`mailto:${listing.email}`} className="flex items-center gap-3 w-full p-3 rounded-xl border border-white/10 hover:border-gold/30 hover:bg-gold/5 transition-all group">
                    <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs text-white/40 font-body block">Email</span>
                      <span className="text-sm text-white font-medium font-body group-hover:text-gold transition-colors truncate block">{listing.email}</span>
                    </div>
                  </a>
                )}

                {/* Get Directions */}
                {(listing.address_line1 || listing.city) && (
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent([listing.address_line1, listing.city, listing.state, listing.zip_code].filter(Boolean).join(', '))}`} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('map')} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-xs font-semibold font-heading text-white border border-white/10 hover:border-gold/30 hover:bg-gold/5 transition-all" data-testid="get-directions-btn">
                    <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>
                    Get Directions
                  </a>
                )}
              </div>

              {/* Verified / Claimed status */}
              <div className="px-5 py-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                  {listing.is_claimed ? (
                    <>
                      <svg className="w-4 h-4 text-greenline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                      <span className="text-xs text-greenline font-heading font-semibold">Claimed & Verified</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                      <span className="text-xs text-white/30 font-body">Unclaimed listing</span>
                    </>
                  )}
                </div>
              </div>


              {/* Powered by GL365 */}
              <div className="px-5 py-3 border-t border-white/5 text-center">
                <p className="text-[10px] text-white/15 font-body">Powered by GreenLine365</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MODALS
      ═══════════════════════════════════════════════════════════════ */}

      {/* Click-to-Call Modal */}
      {showCallModal && listing.phone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { setShowCallModal(false); setPhoneCopied(false); }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-sm rounded-2xl border border-white/10 p-6 text-center" style={{ background: 'rgba(20,20,20,0.98)', backdropFilter: 'blur(24px)' }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { setShowCallModal(false); setPhoneCopied(false); }} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/40 hover:text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))' }}>
              <svg className="w-7 h-7 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            </div>
            <h3 className="text-lg font-heading font-semibold text-white mb-1">Call {listing.business_name}</h3>
            <p className="text-white/40 text-xs font-body mb-5">via GreenLine365 Directory</p>
            <div className="rounded-xl border border-gold/20 bg-gold/5 py-3 px-4 mb-4">
              <span className="text-2xl font-heading font-bold text-gold tracking-wide">{listing.phone}</span>
            </div>
            <div className="space-y-2">
              <button onClick={() => { navigator.clipboard.writeText(listing.phone!).then(() => { setPhoneCopied(true); setTimeout(() => setPhoneCopied(false), 2000); }); }} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold font-heading text-[#0A0A0A] transition-all hover:scale-[1.02] cursor-pointer" style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C97A)', boxShadow: '0 0 16px rgba(201,168,76,0.3)' }}>
                {phoneCopied ? (
                  <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Copied!</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy Number</>
                )}
              </button>
              <a href={`tel:${cleanPhone(listing.phone)}`} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold font-heading text-gold border border-gold/30 hover:bg-gold/5 transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                Open Dialer
              </a>
            </div>
            <p className="text-[10px] text-white/20 font-body mt-4">Powered by GreenLine365</p>
          </motion.div>
        </div>
      )}

      {/* Full Photo Gallery Lightbox */}
      {showAllPhotos && allPhotos.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" onClick={() => setShowAllPhotos(false)}>
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 className="text-sm font-heading font-semibold text-white">{listing.business_name} — Photos</h3>
            <button onClick={() => setShowAllPhotos(false)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors text-white/60 hover:text-white">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setActivePhoto(p => p > 0 ? p - 1 : allPhotos.length - 1)} className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all mr-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="flex-1 max-w-4xl max-h-[75vh] relative">
              <img src={allPhotos[activePhoto]} alt={`${listing.business_name} photo ${activePhoto + 1}`} className="w-full h-full object-contain rounded-lg" />
            </div>
            <button onClick={() => setActivePhoto(p => p < allPhotos.length - 1 ? p + 1 : 0)} className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all ml-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <div className="flex gap-2 p-4 overflow-x-auto justify-center border-t border-white/10">
            {allPhotos.map((photo, i) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); setActivePhoto(i); }} className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${i === activePhoto ? 'border-gold' : 'border-transparent opacity-50 hover:opacity-80'}`}>
                <img src={photo} alt={`thumb ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

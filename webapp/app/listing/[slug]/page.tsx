'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

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
  business_hours: Record<string, { open?: string; close?: string; closed?: boolean }> | null;
  menu_sections: MenuSection[];
  directory_badges: { id: string; badge_type: string; badge_label: string; badge_color: string }[];
  related: RelatedListing[];
}

interface MenuSection {
  id: string;
  name: string;
  position: number;
  items: MenuItem[];
}

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price?: string;
  photo_url?: string;
  position: number;
}

type TabId = 'overview' | 'photos' | 'reviews' | 'menu';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
const DAY_LABELS: Record<string, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
  fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
};
const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function getOpenStatus(hours: Record<string, { open?: string; close?: string; closed?: boolean }> | null): { isOpen: boolean; label: string } {
  if (!hours) return { isOpen: false, label: '' };
  const now = new Date();
  const dayKey = DAY_KEYS[now.getDay()];
  const today = hours[dayKey];
  if (!today || today.closed) return { isOpen: false, label: 'Closed today' };
  if (!today.open || !today.close) return { isOpen: false, label: '' };
  const [oh, om] = today.open.split(':').map(Number);
  const [ch, cm] = today.close.split(':').map(Number);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const openMin = oh * 60 + om;
  const closeMin = ch * 60 + cm;
  if (nowMin >= openMin && nowMin < closeMin) return { isOpen: true, label: `Open \u00b7 Closes ${today.close}` };
  if (nowMin < openMin) return { isOpen: false, label: `Closed \u00b7 Opens ${today.open}` };
  return { isOpen: false, label: 'Closed now' };
}

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return m === 0 ? `${hour} ${ampm}` : `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
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
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingForm, setBookingForm] = useState({ full_name: '', email: '', phone: '', preferred_datetime: '', notes: '' });
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingMessage, setBookingMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const res = await fetch(`/api/directory/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setListing(data);
        // Track page view
        fetch('/api/directory/addons/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listing_id: data.id, event_type: 'view' }),
        }).catch(() => {});
        // Load reviews
        fetch(`/api/directory/reviews?listing_id=${data.id}`)
          .then(r => r.json())
          .then(d => { setReviews(d.reviews || []); setReviewStats({ total: d.total, average_rating: d.average_rating }); })
          .catch(() => {});
      }
      setLoading(false);
    })();
  }, [slug]);

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
    if (!reviewForm.reviewer_name.trim()) {
      setReviewMessage('Please enter your name.');
      return;
    }
    if (reviewForm.text.trim().length < 10) {
      setReviewMessage('Please share more detail — reviews need at least 10 characters explaining your experience.');
      return;
    }
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
      // Reload reviews
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

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight-900 flex items-center justify-center pt-20">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          <span className="text-white/50 font-body text-sm">Loading listing...</span>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-midnight-900 flex items-center justify-center pt-20">
        <div className="text-center">
          <h1 className="text-2xl font-heading font-light text-white mb-3">Listing Not Found</h1>
          <p className="text-white/50 font-body mb-6">This business doesn&apos;t exist in our directory.</p>
          <Link href="/" className="btn-primary px-6 py-3 rounded-xl text-sm">Back to Directory</Link>
        </div>
      </div>
    );
  }

  const photos = listing.gallery_images || [];
  const googleRating = listing.metadata?.google_rating;
  const googleReviews = listing.metadata?.google_review_count;
  const googleMapsUrl = listing.metadata?.google_maps_url;
  const openStatus = useMemo(() => getOpenStatus(listing.business_hours), [listing.business_hours]);
  const hasMenu = listing.menu_sections && listing.menu_sections.length > 0;
  const hasHours = listing.business_hours && Object.keys(listing.business_hours).length > 0;

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    ...(photos.length > 0 ? [{ id: 'photos' as TabId, label: 'Photos', count: listing.total_photos_available || photos.length }] : []),
    { id: 'reviews', label: 'Reviews', count: reviewStats.total || undefined },
    ...(hasMenu ? [{ id: 'menu' as TabId, label: 'Menu' }] : []),
  ];

  const submitBooking = async () => {
    if (!listing || !bookingForm.full_name.trim() || !bookingForm.email.trim() || !bookingForm.preferred_datetime) {
      setBookingMessage('Please fill in all required fields.');
      return;
    }
    setBookingSubmitting(true);
    setBookingMessage('');
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bookingForm,
          business_name: listing.business_name,
          industry: listing.industry,
          source: 'listing',
          needs: ['Appointment'],
        }),
      });
      if (res.ok) {
        setBookingMessage('Request sent! The business will confirm your appointment.');
        setShowBookingForm(false);
        setBookingForm({ full_name: '', email: '', phone: '', preferred_datetime: '', notes: '' });
        trackEvent('booking');
      } else {
        const data = await res.json().catch(() => ({}));
        setBookingMessage(data.error || 'Could not submit request. Please try again.');
      }
    } catch {
      setBookingMessage('Network error. Please try again.');
    }
    setBookingSubmitting(false);
    setTimeout(() => setBookingMessage(''), 5000);
  };

  return (
    <div className="min-h-screen bg-midnight-900 pt-20 pb-16" data-testid="listing-detail-page">
      {/* Hero / Cover Image */}
      <section className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
        {listing.cover_image_url ? (
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ duration: 8, ease: 'easeOut' }}
          >
            <Image
              src={listing.cover_image_url}
              alt={`${listing.business_name} — ${listing.industry.replace(/-/g, ' ')} in ${listing.city}, ${listing.state}`}
              fill
              className="object-cover"
              sizes="100vw"
            />
          </motion.div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-midnight-800 to-charcoal-800 flex items-center justify-center">
            <span className="text-8xl font-heading font-light text-white/10">{listing.business_name[0]}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-midnight-900 via-midnight-900/40 to-transparent" />

        {/* Back button + Directory home */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <button
            onClick={() => {
              // Safe back: only go back if there's internal history, otherwise go to directory
              if (window.history.length > 1 && document.referrer.includes(window.location.host)) {
                router.back();
              } else {
                router.push('/');
              }
            }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-sm text-sm text-white/70 hover:text-white border border-white/10 hover:border-white/20 transition-all font-body"
            style={{ background: 'rgba(13,27,42,0.7)' }}
            data-testid="back-button"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg backdrop-blur-sm text-sm text-white/40 hover:text-white border border-white/5 hover:border-white/15 transition-all font-body"
            style={{ background: 'rgba(13,27,42,0.5)' }}
            data-testid="back-to-directory"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            Directory
          </Link>
        </div>

        {/* Tier badge — with shimmer */}
        {listing.tier !== 'free' && (
          <motion.div
            className="absolute top-4 right-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, type: 'spring' }}
          >
            <span
              className="relative px-3 py-1.5 rounded-full text-xs font-heading font-bold uppercase tracking-wider overflow-hidden inline-flex"
              style={{
                background: listing.tier === 'premium' ? 'linear-gradient(135deg, #C9A96E, #E6D8B5)' : 'linear-gradient(135deg, #3B82F6, #60A5FA)',
                color: '#0D1B2A',
              }}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer" />
              <span className="relative z-10">{listing.tier === 'premium' ? 'Premier' : 'Pro'}</span>
            </span>
          </motion.div>
        )}
      </section>

      <div className="max-w-6xl mx-auto px-6 -mt-16 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Business Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/10 p-6 backdrop-blur-xl"
              style={{ background: 'rgba(13,27,42,0.9)' }}
              data-testid="listing-header"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <span className="text-xs px-3 py-1 rounded-full font-heading font-semibold uppercase tracking-wider text-gold/80 border border-gold/25 bg-gold/5">
                    {listing.industry.replace(/-/g, ' ')}
                  </span>
                  <h1 className="text-3xl sm:text-4xl font-heading font-bold text-white mt-3 mb-2 tracking-tight" data-testid="listing-name">
                    {listing.business_name}
                  </h1>
                  {listing.city && (
                    <div className="flex items-center gap-2 text-white/50 text-sm font-body">
                      <svg className="w-4 h-4 text-gold/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                      {listing.city}, {listing.state} {listing.zip_code}
                      {listing.tier !== 'free' && listing.is_claimed && (
                        <motion.span
                          className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full text-[10px] font-heading font-bold uppercase tracking-wider bg-greenline/15 text-greenline border border-greenline/20"
                          data-testid="verified-badge"
                          animate={{ boxShadow: ['0 0 0px rgba(201,169,110,0)', '0 0 8px rgba(201,169,110,0.3)', '0 0 0px rgba(201,169,110,0)'] }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                          Verified
                        </motion.span>
                      )}
                    </div>
                  )}
                </div>

                {/* Rating — with shimmer glint */}
                {googleRating && (
                  <div className="flex flex-col items-end gap-1">
                    <motion.div
                      className="relative flex items-center gap-2 px-3 py-2 rounded-xl border border-gold/20 bg-gold/5 overflow-hidden"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/10 to-transparent animate-shimmer" />
                      <svg className="w-5 h-5 text-gold relative z-10" fill="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                      <span className="text-xl font-heading font-bold text-white relative z-10">{googleRating}</span>
                    </motion.div>
                    {googleReviews && (
                      <span className="text-[10px] text-white/30 font-body">{googleReviews.toLocaleString()} Google reviews</span>
                    )}
                  </div>
                )}
              </div>

              {/* Subcategories */}
              {listing.subcategories?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {listing.subcategories.map((sub, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-xs text-white/50 border border-white/10 font-body">{sub}</span>
                  ))}
                </div>
              )}

              {/* Description */}
              {listing.description && (
                <p className="text-sm text-white/70 font-body leading-relaxed mt-4">{listing.description}</p>
              )}

              {/* Badges — with shimmer */}
              {listing.has_property_intelligence && (
                <div className="mt-4">
                  <span
                    className="relative inline-flex items-center gap-1.5 font-semibold rounded-full px-3 py-1.5 text-xs overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #C9A96E, #E6D8B5)', color: '#fff' }}
                    data-testid="pi-badge"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                    <svg className="w-3.5 h-3.5 relative z-10" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    <span className="relative z-10">Property Intelligence Verified</span>
                  </span>
                </div>
              )}

              {/* Open/Closed status — quick glance */}
              {hasHours && openStatus.label && (
                <div className="mt-4 flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-semibold ${openStatus.isOpen ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    <motion.span
                      className={`w-2 h-2 rounded-full ${openStatus.isOpen ? 'bg-emerald-400' : 'bg-red-400'}`}
                      animate={openStatus.isOpen ? { opacity: [1, 0.4, 1] } : {}}
                      transition={openStatus.isOpen ? { duration: 2, repeat: Infinity } : {}}
                    />
                    {openStatus.label}
                  </span>
                </div>
              )}
            </motion.div>

            {/* ─── TAB NAVIGATION ─── */}
            <div className="flex gap-1 border-b border-white/10 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-5 py-3 text-sm font-heading font-semibold whitespace-nowrap transition-colors ${activeTab === tab.id ? 'text-gold' : 'text-white/40 hover:text-white/60'}`}
                  data-testid={`tab-${tab.id}`}
                >
                  {tab.label}
                  {tab.count != null && (
                    <span className={`ml-1.5 text-[10px] font-body ${activeTab === tab.id ? 'text-gold/60' : 'text-white/25'}`}>
                      {tab.count}
                    </span>
                  )}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="tab-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* ─── TAB CONTENT ─── */}
            <AnimatePresence mode="wait">

            {/* ─── OVERVIEW TAB ─── */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Hours Module */}
                {hasHours && listing.business_hours && (
                  <div
                    className="rounded-2xl border border-white/10 p-6"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                    data-testid="hours-section"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-heading font-semibold text-white uppercase tracking-wider">Business Hours</h3>
                      {openStatus.label && (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-heading font-semibold ${openStatus.isOpen ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${openStatus.isOpen ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          {openStatus.isOpen ? 'Open Now' : 'Closed'}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {DAY_ORDER.map((day) => {
                        const h = listing.business_hours![day];
                        const isToday = DAY_KEYS[new Date().getDay()] === day;
                        return (
                          <div
                            key={day}
                            className={`flex items-center justify-between py-2 px-3 rounded-lg text-sm font-body transition-colors ${isToday ? 'bg-gold/5 border border-gold/10' : ''}`}
                          >
                            <span className={`${isToday ? 'text-gold font-semibold' : 'text-white/50'}`}>
                              {DAY_LABELS[day]}
                            </span>
                            <span className={`${isToday ? 'text-white font-medium' : 'text-white/40'}`}>
                              {!h || h.closed ? 'Closed' : `${formatTime(h.open!)} \u2013 ${formatTime(h.close!)}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Directory Badges */}
                {listing.directory_badges?.length > 0 && (
                  <div
                    className="rounded-2xl border border-white/10 p-6"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                    data-testid="badges-section"
                  >
                    <h3 className="text-sm font-heading font-semibold text-white uppercase tracking-wider mb-4">Certifications & Badges</h3>
                    <div className="flex flex-wrap gap-3">
                      {listing.directory_badges.map((badge) => (
                        <motion.span
                          key={badge.id}
                          className="relative inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-heading font-semibold border overflow-hidden"
                          style={{
                            borderColor: `${badge.badge_color}33`,
                            background: `${badge.badge_color}0D`,
                            color: badge.badge_color,
                          }}
                          whileHover={{ scale: 1.05 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                        >
                          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                          <svg className="w-3.5 h-3.5 relative z-10" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                          <span className="relative z-10">{badge.badge_label}</span>
                        </motion.span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Claim / Unclaimed Section — Reframed */}
                {!listing.is_claimed && (listing as any).is_claimable !== false && (
                  <div
                    className="rounded-2xl border border-gold/15 p-6"
                    style={{ background: 'rgba(201,169,110,0.04)' }}
                    data-testid="claim-section"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl border border-gold/20 bg-gold/5 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-gold/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-heading font-semibold text-white mb-1">Verify & Upgrade This Listing</h3>
                        <p className="text-xs text-white/50 font-body leading-relaxed mb-3">
                          This listing is awaiting owner verification. Claim it to unlock premium features: business hours, photo gallery, menu editor, booking integration, and priority placement.
                        </p>
                        {/* Verification progress */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div className="h-full w-1/4 rounded-full bg-gradient-to-r from-gold/50 to-gold" />
                          </div>
                          <span className="text-[10px] text-gold/60 font-heading font-semibold uppercase tracking-wider">Step 1 of 4</span>
                        </div>
                        {showClaimInfo ? (
                          <div className="p-4 rounded-xl border border-gold/10 bg-midnight-900/50 space-y-2">
                            <p className="text-xs text-white/60 font-body">Email us to verify ownership:</p>
                            <a
                              href={`mailto:greenline365help@gmail.com?subject=Claim%20Listing%3A%20${encodeURIComponent(listing.business_name)}&body=I%20would%20like%20to%20claim%20the%20listing%20for%20${encodeURIComponent(listing.business_name)}%20(${listing.city}%2C%20${listing.state}).%0A%0AMy%20name%3A%20%0AMy%20role%20at%20the%20business%3A%20`}
                              className="inline-flex items-center gap-2 text-gold hover:text-gold-300 text-sm font-medium transition-colors"
                              data-testid="claim-email-link"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                              </svg>
                              greenline365help@gmail.com
                            </a>
                            <p className="text-[10px] text-white/30 font-body">We&apos;ll verify your ownership and send a claim code within 24 hours.</p>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowClaimInfo(true)}
                            className="px-5 py-2.5 rounded-xl text-xs font-bold font-heading text-midnight-900 transition-all hover:scale-[1.02] hover:shadow-lg active:scale-95"
                            style={{ background: 'linear-gradient(135deg, #C9A96E, #E6D8B5)', boxShadow: '0 0 16px rgba(201,169,110,0.2)' }}
                            data-testid="claim-this-btn"
                          >
                            Start Verification
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Related Businesses — shown in overview */}
                {listing.related?.length > 0 && (
                  <div data-testid="related-listings">
                    <h3 className="text-sm font-heading font-semibold text-white uppercase tracking-wider mb-4">
                      More {listing.industry.replace(/-/g, ' ')} in {listing.city}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {listing.related.map((r) => (
                        <Link
                          key={r.id}
                          href={`/listing/${r.slug}`}
                          className="rounded-xl border border-white/5 overflow-hidden hover:border-gold/20 hover:shadow-gold-glow transition-all duration-300 group"
                          style={{ background: 'rgba(255,255,255,0.02)' }}
                        >
                          <div className="relative h-24">
                            {r.cover_image_url ? (
                              <Image src={r.cover_image_url} alt={r.business_name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 50vw, 25vw" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-midnight-800 to-charcoal-800 flex items-center justify-center">
                                <span className="text-2xl font-heading font-light text-white/10">{r.business_name[0]}</span>
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <p className="text-xs font-heading font-semibold text-gold truncate">{r.business_name}</p>
                            <div className="flex items-center gap-1 mt-1">
                              {r.metadata?.google_rating && (
                                <>
                                  <svg className="w-3 h-3 text-gold/60" fill="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                                  <span className="text-[10px] text-white/40 font-body">{r.metadata.google_rating}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ─── PHOTOS TAB ─── */}
            {activeTab === 'photos' && (
              <motion.div
                key="photos"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >

            {/* Photo Gallery */}
            {photos.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-white/10 overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)' }}
                data-testid="photo-gallery"
              >
                {/* Main Photo */}
                <div className="relative aspect-video">
                  <Image
                    src={photos[activePhoto]}
                    alt={`${listing.business_name} photo ${activePhoto + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  {photos.length > 1 && (
                    <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-xs font-heading font-semibold text-white/80 backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.6)' }}>
                      {activePhoto + 1} / {photos.length}
                      {listing.total_photos_available > photos.length && (
                        <span className="text-gold/70 ml-1">({listing.total_photos_available} total)</span>
                      )}
                    </div>
                  )}
                </div>
                {/* Thumbnails */}
                {photos.length > 1 && (
                  <div className="flex gap-2 p-3 overflow-x-auto">
                    {photos.map((photo, i) => (
                      <button
                        key={i}
                        onClick={() => setActivePhoto(i)}
                        className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${i === activePhoto ? 'border-gold' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        <Image src={photo} alt="" fill className="object-cover" sizes="64px" />
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

              </motion.div>
            )}

            {/* ─── REVIEWS TAB ─── */}
            {activeTab === 'reviews' && (
              <motion.div
                key="reviews"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >


            {/* ─── GL365 REVIEWS — Google-Style ─── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-2xl border border-white/10 p-6"
              style={{ background: 'rgba(255,255,255,0.03)' }}
              data-testid="gl365-reviews-section"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-heading font-semibold text-white uppercase tracking-wider">GL365 Reviews</h3>
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-gold border border-gold/30 hover:bg-gold/5 transition-all font-heading"
                  data-testid="write-review-btn"
                >
                  Write a Review
                </button>
              </div>

              {/* Rating Summary — Google Style */}
              {reviewStats.total > 0 && (() => {
                const ratingCounts = [5,4,3,2,1].map(star => ({
                  star,
                  count: reviews.filter(r => r.rating === star).length,
                }));
                const maxCount = Math.max(...ratingCounts.map(r => r.count), 1);
                return (
                  <div className="flex gap-6 mb-6 pb-6 border-b border-white/5">
                    {/* Big number */}
                    <div className="text-center flex-shrink-0" data-testid="rating-summary">
                      <span className="text-4xl font-heading font-bold text-white block">{reviewStats.average_rating}</span>
                      <div className="flex gap-0.5 justify-center mt-1">
                        {[1,2,3,4,5].map(s => (
                          <svg key={s} className="w-3.5 h-3.5" fill={s <= Math.round(reviewStats.average_rating) ? '#C9A96E' : 'none'} stroke={s <= Math.round(reviewStats.average_rating) ? '#C9A96E' : '#555'} strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-[10px] text-white/30 font-body mt-1 block">{reviewStats.total} review{reviewStats.total !== 1 ? 's' : ''}</span>
                    </div>
                    {/* Bar breakdown */}
                    <div className="flex-1 space-y-1.5">
                      {ratingCounts.map(({ star, count }) => (
                        <div key={star} className="flex items-center gap-2" data-testid={`rating-bar-${star}`}>
                          <span className="text-[11px] text-white/40 font-body w-3 text-right">{star}</span>
                          <svg className="w-3 h-3 flex-shrink-0" fill="#C9A96E" viewBox="0 0 24 24">
                            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                          <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gold/70 transition-all duration-500"
                              style={{ width: `${(count / maxCount) * 100}%` }}
                            />
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
                <div className={`mb-4 px-3 py-2 rounded-lg text-xs font-body ${reviewMessage.includes('Thank') ? 'bg-greenline/10 text-greenline border border-greenline/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {reviewMessage}
                </div>
              )}

              {/* Review Form */}
              {showReviewForm && (
                <div className="mb-6 p-4 rounded-xl border border-gold/10 bg-midnight-900/50 space-y-3" data-testid="review-form">
                  <input
                    value={reviewForm.reviewer_name}
                    onChange={e => setReviewForm({ ...reviewForm, reviewer_name: e.target.value })}
                    placeholder="Your name"
                    className="w-full px-4 py-3 rounded-xl text-sm bg-white/5 text-white border border-white/10 focus:outline-none focus:border-gold/30 font-body placeholder-white/30"
                    data-testid="review-name-input"
                  />
                  <div>
                    <label className="text-xs text-white/40 font-heading uppercase tracking-wider mb-1 block">Rating</label>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(s => (
                        <button key={s} onClick={() => setReviewForm({ ...reviewForm, rating: s })} className="p-1" data-testid={`star-${s}`}>
                          <svg className="w-7 h-7 transition-colors" fill={s <= reviewForm.rating ? '#C9A96E' : 'none'} stroke={s <= reviewForm.rating ? '#C9A96E' : '#555'} strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={reviewForm.text}
                    onChange={e => setReviewForm({ ...reviewForm, text: e.target.value })}
                    placeholder="Share your experience (at least 10 characters)..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl text-sm bg-white/5 text-white border border-white/10 focus:outline-none focus:border-gold/30 font-body resize-none placeholder-white/30"
                    data-testid="review-text-input"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={submitReview}
                      disabled={submittingReview}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold font-heading text-midnight-900 transition-all active:scale-95 hover:scale-[1.03] hover:shadow-lg disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #C9A96E, #E6D8B5)', boxShadow: '0 0 16px rgba(201,169,110,0.3)' }}
                      data-testid="submit-review-btn"
                    >
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                    <button onClick={() => setShowReviewForm(false)} className="px-4 py-2.5 text-xs text-white/40 hover:text-white/60 transition font-body">Cancel</button>
                  </div>
                </div>
              )}

              {/* Sort Filter — Google Style */}
              {reviews.length > 1 && (
                <div className="flex items-center gap-2 mb-4" data-testid="review-sort">
                  {[
                    { id: 'newest' as const, label: 'Newest' },
                    { id: 'highest' as const, label: 'Highest' },
                    { id: 'lowest' as const, label: 'Lowest' },
                  ].map(s => (
                    <button
                      key={s.id}
                      onClick={() => setReviewSort(s.id)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all font-body ${
                        reviewSort === s.id
                          ? 'bg-gold/15 text-gold border border-gold/25'
                          : 'text-white/35 border border-white/10 hover:text-white/50 hover:border-white/20'
                      }`}
                      data-testid={`sort-${s.id}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Reviews List */}
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {[...reviews]
                    .sort((a, b) => {
                      if (reviewSort === 'highest') return b.rating - a.rating;
                      if (reviewSort === 'lowest') return a.rating - b.rating;
                      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                    })
                    .map((review) => (
                    <div key={review.id} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-xs font-heading font-bold text-gold">
                            {review.reviewer_name[0]?.toUpperCase()}
                          </div>
                          <div>
                            <span className="text-sm font-heading font-semibold text-white">{review.reviewer_name}</span>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-0.5">
                                {[1,2,3,4,5].map((s: number) => (
                                  <svg key={s} className="w-3 h-3" fill={s <= review.rating ? '#C9A96E' : 'none'} stroke={s <= review.rating ? '#C9A96E' : '#555'} strokeWidth={1.5} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                  </svg>
                                ))}
                              </div>
                              <span className="text-[10px] text-white/20 font-body">{new Date(review.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-white/60 font-body leading-relaxed mt-2 pl-10">{review.text}</p>
                      {review.response && (
                        <div className="mt-3 ml-10 pl-3 border-l-2 border-gold/20">
                          <p className="text-[10px] text-gold/50 font-heading uppercase tracking-wider mb-1">Business Response</p>
                          <p className="text-xs text-white/50 font-body leading-relaxed">{review.response.text}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/30 font-body text-center py-6">No GL365 reviews yet. Be the first to share your experience!</p>
              )}
            </motion.div>

              </motion.div>
            )}

            {/* ─── MENU TAB ─── */}
            {activeTab === 'menu' && hasMenu && (
              <motion.div
                key="menu"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
                data-testid="menu-section"
              >
                {listing.menu_sections
                  .sort((a, b) => a.position - b.position)
                  .map((section) => (
                  <div
                    key={section.id}
                    className="rounded-2xl border border-white/10 p-6"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  >
                    <h3 className="text-sm font-heading font-semibold text-white uppercase tracking-wider mb-5 pb-3 border-b border-white/5">
                      {section.name}
                    </h3>
                    <div className="space-y-4">
                      {section.items
                        .sort((a, b) => a.position - b.position)
                        .map((item) => (
                        <div key={item.id} className="flex items-start gap-4 group">
                          {item.photo_url && (
                            <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-white/5">
                              <Image src={item.photo_url} alt={item.name} fill className="object-cover group-hover:scale-110 transition-transform duration-300" sizes="64px" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between gap-2">
                              <h4 className="text-sm font-heading font-semibold text-white group-hover:text-gold transition-colors">{item.name}</h4>
                              {item.price && (
                                <span className="text-sm font-heading font-bold text-gold flex-shrink-0">
                                  ${parseFloat(item.price).toFixed(2)}
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs text-white/45 font-body leading-relaxed mt-1">{item.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            </AnimatePresence>
          </div>

          {/* Sidebar — Contact & Actions */}
          <div className="space-y-6">
            {/* Contact Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-white/10 p-6 sticky top-24"
              style={{ background: 'rgba(13,27,42,0.9)', backdropFilter: 'blur(16px)' }}
              data-testid="contact-card"
            >
              <h3 className="text-sm font-heading font-semibold text-white uppercase tracking-wider mb-5">Contact</h3>

              {/* CTA Buttons — Pro/Premium only */}
              {listing.tier !== 'free' && listing.is_claimed && (
                <div className="space-y-2 mb-5" data-testid="cta-buttons">
                  {listing.phone && (
                    <a
                      href={`tel:${listing.phone}`}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold font-heading text-midnight-900 transition-all hover:scale-[1.02]"
                      style={{ background: 'linear-gradient(135deg, #C9A96E, #E6D8B5)', boxShadow: '0 0 16px rgba(201,169,110,0.3)' }}
                      data-testid="cta-call-now"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Call Now
                    </a>
                  )}
                  {listing.website && (
                    <a
                      href={listing.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold font-heading text-gold border border-gold/30 hover:bg-gold/5 transition-all"
                      data-testid="cta-visit-website"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                      Visit Website
                    </a>
                  )}
                </div>
              )}

              <div className="space-y-3">
                {/* Phone */}
                {listing.phone && (
                  <a
                    href={`tel:${listing.phone}`}
                    onClick={() => trackEvent('call')}
                    className="flex items-center gap-3 w-full p-3 rounded-xl border border-white/10 hover:border-gold/30 hover:bg-gold/5 transition-all group"
                    data-testid="contact-phone"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-white/40 font-body block">Phone</span>
                      <span className="text-sm text-white font-medium font-body group-hover:text-gold transition-colors">{listing.phone}</span>
                    </div>
                  </a>
                )}

                {/* Website */}
                {listing.website && (
                  <a
                    href={listing.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackEvent('website')}
                    className="flex items-center gap-3 w-full p-3 rounded-xl border border-white/10 hover:border-gold/30 hover:bg-gold/5 transition-all group"
                    data-testid="contact-website"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs text-white/40 font-body block">Website</span>
                      <span className="text-sm text-white font-medium font-body group-hover:text-gold transition-colors truncate block">{listing.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                    </div>
                  </a>
                )}

                {/* Google Maps */}
                {googleMapsUrl && (
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackEvent('map')}
                    className="flex items-center gap-3 w-full p-3 rounded-xl border border-white/10 hover:border-gold/30 hover:bg-gold/5 transition-all group"
                    data-testid="contact-map"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-white/40 font-body block">Directions</span>
                      <span className="text-sm text-white font-medium font-body group-hover:text-gold transition-colors">View on Google Maps</span>
                    </div>
                  </a>
                )}
              </div>

              {/* Verified Status — reframed for unclaimed */}
              <div className="mt-6 pt-5 border-t border-white/5">
                <div className="flex items-center gap-2">
                  {listing.is_claimed ? (
                    <>
                      <motion.div
                        className="relative"
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <svg className="w-4 h-4 text-greenline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </motion.div>
                      <span className="text-xs text-greenline font-heading font-semibold">Claimed & Verified</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-gold/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span className="text-xs text-gold/50 font-heading font-semibold">Awaiting Verification</span>
                    </>
                  )}
                </div>
              </div>

              {/* Booking CTA — Pro/Premium claimed */}
              {listing.tier !== 'free' && listing.is_claimed && (
                <div className="mt-5 pt-5 border-t border-white/5" data-testid="booking-section">
                  <p className="text-[10px] text-white/30 font-heading uppercase tracking-wider mb-3">Request Appointment</p>
                  {bookingMessage && (
                    <div className={`mb-3 px-3 py-2 rounded-lg text-xs font-body ${bookingMessage.includes('sent') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                      {bookingMessage}
                    </div>
                  )}
                  {showBookingForm ? (
                    <div className="space-y-2.5">
                      <input
                        value={bookingForm.full_name}
                        onChange={e => setBookingForm({ ...bookingForm, full_name: e.target.value })}
                        placeholder="Your name *"
                        className="w-full px-3 py-2.5 rounded-xl text-xs bg-white/5 text-white border border-white/10 focus:outline-none focus:border-gold/30 font-body placeholder-white/30"
                      />
                      <input
                        value={bookingForm.email}
                        onChange={e => setBookingForm({ ...bookingForm, email: e.target.value })}
                        placeholder="Email *"
                        type="email"
                        className="w-full px-3 py-2.5 rounded-xl text-xs bg-white/5 text-white border border-white/10 focus:outline-none focus:border-gold/30 font-body placeholder-white/30"
                      />
                      <input
                        value={bookingForm.phone}
                        onChange={e => setBookingForm({ ...bookingForm, phone: e.target.value })}
                        placeholder="Phone (optional)"
                        type="tel"
                        className="w-full px-3 py-2.5 rounded-xl text-xs bg-white/5 text-white border border-white/10 focus:outline-none focus:border-gold/30 font-body placeholder-white/30"
                      />
                      <input
                        value={bookingForm.preferred_datetime}
                        onChange={e => setBookingForm({ ...bookingForm, preferred_datetime: e.target.value })}
                        type="datetime-local"
                        className="w-full px-3 py-2.5 rounded-xl text-xs bg-white/5 text-white border border-white/10 focus:outline-none focus:border-gold/30 font-body [color-scheme:dark]"
                      />
                      <textarea
                        value={bookingForm.notes}
                        onChange={e => setBookingForm({ ...bookingForm, notes: e.target.value })}
                        placeholder="Notes (optional)"
                        rows={2}
                        className="w-full px-3 py-2.5 rounded-xl text-xs bg-white/5 text-white border border-white/10 focus:outline-none focus:border-gold/30 font-body resize-none placeholder-white/30"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={submitBooking}
                          disabled={bookingSubmitting}
                          className="flex-1 py-2.5 rounded-xl text-xs font-bold font-heading text-midnight-900 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                          style={{ background: 'linear-gradient(135deg, #C9A96E, #E6D8B5)', boxShadow: '0 0 12px rgba(201,169,110,0.2)' }}
                        >
                          {bookingSubmitting ? 'Sending...' : 'Send Request'}
                        </button>
                        <button
                          onClick={() => setShowBookingForm(false)}
                          className="px-3 py-2.5 text-xs text-white/40 hover:text-white/60 transition font-body"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowBookingForm(true)}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold font-heading text-gold border border-gold/30 hover:bg-gold/5 hover:border-gold/50 transition-all"
                      data-testid="cta-book"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                      Book Appointment
                    </button>
                  )}
                </div>
              )}

              {/* Sidebar Hours — compact */}
              {hasHours && listing.business_hours && (
                <div className="mt-5 pt-5 border-t border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] text-white/30 font-heading uppercase tracking-wider">Hours</p>
                    {openStatus.label && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-heading font-semibold ${openStatus.isOpen ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${openStatus.isOpen ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        {openStatus.isOpen ? 'Open' : 'Closed'}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {DAY_ORDER.map((day) => {
                      const h = listing.business_hours![day];
                      const isToday = DAY_KEYS[new Date().getDay()] === day;
                      return (
                        <div key={day} className={`flex justify-between text-[11px] font-body py-0.5 ${isToday ? 'text-gold font-medium' : 'text-white/35'}`}>
                          <span>{DAY_LABELS[day]?.slice(0, 3)}</span>
                          <span>{!h || h.closed ? 'Closed' : `${formatTime(h.open!)} \u2013 ${formatTime(h.close!)}`}</span>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setActiveTab('overview')}
                    className="text-[10px] text-gold/50 hover:text-gold/80 font-body mt-2 transition-colors"
                  >
                    View full hours
                  </button>
                </div>
              )}

              {/* Google stats */}
              {(googleRating || googleReviews) && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="text-[10px] text-white/30 font-heading uppercase tracking-wider mb-3">Google Business Data</p>
                  <div className="grid grid-cols-2 gap-3">
                    {googleRating && (
                      <div>
                        <span className="block text-lg font-heading font-bold text-white">{googleRating}/5</span>
                        <span className="text-[10px] text-white/30 font-body">Rating</span>
                      </div>
                    )}
                    {googleReviews && (
                      <div>
                        <span className="block text-lg font-heading font-bold text-white">{googleReviews.toLocaleString()}</span>
                        <span className="text-[10px] text-white/30 font-body">Reviews</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Embedded Google Map */}
              {(listing.address_line1 || listing.city) && (
                <div className="mt-5 pt-5 border-t border-white/5" data-testid="listing-map">
                  <p className="text-[10px] text-white/30 font-heading uppercase tracking-wider mb-3">Location</p>
                  <div className="rounded-xl overflow-hidden border border-white/5" style={{ aspectRatio: '4/3' }}>
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyDJ5FY_ZL1pqN3lsERdgi9NiuwK_DYcfTo&q=${encodeURIComponent([listing.business_name, listing.address_line1, listing.city, listing.state, listing.zip_code].filter(Boolean).join(', '))}`}
                      title={`Map showing ${listing.business_name} location`}
                    />
                  </div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent([listing.address_line1, listing.city, listing.state, listing.zip_code].filter(Boolean).join(', '))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackEvent('map')}
                    className="flex items-center justify-center gap-2 w-full mt-3 py-3 rounded-xl text-xs font-semibold font-heading text-white border border-white/10 hover:border-gold/30 hover:bg-gold/5 transition-all"
                    data-testid="get-directions-btn"
                  >
                    <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                    </svg>
                    Get Directions
                  </a>
                  {listing.address_line1 && (
                    <p className="text-[10px] text-white/25 font-body text-center mt-2">
                      {listing.address_line1}, {listing.city}, {listing.state} {listing.zip_code}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

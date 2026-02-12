'use client';

import { useState, useEffect } from 'react';
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

  return (
    <div className="min-h-screen bg-midnight-900 pt-20 pb-16" data-testid="listing-detail-page">
      {/* Hero / Cover Image */}
      <section className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
        {listing.cover_image_url ? (
          <img
            src={listing.cover_image_url}
            alt={`${listing.business_name} — ${listing.industry.replace(/-/g, ' ')} in ${listing.city}, ${listing.state}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-midnight-800 to-charcoal-800 flex items-center justify-center">
            <span className="text-8xl font-heading font-light text-white/10">{listing.business_name[0]}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-midnight-900 via-midnight-900/40 to-transparent" />

        {/* Back button + Directory home */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <button
            onClick={() => router.back()}
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

        {/* Tier badge */}
        {listing.tier !== 'free' && (
          <div className="absolute top-4 right-4">
            <span
              className="px-3 py-1.5 rounded-full text-xs font-heading font-bold uppercase tracking-wider"
              style={{
                background: listing.tier === 'premium' ? 'linear-gradient(135deg, #C9A96E, #E6D8B5)' : 'linear-gradient(135deg, #3B82F6, #60A5FA)',
                color: '#0D1B2A',
              }}
            >
              {listing.tier === 'premium' ? 'Premier' : 'Pro'}
            </span>
          </div>
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
                  <span className="text-[10px] px-2.5 py-1 rounded-full font-heading font-semibold uppercase tracking-wider text-gold/70 border border-gold/20 bg-gold/5">
                    {listing.industry.replace(/-/g, ' ')}
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-heading font-semibold text-white mt-3 mb-2" data-testid="listing-name">
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
                        <span className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full text-[10px] font-heading font-bold uppercase tracking-wider bg-greenline/15 text-greenline border border-greenline/20" data-testid="verified-badge">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                          Verified
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Rating */}
                {googleRating && (
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gold/20 bg-gold/5">
                      <svg className="w-5 h-5 text-gold" fill="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                      <span className="text-xl font-heading font-bold text-white">{googleRating}</span>
                    </div>
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
                <p className="text-sm text-white/60 font-body leading-relaxed mt-4">{listing.description}</p>
              )}

              {/* Badges */}
              {listing.has_property_intelligence && (
                <div className="mt-4">
                  <span
                    className="inline-flex items-center gap-1.5 font-semibold rounded-full px-3 py-1.5 text-xs"
                    style={{ background: 'linear-gradient(135deg, #5B8A72, #7BAF95)', color: '#fff' }}
                    data-testid="pi-badge"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    Property Intelligence Verified
                  </span>
                </div>
              )}
            </motion.div>

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
                  <img
                    src={photos[activePhoto]}
                    alt={`${listing.business_name} photo ${activePhoto + 1}`}
                    className="w-full h-full object-cover"
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
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${i === activePhoto ? 'border-gold' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        <img src={photo} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Is This Your Business? */}
            {!listing.is_claimed && (listing as any).is_claimable !== false && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-gold/15 p-6"
                style={{ background: 'rgba(201,169,110,0.04)' }}
                data-testid="claim-section"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl border border-gold/20 bg-gold/5 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-gold/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-heading font-semibold text-white mb-1">Is this your business?</h3>
                    <p className="text-xs text-white/40 font-body leading-relaxed mb-3">
                      Claim this listing to update your information, add photos, and unlock premium features. Contact our team to verify ownership and get your claim code.
                    </p>
                    {showClaimInfo ? (
                      <div className="p-4 rounded-xl border border-gold/10 bg-midnight-900/50 space-y-2">
                        <p className="text-xs text-white/60 font-body">Email us to claim this listing:</p>
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
                        <p className="text-[10px] text-white/30 font-body">Please check your spam folder for our reply.</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowClaimInfo(true)}
                        className="px-4 py-2 rounded-lg text-xs font-semibold text-gold border border-gold/30 hover:bg-gold/5 transition-all font-heading"
                        data-testid="claim-this-btn"
                      >
                        Claim This Listing
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}


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

            {/* Related Businesses */}
            {listing.related?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                data-testid="related-listings"
              >
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
                          <img src={r.cover_image_url} alt={r.business_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
              </motion.div>
            )}
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

              {/* Verified Status */}
              <div className="mt-6 pt-5 border-t border-white/5">
                <div className="flex items-center gap-2">
                  {listing.is_claimed ? (
                    <>
                      <svg className="w-4 h-4 text-greenline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span className="text-xs text-greenline font-heading font-semibold">Claimed & Verified</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                      <span className="text-xs text-white/30 font-body">Unclaimed listing</span>
                    </>
                  )}
                </div>
              </div>

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

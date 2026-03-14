'use client';

/**
 * GL365 Directory — Black & Gold Luxury Landing
 * Full-bleed cinematic hero, gold serif headlines, pill search bar.
 * NO fake testimonials. Exact stat numbers. Depth over flatness.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const BoostedShowcase = dynamic(() => import('@/components/BoostedShowcase'), { ssr: false });
const CommunityPolls = dynamic(() => import('@/components/CommunityPolls'), { ssr: false });
const FeaturedShowcase = dynamic(() => import('@/components/FeaturedShowcase'), { ssr: false });
import { getPlaceholderImage, getCategoryFallback, getFallbackDescription, matchesSubcategory } from '@/lib/directory-config';

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
// Industries where businesses should NOT show "Claim Listing" (chains, franchises)
const NON_CLAIMABLE_INDUSTRIES: string[] = [];

const CATEGORIES = [
  // === HOME SERVICES (The Big Five + all trades) ===
  { id: 'services', label: 'Home Services', sub: 'HVAC, Plumbing, Electrical & Every Trade', img: '/images/categories/services.webp',
    subcategories: [
      'All',
      // Big Five
      'HVAC', 'Plumbing', 'Electrical', 'Roofing', 'Pest Control',
      // Cleaning & Maintenance
      'House Cleaning', 'Carpet Cleaning', 'Pressure Washing', 'Window Cleaning', 'Junk Removal',
      // Exterior & Landscaping
      'Lawn Care', 'Landscaping', 'Tree Service', 'Pool & Spa', 'Fencing', 'Irrigation',
      // Interior & Finishing
      'Painting', 'Flooring', 'Handyman', 'Kitchen & Bath', 'Windows & Doors', 'Garage Doors', 'Gutters',
      // Tech & Security
      'Smart Home', 'Security Systems', 'Home Theater',
      // Structural & Specialty
      'Foundations', 'Masonry', 'Insulation', 'Mold Remediation', 'Water Damage',
      // General
      'General Contractors', 'Locksmith', 'Appliance Repair', 'Septic & Sewer',
    ] },

  // === AUTOMOTIVE ===
  { id: 'automotive', label: 'Automotive', sub: 'Repairs, dealers & body shops', img: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=600&fit=crop',
    subcategories: ['All', 'Auto Repair', 'Oil Change', 'Tire Shops', 'Body Shops', 'Car Dealers', 'Auto Parts', 'Towing', 'Car Wash', 'Auto Detailing', 'EV Charging'] },

  // === MARINE & OUTDOOR (Key West / Coastal Florida) ===
  { id: 'marine-outdoor', label: 'Marine & Outdoor', sub: 'Boats, docks & outdoor adventure', img: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800&h=600&fit=crop',
    subcategories: ['All', 'Boat Repair', 'Marine Mechanics', 'Dock & Lift', 'Boat Cleaning', 'Fishing Charters', 'Kayak & Paddleboard', 'Dive Shops', 'Marinas'] },

  // === DINING ===
  { id: 'dining', label: 'Dining', sub: 'Cafes, casual & fine dining', img: '/images/categories/dining.webp',
    subcategories: ['All', 'Fine Dining', 'Casual', 'Cafes & Bakeries', 'Food Trucks', 'Seafood', 'BBQ', 'Pizza', 'Mexican', 'Asian', 'Italian', 'Breakfast & Brunch', 'Vegan & Vegetarian'] },

  // === HEALTH & WELLNESS ===
  { id: 'health-wellness', label: 'Health & Wellness', sub: 'Doctors, dentists, fitness & more', img: '/images/categories/health-wellness.webp',
    subcategories: ['All', 'Dental Offices', 'Physical Therapy', 'Medical Clinics', 'Mental Health', 'Fitness', 'Chiropractors', 'Optometrists', 'Urgent Care', 'Pharmacies', 'Dermatology', 'Orthopedics'] },

  // === STYLE & SHOPPING ===
  { id: 'style-shopping', label: 'Style & Shopping', sub: 'Fashion, grooming & retail', img: '/images/categories/style-shopping.webp',
    subcategories: ['All', 'Barbershops', 'Salons', 'Nail Salons', 'Spas', 'Boutiques', 'Jewelry', 'Tattoo & Piercing', 'Dry Cleaning & Laundry'] },

  // === PROFESSIONAL SERVICES ===
  { id: 'professional-services', label: 'Professional Services', sub: 'Legal, finance & consulting', img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&h=600&fit=crop',
    subcategories: ['All', 'Attorneys', 'Accountants', 'Insurance', 'Real Estate', 'Financial Advisors', 'IT Services', 'Marketing Agencies', 'Notary'] },

  // === EDUCATION & CHILDCARE ===
  { id: 'education', label: 'Education & Childcare', sub: 'Schools, tutoring & daycare', img: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop',
    subcategories: ['All', 'Preschools', 'Daycare', 'Tutoring', 'Driving Schools', 'Music Lessons', 'Dance Studios', 'Martial Arts', 'Language Schools'] },

  // === PETS ===
  { id: 'pets', label: 'Pets', sub: 'Vets, grooming & boarding', img: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=600&fit=crop',
    subcategories: ['All', 'Veterinarians', 'Pet Grooming', 'Pet Boarding', 'Pet Stores', 'Dog Training', 'Pet Sitting', 'Aquarium & Fish'] },

  // === MOBILE SERVICES ===
  { id: 'mobile-services', label: 'Mobile Services', sub: 'DJs, trainers, notaries & on-the-go pros', img: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&h=600&fit=crop',
    subcategories: ['All', 'Mobile DJs', 'Personal Trainers', 'Mobile Notary', 'Mobile Pet Grooming', 'Mobile Auto Detailing', 'Mobile Car Wash', 'Event Photographers', 'Private Chefs', 'Mobile Barbers'] },
];

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
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

// ─── Property Intelligence Badge ──────────────────────────────────
function PropertyIntelBadge() {
  return (
    <div className="relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider text-white overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #8A6A1C 50%, #C9A84C 100%)', backgroundSize: '200% 100%' }}>
      <div className="absolute inset-0 animate-shimmer" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)', backgroundSize: '200% 100%' }} />
      <svg className="w-3 h-3 relative z-10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.18l7 3.89v7.86l-7 3.89-7-3.89V8.07l7-3.89z" /></svg>
      <span className="relative z-10">Property Intel</span>
    </div>
  );
}

// ─── Sponsored Section — Only renders when there are sponsored listings ─────
function SponsoredSection() {
  const [hasSlots, setHasSlots] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/directory/addons/featured?limit=12&backfill=true')
      .then(r => r.json())
      .then(data => setHasSlots((data.slots || []).length > 0))
      .catch(() => setHasSlots(false));
  }, []);

  if (!hasSlots) return null;

  return (
    <section className="py-12" style={{ background: '#080808' }} data-testid="boosted-showcase-section">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 rounded-full" style={{ background: '#C9A84C' }} />
          <h3 className="text-sm font-heading font-semibold text-white/60 uppercase tracking-wider">Sponsored</h3>
          <div className="flex-1 h-px bg-white/5" />
        </div>
        <BoostedShowcase maxSlots={12} />
      </div>
    </section>
  );
}

// ─── Testimonials — Fetches real reviews from the directory ─────
function TestimonialsSection() {
  const [reviews, setReviews] = useState<{ id: string; reviewer_name: string; review_text: string; rating: number; business_name: string; slug: string; created_at: string }[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    // Fetch real reviews from the directory reviews endpoint
    fetch('/api/directory/reviews?limit=10&min_rating=4')
      .then(r => r.ok ? r.json() : { reviews: [] })
      .then(data => {
        const list = data.reviews || data || [];
        if (Array.isArray(list) && list.length > 0) {
          const filtered = list.filter((r: any) =>
            r.review_text && r.reviewer_name && r.review_text.length > 20 &&
            !/test/i.test(r.reviewer_name) &&
            !/automated testing/i.test(r.review_text)
          );
          setReviews(filtered);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (reviews.length < 2) return;
    const t = setInterval(() => setIdx(i => (i + 1) % reviews.length), 6000);
    return () => clearInterval(t);
  }, [reviews.length]);

  if (reviews.length < 3) return null;

  const r = reviews[idx];
  return (
    <section id="testimonials" className="relative py-20 overflow-hidden" data-testid="testimonials-section">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(201,168,76,0.03) 0%, transparent 60%)' }} />
      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <p className="text-xs font-heading font-semibold uppercase tracking-[0.25em] mb-4" style={{ color: 'rgba(201,168,76,0.7)' }}>Real Reviews</p>
        <h2 className="text-3xl sm:text-4xl font-heading font-light text-white tracking-tight mb-10">
          What People Are <span className="text-gradient-gold font-semibold">Saying</span>
        </h2>

        <AnimatePresence mode="wait">
          <motion.div
            key={r.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-xl font-heading font-bold text-white" style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.2) 0%, rgba(201,168,76,0.1) 100%)', border: '2px solid rgba(201,168,76,0.3)' }}>
              {r.reviewer_name[0]}
            </div>
            <h3 className="text-lg font-heading font-semibold text-white">{r.reviewer_name}</h3>
            <p className="text-sm mb-3 font-body" style={{ color: 'rgba(201,168,76,0.6)' }}>
              reviewing <Link href={`/listing/${r.slug}`} className="underline hover:text-[#C9A84C] transition">{r.business_name}</Link>
            </p>
            <div className="flex justify-center mb-4"><Stars rating={r.rating} size={18} /></div>
            <p className="text-sm text-white/60 leading-relaxed italic font-body max-w-lg mx-auto">&ldquo;{r.review_text}&rdquo;</p>
          </motion.div>
        </AnimatePresence>

        {reviews.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {reviews.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} className={`w-2.5 h-2.5 rounded-full transition ${i === idx ? 'scale-110' : 'opacity-40'}`}
                style={{ background: i === idx ? 'linear-gradient(135deg, #C9A84C, #E8C97A)' : 'rgba(255,255,255,0.3)' }}
                data-testid={`testimonial-dot-${i}`} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default function DirectoryClient() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const initialQuery = searchParams.get('q') || '';

  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [activeSubcategory, setActiveSubcategory] = useState('All');
  const [showListings, setShowListings] = useState(!!initialCategory || !!initialQuery);
  const [showGroupedBrowse, setShowGroupedBrowse] = useState(false);
  const [sortBy, setSortBy] = useState<'nearest' | 'highest' | 'most-reviews'>('nearest');
  const [cityFilter, setCityFilter] = useState('');
  const [maxDistance, setMaxDistance] = useState(0);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [totalListingCount, setTotalListingCount] = useState(0);

  // Exact stat counters — no fake numbers
  const [stats, setStats] = useState({ businesses: 0, categories: CATEGORIES.length, destinations: 8, foundingMembersClaimed: 0 });

  useEffect(() => {
    // Load featured + initial listings + dynamic counts
    // Only fetch 24 listings initially — load more when user browses categories
    Promise.all([
      fetch('/api/directory?limit=24').then(r => r.json()),
      fetch('/api/directory?limit=6&featured=true').then(r => r.json()),
      fetch('/api/directory/counts').then(r => r.json()).catch(() => null),
    ]).then(([all, featured, counts]) => {
      const allArr = Array.isArray(all) ? all : [];
      const featArr = Array.isArray(featured) ? featured : [];
      setAllListings(allArr);
      setFeaturedListings(featArr.length > 0 ? featArr : allArr.slice(0, 6));
      setTotalListingCount(counts?.total_businesses || allArr.length);
      // Use dynamic counts from Supabase — no hard-coded numbers
      if (counts && !counts.error) {
        setStats(prev => ({
          ...prev,
          businesses: counts.total_businesses || allArr.length,
          categories: counts.total_categories || CATEGORIES.length,
          destinations: counts.total_destinations || 8,
        }));
      } else {
        setStats(prev => ({ ...prev, businesses: allArr.length }));
      }
      setLoading(false);
    }).catch(() => setLoading(false));

    // Scroll to categories section if arriving with ?category= or ?q=
    if (initialCategory || initialQuery) {
      setTimeout(() => {
        document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }, []);

  // Lazy geolocation — only request when user interacts with directory (not on page load)
  const geoRequested = useRef(false);
  const requestGeolocation = useCallback(() => {
    if (geoRequested.current || userLocation) return;
    geoRequested.current = true;
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, [userLocation]);

  // Load more listings when user browses a category (initial load is only 24)
  const fullLoadDone = useRef(false);
  const loadAllListings = useCallback(() => {
    if (fullLoadDone.current) return;
    fullLoadDone.current = true;
    const params = userLocation ? `&lat=${userLocation.lat}&lng=${userLocation.lng}` : '';
    fetch(`/api/directory?limit=100${params}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setAllListings(data);
      })
      .catch(() => {});
  }, [userLocation]);

  const premierPartners = featuredListings.filter(l => l.tier === 'premium' || l.has_property_intelligence);
  const recentListings = allListings.filter(l => !premierPartners.find(p => p.id === l.id)).slice(0, 6);

  // Available cities from loaded listings
  const availableCities = [...new Set(allListings.map(l => l.city).filter(Boolean))] as string[];

  // Filtering logic for the category browse view
  const currentCat = CATEGORIES.find(c => c.id === activeCategory);
  const subcategories = currentCat?.subcategories || ['All'];
  const filteredListings = allListings.filter(l => {
    if (activeCategory && l.industry !== activeCategory) return false;
    if (activeSubcategory !== 'All' && !matchesSubcategory(activeSubcategory, l.subcategories, l.business_name, l.description)) return false;
    if (search && !l.business_name.toLowerCase().includes(search.toLowerCase()) && !l.description?.toLowerCase().includes(search.toLowerCase())) return false;
    if (cityFilter && l.city !== cityFilter) return false;
    if (maxDistance > 0 && l.distance != null && l.distance > maxDistance) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'highest') return (b.avg_feedback_rating || 0) - (a.avg_feedback_rating || 0);
    if (sortBy === 'most-reviews') return (b.total_feedback_count || 0) - (a.total_feedback_count || 0);
    if (sortBy === 'nearest' && userLocation) return (a.distance ?? 9999) - (b.distance ?? 9999);
    return 0;
  });

  const handleCategoryClick = (catId: string) => {
    setActiveCategory(catId);
    setActiveSubcategory('All');
    setShowGroupedBrowse(true);
    setShowListings(false);
    requestGeolocation();
    loadAllListings();
  };

  const handleSearch = () => {
    if (search.trim()) {
      setShowGroupedBrowse(false);
      setShowListings(true);
      setActiveCategory('');
      requestGeolocation();
      loadAllListings();
    }
  };

  const handleBrowseAll = () => {
    setShowGroupedBrowse(true);
    setActiveCategory('');
    requestGeolocation();
    loadAllListings();
  };

  // Hero search handler
  const handleHeroSearch = () => {
    if (search.trim()) {
      setShowGroupedBrowse(false);
      setShowListings(true);
      setActiveCategory('');
      requestGeolocation();
      loadAllListings();
      document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Show grouped browse or listing view
  if (showGroupedBrowse && !showListings) {
    return (
      <div className="min-h-screen">
        <GroupedBrowseView
          activeCategory={activeCategory}
          sortBy={sortBy}
          setSortBy={setSortBy}
          cityFilter={cityFilter}
          setCityFilter={setCityFilter}
          availableCities={availableCities}
          userLocation={userLocation}
          onViewAll={(sub) => { setActiveSubcategory(sub); setShowListings(true); setShowGroupedBrowse(false); }}
          onBack={() => { setShowGroupedBrowse(false); setActiveCategory(''); }}
          onCategorySwitch={(catId) => { setActiveCategory(catId); setActiveSubcategory('All'); }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {!showListings ? (
        <>
          {/* ═══════════════════════════════════════════════════════════
              HERO — CINEMATIC FULL-BLEED WITH DEPTH
              ═══════════════════════════════════════════════════════════ */}
          <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden" data-testid="hero-section">
            {/* Background Image Layer */}
            <div className="absolute inset-0">
              <Image
                src="/images/hero-directory.webp"
                alt="GreenLine365 Directory"
                fill
                priority
                className="w-full h-full object-cover"
                style={{ filter: 'brightness(0.35) saturate(1.2)' }}
              />
            </div>

            {/* Depth Gradient Overlay */}
            <div className="absolute inset-0" style={{
              background: `linear-gradient(
                to bottom,
                rgba(0,0,0,0.7) 0%,
                rgba(0,0,0,0.3) 25%,
                rgba(0,0,0,0.2) 50%,
                rgba(0,0,0,0.5) 70%,
                rgba(10,10,10,0.98) 100%
              )`
            }} />

            {/* Gold Light Trail Effect */}
            <div className="absolute inset-0 gold-light-trails" />

            {/* Gold Particles */}
            <div className="gold-particles">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="gold-particle"
                  style={{
                    left: `${15 + i * 10}%`,
                    animationDelay: `${i * 0.8}s`,
                    animationDuration: `${5 + i * 0.5}s`,
                  }}
                />
              ))}
            </div>

            {/* Hero Content */}
            <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
              {/* Gold accent line above headline */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 0.3 }}
                className="w-24 h-px mx-auto mb-8"
                style={{ background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)' }}
              />

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-medium tracking-[0.05rem] leading-[1.15] mb-6"
                style={{
                  background: 'linear-gradient(135deg, #C9A84C 0%, #E8C97A 40%, #F0DFA0 60%, #C9A84C 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Your Neighbor&apos;s Favorite Pros,<br />Places, &amp; Resources&mdash;All on GL365
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.8 }}
                className="text-lg sm:text-xl font-body font-medium text-white/70 tracking-[0.05rem] mb-12"
              >
                The local guide to everything you need, verified by the people you trust.
              </motion.p>

              {/* Search Pill */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 1.2 }}
                className="flex items-center gap-3 mx-auto max-w-2xl rounded-full px-4 sm:px-6 py-3 sm:py-4"
                style={{
                  background: 'rgba(255,255,255,0.95)',
                  boxShadow: '0 8px 40px rgba(0,0,0,0.4), 0 0 40px rgba(201,168,76,0.15)',
                }}
              >
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search for Excellence..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleHeroSearch()}
                  className="flex-1 bg-transparent text-gray-800 placeholder-gray-400 text-sm sm:text-base outline-none font-body"
                  data-testid="hero-search"
                />
                <button
                  onClick={handleHeroSearch}
                  className="flex-shrink-0 px-5 sm:px-8 py-2.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-widest text-white transition-all hover:shadow-gold-lg"
                  style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #8A6A1C 100%)' }}
                  data-testid="hero-search-btn"
                >
                  Find a Pro
                </button>
              </motion.div>

              {/* Live Stats — EXACT numbers, no padding */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 1.6 }}
                className="flex items-center justify-center gap-6 sm:gap-10 mt-10"
              >
                {[
                  { value: stats.businesses, label: 'Verified Businesses' },
                  { value: stats.categories, label: 'Categories' },
                  { value: stats.destinations, label: 'Destinations' },
                ].map((stat, i) => (
                  <div key={stat.label} className="flex items-center gap-3 sm:gap-4">
                    <div className="text-center">
                      <span className="block text-2xl sm:text-3xl font-heading font-bold text-white">
                        {stat.value > 0 ? stat.value : '...'}
                      </span>
                      <span className="block text-[10px] sm:text-xs text-white/50 uppercase tracking-wider font-body">{stat.label}</span>
                    </div>
                    {i < 2 && <div className="hidden sm:block w-px h-10 bg-white/15 ml-4" />}
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Bottom fade to obsidian */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
          </section>

          {/* ═══════════════════════════════════════════════════════════
              SECTION ANCHOR NAV
              ═══════════════════════════════════════════════════════════ */}
          <nav className="max-w-3xl mx-auto px-6 py-6" data-testid="anchor-nav">
            <div className="flex items-center justify-center gap-6 sm:gap-8 flex-wrap">
              {[
                { href: '#categories', label: 'Categories' },
                { href: '#featured', label: 'Featured' },
                { href: '#polls', label: 'Polls' },
                { href: '#destinations', label: 'Destinations' },
                { href: '#founding', label: 'Founding Members' },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-xs text-white/35 hover:text-gold/70 font-body tracking-wide uppercase transition-colors duration-300"
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="mt-4 h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.15), transparent)' }} />
          </nav>

          {/* ═══════════════════════════════════════════════════════════
              BROWSE BY CATEGORY
              ═══════════════════════════════════════════════════════════ */}
          <section id="categories" className="max-w-7xl mx-auto px-6 py-20" data-testid="categories-section">
            <p className="text-xs font-heading font-semibold uppercase tracking-[0.2em] text-center mb-3" style={{ color: '#C9A84C' }}>Browse By Category</p>
            <h2 className="text-3xl md:text-4xl font-heading font-light text-white text-center mb-3 tracking-tight">
              Explore <span className="text-gradient-gold font-semibold">Categories</span>
            </h2>
            <p className="text-white/50 text-center max-w-lg mx-auto mb-12 font-body">From home services to dining — find exactly what you need.</p>

            {/* 9-Category Grid with depth */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {CATEGORIES.map((cat, i) => {
                const count = allListings.filter(l => l.industry === cat.id).length;
                const isEmpty = count === 0;
                return (
                  <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className={`relative rounded-2xl overflow-hidden group transition-all duration-500 ${i === 0 ? 'md:col-span-2 md:row-span-2' : ''} ${isEmpty ? 'cursor-default' : 'cursor-pointer hover:shadow-gold-glow'}`}
                    style={{ minHeight: i === 0 ? 320 : 180, filter: isEmpty ? 'saturate(0.3) brightness(0.7)' : 'none' }}
                    onClick={() => !isEmpty && handleCategoryClick(cat.id)} data-testid={`cat-${cat.id}`}>
                    <Image src={cat.img} alt={`${cat.label} — ${cat.sub}`} fill className={`absolute inset-0 object-cover transition-transform duration-700 ${isEmpty ? '' : 'group-hover:scale-105'}`} sizes="(max-width: 768px) 100vw, 33vw" />
                    <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-all duration-500 ${isEmpty ? '' : 'group-hover:from-black/95'}`} />
                    {/* Coming Soon badge for empty categories */}
                    {isEmpty && (
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-heading font-semibold uppercase tracking-wider text-white/70"
                        style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        Coming Q2 2026
                      </div>
                    )}
                    <div className="absolute bottom-4 left-4">
                      <span className={`text-white font-heading font-semibold block tracking-tight ${i === 0 ? 'text-2xl' : 'text-base'} ${isEmpty ? 'opacity-60' : ''}`}>{cat.label}</span>
                      <span className={`text-xs font-body ${isEmpty ? 'text-white/30' : 'text-white/50'}`}>{cat.sub}</span>
                      {count > 0 ? (
                        <span className="text-[10px] font-body mt-1.5 flex items-center gap-1" style={{ color: 'rgba(201,168,76,0.8)' }}>
                          Browse Now
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                        </span>
                      ) : (
                        <span className="text-[10px] font-body mt-1 block text-white/25">Coming soon</span>
                      )}
                    </div>
                    {i === 0 && !isEmpty && <span className="absolute top-3 right-3 text-[10px] px-2.5 py-1 rounded-full font-heading font-semibold uppercase tracking-wider text-black" style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C97A)' }}>Core</span>}
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════
              DYNAMIC FEATURED SHOWCASE — R-to-L CAROUSEL
              ═══════════════════════════════════════════════════════════ */}
          <section id="featured" className="py-20" style={{ background: 'linear-gradient(180deg, #0A0A0A 0%, #060606 50%, #0A0A0A 100%)' }} data-testid="dynamic-showcase-section">
            <div className="max-w-7xl mx-auto px-6">
              <FeaturedShowcase className="mb-0" maxSlots={12} />
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════
              BOOSTED SHOWCASE — SPONSORED CAROUSEL
              ═══════════════════════════════════════════════════════════ */}
          <SponsoredSection />

          {/* ═══════════════════════════════════════════════════════════
              FEATURED LISTINGS
              ═══════════════════════════════════════════════════════════ */}
          <section id="featured" className="py-20" style={{ background: 'linear-gradient(180deg, #080808 0%, #0A0A0A 50%, #080808 100%)' }} data-testid="featured-listings-section">
            <div className="max-w-7xl mx-auto px-6">
              <p className="text-xs font-heading font-semibold uppercase tracking-[0.2em] text-center mb-3" style={{ color: '#C9A84C' }}>Showcase</p>
              <h2 className="text-3xl md:text-4xl font-heading font-light text-white text-center mb-3 tracking-tight">
                Featured <span className="text-gradient-gold font-semibold">Listings</span>
              </h2>
              <p className="text-white/50 text-center max-w-lg mx-auto mb-12 font-body">Top-rated businesses handpicked for exceptional service.</p>

              {featuredListings.length > 0 ? (
                <div className="space-y-14">
                  {premierPartners.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-8 rounded-full" style={{ background: '#C9A84C' }} />
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
                  {[1,2,3].map(i => <div key={i} className="h-72 rounded-2xl bg-white/[0.03] animate-pulse" />)}
                </div>
              )}

              <div className="text-center mt-12">
                <button onClick={() => { setShowGroupedBrowse(true); setActiveCategory(''); }} className="btn-primary px-8 py-3 rounded-full text-sm" data-testid="view-all-listings-btn">View All Listings</button>
                <p className="text-white/30 text-xs mt-3 font-body">Want your business featured? <Link href="/register-business" className="underline hover:text-gold transition" style={{ color: 'rgba(201,168,76,0.7)' }}>Upgrade your listing</Link></p>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════
              SEO TRUST SECTION — Your Trusted Local Home Services Resource
              ═══════════════════════════════════════════════════════════ */}
          <section className="py-20" style={{ background: '#0A0A0A' }} data-testid="seo-trust-section">
            <div className="max-w-6xl mx-auto px-6">
              <h2 className="text-3xl sm:text-4xl font-heading font-light text-white tracking-tight mb-4 text-center">
                Your Trusted Local <span className="text-gradient-gold font-semibold">Home Services</span> Resource
              </h2>
              <p className="text-sm text-white/40 text-center max-w-2xl mx-auto mb-12 font-body">Where Florida&apos;s local economy connects — homeowners, professionals, and communities.</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Shield — Verified Businesses */}
                <div className="text-center p-6 rounded-2xl border border-white/5 hover:border-gold/15 transition-all duration-300" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)' }}>
                    <svg className="w-7 h-7" style={{ color: '#C9A84C' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-heading font-semibold text-white mb-3">Verified Businesses</h3>
                  <p className="text-sm text-white/45 font-body leading-relaxed">Every listing includes real ratings, verified contact info, and honest feedback from your neighbors. No anonymous reviews, no fake profiles.</p>
                </div>

                {/* Star — Real Ratings */}
                <div className="text-center p-6 rounded-2xl border border-white/5 hover:border-gold/15 transition-all duration-300" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)' }}>
                    <svg className="w-7 h-7" style={{ color: '#C9A84C' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-heading font-semibold text-white mb-3">Real Ratings</h3>
                  <p className="text-sm text-white/45 font-body leading-relaxed">Google ratings, QR-verified reviews, and AI-analyzed sentiment — every data point is real and tied to actual customer interactions.</p>
                </div>

                {/* Map Pin — 8 Florida Cities */}
                <div className="text-center p-6 rounded-2xl border border-white/5 hover:border-gold/15 transition-all duration-300" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)' }}>
                    <svg className="w-7 h-7" style={{ color: '#C9A84C' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-heading font-semibold text-white mb-3">8 Florida Cities</h3>
                  <p className="text-sm text-white/45 font-body leading-relaxed">From HVAC and plumbing to dining and wellness — we cover every trade and category across eight major Florida destinations.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════
              COMMUNITY POLLS — "YOU VOTED" WIDGET
              ═══════════════════════════════════════════════════════════ */}
          <section id="polls" className="py-16" style={{ background: '#0A0A0A' }} data-testid="community-polls-section">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-8">
                <p className="text-xs font-heading font-semibold uppercase tracking-[0.2em] mb-3" style={{ color: '#C9A84C' }}>Community Voice</p>
                <h2 className="text-3xl md:text-4xl font-heading font-light text-white tracking-tight mb-3">
                  You <span className="text-gradient-gold font-semibold">Voted</span>
                </h2>
                <p className="text-white/50 text-sm max-w-md mx-auto font-body">Help your neighbors find the best local pros.</p>
              </div>
              <CommunityPolls />
              <div className="text-center mt-6">
                <Link href="/community/polls" className="text-xs text-white/35 hover:text-gold/70 font-body transition-colors duration-300">
                  See all polls &rarr;
                </Link>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════
              TESTIMONIALS — REAL DATA FROM DIRECTORY REVIEWS
              ═══════════════════════════════════════════════════════════ */}
          <TestimonialsSection />

          {/* ═══════════════════════════════════════════════════════════
              DESTINATION GUIDES — GOLD FRAME 8-CARD GRID
              ═══════════════════════════════════════════════════════════ */}
          <section id="destinations" className="section-gradient-blue-gold py-24 bg-gold-accent-top" data-testid="destination-guides-section">
            <div className="section-divider-gold max-w-5xl mx-auto mb-16" />

            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-14 corner-filigree py-8 px-4">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-light text-white tracking-tight mb-4">
                  Explore Florida&apos;s Best <span className="text-gradient-gold font-semibold">Destinations</span>
                </h2>
                <p className="text-sm text-white/50 max-w-xl mx-auto font-body leading-relaxed">
                  Discover local dining, entertainment, attractions and more in cities across Florida.
                </p>
              </div>

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
                  <motion.div key={d.slug} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.07, duration: 0.5 }}>
                    <Link href={`/directory?q=${encodeURIComponent(d.label)}`} className="block dest-card-frame group" data-testid={`dest-card-${d.slug}`}>
                      <div className="dest-card-inner">
                        <div className="relative overflow-hidden" style={{ aspectRatio: '4/3', minHeight: '180px' }}>
                          <DestImage src={d.image} alt={`${d.label} destination guide — ${d.tagline}`} label={d.label} />
                        </div>
                        <div className="dest-glass-label px-4 py-3">
                          <h3 className="text-sm sm:text-base font-heading font-bold text-white tracking-tight leading-tight">{d.label}</h3>
                          <p className="text-[10px] sm:text-xs font-body mt-0.5" style={{ color: 'rgba(201,168,76,0.6)' }}>{d.tagline}</p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="section-divider-gold max-w-5xl mx-auto mt-16" />
          </section>

          {/* ═══════════════════════════════════════════════════════════
              THE FOUNDING 50 — Directory Founding Members Program
              ═══════════════════════════════════════════════════════════ */}
          <section id="founding" className="py-24 relative overflow-hidden" data-testid="founding-50-section">
            {/* Subtle radial glow */}
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(201,168,76,0.06) 0%, transparent 60%)' }} />

            <div className="relative max-w-5xl mx-auto px-6">
              <div className="section-divider-gold mx-auto mb-16" />

              <div className="text-center mb-12">
                <p className="text-xs font-heading font-semibold uppercase tracking-[0.25em] mb-4" style={{ color: 'rgba(201,168,76,0.7)' }}>Limited to 50 Businesses</p>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-light text-white tracking-tight mb-4">
                  Be the Business Everyone Else <span className="text-gradient-gold font-semibold">References</span>
                </h2>
                <p className="text-white/50 max-w-2xl mx-auto font-body leading-relaxed">
                  GreenLine365 is accepting Founding Member listings in the Tampa Bay area. The first 50 verified businesses get featured placement, priority support, and locked-in early pricing — before the platform scales.
                </p>
              </div>

              {/* Launch Status */}
              <div className="max-w-md mx-auto mb-12 text-center">
                <p className="text-sm font-heading font-semibold tracking-wide" style={{ color: 'rgba(201,168,76,0.8)' }}>
                  Applications now open — secure your spot before launch
                </p>
              </div>

              {/* 4 Benefits Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {[
                  { icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4', title: 'Locked-In Rates Forever', desc: 'Your listing rate frozen at early pricing, even as prices increase.' },
                  { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', title: 'Founding Member Badge', desc: 'A permanent badge on your listing card that signals trust and early adoption.' },
                  { icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z', title: 'Priority Placement', desc: 'Featured on the homepage and at the top of your category pages.' },
                  { icon: 'M13 10V3L4 14h7v7l9-11h-7z', title: 'Early Access', desc: 'First to test new features and tools before they go public.' },
                ].map(b => (
                  <div key={b.title} className="text-center p-6 rounded-2xl border border-white/5 hover:border-gold/20 transition-all duration-300" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center glass-gold">
                      <svg className="w-6 h-6" style={{ color: '#C9A84C' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={b.icon} />
                      </svg>
                    </div>
                    <h3 className="text-sm font-heading font-semibold text-white mb-2">{b.title}</h3>
                    <p className="text-xs text-white/40 font-body leading-relaxed">{b.desc}</p>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="text-center">
                <Link
                  href="/register-business"
                  className="btn-primary px-10 py-4 rounded-full text-sm font-semibold inline-block"
                  data-testid="founding-50-cta"
                >
                  Claim Your Founding Spot
                </Link>
                <p className="text-xs text-white/30 mt-4 font-body">Free listing. No credit card required.</p>
              </div>

              <div className="section-divider-gold mx-auto mt-16" />
            </div>
          </section>
        </>
      ) : (
        /* ═══════════════════════════════════════════════════════════
           CATEGORY BROWSE VIEW
           ═══════════════════════════════════════════════════════════ */
        <div data-testid="listings-view">
          {/* Category Header */}
          <section className="relative pt-20 pb-8 overflow-hidden" style={{ background: '#050505' }}>
            {currentCat && (
              <div className="absolute inset-0 opacity-20">
                <Image src={currentCat.img} alt={`${currentCat.label} category background`} fill className="object-cover" sizes="100vw" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/60 via-[#050505]/80 to-[#050505]" />

            <div className="relative max-w-7xl mx-auto px-6">
              <button type="button" onClick={() => { setShowListings(false); setShowGroupedBrowse(true); setActiveCategory(''); }} className="text-sm text-white/40 hover:text-white mb-6 flex items-center gap-2 transition font-body" data-testid="back-to-explore-btn">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back to All Categories
              </button>

              {/* Category Switcher Pills */}
              <div className="flex flex-wrap gap-2 mb-5" data-testid="listing-category-switcher">
                {CATEGORIES.map(cat => (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => { setActiveCategory(cat.id); setActiveSubcategory('All'); }}
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 font-body ${
                      activeCategory === cat.id
                        ? 'bg-[rgba(201,168,76,0.15)] text-[#C9A84C] border border-[rgba(201,168,76,0.3)]'
                        : 'text-white/40 border border-white/10 hover:text-white/70 hover:border-white/20'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <h2 className="text-3xl md:text-4xl font-heading font-light text-white mb-2 tracking-tight">
                {currentCat?.label || 'All Businesses'}
              </h2>
              <p className="text-white/40 text-sm mb-6 font-body">{currentCat?.sub || 'Browse verified businesses across all categories'}</p>

              {/* Search */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="flex-1 relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input type="text" placeholder="Search within category..." value={search} onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-11 pr-4 py-3 rounded-xl text-sm bg-white/5 text-white placeholder-white/25 border border-white/10 focus:outline-none focus:border-[rgba(201,168,76,0.3)] font-body" data-testid="list-search" />
                </div>
                <button onClick={handleSearch} className="btn-primary px-8 py-3 rounded-xl text-sm">Search</button>
              </div>

              {/* Filters Row */}
              <div className="flex flex-wrap items-center gap-2 mb-4" data-testid="location-filter">
                <select
                  value={cityFilter}
                  onChange={e => setCityFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg text-xs bg-white/5 text-white border border-white/10 focus:outline-none focus:border-[rgba(201,168,76,0.3)] font-body appearance-none cursor-pointer"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23888\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: '28px' }}
                  data-testid="city-filter-select"
                >
                  <option value="">All Locations</option>
                  {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <div className="flex items-center gap-1 border border-white/10 rounded-lg overflow-hidden" data-testid="sort-filter">
                  {([
                    { id: 'nearest' as const, label: 'Nearest' },
                    { id: 'highest' as const, label: 'Top Rated' },
                    { id: 'most-reviews' as const, label: 'Most Reviews' },
                  ] as const).map(s => (
                    <button key={s.id} onClick={() => setSortBy(s.id)}
                      className={`px-3 py-2 text-[11px] font-medium transition-all font-body ${sortBy === s.id ? 'bg-[rgba(201,168,76,0.15)] text-[#C9A84C]' : 'text-white/35 hover:text-white/55'}`}
                      data-testid={`sort-${s.id}`}>
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

                {userLocation && (
                  <select value={maxDistance} onChange={e => setMaxDistance(Number(e.target.value))}
                    className="px-3 py-2 rounded-lg text-xs bg-white/5 text-white border border-white/10 focus:outline-none focus:border-[rgba(201,168,76,0.3)] font-body appearance-none cursor-pointer"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23888\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: '28px' }}
                    data-testid="distance-filter">
                    <option value={0}>Any Distance</option>
                    <option value={1}>Within 1 mile</option>
                    <option value={5}>Within 5 miles</option>
                    <option value={10}>Within 10 miles</option>
                    <option value={25}>Within 25 miles</option>
                    <option value={50}>Within 50 miles</option>
                  </select>
                )}

                {(cityFilter || maxDistance > 0) && (
                  <button onClick={() => { setCityFilter(''); setMaxDistance(0); setSortBy('nearest'); }}
                    className="text-[10px] text-white/40 hover:text-[#C9A84C] transition font-body">
                    Clear filters
                  </button>
                )}
              </div>

              {/* Subcategory Pill Tabs */}
              <div className="flex flex-wrap gap-2" data-testid="subcategory-tabs">
                {subcategories.map(sub => (
                  <button type="button" key={sub} onClick={() => setActiveSubcategory(sub)}
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 font-body ${
                      activeSubcategory === sub
                        ? 'bg-[rgba(201,168,76,0.15)] text-[#C9A84C] border border-[rgba(201,168,76,0.3)]'
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
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 overflow-hidden">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-64 rounded-2xl animate-pulse bg-white/[0.03]" />)}
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="text-center py-16" data-testid="no-results">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center glass-gold">
                  <svg className="w-12 h-12" style={{ color: '#C9A84C' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-heading font-light text-white mb-3">{search ? 'No results found' : 'Coming soon'}</h3>
                <p className="text-sm text-white/40 max-w-md mx-auto mb-8 font-body">
                  {search ? `No businesses matched "${search}".` : `No listings in "${activeSubcategory}" yet. Be the first!`}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Link href="/register-business" className="btn-primary px-6 py-3 rounded-xl text-sm" data-testid="register-from-empty">Add Your Business</Link>
                  <button onClick={() => setActiveSubcategory('All')} className="btn-ghost px-6 py-3 rounded-xl text-sm">Show All</button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-white/30 text-xs mb-4 font-body">{filteredListings.length} businesses found</p>
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
  const [imgError, setImgError] = useState(false);
  const placeholderUrl = getPlaceholderImage(l.industry);
  const fallback = getCategoryFallback(l.industry);
  const imgSrc = l.cover_image_url || l.logo_url || placeholderUrl;

  // Prefer Google data, fall back to internal feedback
  const rating = l.metadata?.google_rating || l.avg_feedback_rating || 0;
  const reviewCount = l.metadata?.google_review_count || l.total_feedback_count || 0;
  const hasRating = rating > 0;

  return (
    <Link href={`/listing/${l.slug}`}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
        className={`rounded-2xl overflow-hidden border transition-all duration-500 group cursor-pointer hover:scale-[1.02] ${hasIntel ? 'border-[rgba(201,168,76,0.2)] shadow-gold-glow hover:border-[rgba(201,168,76,0.4)]' : 'border-white/5 hover:border-[rgba(201,168,76,0.25)]'}`}
        style={{ background: 'rgba(255,255,255,0.02)' }}
        whileHover={{ boxShadow: '0 0 15px rgba(212,175,55,0.3)' }}
        data-testid={`listing-${l.slug}`}>
        <div className="relative h-40 overflow-hidden">
          {!imgError ? (
            <Image src={imgSrc} alt={`${l.business_name} — ${l.industry.replace(/-/g, ' ')} in ${l.city || 'Florida'}`} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" onError={() => setImgError(true)} />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: fallback.gradient }}>
              <span className="text-4xl">{fallback.icon}</span>
            </div>
          )}
          <span className="absolute top-3 left-3 text-[10px] px-2 py-1 rounded-full backdrop-blur-sm capitalize font-body" style={{ background: 'rgba(10,10,10,0.7)', color: 'rgba(255,255,255,0.6)' }}>{l.industry.replace(/-/g, ' ')}</span>
          {hasIntel && <div className="absolute top-3 right-3"><PropertyIntelBadge /></div>}
          {l.tier !== 'free' && !hasIntel && (
            <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full font-heading font-semibold uppercase tracking-wider text-black"
              style={{ background: l.tier === 'premium' ? 'linear-gradient(135deg, #C9A84C, #E8C97A)' : 'linear-gradient(135deg, #A8A9AD, #C0C0C0)' }}>
              {l.tier === 'premium' ? 'Premier' : 'Pro'}
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-heading font-semibold text-sm truncate mb-1" style={{ color: '#C9A84C' }} title={l.business_name}>{l.business_name}</h3>
          {l.city && <p className="text-[11px] text-white/40 flex items-center gap-1 mb-1 font-body">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {l.city}, {l.state}
            {l.distance != null && <span style={{ color: 'rgba(201,168,76,0.6)' }} className="ml-1">({l.distance} mi)</span>}
          </p>}
          <p className="text-xs text-white/35 line-clamp-2 mb-3 font-body">{l.description || getFallbackDescription(l.business_name, l.industry, l.city)}</p>
          {/* Social proof row: ★ 4.2 (584 reviews) • Verified */}
          <div className="flex items-center gap-1.5 text-[11px] text-white/40 font-body mb-3">
            {hasRating ? (
              <>
                <span style={{ color: '#C9A84C' }}>&#9733; {Number(rating).toFixed(1)}</span>
                {reviewCount > 0 && <span>({reviewCount.toLocaleString()} {reviewCount === 1 ? 'review' : 'reviews'})</span>}
                {l.is_claimed && (
                  <>
                    <span className="text-white/15">&bull;</span>
                    <span className="text-green-400/70">Verified &#10003;</span>
                  </>
                )}
              </>
            ) : (
              <>
                <span className="text-white/25">New listing</span>
                {l.is_claimed && (
                  <>
                    <span className="text-white/15">&bull;</span>
                    <span className="text-green-400/70">Verified &#10003;</span>
                  </>
                )}
              </>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="btn-ghost text-xs px-3 py-1.5 rounded-full" data-testid={`view-details-${l.slug}`}>View Details</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// ─── Destination Image with Fallback ─────────────────────────────────
function DestImage({ src, alt, label }: { src: string; alt: string; label: string }) {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center relative"
        style={{ background: 'linear-gradient(135deg, #0d1a2e 0%, #1a1008 40%, #0a1020 100%)' }}>
        <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(201,168,76,0.3) 0%, transparent 70%)' }} />
        <span className="text-5xl mb-2 relative z-10">📍</span>
        <span className="text-sm font-heading font-semibold relative z-10" style={{ color: 'rgba(201,168,76,0.7)' }}>{label}</span>
      </div>
    );
  }
  return <Image src={src} alt={alt} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw" onError={() => setError(true)} />;
}

// ─── Subcategory Carousel Row ──────────────────────────────────────
function SubcategoryCarouselRow({ label, subtitle, industry, searchTerm, sortBy, cityFilter, userLocation, onViewAll }: {
  label: string;
  subtitle: string;
  industry: string;
  searchTerm: string;
  sortBy: string;
  cityFilter: string;
  userLocation: { lat: number; lng: number } | null;
  onViewAll: () => void;
}) {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const params = new URLSearchParams({ limit: '20', industry });
      if (searchTerm) params.set('search', searchTerm);
      if (cityFilter) params.set('city', cityFilter);
      if (userLocation) {
        params.set('lat', String(userLocation.lat));
        params.set('lng', String(userLocation.lng));
      }
      try {
        const res = await fetch(`/api/directory?${params}`);
        let data = await res.json();
        if (!Array.isArray(data)) data = [];

        if (sortBy === 'highest') {
          data.sort((a: any, b: any) => {
            const rA = a.metadata?.google_rating || a.avg_feedback_rating || 0;
            const rB = b.metadata?.google_rating || b.avg_feedback_rating || 0;
            return rB - rA;
          });
        } else if (sortBy === 'most-reviews') {
          data.sort((a: any, b: any) => {
            const rA = a.metadata?.google_review_count || a.total_feedback_count || 0;
            const rB = b.metadata?.google_review_count || b.total_feedback_count || 0;
            return rB - rA;
          });
        } else if (sortBy === 'nearest' && userLocation) {
          data.sort((a: any, b: any) => (a.distance ?? 9999) - (b.distance ?? 9999));
        }

        setItems(data.slice(0, 10));
      } catch { setItems([]); }
      setLoading(false);
    };
    fetchData();
  }, [industry, searchTerm, sortBy, cityFilter, userLocation?.lat]);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.firstElementChild?.clientWidth || 280;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -cardWidth * 2 : cardWidth * 2, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4 px-4 sm:px-6">
          <div className="h-6 w-40 rounded bg-white/5 animate-pulse" />
        </div>
        <div className="flex gap-4 px-4 sm:px-6">
          {[1,2,3,4,5].map(i => <div key={i} className="flex-shrink-0 w-56 sm:w-64 h-52 rounded-2xl bg-white/5 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="mb-10" data-testid={`carousel-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-center justify-between mb-4 px-4 sm:px-6">
        <div>
          <h3 className="text-xl font-heading font-semibold text-white">{label}</h3>
          {subtitle && <p className="text-xs text-white/40 font-body">{subtitle}</p>}
        </div>
        <button onClick={onViewAll}
          className="text-sm font-medium font-body flex items-center gap-1 transition"
          style={{ color: 'rgba(201,168,76,0.7)' }}
          data-testid={`view-all-${label.toLowerCase().replace(/\s+/g, '-')}`}>
          View All
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <div className="relative group">
        <button onClick={() => scroll('left')}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[#0A0A0A]/90 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-[rgba(201,168,76,0.3)] transition opacity-0 group-hover:opacity-100 backdrop-blur-sm"
          data-testid={`scroll-left-${label}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>

        <div ref={scrollRef} className="flex gap-4 overflow-x-auto px-4 sm:px-6 pb-2 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {items.map((l, i) => (
            <Link key={l.id} href={`/listing/${l.slug}`} className="flex-shrink-0 w-[45%] sm:w-[30%] md:w-[22%] lg:w-[18.5%] snap-start">
              <div className="rounded-2xl overflow-hidden border border-white/5 hover:border-[rgba(201,168,76,0.25)] hover:scale-[1.02] transition-all duration-300 ease-out group/card cursor-pointer h-full"
                style={{ background: 'rgba(255,255,255,0.02)' }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 15px rgba(212,175,55,0.3), 0 8px 30px rgba(0,0,0,0.3)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                data-testid={`carousel-card-${l.slug}`}>
                <div className="relative h-32 sm:h-36 overflow-hidden">
                  {l.cover_image_url ? (
                    <Image src={l.cover_image_url} alt={l.business_name} fill className="object-cover group-hover/card:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 45vw, (max-width: 1024px) 30vw, 18.5vw" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #111 0%, #1A1A1A 100%)' }}>
                      <span className="text-3xl font-heading text-white/10">{l.business_name[0]}</span>
                    </div>
                  )}
                  {l.metadata?.google_rating && (
                    <span className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(201,168,76,0.9)', color: '#1a1a1a' }}>
                      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                      {l.metadata.google_rating}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <h4 className="text-sm font-heading font-semibold truncate" style={{ color: '#C9A84C' }}>{l.business_name}</h4>
                  <p className="text-[11px] text-white/40 font-body truncate">{l.city}{l.distance != null ? ` · ${l.distance} mi` : ''}</p>
                  {/* Social proof */}
                  {(() => {
                    const r = l.metadata?.google_rating || l.avg_feedback_rating || 0;
                    const rc = l.metadata?.google_review_count || l.total_feedback_count || 0;
                    return r > 0 ? (
                      <p className="text-[10px] text-white/35 font-body mt-1 truncate">
                        <span style={{ color: '#C9A84C' }}>&#9733; {Number(r).toFixed(1)}</span>
                        {rc > 0 && <span> ({rc.toLocaleString()})</span>}
                        {l.is_claimed && <span className="text-green-400/60"> &bull; Verified</span>}
                      </p>
                    ) : l.is_claimed ? (
                      <p className="text-[10px] text-green-400/50 font-body mt-1">Verified &#10003;</p>
                    ) : null;
                  })()}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <button onClick={() => scroll('right')}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[#0A0A0A]/90 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-[rgba(201,168,76,0.3)] transition opacity-0 group-hover:opacity-100 backdrop-blur-sm"
          data-testid={`scroll-right-${label}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  );
}

// ─── Grouped Browse View ───────────────────────────────────────────
function GroupedBrowseView({ activeCategory, sortBy, setSortBy, cityFilter, setCityFilter, availableCities, userLocation, onViewAll, onBack, onCategorySwitch }: {
  activeCategory: string;
  sortBy: string;
  setSortBy: (s: any) => void;
  cityFilter: string;
  setCityFilter: (s: string) => void;
  availableCities: string[];
  userLocation: { lat: number; lng: number } | null;
  onViewAll: (sub: string) => void;
  onBack: () => void;
  onCategorySwitch: (catId: string) => void;
}) {
  const currentCat = CATEGORIES.find(c => c.id === activeCategory);
  const rows = currentCat
    ? currentCat.subcategories.filter(s => s !== 'All').map(sub => ({ id: sub, label: sub, sub: '', searchTerm: sub }))
    : CATEGORIES.map(c => ({ id: c.id, label: c.label, sub: c.sub, searchTerm: '' }));

  const industryMap: Record<string, string> = {
    'services': 'services', 'automotive': 'automotive', 'marine-outdoor': 'marine-outdoor',
    'dining': 'dining', 'health-wellness': 'health-wellness',
    'style-shopping': 'style-shopping', 'professional-services': 'services',
    'education': 'education', 'pets': 'pets',
  };

  return (
    <div data-testid="grouped-browse-view">
      <section className="relative pt-20 pb-6 overflow-hidden" style={{ background: '#050505' }}>
        {currentCat && (
          <div className="absolute inset-0 opacity-15">
            <Image src={currentCat.img} alt={`${currentCat.label} category background`} fill className="object-cover" sizes="100vw" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/60 to-[#050505]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <button type="button" onClick={onBack} className="text-sm text-white/40 hover:text-white mb-4 flex items-center gap-2 transition font-body" data-testid="back-from-grouped">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Directory
          </button>

          {/* Category Switcher Pills */}
          <div className="flex flex-wrap gap-2 mb-5" data-testid="category-switcher">
            {CATEGORIES.map(cat => (
              <button
                type="button"
                key={cat.id}
                onClick={() => onCategorySwitch(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 font-body ${
                  activeCategory === cat.id
                    ? 'bg-[rgba(201,168,76,0.15)] text-[#C9A84C] border border-[rgba(201,168,76,0.3)]'
                    : 'text-white/40 border border-white/10 hover:text-white/70 hover:border-white/20'
                }`}
                data-testid={`cat-pill-${cat.id}`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <h2 className="text-3xl md:text-4xl font-heading font-light text-white mb-2 tracking-tight">
            {currentCat ? currentCat.label : 'Browse'} <span className="text-gradient-gold font-semibold">{currentCat ? '' : 'All Businesses'}</span>
          </h2>
          <p className="text-white/40 text-sm mb-6 font-body">{currentCat?.sub || 'Verified businesses across all categories'}</p>

          <div className="flex flex-wrap items-center gap-3">
            <select value={cityFilter} onChange={e => setCityFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl text-sm bg-white/5 text-white border border-white/10 focus:outline-none focus:border-[rgba(201,168,76,0.3)] font-body appearance-none cursor-pointer"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23C9A84C\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '32px' }}
              data-testid="grouped-city-filter">
              <option value="">All Locations</option>
              {availableCities.filter(c => c !== 'Nashville').map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <div className="flex items-center gap-1 border border-white/10 rounded-xl overflow-hidden">
              {[
                { id: 'nearest', label: 'Nearest' },
                { id: 'highest', label: 'Top Rated' },
                { id: 'most-reviews', label: 'Most Reviews' },
              ].map(s => (
                <button key={s.id} onClick={() => setSortBy(s.id)}
                  className={`px-4 py-2.5 text-sm font-medium transition-all font-body ${sortBy === s.id ? 'bg-[rgba(201,168,76,0.15)] text-[#C9A84C]' : 'text-white/40 hover:text-white'}`}
                  data-testid={`grouped-sort-${s.id}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto py-8">
        {rows.map(row => (
          <SubcategoryCarouselRow
            key={`${row.id}-${sortBy}-${cityFilter}`}
            label={row.label}
            subtitle={row.sub}
            industry={currentCat ? (industryMap[activeCategory] || activeCategory) : (industryMap[row.id] || row.id)}
            searchTerm={row.searchTerm}
            sortBy={sortBy}
            cityFilter={cityFilter}
            userLocation={userLocation}
            onViewAll={() => onViewAll(row.id)}
          />
        ))}
      </section>
    </div>
  );
}

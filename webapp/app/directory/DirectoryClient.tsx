'use client';

/**
 * GL365 Directory — Black & Gold Luxury Landing
 * Full-bleed cinematic hero, gold serif headlines, pill search bar.
 * NO fake testimonials. Exact stat numbers. Depth over flatness.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import BoostedShowcase from '@/components/BoostedShowcase';

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
  business_hours?: Record<string, { open: string; close: string; closed?: boolean }> | null;
  service_areas?: string[];
  directory_badges: { id: string; badge_type: string; badge_label: string; badge_color: string }[];
  distance?: number | null;
  metadata?: Record<string, any>;
}

/** Check if a business is currently open */
function isBusinessOpen(hours?: Record<string, { open: string; close: string; closed?: boolean }> | null): boolean | null {
  if (!hours || Object.keys(hours).length === 0) return null;
  const now = new Date();
  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const today = dayNames[now.getDay()];
  const todayHours = hours[today];
  if (!todayHours || todayHours.closed) return false;
  const parseTime = (t: string): number => {
    const cleaned = t.trim().toUpperCase();
    const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
    if (!match) return -1;
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    if (match[3] === 'PM' && h !== 12) h += 12;
    if (match[3] === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  };
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const openMin = parseTime(todayHours.open);
  const closeMin = parseTime(todayHours.close);
  if (openMin === -1 || closeMin === -1) return null;
  return nowMin >= openMin && nowMin < closeMin;
}

// ─── Service Areas for browsing ──────────────────────────────────
const SERVICE_AREAS = [
  { id: 'pinellas-county', label: 'Pinellas County', cities: ['St. Petersburg', 'St Pete Beach', 'Clearwater', 'Largo', 'Dunedin', 'Tarpon Springs', 'Pinellas Park', 'Seminole'] },
  { id: 'hillsborough-county', label: 'Hillsborough County', cities: ['Tampa', 'Brandon', 'Plant City', 'Temple Terrace', 'Riverview', 'Valrico'] },
  { id: 'manatee-sarasota', label: 'Manatee & Sarasota', cities: ['Sarasota', 'Bradenton', 'Palmetto', 'Lakewood Ranch', 'Venice', 'North Port'] },
  { id: 'pasco-county', label: 'Pasco County', cities: ['New Port Richey', 'Hudson', 'Wesley Chapel', 'Zephyrhills', 'Dade City', 'Land O Lakes'] },
  { id: 'polk-county', label: 'Polk County', cities: ['Lakeland', 'Winter Haven', 'Bartow', 'Auburndale', 'Haines City'] },
  { id: 'orange-county', label: 'Orange County', cities: ['Orlando', 'Winter Park', 'Kissimmee', 'Apopka', 'Ocoee'] },
  { id: 'miami-dade', label: 'Miami-Dade', cities: ['Miami', 'Miami Beach', 'Coral Gables', 'Hialeah', 'Homestead', 'Doral'] },
  { id: 'duval-county', label: 'Duval County', cities: ['Jacksonville', 'Jacksonville Beach', 'Neptune Beach', 'Atlantic Beach'] },
  { id: 'volusia-county', label: 'Volusia County', cities: ['Daytona Beach', 'Ormond Beach', 'Port Orange', 'DeLand', 'New Smyrna Beach'] },
  { id: 'monroe-county', label: 'Monroe County (The Keys)', cities: ['Key West', 'Key Largo', 'Marathon', 'Islamorada', 'Big Pine Key'] },
];

// ─── Category & Subcategory Map ────────────────────────────────────
// Industries where businesses should NOT show "Claim Listing" (chains, franchises, emergency services)
const NON_CLAIMABLE_INDUSTRIES = ['convenience-grocery', 'emergency-services'];

const CATEGORIES = [
  // === HOME SERVICES (The Big Five + all trades) ===
  { id: 'services', label: 'Home Services', sub: 'HVAC, Plumbing, Electrical & Every Trade', img: '/images/categories/services.png',
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
  { id: 'automotive', label: 'Automotive', sub: 'Repairs, dealers & body shops', img: '/images/categories/services.png',
    subcategories: ['All', 'Auto Repair', 'Oil Change', 'Tire Shops', 'Body Shops', 'Car Dealers', 'Auto Parts', 'Towing', 'Car Wash', 'Auto Detailing', 'EV Charging'] },

  // === MARINE & OUTDOOR (Key West / Coastal Florida) ===
  { id: 'marine-outdoor', label: 'Marine & Outdoor', sub: 'Boats, docks & outdoor adventure', img: '/images/categories/destinations.png',
    subcategories: ['All', 'Boat Repair', 'Marine Mechanics', 'Dock & Lift', 'Boat Cleaning', 'Fishing Charters', 'Kayak & Paddleboard', 'Dive Shops', 'Marinas'] },

  // === DINING ===
  { id: 'dining', label: 'Dining', sub: 'Cafes, casual & fine dining', img: '/images/categories/dining.png',
    subcategories: ['All', 'Fine Dining', 'Casual', 'Cafes & Bakeries', 'Food Trucks', 'Seafood', 'BBQ', 'Pizza', 'Mexican', 'Asian', 'Italian', 'Breakfast & Brunch', 'Vegan & Vegetarian'] },

  // === HEALTH & WELLNESS ===
  { id: 'health-wellness', label: 'Health & Wellness', sub: 'Doctors, dentists, fitness & more', img: '/images/categories/health-wellness.png',
    subcategories: ['All', 'Dental Offices', 'Physical Therapy', 'Medical Clinics', 'Mental Health', 'Fitness', 'Chiropractors', 'Optometrists', 'Urgent Care', 'Pharmacies', 'Dermatology', 'Orthopedics'] },

  // === STYLE & SHOPPING ===
  { id: 'style-shopping', label: 'Style & Shopping', sub: 'Fashion, grooming & retail', img: '/images/categories/style-shopping.png',
    subcategories: ['All', 'Barbershops', 'Salons', 'Nail Salons', 'Spas', 'Boutiques', 'Jewelry', 'Tattoo & Piercing', 'Dry Cleaning & Laundry'] },

  // === NIGHTLIFE ===
  { id: 'nightlife', label: 'Nightlife', sub: 'Bars, lounges & live music', img: '/images/categories/nightlife.png',
    subcategories: ['All', 'Cocktail Bars', 'Sports Bars', 'Live Music', 'Clubs', 'Breweries', 'Wine Bars', 'Hookah Lounges', 'Karaoke'] },

  // === CONVENIENCE & GROCERY (non-claimable) ===
  { id: 'convenience-grocery', label: 'Convenience & Grocery', sub: 'Publix, Walmart, gas stations & more', img: '/images/categories/services.png',
    subcategories: ['All', 'Grocery Stores', 'Convenience Stores', 'Gas Stations', 'Supermarkets', 'Specialty Foods', 'Liquor Stores', 'Farmers Markets'] },

  // === EMERGENCY SERVICES (non-claimable) ===
  { id: 'emergency-services', label: 'Emergency Services', sub: 'Fire, police, hospitals & urgent care', img: '/images/categories/health-wellness.png',
    subcategories: ['All', 'Fire Stations', 'Police Stations', 'Hospitals', 'Emergency Rooms', 'Poison Control', 'Crisis Centers'] },

  // === FAMILY ENTERTAINMENT ===
  { id: 'family-entertainment', label: 'Family Entertainment', sub: 'Fun for all ages', img: '/images/categories/family-entertainment.png',
    subcategories: ['All', 'Theme Parks', 'Arcades', 'Mini Golf', 'Bowling', 'Water Parks', 'Zoos & Aquariums', 'Trampoline Parks', 'Escape Rooms'] },

  // === DESTINATIONS ===
  { id: 'destinations', label: 'Destinations', sub: 'Florida city guides', img: '/images/categories/destinations.png',
    subcategories: ['All', 'Beaches', 'Museums', 'Parks', 'Historic Sites', 'Tours', 'Nature Trails', 'State Parks'] },

  // === HOTELS & LODGING ===
  { id: 'hotels-lodging', label: 'Hotels & Lodging', sub: 'Where to stay', img: '/images/categories/destinations.png',
    subcategories: ['All', 'Hotels', 'Resorts', 'Vacation Rentals', 'Boutique Hotels', 'B&Bs', 'Hostels', 'RV Parks'] },

  // === PROFESSIONAL SERVICES ===
  { id: 'professional-services', label: 'Professional Services', sub: 'Legal, finance & consulting', img: '/images/categories/services.png',
    subcategories: ['All', 'Attorneys', 'Accountants', 'Insurance', 'Real Estate', 'Financial Advisors', 'IT Services', 'Marketing Agencies', 'Notary'] },

  // === EDUCATION & CHILDCARE ===
  { id: 'education', label: 'Education & Childcare', sub: 'Schools, tutoring & daycare', img: '/images/categories/services.png',
    subcategories: ['All', 'Preschools', 'Daycare', 'Tutoring', 'Driving Schools', 'Music Lessons', 'Dance Studios', 'Martial Arts', 'Language Schools'] },

  // === PETS ===
  { id: 'pets', label: 'Pets', sub: 'Vets, grooming & boarding', img: '/images/categories/services.png',
    subcategories: ['All', 'Veterinarians', 'Pet Grooming', 'Pet Boarding', 'Pet Stores', 'Dog Training', 'Pet Sitting', 'Aquarium & Fish'] },

  // === TRAILS & OUTDOOR RECREATION ===
  { id: 'trails', label: 'Trails & Outdoor', sub: 'Hiking, biking & nature trails', img: '/images/categories/destinations.png',
    subcategories: ['All', 'Hiking Trails', 'Biking Trails', 'Nature Walks', 'Mountain Biking', 'Running Trails', 'Greenways', 'Boardwalks', 'Waterfront Trails', 'Dog-Friendly Trails', 'Scenic Overlooks'] },
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

export default function DirectoryClient() {
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [activeSubcategory, setActiveSubcategory] = useState('All');
  const [showListings, setShowListings] = useState(false);
  const [showGroupedBrowse, setShowGroupedBrowse] = useState(false);
  const [sortBy, setSortBy] = useState<'nearest' | 'highest' | 'most-reviews'>('nearest');
  const [cityFilter, setCityFilter] = useState('');
  const [maxDistance, setMaxDistance] = useState(0);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [totalListingCount, setTotalListingCount] = useState(0);

  // Exact stat counters — no fake numbers
  const [stats, setStats] = useState({ businesses: 0, categories: CATEGORIES.length, destinations: 8 });

  // Refetch listings with location for distance sorting
  const fetchListingsWithLocation = useCallback((loc: { lat: number; lng: number } | null) => {
    const params = new URLSearchParams({ limit: '100' });
    if (loc) { params.set('lat', String(loc.lat)); params.set('lng', String(loc.lng)); }
    const featParams = new URLSearchParams({ limit: '6', featured: 'true' });
    if (loc) { featParams.set('lat', String(loc.lat)); featParams.set('lng', String(loc.lng)); }

    Promise.all([
      fetch(`/api/directory?${params}`).then(r => r.json()),
      fetch(`/api/directory?${featParams}`).then(r => r.json()),
    ]).then(([all, featured]) => {
      const allArr = Array.isArray(all) ? all : [];
      const featArr = Array.isArray(featured) ? featured : [];
      setAllListings(allArr);
      setFeaturedListings(featArr.length > 0 ? featArr : allArr.slice(0, 6));
      setTotalListingCount(allArr.length);
      setStats(prev => ({ ...prev, businesses: allArr.length }));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Initial load without location
    fetchListingsWithLocation(null);

    // Request geolocation then refetch with distance data
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          fetchListingsWithLocation(loc);
        },
        () => {}
      );
    }
  }, [fetchListingsWithLocation]);

  const premierPartners = featuredListings.filter(l => l.tier === 'premium' || l.has_property_intelligence);
  const recentListings = allListings.filter(l => !premierPartners.find(p => p.id === l.id)).slice(0, 6);

  // Available cities from loaded listings
  const availableCities = [...new Set(allListings.map(l => l.city).filter(Boolean))] as string[];

  // Filtering logic for the category browse view
  const currentCat = CATEGORIES.find(c => c.id === activeCategory);
  const subcategories = currentCat?.subcategories || ['All'];
  const filteredListings = allListings.filter(l => {
    if (activeCategory && l.industry !== activeCategory) return false;
    if (activeSubcategory !== 'All' && !l.subcategories?.includes(activeSubcategory)) return false;
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
  };

  const handleSearch = () => {
    if (search.trim()) {
      setShowGroupedBrowse(false);
      setShowListings(true);
      setActiveCategory('');
    }
  };

  const handleBrowseAll = () => {
    setShowGroupedBrowse(true);
    setActiveCategory('');
  };

  // Hero search handler
  const handleHeroSearch = () => {
    if (search.trim()) {
      setShowGroupedBrowse(false);
      setShowListings(true);
      setActiveCategory('');
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
                src="/images/hero-directory.png"
                alt=""
                className="w-full h-full object-cover"
                fill
                sizes="100vw"
                priority
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
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-light tracking-tight leading-[1.1] mb-6"
                style={{
                  background: 'linear-gradient(135deg, #C9A84C 0%, #E8C97A 40%, #F0DFA0 60%, #C9A84C 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                THE UNRIVALED STANDARD<br />IN HOME SERVICES.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.8 }}
                className="text-lg sm:text-xl font-body text-white/70 tracking-wide mb-2"
              >
                Curated. Verified. Your Home&apos;s Legacy.
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 1 }}
                className="text-sm sm:text-base font-body text-white/45 tracking-wider uppercase mb-12"
              >
                Discover Elite Professionals in Every Field.
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
              BROWSE BY CATEGORY
              ═══════════════════════════════════════════════════════════ */}
          <section id="categories" className="max-w-7xl mx-auto px-6 py-20" data-testid="categories-section">
            <p className="text-xs font-heading font-semibold uppercase tracking-[0.2em] text-center mb-3" style={{ color: '#C9A84C' }}>Browse By Category</p>
            <h2 className="text-3xl md:text-4xl font-heading font-light text-white text-center mb-3 tracking-tight">
              Explore <span className="text-gradient-gold font-semibold">Categories</span>
            </h2>
            <p className="text-white/50 text-center max-w-lg mx-auto mb-12 font-body">From home services to nightlife — find exactly what you need.</p>

            {/* 9-Category Grid with depth */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {CATEGORIES.map((cat, i) => (
                <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className={`relative rounded-2xl overflow-hidden cursor-pointer group hover:shadow-gold-glow transition-all duration-500 ${i === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
                  style={{ minHeight: i === 0 ? 320 : 180 }}
                  onClick={() => handleCategoryClick(cat.id)} data-testid={`cat-${cat.id}`}>
                  <Image src={cat.img} alt={`${cat.label} — ${cat.sub}`} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" fill sizes="(max-width: 768px) 100vw, 33vw" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent group-hover:from-black/95 transition-all duration-500" />
                  <div className="absolute bottom-4 left-4">
                    <span className={`text-white font-heading font-semibold block tracking-tight ${i === 0 ? 'text-2xl' : 'text-base'}`}>{cat.label}</span>
                    <span className="text-white/50 text-xs font-body">{cat.sub}</span>
                  </div>
                  {i === 0 && <span className="absolute top-3 right-3 text-[10px] px-2.5 py-1 rounded-full font-heading font-semibold uppercase tracking-wider text-black" style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C97A)' }}>Core</span>}
                </motion.div>
              ))}
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════
              FEATURED LISTINGS
              ═══════════════════════════════════════════════════════════ */}
          <section className="py-20" style={{ background: 'linear-gradient(180deg, #080808 0%, #0A0A0A 50%, #080808 100%)' }} data-testid="featured-listings-section">
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
              DESTINATION GUIDES — GOLD FRAME 8-CARD GRID
              ═══════════════════════════════════════════════════════════ */}
          <section className="section-gradient-blue-gold py-24 bg-gold-accent-top" data-testid="destination-guides-section">
            <div className="section-divider-gold max-w-5xl mx-auto mb-16" />

            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-14 corner-filigree py-8 px-4">
                <p className="text-xs font-heading font-semibold uppercase tracking-[0.25em] mb-4" style={{ color: 'rgba(201,168,76,0.7)' }}>Curated Travel Guides</p>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-light text-white tracking-tight mb-4">
                  Explore <span className="text-gradient-gold font-semibold">Destinations</span>
                </h2>
                <p className="text-sm text-white/50 max-w-lg mx-auto font-body leading-relaxed">
                  Your personal concierge to Florida&apos;s finest — where to stay, dine, explore, and unwind.
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
                    <Link href={`/destination/${d.slug}`} className="block dest-card-frame group" data-testid={`dest-card-${d.slug}`}>
                      <div className="dest-card-inner">
                        <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
                          <Image src={d.image} alt={`${d.label} destination guide — ${d.tagline}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" loading="lazy" />
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
              BROWSE BY SERVICE AREA
              ═══════════════════════════════════════════════════════════ */}
          <section className="py-20 section-depth-elevated relative" data-testid="service-area-section">
            <div className="max-w-7xl mx-auto px-6">
              <p className="text-xs font-heading font-semibold uppercase tracking-[0.2em] text-center mb-3" style={{ color: '#C9A84C' }}>Browse By Service Area</p>
              <h2 className="text-3xl md:text-4xl font-heading font-light text-white text-center mb-3 tracking-tight">
                Find Pros in <span className="text-gradient-gold font-semibold">Your Area</span>
              </h2>
              <p className="text-white/50 text-center max-w-lg mx-auto mb-12 font-body">Browse businesses that service your county or region.</p>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {SERVICE_AREAS.map((area, i) => {
                  const areaCount = allListings.filter(l => area.cities.some(c => l.city?.toLowerCase().includes(c.toLowerCase()))).length;
                  return (
                    <motion.button
                      key={area.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => {
                        // Filter by first city in area
                        setCityFilter('');
                        setActiveCategory('');
                        setShowGroupedBrowse(true);
                        setShowListings(false);
                        // Set the first matching city as filter
                        const matchCity = availableCities.find(c => area.cities.some(ac => c.toLowerCase().includes(ac.toLowerCase())));
                        if (matchCity) setCityFilter(matchCity);
                      }}
                      className="glass-card-depth rounded-xl p-4 text-left group"
                      data-testid={`service-area-${area.id}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-gold/60 group-hover:text-gold transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                        </svg>
                        <span className="text-sm font-heading font-semibold text-white group-hover:text-gold transition-colors">{area.label}</span>
                      </div>
                      <p className="text-[10px] text-white/30 font-body line-clamp-1">{area.cities.slice(0, 3).join(', ')}{area.cities.length > 3 ? ` +${area.cities.length - 3}` : ''}</p>
                      {areaCount > 0 && (
                        <p className="text-[10px] text-gold/50 font-heading font-semibold mt-1">{areaCount} business{areaCount !== 1 ? 'es' : ''}</p>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════
              PRIVATE VAULT CTA — Home Ledger Cross-Sell
              ═══════════════════════════════════════════════════════════ */}
          <section className="py-20 relative overflow-hidden" data-testid="private-vault-section">
            {/* Circuit board background pattern */}
            <div className="absolute inset-0 circuit-bg opacity-30" />
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(201,168,76,0.04) 0%, transparent 60%)' }} />

            <div className="relative max-w-5xl mx-auto px-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8" style={{ borderColor: 'rgba(201,168,76,0.3)', background: 'rgba(201,168,76,0.05)' }}>
                <svg className="w-4 h-4" style={{ color: '#C9A84C' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <span className="text-xs font-body uppercase tracking-widest" style={{ color: '#C9A84C' }}>Private Vault</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-light text-white tracking-tight mb-4">
                Your Home&apos;s Heritage.<br />
                <span className="text-gradient-gold font-semibold">Documented.</span>
              </h2>
              <p className="text-white/50 max-w-2xl mx-auto mb-10 font-body leading-relaxed">
                The GL365 Home Ledger — a military-grade encrypted property file for every home you own or manage. Documents, contractors, warranties, incidents — all in one place.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/home-ledger" className="btn-primary px-8 py-3 rounded-full text-sm inline-block" data-testid="vault-cta">
                  Learn More
                </Link>
                <div className="flex items-center gap-2 text-xs text-white/35 font-body">
                  <svg className="w-3.5 h-3.5" style={{ color: '#C9A84C' }} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" /></svg>
                  AES-256 Encrypted
                </div>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════
              VALUE PROPOSITION — Why GreenLine365
              ═══════════════════════════════════════════════════════════ */}
          <section className="py-20 section-depth-dark" data-testid="value-prop-section">
            <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl font-heading font-light text-white mb-4 tracking-tight">A <span className="text-gradient-gold font-semibold">Trusted</span> Resource for Finding Local Pros</h2>
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
                        <svg className="w-5 h-5" style={{ color: '#C9A84C' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={f.icon} /></svg>
                      </div>
                      <span className="text-sm font-medium text-white/80 group-hover/feat:text-white transition-colors duration-300 font-body">{f.label}</span>
                    </div>
                  ))}
                </div>
                <button onClick={handleBrowseAll} className="mt-10 btn-primary px-8 py-3 rounded-full text-sm" data-testid="find-business-btn">Find a Business</button>
              </div>
              <div className="relative">
                <Image src="/images/hero-directory-alt.png" alt="GreenLine365 connects you with trusted, verified local businesses" className="w-full rounded-2xl object-cover" width={800} height={400} sizes="(max-width: 768px) 100vw, 50vw" loading="lazy" />
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════
              COMING SOON — Voted Best (Poll-Driven)
              ═══════════════════════════════════════════════════════════ */}
          <section className="py-16 relative" data-testid="voted-best-section">
            <div className="max-w-4xl mx-auto px-6 text-center">
              <div className="section-divider-gold mx-auto mb-12" />
              <p className="text-xs font-heading font-semibold uppercase tracking-[0.25em] mb-4" style={{ color: 'rgba(201,168,76,0.5)' }}>Coming Soon</p>
              <h2 className="text-2xl sm:text-3xl font-heading font-light text-white tracking-tight mb-4">
                <span className="text-gradient-gold font-semibold">Voted Best</span> — Powered by You
              </h2>
              <p className="text-white/40 max-w-xl mx-auto mb-8 font-body text-sm leading-relaxed">
                Soon you&apos;ll be able to vote for your favorite businesses in every category and region. &quot;Voted Best Plumber in St. Pete,&quot; &quot;Top Restaurant in Ybor City&quot; — real rankings from real people.
              </p>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border" style={{ borderColor: 'rgba(201,168,76,0.2)', background: 'rgba(201,168,76,0.04)' }}>
                <svg className="w-4 h-4" style={{ color: '#C9A84C' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
                <span className="text-xs font-body" style={{ color: 'rgba(201,168,76,0.7)' }}>Polls launching soon</span>
              </div>
              <div className="section-divider-gold mx-auto mt-12" />
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
                <Image src={currentCat.img} alt={`${currentCat.label} category background`} className="w-full h-full object-cover" fill sizes="100vw" loading="lazy" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/60 via-[#050505]/80 to-[#050505]" />

            <div className="relative max-w-7xl mx-auto px-6">
              <button onClick={() => { setShowListings(false); setShowGroupedBrowse(true); setActiveCategory(''); }} className="text-sm text-white/40 hover:text-white mb-6 flex items-center gap-2 transition font-body" data-testid="back-to-explore-btn">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back to All Categories
              </button>

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
                  <button key={sub} onClick={() => setActiveSubcategory(sub)}
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
  return (
    <Link href={`/listing/${l.slug}`}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
        className={`rounded-2xl overflow-hidden border transition-all duration-500 group cursor-pointer ${hasIntel ? 'border-[rgba(201,168,76,0.2)] shadow-gold-glow hover:border-[rgba(201,168,76,0.4)] border-glow-gold' : 'border-white/5 hover:border-[rgba(201,168,76,0.15)] hover:shadow-gold-glow'}`}
        style={{ background: 'linear-gradient(135deg, rgba(18,18,18,0.95) 0%, rgba(10,10,10,0.95) 100%)', boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)' }}
        data-testid={`listing-${l.slug}`}>
        <div className="relative h-40 overflow-hidden">
          {l.cover_image_url || l.logo_url ? (
            <Image src={l.cover_image_url || l.logo_url!} alt={`${l.business_name} — ${l.industry.replace(/-/g, ' ')} in ${l.city || 'Florida'}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #111 0%, #1A1A1A 100%)' }}>
              <span className="text-4xl font-heading font-light text-white/10">{l.business_name[0]}</span>
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
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-heading font-semibold text-sm truncate flex-1" style={{ color: '#C9A84C' }} title={l.business_name}>{l.business_name}</h3>
            {(() => { const open = isBusinessOpen(l.business_hours); return open !== null ? (
              <span className={`flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-heading font-bold uppercase tracking-wider ${open ? 'bg-greenline/15 text-greenline' : 'bg-red-500/10 text-red-400'}`}>
                <span className={`w-1 h-1 rounded-full ${open ? 'bg-greenline' : 'bg-red-400'}`} />
                {open ? 'Open' : 'Closed'}
              </span>
            ) : null; })()}
          </div>
          {l.city && <p className="text-[11px] text-white/40 flex items-center gap-1 mb-1 font-body">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {l.city}, {l.state}
            {l.distance != null && <span style={{ color: 'rgba(201,168,76,0.6)' }} className="ml-1">({l.distance} mi)</span>}
          </p>}
          {l.description && <p className="text-xs text-white/35 line-clamp-2 mb-3 font-body">{l.description}</p>}
          <div className="flex items-center justify-between">
            <span className="btn-ghost text-xs px-3 py-1.5 rounded-full" data-testid={`view-details-${l.slug}`}>View Details</span>
            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(201,168,76,0.12)', color: '#C9A84C' }}>
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
              {l.avg_feedback_rating > 0 ? l.avg_feedback_rating.toFixed(1) : 'New'}
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
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
              <div className="rounded-2xl overflow-hidden border border-white/5 hover:border-[rgba(201,168,76,0.2)] transition-all duration-300 group/card cursor-pointer h-full"
                style={{ background: 'rgba(255,255,255,0.02)' }}
                data-testid={`carousel-card-${l.slug}`}>
                <div className="relative h-32 sm:h-36 overflow-hidden">
                  {l.cover_image_url ? (
                    <Image src={l.cover_image_url} alt={l.business_name} className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500" fill sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 280px" loading="lazy" />
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
function GroupedBrowseView({ activeCategory, sortBy, setSortBy, cityFilter, setCityFilter, availableCities, userLocation, onViewAll, onBack }: {
  activeCategory: string;
  sortBy: string;
  setSortBy: (s: any) => void;
  cityFilter: string;
  setCityFilter: (s: string) => void;
  availableCities: string[];
  userLocation: { lat: number; lng: number } | null;
  onViewAll: (sub: string) => void;
  onBack: () => void;
}) {
  const currentCat = CATEGORIES.find(c => c.id === activeCategory);
  const rows = currentCat
    ? currentCat.subcategories.filter(s => s !== 'All').map(sub => ({ id: sub, label: sub, sub: '', searchTerm: sub }))
    : CATEGORIES.map(c => ({ id: c.id, label: c.label, sub: c.sub, searchTerm: '' }));

  const industryMap: Record<string, string> = {
    'services': 'services', 'automotive': 'automotive', 'marine-outdoor': 'marine-outdoor',
    'dining': 'dining', 'health-wellness': 'health-wellness',
    'style-shopping': 'style-shopping', 'nightlife': 'nightlife',
    'convenience-grocery': 'convenience-grocery', 'emergency-services': 'emergency-services',
    'family-entertainment': 'family-entertainment', 'destinations': 'destinations',
    'hotels-lodging': 'destinations', 'professional-services': 'services',
    'education': 'education', 'pets': 'pets',
  };

  return (
    <div data-testid="grouped-browse-view">
      <section className="relative pt-20 pb-6 overflow-hidden" style={{ background: '#050505' }}>
        {currentCat && (
          <div className="absolute inset-0 opacity-15">
            <Image src={currentCat.img} alt={`${currentCat.label} category background`} className="w-full h-full object-cover" fill sizes="100vw" loading="lazy" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/60 to-[#050505]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <button onClick={onBack} className="text-sm text-white/40 hover:text-white mb-4 flex items-center gap-2 transition font-body" data-testid="back-from-grouped">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Directory
          </button>
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

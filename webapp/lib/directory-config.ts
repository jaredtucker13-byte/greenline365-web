/**
 * Industry-specific placeholder images for free tier listings.
 * Used when a listing has no custom photos or is on the free tier.
 */

export const PLACEHOLDER_IMAGES: Record<string, string> = {
  'services': 'https://static.prod-images.emergentagent.com/jobs/b5fc704f-5976-4877-a35c-beeb0ec1a989/images/433e824b6f91751093de179d3a4f1fbf6bfb1d803373d48229062bd5de7bee90.png',
  'dining': 'https://static.prod-images.emergentagent.com/jobs/b5fc704f-5976-4877-a35c-beeb0ec1a989/images/3ed2bd102dc43732e925e049585f090d6aef166a029d6210d6b0c276962d7c41.png',
  'health-wellness': 'https://static.prod-images.emergentagent.com/jobs/b5fc704f-5976-4877-a35c-beeb0ec1a989/images/f2721225e4b030854540cd5fc38bf2dc1d69a7599d3fe2fe48665d128425ec6c.png',
  'style-shopping': 'https://static.prod-images.emergentagent.com/jobs/b5fc704f-5976-4877-a35c-beeb0ec1a989/images/77bed9f041c32f37a364c58fe0a0562aa73b6c183b85f55ca5f035d8e8dfb3ad.png',
  'nightlife': 'https://static.prod-images.emergentagent.com/jobs/b5fc704f-5976-4877-a35c-beeb0ec1a989/images/689ec3dcbbc4b408a63e3e832699d00a959d504f1d0ea95cc7fee21e2c72e1b2.png',
  'family-entertainment': 'https://static.prod-images.emergentagent.com/jobs/b5fc704f-5976-4877-a35c-beeb0ec1a989/images/2bad0d9c928a57d5d3b00a6e159c3d51e7a55c5af8c40d5f146dc0b11313c4bb.png',
  'destinations': 'https://static.prod-images.emergentagent.com/jobs/b5fc704f-5976-4877-a35c-beeb0ec1a989/images/2bad0d9c928a57d5d3b00a6e159c3d51e7a55c5af8c40d5f146dc0b11313c4bb.png',
  'hotels-lodging': 'https://static.prod-images.emergentagent.com/jobs/b5fc704f-5976-4877-a35c-beeb0ec1a989/images/56db76a66af0d978931f7baca924f64a23006e9883e7b45fb677b52c5f62be79.png',
  'professional-services': 'https://static.prod-images.emergentagent.com/jobs/b5fc704f-5976-4877-a35c-beeb0ec1a989/images/3b64d4ebcbbef46cdb773ebe76236d63854da48d419c53bd9a49daa1cfc42ef5.png',
  'automotive': 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=600&fit=crop',
  'marine-outdoor': 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800&h=600&fit=crop',
  'education': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop',
  'pets': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=600&fit=crop',
  'mobile-services': 'https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800&h=600&fit=crop',
};

/** Category-specific icon + gradient for CSS-only fallback when images fail to load */
export const CATEGORY_FALLBACK_STYLES: Record<string, { icon: string; gradient: string }> = {
  'services':              { icon: '🏠', gradient: 'linear-gradient(135deg, #1a2a1a 0%, #0d1f0d 100%)' },
  'dining':                { icon: '🍽️', gradient: 'linear-gradient(135deg, #2a1a1a 0%, #1f0d0d 100%)' },
  'automotive':            { icon: '🚗', gradient: 'linear-gradient(135deg, #1a1a2a 0%, #0d0d1f 100%)' },
  'marine-outdoor':        { icon: '⛵', gradient: 'linear-gradient(135deg, #0d1a2a 0%, #0a1520 100%)' },
  'health-wellness':       { icon: '🏥', gradient: 'linear-gradient(135deg, #1a2a2a 0%, #0d1f1f 100%)' },
  'style-shopping':        { icon: '✂️', gradient: 'linear-gradient(135deg, #2a1a2a 0%, #1f0d1f 100%)' },
  'professional-services': { icon: '💼', gradient: 'linear-gradient(135deg, #1a1a20 0%, #12121a 100%)' },
  'education':             { icon: '📚', gradient: 'linear-gradient(135deg, #1a201a 0%, #121a12 100%)' },
  'pets':                  { icon: '🐾', gradient: 'linear-gradient(135deg, #201a1a 0%, #1a1212 100%)' },
  'mobile-services':       { icon: '🚐', gradient: 'linear-gradient(135deg, #1a201a 0%, #0d1a12 100%)' },
  'nightlife':             { icon: '🌙', gradient: 'linear-gradient(135deg, #1a0d2a 0%, #120a1f 100%)' },
  'family-entertainment':  { icon: '🎪', gradient: 'linear-gradient(135deg, #2a201a 0%, #1f1a0d 100%)' },
  'destinations':          { icon: '📍', gradient: 'linear-gradient(135deg, #0d1a2a 0%, #0a1520 100%)' },
  'hotels-lodging':        { icon: '🏨', gradient: 'linear-gradient(135deg, #1a1520 0%, #12101a 100%)' },
};

export function getPlaceholderImage(industry: string): string {
  return PLACEHOLDER_IMAGES[industry] || PLACEHOLDER_IMAGES['services'];
}

export function getCategoryFallback(industry: string): { icon: string; gradient: string } {
  return CATEGORY_FALLBACK_STYLES[industry] || CATEGORY_FALLBACK_STYLES['services'];
}

/** Human-readable category labels for fallback descriptions */
const CATEGORY_LABELS: Record<string, string> = {
  'services': 'home services',
  'dining': 'dining',
  'automotive': 'automotive',
  'marine-outdoor': 'marine & outdoor',
  'health-wellness': 'health & wellness',
  'style-shopping': 'style & shopping',
  'professional-services': 'professional services',
  'education': 'education & childcare',
  'pets': 'pet care',
  'mobile-services': 'mobile services',
  'nightlife': 'nightlife & entertainment',
  'family-entertainment': 'family entertainment',
  'destinations': 'local attractions',
  'hotels-lodging': 'hotels & lodging',
};

/**
 * Generate a fallback description when a listing has none.
 * Format: "[City]-based [category] professionals" or "[Business name] — [category] services in [city]"
 */
export function getFallbackDescription(businessName: string, industry: string, city?: string): string {
  const label = CATEGORY_LABELS[industry] || industry.replace(/-/g, ' ');
  if (city) {
    return `${city}-based ${label} professionals`;
  }
  return `${businessName} — ${label} services in Florida`;
}

/**
 * Subcategory keyword map — maps UI pill names to search keywords for matching
 * against granular DB subcategories, business names, and descriptions.
 * The UI is the master source; this map bridges UI labels → organic DB data.
 */
export const SUBCATEGORY_KEYWORDS: Record<string, string[]> = {
  // ─── HOME SERVICES ───
  'HVAC':               ['hvac', 'ac repair', 'ac install', 'air condition', 'heating', 'cooling', 'furnace', 'heat pump', 'ductless', 'duct clean'],
  'Plumbing':           ['plumb', 'drain', 'pipe', 'water heater', 'sewer', 'rooter', 'hydro jet', 'fixture', 'tankless', 'leak detect', 're-pip', 'repip', 'clog', 'faucet'],
  'Electrical':         ['electri', 'wiring', 'rewir', 'panel upgrade', 'breaker', 'outlet', 'circuit', 'surge protect', 'generator', 'ev charger', 'ceiling fan', 'recessed light', 'lighting install'],
  'Roofing':            ['roof', 'shingle', 'metal roof', 'tile roof', 'storm restor'],
  'Pest Control':       ['pest', 'termite', 'exterminator', 'rodent', 'mosquit', 'bug spray'],
  'House Cleaning':     ['house clean', 'maid', 'home clean', 'cleaning service', 'deep clean'],
  'Carpet Cleaning':    ['carpet clean'],
  'Pressure Washing':   ['pressure wash', 'power wash'],
  'Window Cleaning':    ['window clean'],
  'Junk Removal':       ['junk', 'debris', 'haul', 'removal'],
  'Lawn Care':          ['lawn', 'mow', 'edging', 'fertiliz', 'turf', 'grass'],
  'Landscaping':        ['landscap', 'hardscap', 'garden', 'water feature'],
  'Tree Service':       ['tree service', 'tree trim', 'tree remov', 'arborist', 'stump'],
  'Pool & Spa':         ['pool', 'spa', 'hot tub'],
  'Fencing':            ['fenc'],
  'Irrigation':         ['irrigat', 'sprinkler'],
  'Painting':           ['paint'],
  'Flooring':           ['floor'],
  'Handyman':           ['handyman', 'odd job', 'general repair'],
  'Kitchen & Bath':     ['kitchen', 'bath remodel', 'cabinet', 'bathroom remodel'],
  'Windows & Doors':    ['window install', 'window replac', 'door install', 'door replac', 'windows & doors'],
  'Garage Doors':       ['garage door'],
  'Gutters':            ['gutter'],
  'Smart Home':         ['smart home', 'home automat'],
  'Security Systems':   ['security system', 'alarm', 'access control', 'surveillance', 'camera', 'security light'],
  'Home Theater':       ['home theater', 'audio', 'media room'],
  'Foundations':        ['foundation', 'structural'],
  'Masonry':            ['mason', 'brick', 'stone', 'concrete'],
  'Insulation':         ['insulat', 'spray foam'],
  'Mold Remediation':   ['mold', 'remediat'],
  'Water Damage':       ['water damage', 'flood restor'],
  'General Contractors': ['general contract', 'construction', 'build-out', 'tenant improv'],
  'Locksmith':          ['locksmith', 'lock', 'key duplic', 'lockout'],
  'Appliance Repair':   ['appliance'],
  'Septic & Sewer':     ['septic', 'sewer'],
  // ─── AUTOMOTIVE ───
  'Auto Repair':        ['auto repair', 'mechanic', 'automotive repair', 'car repair', 'car & truck'],
  'Oil Change':         ['oil change'],
  'Tire Shops':         ['tire'],
  'Body Shops':         ['body shop', 'collision'],
  'Car Dealers':        ['car dealer', 'dealership'],
  'Auto Parts':         ['auto part'],
  'Towing':             ['towing', 'tow service'],
  'Car Wash':           ['car wash'],
  'Auto Detailing':     ['detail'],
  'EV Charging':        ['ev charg'],
  // ─── MARINE & OUTDOOR ───
  'Boat Repair':        ['boat repair'],
  'Marine Mechanics':   ['marine mechanic'],
  'Dock & Lift':        ['dock', 'lift'],
  'Boat Cleaning':      ['boat clean', 'boat detail'],
  'Fishing Charters':   ['fish', 'charter'],
  'Kayak & Paddleboard': ['kayak', 'paddle'],
  'Dive Shops':         ['dive', 'scuba'],
  'Marinas':            ['marina'],
  // ─── DINING ───
  'Fine Dining':        ['fine din', 'michelin', 'upscale', 'omakase'],
  'Casual':             ['casual', 'american restaurant', 'modern american', 'contemporary', 'gastropub', 'steakhouse', 'grill', 'bistro', 'tavern', 'pub', 'brewery', 'taproom', 'bar and', 'mediterranean', 'cuban', 'spanish'],
  'Cafes & Bakeries':   ['cafe', 'bakery', 'coffee', 'pastry', 'pastries', 'bread'],
  'Food Trucks':        ['food truck'],
  'Seafood':            ['seafood', 'oyster', 'fish', 'crab', 'lobster', 'shrimp'],
  'BBQ':                ['bbq', 'barbecue', 'smok'],
  'Pizza':              ['pizza'],
  'Mexican':            ['mexican', 'taco', 'burrito', 'tex-mex'],
  'Asian':              ['asian', 'chinese', 'japanese', 'thai', 'vietnamese', 'korean', 'sushi'],
  'Italian':            ['italian'],
  'Breakfast & Brunch': ['breakfast', 'brunch'],
  'Vegan & Vegetarian': ['vegan', 'vegetarian', 'plant-based'],
  // ─── HEALTH & WELLNESS ───
  'Dental Offices':     ['dent'],
  'Physical Therapy':   ['physical therap', 'physio', 'pt clinic'],
  'Medical Clinics':    ['medical', 'clinic', 'doctor', 'physician'],
  'Mental Health':      ['mental', 'psych', 'counsel', 'therapist'],
  'Fitness':            ['fitness', 'gym', 'workout', 'yoga', 'pilates', 'crossfit'],
  'Chiropractors':      ['chiro'],
  'Optometrists':       ['optom', 'eye care', 'vision'],
  'Urgent Care':        ['urgent care'],
  'Pharmacies':         ['pharmac'],
  'Dermatology':        ['dermat', 'skin care'],
  'Orthopedics':        ['orthoped', 'ortho'],
  // ─── STYLE & SHOPPING ───
  'Barbershops':        ['barber'],
  'Salons':             ['salon', 'hair'],
  'Nail Salons':        ['nail'],
  'Spas':               ['spa', 'massage', 'facial'],
  'Boutiques':          ['boutique', 'fashion', 'cloth', 'gift shop', 'gift store', 'home decor', 'souvenir', 'bookstore', 'apparel', 'shopping'],
  'Jewelry':            ['jewel'],
  'Tattoo & Piercing':  ['tattoo', 'pierc'],
  'Dry Cleaning & Laundry': ['dry clean', 'laundry'],
  // ─── PROFESSIONAL SERVICES ───
  'Attorneys':          ['attorney', 'lawyer', 'law firm', 'legal'],
  'Accountants':        ['account', 'cpa', 'bookkeep'],
  'Insurance':          ['insurance'],
  'Real Estate':        ['real estate', 'realtor'],
  'Financial Advisors': ['financial', 'wealth', 'invest'],
  'IT Services':        ['it service', 'tech support', 'computer'],
  'Marketing Agencies': ['marketing', 'advertis', 'seo', 'digital agency'],
  'Notary':             ['notary'],
  // ─── EDUCATION & CHILDCARE ───
  'Preschools':         ['preschool', 'pre-k'],
  'Daycare':            ['daycare', 'day care', 'childcare'],
  'Tutoring':           ['tutor'],
  'Driving Schools':    ['driving school'],
  'Music Lessons':      ['music lesson', 'music school'],
  'Dance Studios':      ['dance'],
  'Martial Arts':       ['martial', 'karate', 'taekwondo', 'jiu-jitsu'],
  'Language Schools':   ['language school'],
  // ─── PETS ───
  'Veterinarians':      ['vet', 'animal hospital'],
  'Pet Grooming':       ['groom'],
  'Pet Boarding':       ['board', 'kennel'],
  'Pet Stores':         ['pet store', 'pet supply'],
  'Dog Training':       ['dog train', 'obedience'],
  'Pet Sitting':        ['pet sit', 'dog walk'],
  'Aquarium & Fish':    ['aquarium', 'reptile'],
  // ─── MOBILE SERVICES ───
  'Mobile DJs':         ['mobile dj', 'dj service', 'disc jockey'],
  'Personal Trainers':  ['personal train', 'fitness train', 'outdoor train'],
  'Mobile Notary':      ['mobile notary', 'traveling notary'],
  'Mobile Pet Grooming': ['mobile groom', 'mobile pet'],
  'Mobile Auto Detailing': ['mobile detail', 'mobile auto detail'],
  'Mobile Car Wash':    ['mobile car wash', 'mobile wash'],
  'Event Photographers': ['event photo', 'wedding photo', 'photographer'],
  'Private Chefs':      ['private chef', 'personal chef'],
  'Mobile Barbers':     ['mobile barber'],
};

/**
 * Check if a listing matches a UI subcategory pill based on keyword matching.
 * Searches subcategories array, business name, and description.
 */
export function matchesSubcategory(
  subcategoryName: string,
  listingSubcategories: string[] | undefined,
  businessName: string,
  description?: string | null,
): boolean {
  // Exact match first (case-insensitive)
  if (listingSubcategories?.some(s => s.toLowerCase() === subcategoryName.toLowerCase())) {
    return true;
  }

  const keywords = SUBCATEGORY_KEYWORDS[subcategoryName];
  if (!keywords) {
    // Fallback: simple case-insensitive substring match
    const sub = subcategoryName.toLowerCase();
    return (
      listingSubcategories?.some(s => s.toLowerCase().includes(sub)) ||
      businessName.toLowerCase().includes(sub) ||
      (description || '').toLowerCase().includes(sub)
    ) ?? false;
  }

  const haystack = [
    ...(listingSubcategories || []).map(s => s.toLowerCase()),
    businessName.toLowerCase(),
    (description || '').toLowerCase(),
  ].join(' ||| ');

  return keywords.some(kw => haystack.includes(kw));
}

/**
 * Non-claimable business types — chain stores, convenience stores, emergency services, etc.
 * These exist for directory completeness but aren't outreach targets.
 */
const NON_CLAIMABLE_KEYWORDS = [
  // Grocery & Convenience
  'walgreens', 'cvs', 'walmart', 'target', 'publix', 'winn-dixie', 'winn dixie',
  'kroger', 'aldi', 'trader joe', 'whole foods', 'sprouts',
  '7-eleven', '7 eleven', 'circle k', 'wawa', 'sheetz', 'racetrac',
  'costco', 'sam\'s club', 'bj\'s wholesale',
  // Fast Food / Major Chains
  'mcdonald', 'burger king', 'wendy', 'taco bell', 'subway',
  'chick-fil-a', 'popeyes', 'kfc', 'sonic drive', 'arby',
  'starbucks', 'dunkin', 'panera', 'chipotle', 'five guys',
  'domino', 'papa john', 'little caesars', 'pizza hut',
  // Gas Stations
  'shell', 'bp', 'chevron', 'exxon', 'mobil', 'marathon', 'sunoco', 'valero',
  // Emergency & Government
  'hospital', 'police', 'fire station', 'fire department', 'sheriff',
  'post office', 'usps', 'library', 'dmv', 'courthouse',
  'emergency room', 'er ', '911',
  // Big Box Retail
  'home depot', 'lowe\'s', 'lowes', 'menards',
  'dollar general', 'dollar tree', 'family dollar',
  'best buy', 'bed bath', 'ross', 'marshalls', 'tj maxx', 'tjmaxx',
  'autozone', 'advance auto', 'o\'reilly', 'napa auto',
  // Banks & Major Chains
  'bank of america', 'chase bank', 'wells fargo', 'td bank', 'pnc bank',
  'regions bank', 'suntrust', 'truist',
];

/** Industries that never show "Claim Listing" — non-profits and civic orgs are community resources, not sales targets */
const NON_CLAIMABLE_INDUSTRIES = ['convenience-grocery', 'emergency-services', 'civic_nonprofit'];

/**
 * Check if a listing should show the "Claim Listing" CTA.
 * Chains, franchises, emergency services, and government buildings are excluded.
 */
export function isClaimable(businessName: string, industry?: string): boolean {
  if (industry && NON_CLAIMABLE_INDUSTRIES.includes(industry)) return false;
  const lower = businessName.toLowerCase();
  return !NON_CLAIMABLE_KEYWORDS.some(kw => lower.includes(kw));
}

// ═══════════════════════════════════════════════════════════════════
// DIRECTORY LANDING PAGE DATA — Categories & Cities
// Used by /directory/[category] and /directory/[category]/[city]
// ═══════════════════════════════════════════════════════════════════

export interface CategoryMeta {
  id: string;
  label: string;
  tagline: string;
  description: string;
  subcategories: string[];
}

export const DIRECTORY_CATEGORIES: CategoryMeta[] = [
  {
    id: 'services', label: 'Home Services',
    tagline: 'HVAC, Plumbing, Electrical & Every Trade',
    description: 'Find trusted home service professionals — from emergency HVAC repair and licensed plumbers to electricians, roofers, landscapers, and every trade in between. Every listing is vetted through our GreenLine365 trust system.',
    subcategories: ['HVAC', 'Plumbing', 'Electrical', 'Roofing', 'Pest Control', 'House Cleaning', 'Carpet Cleaning', 'Pressure Washing', 'Window Cleaning', 'Junk Removal', 'Lawn Care', 'Landscaping', 'Tree Service', 'Pool & Spa', 'Fencing', 'Irrigation', 'Painting', 'Flooring', 'Handyman', 'Kitchen & Bath', 'Windows & Doors', 'Garage Doors', 'Gutters', 'Smart Home', 'Security Systems', 'Home Theater', 'Foundations', 'Masonry', 'Insulation', 'Mold Remediation', 'Water Damage', 'General Contractors', 'Locksmith', 'Appliance Repair', 'Septic & Sewer'],
  },
  {
    id: 'automotive', label: 'Automotive',
    tagline: 'Repairs, Dealers & Body Shops',
    description: 'Reliable auto repair shops, tire centers, body shops, and car dealers across Florida. Compare ratings, see real customer photos, and connect with businesses you can trust.',
    subcategories: ['Auto Repair', 'Oil Change', 'Tire Shops', 'Body Shops', 'Car Dealers', 'Auto Parts', 'Towing', 'Car Wash', 'Auto Detailing', 'EV Charging'],
  },
  {
    id: 'marine-outdoor', label: 'Marine & Outdoor',
    tagline: 'Boats, Docks & Outdoor Adventure',
    description: 'Florida\'s best marine mechanics, fishing charters, boat repair services, marinas, and outdoor adventure outfitters. Built for the coast.',
    subcategories: ['Boat Repair', 'Marine Mechanics', 'Dock & Lift', 'Boat Cleaning', 'Fishing Charters', 'Kayak & Paddleboard', 'Dive Shops', 'Marinas'],
  },
  {
    id: 'dining', label: 'Dining',
    tagline: 'Cafes, Casual & Fine Dining',
    description: 'Discover the best restaurants, cafes, and eateries in your area. From waterfront fine dining to local food trucks, every palate is covered.',
    subcategories: ['Fine Dining', 'Casual', 'Cafes & Bakeries', 'Food Trucks', 'Seafood', 'BBQ', 'Pizza', 'Mexican', 'Asian', 'Italian', 'Breakfast & Brunch', 'Vegan & Vegetarian'],
  },
  {
    id: 'health-wellness', label: 'Health & Wellness',
    tagline: 'Doctors, Dentists, Fitness & More',
    description: 'Top-rated healthcare providers, dental offices, physical therapists, gyms, and wellness centers. Your health, supported by trusted local professionals.',
    subcategories: ['Dental Offices', 'Physical Therapy', 'Medical Clinics', 'Mental Health', 'Fitness', 'Chiropractors', 'Optometrists', 'Urgent Care', 'Pharmacies', 'Dermatology', 'Orthopedics'],
  },
  {
    id: 'style-shopping', label: 'Style & Shopping',
    tagline: 'Fashion, Grooming & Retail',
    description: 'Barbershops, salons, spas, boutiques, and specialty retail. Look your best and shop local with verified businesses.',
    subcategories: ['Barbershops', 'Salons', 'Nail Salons', 'Spas', 'Boutiques', 'Jewelry', 'Tattoo & Piercing', 'Dry Cleaning & Laundry'],
  },
  {
    id: 'professional-services', label: 'Professional Services',
    tagline: 'Legal, Finance & Consulting',
    description: 'Attorneys, accountants, insurance agents, real estate professionals, and IT consultants. Find the expertise you need from trusted local firms.',
    subcategories: ['Attorneys', 'Accountants', 'Insurance', 'Real Estate', 'Financial Advisors', 'IT Services', 'Marketing Agencies', 'Notary'],
  },
  {
    id: 'education', label: 'Education & Childcare',
    tagline: 'Schools, Tutoring & Daycare',
    description: 'Preschools, tutoring centers, driving schools, music lessons, and childcare providers. Invest in education with confidence.',
    subcategories: ['Preschools', 'Daycare', 'Tutoring', 'Driving Schools', 'Music Lessons', 'Dance Studios', 'Martial Arts', 'Language Schools'],
  },
  {
    id: 'pets', label: 'Pets',
    tagline: 'Vets, Grooming & Boarding',
    description: 'Veterinarians, pet groomers, boarding facilities, and pet supply stores. Everything your furry family members need.',
    subcategories: ['Veterinarians', 'Pet Grooming', 'Pet Boarding', 'Pet Stores', 'Dog Training', 'Pet Sitting', 'Aquarium & Fish'],
  },
  {
    id: 'nightlife', label: 'Nightlife',
    tagline: 'Bars, Clubs & Live Music',
    description: 'The best bars, nightclubs, and live music venues for an unforgettable night out. Discover local nightlife hotspots.',
    subcategories: ['Bars', 'Clubs', 'Live Music Venues'],
  },
  {
    id: 'family-entertainment', label: 'Family Entertainment',
    tagline: 'Fun for the Whole Family',
    description: 'Amusement parks, arcades, movie theaters, and family-friendly attractions. Create lasting memories with activities for all ages.',
    subcategories: ['Amusement Parks', 'Arcades', 'Movie Theaters'],
  },
  {
    id: 'hotels-lodging', label: 'Hotels & Lodging',
    tagline: 'Hotels, Resorts & Vacation Rentals',
    description: 'Hotels, resorts, vacation rentals, and boutique lodging options. Find the perfect place to stay during your Florida visit.',
    subcategories: ['Hotels', 'Resorts', 'Vacation Rentals'],
  },
  {
    id: 'mobile-services', label: 'Mobile Services',
    tagline: 'DJs, Trainers, Notaries & On-the-Go Pros',
    description: 'Mobile professionals who come to you — DJs, personal trainers, notaries, photographers, pet groomers, and more.',
    subcategories: ['Mobile DJs', 'Personal Trainers', 'Mobile Notary', 'Mobile Pet Grooming', 'Mobile Auto Detailing', 'Mobile Car Wash', 'Event Photographers', 'Private Chefs', 'Mobile Barbers'],
  },
];

export interface CityMeta {
  slug: string;
  label: string;
  description: string;
}

export const DIRECTORY_CITIES: CityMeta[] = [
  { slug: 'st-pete-beach', label: 'St. Pete Beach', description: 'Award-winning beaches, waterfront dining, and Gulf Coast relaxation.' },
  { slug: 'key-west', label: 'Key West', description: 'Island paradise with ocean adventures, sunset celebrations, and tropical vibes.' },
  { slug: 'sarasota', label: 'Sarasota', description: 'Arts, culture, pristine Gulf shores, and world-class dining.' },
  { slug: 'daytona', label: 'Daytona Beach', description: 'Atlantic coast fun, racing heritage, and family entertainment.' },
  { slug: 'ybor-city', label: 'Ybor City', description: 'Historic district with vibrant nightlife, Cuban heritage, and eclectic dining.' },
  { slug: 'orlando', label: 'Orlando', description: 'Theme parks, world-class entertainment, and diverse dining scene.' },
  { slug: 'miami', label: 'Miami', description: 'Art deco architecture, diverse cuisine, beach culture, and nightlife.' },
  { slug: 'jacksonville', label: 'Jacksonville', description: 'River city with beaches, Southern charm, and a growing food scene.' },
];

export function getCategoryById(id: string): CategoryMeta | undefined {
  return DIRECTORY_CATEGORIES.find(c => c.id === id);
}

export function getCityBySlug(slug: string): CityMeta | undefined {
  return DIRECTORY_CITIES.find(c => c.slug === slug);
}

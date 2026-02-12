import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openrouterKey = process.env.OPENROUTER_API_KEY!;
const googlePlacesKey = process.env.GOOGLE_PLACES_API_KEY!;

function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

// Admin user_id for CRM lead ownership
const ADMIN_USER_ID = '677b536d-6521-4ac8-a0a5-98278b35f4cc';

// ─── Destinations with coordinates for Google Places bias ───
const DESTINATIONS: Record<string, { label: string; lat: number; lng: number; state: string }> = {
  'st-pete-beach':  { label: 'St. Pete Beach',  lat: 27.7253, lng: -82.7412, state: 'FL' },
  'key-west':       { label: 'Key West',         lat: 24.5551, lng: -81.7800, state: 'FL' },
  'sarasota':       { label: 'Sarasota',         lat: 27.3364, lng: -82.5307, state: 'FL' },
  'ybor-city':      { label: 'Ybor City',        lat: 27.9617, lng: -82.4369, state: 'FL' },
  'daytona':        { label: 'Daytona Beach',    lat: 29.2108, lng: -81.0228, state: 'FL' },
  'orlando':        { label: 'Orlando',          lat: 28.5383, lng: -81.3792, state: 'FL' },
};

// ─── Tourism categories for discovery ───
const TOURISM_CATEGORIES: Record<string, { label: string; searchTerms: string; industry: string }> = {
  'stay':               { label: 'Stay',                 searchTerms: 'hotels resorts vacation rentals bed and breakfast lodging',     industry: 'hotels-lodging' },
  'eat-drink':          { label: 'Eat & Drink',          searchTerms: 'best restaurants bars cafes dining brunch',                    industry: 'dining' },
  'quick-eats':         { label: 'Quick Eats & Takeout', searchTerms: 'pizza takeout fast food chinese food delivery sub shops',     industry: 'dining' },
  'things-to-do':       { label: 'Things To Do',         searchTerms: 'attractions tours activities museums things to do',            industry: 'destinations' },
  'beaches-nature':     { label: 'Beaches & Nature',     searchTerms: 'beaches parks nature trails state parks outdoor recreation',   industry: 'destinations' },
  'family-fun':         { label: 'Family Fun',           searchTerms: 'theme parks arcades mini golf family activities water parks',  industry: 'family-entertainment' },
  'shopping':           { label: 'Shopping',             searchTerms: 'boutiques souvenir shops shopping malls retail stores',        industry: 'style-shopping' },
  'everyday-essentials':{ label: 'Everyday Essentials',  searchTerms: 'grocery stores pharmacies gas stations convenience stores liquor stores', industry: 'services' },
  'nightlife':          { label: 'Nightlife',            searchTerms: 'nightclubs bars live music lounges cocktail bars',             industry: 'nightlife' },
  'getting-around':     { label: 'Getting Around',       searchTerms: 'car rentals taxi transportation shuttle trolley bike rentals', industry: 'services' },
};

// ─── Stage 1: Discovery via Perplexity (OpenRouter) ───
interface DiscoveredBusiness {
  name: string;
  address?: string;
  website?: string;
  phone?: string;
  description?: string;
  type?: string;
}

async function discoverBusinesses(
  destination: string,
  category: string,
  limit: number
): Promise<DiscoveredBusiness[]> {
  const dest = DESTINATIONS[destination];
  const cat = TOURISM_CATEGORIES[category];
  if (!dest || !cat) return [];

  const prompt = `Find exactly ${limit} real, currently operating ${cat.searchTerms} businesses in ${dest.label}, Florida.

For each business, provide:
- name: the exact business name
- address: full street address
- website: their website URL (if known)
- phone: phone number (if known)
- description: one sentence about the business
- type: specific type (e.g., "hotel", "seafood restaurant", "state park")

Return ONLY a valid JSON array. No markdown, no explanation. Example format:
[{"name":"Example Hotel","address":"123 Beach Rd, St. Pete Beach, FL 33706","website":"https://example.com","phone":"727-555-1234","description":"A beachfront resort with gulf views.","type":"resort"}]

Focus on popular, well-reviewed, real businesses that tourists would visit. Include a mix of well-known and local favorites.`;

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openrouterKey}`,
      'HTTP-Referer': 'https://greenline365.com',
      'X-Title': 'GL365 Directory Discovery',
    },
    body: JSON.stringify({
      model: 'perplexity/sonar-pro',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 4000,
    }),
  });

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '[]';

  try {
    // Extract JSON from response (may have markdown wrapping)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    return JSON.parse(jsonMatch[0]);
  } catch {
    console.error('[Discover] Failed to parse Perplexity response:', content.slice(0, 200));
    return [];
  }
}

// ─── Stage 2: Google Places Enrichment ───
interface PlacesResult {
  displayName?: { text: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  id?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  regularOpeningHours?: {
    openNow?: boolean;
    periods?: Array<{
      open: { day: number; hour: number; minute: number };
      close?: { day: number; hour: number; minute: number };
    }>;
    weekdayDescriptions?: string[];
  };
  businessStatus?: string;
  photos?: Array<{ name: string }>;
  types?: string[];
}

async function enrichWithGooglePlaces(
  businessName: string,
  destination: string
): Promise<PlacesResult | null> {
  const dest = DESTINATIONS[destination];
  if (!dest) return null;

  const fieldMask = [
    'places.displayName',
    'places.formattedAddress',
    'places.nationalPhoneNumber',
    'places.websiteUri',
    'places.googleMapsUri',
    'places.id',
    'places.location',
    'places.rating',
    'places.userRatingCount',
    'places.regularOpeningHours',
    'places.businessStatus',
    'places.photos',
    'places.types',
  ].join(',');

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': googlePlacesKey,
      'X-Goog-FieldMask': fieldMask,
    },
    body: JSON.stringify({
      textQuery: `${businessName} ${dest.label} Florida`,
      locationBias: {
        circle: {
          center: { latitude: dest.lat, longitude: dest.lng },
          radius: 20000.0, // 20km radius
        },
      },
      maxResultCount: 1,
    }),
  });

  const data = await res.json();
  return data.places?.[0] || null;
}

// ─── Stage 2.5: Closed After Hours Detection ───
function detectClosedAfterHours(hours: PlacesResult['regularOpeningHours']): {
  closedAfterHours: boolean;
  closesEarly: boolean;
  noWeekendHours: boolean;
  reason: string;
} {
  if (!hours?.periods || hours.periods.length === 0) {
    return { closedAfterHours: true, closesEarly: false, noWeekendHours: true, reason: 'No hours data — likely no after-hours coverage' };
  }

  const periods = hours.periods;

  // Check weekday closing times (Mon=1 through Fri=5)
  const weekdayPeriods = periods.filter(p => p.open.day >= 1 && p.open.day <= 5);
  const closesEarly = weekdayPeriods.some(p => {
    if (!p.close) return false; // 24-hour
    return p.close.hour < 18; // Closes before 6 PM
  });

  // Check for weekend presence (Sat=6, Sun=0)
  const saturdayPeriods = periods.filter(p => p.open.day === 6);
  const sundayPeriods = periods.filter(p => p.open.day === 0);
  const noWeekendHours = saturdayPeriods.length === 0 && sundayPeriods.length === 0;

  const closedAfterHours = closesEarly || noWeekendHours;

  let reason = '';
  if (closesEarly && noWeekendHours) reason = 'Closes before 6 PM on weekdays & no weekend hours';
  else if (closesEarly) reason = 'Closes before 6 PM on some weekdays';
  else if (noWeekendHours) reason = 'No weekend hours listed';

  return { closedAfterHours, closesEarly, noWeekendHours, reason };
}

// ─── Stage 3: Insert into Directory + CRM ───
async function insertDirectoryListing(
  supabase: ReturnType<typeof getServiceClient>,
  business: DiscoveredBusiness,
  places: PlacesResult | null,
  destination: string,
  category: string,
  afterHoursData: ReturnType<typeof detectClosedAfterHours>
): Promise<{ listing: any; error: string | null }> {
  const dest = DESTINATIONS[destination];
  const cat = TOURISM_CATEGORIES[category];

  // Build tags array
  const tags: string[] = [
    `destination:${destination}`,
    `tourism:${category}`,
    'auto_discovered',
  ];
  if (afterHoursData.closedAfterHours) tags.push('closed_after_hours');
  if (afterHoursData.closesEarly) tags.push('closes_early');
  if (afterHoursData.noWeekendHours) tags.push('no_weekend_hours');

  const businessName = places?.displayName?.text || business.name;

  // Parse address components from Google Places
  const address = places?.formattedAddress || business.address || '';
  const addressParts = address.split(',').map(s => s.trim());
  const city = addressParts.length >= 3 ? addressParts[addressParts.length - 3] : dest?.label || '';
  const stateZip = addressParts.length >= 2 ? addressParts[addressParts.length - 2] : '';
  const [state, zipCode] = stateZip.split(' ').filter(Boolean);

  // Build metadata
  const metadata: Record<string, any> = {
    destination_zone: destination,
    tourism_category: category,
    tourism_label: cat?.label,
    google_places_id: places?.id || null,
    google_maps_url: places?.googleMapsUri || null,
    google_rating: places?.rating || null,
    google_review_count: places?.userRatingCount || null,
    business_type: business.type || null,
    after_hours_analysis: afterHoursData,
    discovered_at: new Date().toISOString(),
  };

  // Get first photo URL if available
  let coverImageUrl: string | null = null;
  const galleryImages: string[] = [];
  if (places?.photos?.length) {
    for (const photo of places.photos.slice(0, 5)) {
      const photoUrl = `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=800&key=${googlePlacesKey}`;
      galleryImages.push(photoUrl);
    }
    coverImageUrl = galleryImages[0] || null;
  }

  // Build hours JSONB
  const businessHours: Record<string, any> = {};
  if (places?.regularOpeningHours?.weekdayDescriptions) {
    places.regularOpeningHours.weekdayDescriptions.forEach((desc, i) => {
      const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      businessHours[dayNames[i]] = desc;
    });
  }

  const { data, error } = await supabase
    .from('directory_listings')
    .insert({
      business_name: businessName,
      industry: cat?.industry || 'general',
      subcategories: [cat?.label || category, business.type || ''].filter(Boolean),
      description: business.description || null,
      phone: places?.nationalPhoneNumber || business.phone || null,
      email: null,
      website: places?.websiteUri || business.website || null,
      address_line1: addressParts[0] || null,
      city: city || null,
      state: state || dest?.state || null,
      zip_code: zipCode || null,
      latitude: places?.location?.latitude || null,
      longitude: places?.location?.longitude || null,
      google_place_id: places?.id || null,
      cover_image_url: coverImageUrl,
      gallery_images: galleryImages,
      business_hours: businessHours,
      tier: 'free',
      is_published: true,
      is_claimed: false,
      tags,
      metadata,
    })
    .select('id, business_name, slug')
    .single();

  if (error) {
    return { listing: null, error: error.message };
  }
  return { listing: data, error: null };
}

async function insertCrmLead(
  supabase: ReturnType<typeof getServiceClient>,
  business: DiscoveredBusiness,
  places: PlacesResult | null,
  destination: string,
  category: string,
  afterHoursData: ReturnType<typeof detectClosedAfterHours>,
  listingId: string | null
): Promise<{ lead: any; error: string | null }> {
  const dest = DESTINATIONS[destination];
  const cat = TOURISM_CATEGORIES[category];

  const website = places?.websiteUri || business.website || '';
  let email: string | null = null;
  if (website) {
    const domain = website.replace(/https?:\/\//, '').replace('www.', '').split('/')[0];
    if (domain && domain.includes('.')) email = `info@${domain}`;
  }

  if (!email) {
    return { lead: null, error: 'No email derivable' };
  }

  const tags: string[] = [
    `destination:${destination}`,
    `tourism:${category}`,
    'auto_discovered',
    'directory_import',
  ];
  if (afterHoursData.closedAfterHours) tags.push('closed_after_hours');
  if (afterHoursData.closesEarly) tags.push('closes_early');
  if (afterHoursData.noWeekendHours) tags.push('no_weekend_hours');

  const notes = [
    `Industry: ${cat?.label || category}`,
    `Location: ${dest?.label}, FL`,
    `Web: ${website}`,
    afterHoursData.closedAfterHours ? `AFTER-HOURS OPPORTUNITY: ${afterHoursData.reason}` : null,
    places?.rating ? `Google Rating: ${places.rating} (${places.userRatingCount} reviews)` : null,
    listingId ? `Directory Listing ID: ${listingId}` : null,
  ].filter(Boolean).join(' | ');

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('crm_leads')
    .insert({
      user_id: ADMIN_USER_ID,
      email: email.toLowerCase().trim(),
      name: business.name,
      phone: places?.nationalPhoneNumber || business.phone || null,
      company: business.name,
      source: 'gl365_discovery',
      status: afterHoursData.closedAfterHours ? 'qualified' : 'new',
      tags,
      notes,
      metadata: {
        destination_zone: destination,
        tourism_category: category,
        after_hours: afterHoursData,
        google_rating: places?.rating || null,
        listing_id: listingId,
      },
      first_contact_at: now,
      created_at: now,
      updated_at: now,
    })
    .select('id, email, status')
    .single();

  if (error) {
    return { lead: null, error: error.message };
  }
  return { lead: data, error: null };
}

// ─── Main API Handler ───
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { destination, category, limit = 5 } = body;

  // Validate
  if (!destination || !DESTINATIONS[destination]) {
    return NextResponse.json({
      error: 'Invalid destination',
      valid: Object.keys(DESTINATIONS),
    }, { status: 400 });
  }

  const categoriesToSearch = category && TOURISM_CATEGORIES[category]
    ? [category]
    : Object.keys(TOURISM_CATEGORIES);

  const results: any[] = [];
  let totalDiscovered = 0;
  let totalEnriched = 0;
  let totalListings = 0;
  let totalLeads = 0;
  let totalAfterHours = 0;

  const supabase = getServiceClient();

  for (const cat of categoriesToSearch) {
    const catInfo = TOURISM_CATEGORIES[cat];
    console.log(`[Discover] Searching ${catInfo.label} in ${DESTINATIONS[destination].label}...`);

    // Stage 1: Perplexity discovery
    const discovered = await discoverBusinesses(destination, cat, Math.min(limit, 10));
    totalDiscovered += discovered.length;
    console.log(`[Discover] Found ${discovered.length} businesses via Perplexity`);

    const categoryResults: any[] = [];

    for (const biz of discovered) {
      // Check if already exists (by name match)
      const { data: existing } = await supabase
        .from('directory_listings')
        .select('id, business_name')
        .ilike('business_name', biz.name)
        .limit(1);

      if (existing && existing.length > 0) {
        categoryResults.push({
          business: biz.name,
          status: 'skipped',
          reason: 'Already exists in directory',
        });
        continue;
      }

      // Stage 2: Google Places enrichment
      let places: PlacesResult | null = null;
      try {
        places = await enrichWithGooglePlaces(biz.name, destination);
        if (places) totalEnriched++;
      } catch (err: any) {
        console.warn(`[Discover] Google Places failed for ${biz.name}: ${err.message}`);
      }

      // Stage 2.5: After-hours detection
      const afterHours = detectClosedAfterHours(places?.regularOpeningHours);
      if (afterHours.closedAfterHours) totalAfterHours++;

      // Stage 3a: Insert directory listing
      const { listing, error: listingError } = await insertDirectoryListing(
        supabase, biz, places, destination, cat, afterHours
      );

      if (listing) {
        totalListings++;
      }

      // Stage 3b: Insert CRM lead
      const { lead, error: leadError } = await insertCrmLead(
        supabase, biz, places, destination, cat, afterHours, listing?.id || null
      );

      if (lead) {
        totalLeads++;
      }

      categoryResults.push({
        business: biz.name,
        status: listing ? 'created' : 'error',
        listingId: listing?.id || null,
        slug: listing?.slug || null,
        leadId: lead?.id || null,
        leadStatus: lead?.status || null,
        enriched: !!places,
        closedAfterHours: afterHours.closedAfterHours,
        afterHoursReason: afterHours.reason || null,
        googleRating: places?.rating || null,
        error: listingError || leadError || null,
      });

      // Brief pause to avoid rate limits
      await new Promise(r => setTimeout(r, 300));
    }

    results.push({
      category: cat,
      label: catInfo.label,
      businesses: categoryResults,
    });
  }

  return NextResponse.json({
    success: true,
    destination: DESTINATIONS[destination].label,
    summary: {
      discovered: totalDiscovered,
      enriched: totalEnriched,
      listingsCreated: totalListings,
      leadsCreated: totalLeads,
      closedAfterHours: totalAfterHours,
    },
    results,
  });
}

// GET - List available destinations and categories
export async function GET() {
  return NextResponse.json({
    destinations: Object.entries(DESTINATIONS).map(([id, d]) => ({
      id, label: d.label, state: d.state,
    })),
    categories: Object.entries(TOURISM_CATEGORIES).map(([id, c]) => ({
      id, label: c.label, industry: c.industry,
    })),
  });
}

import { NextRequest, NextResponse } from 'next/server';

const googlePlacesKey = process.env.GOOGLE_PLACES_API_KEY || '';

/**
 * Validate that a place ID matches the expected Google Places format
 * to prevent SSRF via path traversal in the API URL.
 */
function isValidPlaceId(placeId: string): boolean {
  return /^[A-Za-z0-9_-]{20,200}$/.test(placeId);
}

/**
 * Validate that a URL is safe to fetch (not an internal/private resource).
 * Blocks private IPs, localhost, and non-HTTP(S) schemes to prevent SSRF.
 */
function isSafeUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    // Only allow http(s)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    const hostname = parsed.hostname.toLowerCase();
    // Block localhost and common internal hostnames
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '0.0.0.0') return false;
    // Block private IP ranges
    if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|fc00:|fd)/.test(hostname)) return false;
    // Block metadata endpoints
    if (hostname === 'metadata.google.internal' || hostname === '169.254.169.254') return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * POST /api/directory/import — Extract business info from a URL or Google Places
 *
 * Returns extracted fields for form pre-fill (does NOT create a listing).
 *
 * Body: { url: string }
 *   - If it's a Google Maps/Places URL → extract place ID → Google Places API lookup
 *   - Otherwise → fetch the URL and extract meta tags + structured data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }

    const trimmed = url.trim();

    // Detect Google Maps / Places URLs
    const placeId = extractGooglePlaceId(trimmed);
    if (placeId && googlePlacesKey) {
      const data = await lookupGooglePlace(placeId);
      if (data) return NextResponse.json({ source: 'google_places', ...data });
    }

    // Google Maps URL without extractable place ID — try search text extraction
    if (isGoogleMapsUrl(trimmed) && googlePlacesKey) {
      const searchText = extractGoogleMapsSearchText(trimmed);
      if (searchText) {
        const data = await searchGooglePlace(searchText);
        if (data) return NextResponse.json({ source: 'google_places', ...data });
      }
    }

    // Website URL — scrape meta tags
    const data = await scrapeMetaTags(trimmed);
    return NextResponse.json({ source: 'website', ...data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Import failed' }, { status: 500 });
  }
}

// ─── Google Maps URL Detection ─────────────────────────────────────────────

function isGoogleMapsUrl(url: string): boolean {
  return /google\.(com|[a-z]{2,3})\/(maps|search)/.test(url) || url.includes('maps.app.goo.gl');
}

function extractGooglePlaceId(url: string): string | null {
  // Pattern: place_id=ChIJ...
  const placeIdMatch = url.match(/place_id[=:]([A-Za-z0-9_-]+)/);
  if (placeIdMatch) return placeIdMatch[1];

  // Pattern: /place/data=...!1s0x...!3m1!4b1 (hex place ID in data param)
  // These are harder to parse, skip

  return null;
}

function extractGoogleMapsSearchText(url: string): string | null {
  try {
    // Pattern: /maps/place/Business+Name/...
    const placeMatch = url.match(/\/maps\/place\/([^/@]+)/);
    if (placeMatch) return decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));

    // Pattern: /maps/search/query+text
    const searchMatch = url.match(/\/maps\/search\/([^/@]+)/);
    if (searchMatch) return decodeURIComponent(searchMatch[1].replace(/\+/g, ' '));

    // Pattern: /maps?q=query+text
    const parsed = new URL(url);
    const q = parsed.searchParams.get('q');
    if (q) return q;

    return null;
  } catch {
    return null;
  }
}

// ─── Google Places API ─────────────────────────────────────────────────────

async function lookupGooglePlace(placeId: string) {
  if (!isValidPlaceId(placeId)) return null;

  const fieldMask = [
    'displayName',
    'formattedAddress',
    'nationalPhoneNumber',
    'websiteUri',
    'primaryType',
    'types',
    'editorialSummary',
    'regularOpeningHours',
    'location',
    'addressComponents',
    'photos',
  ].join(',');

  const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: {
      'X-Goog-Api-Key': googlePlacesKey,
      'X-Goog-FieldMask': fieldMask,
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) return null;
  const place = await res.json();
  return formatPlaceData(place);
}

async function searchGooglePlace(query: string) {
  const fieldMask = [
    'places.displayName',
    'places.formattedAddress',
    'places.nationalPhoneNumber',
    'places.websiteUri',
    'places.primaryType',
    'places.types',
    'places.editorialSummary',
    'places.regularOpeningHours',
    'places.location',
    'places.addressComponents',
    'places.photos',
    'places.id',
  ].join(',');

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': googlePlacesKey,
      'X-Goog-FieldMask': fieldMask,
    },
    body: JSON.stringify({ textQuery: query }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) return null;
  const data = await res.json();
  const place = data.places?.[0];
  if (!place) return null;
  return formatPlaceData(place);
}

function formatPlaceData(place: any) {
  const components = place.addressComponents || [];
  const getComponent = (type: string) =>
    components.find((c: any) => c.types?.includes(type))?.longText || '';
  const getShort = (type: string) =>
    components.find((c: any) => c.types?.includes(type))?.shortText || '';

  // Map Google place types to our industries
  const industry = mapGoogleTypeToIndustry(place.primaryType, place.types || []);

  // Build hours
  const hours: Record<string, { open: string; close: string }> = {};
  if (place.regularOpeningHours?.periods) {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (const period of place.regularOpeningHours.periods) {
      const dayName = dayNames[period.open?.day ?? 0];
      if (dayName && period.open && period.close) {
        hours[dayName] = {
          open: `${String(period.open.hour ?? 0).padStart(2, '0')}:${String(period.open.minute ?? 0).padStart(2, '0')}`,
          close: `${String(period.close.hour ?? 0).padStart(2, '0')}:${String(period.close.minute ?? 0).padStart(2, '0')}`,
        };
      }
    }
  }

  // Photos
  const photos: string[] = [];
  if (place.photos?.length) {
    for (const photo of place.photos.slice(0, 5)) {
      photos.push(`https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=800&key=${googlePlacesKey}`);
    }
  }

  return {
    business_name: place.displayName?.text || '',
    description: place.editorialSummary?.text || '',
    industry,
    phone: place.nationalPhoneNumber || '',
    website: place.websiteUri || '',
    address_line1: [getComponent('street_number'), getComponent('route')].filter(Boolean).join(' '),
    city: getComponent('locality') || getComponent('sublocality'),
    state: getShort('administrative_area_level_1'),
    zip_code: getComponent('postal_code'),
    hours: Object.keys(hours).length > 0 ? hours : null,
    photos,
    google_place_id: place.id || null,
    latitude: place.location?.latitude || null,
    longitude: place.location?.longitude || null,
  };
}

function mapGoogleTypeToIndustry(primaryType: string | undefined, types: string[]): string {
  const all = [primaryType, ...types].filter(Boolean) as string[];
  const typeStr = all.join(' ').toLowerCase();

  if (/restaurant|food|bakery|cafe|coffee|pizza|bar|pub|brewery|meal|diner/.test(typeStr)) return 'Dining';
  if (/night_club|lounge|karaoke/.test(typeStr)) return 'Nightlife';
  if (/amusement|bowling|arcade|theme_park|zoo|aquarium|cinema|movie/.test(typeStr)) return 'Family Entertainment';
  if (/museum|park|tourist|landmark|beach|campground|rv_park/.test(typeStr)) return 'Destinations';
  if (/gym|fitness|spa|beauty|hair|nail|doctor|dentist|hospital|pharmacy|wellness/.test(typeStr)) return 'Health & Wellness';
  if (/store|shop|boutique|mall|clothing|jewelry|market/.test(typeStr)) return 'Style & Shopping';
  if (/plumber|electrician|hvac|contractor|locksmith|painter|roofer|landscap|cleaning|moving|pest|repair/.test(typeStr)) return 'Services';
  if (/hotel|motel|resort|lodging|inn|hostel/.test(typeStr)) return 'Destinations';

  return 'Services';
}

// ─── Website Meta Tag Scraping ─────────────────────────────────────────────

async function scrapeMetaTags(url: string) {
  let normalizedUrl = url;
  if (!normalizedUrl.startsWith('http')) normalizedUrl = 'https://' + normalizedUrl;

  if (!isSafeUrl(normalizedUrl)) {
    return { business_name: '', description: '', error: 'URL is not allowed (internal or private address)' };
  }

  const res = await fetch(normalizedUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; GL365Bot/1.0)',
      'Accept': 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    return { business_name: '', description: '', error: `Failed to fetch URL (${res.status})` };
  }

  const html = await res.text();

  // Extract meta tags
  const getMeta = (name: string) => {
    const match = html.match(new RegExp(`<meta[^>]*(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i'))
      || html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']${name}["']`, 'i'));
    return match?.[1]?.trim() || '';
  };

  const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || '';
  const ogTitle = getMeta('og:title');
  const ogDesc = getMeta('og:description');
  const metaDesc = getMeta('description');
  const ogImage = getMeta('og:image');

  // Try to extract phone from page content
  const phoneMatch = html.match(/(?:tel:|href=["']tel:)([^"'<>\s]+)/i)
    || html.match(/(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/);
  const phone = phoneMatch ? phoneMatch[1].replace(/[^\d()+\s-]/g, '').trim() : '';

  // Try to extract email
  const emailMatch = html.match(/(?:mailto:)([^"'<>\s?]+)/i)
    || html.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const email = emailMatch ? emailMatch[1].trim() : '';

  // Try to extract address from structured data (JSON-LD)
  let address_line1 = '';
  let city = '';
  let state = '';
  let zip_code = '';
  let industry = '';

  const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const m of jsonLdMatches) {
    try {
      const ld = JSON.parse(m[1]);
      const addr = ld.address || ld?.['@graph']?.find?.((n: any) => n.address)?.address;
      if (addr) {
        address_line1 = addr.streetAddress || address_line1;
        city = addr.addressLocality || city;
        state = addr.addressRegion || state;
        zip_code = addr.postalCode || zip_code;
      }
      if (ld['@type'] && !industry) {
        const ldType = Array.isArray(ld['@type']) ? ld['@type'].join(' ') : ld['@type'];
        if (/Restaurant|FoodEstablishment|BarOrPub|Bakery|CafeOrCoffeeShop/i.test(ldType)) industry = 'Dining';
        else if (/Store|Shop|Clothing/i.test(ldType)) industry = 'Style & Shopping';
        else if (/Health|Medical|Dentist|Gym|Spa|Beauty/i.test(ldType)) industry = 'Health & Wellness';
        else if (/LocalBusiness|HomeAndConstructionBusiness|Plumber|Electrician/i.test(ldType)) industry = 'Services';
        else if (/LodgingBusiness|Hotel/i.test(ldType)) industry = 'Destinations';
        else if (/Entertainment|AmusementPark/i.test(ldType)) industry = 'Family Entertainment';
      }
    } catch { /* ignore invalid JSON-LD */ }
  }

  // Derive business name: prefer og:title, then page title, then domain
  let businessName = ogTitle || title || '';
  // Clean common title suffixes: "Business Name | Tagline", "Business Name - City"
  businessName = businessName.split(/\s*[|–—]\s*/)[0].trim();
  if (!businessName) {
    try {
      businessName = new URL(normalizedUrl).hostname.replace('www.', '').split('.')[0];
      businessName = businessName.charAt(0).toUpperCase() + businessName.slice(1);
    } catch { /* */ }
  }

  return {
    business_name: businessName,
    description: ogDesc || metaDesc || '',
    industry,
    phone,
    email,
    website: normalizedUrl,
    address_line1,
    city,
    state,
    zip_code,
    cover_image: ogImage || '',
  };
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const googleApiKey = process.env.GOOGLE_PLACES_API_KEY!;

function getServiceClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

// GL365 category mapping from Google Places types
const CATEGORY_MAP: Record<string, string> = {
  restaurant: 'Dining',
  cafe: 'Dining',
  bakery: 'Dining',
  bar: 'Nightlife',
  night_club: 'Nightlife',
  food: 'Dining',
  meal_delivery: 'Dining',
  meal_takeaway: 'Dining',
  hair_care: 'Style & Shopping',
  beauty_salon: 'Style & Shopping',
  clothing_store: 'Style & Shopping',
  shopping_mall: 'Style & Shopping',
  shoe_store: 'Style & Shopping',
  jewelry_store: 'Style & Shopping',
  spa: 'Health & Wellness',
  gym: 'Health & Wellness',
  health: 'Health & Wellness',
  doctor: 'Health & Wellness',
  dentist: 'Health & Wellness',
  physiotherapist: 'Health & Wellness',
  pharmacy: 'Health & Wellness',
  plumber: 'Services',
  electrician: 'Services',
  roofing_contractor: 'Services',
  general_contractor: 'Services',
  painter: 'Services',
  locksmith: 'Services',
  moving_company: 'Services',
  car_repair: 'Services',
  car_wash: 'Services',
  real_estate_agency: 'Services',
  insurance_agency: 'Services',
  lawyer: 'Services',
  accounting: 'Services',
  amusement_park: 'Family Entertainment',
  aquarium: 'Family Entertainment',
  bowling_alley: 'Family Entertainment',
  movie_theater: 'Family Entertainment',
  zoo: 'Family Entertainment',
  museum: 'Destinations',
  park: 'Destinations',
  tourist_attraction: 'Destinations',
  lodging: 'Destinations',
  campground: 'Destinations',
};

// Fallback: map CRM tags to GL365 categories
const TAG_CATEGORY_MAP: Record<string, string> = {
  restaurant: 'Dining',
  bakery: 'Dining',
  boutique: 'Style & Shopping',
  barbershop: 'Style & Shopping',
  plumbing: 'Services',
  electrical: 'Services',
  hvac: 'Services',
  roofing: 'Services',
  gym: 'Health & Wellness',
  general: 'Services',
};

function mapToGL365Category(googleTypes: string[], crmTags: string[]): string {
  // Try Google types first
  for (const type of googleTypes) {
    if (CATEGORY_MAP[type]) return CATEGORY_MAP[type];
  }
  // Fallback to CRM tags
  for (const tag of crmTags) {
    if (TAG_CATEGORY_MAP[tag]) return TAG_CATEGORY_MAP[tag];
  }
  return 'Services'; // Default
}

// --- Email Classification ---
const GENERAL_PREFIXES = ['info', 'contact', 'hello', 'inquiries', 'inquiry', 'general', 'office', 'team', 'support', 'help', 'service', 'services'];
const MARKETING_PREFIXES = ['marketing', 'sales', 'admin', 'advertising', 'pr', 'media', 'press'];
const PERSONAL_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com', 'icloud.com', 'me.com', 'live.com', 'msn.com', 'att.net', 'comcast.net'];

function classifyEmail(email: string): string {
  if (!email) return 'unknown';
  const lower = email.toLowerCase();
  const local = lower.split('@')[0];
  const domain = lower.split('@')[1] || '';
  if (PERSONAL_DOMAINS.includes(domain)) return 'owner_personal';
  if (GENERAL_PREFIXES.includes(local)) return 'general_inbox';
  if (MARKETING_PREFIXES.includes(local)) return 'marketing_team';
  if (/^[a-z]+(\.[a-z]+)?$/.test(local) && !GENERAL_PREFIXES.includes(local)) return 'decision_maker';
  return 'general_inbox';
}

async function scrapeContactEmails(websiteUrl: string): Promise<{ name: string | null; email: string; role: string | null; source: string }[]> {
  const contacts: { name: string | null; email: string; role: string | null; source: string }[] = [];
  if (!websiteUrl) return contacts;
  const cheerio = await import('cheerio');
  const paths = ['/contact', '/about', '/contact-us', '/about-us', '/team'];
  const baseUrl = websiteUrl.replace(/\/$/, '');

  for (const path of paths) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(baseUrl + path, {
        signal: controller.signal,
        headers: { 'User-Agent': 'GreenLine365-Audit/1.0' },
        redirect: 'follow',
      });
      clearTimeout(timeout);
      if (!res.ok) continue;

      const html = await res.text();
      const $ = cheerio.load(html);
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const foundEmails = [...new Set([
        ...(html.match(emailRegex) || []),
        ...$('a[href^="mailto:"]').map((_, el) => ($(el).attr('href') || '').replace('mailto:', '').split('?')[0].trim()).get(),
      ])].filter(e => !e.includes('.png') && !e.includes('.jpg') && !e.includes('example.com') && !e.includes('sentry') && !e.includes('wixpress'));

      for (const email of foundEmails) {
        const local = email.split('@')[0];
        let name: string | null = null;
        if (/^[a-z]+\.[a-z]+$/i.test(local)) {
          name = local.split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }
        // Detect role from nearby text
        let role: string | null = null;
        const textContent = $('body').text().toLowerCase();
        const idx = textContent.indexOf(email.toLowerCase());
        if (idx >= 0) {
          const nearby = textContent.substring(Math.max(0, idx - 200), idx + 200);
          for (const rp of ['owner', 'founder', 'ceo', 'president', 'manager', 'director']) {
            if (nearby.includes(rp)) { role = rp.charAt(0).toUpperCase() + rp.slice(1); break; }
          }
        }
        contacts.push({ name, email, role, source: path });
      }
      if (contacts.length > 0) break;
    } catch { continue; }
  }
  return contacts;
}

async function enrichWithGooglePlaces(businessName: string, location: string) {
  // Step 1: Text search to find the place
  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(businessName + ' ' + location)}&key=${googleApiKey}`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();

  if (!searchData.results || searchData.results.length === 0) {
    return { found: false, error: 'No Google Places results' };
  }

  const place = searchData.results[0];
  const placeId = place.place_id;

  // Step 2: Get detailed info
  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,opening_hours,photos,types,geometry,business_status,url&key=${googleApiKey}`;
  const detailsRes = await fetch(detailsUrl);
  const detailsData = await detailsRes.json();

  if (!detailsData.result) {
    return { found: false, error: 'Could not get place details' };
  }

  const details = detailsData.result;

  // Build photo URLs (first 5)
  const photoUrls: string[] = [];
  if (details.photos) {
    for (const photo of details.photos.slice(0, 5)) {
      photoUrls.push(
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${googleApiKey}`
      );
    }
  }

  // Parse address components
  const addressParts = (details.formatted_address || '').split(',').map((s: string) => s.trim());

  return {
    found: true,
    google_place_id: placeId,
    name: details.name,
    address: details.formatted_address,
    address_line1: addressParts[0] || null,
    city: addressParts[1] || null,
    state: addressParts[2]?.split(' ')[0] || null,
    zip_code: addressParts[2]?.split(' ')[1] || null,
    phone: details.formatted_phone_number || null,
    website: details.website || null,
    rating: details.rating || null,
    review_count: details.user_ratings_total || 0,
    business_status: details.business_status || 'UNKNOWN',
    google_maps_url: details.url || null,
    latitude: details.geometry?.location?.lat || null,
    longitude: details.geometry?.location?.lng || null,
    types: details.types || [],
    photo_count: details.photos?.length || 0,
    photo_urls: photoUrls,
    hours: details.opening_hours?.weekday_text || [],
    is_open_now: details.opening_hours?.open_now ?? null,
    has_hours: !!details.opening_hours,
  };
}

async function auditWebsite(websiteUrl: string): Promise<{
  selling_points: string[];
  audit_details: Record<string, unknown>;
}> {
  const sellingPoints: string[] = [];
  const auditDetails: Record<string, unknown> = {};

  if (!websiteUrl) {
    sellingPoints.push('sell_website_creation');
    return { selling_points: sellingPoints, audit_details: { error: 'no_website' } };
  }

  try {
    // Use dynamic import for cheerio
    const cheerio = await import('cheerio');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(websiteUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'GreenLine365-Audit/1.0' },
      redirect: 'follow',
    });
    clearTimeout(timeout);

    const html = await res.text();
    const $ = cheerio.load(html);
    const htmlLower = html.toLowerCase();

    // Check SSL
    const isHttps = websiteUrl.startsWith('https://') || res.url.startsWith('https://');
    auditDetails.has_ssl = isHttps;
    if (!isHttps) sellingPoints.push('sell_web_security');

    // Check for chat widget
    const chatIndicators = [
      'intercom', 'drift', 'tidio', 'livechat', 'zendesk', 'crisp',
      'hubspot', 'tawk', 'freshchat', 'olark', 'chatwoot', 'chat-widget',
      'live-chat', 'messenger-widget', 'fb-customerchat',
    ];
    const hasChat = chatIndicators.some(c => htmlLower.includes(c));
    auditDetails.has_chat_widget = hasChat;
    if (!hasChat) sellingPoints.push('sell_chat_widget');

    // Check for online booking/scheduling
    const bookingIndicators = [
      'book-now', 'booking', 'schedule', 'appointment', 'calendly',
      'acuity', 'cal.com', 'booksy', 'vagaro', 'mindbody', 'reserve',
      'book online', 'schedule online',
    ];
    const hasBooking = bookingIndicators.some(b => htmlLower.includes(b));
    auditDetails.has_online_booking = hasBooking;
    if (!hasBooking) sellingPoints.push('sell_booking_system');

    // Check for mobile viewport meta tag
    const hasViewport = $('meta[name="viewport"]').length > 0;
    auditDetails.has_mobile_viewport = hasViewport;
    if (!hasViewport) sellingPoints.push('sell_mobile_optimization');

    // Check for analytics
    const analyticsIndicators = [
      'google-analytics', 'gtag', 'googletagmanager', 'ga.js', 'analytics.js',
      'facebook.net/en_US/fbevents', 'hotjar', 'mixpanel',
    ];
    const hasAnalytics = analyticsIndicators.some(a => htmlLower.includes(a));
    auditDetails.has_analytics = hasAnalytics;
    if (!hasAnalytics) sellingPoints.push('sell_analytics_setup');

    // Check for SEO basics
    const hasTitle = $('title').text().trim().length > 0;
    const hasMetaDesc = $('meta[name="description"]').attr('content')?.trim().length! > 0;
    auditDetails.has_title = hasTitle;
    const hasDescription = !!hasMetaDesc;
    auditDetails.has_meta_description = hasDescription;
    if (!hasTitle || !hasDescription) sellingPoints.push('sell_seo_optimization');

    // Check for social media links
    const socialIndicators = ['facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'linkedin.com', 'tiktok.com'];
    const socialFound = socialIndicators.filter(s => htmlLower.includes(s));
    auditDetails.social_media_links = socialFound;
    if (socialFound.length < 2) sellingPoints.push('sell_social_media_setup');

    // Everyone gets intelligence system pitch
    sellingPoints.push('sell_intelligence_system');

    auditDetails.page_title = $('title').text().trim() || null;
    auditDetails.crawled_at = new Date().toISOString();
    auditDetails.status_code = res.status;

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown crawl error';
    auditDetails.crawl_error = errorMsg;
    sellingPoints.push('sell_website_improvement');
    sellingPoints.push('sell_intelligence_system');
  }

  return { selling_points: sellingPoints, audit_details: auditDetails };
}

/**
 * POST /api/crm/enrich
 * Enriches a batch of CRM leads with Google Places data + website audit.
 * Body: { lead_ids?: string[], batch_size?: number, create_listings?: boolean }
 */
export async function POST(request: NextRequest) {
  const supabase = getServiceClient();

  if (!googleApiKey) {
    return NextResponse.json({ error: 'GOOGLE_PLACES_API_KEY not configured' }, { status: 500 });
  }

  const body = await request.json();
  const { lead_ids, batch_size = 5, create_listings = true } = body;

  // Fetch leads to enrich
  let query = supabase
    .from('crm_leads')
    .select('*')
    .eq('status', 'new')
    .order('created_at', { ascending: true });

  if (lead_ids && lead_ids.length > 0) {
    query = query.in('id', lead_ids);
  } else {
    query = query.limit(batch_size);
  }

  const { data: leads, error: leadsError } = await query;
  if (leadsError) {
    return NextResponse.json({ error: leadsError.message }, { status: 500 });
  }

  if (!leads || leads.length === 0) {
    return NextResponse.json({ error: 'No leads to enrich' }, { status: 404 });
  }

  const results = [];

  for (const lead of leads) {
    const result: Record<string, unknown> = {
      lead_id: lead.id,
      company: lead.company,
      email: lead.email,
    };

    try {
      // Parse website from notes if available
      let existingWebsite = null;
      if (lead.notes) {
        const webMatch = lead.notes.match(/Web:\s*(https?:\/\/[^\s|]+)/);
        if (webMatch) existingWebsite = webMatch[1];
      }

      // Step 1: Google Places enrichment
      const location = lead.tags?.includes('Tampa Bay') || lead.tags?.includes('Tampa')
        ? 'Tampa Bay, FL'
        : lead.tags?.includes('St. Petersburg') || lead.tags?.includes('St. Pete')
          ? 'St. Petersburg, FL'
          : 'Tampa Bay, FL';

      const places = await enrichWithGooglePlaces(lead.company, location);
      result.google_places = places;

      // Step 2: Website audit
      const websiteUrl = places.found && places.website ? places.website : existingWebsite;
      let audit = { selling_points: ['sell_website_creation', 'sell_intelligence_system'], audit_details: {} as Record<string, unknown> };
      if (websiteUrl) {
        audit = await auditWebsite(websiteUrl);
      }
      result.audit = audit;

      // Step 3: Email classification + contact scraping
      const emailClassification = classifyEmail(lead.email);
      let additionalContacts: { name: string | null; email: string; role: string | null; source: string }[] = [];
      if (websiteUrl && emailClassification === 'general_inbox') {
        additionalContacts = await scrapeContactEmails(websiteUrl);
        // Filter out the lead's own email
        additionalContacts = additionalContacts.filter(
          c => c.email.toLowerCase() !== (lead.email || '').toLowerCase()
        );
      }
      result.email_classification = emailClassification;
      result.additional_contacts = additionalContacts;

      // Step 4: Auto-categorize
      const gl365Category = mapToGL365Category(
        places.found ? (places.types as string[]) : [],
        lead.tags || []
      );
      result.gl365_category = gl365Category;

      // Step 5: Build enriched tags
      const enrichedTags = [...new Set([
        ...(lead.tags || []),
        ...audit.selling_points,
        `category_${gl365Category.toLowerCase().replace(/\s+/g, '_')}`,
        `email_type_${emailClassification}`,
        ...(additionalContacts.length > 0 ? ['has_additional_contacts'] : []),
        places.found ? 'google_verified' : 'google_not_found',
        'enriched',
      ])];

      // Step 6: Build metadata update
      const enrichedMetadata = {
        ...(lead.metadata || {}),
        google_places: places.found ? {
          place_id: places.google_place_id,
          rating: places.rating,
          review_count: places.review_count,
          photo_count: places.photo_count,
          business_status: places.business_status,
          has_hours: places.has_hours,
          google_maps_url: places.google_maps_url,
        } : null,
        website_audit: audit.audit_details,
        website: websiteUrl,
        gl365_category: gl365Category,
        email_classification: {
          primary_email: lead.email,
          contact_type: emailClassification,
          additional_contacts: additionalContacts.length > 0 ? additionalContacts : undefined,
          classified_at: new Date().toISOString(),
        },
        enriched_at: new Date().toISOString(),
      };

      // Step 6: Update CRM lead
      const { error: updateError } = await supabase
        .from('crm_leads')
        .update({
          phone: lead.phone || (places.found ? places.phone : null),
          metadata: enrichedMetadata,
          tags: enrichedTags,
          status: 'enriched',
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id);

      if (updateError) {
        result.crm_update = { error: updateError.message };
      } else {
        result.crm_update = { success: true };
      }

      // Step 7: Create/update directory listing
      if (create_listings && places.found) {
        const slug = lead.company
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        // Check for existing listing
        const { data: existing } = await supabase
          .from('directory_listings')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();

        const listingData = {
          business_name: places.name || lead.company,
          slug,
          industry: gl365Category.toLowerCase().replace(/\s+&\s+/g, '-').replace(/\s+/g, '-'),
          description: null,
          phone: places.phone,
          email: lead.email,
          website: websiteUrl,
          city: places.city,
          state: places.state,
          zip_code: places.zip_code,
          address_line1: places.address_line1,
          google_place_id: places.google_place_id,
          latitude: places.latitude,
          longitude: places.longitude,
          cover_image_url: places.photo_urls?.[0] || null,
          gallery_images: places.photo_urls?.slice(1) || [],
          business_hours: places.hours.length > 0 ? { weekday_text: places.hours } : {},
          tier: 'free',
          is_claimed: false,
          is_published: true,
          metadata: {
            google_rating: places.rating,
            google_review_count: places.review_count,
            google_photo_count: places.photo_count,
            google_maps_url: places.google_maps_url,
            selling_points: audit.selling_points,
          },
          ai_scraped_data: audit.audit_details,
          ai_scraped_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (existing) {
          const { error: upErr } = await supabase
            .from('directory_listings')
            .update(listingData)
            .eq('id', existing.id);
          result.directory_listing = upErr
            ? { error: upErr.message }
            : { action: 'updated', id: existing.id };
        } else {
          const { data: newListing, error: insErr } = await supabase
            .from('directory_listings')
            .insert({ ...listingData, created_at: new Date().toISOString() })
            .select('id')
            .single();
          result.directory_listing = insErr
            ? { error: insErr.message }
            : { action: 'created', id: newListing?.id };
        }
      }

      result.status = 'success';
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      result.status = 'error';
      result.error = errorMsg;
    }

    results.push(result);
  }

  // Summary
  const successful = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'error').length;

  return NextResponse.json({
    summary: {
      total: results.length,
      successful,
      failed,
      enriched_at: new Date().toISOString(),
    },
    results,
  });
}

/**
 * GET /api/crm/enrich?status=enriched
 * Returns enrichment stats
 */
export async function GET(request: NextRequest) {
  const supabase = getServiceClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'enriched';

  const { data, error, count } = await supabase
    .from('crm_leads')
    .select('id, company, status, tags, metadata', { count: 'exact' })
    .eq('status', status)
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Aggregate selling points
  const sellingPointCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};

  for (const lead of (data || [])) {
    const tags = lead.tags || [];
    for (const tag of tags) {
      if (tag.startsWith('sell_')) {
        sellingPointCounts[tag] = (sellingPointCounts[tag] || 0) + 1;
      }
      if (tag.startsWith('category_')) {
        categoryCounts[tag] = (categoryCounts[tag] || 0) + 1;
      }
    }
  }

  return NextResponse.json({
    total: count,
    selling_point_breakdown: sellingPointCounts,
    category_breakdown: categoryCounts,
    leads: data,
  });
}

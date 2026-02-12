import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openrouterKey = process.env.OPENROUTER_API_KEY!;
const googlePlacesKey = process.env.GOOGLE_PLACES_API_KEY!;
function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

const ADMIN_USER_ID = '677b536d-6521-4ac8-a0a5-98278b35f4cc';

const SERVICE_TYPES: Record<string, string> = {
  'roofers': 'roofing companies roof repair roof replacement',
  'plumbers': 'plumbing companies plumber drain cleaning pipe repair',
  'hvac': 'HVAC companies air conditioning heating repair AC installation',
  'electricians': 'electricians electrical contractors wiring repair',
  'landscapers': 'landscaping companies lawn care tree service yard maintenance',
  'painters': 'painting contractors house painters interior exterior painting',
  'pest-control': 'pest control companies exterminator termite treatment',
  'general-contractors': 'general contractors home renovation remodeling',
};

/**
 * POST /api/directory/discover/services
 * Targeted discovery for service businesses — the upsell targets.
 * Discovers, enriches, generates personalized briefs, flags after-hours.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { service_type, city = 'Tampa', limit = 25 } = body;

  if (!service_type || !SERVICE_TYPES[service_type]) {
    return NextResponse.json({ error: 'Invalid service_type', valid: Object.keys(SERVICE_TYPES) }, { status: 400 });
  }

  const searchTerms = SERVICE_TYPES[service_type];
  const supabase = getServiceClient();

  // Stage 1: Discover via Perplexity
  console.log(`[Discover Services] Finding ${limit} ${service_type} in ${city}...`);

  const discoverPrompt = `Find exactly ${limit} real, currently operating ${searchTerms} businesses in ${city}, Florida.

For each business, provide:
- name: the exact registered business name
- address: full street address including city, state, zip
- website: their website URL
- phone: phone number
- description: one detailed sentence about what they specialize in
- years_in_business: estimated years (if findable)
- specialties: list of 2-3 specific services they offer

Return ONLY a valid JSON array. No markdown. Example:
[{"name":"ABC Roofing","address":"123 Main St, Tampa, FL 33601","website":"https://abcroofing.com","phone":"813-555-1234","description":"Family-owned roofing company specializing in tile and shingle roof repair for residential homes.","years_in_business":"15","specialties":["tile roof repair","shingle replacement","roof inspections"]}]

Focus on local, independently owned businesses (NOT national chains). Include a mix of established and newer companies.`;

  const discoverRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openrouterKey}`,
      'HTTP-Referer': 'https://greenline365.com',
      'X-Title': 'GL365 Service Discovery',
    },
    body: JSON.stringify({
      model: 'perplexity/sonar-pro',
      messages: [{ role: 'user', content: discoverPrompt }],
      temperature: 0.1,
      max_tokens: 8000,
    }),
  });

  const discoverData = await discoverRes.json();
  const content = discoverData.choices?.[0]?.message?.content || '[]';

  let businesses: any[] = [];
  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) businesses = JSON.parse(jsonMatch[0]);
  } catch {
    return NextResponse.json({ error: 'Failed to parse discovery results' }, { status: 500 });
  }

  console.log(`[Discover Services] Found ${businesses.length} businesses`);

  const results: any[] = [];

  for (const biz of businesses) {
    try {
      // Stage 2: Google Places Enrichment
      const fieldMask = [
        'places.displayName', 'places.formattedAddress', 'places.nationalPhoneNumber',
        'places.websiteUri', 'places.googleMapsUri', 'places.id', 'places.location',
        'places.rating', 'places.userRatingCount', 'places.regularOpeningHours',
        'places.photos', 'places.types',
      ].join(',');

      const placesRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': googlePlacesKey,
          'X-Goog-FieldMask': fieldMask,
        },
        body: JSON.stringify({
          textQuery: `${biz.name} ${city} Florida`,
          maxResultCount: 1,
        }),
      });

      const placesData = await placesRes.json();
      const places = placesData.places?.[0];

      // After-hours detection
      const hours = places?.regularOpeningHours;
      let closedAfterHours = false;
      let afterHoursReason = '';
      if (!hours?.periods || hours.periods.length === 0) {
        closedAfterHours = true;
        afterHoursReason = 'No hours listed — likely closed after business hours';
      } else {
        const weekdayPeriods = hours.periods.filter((p: any) => p.open.day >= 1 && p.open.day <= 5);
        const closesEarly = weekdayPeriods.some((p: any) => p.close && p.close.hour < 18);
        const satPeriods = hours.periods.filter((p: any) => p.open.day === 6);
        const sunPeriods = hours.periods.filter((p: any) => p.open.day === 0);
        const noWeekend = satPeriods.length === 0 && sunPeriods.length === 0;

        if (closesEarly || noWeekend) {
          closedAfterHours = true;
          const reasons = [];
          if (closesEarly) reasons.push('Closes before 6 PM on weekdays');
          if (noWeekend) reasons.push('No weekend hours');
          afterHoursReason = reasons.join('. ');
        }
      }

      // Get photos
      const photoUrls: string[] = [];
      if (places?.photos) {
        for (const photo of places.photos.slice(0, 10)) {
          const photoName = photo.name;
          photoUrls.push(`https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=${googlePlacesKey}`);
        }
      }

      // Generate personalized brief
      const website = places?.websiteUri || biz.website || '';
      const briefPrompt = `Write a 2-3 sentence sales intelligence brief about "${biz.name}" for a sales team preparing email outreach. Include:
- What they specialize in
- Their Google rating (${places?.rating || 'unknown'}/5, ${places?.userRatingCount || 0} reviews)
- ${closedAfterHours ? `They are CLOSED after hours (${afterHoursReason}) — this is a key selling point for our AI booking agent` : 'They appear to have standard business hours'}
- Their website: ${website}
${biz.specialties ? `- Specialties: ${biz.specialties.join(', ')}` : ''}

Write it as a concise internal brief, not a customer-facing description. Be specific and actionable.`;

      const briefRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openrouterKey}`,
          'HTTP-Referer': 'https://greenline365.com',
          'X-Title': 'GL365 Brief Generator',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-opus-4.6',
          messages: [{ role: 'user', content: briefPrompt }],
          temperature: 0.5,
          max_tokens: 300,
        }),
      });

      const briefData = await briefRes.json();
      const brief = briefData.choices?.[0]?.message?.content || '';

      // Create slug
      const slug = biz.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

      // Check for duplicate
      const { data: existing } = await supabase
        .from('directory_listings')
        .select('id')
        .eq('slug', slug)
        .single();

      if (existing) {
        results.push({ name: biz.name, status: 'duplicate', slug });
        continue;
      }

      // Insert listing
      const address = places?.formattedAddress || biz.address || '';
      const addressParts = address.split(',').map((s: string) => s.trim());
      const lat = places?.location?.latitude;
      const lng = places?.location?.longitude;

      const sellingPoints: string[] = [];
      if (closedAfterHours) sellingPoints.push('sell_booking_agent');
      if (!website || website.length < 10) sellingPoints.push('sell_website_audit');
      sellingPoints.push('sell_intelligence_system');

      const { data: listing, error: listingError } = await supabase
        .from('directory_listings')
        .insert({
          business_name: biz.name,
          slug,
          industry: 'services',
          subcategories: biz.specialties || [service_type],
          description: biz.description || null,
          phone: places?.nationalPhoneNumber || biz.phone || null,
          website: website || null,
          address_line1: addressParts[0] || null,
          city: city,
          state: 'FL',
          zip_code: addressParts.find((p: string) => /\d{5}/.test(p))?.match(/\d{5}/)?.[0] || null,
          tier: 'free',
          is_claimed: false,
          gallery_images: photoUrls,
          cover_image_url: photoUrls[0] || null,
          tags: [`destination:tampa`, 'auto_discovered', `service:${service_type}`],
          metadata: {
            google_rating: places?.rating || null,
            google_review_count: places?.userRatingCount || null,
            google_maps_url: places?.googleMapsUri || null,
            google_place_id: places?.id || null,
            google_photo_count: photoUrls.length,
            latitude: lat || null,
            longitude: lng || null,
            is_closed_after_hours: closedAfterHours,
            after_hours_reason: afterHoursReason,
            selling_points: sellingPoints,
            sales_brief: brief,
            specialties: biz.specialties || [],
            years_in_business: biz.years_in_business || null,
            hours_description: hours?.weekdayDescriptions || [],
          },
        })
        .select('id, slug')
        .single();

      if (listingError) {
        results.push({ name: biz.name, status: 'error', error: listingError.message });
        continue;
      }

      // Insert CRM lead
      const domain = (website || '').replace(/https?:\/\//, '').replace('www.', '').split('/')[0];
      const email = domain && domain.includes('.') ? `info@${domain}` : null;

      if (email) {
        const tags = ['auto_discovered', `service:${service_type}`, 'directory_import'];
        if (closedAfterHours) tags.push('closed_after_hours');

        await supabase.from('crm_leads').insert({
          user_id: ADMIN_USER_ID,
          email: email.toLowerCase(),
          name: biz.name,
          phone: places?.nationalPhoneNumber || biz.phone || null,
          company: biz.name,
          source: 'gl365_service_discovery',
          status: closedAfterHours ? 'qualified' : 'new',
          tags,
          notes: brief,
          metadata: {
            service_type,
            after_hours: closedAfterHours,
            after_hours_reason: afterHoursReason,
            google_rating: places?.rating,
            listing_id: listing?.id,
            website,
          },
          first_contact_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      results.push({
        name: biz.name,
        status: 'created',
        slug,
        rating: places?.rating,
        reviews: places?.userRatingCount,
        closed_after_hours: closedAfterHours,
        after_hours_reason: afterHoursReason,
        photos: photoUrls.length,
        brief: brief.slice(0, 150) + '...',
        has_crm_lead: !!email,
      });

      // Rate limit
      await new Promise(r => setTimeout(r, 200));
    } catch (err: any) {
      results.push({ name: biz.name, status: 'error', error: err.message });
    }
  }

  const afterHoursCount = results.filter(r => r.closed_after_hours).length;
  const createdCount = results.filter(r => r.status === 'created').length;

  return NextResponse.json({
    service_type,
    city,
    total_discovered: businesses.length,
    created: createdCount,
    duplicates: results.filter(r => r.status === 'duplicate').length,
    errors: results.filter(r => r.status === 'error').length,
    after_hours_targets: afterHoursCount,
    results,
  });
}

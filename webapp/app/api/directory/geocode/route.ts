import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY!;
function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

/**
 * POST /api/directory/geocode — Batch geocode listings that don't have lat/lng
 * Uses Google Geocoding API to convert addresses to coordinates
 * Stores results in metadata.latitude / metadata.longitude
 */

export async function POST() {
  const supabase = getServiceClient();

  // Get listings without coordinates
  const { data: listings } = await supabase
    .from('directory_listings')
    .select('id, business_name, address_line1, city, state, zip_code, metadata')
    .order('created_at', { ascending: false });

  if (!listings) return NextResponse.json({ error: 'No listings found' }, { status: 404 });

  const needsGeocoding = listings.filter(l => {
    const m = l.metadata || {};
    return !m.latitude && (l.address_line1 || l.city);
  });

  let geocoded = 0;
  let failed = 0;

  for (const listing of needsGeocoding.slice(0, 50)) {
    const address = [listing.address_line1, listing.city, listing.state, listing.zip_code].filter(Boolean).join(', ');
    if (!address) { failed++; continue; }

    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`
      );
      const data = await res.json();

      if (data.status === 'OK' && data.results?.[0]?.geometry?.location) {
        const { lat, lng } = data.results[0].geometry.location;
        const metadata = { ...listing.metadata, latitude: lat, longitude: lng };

        await supabase
          .from('directory_listings')
          .update({ metadata })
          .eq('id', listing.id);

        geocoded++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }

    // Rate limit: ~10 per second
    await new Promise(r => setTimeout(r, 100));
  }

  return NextResponse.json({
    total: listings.length,
    needed: needsGeocoding.length,
    geocoded,
    failed,
    remaining: needsGeocoding.length - geocoded - failed,
  });
}

// GET — Check geocoding status
export async function GET() {
  const supabase = getServiceClient();
  const { data: listings } = await supabase
    .from('directory_listings')
    .select('id, metadata')
    .limit(500);

  if (!listings) return NextResponse.json({ total: 0, geocoded: 0, missing: 0 });

  const geocoded = listings.filter(l => l.metadata?.latitude).length;
  return NextResponse.json({
    total: listings.length,
    geocoded,
    missing: listings.length - geocoded,
  });
}

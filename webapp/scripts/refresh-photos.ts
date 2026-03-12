/**
 * One-time script: Refresh expired Google Places photo URLs
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... GOOGLE_PLACES_API_KEY=... npx tsx scripts/refresh-photos.ts
 *
 * Or if env vars are already exported:
 *   npx tsx scripts/refresh-photos.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;

if (!supabaseUrl || !supabaseKey || !googleApiKey) {
  console.error('Missing required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_PLACES_API_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const RATE_LIMIT_MS = 300; // ~3 requests/sec
const MAX_PHOTOS = 5;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchFreshPhotos(placeId: string): Promise<string[] | null> {
  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': googleApiKey!,
      'X-Goog-FieldMask': 'photos',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  if (!data.photos || data.photos.length === 0) return null;

  return data.photos.slice(0, MAX_PHOTOS).map(
    (photo: { name: string }) =>
      `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=800&key=${googleApiKey}`
  );
}

async function main() {
  console.log('Refreshing Google Places photos...\n');

  // Fetch all listings with a google_place_id
  const { data: listings, error } = await supabase
    .from('directory_listings')
    .select('id, business_name, google_place_id, cover_image_url, gallery_images')
    .not('google_place_id', 'is', null)
    .order('business_name');

  if (error) {
    console.error('Failed to query listings:', error.message);
    process.exit(1);
  }

  if (!listings || listings.length === 0) {
    console.log('No listings with google_place_id found.');
    return;
  }

  console.log(`Found ${listings.length} listings with google_place_id\n`);

  let updated = 0;
  let skipped = 0;
  let errored = 0;

  for (let i = 0; i < listings.length; i++) {
    const listing = listings[i];
    const prefix = `[${i + 1}/${listings.length}]`;

    try {
      const photos = await fetchFreshPhotos(listing.google_place_id);

      if (!photos || photos.length === 0) {
        console.log(`${prefix} -- ${listing.business_name} -- no photos returned, skipping`);
        skipped++;
        await sleep(RATE_LIMIT_MS);
        continue;
      }

      // Update directory_listings
      const { error: updateError } = await supabase
        .from('directory_listings')
        .update({
          cover_image_url: photos[0],
          gallery_images: photos,
        })
        .eq('id', listing.id);

      if (updateError) {
        console.log(`${prefix} !! ${listing.business_name} -- DB update failed: ${updateError.message}`);
        errored++;
        await sleep(RATE_LIMIT_MS);
        continue;
      }

      // Update listing_photos table if rows exist for this listing
      const { data: existingPhotos } = await supabase
        .from('listing_photos')
        .select('id')
        .eq('listing_id', listing.id)
        .limit(1);

      if (existingPhotos && existingPhotos.length > 0) {
        // Delete old photos and insert fresh ones
        await supabase.from('listing_photos').delete().eq('listing_id', listing.id);
        const photoRows = photos.map((url, idx) => ({
          listing_id: listing.id,
          url,
          alt_text: `${listing.business_name} photo ${idx + 1}`,
          position: idx,
          is_cover: idx === 0,
        }));
        await supabase.from('listing_photos').insert(photoRows);
      }

      console.log(`${prefix} OK ${listing.business_name} -- ${photos.length} photos refreshed`);
      updated++;
    } catch (err: any) {
      console.log(`${prefix} !! ${listing.business_name} -- ${err.message}`);
      errored++;
    }

    await sleep(RATE_LIMIT_MS);
  }

  console.log(`\nDone! Updated: ${updated} | Skipped: ${skipped} | Errors: ${errored}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

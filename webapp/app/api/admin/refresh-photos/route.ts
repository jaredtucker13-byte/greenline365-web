import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Allow up to 5 minutes for large batches
export const maxDuration = 300;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const googleApiKey = process.env.GOOGLE_PLACES_API_KEY!;

const RATE_LIMIT_MS = 300;
const MAX_PHOTOS = 5;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchFreshPhotos(placeId: string): Promise<string[] | null> {
  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': googleApiKey,
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

export async function POST(request: NextRequest) {
  // Protect with service role key as bearer token
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${supabaseKey}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!googleApiKey) {
    return new Response('GOOGLE_PLACES_API_KEY not configured', { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Stream progress back to the client
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const log = (msg: string) => {
        controller.enqueue(encoder.encode(msg + '\n'));
      };

      try {
        log('Refreshing Google Places photos...\n');

        const { data: listings, error } = await supabase
          .from('directory_listings')
          .select('id, business_name, google_place_id, cover_image_url, gallery_images')
          .not('google_place_id', 'is', null)
          .order('business_name');

        if (error) {
          log(`ERROR: Failed to query listings: ${error.message}`);
          controller.close();
          return;
        }

        if (!listings || listings.length === 0) {
          log('No listings with google_place_id found.');
          controller.close();
          return;
        }

        log(`Found ${listings.length} listings with google_place_id\n`);

        let updated = 0;
        let skipped = 0;
        let errored = 0;

        for (let i = 0; i < listings.length; i++) {
          const listing = listings[i];
          const prefix = `[${i + 1}/${listings.length}]`;

          try {
            const photos = await fetchFreshPhotos(listing.google_place_id);

            if (!photos || photos.length === 0) {
              log(`${prefix} -- ${listing.business_name} -- no photos returned, skipping`);
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
              log(`${prefix} !! ${listing.business_name} -- DB update failed: ${updateError.message}`);
              errored++;
              await sleep(RATE_LIMIT_MS);
              continue;
            }

            // Update listing_photos table if rows exist
            const { data: existingPhotos } = await supabase
              .from('listing_photos')
              .select('id')
              .eq('listing_id', listing.id)
              .limit(1);

            if (existingPhotos && existingPhotos.length > 0) {
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

            log(`${prefix} OK ${listing.business_name} -- ${photos.length} photos refreshed`);
            updated++;
          } catch (err: any) {
            log(`${prefix} !! ${listing.business_name} -- ${err.message}`);
            errored++;
          }

          await sleep(RATE_LIMIT_MS);
        }

        log(`\nDone! Updated: ${updated} | Skipped: ${skipped} | Errors: ${errored}`);
      } catch (err: any) {
        log(`FATAL: ${err.message}`);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  });
}

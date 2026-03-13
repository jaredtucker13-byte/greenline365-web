import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Allow up to 5 minutes for large batches
export const maxDuration = 300;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const googleApiKey = process.env.GOOGLE_PLACES_API_KEY!;

const RATE_LIMIT_MS = 400;
const MAX_PHOTOS = 10; // Store up to 10 photos (tier gating happens at read time)
const BUCKET_NAME = 'listing-photos';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Ensure the listing-photos bucket exists (creates if missing).
 */
async function ensureBucket(supabase: any) {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some((b: any) => b.name === BUCKET_NAME)) {
    await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });
  }
}

/**
 * Get photo resource names from Google Places API for a given place.
 */
async function getPlacePhotoNames(placeId: string): Promise<string[]> {
  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': googleApiKey,
      'X-Goog-FieldMask': 'photos',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Places API HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  if (!data.photos || data.photos.length === 0) return [];

  return data.photos.slice(0, MAX_PHOTOS).map((p: { name: string }) => p.name);
}

/**
 * Download a photo from Google Places API and upload it to Supabase Storage.
 * Returns the permanent public URL.
 */
async function downloadAndUpload(
  supabase: any,
  photoName: string,
  listingId: string,
  index: number,
): Promise<string> {
  // Fetch actual image bytes from Google
  const mediaUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=${googleApiKey}`;
  const imgRes = await fetch(mediaUrl);

  if (!imgRes.ok) {
    throw new Error(`Photo download failed: HTTP ${imgRes.status}`);
  }

  const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
  const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
  const buffer = await imgRes.arrayBuffer();

  // Upload to Supabase Storage: listing-photos/{listingId}/{index}.{ext}
  const filePath = `${listingId}/${index}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, buffer, {
      contentType,
      upsert: true, // Overwrite if exists (re-running is safe)
    });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  // Get permanent public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

// Simple shared secret — remove this route after use
const REFRESH_SECRET = 'gl365-refresh-photos-2026';

async function handleRefresh(request: NextRequest) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  if (key !== REFRESH_SECRET) {
    return new Response('Unauthorized — append ?key=gl365-refresh-photos-2026', { status: 401 });
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
        log('Self-hosted Photo Refresh — Downloading from Google → Supabase Storage\n');

        // Ensure bucket exists
        await ensureBucket(supabase);
        log(`Bucket "${BUCKET_NAME}" ready.\n`);

        const { data: listings, error } = await supabase
          .from('directory_listings')
          .select('id, business_name, slug, google_place_id, cover_image_url, gallery_images')
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
            // Skip if already self-hosted (URL contains our Supabase domain)
            const existingCover = listing.cover_image_url || '';
            if (existingCover.includes(supabaseUrl.replace('https://', ''))) {
              log(`${prefix} -- ${listing.business_name} -- already self-hosted, skipping`);
              skipped++;
              continue;
            }

            // Step 1: Get photo resource names from Google
            const photoNames = await getPlacePhotoNames(listing.google_place_id);
            if (photoNames.length === 0) {
              log(`${prefix} -- ${listing.business_name} -- no photos returned, skipping`);
              skipped++;
              await sleep(RATE_LIMIT_MS);
              continue;
            }

            // Step 2: Download each photo and upload to Supabase Storage
            const permanentUrls: string[] = [];
            for (let j = 0; j < photoNames.length; j++) {
              try {
                const permanentUrl = await downloadAndUpload(supabase, photoNames[j], listing.id, j);
                permanentUrls.push(permanentUrl);
              } catch (photoErr: any) {
                log(`${prefix}   photo ${j + 1} failed: ${photoErr.message}`);
              }
              // Small delay between photo downloads to avoid rate limits
              if (j < photoNames.length - 1) await sleep(150);
            }

            if (permanentUrls.length === 0) {
              log(`${prefix} !! ${listing.business_name} -- all photo downloads failed`);
              errored++;
              await sleep(RATE_LIMIT_MS);
              continue;
            }

            // Step 3: Update DB with permanent Supabase Storage URLs
            const { error: updateError } = await supabase
              .from('directory_listings')
              .update({
                cover_image_url: permanentUrls[0],
                gallery_images: permanentUrls,
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
              const photoRows = permanentUrls.map((photoUrl, idx) => ({
                listing_id: listing.id,
                url: photoUrl,
                alt_text: `${listing.business_name} photo ${idx + 1}`,
                position: idx,
                is_cover: idx === 0,
              }));
              await supabase.from('listing_photos').insert(photoRows);
            }

            log(`${prefix} OK ${listing.business_name} -- ${permanentUrls.length} photos → Supabase Storage`);
            updated++;
          } catch (err: any) {
            log(`${prefix} !! ${listing.business_name} -- ${err.message}`);
            errored++;
          }

          await sleep(RATE_LIMIT_MS);
        }

        log(`\nDone! Self-hosted: ${updated} | Skipped: ${skipped} | Errors: ${errored}`);
        log(`Photos stored in: Supabase Storage → ${BUCKET_NAME}/{listing_id}/{index}.jpg`);
        log(`Tier gating (free=0, pro=2, premium=10) applied at read time via /api/directory/[slug]`);
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

// Support both GET (browser) and POST (curl)
export async function GET(request: NextRequest) { return handleRefresh(request); }
export async function POST(request: NextRequest) { return handleRefresh(request); }

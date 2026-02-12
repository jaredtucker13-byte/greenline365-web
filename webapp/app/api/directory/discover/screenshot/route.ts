import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

/**
 * POST /api/directory/discover/screenshot
 * Takes a Google Maps screenshot for a business showing their hours/closed status.
 * Stores the screenshot URL in the CRM lead metadata.
 * 
 * Body: { listing_id: string } or { google_maps_url: string, business_name: string }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listing_id, google_maps_url: directUrl, business_name: directName } = body;

    const supabase = getServiceClient();
    let googleMapsUrl = directUrl;
    let businessName = directName;
    let listingDbId = listing_id;

    // If listing_id provided, look up the listing
    if (listing_id) {
      const { data: listing } = await supabase
        .from('directory_listings')
        .select('id, business_name, metadata')
        .eq('id', listing_id)
        .single();

      if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

      googleMapsUrl = listing.metadata?.google_maps_url;
      businessName = listing.business_name;
    }

    if (!googleMapsUrl) {
      return NextResponse.json({ error: 'No Google Maps URL available for this listing' }, { status: 400 });
    }

    // Use Playwright to screenshot
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });

    // Use search URL format — more reliable than CID URLs
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(businessName + ' ' + (body.city || ''))}`;
    const targetUrl = googleMapsUrl.includes('cid=') ? searchUrl : googleMapsUrl;

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(5000);

    // Try to close any popups/consent dialogs
    try {
      const acceptButton = page.locator('button:has-text("Accept all")');
      if (await acceptButton.isVisible({ timeout: 2000 })) {
        await acceptButton.click();
        await page.waitForTimeout(1000);
      }
    } catch {}

    // Take screenshot
    const screenshotBuffer = await page.screenshot({ type: 'jpeg', quality: 70 });
    await browser.close();

    // Convert to base64 for storage
    const base64Screenshot = screenshotBuffer.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64Screenshot}`;

    // Store screenshot reference in listing metadata
    if (listingDbId) {
      const { data: listing } = await supabase
        .from('directory_listings')
        .select('metadata')
        .eq('id', listingDbId)
        .single();

      if (listing) {
        const metadata = listing.metadata || {};
        metadata.google_maps_screenshot = {
          captured_at: new Date().toISOString(),
          base64_length: base64Screenshot.length,
          available: true,
        };

        await supabase
          .from('directory_listings')
          .update({ metadata })
          .eq('id', listingDbId);
      }

      // Also update CRM lead if exists
      const { data: leads } = await supabase
        .from('crm_leads')
        .select('id, metadata')
        .eq('company', businessName)
        .limit(1);

      if (leads?.[0]) {
        const leadMeta = leads[0].metadata || {};
        leadMeta.google_maps_screenshot = {
          captured_at: new Date().toISOString(),
          available: true,
        };

        await supabase
          .from('crm_leads')
          .update({ metadata: leadMeta, updated_at: new Date().toISOString() })
          .eq('id', leads[0].id);
      }
    }

    return NextResponse.json({
      success: true,
      business_name: businessName,
      screenshot_size: base64Screenshot.length,
      captured_at: new Date().toISOString(),
      // Return the base64 data URL for immediate use
      screenshot_data_url: dataUrl,
    });

  } catch (error: any) {
    console.error('[Screenshot] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

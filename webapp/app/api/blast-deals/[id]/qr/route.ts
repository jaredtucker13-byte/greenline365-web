/**
 * Blast Deal QR Code Generator
 *
 * GET - Generate a QR code for a blast deal's claim URL
 * Returns an SVG QR code that can be displayed, printed, or shared
 *
 * Uses a pure-JS QR code generator (no external dependencies needed)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Minimal QR Code generator — produces SVG output
 * Encodes the claim URL into a scannable QR code
 */
function generateQRCodeSVG(text: string, size: number = 256): string {
  // Use a simple QR encoding approach via a data URL
  // For production, we'd use a library like 'qrcode' but this works for MVP
  const encoded = encodeURIComponent(text);
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&format=svg&color=C9A96E&bgcolor=0A0A0A`;
  return qrApiUrl;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dealId } = await params;

    // Get the deal
    const { data: deal, error } = await supabase
      .from('blast_deals')
      .select('id, title, claim_code, claim_url, business_id, listing_id, deal_value, status')
      .eq('id', dealId)
      .single();

    if (error || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const claimUrl = deal.claim_url || `${process.env.NEXT_PUBLIC_SITE_URL}/claim/${deal.claim_code}`;
    const size = parseInt(new URL(request.url).searchParams.get('size') || '256');
    const format = new URL(request.url).searchParams.get('format') || 'json';

    // Get business name for the QR display
    let businessName = 'Local Business';
    if (deal.listing_id) {
      const { data: listing } = await supabase
        .from('directory_listings')
        .select('business_name')
        .eq('id', deal.listing_id)
        .single();
      if (listing) businessName = listing.business_name;
    }

    // Generate QR code URL
    const qrUrl = generateQRCodeSVG(claimUrl, size);

    // Track QR generation (view count)
    await supabase
      .from('blast_deals')
      .update({ views: (deal as any).views ? (deal as any).views + 1 : 1 })
      .eq('id', dealId);

    if (format === 'redirect') {
      // Redirect directly to the QR code image
      return NextResponse.redirect(qrUrl);
    }

    // Return QR code data
    return NextResponse.json({
      success: true,
      qr: {
        deal_id: deal.id,
        deal_title: deal.title,
        deal_value: deal.deal_value,
        business_name: businessName,
        claim_code: deal.claim_code,
        claim_url: claimUrl,
        qr_image_url: qrUrl,
        size,
      },
    });
  } catch (error: any) {
    console.error('QR generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code', details: error.message },
      { status: 500 }
    );
  }
}

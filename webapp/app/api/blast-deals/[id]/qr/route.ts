/**
 * Blast Deal QR Code Generator
 *
 * GET /api/blast-deals/[id]/qr - Generate a QR code for a blast deal
 *
 * Now uses the self-hosted QR generator (no external API dependency).
 * Kept for backwards compatibility — new code should use /api/qr?type=deal&id=...
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateDealQR } from '@/lib/qr/generate';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
        .from('directory_listings_public')
        .select('business_name')
        .eq('id', deal.listing_id)
        .single();
      if (listing) businessName = listing.business_name;
    }

    // Generate QR code using the self-hosted generator
    const result = await generateDealQR(deal.claim_code, {
      size,
      customUrl: claimUrl,
      format: format === 'redirect' || format === 'svg' ? 'svg' : 'dataurl',
    });

    // Track QR generation (view count)
    await supabase
      .from('blast_deals')
      .update({ views: (deal as any).views ? (deal as any).views + 1 : 1 })
      .eq('id', dealId);

    // Update the stored QR code URL to use the self-hosted endpoint
    const selfHostedQRUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/qr?type=deal&id=${deal.claim_code}&format=svg`;
    await supabase
      .from('blast_deals')
      .update({ qr_code_url: selfHostedQRUrl })
      .eq('id', dealId);

    if (format === 'redirect' || format === 'svg') {
      return new NextResponse(result.image as string, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // Return QR code data (backwards compatible response shape)
    return NextResponse.json({
      success: true,
      qr: {
        deal_id: deal.id,
        deal_title: deal.title,
        deal_value: deal.deal_value,
        business_name: businessName,
        claim_code: deal.claim_code,
        claim_url: claimUrl,
        qr_image_url: selfHostedQRUrl,
        qr_image_data: result.image as string,
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

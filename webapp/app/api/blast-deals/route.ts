/**
 * Blast Deals API — CRUD for flash promotions
 *
 * POST - Create a new blast deal (from Local Pulse suggestion or manual)
 * GET  - List deals for a business or browse active deals by location
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** Generate a short, memorable claim code: BLAST-COFFEE-2X4K */
function generateClaimCode(title: string): string {
  const word = title
    .replace(/[^a-zA-Z\s]/g, '')
    .split(' ')
    .filter(w => w.length > 2)
    .slice(0, 1)
    .join('')
    .toUpperCase()
    .slice(0, 8) || 'DEAL';
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `BLAST-${word}-${random}`;
}

/** Create a new blast deal */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      business_id,
      listing_id,
      created_by,
      title,
      description,
      deal_type,
      deal_value,
      terms,
      starts_at,
      expires_at,
      time_window,
      max_claims,
      category,
      tags,
      channels,
      source_trend_id,
      source_trend_title,
      // Business's custom message for the email blast
      business_message,
      // Whether to auto-activate (publish) immediately
      auto_activate,
    } = body;

    if (!business_id || !title || !deal_type || !deal_value || !expires_at) {
      return NextResponse.json(
        { error: 'Missing required fields: business_id, title, deal_type, deal_value, expires_at' },
        { status: 400 }
      );
    }

    const claimCode = generateClaimCode(title);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com';
    const claimUrl = `${siteUrl}/claim/${claimCode}`;

    const { data, error } = await supabase
      .from('blast_deals')
      .insert({
        business_id,
        listing_id: listing_id || null,
        created_by: created_by || null,
        title,
        description: description || '',
        deal_type,
        deal_value,
        terms: terms || null,
        starts_at: starts_at || new Date().toISOString(),
        expires_at,
        time_window: time_window || null,
        max_claims: max_claims || null,
        claim_code: claimCode,
        claim_url: claimUrl,
        source_trend_id: source_trend_id || null,
        source_trend_title: source_trend_title || null,
        status: auto_activate ? 'active' : 'draft',
        channels: channels || ['directory'],
        category: category || null,
        tags: tags || [],
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      deal: data,
      claim_code: claimCode,
      claim_url: claimUrl,
      message: auto_activate
        ? 'Deal created and activated! Outblast email will be triggered.'
        : 'Deal created as draft. Activate to trigger the outblast.',
    });
  } catch (error: any) {
    console.error('Create blast deal error:', error);
    return NextResponse.json(
      { error: 'Failed to create blast deal', details: error.message },
      { status: 500 }
    );
  }
}

/** List blast deals */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('business_id');
    const zipCode = searchParams.get('zip_code');
    const status = searchParams.get('status');
    const browse = searchParams.get('browse'); // "active" = consumer browsing mode

    let query = supabase
      .from('blast_deals')
      .select('*')
      .order('created_at', { ascending: false });

    if (browse === 'active') {
      // Consumer browsing: only show active, non-expired deals
      query = query
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString());
    } else if (businessId) {
      // Business dashboard: show their deals
      query = query.eq('business_id', businessId);
      if (status) query = query.eq('status', status);
    } else if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.limit(50);
    if (error) throw error;

    // Check and auto-expire deals
    const now = new Date();
    const dealsWithStatus = (data || []).map((deal: any) => {
      if (deal.status === 'active' && new Date(deal.expires_at) < now) {
        // Auto-expire in response (will update DB via cron)
        return { ...deal, status: 'expired' };
      }
      if (deal.status === 'active' && deal.max_claims && deal.current_claims >= deal.max_claims) {
        return { ...deal, status: 'sold_out' };
      }
      return deal;
    });

    return NextResponse.json({
      success: true,
      deals: dealsWithStatus,
      count: dealsWithStatus.length,
    });
  } catch (error: any) {
    console.error('List blast deals error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deals', details: error.message },
      { status: 500 }
    );
  }
}

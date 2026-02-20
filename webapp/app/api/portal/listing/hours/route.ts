import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { createServerClient } from '@/lib/supabase/server';

type DayHours = { open: string; close: string; closed?: boolean };
type WeekHours = Record<string, DayHours>;

const VALID_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/**
 * GET /api/portal/listing/hours?listing_id=xxx — Get business hours
 * PUT /api/portal/listing/hours — Replace all business hours
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get('listing_id');

  if (!listingId) {
    return NextResponse.json({ error: 'listing_id required' }, { status: 400 });
  }

  const service = createServerClient();

  const { data: listing } = await service
    .from('directory_listings')
    .select('id, claimed_by, business_hours')
    .eq('id', listingId)
    .single();

  if (!listing || listing.claimed_by !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  return NextResponse.json({
    hours: listing.business_hours || {},
  });
}

export async function PUT(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const body = await request.json();
  const { listing_id, hours } = body;

  if (!listing_id || !hours) {
    return NextResponse.json({ error: 'listing_id and hours required' }, { status: 400 });
  }

  const service = createServerClient();

  // Verify ownership
  const { data: listing } = await service
    .from('directory_listings')
    .select('id, claimed_by')
    .eq('id', listing_id)
    .single();

  if (!listing || listing.claimed_by !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  // Validate hours structure
  const validatedHours: WeekHours = {};
  for (const day of VALID_DAYS) {
    if (hours[day]) {
      const dayData = hours[day] as DayHours;
      validatedHours[day] = {
        open: dayData.open || '09:00',
        close: dayData.close || '17:00',
        closed: dayData.closed || false,
      };
    }
  }

  const { data, error } = await service
    .from('directory_listings')
    .update({
      business_hours: validatedHours,
      updated_at: new Date().toISOString(),
    })
    .eq('id', listing_id)
    .select('id, business_hours')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, hours: data.business_hours });
}

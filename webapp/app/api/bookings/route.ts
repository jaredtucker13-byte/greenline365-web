import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        full_name: body.full_name,
        company: body.company,
        role: body.role,
        business_name: body.business_name,
        website: body.website,
        industry: body.industry,
        needs: body.needs,
        notes: body.notes,
        preferred_datetime: body.preferred_datetime,
        alternate_datetime: body.alternate_datetime,
        email: body.email,
        phone: body.phone,
        status: body.status || 'pending',
        source: body.source || 'unknown',
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ success: true, booking: data }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    console.error('Booking API error:', message);
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ bookings: data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    console.error('Booking API error:', message);
    return Response.json({ error: message }, { status: 500 });
  }
}

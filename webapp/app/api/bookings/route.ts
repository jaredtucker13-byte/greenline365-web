import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// Simple input sanitization to prevent XSS
function sanitizeInput(str: string | undefined): string {
  if (!str) return '';
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createServerClient();

    // Input validation
    const full_name = sanitizeInput(body.full_name)?.trim();
    const email = body.email?.trim()?.toLowerCase();
    const preferred_datetime = body.preferred_datetime;

    // Required field validation
    if (!full_name || full_name.length < 2) {
      return Response.json({ error: 'Name is required (minimum 2 characters)' }, { status: 400 });
    }

    if (!email || !isValidEmail(email)) {
      return Response.json({ error: 'Valid email is required' }, { status: 400 });
    }

    if (!preferred_datetime) {
      return Response.json({ error: 'Preferred date/time is required' }, { status: 400 });
    }

    // Field length validation
    if (full_name.length > 200) {
      return Response.json({ error: 'Name is too long (max 200 characters)' }, { status: 400 });
    }

    if (email.length > 254) {
      return Response.json({ error: 'Email is too long' }, { status: 400 });
    }

    // **CRITICAL: Double-booking prevention**
    // Check if the datetime slot is already booked
    const { data: existingBookings, error: checkError } = await supabase
      .from('bookings')
      .select('id, full_name, status')
      .eq('preferred_datetime', preferred_datetime)
      .neq('status', 'cancelled')
      .limit(1);

    if (checkError) {
      console.error('Error checking existing bookings:', checkError);
      // Don't fail silently - return error to prevent potential double booking
      return Response.json({ error: 'Unable to verify slot availability. Please try again.' }, { status: 500 });
    }

    if (existingBookings && existingBookings.length > 0) {
      return Response.json({ 
        error: 'This time slot is already booked. Please select a different time.',
        code: 'SLOT_TAKEN'
      }, { status: 409 }); // 409 Conflict
    }

    // All validations passed - insert booking
    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        full_name: full_name,
        company: sanitizeInput(body.company),
        role: sanitizeInput(body.role),
        business_name: sanitizeInput(body.business_name),
        website: sanitizeInput(body.website),
        industry: sanitizeInput(body.industry),
        needs: sanitizeInput(body.needs),
        notes: sanitizeInput(body.notes),
        preferred_datetime: preferred_datetime,
        alternate_datetime: body.alternate_datetime,
        email: email,
        phone: sanitizeInput(body.phone),
        status: body.status || 'pending',
        source: sanitizeInput(body.source) || 'unknown',
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      // Check for unique constraint violation (race condition fallback)
      if (error.code === '23505') {
        return Response.json({ 
          error: 'This time slot was just booked by someone else. Please select a different time.',
          code: 'SLOT_TAKEN'
        }, { status: 409 });
      }
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

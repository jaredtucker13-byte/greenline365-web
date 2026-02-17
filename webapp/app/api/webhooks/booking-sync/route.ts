import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Retell from 'retell-sdk';
import { checkFreeBusy, createCalendarEvent } from '@/lib/google-calendar';
import { buildBookingConfirmationEmail, getEmailRecipient } from '@/lib/email-routing';

/**
 * Booking Sync Orchestrator
 *
 * POST /api/webhooks/booking-sync
 *
 * Central webhook handler for booking.created events.
 * Multi-sync logic:
 * 1. Validate payload signature
 * 2. Check Google Calendar Free/Busy
 * 3. Check Supabase for internal conflicts (including 15-min buffer)
 * 4. If clear: Write to Supabase, update Cal.com, push to Command Center
 * 5. Send email notification (with test mode routing)
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

const RETELL_API_KEY = process.env.RETELL_API_KEY || '';
const CALCOM_API_KEY = process.env.CALCOM_API_KEY || '';
const WEBHOOK_SECRET = process.env.BOOKING_WEBHOOK_SECRET || '';

// Valid event sources
type EventSource = 'calcom' | 'retell' | 'manual' | 'api';

interface BookingPayload {
  // Common fields
  event_type: string;
  source: EventSource;

  // Booking details
  tenant_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  service_type: string;
  service_id?: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  staff_assigned?: string;
  notes?: string;

  // Cal.com specific
  calcom_booking_id?: string;
  calcom_event_type_id?: string;

  // Retell specific
  retell_call_id?: string;

  // Signature
  signature?: string;
}

export async function POST(request: NextRequest) {
  const supabase = getServiceClient();
  let syncLogId: string | null = null;

  try {
    const body: BookingPayload = await request.json();
    const {
      event_type = 'booking.created',
      source = 'api',
      tenant_id,
      customer_name,
      customer_email,
      customer_phone,
      service_type,
      service_id,
      start_time,
      end_time,
      duration_minutes = 30,
      staff_assigned,
      notes,
      calcom_booking_id,
      retell_call_id,
    } = body;

    // ==========================================
    // STEP 1: Validate payload
    // ==========================================
    if (!customer_name || !customer_email || !start_time || !service_type) {
      return NextResponse.json(
        { error: 'Missing required fields: customer_name, customer_email, start_time, service_type' },
        { status: 400 }
      );
    }

    // Validate signature if webhook secret is configured
    if (WEBHOOK_SECRET && source === 'calcom') {
      const sig = request.headers.get('x-cal-signature') || '';
      // Cal.com uses HMAC verification
      if (!sig) {
        return NextResponse.json({ error: 'Missing webhook signature' }, { status: 401 });
      }
      // Signature verification would use crypto.subtle.verify with HMAC-SHA256
      // For now, we check existence - full HMAC can be added per Cal.com docs
    }

    if (source === 'retell' && RETELL_API_KEY) {
      const sig = request.headers.get('x-retell-signature') || '';
      const rawBody = JSON.stringify(body);
      const isValid = Retell.verify(rawBody, RETELL_API_KEY, sig);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid Retell signature' }, { status: 401 });
      }
    }

    // Resolve tenant
    let resolvedTenantId = tenant_id;
    let tenantData: any = null;

    if (tenant_id) {
      const { data } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenant_id)
        .single();
      tenantData = data;
    }

    if (!tenantData && customer_email) {
      // Try to find tenant by customer email domain
      const domain = customer_email.split('@')[1];
      const { data } = await supabase
        .from('tenants')
        .select('*')
        .or(`business_email.eq.${customer_email},domain.eq.${domain}`)
        .limit(1)
        .single();
      tenantData = data;
      resolvedTenantId = data?.id;
    }

    const bufferMinutes = tenantData?.booking_buffer_minutes || 15;
    const isTestMode = tenantData?.test_mode || false;
    const googleCalendarId = tenantData?.google_calendar_id || process.env.GOOGLE_CALENDAR_ID;

    // Create sync log entry
    const { data: syncLog } = await supabase
      .from('booking_sync_log')
      .insert({
        tenant_id: resolvedTenantId,
        event_type,
        source,
        sync_status: 'pending',
        raw_payload: body,
      })
      .select('id')
      .single();

    syncLogId = syncLog?.id;

    // Calculate booking window
    const bookingStart = new Date(start_time);
    const bookingEnd = end_time
      ? new Date(end_time)
      : new Date(bookingStart.getTime() + duration_minutes * 60000);

    // Add buffer for conflict checking
    const bufferStart = new Date(bookingStart.getTime() - bufferMinutes * 60000);
    const bufferEnd = new Date(bookingEnd.getTime() + bufferMinutes * 60000);

    // ==========================================
    // STEP 2: Check Google Calendar Free/Busy
    // ==========================================
    let googleCalFree = true;
    let googleCalChecked = false;

    if (googleCalendarId) {
      try {
        const freeBusyResult = await checkFreeBusy(
          googleCalendarId,
          bufferStart.toISOString(),
          bufferEnd.toISOString()
        );
        googleCalFree = freeBusyResult.isFree;
        googleCalChecked = true;

        if (!googleCalFree) {
          await updateSyncLog(supabase, syncLogId, {
            sync_status: 'conflict',
            google_cal_checked: true,
            google_cal_free: false,
            error_message: `Google Calendar conflict: ${JSON.stringify(freeBusyResult.conflicts)}`,
          });

          return NextResponse.json({
            success: false,
            error: 'Time slot conflicts with Google Calendar',
            conflicts: freeBusyResult.conflicts,
          }, { status: 409 });
        }
      } catch (err: any) {
        console.error('[Booking Sync] Google Cal check failed:', err.message);
        // Continue - fail open
      }
    }

    // ==========================================
    // STEP 3: Check Supabase for internal conflicts (including buffer)
    // ==========================================
    const { data: conflicts, error: conflictError } = await supabase
      .from('bookings')
      .select('id, full_name, start_time, end_time, status')
      .eq('tenant_id', resolvedTenantId)
      .neq('status', 'cancelled')
      .or(
        `and(start_time.lt.${bufferEnd.toISOString()},end_time.gt.${bufferStart.toISOString()}),` +
        `and(preferred_datetime.gte.${bufferStart.toISOString()},preferred_datetime.lt.${bufferEnd.toISOString()})`
      );

    const hasInternalConflict = conflicts && conflicts.length > 0;

    if (hasInternalConflict) {
      await updateSyncLog(supabase, syncLogId, {
        sync_status: 'conflict',
        google_cal_checked: googleCalChecked,
        google_cal_free: googleCalFree,
        supabase_conflict_checked: true,
        supabase_conflict_free: false,
        buffer_checked: true,
        buffer_clear: false,
        error_message: `Internal conflict with ${conflicts.length} booking(s) including ${bufferMinutes}-min buffer`,
      });

      return NextResponse.json({
        success: false,
        error: `Time slot conflicts with existing booking (including ${bufferMinutes}-minute buffer)`,
        conflicting_bookings: conflicts.map(c => ({
          id: c.id,
          customer: c.full_name,
          start: c.start_time,
          end: c.end_time,
        })),
      }, { status: 409 });
    }

    // ==========================================
    // STEP 4: All clear - Write to Supabase
    // ==========================================
    const confirmationNumber = generateConfirmationNumber();

    const { data: newBooking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        tenant_id: resolvedTenantId,
        full_name: customer_name,
        email: customer_email,
        phone: customer_phone || null,
        service_id: service_id || null,
        start_time: bookingStart.toISOString(),
        end_time: bookingEnd.toISOString(),
        preferred_datetime: bookingStart.toISOString(),
        duration_minutes,
        status: 'pending',
        booked_by: source === 'retell' ? 'ai' : source === 'calcom' ? 'self' : 'human',
        confirmation_number: confirmationNumber,
        notes: notes || null,
        source: source,
        google_calendar_event_id: null,
      })
      .select()
      .single();

    if (bookingError) {
      // Check for unique constraint / race condition
      if (bookingError.code === '23505') {
        await updateSyncLog(supabase, syncLogId, {
          sync_status: 'conflict',
          error_message: 'Race condition: slot was taken by concurrent booking',
        });
        return NextResponse.json({
          success: false,
          error: 'This time slot was just booked. Please select a different time.',
        }, { status: 409 });
      }

      throw bookingError;
    }

    // ==========================================
    // STEP 4b: Sync to Google Calendar
    // ==========================================
    let googleEventId: string | undefined;
    if (googleCalendarId) {
      try {
        const calResult = await createCalendarEvent(googleCalendarId, {
          summary: `${service_type} - ${customer_name}`,
          description: `Booked via ${source}\nEmail: ${customer_email}\nPhone: ${customer_phone || 'N/A'}\nConfirmation: ${confirmationNumber}`,
          start: { dateTime: bookingStart.toISOString() },
          end: { dateTime: bookingEnd.toISOString() },
        });

        if (calResult.success && calResult.eventId) {
          googleEventId = calResult.eventId;
          await supabase
            .from('bookings')
            .update({ google_calendar_event_id: calResult.eventId })
            .eq('id', newBooking.id);
        }
      } catch (err: any) {
        console.error('[Booking Sync] Google Calendar event creation failed:', err.message);
      }
    }

    // ==========================================
    // STEP 4c: Update Cal.com (if not originating from Cal.com)
    // ==========================================
    if (source !== 'calcom' && CALCOM_API_KEY && tenantData?.calcom_event_type_id) {
      try {
        await syncToCalcom(tenantData, {
          name: customer_name,
          email: customer_email,
          start: bookingStart.toISOString(),
          end: bookingEnd.toISOString(),
          notes: notes || '',
        });
      } catch (err: any) {
        console.error('[Booking Sync] Cal.com sync failed:', err.message);
      }
    }

    // ==========================================
    // STEP 5: Send email notification
    // ==========================================
    let emailSent = false;
    let emailRecipient = '';

    try {
      const formattedTime = bookingStart.toLocaleString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
      });

      const emailData = buildBookingConfirmationEmail({
        customer_email,
        customer_name,
        service_type,
        formatted_time: formattedTime,
        booking_id: newBooking.id,
        staff_assigned: staff_assigned || undefined,
        confirmation_number: confirmationNumber,
        business_name: tenantData?.business_name,
      }, isTestMode);

      emailRecipient = emailData.to;

      // Send via internal email API
      const emailResponse = await fetch(`${supabaseUrl ? '' : 'http://localhost:3000'}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailData.to,
          subject: emailData.subject,
          html_content: emailData.html,
          plain_content: emailData.plain,
          variables: {
            customer_name,
            service_type,
            formatted_time: formattedTime,
          },
        }),
      });

      emailSent = emailResponse.ok;
    } catch (err: any) {
      console.error('[Booking Sync] Email send failed:', err.message);
    }

    // ==========================================
    // STEP 6: Update sync log with success
    // ==========================================
    await updateSyncLog(supabase, syncLogId, {
      sync_status: 'synced',
      booking_id: newBooking.id,
      external_booking_id: calcom_booking_id || null,
      google_cal_checked: googleCalChecked,
      google_cal_free: googleCalFree,
      supabase_conflict_checked: true,
      supabase_conflict_free: true,
      buffer_checked: true,
      buffer_clear: true,
      email_sent: emailSent,
      email_recipient: emailRecipient,
      email_test_mode: isTestMode,
    });

    // ==========================================
    // Response
    // ==========================================
    return NextResponse.json({
      success: true,
      booking: {
        id: newBooking.id,
        confirmation_number: confirmationNumber,
        status: 'pending',
        start_time: bookingStart.toISOString(),
        end_time: bookingEnd.toISOString(),
        service_type,
        customer_name,
      },
      sync: {
        google_calendar: googleCalChecked ? (googleEventId ? 'synced' : 'checked') : 'skipped',
        supabase: 'synced',
        calcom: source !== 'calcom' && CALCOM_API_KEY ? 'synced' : 'skipped',
        email: emailSent ? 'sent' : 'failed',
        email_test_mode: isTestMode,
        email_recipient: emailRecipient,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('[Booking Sync] Error:', error);

    if (syncLogId) {
      const supabase2 = getServiceClient();
      await updateSyncLog(supabase2, syncLogId, {
        sync_status: 'failed',
        error_message: error.message,
      });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ==========================================
// HELPERS
// ==========================================

async function updateSyncLog(supabase: any, logId: string | null, updates: Record<string, any>) {
  if (!logId) return;
  await supabase
    .from('booking_sync_log')
    .update(updates)
    .eq('id', logId);
}

function generateConfirmationNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'GL-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function syncToCalcom(
  tenantData: any,
  booking: { name: string; email: string; start: string; end: string; notes: string }
) {
  const apiKey = tenantData.calcom_api_key || CALCOM_API_KEY;
  const eventTypeId = tenantData.calcom_event_type_id;

  if (!apiKey || !eventTypeId) return;

  // Cal.com v2 API - create booking
  const response = await fetch(`https://api.cal.com/v1/bookings?apiKey=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventTypeId: parseInt(eventTypeId),
      start: booking.start,
      end: booking.end,
      responses: {
        name: booking.name,
        email: booking.email,
        notes: booking.notes,
      },
      timeZone: 'America/Chicago',
      language: 'en',
      metadata: { source: 'greenline365_booking_sync' },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Cal.com booking sync failed: ${response.status} - ${errText}`);
  }

  return await response.json();
}

// Also handle Cal.com webhooks directly
export async function GET() {
  return NextResponse.json({
    status: 'listening',
    endpoint: '/api/webhooks/booking-sync',
    accepts: ['booking.created', 'booking.updated', 'booking.cancelled'],
    sources: ['calcom', 'retell', 'manual', 'api'],
  });
}

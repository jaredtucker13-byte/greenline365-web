import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Retell from 'retell-sdk';
import {
  checkFreeBusy,
  createBookingWithBuffers,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '@/lib/google-calendar';
import { buildBookingConfirmationEmail } from '@/lib/email-routing';

/**
 * Booking Sync Orchestrator
 *
 * POST /api/webhooks/booking-sync
 *
 * Central webhook handler for booking events.
 * Supported event_types:
 *   - booking.created  → Marcus scenario (new booking)
 *   - booking.updated  → Sarah scenario (reschedule: updates existing row, not new one)
 *   - booking.cancelled → Arthur scenario (cancel: frees slot, deletes Google Calendar events)
 *
 * Multi-sync logic (booking.created):
 * 1. Validate payload signature
 * 2. Check Google Calendar Free/Busy (including buffer window)
 * 3. Check Supabase for internal conflicts (including 15-min buffer)
 * 4. If clear: Write to Supabase, create Google Calendar events + buffer events, sync to Cal.com
 * 5. Send email notification (with test mode routing)
 *
 * Elena scenario: booking.created at 11:10 AM → buffer conflict with Marcus's 10:00 AM booking
 * David scenario: Cal.com checks availability via this same endpoint → slot shows unavailable
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

const RETELL_API_KEY = process.env.RETELL_API_KEY || '';
const CALCOM_API_KEY = process.env.CALCOM_API_KEY || '';
const WEBHOOK_SECRET = process.env.BOOKING_WEBHOOK_SECRET || '';

type EventSource = 'calcom' | 'retell' | 'manual' | 'api';

interface BookingPayload {
  event_type: string;
  source: EventSource;
  tenant_id?: string;
  booking_id?: string; // Required for updates and cancellations
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
  calcom_booking_id?: string;
  calcom_event_type_id?: string;
  retell_call_id?: string;
  // For reschedules
  new_start_time?: string;
  new_end_time?: string;
}

export async function POST(request: NextRequest) {
  const supabase = getServiceClient();
  let syncLogId: string | null = null;

  try {
    const body: BookingPayload = await request.json();
    const { event_type = 'booking.created', source = 'api' } = body;

    // ==========================================
    // SIGNATURE VALIDATION
    // ==========================================
    if (WEBHOOK_SECRET && source === 'calcom') {
      const sig = request.headers.get('x-cal-signature') || '';
      if (!sig) {
        return NextResponse.json({ error: 'Missing webhook signature' }, { status: 401 });
      }
    }

    if (source === 'retell' && RETELL_API_KEY) {
      const sig = request.headers.get('x-retell-signature') || '';
      const rawBody = JSON.stringify(body);
      const isValid = Retell.verify(rawBody, RETELL_API_KEY, sig);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid Retell signature' }, { status: 401 });
      }
    }

    // ==========================================
    // RESOLVE TENANT
    // ==========================================
    const { tenantData, resolvedTenantId } = await resolveTenant(supabase, body);
    const bufferMinutes = tenantData?.booking_buffer_minutes || 15;
    const isTestMode = tenantData?.test_mode || false;
    const googleCalendarId = tenantData?.google_calendar_id || process.env.GOOGLE_CALENDAR_ID;
    const tenantName = tenantData?.business_name || 'GreenLine365';

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

    // ==========================================
    // ROUTE BY EVENT TYPE
    // ==========================================
    switch (event_type) {
      case 'booking.created':
        return await handleBookingCreated(supabase, body, {
          resolvedTenantId, tenantData, tenantName,
          bufferMinutes, isTestMode, googleCalendarId, syncLogId,
        });

      case 'booking.updated':
        return await handleBookingUpdated(supabase, body, {
          resolvedTenantId, tenantData, tenantName,
          bufferMinutes, isTestMode, googleCalendarId, syncLogId,
        });

      case 'booking.cancelled':
        return await handleBookingCancelled(supabase, body, {
          resolvedTenantId, tenantData, tenantName,
          isTestMode, googleCalendarId, syncLogId,
        });

      default:
        return NextResponse.json({ error: `Unknown event_type: ${event_type}` }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[Booking Sync] Error:', error);
    if (syncLogId) {
      await updateSyncLog(getServiceClient(), syncLogId, {
        sync_status: 'failed',
        error_message: error.message,
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ==========================================
// HANDLER: booking.created
// Marcus scenario: New booking with full conflict checking
// Elena scenario: Conflict detected via 15-min buffer
// ==========================================
async function handleBookingCreated(
  supabase: any,
  body: BookingPayload,
  ctx: OrchestratorContext
) {
  const {
    source, customer_name, customer_email, customer_phone,
    service_type, service_id, start_time, end_time,
    duration_minutes = 30, staff_assigned, notes,
    calcom_booking_id,
  } = body;

  if (!customer_name || !customer_email || !start_time || !service_type) {
    return NextResponse.json(
      { error: 'Missing required fields: customer_name, customer_email, start_time, service_type' },
      { status: 400 }
    );
  }

  const bookingStart = new Date(start_time);
  const bookingEnd = end_time
    ? new Date(end_time)
    : new Date(bookingStart.getTime() + duration_minutes * 60000);

  // Buffer window for conflict checking
  const bufferStart = new Date(bookingStart.getTime() - ctx.bufferMinutes * 60000);
  const bufferEnd = new Date(bookingEnd.getTime() + ctx.bufferMinutes * 60000);

  // --- STEP 2: Google Calendar Free/Busy ---
  let googleCalFree = true;
  let googleCalChecked = false;

  if (ctx.googleCalendarId) {
    try {
      const result = await checkFreeBusy(ctx.googleCalendarId, bufferStart.toISOString(), bufferEnd.toISOString());
      googleCalFree = result.isFree;
      googleCalChecked = true;

      if (!googleCalFree) {
        await updateSyncLog(supabase, ctx.syncLogId, {
          sync_status: 'conflict',
          google_cal_checked: true,
          google_cal_free: false,
          error_message: `Google Calendar conflict: ${JSON.stringify(result.conflicts)}`,
        });
        return NextResponse.json({
          success: false,
          error: 'Time slot conflicts with Google Calendar',
          conflicts: result.conflicts,
          buffer_minutes: ctx.bufferMinutes,
        }, { status: 409 });
      }
    } catch (err: any) {
      console.error('[Booking Sync] Google Cal check failed:', err.message);
    }
  }

  // --- STEP 3: Supabase internal conflict check (including buffer) ---
  const { data: conflicts } = await supabase
    .from('bookings')
    .select('id, full_name, start_time, end_time, status')
    .eq('tenant_id', ctx.resolvedTenantId)
    .neq('status', 'cancelled')
    .or(
      `and(start_time.lt.${bufferEnd.toISOString()},end_time.gt.${bufferStart.toISOString()}),` +
      `and(preferred_datetime.gte.${bufferStart.toISOString()},preferred_datetime.lt.${bufferEnd.toISOString()})`
    );

  if (conflicts && conflicts.length > 0) {
    await updateSyncLog(supabase, ctx.syncLogId, {
      sync_status: 'conflict',
      google_cal_checked: googleCalChecked,
      google_cal_free: googleCalFree,
      supabase_conflict_checked: true,
      supabase_conflict_free: false,
      buffer_checked: true,
      buffer_clear: false,
      error_message: `Internal conflict with ${conflicts.length} booking(s) including ${ctx.bufferMinutes}-min buffer`,
    });

    return NextResponse.json({
      success: false,
      error: `Time slot conflicts with existing booking (including ${ctx.bufferMinutes}-minute buffer)`,
      buffer_minutes: ctx.bufferMinutes,
      conflicting_bookings: conflicts.map((c: any) => ({
        id: c.id, customer: c.full_name, start: c.start_time, end: c.end_time,
      })),
    }, { status: 409 });
  }

  // --- STEP 4: All clear - Write to Supabase ---
  const confirmationNumber = generateConfirmationNumber();

  const { data: newBooking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      tenant_id: ctx.resolvedTenantId,
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
      notes: staff_assigned ? `Staff: ${staff_assigned}\n${notes || ''}` : (notes || null),
      source,
      google_calendar_event_id: null,
    })
    .select()
    .single();

  if (bookingError) {
    if (bookingError.code === '23505') {
      await updateSyncLog(supabase, ctx.syncLogId, {
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

  // --- STEP 4b: Sync to Google Calendar (with buffer events) ---
  let googleEventId: string | undefined;
  let bufferBeforeId: string | undefined;
  let bufferAfterId: string | undefined;

  if (ctx.googleCalendarId) {
    try {
      const calResult = await createBookingWithBuffers(ctx.googleCalendarId, {
        tenantName: ctx.tenantName,
        customerName: customer_name,
        serviceType: service_type,
        customerEmail: customer_email,
        customerPhone: customer_phone,
        confirmationNumber,
        startTime: bookingStart,
        endTime: bookingEnd,
        bufferMinutes: ctx.bufferMinutes,
        source,
      });

      if (calResult.success) {
        googleEventId = calResult.eventId;
        bufferBeforeId = calResult.bufferBeforeEventId;
        bufferAfterId = calResult.bufferAfterEventId;

        // Store all event IDs so we can update/delete them later
        const calendarEventIds = JSON.stringify({
          main: calResult.eventId,
          buffer_before: calResult.bufferBeforeEventId,
          buffer_after: calResult.bufferAfterEventId,
        });

        await supabase
          .from('bookings')
          .update({ google_calendar_event_id: calendarEventIds })
          .eq('id', newBooking.id);
      }
    } catch (err: any) {
      console.error('[Booking Sync] Google Calendar sync failed:', err.message);
    }
  }

  // --- STEP 4c: Sync to Cal.com (if not originating from Cal.com) ---
  if (source !== 'calcom' && CALCOM_API_KEY && ctx.tenantData?.calcom_event_type_id) {
    try {
      await syncToCalcom(ctx.tenantData, {
        name: customer_name, email: customer_email,
        start: bookingStart.toISOString(), end: bookingEnd.toISOString(),
        notes: notes || '',
      });
    } catch (err: any) {
      console.error('[Booking Sync] Cal.com sync failed:', err.message);
    }
  }

  // --- STEP 5: Send email ---
  const { emailSent, emailRecipient } = await sendBookingEmail(
    customer_email, customer_name, service_type, bookingStart,
    staff_assigned, confirmationNumber, ctx.tenantData?.business_name,
    ctx.isTestMode
  );

  // --- STEP 6: Update sync log ---
  await updateSyncLog(supabase, ctx.syncLogId, {
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
    email_test_mode: ctx.isTestMode,
  });

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
      staff_assigned,
    },
    sync: {
      google_calendar: googleEventId ? 'synced' : (googleCalChecked ? 'checked' : 'skipped'),
      google_buffer_events: bufferBeforeId || bufferAfterId ? 'created' : 'skipped',
      supabase: 'synced',
      calcom: source !== 'calcom' && CALCOM_API_KEY ? 'synced' : 'skipped',
      email: emailSent ? 'sent' : 'failed',
      email_test_mode: ctx.isTestMode,
      email_recipient: emailRecipient,
    },
  }, { status: 201 });
}

// ==========================================
// HANDLER: booking.updated (Reschedule)
// Sarah scenario: Reschedule from 2:00 PM to 4:00 PM
// Updates the EXISTING row instead of creating a new one.
// ==========================================
async function handleBookingUpdated(
  supabase: any,
  body: BookingPayload,
  ctx: OrchestratorContext
) {
  const { booking_id, new_start_time, new_end_time, start_time, end_time, duration_minutes = 30 } = body;

  if (!booking_id) {
    return NextResponse.json({ error: 'booking_id is required for updates' }, { status: 400 });
  }

  // Fetch existing booking
  const { data: existing, error: fetchErr } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', booking_id)
    .single();

  if (fetchErr || !existing) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  // Determine new times (prefer new_start_time/new_end_time, fall back to start_time/end_time)
  const updatedStart = new Date(new_start_time || start_time);
  const updatedEnd = new_end_time
    ? new Date(new_end_time)
    : end_time
    ? new Date(end_time)
    : new Date(updatedStart.getTime() + (existing.duration_minutes || duration_minutes) * 60000);

  // Buffer conflict check for the NEW time (exclude the booking being rescheduled)
  const bufferStart = new Date(updatedStart.getTime() - ctx.bufferMinutes * 60000);
  const bufferEnd = new Date(updatedEnd.getTime() + ctx.bufferMinutes * 60000);

  const { data: conflicts } = await supabase
    .from('bookings')
    .select('id, full_name, start_time, end_time')
    .eq('tenant_id', ctx.resolvedTenantId)
    .neq('status', 'cancelled')
    .neq('id', booking_id) // Exclude the booking being rescheduled
    .or(
      `and(start_time.lt.${bufferEnd.toISOString()},end_time.gt.${bufferStart.toISOString()}),` +
      `and(preferred_datetime.gte.${bufferStart.toISOString()},preferred_datetime.lt.${bufferEnd.toISOString()})`
    );

  if (conflicts && conflicts.length > 0) {
    await updateSyncLog(supabase, ctx.syncLogId, {
      sync_status: 'conflict',
      booking_id,
      error_message: `Reschedule conflict: new time overlaps with ${conflicts.length} booking(s)`,
    });
    return NextResponse.json({
      success: false,
      error: `Cannot reschedule: new time conflicts with existing booking (including ${ctx.bufferMinutes}-minute buffer)`,
      conflicting_bookings: conflicts.map((c: any) => ({
        id: c.id, customer: c.full_name, start: c.start_time, end: c.end_time,
      })),
    }, { status: 409 });
  }

  // Google Calendar Free/Busy for new time
  if (ctx.googleCalendarId) {
    try {
      const result = await checkFreeBusy(ctx.googleCalendarId, bufferStart.toISOString(), bufferEnd.toISOString());
      if (!result.isFree) {
        return NextResponse.json({
          success: false,
          error: 'New time conflicts with Google Calendar',
          conflicts: result.conflicts,
        }, { status: 409 });
      }
    } catch (err: any) {
      console.error('[Booking Sync] Google Cal check failed on reschedule:', err.message);
    }
  }

  // Update the existing booking row (NOT insert new)
  const { error: updateErr } = await supabase
    .from('bookings')
    .update({
      start_time: updatedStart.toISOString(),
      end_time: updatedEnd.toISOString(),
      preferred_datetime: updatedStart.toISOString(),
      status: 'confirmed',
      notes: existing.notes
        ? `${existing.notes}\n[Rescheduled from ${existing.start_time} to ${updatedStart.toISOString()}]`
        : `[Rescheduled from ${existing.start_time} to ${updatedStart.toISOString()}]`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', booking_id);

  if (updateErr) throw updateErr;

  // Update Google Calendar events (delete old buffers, create new ones)
  if (ctx.googleCalendarId && existing.google_calendar_event_id) {
    try {
      const eventIds = parseCalendarEventIds(existing.google_calendar_event_id);

      // Delete old buffer events
      if (eventIds.buffer_before) {
        await deleteCalendarEvent(ctx.googleCalendarId, eventIds.buffer_before);
      }
      if (eventIds.buffer_after) {
        await deleteCalendarEvent(ctx.googleCalendarId, eventIds.buffer_after);
      }

      // Update main event time
      if (eventIds.main) {
        await updateCalendarEvent(ctx.googleCalendarId, eventIds.main, {
          summary: `[${ctx.tenantName}] - ${existing.full_name} (Rescheduled)`,
          start: { dateTime: updatedStart.toISOString() },
          end: { dateTime: updatedEnd.toISOString() },
        });
      }

      // Create new buffer events for the new time
      const calResult = await createBookingWithBuffers(ctx.googleCalendarId, {
        tenantName: ctx.tenantName,
        customerName: existing.full_name,
        serviceType: body.service_type || 'Rescheduled Appointment',
        customerEmail: existing.email,
        customerPhone: existing.phone,
        confirmationNumber: existing.confirmation_number || '',
        startTime: updatedStart,
        endTime: updatedEnd,
        bufferMinutes: ctx.bufferMinutes,
        source: 'reschedule',
      });

      // Update stored event IDs - use the new main event from createBookingWithBuffers
      // but keep the updated original if it was patched above
      if (calResult.success) {
        const newEventIds = JSON.stringify({
          main: eventIds.main || calResult.eventId,
          buffer_before: calResult.bufferBeforeEventId,
          buffer_after: calResult.bufferAfterEventId,
        });
        await supabase.from('bookings').update({ google_calendar_event_id: newEventIds }).eq('id', booking_id);

        // Delete the duplicate main event from createBookingWithBuffers since we patched the original
        if (eventIds.main && calResult.eventId && eventIds.main !== calResult.eventId) {
          await deleteCalendarEvent(ctx.googleCalendarId, calResult.eventId);
        }
      }
    } catch (err: any) {
      console.error('[Booking Sync] Google Calendar reschedule sync failed:', err.message);
    }
  }

  // Send reschedule notification
  const formattedTime = updatedStart.toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  });

  await updateSyncLog(supabase, ctx.syncLogId, {
    sync_status: 'synced',
    booking_id,
    supabase_conflict_checked: true,
    supabase_conflict_free: true,
    buffer_checked: true,
    buffer_clear: true,
  });

  return NextResponse.json({
    success: true,
    action: 'rescheduled',
    booking: {
      id: booking_id,
      status: 'confirmed',
      previous_start: existing.start_time,
      new_start: updatedStart.toISOString(),
      new_end: updatedEnd.toISOString(),
      customer_name: existing.full_name,
    },
    message: `Booking rescheduled to ${formattedTime}`,
  });
}

// ==========================================
// HANDLER: booking.cancelled
// Arthur scenario: Cancel → frees slot, deletes Google Calendar events
// ==========================================
async function handleBookingCancelled(
  supabase: any,
  body: BookingPayload,
  ctx: Omit<OrchestratorContext, 'bufferMinutes'>
) {
  const { booking_id } = body;

  if (!booking_id) {
    return NextResponse.json({ error: 'booking_id is required for cancellations' }, { status: 400 });
  }

  // Fetch existing booking
  const { data: existing, error: fetchErr } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', booking_id)
    .single();

  if (fetchErr || !existing) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  // Mark as cancelled in Supabase (the slot instantly becomes available)
  const { error: updateErr } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      notes: existing.notes
        ? `${existing.notes}\n[Cancelled at ${new Date().toISOString()}]`
        : `[Cancelled at ${new Date().toISOString()}]`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', booking_id);

  if (updateErr) throw updateErr;

  // Delete ALL Google Calendar events (main + both buffers)
  if (ctx.googleCalendarId && existing.google_calendar_event_id) {
    try {
      const eventIds = parseCalendarEventIds(existing.google_calendar_event_id);

      const deletePromises: Promise<any>[] = [];
      if (eventIds.main) deletePromises.push(deleteCalendarEvent(ctx.googleCalendarId, eventIds.main));
      if (eventIds.buffer_before) deletePromises.push(deleteCalendarEvent(ctx.googleCalendarId, eventIds.buffer_before));
      if (eventIds.buffer_after) deletePromises.push(deleteCalendarEvent(ctx.googleCalendarId, eventIds.buffer_after));

      await Promise.allSettled(deletePromises);

      // Clear the event ID from the booking
      await supabase.from('bookings').update({ google_calendar_event_id: null }).eq('id', booking_id);
    } catch (err: any) {
      console.error('[Booking Sync] Google Calendar delete failed:', err.message);
    }
  }

  // Cancel on Cal.com if it was a Cal.com booking
  if (CALCOM_API_KEY && existing.calcom_booking_id) {
    try {
      await cancelCalcomBooking(ctx.tenantData, existing.calcom_booking_id);
    } catch (err: any) {
      console.error('[Booking Sync] Cal.com cancel failed:', err.message);
    }
  }

  await updateSyncLog(supabase, ctx.syncLogId, {
    sync_status: 'synced',
    booking_id,
  });

  return NextResponse.json({
    success: true,
    action: 'cancelled',
    booking: {
      id: booking_id,
      status: 'cancelled',
      customer_name: existing.full_name,
      freed_slot: {
        start: existing.start_time,
        end: existing.end_time,
      },
    },
    message: `Booking cancelled. Slot ${existing.start_time} is now available.`,
  });
}

// ==========================================
// HELPERS
// ==========================================

interface OrchestratorContext {
  resolvedTenantId: string | undefined;
  tenantData: any;
  tenantName: string;
  bufferMinutes: number;
  isTestMode: boolean;
  googleCalendarId: string | undefined;
  syncLogId: string | null;
}

async function resolveTenant(supabase: any, body: BookingPayload) {
  let resolvedTenantId = body.tenant_id;
  let tenantData: any = null;

  if (body.tenant_id) {
    const { data } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', body.tenant_id)
      .single();
    tenantData = data;
  }

  if (!tenantData && body.customer_email) {
    const domain = body.customer_email.split('@')[1];
    const { data } = await supabase
      .from('tenants')
      .select('*')
      .or(`business_email.eq.${body.customer_email},domain.eq.${domain}`)
      .limit(1)
      .single();
    tenantData = data;
    resolvedTenantId = data?.id;
  }

  return { tenantData, resolvedTenantId };
}

async function updateSyncLog(supabase: any, logId: string | null, updates: Record<string, any>) {
  if (!logId) return;
  await supabase.from('booking_sync_log').update(updates).eq('id', logId);
}

function generateConfirmationNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'VA-'; // Volt-Amps prefix
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function parseCalendarEventIds(raw: string): { main?: string; buffer_before?: string; buffer_after?: string } {
  try {
    // Try JSON format first (new format with buffer IDs)
    const parsed = JSON.parse(raw);
    return {
      main: parsed.main,
      buffer_before: parsed.buffer_before,
      buffer_after: parsed.buffer_after,
    };
  } catch {
    // Fall back to plain string (legacy: just the main event ID)
    return { main: raw };
  }
}

async function syncToCalcom(
  tenantData: any,
  booking: { name: string; email: string; start: string; end: string; notes: string }
) {
  const apiKey = tenantData.calcom_api_key || CALCOM_API_KEY;
  const eventTypeId = tenantData.calcom_event_type_id;
  if (!apiKey || !eventTypeId) return;

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

async function cancelCalcomBooking(tenantData: any, calcomBookingId: string) {
  const apiKey = tenantData?.calcom_api_key || CALCOM_API_KEY;
  if (!apiKey) return;

  const response = await fetch(`https://api.cal.com/v1/bookings/${calcomBookingId}/cancel?apiKey=${apiKey}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Cal.com cancel failed: ${response.status} - ${errText}`);
  }
}

async function sendBookingEmail(
  customerEmail: string, customerName: string, serviceType: string,
  bookingStart: Date, staffAssigned: string | undefined,
  confirmationNumber: string, businessName: string | undefined,
  isTestMode: boolean
): Promise<{ emailSent: boolean; emailRecipient: string }> {
  let emailSent = false;
  let emailRecipient = '';

  try {
    const formattedTime = bookingStart.toLocaleString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
    });

    const emailData = buildBookingConfirmationEmail({
      customer_email: customerEmail,
      customer_name: customerName,
      service_type: serviceType,
      formatted_time: formattedTime,
      staff_assigned: staffAssigned,
      confirmation_number: confirmationNumber,
      business_name: businessName,
    }, isTestMode);

    emailRecipient = emailData.to;

    const emailResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/email/send`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailData.to,
          subject: emailData.subject,
          html_content: emailData.html,
          plain_content: emailData.plain,
          variables: { customer_name: customerName, service_type: serviceType, formatted_time: formattedTime },
        }),
      }
    );

    emailSent = emailResponse.ok;
  } catch (err: any) {
    console.error('[Booking Sync] Email send failed:', err.message);
  }

  return { emailSent, emailRecipient };
}

// GET - Status endpoint
export async function GET() {
  return NextResponse.json({
    status: 'listening',
    endpoint: '/api/webhooks/booking-sync',
    accepts: ['booking.created', 'booking.updated', 'booking.cancelled'],
    sources: ['calcom', 'retell', 'manual', 'api'],
    features: {
      buffer_minutes: 15,
      google_calendar_buffer_events: true,
      event_title_format: '[TenantName] - CustomerName',
      reschedule: 'updates existing row',
      cancel: 'frees slot + deletes google calendar events',
    },
  });
}

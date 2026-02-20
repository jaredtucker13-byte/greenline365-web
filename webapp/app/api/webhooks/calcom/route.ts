import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/webhooks/calcom
 *
 * Handles Cal.com booking webhook events and writes to customer_journal table.
 * This is the auto-journal layer for calendar events — every booking, reschedule,
 * or cancellation gets logged so the AI agent knows the full customer timeline.
 *
 * Cal.com webhook events:
 * - BOOKING_CREATED  → customer_journal entry: "booking_created"
 * - BOOKING_RESCHEDULED → customer_journal entry: "booking_rescheduled"
 * - BOOKING_CANCELLED → customer_journal entry: "booking_cancelled"
 * - MEETING_ENDED → customer_journal entry: "meeting_completed"
 *
 * Configure in Cal.com: Settings > Developer > Webhooks
 * URL: https://www.greenline365.com/api/webhooks/calcom?tenant_id={tenant_uuid}
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CalcomWebhookPayload {
  triggerEvent: string;
  createdAt: string;
  payload: {
    uid?: string;
    title?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    status?: string;
    cancellationReason?: string;
    rescheduleReason?: string;
    attendees?: Array<{
      email: string;
      name: string;
      phone?: string;
      timeZone?: string;
    }>;
    organizer?: {
      email: string;
      name: string;
    };
    metadata?: Record<string, any>;
    responses?: {
      name?: string;
      email?: string;
      phone?: string;
      notes?: string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: CalcomWebhookPayload = await request.json();
    const tenantId = request.nextUrl.searchParams.get('tenant_id') || '';

    const { triggerEvent, payload } = body;

    console.log(`[Cal.com Webhook] Event: ${triggerEvent}, Tenant: ${tenantId}`);

    if (!triggerEvent || !payload) {
      return NextResponse.json({ received: true, message: 'No event to process' });
    }

    // Extract attendee info
    const attendee = payload.attendees?.[0] || {};
    const responses = payload.responses || {};
    const contactName = attendee.name || responses.name || '';
    const contactEmail = attendee.email || responses.email || '';
    const contactPhone = attendee.phone || responses.phone || '';

    // Map Cal.com event to journal event type
    const eventTypeMap: Record<string, string> = {
      'BOOKING_CREATED': 'booking_created',
      'BOOKING_RESCHEDULED': 'booking_rescheduled',
      'BOOKING_CANCELLED': 'booking_cancelled',
      'MEETING_ENDED': 'meeting_completed',
      'BOOKING_REQUESTED': 'booking_requested',
      'BOOKING_PAYMENT_INITIATED': 'payment_initiated',
    };

    const eventType = eventTypeMap[triggerEvent] || triggerEvent.toLowerCase();

    // Determine sentiment
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (['BOOKING_CREATED', 'BOOKING_REQUESTED'].includes(triggerEvent)) sentiment = 'positive';
    if (triggerEvent === 'BOOKING_CANCELLED') sentiment = 'negative';
    if (triggerEvent === 'MEETING_ENDED') sentiment = 'positive';

    // Determine importance
    let importance: 'low' | 'normal' | 'high' | 'critical' = 'normal';
    if (triggerEvent === 'BOOKING_CANCELLED') importance = 'high';

    // Generate human-readable summary
    const summary = generateSummary(triggerEvent, payload, contactName);

    // Write to customer_journal
    const { error } = await supabase.from('customer_journal').insert({
      tenant_id: tenantId || null,
      contact_phone: contactPhone,
      contact_email: contactEmail,
      contact_name: contactName,
      source: 'calcom',
      event_type: eventType,
      summary,
      raw_data: body,
      sentiment,
      importance,
    });

    if (error) {
      console.error('[Cal.com Webhook] Journal insert error:', error);
    }

    // Also try to find and update the matching booking in our bookings table
    if (payload.uid) {
      if (triggerEvent === 'BOOKING_CANCELLED') {
        await supabase
          .from('bookings')
          .update({
            status: 'cancelled',
            cancellation_reason: payload.cancellationReason || 'Cancelled via Cal.com',
            cancelled_at: new Date().toISOString(),
          })
          .eq('external_calendar_id', payload.uid);
      } else if (triggerEvent === 'BOOKING_RESCHEDULED') {
        await supabase
          .from('bookings')
          .update({
            start_time: payload.startTime,
            date: payload.startTime ? new Date(payload.startTime).toISOString().split('T')[0] : undefined,
            updated_at: new Date().toISOString(),
          })
          .eq('external_calendar_id', payload.uid);
      }
    }

    return NextResponse.json({
      received: true,
      event: triggerEvent,
      journaled: !error,
    });

  } catch (error: any) {
    console.error('[Cal.com Webhook] Error:', error);
    // Always return 200 to prevent Cal.com from retrying
    return NextResponse.json({
      received: true,
      error: error.message,
    });
  }
}

function generateSummary(
  triggerEvent: string,
  payload: CalcomWebhookPayload['payload'],
  contactName: string
): string {
  const name = contactName || 'Customer';
  const title = payload.title || 'appointment';

  const formatDateTime = (iso: string | undefined): string => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }) + ' at ' + d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return iso;
    }
  };

  switch (triggerEvent) {
    case 'BOOKING_CREATED':
      return `${name} booked "${title}" for ${formatDateTime(payload.startTime)}${payload.responses?.notes ? ` — notes: "${payload.responses.notes}"` : ''}`;

    case 'BOOKING_RESCHEDULED':
      return `${name} rescheduled "${title}" to ${formatDateTime(payload.startTime)}${payload.rescheduleReason ? ` — reason: "${payload.rescheduleReason}"` : ''}`;

    case 'BOOKING_CANCELLED':
      return `${name} cancelled "${title}"${payload.cancellationReason ? ` — reason: "${payload.cancellationReason}"` : ''}`;

    case 'MEETING_ENDED':
      return `${name} completed "${title}" appointment`;

    case 'BOOKING_REQUESTED':
      return `${name} requested "${title}" for ${formatDateTime(payload.startTime)} (pending confirmation)`;

    default:
      return `Cal.com event "${triggerEvent}" for ${name}: ${title}`;
  }
}

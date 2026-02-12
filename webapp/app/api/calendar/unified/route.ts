/**
 * Unified Calendar API
 * GET - Returns all calendar events from multiple sources:
 *   - Bookings (blue)
 *   - Scheduled Content (green)
 *   - Campaign Emails (amber)
 *   - Manual Events (purple)
 * 
 * POST - Create a manual calendar event
 * PATCH - Update an event
 * DELETE - Delete an event
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Color map for event types
const EVENT_COLORS: Record<string, string> = {
  booking: '#3B82F6',      // Blue
  content: '#10B981',      // Green
  campaign_email: '#F59E0B', // Amber
  newsletter: '#8B5CF6',   // Purple
  blog: '#EC4899',         // Pink
  custom: '#6366F1',       // Indigo
};

const EVENT_ICONS: Record<string, string> = {
  booking: 'calendar',
  content: 'edit',
  campaign_email: 'mail',
  newsletter: 'newspaper',
  blog: 'file-text',
  custom: 'flag',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const eventType = searchParams.get('type');

    const events: any[] = [];

    // 1. Fetch bookings
    if (!eventType || eventType === 'booking') {
      let bookingQuery = supabase
        .from('bookings')
        .select('id, full_name, email, phone, status, start_time, preferred_datetime, duration_minutes, service_id, notes, created_at')
        .order('created_at', { ascending: false })
        .limit(200);

      if (startDate) bookingQuery = bookingQuery.gte('preferred_datetime', startDate);
      if (endDate) bookingQuery = bookingQuery.lte('preferred_datetime', endDate);

      const { data: bookings } = await bookingQuery;
      for (const b of bookings || []) {
        const dt = b.start_time || b.preferred_datetime;
        if (!dt) continue;
        events.push({
          id: b.id,
          source: 'bookings',
          event_type: 'booking',
          title: `Booking: ${b.full_name}`,
          description: b.notes || '',
          start_time: dt,
          end_time: b.duration_minutes
            ? new Date(new Date(dt).getTime() + b.duration_minutes * 60000).toISOString()
            : null,
          color: EVENT_COLORS.booking,
          icon: EVENT_ICONS.booking,
          status: b.status,
          metadata: { email: b.email, phone: b.phone },
          editable: b.status !== 'completed',
        });
      }
    }

    // 2. Fetch scheduled content (blogs, newsletters, social posts)
    if (!eventType || ['content', 'blog', 'newsletter'].includes(eventType)) {
      let contentQuery = supabase
        .from('scheduled_content')
        .select('id, title, description, content_type, event_type, scheduled_date, status, color, metadata, created_at')
        .order('scheduled_date', { ascending: false })
        .limit(200);

      if (startDate) contentQuery = contentQuery.gte('scheduled_date', startDate);
      if (endDate) contentQuery = contentQuery.lte('scheduled_date', endDate);

      const { data: content } = await contentQuery;
      for (const c of content || []) {
        const type = c.content_type === 'blog' ? 'blog'
          : c.content_type === 'newsletter' ? 'newsletter'
          : 'content';
        events.push({
          id: c.id,
          source: 'scheduled_content',
          event_type: type,
          title: c.title || `${c.content_type} post`,
          description: c.description || '',
          start_time: c.scheduled_date,
          end_time: null,
          color: c.color || EVENT_COLORS[type],
          icon: EVENT_ICONS[type],
          status: c.status,
          metadata: c.metadata,
          editable: c.status === 'draft' || c.status === 'scheduled',
        });
      }
    }

    // 3. Fetch campaign emails (scheduled sends)
    if (!eventType || eventType === 'campaign_email') {
      let campaignQuery = supabase
        .from('email_campaigns')
        .select('id, name, description, status, scheduled_for, total_recipients, emails_sent, created_at')
        .not('scheduled_for', 'is', null)
        .order('scheduled_for', { ascending: false })
        .limit(100);

      if (startDate) campaignQuery = campaignQuery.gte('scheduled_for', startDate);
      if (endDate) campaignQuery = campaignQuery.lte('scheduled_for', endDate);

      const { data: campaigns } = await campaignQuery;
      for (const camp of campaigns || []) {
        events.push({
          id: camp.id,
          source: 'email_campaigns',
          event_type: 'campaign_email',
          title: `Campaign: ${camp.name}`,
          description: camp.description || `${camp.total_recipients} recipients`,
          start_time: camp.scheduled_for,
          end_time: null,
          color: EVENT_COLORS.campaign_email,
          icon: EVENT_ICONS.campaign_email,
          status: camp.status,
          metadata: { total_recipients: camp.total_recipients, emails_sent: camp.emails_sent },
          editable: camp.status === 'draft' || camp.status === 'scheduled',
        });
      }
    }

    // Sort all events by start_time
    events.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    return NextResponse.json({
      events,
      total: events.length,
      colors: EVENT_COLORS,
      icons: EVENT_ICONS,
    });
  } catch (error: any) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, event_type, scheduled_date, content_type, metadata, color, status } = body;

    if (!title || !scheduled_date) {
      return NextResponse.json({ error: 'Title and scheduled_date required' }, { status: 400 });
    }

    // Check if trying to create for a past date
    const eventDate = new Date(scheduled_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (eventDate < today) {
      return NextResponse.json({ error: 'Cannot create events for past dates' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('scheduled_content')
      .insert({
        title,
        description: description || '',
        content_type: content_type || 'photo',
        event_type: event_type || 'content',
        scheduled_date,
        status: status || 'draft',
        color: color || EVENT_COLORS[event_type || 'custom'],
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ event: data, success: true });
  } catch (error: any) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, source, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
    }

    // Route update to correct table based on source
    const table = source === 'bookings' ? 'bookings'
      : source === 'email_campaigns' ? 'email_campaigns'
      : 'scheduled_content';

    const updateData: any = { updated_at: new Date().toISOString() };
    if (updates.title) updateData.title = updates.title;
    if (updates.description) updateData.description = updates.description;
    if (updates.status) updateData.status = updates.status;
    if (updates.scheduled_date) {
      if (table === 'scheduled_content') updateData.scheduled_date = updates.scheduled_date;
      else if (table === 'bookings') updateData.preferred_datetime = updates.scheduled_date;
      else if (table === 'email_campaigns') updateData.scheduled_for = updates.scheduled_date;
    }
    if (updates.color) updateData.color = updates.color;

    const { error } = await supabase.from(table).update(updateData).eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const source = searchParams.get('source');

    if (!id) {
      return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
    }

    const table = source === 'bookings' ? 'bookings'
      : source === 'email_campaigns' ? 'email_campaigns'
      : 'scheduled_content';

    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

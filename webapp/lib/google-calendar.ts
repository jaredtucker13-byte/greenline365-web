/**
 * Google Calendar Integration
 *
 * Full CRUD + Free/Busy for Google Calendar.
 * Supports:
 *   - FreeBusy checks
 *   - Creating events with [TenantName] - CustomerName format
 *   - Creating separate buffer events (15-min travel/transition blocks)
 *   - Updating events (reschedules)
 *   - Deleting events (cancellations)
 *
 * Required env vars:
 *   GOOGLE_CALENDAR_CLIENT_EMAIL - Service account email
 *   GOOGLE_CALENDAR_PRIVATE_KEY  - Service account private key (PEM)
 *   GOOGLE_CALENDAR_ID           - Default calendar ID (or per-tenant from DB)
 */

interface FreeBusyResult {
  isFree: boolean;
  conflicts: Array<{ start: string; end: string }>;
  error?: string;
}

interface CalendarEvent {
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  attendees?: Array<{ email: string }>;
  colorId?: string;
}

interface CreateEventResult {
  success: boolean;
  eventId?: string;
  bufferBeforeEventId?: string;
  bufferAfterEventId?: string;
  error?: string;
}

async function getAccessToken(): Promise<string> {
  const clientEmail = process.env.GOOGLE_CALENDAR_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_CALENDAR_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('Google Calendar credentials not configured');
  }

  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const claimSet = btoa(JSON.stringify({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/calendar',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }));

  const encoder = new TextEncoder();
  const keyData = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');

  const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureInput = encoder.encode(`${header}.${claimSet}`);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, signatureInput);
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

  const jwt = `${header}.${claimSet}.${signatureBase64}`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenResponse.ok) {
    const errText = await tokenResponse.text();
    throw new Error(`Google auth failed: ${errText}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

/**
 * Check Google Calendar Free/Busy for a time range
 */
export async function checkFreeBusy(
  calendarId: string,
  startTime: string,
  endTime: string
): Promise<FreeBusyResult> {
  try {
    const accessToken = await getAccessToken();

    const response = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timeMin: startTime,
        timeMax: endTime,
        items: [{ id: calendarId }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Google Calendar] FreeBusy error:', errText);
      return { isFree: true, conflicts: [], error: `API error: ${response.status}` };
    }

    const data = await response.json();
    const busySlots = data.calendars?.[calendarId]?.busy || [];

    return {
      isFree: busySlots.length === 0,
      conflicts: busySlots.map((slot: any) => ({
        start: slot.start,
        end: slot.end,
      })),
    };
  } catch (error: any) {
    console.error('[Google Calendar] FreeBusy check failed:', error.message);
    return { isFree: true, conflicts: [], error: error.message };
  }
}

/**
 * Create an event on Google Calendar
 */
export async function createCalendarEvent(
  calendarId: string,
  event: CalendarEvent
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    const accessToken = await getAccessToken();

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, error: `API error: ${response.status} - ${errText}` };
    }

    const data = await response.json();
    return { success: true, eventId: data.id };
  } catch (error: any) {
    console.error('[Google Calendar] Create event failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Create a booking event WITH separate buffer events on Google Calendar.
 *
 * Creates up to 3 events:
 *   1. [Buffer Before] 15-min block before the appointment
 *   2. [Volt-Amps] - Marcus Sterling (the actual appointment)
 *   3. [Buffer After] 15-min block after the appointment
 */
export async function createBookingWithBuffers(
  calendarId: string,
  opts: {
    tenantName: string;
    customerName: string;
    serviceType: string;
    customerEmail: string;
    customerPhone?: string;
    confirmationNumber: string;
    startTime: Date;
    endTime: Date;
    bufferMinutes: number;
    source: string;
  }
): Promise<CreateEventResult> {
  try {
    const accessToken = await getAccessToken();
    const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    // 1. Create buffer-before event
    let bufferBeforeEventId: string | undefined;
    if (opts.bufferMinutes > 0) {
      const bufferBeforeStart = new Date(opts.startTime.getTime() - opts.bufferMinutes * 60000);
      const bufferBeforeResp = await fetch(baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          summary: `[Travel/Buffer] Before: ${opts.customerName}`,
          description: `${opts.bufferMinutes}-minute buffer before appointment.\nService: ${opts.serviceType}\nDo not book during this window.`,
          start: { dateTime: bufferBeforeStart.toISOString() },
          end: { dateTime: opts.startTime.toISOString() },
          colorId: '8', // Graphite gray for buffer events
          transparency: 'opaque',
        }),
      });
      if (bufferBeforeResp.ok) {
        const d = await bufferBeforeResp.json();
        bufferBeforeEventId = d.id;
      }
    }

    // 2. Create the main appointment event
    const mainResp = await fetch(baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        summary: `[${opts.tenantName}] - ${opts.customerName}`,
        description: [
          `Service: ${opts.serviceType}`,
          `Booked via: ${opts.source}`,
          `Email: ${opts.customerEmail}`,
          `Phone: ${opts.customerPhone || 'N/A'}`,
          `Confirmation: ${opts.confirmationNumber}`,
        ].join('\n'),
        start: { dateTime: opts.startTime.toISOString() },
        end: { dateTime: opts.endTime.toISOString() },
        colorId: '10', // Basil green for appointments
        transparency: 'opaque',
      }),
    });

    if (!mainResp.ok) {
      const errText = await mainResp.text();
      return { success: false, error: `Main event failed: ${mainResp.status} - ${errText}` };
    }

    const mainData = await mainResp.json();

    // 3. Create buffer-after event
    let bufferAfterEventId: string | undefined;
    if (opts.bufferMinutes > 0) {
      const bufferAfterEnd = new Date(opts.endTime.getTime() + opts.bufferMinutes * 60000);
      const bufferAfterResp = await fetch(baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          summary: `[Travel/Buffer] After: ${opts.customerName}`,
          description: `${opts.bufferMinutes}-minute buffer after appointment.\nService: ${opts.serviceType}\nDo not book during this window.`,
          start: { dateTime: opts.endTime.toISOString() },
          end: { dateTime: bufferAfterEnd.toISOString() },
          colorId: '8',
          transparency: 'opaque',
        }),
      });
      if (bufferAfterResp.ok) {
        const d = await bufferAfterResp.json();
        bufferAfterEventId = d.id;
      }
    }

    return {
      success: true,
      eventId: mainData.id,
      bufferBeforeEventId,
      bufferAfterEventId,
    };
  } catch (error: any) {
    console.error('[Google Calendar] Create booking with buffers failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Update an existing Google Calendar event (for reschedules)
 */
export async function updateCalendarEvent(
  calendarId: string,
  eventId: string,
  updates: Partial<CalendarEvent>
): Promise<{ success: boolean; error?: string }> {
  try {
    const accessToken = await getAccessToken();

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, error: `API error: ${response.status} - ${errText}` };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[Google Calendar] Update event failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a Google Calendar event (for cancellations)
 */
export async function deleteCalendarEvent(
  calendarId: string,
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const accessToken = await getAccessToken();

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // 204 No Content = success, 410 Gone = already deleted
    if (!response.ok && response.status !== 410) {
      const errText = await response.text();
      return { success: false, error: `API error: ${response.status} - ${errText}` };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[Google Calendar] Delete event failed:', error.message);
    return { success: false, error: error.message };
  }
}

export type { FreeBusyResult, CalendarEvent, CreateEventResult };

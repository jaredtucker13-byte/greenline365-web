/**
 * Google Calendar Free/Busy Integration
 *
 * Checks Google Calendar availability before confirming bookings.
 * Uses service account or OAuth2 credentials from environment variables.
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
}

async function getAccessToken(): Promise<string> {
  const clientEmail = process.env.GOOGLE_CALENDAR_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_CALENDAR_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('Google Calendar credentials not configured');
  }

  // Create JWT for service account
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const claimSet = btoa(JSON.stringify({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/calendar',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }));

  // Sign JWT with private key
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

  // Exchange JWT for access token
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
    // Fail open - if Google Cal is unreachable, allow the booking
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

export type { FreeBusyResult, CalendarEvent };

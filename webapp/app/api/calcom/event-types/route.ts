import { NextRequest, NextResponse } from 'next/server';

/**
 * Cal.com Event Types API
 * 
 * GET /api/calcom/event-types - List all event types
 * GET /api/calcom/event-types?id=123 - Get specific event type
 */

const CALCOM_API_KEY = process.env.CALCOM_API_KEY || '';
const CALCOM_API_URL = process.env.CALCOM_API_URL || 'https://api.cal.com/v2';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventTypeId = searchParams.get('id');
    
    if (!CALCOM_API_KEY) {
      return NextResponse.json({ 
        error: 'Cal.com API key not configured',
        setup_url: 'https://app.cal.com/settings/developer/api-keys'
      }, { status: 500 });
    }
    
    // Fetch event types from Cal.com
    const endpoint = eventTypeId 
      ? `${CALCOM_API_URL}/event-types/${eventTypeId}`
      : `${CALCOM_API_URL}/event-types`;
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CALCOM_API_KEY}`,
        'Content-Type': 'application/json',
        'cal-api-version': '2024-08-13'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Cal.com] API error:', response.status, errorText);
      return NextResponse.json({ 
        error: `Cal.com API error: ${response.status}`,
        details: errorText
      }, { status: response.status });
    }
    
    const data = await response.json();
    
    // Format the response for easy reading
    if (data.data && Array.isArray(data.data)) {
      const eventTypes = data.data.map((et: any) => ({
        id: et.id,
        title: et.title,
        slug: et.slug,
        description: et.description,
        length: et.length, // Duration in minutes
        locations: et.locations,
        schedulingType: et.schedulingType
      }));
      
      return NextResponse.json({
        success: true,
        count: eventTypes.length,
        event_types: eventTypes,
        instructions: "Use the 'id' field as CALCOM_EVENT_TYPE_ID in your .env.local"
      });
    }
    
    return NextResponse.json({
      success: true,
      data: data.data || data
    });
    
  } catch (error: any) {
    console.error('[Cal.com Event Types] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

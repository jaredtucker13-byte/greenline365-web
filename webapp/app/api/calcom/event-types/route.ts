import { NextRequest, NextResponse } from 'next/server';

/**
 * Cal.com Event Types API
 * 
 * GET /api/calcom/event-types - List all event types
 */

const CALCOM_API_KEY = process.env.CALCOM_API_KEY || '';

export async function GET(request: NextRequest) {
  try {
    if (!CALCOM_API_KEY) {
      return NextResponse.json({ 
        error: 'Cal.com API key not configured',
        setup_url: 'https://app.cal.com/settings/developer/api-keys'
      }, { status: 500 });
    }
    
    // Use v1 API for event types list
    const response = await fetch(`https://api.cal.com/v1/event-types?apiKey=${CALCOM_API_KEY}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
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
    if (data.event_types && Array.isArray(data.event_types)) {
      const eventTypes = data.event_types.map((et: any) => ({
        id: et.id,
        title: et.title,
        slug: et.slug,
        description: et.description,
        length: et.length, // Duration in minutes
        hidden: et.hidden
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
      data: data
    });
    
  } catch (error: any) {
    console.error('[Cal.com Event Types] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

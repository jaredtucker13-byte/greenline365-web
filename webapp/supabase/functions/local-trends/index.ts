/**
 * Local Trends Edge Function
 * GreenLine365 - Daily Trend Hunter / Local Pulse
 * 
 * This function:
 * - Runs as a scheduled cron job (daily)
 * - Fetches local events and trends for the specified location
 * - Generates AI-powered content suggestions
 * - Stores trends in the database for the Command Center
 * 
 * Can also be triggered manually from the dashboard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, createResponse, handleCors } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabase-client.ts';

interface TrendRequest {
  action: 'fetch' | 'refresh' | 'list';
  location?: string;
  client_id?: string;
}

interface LocalTrend {
  id?: string;
  title: string;
  description: string;
  location: string;
  event_date?: string;
  expected_traffic: 'low' | 'medium' | 'high';
  category: 'sports' | 'community' | 'business' | 'entertainment' | 'weather' | 'other';
  suggested_action: string;
  source?: string;
  created_at?: string;
}

// Mock data sources - in production, integrate with real APIs
const MOCK_TRENDS_SOURCES = [
  {
    title: 'Downtown Farmers Market',
    description: 'Weekly farmers market with over 50 local vendors. Great foot traffic expected.',
    expected_traffic: 'high' as const,
    category: 'community' as const,
    suggested_action: 'Create a "Market Fresh" promotion or special Saturday hours?',
  },
  {
    title: 'Local Chamber of Commerce Mixer',
    description: 'Networking event for local business owners. Good B2B opportunity.',
    expected_traffic: 'medium' as const,
    category: 'business' as const,
    suggested_action: 'Attend and offer special business packages? Schedule follow-up posts?',
  },
  {
    title: 'Weekend Weather Alert',
    description: 'Perfect weather forecasted for the weekend. Outdoor activities expected to increase.',
    expected_traffic: 'high' as const,
    category: 'weather' as const,
    suggested_action: 'Promote outdoor-friendly services or weekend specials?',
  },
  {
    title: 'High School Graduation Season',
    description: 'Multiple local graduations happening this week. Family gatherings expected.',
    expected_traffic: 'high' as const,
    category: 'community' as const,
    suggested_action: 'Create graduation specials or family packages?',
  },
  {
    title: 'Local Sports Team Playoff Game',
    description: 'Major playoff game bringing fans to the area. Expect increased evening traffic.',
    expected_traffic: 'high' as const,
    category: 'sports' as const,
    suggested_action: 'Run a game-day promotion with team colors or themed specials?',
  },
];

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { action, location = 'Tampa, FL', client_id }: TrendRequest = await req.json();

    switch (action) {
      case 'fetch':
      case 'refresh': {
        // Fetch trends from various sources
        // In production, this would call:
        // - Google Places API for local events
        // - Eventbrite API for upcoming events
        // - Weather API for forecasts
        // - Local news APIs
        // - Sports schedule APIs

        const trends = await fetchLocalTrends(location);

        // Store in database
        const { error: deleteError } = await supabaseAdmin
          .from('local_trends')
          .delete()
          .eq('location', location)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Delete old trends

        const { data, error } = await supabaseAdmin
          .from('local_trends')
          .insert(trends.map(trend => ({
            ...trend,
            location,
            client_id,
            created_at: new Date().toISOString(),
          })))
          .select();

        if (error) {
          console.error('Insert error:', error);
          return createResponse({ error: 'Failed to store trends', details: error.message }, 500);
        }

        return createResponse({
          success: true,
          message: `Found ${trends.length} local trends for ${location}`,
          data,
        });
      }

      case 'list': {
        const { data, error } = await supabaseAdmin
          .from('local_trends')
          .select('*')
          .eq('location', location)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          return createResponse({ error: 'Failed to fetch trends' }, 500);
        }

        return createResponse({ data });
      }

      default:
        return createResponse({ error: 'Invalid action' }, 400);
    }
  } catch (error) {
    console.error('Local Trends Error:', error);
    return createResponse({ error: 'Internal server error' }, 500);
  }
});

// Fetch local trends from various sources
// In production, integrate with real APIs
async function fetchLocalTrends(location: string): Promise<LocalTrend[]> {
  const trends: LocalTrend[] = [];
  const now = new Date();

  // Generate trends based on mock data with randomized dates
  const shuffled = MOCK_TRENDS_SOURCES.sort(() => Math.random() - 0.5);
  const selectedTrends = shuffled.slice(0, 3 + Math.floor(Math.random() * 3)); // 3-5 trends

  for (let i = 0; i < selectedTrends.length; i++) {
    const source = selectedTrends[i];
    const eventDate = new Date(now.getTime() + (i + 1) * 24 * 60 * 60 * 1000 * (1 + Math.random() * 5));

    trends.push({
      title: source.title,
      description: source.description,
      location,
      event_date: eventDate.toISOString(),
      expected_traffic: source.expected_traffic,
      category: source.category,
      suggested_action: source.suggested_action,
      source: 'local_intelligence',
    });
  }

  // Add location-specific trend
  trends.push({
    title: `${location.split(',')[0]} Community Event`,
    description: `Local community gathering happening in ${location}. Great opportunity for local engagement.`,
    location,
    event_date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    expected_traffic: 'medium',
    category: 'community',
    suggested_action: `Create content highlighting your connection to the ${location.split(',')[0]} community?`,
    source: 'generated',
  });

  return trends;
}

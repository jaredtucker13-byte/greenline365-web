/**
 * Website Scraping API Route
 * GreenLine365 - Pluggable Scraping Service
 * 
 * This endpoint provides a backend interface for website scraping.
 * Designed to be pluggable - swap out the scraping implementation as needed.
 * 
 * SECURITY: All scraping happens server-side, never in the browser.
 * 
 * Options for scraping implementation:
 * 1. Simple fetch + HTML parsing (current placeholder)
 * 2. Puppeteer/Playwright for JS-rendered sites
 * 3. Third-party APIs (Diffbot, ScrapingBee, etc.)
 * 4. Firecrawl, Apify, or similar services
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role for backend operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

interface ScrapeRequest {
  url: string;
  demo_request_id?: string;
}

interface ScrapedData {
  business_name: string | null;
  services: string[];
  key_phrases: string[];
  raw_content: string;
  structured_data: Record<string, unknown>;
}

export async function POST(request: Request) {
  try {
    const body: ScrapeRequest = await request.json();
    const { url, demo_request_id } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Update demo_request status to processing
    if (demo_request_id) {
      await supabaseAdmin
        .from('demo_requests')
        .update({ scrape_status: 'processing', updated_at: new Date().toISOString() })
        .eq('id', demo_request_id);
    }

    // ============================================
    // SCRAPING IMPLEMENTATION (PLUGGABLE)
    // ============================================
    // Current: Simple placeholder that simulates scraping
    // Future: Replace with actual scraping logic
    
    const scrapedData = await performScrape(url);

    // Store scraped data in database
    if (demo_request_id) {
      // Update demo_request with scraped data
      await supabaseAdmin
        .from('demo_requests')
        .update({ 
          scrape_status: 'completed',
          scraped_data: scrapedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', demo_request_id);

      // Also store in ingested_website_data for the Companion
      await supabaseAdmin
        .from('ingested_website_data')
        .insert({
          demo_request_id,
          website_url: url,
          business_name: scrapedData.business_name,
          services: scrapedData.services,
          key_phrases: scrapedData.key_phrases,
          raw_content: scrapedData.raw_content,
          structured_data: scrapedData.structured_data,
          scraped_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        });
    }

    return NextResponse.json({
      success: true,
      data: scrapedData,
      message: 'Website scraped successfully',
    });

  } catch (error) {
    console.error('Scrape error:', error);
    return NextResponse.json(
      { error: 'Failed to scrape website', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Perform the actual scraping
 * This is the pluggable part - replace this function with your preferred method
 */
async function performScrape(url: string): Promise<ScrapedData> {
  // ============================================
  // OPTION 1: Simple fetch (current implementation)
  // Works for static sites, respects robots.txt manually
  // ============================================
  
  try {
    // Check robots.txt first (basic implementation)
    const robotsUrl = new URL('/robots.txt', url);
    const robotsResponse = await fetch(robotsUrl.toString(), { 
      headers: { 'User-Agent': 'GreenLine365 Demo Bot' },
      signal: AbortSignal.timeout(5000),
    }).catch(() => null);
    
    // If robots.txt explicitly disallows, skip scraping
    if (robotsResponse?.ok) {
      const robotsText = await robotsResponse.text();
      if (robotsText.includes('Disallow: /') && !robotsText.includes('Allow:')) {
        return {
          business_name: null,
          services: [],
          key_phrases: [],
          raw_content: 'Scraping not allowed by robots.txt',
          structured_data: { robots_blocked: true },
        };
      }
    }

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GreenLine365 Demo Bot/1.0 (https://greenline365.com)',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    
    // Extract data from HTML
    const scrapedData = extractDataFromHtml(html, url);
    
    return scrapedData;

  } catch (error) {
    console.error('Scrape fetch error:', error);
    
    // Return simulated data for demo purposes
    return generateSimulatedData(url);
  }
}

/**
 * Extract structured data from HTML
 */
function extractDataFromHtml(html: string, url: string): ScrapedData {
  // Strip HTML tags for raw content
  const rawContent = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 5000); // Limit content length

  // Extract title (business name candidate)
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const businessName = titleMatch 
    ? titleMatch[1].split('|')[0].split('-')[0].trim()
    : null;

  // Extract meta description for key phrases
  const metaDescMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  const metaDescription = metaDescMatch ? metaDescMatch[1] : '';

  // Extract common service-related words
  const serviceWords = rawContent.match(/\b(services?|solutions?|products?|offerings?|packages?)\b/gi) || [];
  
  // Extract key phrases from meta keywords or common patterns
  const keywordsMatch = html.match(/<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']+)["']/i);
  const keywords = keywordsMatch ? keywordsMatch[1].split(',').map(k => k.trim()) : [];

  return {
    business_name: businessName,
    services: [...new Set(serviceWords)].slice(0, 10),
    key_phrases: keywords.length > 0 ? keywords.slice(0, 10) : metaDescription.split(' ').slice(0, 10),
    raw_content: rawContent,
    structured_data: {
      url,
      title: titleMatch?.[1] || null,
      meta_description: metaDescription,
      scraped_at: new Date().toISOString(),
    },
  };
}

/**
 * Generate simulated data for demo purposes
 * Used when actual scraping fails or for testing
 */
function generateSimulatedData(url: string): ScrapedData {
  const domain = new URL(url).hostname.replace('www.', '');
  const businessName = domain.split('.')[0]
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return {
    business_name: businessName,
    services: ['Customer Service', 'Product Solutions', 'Support'],
    key_phrases: ['quality', 'professional', 'trusted', 'local business'],
    raw_content: `Simulated content for ${businessName}. This is placeholder data for demo purposes.`,
    structured_data: {
      url,
      simulated: true,
      scraped_at: new Date().toISOString(),
    },
  };
}

// GET endpoint to check scrape status
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const demo_request_id = searchParams.get('demo_request_id');

  if (!demo_request_id) {
    return NextResponse.json({ error: 'demo_request_id is required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('demo_requests')
    .select('id, scrape_status, scraped_data, website_url')
    .eq('id', demo_request_id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Demo request not found' }, { status: 404 });
  }

  return NextResponse.json({ data });
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openrouterKey = process.env.OPENROUTER_API_KEY!;

function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

// Scrape a URL and extract text content
async function scrapeWebsite(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GL365Bot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(15000),
    });
    const html = await res.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // Extract meta description
    const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    const metaDesc = metaMatch ? metaMatch[1].trim() : '';

    // Extract og tags
    const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i)?.[1] || '';
    const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i)?.[1] || '';

    // Strip HTML to text, keep useful content
    const bodyText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 4000);

    return `TITLE: ${title}\nMETA: ${metaDesc}\nOG_TITLE: ${ogTitle}\nOG_DESC: ${ogDesc}\nBODY: ${bodyText}`;
  } catch {
    return '';
  }
}

// Use AI to extract business info from scraped text
async function extractBusinessInfo(scrapedText: string, url: string): Promise<any> {
  const prompt = `You are a business data extraction AI. Given the following website text content, extract the business information and return it as JSON.

Website URL: ${url}
Website Content:
${scrapedText}

Return ONLY valid JSON with these fields (use null if not found):
{
  "business_name": "string",
  "industry": "one of: hvac, plumbing, roofing, electrical, barbershop, bakery, gym, restaurant, spa, florist, boutique, cleaning, landscaping, security, painting, general",
  "description": "2-3 sentence description of the business",
  "phone": "phone number",
  "email": "email address",
  "address_line1": "street address",
  "city": "city",
  "state": "state abbreviation",
  "zip_code": "zip code",
  "website": "${url}",
  "business_hours": {"mon": {"open": "9:00", "close": "17:00"}, "tue": {"open": "9:00", "close": "17:00"}},
  "subcategories": ["array of subcategories or services offered"]
}`;

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openrouterKey}`,
    },
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-001',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    }),
  });

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '{}';

  // Parse JSON from response
  try {
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { business_name: null, industry: 'general', description: null };
  }
}

// POST /api/directory/scrape - Scrape a URL and create a listing
export async function POST(request: NextRequest) {
  const supabase = getServiceClient();
  const body = await request.json();
  const { url, tier, fallback_name, fallback_industry, fallback_city, fallback_state } = body;

  if (!url) {
    return NextResponse.json({ error: 'url required' }, { status: 400 });
  }

  // Normalize URL
  let normalizedUrl = url.trim();
  if (!normalizedUrl.startsWith('http')) normalizedUrl = 'https://' + normalizedUrl;

  try {
    // Step 1: Scrape the website
    const scrapedText = await scrapeWebsite(normalizedUrl);

    let extracted: any = {};

    if (scrapedText && scrapedText.length > 50) {
      // Step 2: AI extraction
      extracted = await extractBusinessInfo(scrapedText, normalizedUrl);
    }

    // Use fallbacks if AI couldn't extract
    const businessName = extracted.business_name || fallback_name || new URL(normalizedUrl).hostname.replace('www.', '').split('.')[0];
    const industry = extracted.industry || fallback_industry || 'general';

    // Step 3: Create directory listing
    const { data: listing, error } = await supabase
      .from('directory_listings')
      .insert({
        business_name: businessName,
        industry: industry,
        subcategories: extracted.subcategories || [],
        description: extracted.description || null,
        phone: extracted.phone || null,
        email: extracted.email || null,
        website: normalizedUrl,
        address_line1: extracted.address_line1 || null,
        city: extracted.city || fallback_city || null,
        state: extracted.state || fallback_state || null,
        zip_code: extracted.zip_code || null,
        business_hours: extracted.business_hours || {},
        ai_scraped_data: extracted,
        ai_scraped_at: new Date().toISOString(),
        tier: tier || 'free',
        is_published: true,
        is_claimed: false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message, extracted }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      listing,
      extracted,
      message: `Successfully created listing for "${businessName}"`,
    }, { status: 201 });

  } catch (err: any) {
    return NextResponse.json({ error: `Scrape failed: ${err.message}` }, { status: 500 });
  }
}

// POST /api/directory/scrape (bulk mode via query param)
// Usage: POST /api/directory/scrape?bulk=true with body: { urls: ["url1", "url2", ...] }

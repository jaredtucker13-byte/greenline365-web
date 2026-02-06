import { NextRequest, NextResponse } from 'next/server';

// POST /api/directory/scrape/bulk - Process multiple URLs
// Body: { urls: ["https://example.com", ...], tier: "free" }
// Returns results for each URL (success or error)
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { urls, tier } = body;

  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({ error: 'urls array required' }, { status: 400 });
  }

  if (urls.length > 100) {
    return NextResponse.json({ error: 'Maximum 100 URLs per batch' }, { status: 400 });
  }

  const baseUrl = request.nextUrl.origin;
  const results: any[] = [];
  let successCount = 0;
  let errorCount = 0;

  // Process URLs sequentially to avoid rate limiting
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i].trim();
    if (!url) continue;

    try {
      const res = await fetch(`${baseUrl}/api/directory/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, tier: tier || 'free' }),
      });

      const data = await res.json();

      if (res.ok) {
        successCount++;
        results.push({ url, status: 'success', business_name: data.listing?.business_name, id: data.listing?.id });
      } else {
        errorCount++;
        results.push({ url, status: 'error', error: data.error });
      }
    } catch (err: any) {
      errorCount++;
      results.push({ url, status: 'error', error: err.message });
    }

    // Small delay between requests to be polite
    if (i < urls.length - 1) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  return NextResponse.json({
    total: urls.length,
    success: successCount,
    errors: errorCount,
    results,
  });
}
